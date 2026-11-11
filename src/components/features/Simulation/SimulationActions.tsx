import { Eye, Pencil, Sparkles, Target, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ActionMenu } from '@/components/ui/ActionMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { buildSimulationQuestion } from '@/data/assistantPrompt';
import type { SimulationRecord } from '@/data/simulation';
import { useSimulationStorage } from '@/hooks/useSimulationStorage';

interface SimulationActionsProps {
  simulation: SimulationRecord;
}

export function SimulationActions({ simulation }: SimulationActionsProps) {
  const navigate = useNavigate();
  const { deleteSimulation } = useSimulationStorage();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <ActionMenu
        label={`Ações da simulação ${simulation.goalName}`}
        items={[
          {
            label: 'Visualizar',
            icon: Eye,
            onSelect: () => void navigate(`/resultado/${simulation.id}`),
          },
          {
            label: 'Editar',
            icon: Pencil,
            onSelect: () => void navigate(`/simulacoes/${simulation.id}/editar`),
          },
          {
            label: 'Analisar com IA',
            icon: Sparkles,
            onSelect: () =>
              void navigate(`/chat?q=${encodeURIComponent(buildSimulationQuestion(simulation))}`),
          },
          {
            label: 'Transformar em meta',
            icon: Target,
            onSelect: () => void navigate(`/metas?nova=1&simulacao=${simulation.id}`),
          },
          {
            label: 'Excluir',
            icon: Trash2,
            danger: true,
            onSelect: () => setConfirmOpen(true),
          },
        ]}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Excluir simulação?"
        description={`A simulação “${simulation.goalName}”, o diagnóstico da IA e a conversa associada serão removidos deste navegador. Essa ação não pode ser desfeita.`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          deleteSimulation(simulation.id);
        }}
      />
    </>
  );
}
