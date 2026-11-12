import type { AssistantMessage, Goal, PlanningData } from '@/data/finance';
import type { SimulationRecord } from '@/data/simulation';
import {
  getMonthTotals,
  getSimulationStatus,
  FEASIBILITY_LABELS,
  goalProgress,
} from '@/utils/finance';
import type { FinancialHealth } from '@/utils/financialHealth';
import { formatBRL, formatDate, formatMonthLong, formatPercent } from '@/utils/format';
import { calcMonthlySavings, calcRequiredMonthlySavings } from '@/utils/simulation';
import { sortSimulationsByRecency } from '@/utils/simulationRecords';

export interface AssistantContextData {
  userName: string;
  simulations: SimulationRecord[];
  goals: Goal[];
  planning: PlanningData;
  health?: FinancialHealth | null;
}

/** Resumo em texto dos dados que o app possui — é tudo o que a IA “enxerga”. */
export function buildAssistantContext({
  userName,
  simulations,
  goals,
  planning,
  health,
}: AssistantContextData) {
  const lines: string[] = [];

  lines.push(`Nome do usuário: ${userName || 'não informado'}`);

  lines.push(
    planning.currentBalance !== null
      ? `Saldo atual informado pelo usuário: ${formatBRL(planning.currentBalance)}`
      : 'Saldo atual: não informado'
  );

  const months = [...planning.months].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 6);
  if (months.length > 0) {
    lines.push('Planejamento mensal (informado pelo usuário, mais recente primeiro):');
    months.forEach((m) => {
      const t = getMonthTotals(m);
      lines.push(
        `- ${formatMonthLong(m.month)}: receitas ${formatBRL(m.income)}, custos fixos ${formatBRL(m.fixedExpenses)}, gastos variáveis ${formatBRL(m.variableExpenses)}, dívidas ${formatBRL(m.debts)}, sobra ${formatBRL(t.savings)}${t.savingsRate !== null ? ` (${formatPercent(t.savingsRate)} da receita)` : ''}`
      );
    });
  } else {
    lines.push('Planejamento mensal: nenhum mês cadastrado');
  }

  if (goals.length > 0) {
    lines.push('Metas financeiras:');
    goals.forEach((g) => {
      lines.push(
        `- ${g.name}: ${formatBRL(g.savedAmount)} de ${formatBRL(g.targetAmount)} (${formatPercent(goalProgress(g))})${g.deadline ? `, prazo ${formatDate(g.deadline)}` : ', sem prazo'}`
      );
    });
  } else {
    lines.push('Metas financeiras: nenhuma cadastrada');
  }

  const recent = sortSimulationsByRecency(simulations).slice(0, 5);
  if (recent.length > 0) {
    lines.push('Simulações recentes (cenários hipotéticos, não movimentações reais):');
    recent.forEach((s) => {
      lines.push(
        `- "${s.goalName}": renda R$ ${s.income}, custos fixos R$ ${s.expenses}, dívidas R$ ${s.debts}, sobra mensal ${formatBRL(calcMonthlySavings(s))}, meta R$ ${s.goalAmount} em ${s.goalDeadline} meses (precisa ${formatBRL(calcRequiredMonthlySavings(s))}/mês) — status: ${FEASIBILITY_LABELS[getSimulationStatus(s)]}`
      );
    });
  } else {
    lines.push('Simulações: nenhuma realizada');
  }

  if (health) {
    lines.push(
      `Pontuação de saúde financeira calculada pelo app: ${health.score}/100 (${health.label}). Critérios: ${health.criteria
        .map((c) => `${c.label} ${Math.round(c.points)}/${c.max} — ${c.detail}`)
        .join('; ')}`
    );
  }

  return lines.join('\n');
}

const BASE_RULES = `Regras:
- Responda em português do Brasil, de forma amigável, clara e didática.
- Use SOMENTE os dados fornecidos acima. Se faltar alguma informação, diga o que falta e onde o usuário pode cadastrá-la no app (Planejamento, Metas ou Simulações).
- Nunca invente valores, saldos, transações ou rendimentos.
- Você NÃO tem acesso a contas bancárias, cartões ou extratos — não afirme o contrário.
- Não recomende produtos financeiros específicos de instituições; fale de categorias (ex.: Tesouro Selic, CDB com liquidez diária).
- Não utilize Markdown, títulos, ** ou ##. Pode usar listas simples com "•" e emojis com moderação.`;

export function buildAssistantChatPrompt(
  context: string,
  history: AssistantMessage[],
  question: string
) {
  const conversation = history
    .slice(-10)
    .map((m) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
    .join('\n');

  return `Você é o Assistente Poupe.ai, um educador financeiro do aplicativo Poupe.ai.

Dados disponíveis no aplicativo:
${context}

${conversation ? `Conversa até agora:\n${conversation}\n` : ''}
Nova pergunta do usuário:
${question}

${BASE_RULES}
- Seja objetivo: até 160 palavras, em 2 a 4 parágrafos curtos.

Resposta:`;
}

export function buildHealthAnalysisPrompt(context: string) {
  return `Você é o Assistente Poupe.ai, um educador financeiro.

Dados disponíveis no aplicativo:
${context}

Faça uma análise completa da saúde financeira do usuário com base na pontuação e nos critérios acima:
1. Um parágrafo explicando a pontuação em linguagem simples.
2. Os pontos fortes.
3. Os pontos de atenção.
4. Três a cinco ações práticas para os próximos 30 dias, com valores quando for possível calcular a partir dos dados.

${BASE_RULES}
- Até 280 palavras. Separe as partes com uma linha em branco.

Análise:`;
}

export function buildGoalAdvicePrompt(context: string, goal: Goal) {
  return `Você é o Assistente Poupe.ai, um educador financeiro.

Dados disponíveis no aplicativo:
${context}

O usuário quer recomendações para a meta "${goal.name}" (${formatBRL(goal.savedAmount)} guardados de ${formatBRL(goal.targetAmount)}${goal.deadline ? `, prazo ${formatDate(goal.deadline)}` : ', sem prazo definido'}).
Explique se o ritmo atual parece suficiente (somente se houver dados para isso), quanto guardar por mês e dê de três a cinco estratégias práticas para alcançá-la.

${BASE_RULES}
- Até 220 palavras.

Recomendações:`;
}

export function buildSimulationQuestion(simulation: SimulationRecord) {
  return `Analise minha simulação "${simulation.goalName}" e me diga como posso torná-la mais viável.`;
}
