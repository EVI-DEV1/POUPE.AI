import type { Goal, MonthEntry, PlanningData } from '@/data/finance';
import type { SimulationRecord } from '@/data/simulation';
import type { InsightData } from '@/services/aiService';

import { parseCurrency } from './currency';
import { compareByRecency, toTimestamp } from './date';
import { currentMonthKey } from './format';
import { calcMonthlySavings, calcRequiredMonthlySavings } from './simulation';
import { sortSimulationsByRecency } from './simulationRecords';

/* ------------------------------------------------------------------ */
/* Retrato financeiro                                                  */
/* ------------------------------------------------------------------ */

export interface FinancialSnapshot {
  /** Origem dos números: planejamento mensal informado ou última simulação. */
  source: 'planning' | 'simulation';
  sourceLabel: string;
  income: number;
  fixedExpenses: number;
  variableExpenses: number;
  debts: number;
  totalExpenses: number;
  savings: number;
  /** Economia / receita (0–1). `null` quando não há receita. */
  savingsRate: number | null;
  previous: { savings: number; savingsRate: number | null; label: string } | null;
}

const monthTotals = (entry: MonthEntry) => {
  const totalExpenses = entry.fixedExpenses + entry.variableExpenses + entry.debts;
  const savings = entry.income - totalExpenses;
  return {
    totalExpenses,
    savings,
    savingsRate: entry.income > 0 ? savings / entry.income : null,
  };
};

export const getMonthTotals = monthTotals;

/**
 * Retorna os números usados nos indicadores do dashboard.
 *
 * Prioridade:
 * 1. Mês mais recente cadastrado no Planejamento (até o mês atual);
 * 2. Simulação mais recente (rotulada como tal, pois não é movimentação real).
 *
 * Retorna `null` quando o usuário ainda não informou nada — nunca inventa valores.
 */
export function getFinancialSnapshot(
  planning: PlanningData,
  simulations: SimulationRecord[]
): FinancialSnapshot | null {
  const today = currentMonthKey();
  const months = [...planning.months]
    .filter((m) => m.month <= today)
    .sort((a, b) => a.month.localeCompare(b.month));

  if (months.length > 0) {
    const latest = months[months.length - 1];
    const before = months.length > 1 ? months[months.length - 2] : null;
    const totals = monthTotals(latest);

    return {
      source: 'planning',
      sourceLabel: latest.month,
      income: latest.income,
      fixedExpenses: latest.fixedExpenses,
      variableExpenses: latest.variableExpenses,
      debts: latest.debts,
      totalExpenses: totals.totalExpenses,
      savings: totals.savings,
      savingsRate: totals.savingsRate,
      previous: before
        ? {
            savings: monthTotals(before).savings,
            savingsRate: monthTotals(before).savingsRate,
            label: before.month,
          }
        : null,
    };
  }

  const latestSimulation = sortSimulationsByRecency(simulations)[0];

  if (!latestSimulation) {
    return null;
  }

  const income = parseCurrency(latestSimulation.income);
  const fixedExpenses = parseCurrency(latestSimulation.expenses);
  const debts = parseCurrency(latestSimulation.debts);
  const savings = calcMonthlySavings(latestSimulation);

  return {
    source: 'simulation',
    sourceLabel: latestSimulation.goalName,
    income,
    fixedExpenses,
    variableExpenses: 0,
    debts,
    totalExpenses: fixedExpenses + debts,
    savings,
    savingsRate: income > 0 ? savings / income : null,
    previous: null,
  };
}

/* ------------------------------------------------------------------ */
/* Viabilidade de simulações                                           */
/* ------------------------------------------------------------------ */

export type FeasibilityStatus = InsightData['feasibility']['status'];

/**
 * Mesmo critério enviado à IA em `buildAIPrompt`:
 * - viável: sobra após reservar a economia necessária ≥ 0;
 * - ajuste: sobra negativa de até 20% da economia necessária;
 * - inviável: sobra negativa acima de 20%.
 * Quando a IA já respondeu, o status dela é respeitado.
 */
export function getSimulationStatus(simulation: SimulationRecord): FeasibilityStatus {
  const aiStatus = simulation.insight?.feasibility?.status as string | undefined;

  if (aiStatus === 'viable' || aiStatus === 'unfeasible') {
    return aiStatus;
  }
  if (aiStatus === 'needs_adjustment' || aiStatus === 'needs_adjustement') {
    return 'needs_adjustment';
  }

  const required = calcRequiredMonthlySavings(simulation);
  const balance = calcMonthlySavings(simulation) - required;

  if (!Number.isFinite(required) || balance >= 0) {
    return 'viable';
  }
  return Math.abs(balance) <= required * 0.2 ? 'needs_adjustment' : 'unfeasible';
}

export const FEASIBILITY_LABELS: Record<FeasibilityStatus, string> = {
  viable: 'Viável',
  needs_adjustment: 'Atenção',
  unfeasible: 'Inviável',
};

/* ------------------------------------------------------------------ */
/* Metas                                                               */
/* ------------------------------------------------------------------ */

export const goalProgress = (goal: Goal) =>
  goal.targetAmount > 0 ? Math.min(1, goal.savedAmount / goal.targetAmount) : 0;

export const isGoalCompleted = (goal: Goal) =>
  goal.targetAmount > 0 && goal.savedAmount >= goal.targetAmount;

/** Meses inteiros restantes até o prazo (mínimo 1), ou `null` sem prazo. */
export function monthsUntil(deadline: string, from = new Date()) {
  if (!deadline) return null;
  const end = new Date(`${deadline}T12:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  let months = (end.getFullYear() - from.getFullYear()) * 12 + (end.getMonth() - from.getMonth());
  if (end.getDate() < from.getDate()) months -= 1;
  return Math.max(1, months);
}

export function daysUntil(deadline: string, from = new Date()) {
  if (!deadline) return null;
  const end = new Date(`${deadline}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - from.getTime()) / 86_400_000);
}

/** Quanto falta guardar por mês para cumprir a meta no prazo. */
export function requiredMonthlyForGoal(goal: Goal) {
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const months = monthsUntil(goal.deadline);
  if (!months || remaining === 0) return remaining === 0 ? 0 : null;
  return remaining / months;
}

/** Meta exibida no dashboard: a ativa com prazo mais próximo; senão, a atualizada por último. */
export function pickFeaturedGoal(goals: Goal[]) {
  const active = goals.filter((goal) => !isGoalCompleted(goal));
  const pool = active.length > 0 ? active : goals;
  return (
    [...pool].sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return compareByRecency(toTimestamp(a.updatedAt), toTimestamp(b.updatedAt));
    })[0] ?? null
  );
}
