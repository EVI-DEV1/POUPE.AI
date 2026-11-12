import { describe, expect, it } from 'vitest';

import type { Goal, PlanningData } from '@/data/finance';
import type { SimulationRecord } from '@/data/simulation';
import { currentSimulation, legacySimulation, mixedSimulationData } from '@/test/fixtures';

import { buildNotifications, compareNotifications, type AppNotification } from './notifications';
import { readSimulations } from './simulationRecords';

const EMPTY_PLANNING: PlanningData = { currentBalance: null, balanceUpdatedAt: null, months: [] };

const goal = (overrides: Partial<Goal>): Goal => ({
  id: 'g1',
  name: 'Reserva',
  category: 'emergency',
  targetAmount: 1000,
  savedAmount: 0,
  deadline: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  contributions: [],
  ...overrides,
});

const ids = (list: AppNotification[]) => list.map((n) => n.id);

describe('buildNotifications — regressão do TypeError em localeCompare', () => {
  it('não quebra com simulação antiga sem createdAt (cenário do bug)', () => {
    const simulations = readSimulations([legacySimulation('legacy-1')]);
    const goals = [goal({ id: 'done', savedAmount: 1000 })];

    expect(() => buildNotifications(goals, simulations, EMPTY_PLANNING)).not.toThrow();
    const result = buildNotifications(goals, simulations, EMPTY_PLANNING);
    const legacy = result.find((n) => n.id === 'simulation-unfeasible-legacy-1');
    expect(legacy).toBeDefined();
    // Sem data inventada: a notificação existe, mas sem data.
    expect(legacy?.date).toBeNull();
  });

  it('não quebra com várias simulações antigas misturadas às atuais', () => {
    const simulations = readSimulations(mixedSimulationData());
    expect(() => buildNotifications([], simulations, EMPTY_PLANNING)).not.toThrow();
  });

  it('trata createdAt nulo, numérico ou inválido sem inventar datas', () => {
    const simulations = readSimulations([
      currentSimulation('null-date', null),
      currentSimulation('bad-date', 'não é data'),
      currentSimulation('numeric-date', 1717000000000),
    ]);
    const result = buildNotifications([], simulations, EMPTY_PLANNING);
    const fromSimulations = result.filter((n) => n.id.startsWith('simulation-'));

    expect(fromSimulations).toHaveLength(3);
    fromSimulations.forEach((n) => expect(n.date).toBeNull());
  });

  it('trata meta concluída sem updatedAt (null)', () => {
    const result = buildNotifications(
      [goal({ id: 'done', savedAmount: 1000, updatedAt: null })],
      [],
      EMPTY_PLANNING
    );
    expect(result.find((n) => n.id === 'goal-completed-done')?.date).toBeNull();
  });

  it('ignora saldo com data inválida em vez de quebrar', () => {
    const planning: PlanningData = {
      currentBalance: 500,
      balanceUpdatedAt: 'data inválida',
      months: [],
    };
    expect(() => buildNotifications([goal({})], [], planning)).not.toThrow();
    const result = buildNotifications([goal({})], [], planning);
    expect(result.some((n) => n.id.startsWith('balance-stale-'))).toBe(false);
  });

  it('é robusta mesmo se um registro sem data chegar sem passar pela validação', () => {
    const unvalidated = [
      { ...legacySimulation('a'), createdAt: undefined },
      { ...legacySimulation('b'), createdAt: null },
      currentSimulation('c', '2026-10-01T00:00:00.000Z'),
    ] as unknown as SimulationRecord[];
    expect(() => buildNotifications([], unvalidated, EMPTY_PLANNING)).not.toThrow();
  });
});

describe('buildNotifications — ordenação determinística', () => {
  it('ordena por data (mais recente primeiro) e deixa itens sem data no fim', () => {
    const simulations = readSimulations([
      legacySimulation('legacy-1'),
      currentSimulation('old', '2026-03-01T00:00:00.000Z'),
      currentSimulation('new', '2026-10-01T00:00:00.000Z'),
    ]);
    const result = buildNotifications([], simulations, EMPTY_PLANNING);
    const simulationIds = ids(result).filter((id) => id.startsWith('simulation-'));

    expect(simulationIds).toEqual([
      'simulation-unfeasible-new',
      'simulation-unfeasible-old',
      'simulation-unfeasible-legacy-1',
    ]);
    // Nenhum item com data aparece depois de um item sem data.
    const firstUndated = result.findIndex((n) => n.date === null);
    expect(result.slice(firstUndated).every((n) => n.date === null)).toBe(true);
  });

  it('produz a mesma ordem independentemente da ordem de entrada', () => {
    const raw = mixedSimulationData();
    const goals = [
      goal({ id: 'done-a', savedAmount: 1000, updatedAt: null }),
      goal({ id: 'done-b', savedAmount: 1000, updatedAt: null }),
      goal({ id: 'done-c', savedAmount: 1000 }),
    ];
    const forward = buildNotifications(goals, readSimulations(raw), EMPTY_PLANNING);
    const reversed = buildNotifications(
      [...goals].reverse(),
      readSimulations([...raw].reverse()),
      EMPTY_PLANNING
    );

    // Os itens sem data das metas desempatam pelo ID.
    const goalIds = (list: AppNotification[]) => ids(list).filter((id) => id.startsWith('goal-'));
    expect(goalIds(forward)).toEqual(goalIds(reversed));
    expect(goalIds(forward)).toEqual([
      'goal-completed-done-c',
      'goal-completed-done-a',
      'goal-completed-done-b',
    ]);
  });

  it('o comparador é total: empates e datas ausentes nunca lançam erro', () => {
    const base = { title: '', description: '', to: '/', tone: 'info' as const };
    const list: AppNotification[] = [
      { ...base, id: 'b', date: null },
      { ...base, id: 'a', date: null },
      { ...base, id: 'c', date: '2026-01-01' },
      { ...base, id: 'd', date: '2026-01-01' },
    ];
    expect(ids([...list].sort(compareNotifications))).toEqual(['c', 'd', 'a', 'b']);
  });
});
