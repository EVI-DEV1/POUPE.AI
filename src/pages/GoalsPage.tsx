import { Plus, Target } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ContributionDialog } from '@/components/features/Goals/ContributionDialog';
import { GoalFormDialog, type GoalPrefill } from '@/components/features/Goals/GoalFormDialog';
import { GoalsProgressCard } from '@/components/features/Goals/GoalsProgressCard';
import { PageHero } from '@/components/shared/PageHero';
import { AIResponseDialog } from '@/components/ui/AIResponseDialog';
import { UIButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildGoalAdvicePrompt } from '@/data/assistantPrompt';
import type { Goal } from '@/data/finance';
import { useFinancialOverview } from '@/hooks/useFinancialOverview';
import { goalsActions, type GoalInput } from '@/stores';
import { inferCategory } from '@/utils/categories';
import { parseCurrency } from '@/utils/currency';
import { isGoalCompleted } from '@/utils/finance';
import { formatBRL } from '@/utils/format';

function addMonths(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

export function GoalsPage() {
  const { goals, simulations, buildContext } = useFinancialOverview();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState<Goal | null>(null);
  const [contributing, setContributing] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const [advising, setAdvising] = useState<Goal | null>(null);

  // “?nova=1” abre o formulário (atalhos do dashboard); “&simulacao=<id>” pré-preenche.
  const creating = searchParams.get('nova') === '1';
  const prefill = useMemo<GoalPrefill | null>(() => {
    const simulation = simulations.find((s) => s.id === searchParams.get('simulacao'));
    if (!simulation) return null;
    const months = parseInt(simulation.goalDeadline, 10);
    return {
      name: simulation.goalName,
      category: inferCategory(simulation.goalName),
      targetAmount: parseCurrency(simulation.goalAmount),
      deadline: Number.isFinite(months) && months > 0 ? addMonths(months) : '',
      simulationId: simulation.id,
    };
  }, [simulations, searchParams]);

  const closeForm = () => {
    setEditing(null);
    if (creating) setSearchParams({}, { replace: true });
  };

  const handleSubmit = (input: GoalInput) => {
    if (editing) {
      goalsActions.update(editing.id, input);
    } else {
      goalsActions.create(input);
    }
    closeForm();
  };

  // Mantém o objeto da meta atualizado enquanto o diálogo está aberto.
  const contributingGoal = contributing
    ? (goals.find((g) => g.id === contributing.id) ?? null)
    : null;

  const buildAdvicePrompt = useCallback(
    () => (advising ? buildGoalAdvicePrompt(buildContext(), advising) : ''),
    [advising, buildContext]
  );

  const active = goals.filter((g) => !isGoalCompleted(g));
  const completed = goals.filter(isGoalCompleted);
  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  const renderGrid = (list: Goal[]) => (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {list.map((goal) => (
        <GoalsProgressCard
          key={goal.id}
          goal={goal}
          onContribute={() => setContributing(goal)}
          onEdit={() => setEditing(goal)}
          onDelete={() => setDeleting(goal)}
          onAdvice={() => setAdvising(goal)}
        />
      ))}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] py-2">
      <PageHero
        title="Metas financeiras"
        subtitle="Defina objetivos, registre aportes e acompanhe seu progresso."
        actions={
          <UIButton icon={Plus} onClick={() => setSearchParams({ nova: '1' })}>
            Nova meta
          </UIButton>
        }
      />

      {goals.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={Target}
            title="Você ainda não tem metas"
            description="Uma meta com valor e prazo claros é o primeiro passo para tirar um sonho do papel."
            action={
              <UIButton size="sm" icon={Plus} onClick={() => setSearchParams({ nova: '1' })}>
                Criar minha primeira meta
              </UIButton>
            }
          />
        </div>
      ) : (
        <>
          <dl className="mb-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Total guardado', value: formatBRL(totalSaved) },
              { label: 'Soma das metas', value: formatBRL(totalTarget) },
              {
                label: 'Metas ativas / concluídas',
                value: `${active.length} / ${completed.length}`,
              },
            ].map((item) => (
              <div key={item.label} className="surface p-5">
                <dt className="text-muted-foreground text-sm">{item.label}</dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums">{item.value}</dd>
              </div>
            ))}
          </dl>

          {active.length > 0 && renderGrid(active)}

          {completed.length > 0 && (
            <>
              <h2 className="mb-4 mt-8 text-lg font-semibold">Concluídas</h2>
              {renderGrid(completed)}
            </>
          )}
        </>
      )}

      <GoalFormDialog
        open={creating || !!editing}
        goal={editing}
        prefill={editing ? null : prefill}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <ContributionDialog
        goal={contributingGoal}
        onClose={() => setContributing(null)}
        onSubmit={(amount, note) => {
          if (contributingGoal) goalsActions.addContribution(contributingGoal.id, amount, note);
          setContributing(null);
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Excluir meta?"
        description={`A meta “${deleting?.name ?? ''}” e o histórico de aportes serão removidos deste navegador.`}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) goalsActions.remove(deleting.id);
          setDeleting(null);
        }}
      />

      <AIResponseDialog
        open={!!advising}
        onClose={() => setAdvising(null)}
        title={`Recomendações para “${advising?.name ?? ''}”`}
        description="Geradas pela IA com base nas suas metas, planejamento e simulações."
        buildPrompt={buildAdvicePrompt}
        followUpQuestion={
          advising ? `Como posso acelerar minha meta "${advising.name}"?` : undefined
        }
      />
    </div>
  );
}
