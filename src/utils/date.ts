/**
 * Converte uma data ISO (ou `YYYY-MM-DD`) em timestamp.
 *
 * Retorna `null` para valores ausentes, nulos, de outro tipo ou com formato
 * inválido — nunca inventa uma data. Datas sem horário são interpretadas ao
 * meio-dia local, mesmo critério de `formatDate`.
 */
export function toTimestamp(value: unknown): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const time = new Date(value.length === 10 ? `${value}T12:00:00` : value).getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * Comparador "mais recente primeiro" para timestamps opcionais.
 * Itens sem data válida vão para o fim; empates retornam 0 para que o
 * chamador aplique um critério de desempate estável.
 */
export function compareByRecency(a: number | null, b: number | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}
