import { Calculator, ExternalLink, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { SimulationActions } from '@/components/features/Simulation/SimulationActions';
import { PageHero } from '@/components/shared/PageHero';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useSimulations } from '@/hooks/useSimulationStorage';
import { GOAL_CATEGORIES, inferCategory } from '@/utils/categories';
import { type FeasibilityStatus, getSimulationStatus } from '@/utils/finance';
import { formatBRL, formatDate } from '@/utils/format';
import { calcMonthlySavings, calcRequiredMonthlySavings } from '@/utils/simulation';
import { sortSimulationsByRecency } from '@/utils/simulationRecords';

type StatusFilter = 'all' | FeasibilityStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'viable', label: 'Viáveis' },
  { value: 'needs_adjustment', label: 'Atenção' },
  { value: 'unfeasible', label: 'Inviáveis' },
];

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-[0.7rem] font-semibold uppercase tracking-wider">
        {label}
      </p>
      <p className="truncate font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function SimulationHistoryPage() {
  const simulations = useSimulations();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const items = useMemo(
    () =>
      sortSimulationsByRecency(simulations)
        .map((simulation) => ({ simulation, status: getSimulationStatus(simulation) }))
        .filter(
          ({ simulation, status: s }) =>
            (status === 'all' || s === status) &&
            simulation.goalName.toLowerCase().includes(query.trim().toLowerCase())
        ),
    [simulations, query, status]
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] py-2">
      <PageHero
        title="Histórico de Simulações"
        subtitle="Acompanhe o histórico dos seus planos financeiros."
        actions={
          <Link to="/simulacoes" className={buttonClasses('primary', 'md')}>
            <Calculator size={16} aria-hidden /> Nova simulação
          </Link>
        }
      />

      {simulations.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={Calculator}
            title="Seu histórico está vazio"
            description="Cada simulação que você fizer fica salva aqui, neste navegador."
            action={
              <Link to="/simulacoes" className={buttonClasses('primary', 'sm')}>
                Fazer a primeira simulação
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:max-w-xs sm:flex-1">
              <Search
                size={16}
                className="text-muted-foreground pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden
              />
              <label htmlFor="history-search" className="sr-only">
                Filtrar por nome
              </label>
              <input
                id="history-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar por nome..."
                className="field h-11 pl-10"
              />
            </div>
            <div role="group" aria-label="Filtrar por status" className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={status === f.value}
                  onClick={() => setStatus(f.value)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${status === f.value ? 'border-primary-glow bg-muted-primary text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-muted-foreground surface p-8 text-center text-sm" role="status">
              Nenhuma simulação corresponde aos filtros.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map(({ simulation, status: s }) => {
                const category = GOAL_CATEGORIES[inferCategory(simulation.goalName)];
                const Icon = category.icon;
                return (
                  <li
                    key={simulation.id}
                    className="surface hover:border-border-strong p-4 transition sm:p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="flex min-w-0 items-center gap-3 lg:w-[280px] lg:shrink-0">
                        <span className="icon-tile h-11 w-11">
                          <Icon size={22} aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-semibold">{simulation.goalName}</h2>
                          <p className="text-muted-foreground text-sm">
                            {[formatDate(simulation.createdAt), category.label]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                        </div>
                      </div>

                      <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                        <Metric
                          label="Capacidade de economia"
                          value={formatBRL(calcMonthlySavings(simulation))}
                        />
                        <Metric label="Custo da meta" value={`R$ ${simulation.goalAmount}`} />
                        <Metric label="Prazo" value={`${simulation.goalDeadline} meses`} />
                        <Metric
                          label="Economia necessária"
                          value={formatBRL(calcRequiredMonthlySavings(simulation))}
                        />
                      </div>

                      <div className="flex items-center gap-2 lg:justify-end">
                        <StatusBadge status={s} />
                        <Link
                          to={`/resultado/${simulation.id}`}
                          className={buttonClasses(
                            'secondary',
                            'sm',
                            'rounded-full! ml-auto lg:ml-2'
                          )}
                        >
                          <ExternalLink size={14} aria-hidden /> Ver detalhes
                        </Link>
                        <SimulationActions simulation={simulation} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
