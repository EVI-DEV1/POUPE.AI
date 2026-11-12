import type { ChatMessage } from './simulation';

export type GoalCategory =
  'travel' | 'home' | 'vehicle' | 'education' | 'emergency' | 'electronics' | 'event' | 'other';

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Goal {
  id: string;
  name: string;
  category: GoalCategory;
  targetAmount: number;
  savedAmount: number;
  /** Data limite no formato YYYY-MM-DD (opcional). */
  deadline: string;
  /** Datas ISO; `null` quando o registro salvo não tem uma data válida. */
  createdAt: string | null;
  updatedAt: string | null;
  contributions: GoalContribution[];
  /** Simulação que deu origem à meta, quando houver. */
  simulationId?: string;
}

/** Registro mensal informado pelo próprio usuário na página de Planejamento. */
export interface MonthEntry {
  id: string;
  /** Mês de referência no formato YYYY-MM. */
  month: string;
  income: number;
  fixedExpenses: number;
  variableExpenses: number;
  debts: number;
  note?: string;
}

export interface PlanningData {
  currentBalance: number | null;
  balanceUpdatedAt: string | null;
  months: MonthEntry[];
}

export interface Profile {
  name: string;
  avatarColor: string;
  /** Foto reduzida (data URL) guardada apenas neste navegador. */
  avatarImage: string | null;
}

export interface Preferences {
  sidebarCollapsed: boolean;
}

export type AssistantMessage = ChatMessage & { createdAt?: string };
