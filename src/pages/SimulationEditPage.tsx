import { Info } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { SimulationForm } from '@/components/features/Simulation/Form';
import { SimulationHero } from '@/components/features/Simulation/Hero';
import { buttonClasses } from '@/components/ui/buttonStyles';
import type { SimulationFormData, SimulationRecord } from '@/data/simulation';
import { useSimulationStorage } from '@/hooks/useSimulationStorage';

export function SimulationEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getFormData, updateSimulation } = useSimulationStorage();
  const simulation = id ? getFormData(id) : null;

  if (!simulation) {
    return (
      <div className="surface mx-auto mt-10 max-w-md p-8 text-center">
        <p className="font-semibold">Simulação não encontrada.</p>
        <Link to="/historico" className={buttonClasses('primary', 'md', 'mt-4')}>
          Ir para o histórico
        </Link>
      </div>
    );
  }

  const { goalName, goalAmount, goalDeadline, income, expenses, debts } = simulation;
  const initialData: SimulationFormData = {
    income,
    expenses,
    debts,
    goalName,
    goalAmount,
    goalDeadline,
  };

  const handleComplete = (data: SimulationFormData) => {
    const changed = (Object.keys(initialData) as (keyof SimulationFormData)[]).some(
      (key) => initialData[key] !== data[key]
    );

    const updated = { ...simulation, ...data } as SimulationRecord;
    // Valores alterados → o diagnóstico antigo não vale mais e será gerado de novo.
    if (changed) delete updated.insight;

    updateSimulation(simulation.id, updated);
    void navigate(`/resultado/${simulation.id}`);
  };

  return (
    <div className="mx-auto max-w-xl py-6 sm:py-10">
      <SimulationHero title="Editar simulação" subtitle={`Ajuste os dados de “${goalName}”.`} />
      <p className="bg-muted-primary text-foreground/90 mb-5 flex gap-2 rounded-xl p-3 text-sm">
        <Info size={18} className="text-primary-glow mt-0.5 shrink-0" aria-hidden />
        Se algum valor mudar, o diagnóstico da IA será gerado novamente. A conversa com a IA é
        mantida.
      </p>
      <SimulationForm
        initialData={initialData}
        onComplete={handleComplete}
        submitLabel="Salvar alterações"
      />
    </div>
  );
}
