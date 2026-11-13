import { activeProfileKey, PROFILE_DATA_KEYS, PROFILE_SCOPE_DEPENDENCIES } from '@/auth/session';
import { type SimulationFormData, type SimulationRecord } from '@/data/simulation';
import { createLocalStore, isRecord, useLocalStore } from '@/lib/localStore';
import { readSimulations } from '@/utils/simulationRecords';

/**
 * Mesmo formato de dados da versão anterior, agora em uma chave por perfil
 * demonstrativo. A chave antiga (`simulation-data`) não é alterada: seus
 * registros podem ser copiados para um perfil (ver auth/legacyImport.ts).
 *
 * O store guarda o array bruto (`unknown[]`): as escritas operam sobre ele, então
 * registros antigos ou incompletos nunca são descartados do localStorage. A UI
 * consome apenas a visão validada de `readSimulations`.
 */
const EMPTY: unknown[] = [];

export const simulationStore = createLocalStore<unknown[]>(
  () => activeProfileKey(PROFILE_DATA_KEYS.simulations),
  EMPTY,
  (value) => (Array.isArray(value) ? value : EMPTY),
  PROFILE_SCOPE_DEPENDENCIES
);

const isSimulation = (record: unknown, id: string) => isRecord(record) && record.id === id;

const saveFormData = (formData: SimulationFormData) => {
  const id = crypto.randomUUID();
  const record: SimulationRecord = {
    ...formData,
    id,
    createdAt: new Date().toISOString(),
  };

  simulationStore.write((saved) => [...saved, record]);
  return id;
};

const getAllSimulations = () => readSimulations(simulationStore.read());

const getFormData = (id: string) => getAllSimulations().find((record) => record.id === id) ?? null;

const updateSimulation = (id: string, data: SimulationRecord) => {
  simulationStore.write((saved) =>
    saved.map((record) => {
      if (!isRecord(record) || record.id !== id) return record;
      // A data de criação não é editável: mantém o valor original gravado,
      // inclusive quando ausente (registros antigos).
      return 'createdAt' in record ? { ...data, createdAt: record.createdAt } : { ...data };
    })
  );
};

const deleteSimulation = (id: string) => {
  simulationStore.write((saved) => saved.filter((record) => !isSimulation(record, id)));
};

const storageApi = {
  saveFormData,
  getFormData,
  getAllSimulations,
  updateSimulation,
  deleteSimulation,
};

/** API imperativa (estável entre renders) — mesma assinatura da versão original. */
export const useSimulationStorage = () => storageApi;

/** Lista reativa e validada de simulações: re-renderiza quando o histórico muda. */
export const useSimulations = () => readSimulations(useLocalStore(simulationStore));
