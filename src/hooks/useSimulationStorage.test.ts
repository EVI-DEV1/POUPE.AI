import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  currentSimulation,
  legacySimulation,
  mixedSimulationData,
  stubLocalStorage,
} from '@/test/fixtures';

import { useSimulationStorage } from './useSimulationStorage';

const KEY = 'simulation-data';
// O hook só devolve a API imperativa (sem estado do React), seguro de chamar fora de componente.
// eslint-disable-next-line react-hooks/rules-of-hooks
const storage = () => useSimulationStorage();

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('simulation-data — nada é apagado do localStorage', () => {
  it('lê registros antigos sem alterar o que está gravado', () => {
    const ls = stubLocalStorage({ [KEY]: mixedSimulationData() });
    const before = ls.raw(KEY);

    expect(storage().getAllSimulations()).toHaveLength(7);
    expect(ls.raw(KEY)).toBe(before);
  });

  it('salvar uma nova simulação preserva registros antigos e inválidos', () => {
    const ls = stubLocalStorage({ [KEY]: mixedSimulationData() });
    const id = storage().saveFormData(legacySimulation('novo'));

    const saved = ls.json(KEY) as unknown[];
    expect(saved).toHaveLength(mixedSimulationData().length + 1);
    expect(saved.slice(0, -1)).toEqual(mixedSimulationData());
    expect((saved.at(-1) as { id: string; createdAt: string }).id).toBe(id);
    expect(typeof (saved.at(-1) as { createdAt: string }).createdAt).toBe('string');
  });

  it('atualizar um registro antigo não inventa createdAt nem descarta os demais', () => {
    const ls = stubLocalStorage({ [KEY]: mixedSimulationData() });
    const api = storage();
    const legacy = api.getFormData('legacy-1');
    expect(legacy).not.toBeNull();

    api.updateSimulation('legacy-1', Object.assign({}, legacy!, { goalName: 'Viagem editada' }));

    const saved = ls.json(KEY) as Record<string, unknown>[];
    expect(saved).toHaveLength(mixedSimulationData().length);
    expect(saved[0]).toEqual({
      ...legacySimulation('legacy-1', 'Viagem'),
      goalName: 'Viagem editada',
    });
    expect('createdAt' in saved[0]).toBe(false);
    expect(saved.slice(1)).toEqual(mixedSimulationData().slice(1));
  });

  it('atualizar preserva o createdAt original, mesmo quando inválido', () => {
    const ls = stubLocalStorage({ [KEY]: [currentSimulation('numeric-date', 1717000000000)] });
    const api = storage();
    api.updateSimulation(
      'numeric-date',
      Object.assign({}, api.getFormData('numeric-date')!, { goalName: 'X' })
    );

    expect((ls.json(KEY) as Record<string, unknown>[])[0].createdAt).toBe(1717000000000);
  });

  it('excluir remove só o registro pedido', () => {
    const ls = stubLocalStorage({ [KEY]: mixedSimulationData() });
    storage().deleteSimulation('legacy-2');

    const saved = ls.json(KEY) as unknown[];
    expect(saved).toEqual(mixedSimulationData().filter((_, index) => index !== 1));
  });
});
