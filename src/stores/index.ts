import type {
  AssistantMessage,
  Goal,
  GoalContribution,
  MonthEntry,
  PlanningData,
  Preferences,
  Profile,
} from '@/data/finance';
import { activeProfileKey, PROFILE_DATA_KEYS, PROFILE_SCOPE_DEPENDENCIES } from '@/auth/session';
import { createLocalStore, isRecord, useLocalStore } from '@/lib/localStore';

/** Chave por perfil: cada perfil demonstrativo só enxerga os próprios dados. */
const scoped = (base: string) => () => activeProfileKey(base);

const toNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const toString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

/* ------------------------------------------------------------------ */
/* Perfil                                                              */
/* ------------------------------------------------------------------ */

export const AVATAR_COLORS = ['#9333EA', '#EC4899', '#22D3EE', '#F59E0B', '#10B981', '#6366F1'];

const DEFAULT_PROFILE: Profile = { name: '', avatarColor: AVATAR_COLORS[0], avatarImage: null };

export const profileStore = createLocalStore<Profile>(
  scoped(PROFILE_DATA_KEYS.profile),
  DEFAULT_PROFILE,
  (v) =>
    isRecord(v)
      ? {
          name: toString(v.name).slice(0, 40),
          avatarColor: toString(v.avatarColor, DEFAULT_PROFILE.avatarColor),
          avatarImage: typeof v.avatarImage === 'string' ? v.avatarImage : null,
        }
      : DEFAULT_PROFILE,
  PROFILE_SCOPE_DEPENDENCIES
);

export const useProfile = () => useLocalStore(profileStore);

/* ------------------------------------------------------------------ */
/* Preferências                                                        */
/* ------------------------------------------------------------------ */

const DEFAULT_PREFERENCES: Preferences = { sidebarCollapsed: false };

export const preferencesStore = createLocalStore<Preferences>(
  'poupeai-preferences',
  DEFAULT_PREFERENCES,
  (v) => (isRecord(v) ? { sidebarCollapsed: v.sidebarCollapsed === true } : DEFAULT_PREFERENCES)
);

export const usePreferences = () => useLocalStore(preferencesStore);

/* ------------------------------------------------------------------ */
/* Metas                                                               */
/* ------------------------------------------------------------------ */

const EMPTY_GOALS: Goal[] = [];

export const goalsStore = createLocalStore<Goal[]>(
  scoped(PROFILE_DATA_KEYS.goals),
  EMPTY_GOALS,
  (v) =>
    Array.isArray(v)
      ? v.filter(isRecord).map((g) => ({
          id: toString(g.id, crypto.randomUUID()),
          name: toString(g.name, 'Meta'),
          category: toString(g.category, 'other') as Goal['category'],
          targetAmount: toNumber(g.targetAmount),
          savedAmount: toNumber(g.savedAmount),
          deadline: toString(g.deadline),
          // Sem data válida → `null`, em vez de fingir que a meta foi alterada agora.
          createdAt: typeof g.createdAt === 'string' ? g.createdAt : null,
          updatedAt: typeof g.updatedAt === 'string' ? g.updatedAt : null,
          contributions: Array.isArray(g.contributions)
            ? (g.contributions as GoalContribution[])
            : [],
          simulationId: typeof g.simulationId === 'string' ? g.simulationId : undefined,
        }))
      : EMPTY_GOALS,
  PROFILE_SCOPE_DEPENDENCIES
);

export const useGoals = () => useLocalStore(goalsStore);

export type GoalInput = Pick<
  Goal,
  'name' | 'category' | 'targetAmount' | 'savedAmount' | 'deadline' | 'simulationId'
>;

export const goalsActions = {
  create(input: GoalInput) {
    const now = new Date().toISOString();
    const goal: Goal = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      contributions:
        input.savedAmount > 0
          ? [
              {
                id: crypto.randomUUID(),
                amount: input.savedAmount,
                date: now,
                note: 'Valor inicial',
              },
            ]
          : [],
    };
    goalsStore.write((goals) => [...goals, goal]);
    return goal.id;
  },
  update(id: string, input: GoalInput) {
    goalsStore.write((goals) =>
      goals.map((goal) =>
        goal.id === id ? { ...goal, ...input, updatedAt: new Date().toISOString() } : goal
      )
    );
  },
  addContribution(id: string, amount: number, note?: string) {
    const now = new Date().toISOString();
    goalsStore.write((goals) =>
      goals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              savedAmount: Math.max(0, goal.savedAmount + amount),
              updatedAt: now,
              contributions: [
                ...goal.contributions,
                { id: crypto.randomUUID(), amount, date: now, note },
              ],
            }
          : goal
      )
    );
  },
  remove(id: string) {
    goalsStore.write((goals) => goals.filter((goal) => goal.id !== id));
  },
};

