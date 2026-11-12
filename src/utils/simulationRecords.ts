import type { SimulationFormData, SimulationRecord } from '@/data/simulation';

import { compareByRecency, toTimestamp } from './date';

/** Campos obrigatórios do formulário — o `Record` garante que a lista fique completa. */
const FORM_FIELDS: Record<keyof SimulationFormData, true> = {
  income: true,
  expenses: true,
  debts: true,
  goalName: true,
  goalAmount: true,
  goalDeadline: true,
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Valida um item bruto de `simulation-data`.
 *
 * - Registros sem `id` ou sem os campos do formulário não podem ser exibidos nem
 *   calculados: ficam fora da visão (`null`), mas continuam no localStorage.
 * - `createdAt` é opcional: as primeiras versões do app salvavam simulações sem
 *   ele. Quando existe mas não é texto, é omitido da visão — nenhuma data é
 *   inventada.
 */
export function toSimulationRecord(value: unknown): SimulationRecord | null {
  if (!isObject(value) || typeof value.id !== 'string' || value.id === '') return null;

  for (const field of Object.keys(FORM_FIELDS)) {
    if (typeof value[field] !== 'string') return null;
  }

  if (value.createdAt === undefined || typeof value.createdAt === 'string') {
    return value as SimulationRecord;
  }

  const copy = { ...value };
  delete copy.createdAt;
  return copy as SimulationRecord;
}

const cache = new WeakMap<readonly unknown[], SimulationRecord[]>();

/**
 * Visão validada do histórico. Memoizada pela referência do array bruto, então
 * o resultado é estável entre renders enquanto o storage não muda.
 */
export function readSimulations(raw: readonly unknown[]): SimulationRecord[] {
  const cached = cache.get(raw);
  if (cached) return cached;

  const list = raw
    .map(toSimulationRecord)
    .filter((record): record is SimulationRecord => record !== null);
  cache.set(raw, list);
  return list;
}

/**
 * Ordena da mais recente para a mais antiga sem nunca lançar erro.
 *
 * Simulações sem data válida (registros antigos) vão para o fim. Empates — e
 * registros sem data entre si — seguem a ordem inversa de gravação, já que o
 * app sempre anexa novas simulações ao final da lista.
 */
export function sortSimulationsByRecency(list: readonly SimulationRecord[]): SimulationRecord[] {
  return list
    .map((simulation, index) => ({ simulation, index, time: toTimestamp(simulation.createdAt) }))
    .sort((a, b) => compareByRecency(a.time, b.time) || b.index - a.index)
    .map(({ simulation }) => simulation);
}
