import { Card } from '@/components/features/SimulationsResults/Card';
import { PageHero } from '@/components/shared/PageHero';
import { useSimulationStorage } from '@/hooks/useSimulationStorage';
import { calcMonthlySavings } from '@/utils/simulation';
import { CalendarClock, CreditCardIcon, Goal, Landmark, PiggyBank, Wallet } from 'lucide-react';
import { useParams } from 'react-router-dom';

export function SimulationResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { getFormData } = useSimulationStorage();

  const data = id ? getFormData(id) : null;
  if (!data) {
    return <p>Simulação não encontrada. </p>;
  }
  const monthlySavings = calcMonthlySavings(data);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHero
        title="Resultado da sua simulação"
        subtitle=" Com base no seu perfil financeiro e objetivos."
      />
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card icon={Goal} label="Custo da Meta" value={data.goalAmount} subtitle={data.goalName} />

        <Card
          icon={CalendarClock}
          label="Prazo"
          value={`${data.goalDeadline} meses`}
          subtitle={'Prazo para atingir a meta'}
        />
        <Card
          variant="primary"
          icon={PiggyBank}
          label="Economia mensal"
          value={`R$ ${monthlySavings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumSignificantDigits: 2 })} meses`}
          subtitle={'Economia mensal necessária'}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="bg-card order-2 rounded-2xl p-6 shadow-[4px_4px_18px_0px_rgba(0,0,0,0.2)] lg:order-1 lg:col-span-2">
          Painel de Insights
        </div>

        <div className="bg-card order-1 rounded-2xl p-6 shadow-[4px_4px_18px_0px_rgba(0,0,0,0.2)] lg:order-2">
          <h2 className="mb-4 text-2xl font-bold">Resumo das suas finanças</h2>

          <Card
            compact
            icon={Wallet}
            label="Renda mensal"
            value={data.income}
            subtitle="Renda total bruta por mês"
          />

          <Card
            compact
            icon={CreditCardIcon}
            label="Custos Fixos de Vida"
            value={data.expenses}
            subtitle="Gastos essenciais por mês"
          />

          <Card
            compact
            icon={Landmark}
            label="Dívidas / Parcelas"
            value={data.debts}
            subtitle="Valor comprometido em parcelas/depósitos"
          />
        </div>
      </div>
    </main>
  );
}
