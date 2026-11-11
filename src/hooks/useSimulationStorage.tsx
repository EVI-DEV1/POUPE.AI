import { type SimulationFormData, type SimulationRecord } from '@/data/simulation';
import { createLocalStore, useLocalStore } from '@/lib/localStore';

/**
 * Mantém a mesma chave e o mesmo formato de dados da versão anterior,
 * preservando todo o histórico já salvo pelos usuários.
 */
const LOCAL_STORAGE_KEY = 'simulation-data';

const EMPTY: SimulationRecord[] = [];

export const simulationStore = createLocalStore<SimulationRecord[]>(
  LOCAL_STORAGE_KEY,
  EMPTY,
  (value) => (Array.isArray(value) ? (value as SimulationRecord[]) : EMPTY)
);

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

const getFormData = (id: string) =>
  simulationStore.read().find((record) => record.id === id) ?? null;

const updateSimulation = (id: string, data: SimulationRecord) => {
  simulationStore.write((saved) =>
    saved.map((record) => (record.id === id ? { ...data } : record))
  );
};

const getAllSimulations = () => simulationStore.read();

const deleteSimulation = (id: string) => {
  simulationStore.write((saved) => saved.filter((record) => record.id !== id));
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

/** Lista reativa de simulações: re-renderiza quando o histórico muda. */
export const useSimulations = () => useLocalStore(simulationStore);
