import { createLocalStore, isRecord } from '@/lib/localStore';

/**
 * Perfis e sessão DEMONSTRATIVOS, guardados apenas neste navegador.
 *
 * Isto não é autenticação: não há servidor que confirme quem é o usuário, e
 * qualquer pessoa com acesso ao navegador pode ler o localStorage. O objetivo é
 * separar os dados de perfis diferentes no mesmo navegador e demonstrar o fluxo
 * de cadastro/login. Nada aqui é enviado a um servidor.
 */

export interface PasswordRecord {
  algorithm: 'PBKDF2-SHA256';
  iterations: number;
  /** Base64. */
  salt: string;
  /** Base64. */
  hash: string;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  password: PasswordRecord;
  createdAt: string;
}

/** Dados do perfil sem as credenciais — o que a interface pode ver. */
export type PublicUser = Omit<DemoUser, 'password'>;

export interface DemoSession {
  userId: string;
  startedAt: string;
}

export const USERS_KEY = 'poupeai-demo-users';
export const SESSION_KEY = 'poupeai-demo-session';

const isPasswordRecord = (value: unknown): value is PasswordRecord =>
  isRecord(value) &&
  value.algorithm === 'PBKDF2-SHA256' &&
  typeof value.iterations === 'number' &&
  Number.isInteger(value.iterations) &&
  value.iterations > 0 &&
  typeof value.salt === 'string' &&
  typeof value.hash === 'string';

const toDemoUser = (value: unknown): DemoUser | null =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  value.id !== '' &&
  typeof value.name === 'string' &&
  typeof value.email === 'string' &&
  typeof value.createdAt === 'string' &&
  isPasswordRecord(value.password)
    ? {
        id: value.id,
        name: value.name,
        email: value.email,
        password: value.password,
        createdAt: value.createdAt,
      }
    : null;

const EMPTY_USERS: DemoUser[] = [];

export const usersStore = createLocalStore<DemoUser[]>(USERS_KEY, EMPTY_USERS, (value) =>
  Array.isArray(value)
    ? value.map(toDemoUser).filter((user): user is DemoUser => user !== null)
    : EMPTY_USERS
);

export const sessionStore = createLocalStore<DemoSession | null>(SESSION_KEY, null, (value) =>
  isRecord(value) && typeof value.userId === 'string' && typeof value.startedAt === 'string'
    ? { userId: value.userId, startedAt: value.startedAt }
    : null
);

/** Remove as credenciais antes de expor o perfil à interface. */
export const toPublicUser = (user: DemoUser): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

/** Perfil da sessão atual — apenas se ele ainda existir na lista de perfis. */
export function activeUser(): DemoUser | null {
  const session = sessionStore.read();
  if (!session) return null;
  return usersStore.read().find((user) => user.id === session.userId) ?? null;
}

export const activeProfileId = () => activeUser()?.id ?? null;

/**
 * Nomes-base dos dados de cada perfil. São os mesmos nomes usados antes do
 * login demonstrativo — nessas chaves "soltas" continuam os dados antigos, que
 * nunca são alterados (ver legacyImport.ts).
 */
export const PROFILE_DATA_KEYS = {
  simulations: 'simulation-data',
  goals: 'poupeai-goals',
  planning: 'poupeai-planning',
  profile: 'poupeai-profile',
  notifications: 'poupeai-notifications-read',
  assistantChat: 'poupeai-assistant-chat',
} as const;

/** Prefixo das chaves de dados de um perfil. */
export const profileKey = (userId: string, base: string) => `poupeai:perfil:${userId}:${base}`;

/** Chave de dados do perfil ativo (`null` sem sessão — nada é lido nem gravado). */
export const activeProfileKey = (base: string) => {
  const id = activeProfileId();
  return id ? profileKey(id, base) : null;
};

/** Stores dos quais as chaves por perfil dependem. */
export const PROFILE_SCOPE_DEPENDENCIES = [sessionStore, usersStore];
