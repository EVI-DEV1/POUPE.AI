import { isRecord, notifyAllStores } from '@/lib/localStore';
import { readSimulations } from '@/utils/simulationRecords';

import { PROFILE_DATA_KEYS, profileKey } from './session';

/**
 * Dados salvos antes do login demonstrativo ficam nas chaves "soltas"
 * (`simulation-data`, `poupeai-goals`...). Eles NUNCA são alterados ou apagados.
 *
 * Após o login, o perfil pode copiá-los para as próprias chaves. Para que outro
 * perfil do mesmo navegador não receba esses registros por engano, só um perfil
 * pode importá-los; a escolha fica registrada em `LEGACY_CLAIM_KEY`.
 */
export const LEGACY_CLAIM_KEY = 'poupeai-legacy-import';
const DISMISSED_BASE = 'poupeai-legacy-import-dismissed';

type DataName = keyof typeof PROFILE_DATA_KEYS;

export interface LegacySummary {
  simulations: number;
  goals: number;
  months: number;
  chatMessages: number;
  total: number;
}

export interface LegacyClaim {
  userId: string;
  importedAt: string;
}

export interface ImportResult {
  copied: DataName[];
  /** Dados que o perfil já tinha — mantidos, sem sobrescrever. */
  kept: DataName[];
}

const readJson = (key: string): unknown => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
};

const arrayLength = (value: unknown) => (Array.isArray(value) ? value.length : 0);

export function summarizeLegacyData(): LegacySummary {
  const simulations = readJson(PROFILE_DATA_KEYS.simulations);
  const planning = readJson(PROFILE_DATA_KEYS.planning);
  const summary = {
    simulations: Array.isArray(simulations) ? readSimulations(simulations).length : 0,
    goals: arrayLength(readJson(PROFILE_DATA_KEYS.goals)),
    months: isRecord(planning) ? arrayLength(planning.months) : 0,
    chatMessages: arrayLength(readJson(PROFILE_DATA_KEYS.assistantChat)),
  };
  return {
    ...summary,
    total: summary.simulations + summary.goals + summary.months + summary.chatMessages,
  };
}

export const readLegacyClaim = (): LegacyClaim | null => {
  const value = readJson(LEGACY_CLAIM_KEY);
  return isRecord(value) && typeof value.userId === 'string' && typeof value.importedAt === 'string'
    ? { userId: value.userId, importedAt: value.importedAt }
    : null;
};

export const isLegacyImportDismissed = (userId: string) =>
  readJson(profileKey(userId, DISMISSED_BASE)) === true;

/** Oferece a importação: há dados antigos, ninguém os importou e o perfil não recusou. */
export const shouldOfferLegacyImport = (userId: string) =>
  readLegacyClaim() === null && !isLegacyImportDismissed(userId) && summarizeLegacyData().total > 0;

/** Ainda é possível importar (mesmo que o perfil tenha recusado o aviso antes). */
export const canImportLegacyData = () =>
  readLegacyClaim() === null && summarizeLegacyData().total > 0;

export function dismissLegacyImport(userId: string) {
  localStorage.setItem(profileKey(userId, DISMISSED_BASE), 'true');
  notifyAllStores();
}

/** O destino está vazio? Só então os dados antigos são copiados para ele. */
const isEmptyTarget = (name: DataName, value: unknown) => {
  if (value === null) return true;
  if (name === 'planning') {
    return !isRecord(value) || (arrayLength(value.months) === 0 && value.currentBalance == null);
  }
  if (name === 'profile') return false; // tratado à parte (mescla)
  return arrayLength(value) === 0;
};

/**
 * Copia os dados antigos para o perfil. Não sobrescreve dados que o perfil já
 * tenha e não altera as chaves originais.
 */
export function importLegacyData(userId: string): ImportResult {
  if (readLegacyClaim() !== null) {
    throw new Error('Os dados antigos deste navegador já foram importados por um perfil.');
  }

  const result: ImportResult = { copied: [], kept: [] };

  (Object.keys(PROFILE_DATA_KEYS) as DataName[]).forEach((name) => {
    const legacyKey = PROFILE_DATA_KEYS[name];
    const raw = localStorage.getItem(legacyKey);
    if (raw === null) return;

    const target = profileKey(userId, legacyKey);

    if (name === 'profile') {
      // Mantém o nome do cadastro; traz foto e cor do perfil antigo.
      const legacy = readJson(legacyKey);
      if (!isRecord(legacy)) return;
      const current = readJson(target);
      const currentName = isRecord(current) && typeof current.name === 'string' ? current.name : '';
      localStorage.setItem(
        target,
        JSON.stringify({ ...legacy, name: currentName || legacy.name || '' })
      );
      result.copied.push(name);
      return;
    }

    if (!isEmptyTarget(name, readJson(target))) {
      result.kept.push(name);
      return;
    }

    // Cópia literal: registros antigos ou incompletos são preservados como estão.
    localStorage.setItem(target, raw);
    result.copied.push(name);
  });

  const claim: LegacyClaim = { userId, importedAt: new Date().toISOString() };
  localStorage.setItem(LEGACY_CLAIM_KEY, JSON.stringify(claim));
  notifyAllStores();
  return result;
}
