import { vi } from 'vitest';

import { profileKey, SESSION_KEY, USERS_KEY, type DemoUser } from '@/auth/session';

export const TEST_USER_ID = 'perfil-teste';

/** Perfil demonstrativo de teste (o registro de senha não é usado nesses testes). */
export const testUser = (id = TEST_USER_ID): DemoUser => ({
  id,
  name: `Perfil ${id}`,
  email: `${id}@exemplo.com`,
  password: { algorithm: 'PBKDF2-SHA256', iterations: 1, salt: 'AA==', hash: 'AA==' },
  createdAt: '2026-11-01T00:00:00.000Z',
});

/** Entradas do localStorage para um perfil com sessão ativa e os dados informados. */
export const activeProfileStorage = (
  profileData: Record<string, unknown> = {},
  id = TEST_USER_ID
): Record<string, unknown> => ({
  [USERS_KEY]: [testUser(id)],
  [SESSION_KEY]: { userId: id, startedAt: '2026-11-01T00:00:00.000Z' },
  ...Object.fromEntries(
    Object.entries(profileData).map(([base, value]) => [profileKey(id, base), value])
  ),
});

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
