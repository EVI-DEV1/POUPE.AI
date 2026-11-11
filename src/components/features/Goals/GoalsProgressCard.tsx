import { CalendarClock, Pencil, PiggyBank, Sparkles, Trash2, Trophy } from 'lucide-react';

import { ActionMenu } from '@/components/ui/ActionMenu';
import { UIButton } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Goal } from '@/data/finance';
import { GOAL_CATEGORIES } from '@/utils/categories';
import { daysUntil, goalProgress, isGoalCompleted, requiredMonthlyForGoal } from '@/utils/finance';
import { formatBRL, formatDate } from '@/utils/format';

interface GoalsProgressCardProps {
  goal: Goal;
  onContribute: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAdvice: () => void;
}

export function GoalsProgressCard({
  goal,
  onContribute,
  onEdit,
  onDelete,
  onAdvice,
}: GoalsProgressCardProps) {
  const category = GOAL_CATEGORIES[goal.category] ?? GOAL_CATEGORIES.other;
  const Icon = category.icon;
  const progress = goalProgress(goal);
  const completed = isGoalCompleted(goal);
  const days = daysUntil(goal.deadline);
  const monthly = requiredMonthlyForGoal(goal);

  return (
    <article id={`meta-${goal.id}`} className="surface flex scroll-mt-24 flex-col p-5">
      <div className="flex items-start gap-3">
        <span className="icon-tile h-11 w-11">
          {completed ? <Trophy size={22} aria-hidden /> : <Icon size={22} aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold">{goal.name}</h2>
          <p className="text-muted-foreground text-sm">{category.label}</p>
        </div>
        <ActionMenu
          label={`Ações da meta ${goal.name}`}
          items={[
            { label: 'Editar', icon: Pencil, onSelect: onEdit },
            { label: 'Recomendações com IA', icon: Sparkles, onSelect: onAdvice },
            { label: 'Excluir', icon: Trash2, onSelect: onDelete, danger: true },
          ]}
        />
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <p className="text-2xl font-bold tabular-nums">{formatBRL(goal.savedAmount)}</p>
        <p className="text-muted-foreground pb-0.5 text-sm tabular-nums">
          de {formatBRL(goal.targetAmount)}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <ProgressBar value={progress} label={`Progresso da meta ${goal.name}`} />
        <span className="text-sm font-semibold tabular-nums">{Math.round(progress * 100)}%</span>
      </div>

      <ul className="text-muted-foreground mt-4 space-y-1.5 text-sm">
        {completed ? (
          <li className="text-success font-medium">Meta concluída! 🎉</li>
        ) : (
          <>
            <li className="flex items-center gap-2">
              <CalendarClock size={15} aria-hidden />
              {goal.deadline
                ? days !== null && days < 0
                  ? `Prazo vencido em ${formatDate(goal.deadline)}`
                  : `Até ${formatDate(goal.deadline)} (${days} dia${days === 1 ? '' : 's'})`
                : 'Sem prazo definido'}
            </li>
            {monthly !== null && monthly > 0 && (
              <li className="flex items-center gap-2">
                <PiggyBank size={15} aria-hidden />
                Guardar {formatBRL(monthly)}/mês para chegar no prazo
              </li>
            )}
          </>
        )}
      </ul>

      <div className="mt-auto flex gap-2 pt-5">
        <UIButton size="sm" icon={PiggyBank} onClick={onContribute} className="flex-1">
          Registrar aporte
        </UIButton>
        <UIButton
          size="sm"
          variant="secondary"
          icon={Sparkles}
          onClick={onAdvice}
          className="flex-1"
        >
          Dicas da IA
        </UIButton>
      </div>
    </article>
  );
}
