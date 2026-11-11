import { ChartNoAxesCombined, Goal, PiggyBank, Wallet } from 'lucide-react';
import { lazy, Suspense } from 'react';

import { DreamBanner } from '@/components/features/Dashboard/DreamBanner';
import { FinancialHealthCard } from '@/components/features/Dashboard/FinancialHealthCard';
import {
  FinancialStatCard,
  type StatDelta,
} from '@/components/features/Dashboard/FinancialStatCard';
import { RecentSimulations } from '@/components/features/Dashboard/RecentSimulations';
import { WelcomeBanner } from '@/components/features/Dashboard/WelcomeBanner';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFinancialOverview } from '@/hooks/useFinancialOverview';
import { goalProgress } from '@/utils/finance';
import { formatBRL, formatDate, formatDecimal, formatPercent } from '@/utils/format';

// O gráfico (Recharts) é o maior pacote do app: carregado sob demanda.
const FinancialEvolutionChart = lazy(() =>
  import('@/components/features/Dashboard/FinancialEvolutionChart').then((m) => ({
    default: m.FinancialEvolutionChart,
  }))
);

function ChartSkeleton() {
  return (
    <div className="surface flex min-h-[279px] flex-col gap-4 p-6" role="status">
      <span className="sr-only">Carregando gráfico…</span>
      <div className="bg-skeleton-base h-5 w-56 animate-pulse rounded-full" />
      <div className="bg-skeleton-base/60 flex-1 animate-pulse rounded-xl" />
    </div>
  );
}

export function DashboardPage() {
  const { profile, planning, simulations, snapshot, health, featuredGoal, buildContext } =
    useFinancialOverview();

  // Só sinaliza a origem quando os números vêm de uma simulação (não de dados reais do mês).
  const sourceNote =
    snapshot?.source === 'simulation' ? `Base: simulação “${snapshot.sourceLabel}”` : null;

  let savingsDelta: StatDelta | null = null;
  let rateDelta: StatDelta | null = null;

  if (snapshot?.previous) {
    const { savings: prev, savingsRate: prevRate } = snapshot.previous;
    if (prev !== 0) {
      const change = (snapshot.savings - prev) / Math.abs(prev);
      savingsDelta = {
        label: `${change >= 0 ? '+' : ''}${formatPercent(change)}`,
        positive: change >= 0,
      };
    }
    if (prevRate !== null && snapshot.savingsRate !== null) {
      const pp = (snapshot.savingsRate - prevRate) * 100;
      rateDelta = {
        label: `${pp >= 0 ? '+' : ''}${formatDecimal(pp)} p.p.`,
        positive: pp >= 0,
        pill: true,
      };
    }
  }

  const noFinancialData = {
    message: 'Informe receitas e despesas do mês.',
    actionLabel: 'Cadastrar',
    to: '/planejamento?novo=1',
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <WelcomeBanner userName={profile.name} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[1.22fr_1.2fr_1.32fr_1fr]">
        <FinancialStatCard
          icon={Wallet}
          label="Saldo atual"
          value={planning.currentBalance !== null ? formatBRL(planning.currentBalance) : undefined}
          footnote={
            planning.balanceUpdatedAt
              ? `Atualizado em ${formatDate(planning.balanceUpdatedAt)}`
              : null
          }
          empty={
            planning.currentBalance === null
              ? {
                  message: 'Você ainda não informou seu saldo.',
                  actionLabel: 'Informar saldo',
                  to: '/planejamento#saldo',
                }
              : undefined
          }
        />

        <FinancialStatCard
          icon={PiggyBank}
          label="Economia mensal"
          value={snapshot ? formatBRL(snapshot.savings) : undefined}
          delta={savingsDelta}
          footnote={sourceNote}
          empty={snapshot ? undefined : noFinancialData}
        />

        <FinancialStatCard
          icon={Goal}
          label="Meta em andamento"
          title={featuredGoal?.name}
          empty={
            featuredGoal
              ? undefined
              : {
                  message: 'Nenhuma meta cadastrada.',
                  actionLabel: 'Criar meta',
                  to: '/metas?nova=1',
                }
          }
        >
          {featuredGoal && (
            <>
              <p className="text-foreground/90 mt-1 truncate text-sm tabular-nums">
                {formatBRL(featuredGoal.savedAmount)} / {formatBRL(featuredGoal.targetAmount)}
              </p>
              <div className="mt-2.5 flex items-center gap-3">
                <ProgressBar
                  value={goalProgress(featuredGoal)}
                  label={`Progresso da meta ${featuredGoal.name}`}
                />
                <span className="text-sm font-medium tabular-nums">
                  {Math.round(goalProgress(featuredGoal) * 100)}%
                </span>
              </div>
            </>
          )}
        </FinancialStatCard>

        <FinancialStatCard
          icon={ChartNoAxesCombined}
          label="Taxa de economia"
          value={snapshot?.savingsRate != null ? formatPercent(snapshot.savingsRate) : undefined}
          delta={rateDelta}
          footnote={rateDelta ? null : sourceNote}
          empty={snapshot?.savingsRate != null ? undefined : noFinancialData}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.33fr_1fr]">
        <Suspense fallback={<ChartSkeleton />}>
          <FinancialEvolutionChart months={planning.months} simulations={simulations} />
        </Suspense>
        <FinancialHealthCard health={health} snapshot={snapshot} buildContext={buildContext} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.24fr_1fr]">
        <RecentSimulations simulations={simulations} />
        <DreamBanner className="min-h-[220px]" />
      </div>
    </div>
  );
}
