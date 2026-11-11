import {
  ArrowLeft,
  CalendarClock,
  CreditCardIcon,
  Goal,
  Landmark,
  Pencil,
  PiggyBank,
  Target,
  Wallet,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { AIInsightsCard } from '@/components/features/SimulationsResults/AIInsightCardProps';
import { Card } from '@/components/features/SimulationsResults/Card';
import { PageHero } from '@/components/shared/PageHero';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useSimulations } from '@/hooks/useSimulationStorage';
import { getSimulationStatus } from '@/utils/finance';
import { formatBRL } from '@/utils/format';
import { calcMonthlySavings, calcRequiredMonthlySavings } from '@/utils/simulation';

export function SimulationResultsPage() {
  const { id } = useParams<{ id: string }>();
  const simulations = useSimulations();

  const data = simulations.find((s) => s.id === id);

  if (!data) {
    return (
      <div className="surface mx-auto mt-10 max-w-md p-8 text-center">
        <p className="font-semibold">Simulação não encontrada.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Ela pode ter sido excluída ou criada em outro navegador.
        </p>
        <Link to="/historico" className={buttonClasses('primary', 'md', 'mt-5')}>
          Ir para o histórico
        </Link>
      </div>
    );
  }

  const monthlySavings = calcMonthlySavings(data);
  const requiredMonthlySavings = calcRequiredMonthlySavings(data);

  return (
    <div className="mx-auto w-full max-w-[1400px] py-2">
      <Link
        to="/historico"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft size={16} /> Histórico
      </Link>

      <PageHero
        title="Resultado da sua simulação"
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            “{data.goalName}” — com base no seu perfil financeiro e objetivos.
            <StatusBadge status={getSimulationStatus(data)} />
          </span>
        }
        actions={
          <>
            <Link to={`/simulacoes/${data.id}/editar`} className={buttonClasses('secondary', 'md')}>
              <Pencil size={16} aria-hidden /> Editar
            </Link>
            <Link
              to={`/metas?nova=1&simulacao=${data.id}`}
              className={buttonClasses('primary', 'md')}
            >
              <Target size={16} aria-hidden /> Transformar em meta
            </Link>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card icon={Goal} label="Meta" value={`R$ ${data.goalAmount}`} subtitle={data.goalName} />

        <Card
          icon={CalendarClock}
          label="Prazo"
          value={`${data.goalDeadline} meses`}
          subtitle="Prazo escolhido"
        />

        <Card
          variant="primary"
          icon={PiggyBank}
          label="Capacidade de Economia"
          value={formatBRL(monthlySavings)}
          subtitle="Disponível por mês"
        />

        <Card
          icon={Goal}
          label="Economia Necessária"
          value={formatBRL(requiredMonthlySavings)}
          subtitle="Valor necessário para atingir a meta"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AIInsightsCard key={data.id} simulationId={data.id} />

        <section
          className="surface order-first p-5 sm:p-6 lg:order-2"
          aria-labelledby="summary-title"
        >
          <h2 id="summary-title" className="mb-2 text-xl font-semibold">
            Resumo das suas finanças
          </h2>

          <Card
            compact
            icon={Wallet}
            label="Renda mensal"
            value={`R$ ${data.income}`}
            subtitle="Renda total bruta por mês"
          />

          <Card
            compact
            icon={CreditCardIcon}
            label="Custos Fixos de Vida"
            value={`R$ ${data.expenses}`}
            subtitle="Gastos essenciais por mês"
          />

          <Card
            compact
            icon={Landmark}
            label="Dívidas / Parcelas"
            value={`R$ ${data.debts}`}
            subtitle="Valor comprometido em parcelas/depósitos"
          />
        </section>
      </div>
    </div>
  );
}
