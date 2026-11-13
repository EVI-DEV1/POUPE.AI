import { profileStore } from '@/stores';
import {
  normalizeEmail,
  validateSignIn,
  validateSignUp,
  type FormErrors,
  type SignInForm,
  type SignUpForm,
} from '@/utils/validation';

import { hashPassword, verifyPassword } from './password';
import { sessionStore, toPublicUser, usersStore, type DemoUser, type PublicUser } from './session';

/**
 * Cadastro e login DEMONSTRATIVOS (tudo no localStorage deste navegador).
 * Nada é enviado a servidor; o servidor do app (`/api/gemini`) não conhece
 * esses perfis.
 */

export type AuthResult =
  | { ok: true; user: PublicUser }
  | { ok: false; message: string; fieldErrors?: FormErrors<SignUpForm> };

export const INVALID_CREDENTIALS = 'E-mail ou senha incorretos.';
export const DUPLICATE_EMAIL = 'Já existe um perfil demonstrativo com este e-mail neste navegador.';

const startSession = (user: DemoUser) =>
  sessionStore.write({ userId: user.id, startedAt: new Date().toISOString() });

const findByEmail = (email: string) =>
  usersStore.read().find((user) => user.email === normalizeEmail(email));

export async function signUp(form: SignUpForm): Promise<AuthResult> {
  const fieldErrors = validateSignUp(form);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: 'Revise os campos destacados.', fieldErrors };
  }

  if (findByEmail(form.email)) {
    return { ok: false, message: DUPLICATE_EMAIL, fieldErrors: { email: DUPLICATE_EMAIL } };
  }

  const user: DemoUser = {
    id: crypto.randomUUID(),
    name: form.name.trim(),
    email: normalizeEmail(form.email),
    password: await hashPassword(form.password),
    createdAt: new Date().toISOString(),
  };

  // Reconfere após a derivação (assíncrona): outra aba pode ter cadastrado o e-mail.
  if (findByEmail(user.email)) {
    return { ok: false, message: DUPLICATE_EMAIL, fieldErrors: { email: DUPLICATE_EMAIL } };
  }

  usersStore.write((users) => [...users, user]);
  startSession(user);
  // O perfil começa com o nome informado no cadastro.
  profileStore.write((profile) => ({ ...profile, name: user.name }));

  return { ok: true, user: toPublicUser(user) };
}

/** Registro usado quando o e-mail não existe, para o tempo de resposta não denunciar isso. */
let dummyRecord: Promise<DemoUser['password']> | null = null;

export async function signIn(form: SignInForm): Promise<AuthResult> {
  const fieldErrors = validateSignIn(form);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: 'Revise os campos destacados.', fieldErrors };
  }

  const user = findByEmail(form.email);
  if (!user) {
    dummyRecord ??= hashPassword('poupe.ai-demo');
    await verifyPassword(form.password, await dummyRecord);
    return { ok: false, message: INVALID_CREDENTIALS };
  }

  if (!(await verifyPassword(form.password, user.password))) {
    return { ok: false, message: INVALID_CREDENTIALS };
  }

  startSession(user);
  return { ok: true, user: toPublicUser(user) };
}

/** Encerra a sessão. Os dados do perfil continuam salvos neste navegador. */
export function signOut() {
  sessionStore.write(null);
}
