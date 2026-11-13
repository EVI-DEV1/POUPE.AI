import { afterEach, describe, expect, it, vi } from 'vitest';

import { simulationStore } from '@/hooks/useSimulationStorage';
import { goalsStore, profileStore } from '@/stores';
import {
  activeProfileStorage,
  legacySimulation,
  stubLocalStorage,
  testUser,
  TEST_USER_ID,
} from '@/test/fixtures';

import {
  canImportLegacyData,
  dismissLegacyImport,
  importLegacyData,
  LEGACY_CLAIM_KEY,
  readLegacyClaim,
  shouldOfferLegacyImport,
  summarizeLegacyData,
} from './legacyImport';
import { profileKey, USERS_KEY } from './session';

/** Dados salvos antes dos perfis demonstrativos (chaves "soltas"). */
const legacyData = () => ({
  'simulation-data': [legacySimulation('legacy-1'), null, { id: 'incompleto' }],
  'poupeai-goals': [{ id: 'g1', name: 'Reserva', targetAmount: 1000, savedAmount: 200 }],
  'poupeai-planning': {
    currentBalance: 500,
    balanceUpdatedAt: null,
    months: [{ month: '2026-10' }],
  },
  'poupeai-assistant-chat': [{ id: 'm1', role: 'user', content: 'Olá' }],
  'poupeai-profile': { name: 'Nome antigo', avatarColor: '#EC4899', avatarImage: null },
});

const setup = (profileData: Record<string, unknown> = {}) =>
  stubLocalStorage({
    ...legacyData(),
    ...activeProfileStorage({ 'poupeai-profile': { name: 'Ana' }, ...profileData }),
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('importação dos dados antigos', () => {
  it('resume os dados encontrados (só registros válidos de simulação)', () => {
    setup();
    expect(summarizeLegacyData()).toEqual({
      simulations: 1,
      goals: 1,
      months: 1,
      chatMessages: 1,
      total: 4,
    });
    expect(shouldOfferLegacyImport(TEST_USER_ID)).toBe(true);
  });

  it('não oferece nada quando não há dados antigos', () => {
    stubLocalStorage(activeProfileStorage());
    expect(shouldOfferLegacyImport(TEST_USER_ID)).toBe(false);
    expect(canImportLegacyData()).toBe(false);
  });

  it('copia para o perfil e não altera nem apaga as chaves originais', () => {
    const ls = setup();
    const before = Object.keys(legacyData()).map((key) => ls.raw(key));

    const result = importLegacyData(TEST_USER_ID);

    expect(result.copied.sort()).toEqual(
      ['assistantChat', 'goals', 'planning', 'profile', 'simulations'].sort()
    );
    expect(Object.keys(legacyData()).map((key) => ls.raw(key))).toEqual(before);

    // Cópia literal, inclusive registros incompletos.
    expect(ls.raw(profileKey(TEST_USER_ID, 'simulation-data'))).toBe(ls.raw('simulation-data'));
    expect(simulationStore.read()).toHaveLength(3);
    expect(goalsStore.read().map((goal) => goal.name)).toEqual(['Reserva']);
    // Mantém o nome do cadastro e traz a cor do perfil antigo.
    expect(profileStore.read()).toEqual(
      expect.objectContaining({ name: 'Ana', avatarColor: '#EC4899' })
    );
  });

  it('não sobrescreve dados que o perfil já tinha', () => {
    setup({
      'poupeai-goals': [{ id: 'nova', name: 'Meta nova', targetAmount: 1, savedAmount: 0 }],
    });

    const result = importLegacyData(TEST_USER_ID);

    expect(result.kept).toContain('goals');
    expect(goalsStore.read().map((goal) => goal.name)).toEqual(['Meta nova']);
  });

  it('só um perfil pode importar: outro perfil não recebe os dados por engano', () => {
    const ls = setup();
    importLegacyData(TEST_USER_ID);
    expect(readLegacyClaim()?.userId).toBe(TEST_USER_ID);

    // Segundo perfil no mesmo navegador.
    const other = 'outro-perfil';
    const users = [...(ls.json(USERS_KEY) as unknown[]), testUser(other)];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    expect(shouldOfferLegacyImport(other)).toBe(false);
    expect(canImportLegacyData()).toBe(false);
    expect(() => importLegacyData(other)).toThrow(/já foram importados/);
    expect(ls.raw(profileKey(other, 'simulation-data'))).toBeNull();
    expect(ls.raw(LEGACY_CLAIM_KEY)).toContain(TEST_USER_ID);
  });

  it('"Agora não" vale só para o perfil que recusou', () => {
    setup();
    dismissLegacyImport(TEST_USER_ID);

    expect(shouldOfferLegacyImport(TEST_USER_ID)).toBe(false);
    expect(shouldOfferLegacyImport('outro-perfil')).toBe(true);
    // Ainda é possível importar depois, em Preferências.
    expect(canImportLegacyData()).toBe(true);
  });
});
