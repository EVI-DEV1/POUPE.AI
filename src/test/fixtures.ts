import { vi } from 'vitest';

/** localStorage em memória para testes que passam pelos stores reais. */
export function stubLocalStorage(initial: Record<string, unknown> = {}) {
  const data = new Map<string, string>(
    Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)])
  );
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, String(value)),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    get length() {
      return data.size;
    },
  };
  vi.stubGlobal('localStorage', storage);
  return {
    raw: (key: string) => data.get(key) ?? null,
    json: (key: string): unknown => JSON.parse(data.get(key) ?? 'null'),
  };
}

/** Formato gravado pelas primeiras versões do app: sem `createdAt`. */
export const legacySimulation = (id: string, goalName = `Meta ${id}`) => ({
  income: '3.000,00',
  expenses: '2.500,00',
  debts: '400,00',
  goalName,
  goalAmount: '20.000,00',
  goalDeadline: '12',
  id,
});

/** Formato atual (com `createdAt`). */
export const currentSimulation = (id: string, createdAt: unknown, goalName = `Meta ${id}`) => ({
  ...legacySimulation(id, goalName),
  createdAt,
});

/** Mistura real do `simulation-data` de quem usa o app desde a primeira versão. */
export const mixedSimulationData = () => [
  legacySimulation('legacy-1', 'Viagem'),
  legacySimulation('legacy-2', 'Notebook'),
  currentSimulation('recent-1', '2026-10-01T10:00:00.000Z', 'Carro'),
  currentSimulation('null-date', null, 'Casa'),
  currentSimulation('bad-date', 'não é data', 'Moto'),
  currentSimulation('numeric-date', 1717000000000, 'Curso'),
  null,
  'registro corrompido',
  { id: 'sem-campos' },
  currentSimulation('recent-2', '2026-11-05T10:00:00.000Z', 'Reforma'),
];