/* ------------------------------------------------------------------ */
/* Planejamento mensal                                                 */
/* ------------------------------------------------------------------ */

const DEFAULT_PLANNING: PlanningData = { currentBalance: null, balanceUpdatedAt: null, months: [] };

export const planningStore = createLocalStore<PlanningData>(
  scoped(PROFILE_DATA_KEYS.planning),
  DEFAULT_PLANNING,
  (v) =>
    isRecord(v)
      ? {
          currentBalance:
            typeof v.currentBalance === 'number' && Number.isFinite(v.currentBalance)
              ? v.currentBalance
              : null,
          balanceUpdatedAt: typeof v.balanceUpdatedAt === 'string' ? v.balanceUpdatedAt : null,
          months: Array.isArray(v.months)
            ? v.months.filter(isRecord).map((m) => ({
                id: toString(m.id, crypto.randomUUID()),
                month: toString(m.month),
                income: toNumber(m.income),
                fixedExpenses: toNumber(m.fixedExpenses),
                variableExpenses: toNumber(m.variableExpenses),
                debts: toNumber(m.debts),
                note: typeof m.note === 'string' ? m.note : undefined,
              }))
            : [],
        }
      : DEFAULT_PLANNING,
  PROFILE_SCOPE_DEPENDENCIES
);

export const usePlanning = () => useLocalStore(planningStore);

export const planningActions = {
  setBalance(value: number | null) {
    planningStore.write((data) => ({
      ...data,
      currentBalance: value,
      balanceUpdatedAt: value === null ? null : new Date().toISOString(),
    }));
  },
  /** Cria ou substitui o registro do mês informado. */
  upsertMonth(entry: Omit<MonthEntry, 'id'> & { id?: string }) {
    planningStore.write((data) => {
      const others = data.months.filter((m) => m.month !== entry.month && m.id !== entry.id);
      const next: MonthEntry = { ...entry, id: entry.id ?? crypto.randomUUID() };
      return {
        ...data,
        months: [...others, next].sort((a, b) => a.month.localeCompare(b.month)),
      };
    });
  },
  removeMonth(id: string) {
    planningStore.write((data) => ({ ...data, months: data.months.filter((m) => m.id !== id) }));
  },
};

/* ------------------------------------------------------------------ */
/* Notificações lidas                                                  */
/* ------------------------------------------------------------------ */

const EMPTY_IDS: string[] = [];

export const readNotificationsStore = createLocalStore<string[]>(
  scoped(PROFILE_DATA_KEYS.notifications),
  EMPTY_IDS,
  (v) => (Array.isArray(v) ? v.filter((id): id is string => typeof id === 'string') : EMPTY_IDS),
  PROFILE_SCOPE_DEPENDENCIES
);

export const useReadNotifications = () => useLocalStore(readNotificationsStore);

/* ------------------------------------------------------------------ */
/* Chat geral com a IA                                                 */
/* ------------------------------------------------------------------ */

const EMPTY_MESSAGES: AssistantMessage[] = [];

export const assistantChatStore = createLocalStore<AssistantMessage[]>(
  scoped(PROFILE_DATA_KEYS.assistantChat),
  EMPTY_MESSAGES,
  (v) => (Array.isArray(v) ? (v as AssistantMessage[]) : EMPTY_MESSAGES),
  PROFILE_SCOPE_DEPENDENCIES
);

export const useAssistantChat = () => useLocalStore(assistantChatStore);

/**
 * Chaves exportadas em Preferências → Exportar: os dados do perfil ativo e as
 * preferências do aparelho. Nunca inclui a lista de perfis nem a sessão.
 */
export const exportableStorageKeys = () => ({
  simulations: activeProfileKey(PROFILE_DATA_KEYS.simulations),
  goals: goalsStore.key,
  planning: planningStore.key,
  profile: profileStore.key,
  notifications: readNotificationsStore.key,
  assistantChat: assistantChatStore.key,
  preferences: preferencesStore.key,
  theme: 'theme',
});
