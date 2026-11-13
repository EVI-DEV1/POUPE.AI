import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { simulationStore } from '@/hooks/useSimulationStorage';
import { NoActiveKeyError } from '@/lib/localStore';
import { goalsActions, goalsStore, profileStore } from '@/stores';
import { stubLocalStorage } from '@/test/fixtures';

import { DUPLICATE_EMAIL, INVALID_CREDENTIALS, signIn, signOut, signUp } from './demoAuth';
import { hashPassword, PBKDF2_ITERATIONS, verifyPassword } from './password';
import { redirectTarget } from './redirect';
import { activeUser, profileKey, SESSION_KEY, USERS_KEY, usersStore } from './session';

const PASSWORD = 'senha-demo-123';
const form = (email: string, overrides = {}) => ({
  name: 'Ana Demo',
  email,
  password: PASSWORD,
  confirmPassword: PASSWORD,
  ...overrides,
});

let ls: ReturnType<typeof stubLocalStorage>;

beforeEach(() => {
  ls = stubLocalStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('senha', () => {
  it('usa PBKDF2 com sal aleatório e nunca guarda o texto da senha', async () => {
    const a = await hashPassword(PASSWORD);
    const b = await hashPassword(PASSWORD);

    expect(a.algorithm).toBe('PBKDF2-SHA256');
    expect(a.iterations).toBe(PBKDF2_ITERATIONS);
    expect(a.iterations).toBeGreaterThanOrEqual(600_000);
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    expect(JSON.stringify(a)).not.toContain(PASSWORD);
  });

  it('confere a senha correta e recusa a incorreta ou registro corrompido', async () => {
    const record = await hashPassword(PASSWORD, 1_000);
    expect(await verifyPassword(PASSWORD, record)).toBe(true);
    expect(await verifyPassword('outra-senha', record)).toBe(false);
    expect(await verifyPassword(PASSWORD, { ...record, salt: '%%%' })).toBe(false);
  });
});

describe('cadastro, login e logout', () => {
  it('cadastra, inicia a sessão e nunca grava a senha em texto puro', async () => {
    const result = await signUp(form('Ana@Exemplo.com '));

    expect(result.ok).toBe(true);
    expect(activeUser()?.email).toBe('ana@exemplo.com');
    expect(profileStore.read().name).toBe('Ana Demo');

    const raw = ls.raw(USERS_KEY) ?? '';
    expect(raw).not.toContain(PASSWORD);
    expect(result.ok && JSON.stringify(result.user)).not.toContain('password');
  }, 20_000);

  it('valida os campos e não cria perfil com dados inválidos', async () => {
    const result = await signUp(
      form('email-invalido', { name: 'A', password: '123', confirmPassword: '321' })
    );

    expect(result.ok).toBe(false);
    expect(!result.ok && result.fieldErrors).toEqual({
      name: expect.any(String),
      email: expect.any(String),
      password: expect.any(String),
      confirmPassword: expect.any(String),
    });
    expect(usersStore.read()).toHaveLength(0);
  });

  it('recusa e-mail já cadastrado neste navegador', async () => {
    await signUp(form('ana@exemplo.com'));
    signOut();
    const again = await signUp(form('ANA@exemplo.com'));

    expect(again).toEqual(expect.objectContaining({ ok: false, message: DUPLICATE_EMAIL }));
    expect(usersStore.read()).toHaveLength(1);
  }, 20_000);

  it('faz login com a senha certa e usa mensagem genérica para erros', async () => {
    await signUp(form('ana@exemplo.com'));
    signOut();
    expect(activeUser()).toBeNull();

    const wrong = await signIn({ email: 'ana@exemplo.com', password: 'errada-123' });
    const unknown = await signIn({ email: 'nao@existe.com', password: PASSWORD });
    expect(wrong).toEqual({ ok: false, message: INVALID_CREDENTIALS });
    expect(unknown).toEqual({ ok: false, message: INVALID_CREDENTIALS });
    expect(activeUser()).toBeNull();

    const ok = await signIn({ email: ' ANA@exemplo.com', password: PASSWORD });
    expect(ok.ok).toBe(true);
    expect(activeUser()?.email).toBe('ana@exemplo.com');
  }, 30_000);

  it('a sessão persiste no localStorage (sobrevive a recarregar a página)', async () => {
    await signUp(form('ana@exemplo.com'));
    const session = ls.json(SESSION_KEY) as { userId: string };
    expect(session.userId).toBe(activeUser()?.id);
  }, 20_000);

  it('logout encerra a sessão, mas mantém os dados do perfil', async () => {
    await signUp(form('ana@exemplo.com'));
    const id = activeUser()!.id;
    goalsActions.create({
      name: 'Reserva',
      category: 'emergency',
      targetAmount: 1000,
      savedAmount: 0,
      deadline: '',
    });

    signOut();

    expect(ls.raw(SESSION_KEY)).toBe('null');
    expect(goalsStore.read()).toEqual([]);
    expect(ls.json(profileKey(id, 'poupeai-goals'))).toHaveLength(1);
  }, 20_000);

  it('ignora sessão que aponta para um perfil inexistente', () => {
    stubLocalStorage({ [SESSION_KEY]: { userId: 'forjado', startedAt: '2026-01-01' } });
    expect(activeUser()).toBeNull();
    expect(goalsStore.key).toBeNull();
  });
});

describe('isolamento entre perfis do mesmo navegador', () => {
  it('cada perfil só enxerga os próprios dados', async () => {
    await signUp(form('ana@exemplo.com'));
    goalsActions.create({
      name: 'Meta da Ana',
      category: 'travel',
      targetAmount: 5000,
      savedAmount: 0,
      deadline: '',
    });
    simulationStore.write([{ id: 'sim-ana' }]);
    signOut();

    await signUp(form('bia@exemplo.com', { name: 'Bia Demo' }));
    expect(goalsStore.read()).toEqual([]);
    expect(simulationStore.read()).toEqual([]);
    expect(profileStore.read().name).toBe('Bia Demo');
    signOut();

    await signIn({ email: 'ana@exemplo.com', password: PASSWORD });
    expect(goalsStore.read().map((goal) => goal.name)).toEqual(['Meta da Ana']);
    expect(simulationStore.read()).toEqual([{ id: 'sim-ana' }]);
  }, 40_000);

  it('sem sessão nada é lido nem gravado', () => {
    expect(goalsStore.read()).toEqual([]);
    expect(() => goalsStore.write([])).toThrow(NoActiveKeyError);
  });
});

describe('redirecionamento após login', () => {
  it.each([
    [{ from: { pathname: '/metas', search: '?nova=1', hash: '' } }, '/metas?nova=1'],
    [null, '/'],
    [{ from: { pathname: '//site-malicioso.com' } }, '/'],
    [{ from: { pathname: 'https://site-malicioso.com' } }, '/'],
  ])('%j → %s', (state, expected) => {
    expect(redirectTarget(state)).toBe(expected);
  });
});
