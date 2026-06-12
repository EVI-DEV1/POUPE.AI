import { PageHero } from '@/components/shared/PageHero';
import type { SimulationRecord } from '@/data/simulation';
import { useSimulationStorage } from '@/hooks/useSimulationStorage';
import { calcRequiredMonthlySavings, calcMonthlySavings,} from '@/utils/simulation';
import { Goal, Trash2, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SimulationHistoryPage() {
  const navigate = useNavigate();

  const { getAllSimulations, deleteSimulation } =
    useSimulationStorage();

  const [simulations, setSimulations] = useState<
    SimulationRecord[]
  >([]);

  useEffect(() => {
    setSimulations(getAllSimulations());
  }, []);

  const handleDelete = (id: string) => {
    deleteSimulation(id);

    setSimulations((prev) =>
      prev.filter((simulation) => simulation.id !== id),
    );
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHero
        title="Histórico de Simulações"
        subtitle="Acompanhe o histórico dos seus planos financeiros."
      />

      <div className="space-y-4">
        {simulations.map((simulation) => {
        const requiredMonthlySavings =
        calcRequiredMonthlySavings(simulation);
         const monthlySavings =
         calcMonthlySavings(simulation);

          return (
            <div
              key={simulation.id}
              className="bg-card rounded-2xl p-6 shadow-[4px_4px_18px_0px_rgba(0,0,0,0.2)]"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <Goal
                    size={32}
                    className="text-primary"
                  />

                  <div>
                    <h2 className="text-xl font-bold">
                      {simulation.goalName}
                    </h2>

                    <p className="text-muted-foreground text-sm">
                      {new Date(
                        simulation.createdAt,
                      ).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div>
  <p className="text-muted-foreground text-xs uppercase">
    Capacidade de Economia
  </p>

              <p className="font-semibold">
                 R${' '}
                   {monthlySavings.toLocaleString('pt-BR', {
                 minimumFractionDigits: 2,
              maximumFractionDigits: 2,
                   })}
            </p>
              </div>

                <div>
                  <p className="text-muted-foreground text-xs uppercase">
                    Custo da Meta
                  </p>

                  <p className="font-semibold">
                    R$ {simulation.goalAmount}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground text-xs uppercase">
                    Prazo
                  </p>

                  <p className="font-semibold">
                    {simulation.goalDeadline} meses
                  </p>
                </div>

                <div>
                 <p className="text-muted-foreground text-xs uppercase">
                     Economia Necessária
               </p>

                  <p className="font-semibold">
                    R${' '}
                       {requiredMonthlySavings.toLocaleString(
                         'pt-BR',
                      {
                        minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                      },
                    )}
                  </p>
                </div>

                <div className="bg-border h-10 w-px mr-1 gap-4" />

                <div className="flex gap-8">
                  <button
                    onClick={() =>
                      handleDelete(simulation.id)
                    }
                    
                  >
                    <Trash2 size={18}
                  className="text-red-600"
                   color="#ef4444" />

                  </button>

                  <button
                    onClick={() =>
                      navigate(
                        `/resultado/${simulation.id}`,
                      )
                    }
                   className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-foreground"
                  >
                    
                    <ExternalLink size={16} />
                    Ver detalhes
                    
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}