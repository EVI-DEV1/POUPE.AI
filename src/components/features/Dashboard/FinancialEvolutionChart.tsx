import { ChartLine } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { buttonClasses } from '@/components/ui/buttonStyles';
import { EmptyState } from '@/components/ui/EmptyState';
import type { MonthEntry } from '@/data/finance';
import type { SimulationRecord } from '@/data/simulation';
import { parseCurrency } from '@/utils/currency';
import { getMonthTotals } from '@/utils/finance';
import { formatBRL, formatMonthLong, formatMonthShort } from '@/utils/format';
import { sortSimulationsByRecency } from '@/utils/simulationRecords';

type Period = 3 | 6 | 12 | 0;
type Source = 'planning' | 'simulations';

interface ChartPoint {
  key: string;
  label: string;
  fullLabel: string;
  income: number;
  expenses: number;
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 3, label: '3M' },
  { value: 6, label: '6M' },
  { value: 12, label: '12M' },
  { value: 0, label: 'Tudo' },
];

const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const INCOME_COLOR = '#A855F7';
const EXPENSE_COLOR = '#EC4899';

interface TooltipProps {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
}

function ChartTooltip({ active, payload }: TooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-xl border border-[#a855f7]/50 bg-[#141a3a]/95 px-4 py-3 text-sm text-white shadow-[0_0_24px_-6px_rgba(168,85,247,0.8)] backdrop-blur">
      <p className="mb-1 font-medium">{point.fullLabel}</p>
      <p className="text-white/90">
        Receita: <span className="font-semibold tabular-nums">{formatBRL(point.income)}</span>
      </p>
      <p className="text-[#f9a8d4]">
        Despesa: <span className="font-semibold tabular-nums">{formatBRL(point.expenses)}</span>
      </p>
    </div>
  );
}

interface FinancialEvolutionChartProps {
  months: MonthEntry[];
  simulations: SimulationRecord[];
  title?: string;
  className?: string;
}

export function FinancialEvolutionChart({
  months,
  simulations,
  title = 'Evolução das suas finanças',
  className = '',
}: FinancialEvolutionChartProps) {
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const hasPlanning = months.length > 0;
  const hasSimulations = simulations.length > 0;
  const [period, setPeriod] = useState<Period>(6);
  const [preferredSource, setSource] = useState<Source>('planning');
  const source: Source = hasPlanning ? preferredSource : 'simulations';

  const data = useMemo<ChartPoint[]>(() => {
    if (source === 'planning') {
      const sorted = [...months].sort((a, b) => a.month.localeCompare(b.month));
      const sliced = period ? sorted.slice(-period) : sorted;
      const spansYears = new Set(sliced.map((m) => m.month.slice(0, 4))).size > 1;
      return sliced.map((m) => ({
        key: m.id,
        label: formatMonthShort(m.month, spansYears),
        fullLabel: formatMonthLong(m.month),
        income: m.income,
        expenses: getMonthTotals(m).totalExpenses,
      }));
    }

    // Ordem cronológica (mais antiga → mais recente).
    const sorted = sortSimulationsByRecency(simulations).reverse();
    const sliced = period ? sorted.slice(-period) : sorted;
    return sliced.map((s) => ({
      key: s.id,
      label: s.goalName.length > 10 ? `${s.goalName.slice(0, 9)}…` : s.goalName,
      fullLabel: `Simulação: ${s.goalName}`,
      income: parseCurrency(s.income),
      expenses: parseCurrency(s.expenses) + parseCurrency(s.debts),
    }));
  }, [source, months, simulations, period]);

  const empty = !hasPlanning && !hasSimulations;

  return (
    <section
      aria-labelledby={`${gradientId}-title`}
      className={`surface flex flex-col p-5 sm:p-6 ${className}`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 id={`${gradientId}-title`} className="text-lg font-semibold sm:text-xl">
          {title}
        </h2>

        {!empty && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: INCOME_COLOR }} />
              Receitas
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: EXPENSE_COLOR }} />
              Despesas
            </span>
          </div>
        )}
      </div>

      {empty ? (
        <EmptyState
          icon={ChartLine}
          title="Sem dados para o gráfico ainda"
          description="Registre receitas e despesas de cada mês no Planejamento para acompanhar sua evolução."
          action={
            <Link to="/planejamento?novo=1" className={buttonClasses('primary', 'sm')}>
              Registrar mês
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {hasPlanning && hasSimulations && (
              <div
                role="group"
                aria-label="Fonte dos dados"
                className="bg-input border-border flex rounded-lg border p-0.5 text-xs"
              >
                {(['planning', 'simulations'] as Source[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={source === s}
                    onClick={() => setSource(s)}
                    className={`rounded-md px-2.5 py-1 font-medium transition ${source === s ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {s === 'planning' ? 'Planejamento' : 'Simulações'}
                  </button>
                ))}
              </div>
            )}
            <div
              role="group"
              aria-label="Período"
              className="bg-input border-border flex rounded-lg border p-0.5 text-xs"
            >
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={period === p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`rounded-md px-2.5 py-1 font-medium transition ${period === p.value ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {source === 'simulations' && (
              <span className="text-warning bg-warning-soft rounded-md px-2 py-1 text-[0.7rem] font-medium">
                Cenários das simulações — não são movimentações reais
              </span>
            )}
          </div>

          <div
            className="h-[172px] min-h-[160px] w-full flex-1"
            role="img"
            aria-label={`Gráfico de receitas e despesas: ${data.map((d) => `${d.fullLabel}, receita ${formatBRL(d.income)}, despesa ${formatBRL(d.expenses)}`).join('; ')}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 12, left: -6, bottom: 0 }}>
                <defs>
                  <linearGradient id={`${gradientId}-income`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={INCOME_COLOR} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={INCOME_COLOR} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id={`${gradientId}-expense`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--foreground)', fontSize: 13 }}
                  dy={8}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tick={{ fill: 'var(--foreground)', fontSize: 13 }}
                  tickFormatter={(v: number) => v.toLocaleString('pt-BR')}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: 'rgba(168,85,247,0.5)', strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Receitas"
                  stroke={INCOME_COLOR}
                  strokeWidth={2.5}
                  fill={`url(#${gradientId}-income)`}
                  dot={{ r: 3.5, fill: INCOME_COLOR, stroke: INCOME_COLOR }}
                  activeDot={{ r: 6, fill: INCOME_COLOR, stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={900}
                  isAnimationActive={!reduceMotion}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Despesas"
                  stroke={EXPENSE_COLOR}
                  strokeWidth={2.5}
                  fill={`url(#${gradientId}-expense)`}
                  dot={{ r: 3.5, fill: EXPENSE_COLOR, stroke: EXPENSE_COLOR }}
                  activeDot={{ r: 6, fill: EXPENSE_COLOR, stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={900}
                  isAnimationActive={!reduceMotion}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
