import { describe, expect, it } from 'vitest';

import { currentSimulation, legacySimulation, mixedSimulationData } from '@/test/fixtures';

import { compareByRecency, toTimestamp } from './date';
import { readSimulations, sortSimulationsByRecency, toSimulationRecord } from './simulationRecords';

describe('toTimestamp', () => {
  it('aceita ISO e YYYY-MM-DD', () => {
    expect(toTimestamp('2026-10-01T10:00:00.000Z')).toBe(Date.parse('2026-10-01T10:00:00.000Z'));
    expect(toTimestamp('2026-10-01')).not.toBeNull();
  });

  it.each([undefined, null, '', '   ', 'abc', 123, {}, []])('retorna null para %j', (value) => {
    expect(toTimestamp(value)).toBeNull();
  });

  it('compareByRecency deixa nulos no fim', () => {
    expect([null, 1, null, 3, 2].sort(compareByRecency)).toEqual([3, 2, 1, null, null]);
  });
});

describe('readSimulations — compatibilidade com registros antigos', () => {
  it('mantém registros antigos sem createdAt', () => {
    const [record] = readSimulations([legacySimulation('legacy-1')]);
    expect(record.id).toBe('legacy-1');
    expect(record.createdAt).toBeUndefined();
  });

  it('omite createdAt que não seja texto, sem inventar data', () => {
    const [nullDate, numericDate] = readSimulations([
      currentSimulation('n', null),
      currentSimulation('x', 1717000000000),
    ]);
    expect('createdAt' in nullDate).toBe(false);
    expect('createdAt' in numericDate).toBe(false);
  });

  it('exclui da visão apenas o que não pode ser exibido', () => {
    const ids = readSimulations(mixedSimulationData()).map((s) => s.id);
    expect(ids).toEqual([
      'legacy-1',
      'legacy-2',
      'recent-1',
      'null-date',
      'bad-date',
      'numeric-date',
      'recent-2',
    ]);
    expect(toSimulationRecord({ id: 'sem-campos' })).toBeNull();
    expect(toSimulationRecord(null)).toBeNull();
    expect(toSimulationRecord({ ...legacySimulation('x'), goalName: undefined })).toBeNull();
  });

  it('não altera o array bruto e devolve referência estável', () => {
    const raw = mixedSimulationData();
    const snapshot = JSON.stringify(raw);
    expect(readSimulations(raw)).toBe(readSimulations(raw));
    expect(JSON.stringify(raw)).toBe(snapshot);
  });
});

describe('sortSimulationsByRecency', () => {
  it('datadas primeiro; sem data no fim, das mais novas (gravadas depois) às mais antigas', () => {
    const sorted = sortSimulationsByRecency(readSimulations(mixedSimulationData()));
    expect(sorted.map((s) => s.id)).toEqual([
      'recent-2',
      'recent-1',
      'numeric-date',
      'bad-date',
      'null-date',
      'legacy-2',
      'legacy-1',
    ]);
  });

  it('não modifica a lista recebida', () => {
    const list = readSimulations(mixedSimulationData());
    const before = list.map((s) => s.id);
    sortSimulationsByRecency(list);
    expect(list.map((s) => s.id)).toEqual(before);
  });
});
