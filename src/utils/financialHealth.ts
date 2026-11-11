import type { Goal } from '@/data/finance';

import { type FinancialSnapshot, isGoalCompleted, requiredMonthlyForGoal } from './finance';

/**
 * PONTUAÇÃO DE SAÚDE FINANCEIRA (0–100)
 * ------------------------------------------------------------------
 * Indicador educativo, calculado apenas com os dados informados pelo
 * usuário. Não é uma avaliação de crédito nem uma recomendação de
 * investimento. Critérios (inspirados na regra 50/30/20):
 *
 * 1. Taxa de economia (até 35 pts)
 *    economia ÷ receita. 20% ou mais = 35 pts; 0% ou negativo = 0;
 *    proporcional entre os dois.
 *
 * 2. Comprometimento com dívidas (até 25 pts)
 *    dívidas ÷ receita. Até 10% = 25 pts; 40% ou mais = 0;
 *    proporcional entre os dois.
 *
 * 3. Custos fixos (até 20 pts)
 *    custos fixos ÷ receita. Até 50% = 20 pts; 80% ou mais = 0;
 *    proporcional entre os dois.
 *
 * 4. Metas (até 20 pts)
 *    Sem metas ativas = 0. Com metas: 8 pts por ter um objetivo
 *    definido + até 12 pts proporcionais a quanto a economia mensal
 *    cobre o valor mensal necessário para as metas com prazo.
 *
 * Classificação: 80+ Excelente · 60–79 Boa · 40–59 Regular · <40 Atenção.
 * Sem receita informada, a pontuação NÃO é calculada.
 */

export type HealthLevel = 'ok' | 'warning';

export interface HealthCheck {
  id: string;
  label: string;
  level: HealthLevel;
}

export interface HealthCriterion {
  id: string;
  label: string;
  points: number;
  max: number;
  detail: string;
}

export interface FinancialHealth {
  score: number;
  label: 'Excelente' | 'Boa' | 'Regular' | 'Atenção';
  criteria: HealthCriterion[];
  checks: HealthCheck[];
}

/** Interpolação linear: `good` → máximo, `bad` → zero. */
const scale = (value: number, good: number, bad: number, max: number) => {
  if (good < bad) {
    if (value <= good) return max;
    if (value >= bad) return 0;
    return max * (1 - (value - good) / (bad - good));
  }
  if (value >= good) return max;
  if (value <= bad) return 0;
  return max * ((value - bad) / (good - bad));
};

const pct = (ratio: number) => `${Math.round(ratio * 100)}%`;

export function calculateFinancialHealth(
  snapshot: FinancialSnapshot | null,
  goals: Goal[]
): FinancialHealth | null {
  if (!snapshot || snapshot.income <= 0) {
    return null;
  }

  const { income, savings, debts, fixedExpenses } = snapshot;
  const savingsRate = savings / income;
  const debtRatio = debts / income;
  const fixedRatio = fixedExpenses / income;

  const activeGoals = goals.filter((goal) => !isGoalCompleted(goal));
  const requiredMonthly = activeGoals.reduce(
    (sum, goal) => sum + (requiredMonthlyForGoal(goal) ?? 0),
    0
  );
  const coverage = requiredMonthly > 0 ? Math.max(0, savings) / requiredMonthly : 1;
  const goalPoints = activeGoals.length > 0 ? 8 + 12 * Math.min(1, coverage) : 0;

  const criteria: HealthCriterion[] = [
    {
      id: 'savings',
      label: 'Taxa de economia',
      max: 35,
      points: scale(savingsRate, 0.2, 0, 35),
      detail: `${pct(savingsRate)} da receita (ideal: 20% ou mais)`,
    },
    {
      id: 'debts',
      label: 'Comprometimento com dívidas',
      max: 25,
      points: scale(debtRatio, 0.1, 0.4, 25),
      detail: `${pct(debtRatio)} da receita (ideal: até 10%)`,
    },
    {
      id: 'fixed',
      label: 'Custos fixos',
      max: 20,
      points: scale(fixedRatio, 0.5, 0.8, 20),
      detail: `${pct(fixedRatio)} da receita (ideal: até 50%)`,
    },
    {
      id: 'goals',
      label: 'Metas',
      max: 20,
      points: goalPoints,
      detail:
        activeGoals.length === 0
          ? 'Nenhuma meta ativa cadastrada'
          : requiredMonthly > 0
            ? `Economia cobre ${pct(Math.min(coverage, 9.99))} do necessário para as metas`
            : `${activeGoals.length} meta(s) ativa(s) sem prazo definido`,
    },
  ];

  const score = Math.round(criteria.reduce((sum, c) => sum + c.points, 0));
  const label =
    score >= 80 ? 'Excelente' : score >= 60 ? 'Boa' : score >= 40 ? 'Regular' : 'Atenção';

  const checks: HealthCheck[] = [
    fixedRatio <= 0.5
      ? { id: 'fixed', label: 'Gastos fixos sob controle', level: 'ok' }
      : { id: 'fixed', label: 'Pode reduzir gastos fixos', level: 'warning' },
    savings > 0
      ? { id: 'savings', label: 'Você está economizando', level: 'ok' }
      : { id: 'savings', label: 'Gastos superam a receita', level: 'warning' },
    debtRatio <= 0.3
      ? { id: 'debts', label: 'Dívidas sob controle', level: 'ok' }
      : { id: 'debts', label: 'Dívidas pesam no orçamento', level: 'warning' },
    activeGoals.length === 0
      ? { id: 'goals', label: 'Crie uma meta para acompanhar', level: 'warning' }
      : coverage >= 1
        ? { id: 'goals', label: 'Meta em progresso', level: 'ok' }
        : { id: 'goals', label: 'Metas pedem mais economia', level: 'warning' },
  ];

  return { score, label, criteria, checks };
}
