import { ArrowRight, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';

import { SimulationActions } from '@/components/features/Simulation/SimulationActions';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { SimulationRecord } from '@/data/simulation';
import { GOAL_CATEGORIES, inferCategory } from '@/utils/categories';
import { getSimulationStatus } from '@/utils/finance';
import { formatBRL } from '@/utils/format';
import { calcRequiredMonthlySavings } from '@/utils/simulation';
import { sortSimulationsByRecency } from '@/utils/simulationRecords';

interface RecentSimulationsProps {
  simulations: SimulationRecord[];
  limit?: number;
  className?: string;
}

export function SimulationRow({ simulation }: { simulation: SimulationRecord }) {
  const category = GOAL_CATEGORIES[inferCategory(simulation.goalName)];
  const Icon = category.icon;
  const monthly = calcRequiredMonthlySavings(simulation);

  return (
    <li className="border-border/80 bg-card-elevated/60 hover:border-border-strong flex items-center gap-3 rounded-xl border px-3 py-2.5 transition sm:gap-4 sm:px-3.5">
      <span className="border-border bg-input text-foreground/90 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border">
        <Icon size={22} aria-hidden />
      </span>
      <Link to={`/resultado/${simulation.id}`} className="min-w-0 flex-1 rounded-md">
        <p className="truncate text-[0.95rem] font-semibold">{simulation.goalName}</p>
        <p className="text-muted-foreground truncate text-[0.8rem] tabular-nums">
          {Number.isFinite(monthly) ? `${formatBRL(monthly)}/mês` : `R$ ${simulation.goalAmount}`} •
          Em {simulation.goalDeadline} meses
          <span className="hidden sm:inline"> • {category.label}</span>
        </p>
      </Link>
      <StatusBadge status={getSimulationStatus(simulation)} />
      <span className="bg-border hidden h-8 w-px sm:block" aria-hidden />
      <SimulationActions simulation={simulation} />
    </li>
  );
}

export function RecentSimulations({
  simulations,
  limit = 3,
  className = '',
}: RecentSimulationsProps) {
  const recent = sortSimulationsByRecency(simulations).slice(0, limit);

  return (
    <section aria-labelledby="recent-title" className={`surface p-5 sm:p-6 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="recent-title" className="text-lg font-semibold sm:text-xl">
          Últimas simulações
        </h2>
        <Link
          to="/historico"
          className="text-primary-glow flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          Ver histórico <ArrowRight size={16} aria-hidden />
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          compact
          icon={Calculator}
          title="Nenhuma simulação ainda"
          description="Simule uma meta para ver se ela cabe no seu orçamento."
          action={
            <Link to="/simulacoes" className={buttonClasses('primary', 'sm')}>
              Nova simulação
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {recent.map((simulation) => (
            <SimulationRow key={simulation.id} simulation={simulation} />
          ))}
        </ul>
      )}
    </section>
  );
}
