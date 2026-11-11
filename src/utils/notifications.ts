import type { Goal, PlanningData } from '@/data/finance';
import type { SimulationRecord } from '@/data/simulation';

import { daysUntil, getSimulationStatus, isGoalCompleted } from './finance';
import { currentMonthKey, formatMonthLong } from './format';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  to: string;
  tone: 'info' | 'success' | 'warning';
  date: string;
}

/**
 * Notificações derivadas exclusivamente dos dados do usuário. Os IDs são
 * estáveis, então o estado de leitura persiste entre visitas.
 */
export function buildNotifications(
  goals: Goal[],
  simulations: SimulationRecord[],
  planning: PlanningData
): AppNotification[] {
  const list: AppNotification[] = [];
  const now = new Date();

  goals.forEach((goal) => {
    if (isGoalCompleted(goal)) {
      list.push({
        id: `goal-completed-${goal.id}`,
        title: `Meta concluída: ${goal.name} 🎉`,
        description: 'Você alcançou o valor planejado. Que tal definir o próximo objetivo?',
        to: '/metas',
        tone: 'success',
        date: goal.updatedAt,
      });
      return;
    }

    const days = daysUntil(goal.deadline, now);
    if (days !== null && days < 0) {
      list.push({
        id: `goal-overdue-${goal.id}-${goal.deadline}`,
        title: `Prazo vencido: ${goal.name}`,
        description: 'O prazo desta meta passou. Revise o valor ou defina uma nova data.',
        to: '/metas',
        tone: 'warning',
        date: goal.deadline,
      });
    } else if (days !== null && days <= 30) {
      list.push({
        id: `goal-deadline-${goal.id}-${goal.deadline}`,
        title: `Prazo se aproximando: ${goal.name}`,
        description: `Faltam ${days} dia(s) para o prazo desta meta.`,
        to: '/metas',
        tone: 'warning',
        date: goal.deadline,
      });
    }
  });

  [...simulations]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .forEach((simulation) => {
      const status = getSimulationStatus(simulation);
      if (status !== 'viable') {
        list.push({
          id: `simulation-${status}-${simulation.id}`,
          title: `Simulação "${simulation.goalName}" precisa de ajustes`,
          description:
            status === 'unfeasible'
              ? 'Com os valores informados, a meta não cabe no prazo. Veja as sugestões da IA.'
              : 'A meta está perto de caber no orçamento. Pequenos ajustes podem resolver.',
          to: `/resultado/${simulation.id}`,
          tone: 'warning',
          date: simulation.createdAt,
        });
      }
    });

  const month = currentMonthKey(now);
  const hasData = simulations.length > 0 || goals.length > 0 || planning.months.length > 0;
  if (hasData && !planning.months.some((m) => m.month === month)) {
    list.push({
      id: `planning-missing-${month}`,
      title: `Registre o planejamento de ${formatMonthLong(month)}`,
      description: 'Informe receitas e despesas do mês para atualizar seus indicadores.',
      to: '/planejamento?novo=1',
      tone: 'info',
      date: `${month}-01`,
    });
  }

  if (planning.currentBalance !== null && planning.balanceUpdatedAt) {
    const age = (now.getTime() - new Date(planning.balanceUpdatedAt).getTime()) / 86_400_000;
    if (age > 30) {
      list.push({
        id: `balance-stale-${planning.balanceUpdatedAt.slice(0, 10)}`,
        title: 'Atualize seu saldo atual',
        description: 'O saldo informado tem mais de 30 dias.',
        to: '/planejamento',
        tone: 'info',
        date: planning.balanceUpdatedAt,
      });
    }
  }

  return list.sort((a, b) => b.date.localeCompare(a.date));
}
