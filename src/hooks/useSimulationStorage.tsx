import { type SimulationFormData, type SimulationRecord } from '@/data/simulation';
import { createLocalStore, isRecord, useLocalStore } from '@/lib/localStore';
import { readSimulations } from '@/utils/simulationRecords';

/**
 * Mantém a mesma chave e o mesmo formato de dados da versão anterior,
 * preservando todo o histórico já salvo pelos usuários.
 *
 * O store guarda o array bruto (`unknown[]`): as escritas operam sobre ele, então
 * registros antigos ou incompletos nunca são descartados do localStorage. A UI
 * consome apenas a visão validada de `readSimulations`.
 */
const LOCAL_STORAGE_KEY = 'simulation-data';

const EMPTY: unknown[] = [];

export const simulationStore = createLocalStore<unknown[]>(LOCAL_STORAGE_KEY, EMPTY, (value) =>
  Array.isArray(value) ? value : EMPTY
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
