const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompact = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export const formatBRL = (value: number) => brl.format(Number.isFinite(value) ? value : 0);

export const formatCompactNumber = (value: number) => brlCompact.format(value);

export const formatPercent = (ratio: number) => `${decimal.format(ratio * 100)}%`;

export const formatDecimal = (value: number) => decimal.format(value);

/** Data no formato pt-BR, ou `''` quando ausente/inválida (nunca lança erro). */
export const formatDate = (iso: string | null | undefined) => {
  if (typeof iso !== 'string' || iso === '') return '';
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR');
};

const MONTHS_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];
const MONTHS_LONG = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** "2026-06" → "Jun" (ou "Jun/26" quando `withYear`). */
export const formatMonthShort = (month: string, withYear = false) => {
  const [year, m] = month.split('-').map(Number);
  const label = MONTHS_SHORT[(m || 1) - 1] ?? month;
  return withYear ? `${label}/${String(year).slice(2)}` : label;
};

/** "2026-06" → "junho de 2026". */
export const formatMonthLong = (month: string) => {
  const [year, m] = month.split('-').map(Number);
  return `${MONTHS_LONG[(m || 1) - 1] ?? month} de ${year}`;
};

export const currentMonthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/** Converte número em string no formato da máscara usada nos formulários ("1.234,56"). */
export const toMaskedCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
