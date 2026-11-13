import { useSyncExternalStore } from 'react';

type Listener = () => void;
type Updater<T> = T | ((previous: T) => T);

/**
 * Chave no localStorage. Uma função permite chaves dinâmicas (por exemplo,
 * por perfil); `null` significa "sem chave ativa": a leitura devolve o valor
 * padrão e a gravação é recusada.
 */
export type StoreKey = string | (() => string | null);

export interface Subscribable {
  subscribe: (listener: Listener) => () => void;
}

export interface LocalStore<T> extends Subscribable {
  /** Chave em uso agora (`null` sem chave ativa). */
  readonly key: string | null;
  read: () => T;
  write: (next: Updater<T>) => void;
}

/** Funções de notificação de todos os stores criados (ver `notifyAllStores`). */
const allNotifiers = new Set<() => void>();

/**
 * Avisa todos os stores para relerem o localStorage. Usado quando várias chaves
 * são gravadas diretamente de uma vez (ex.: importação de dados antigos).
 */
export const notifyAllStores = () => allNotifiers.forEach((notify) => notify());

export class NoActiveKeyError extends Error {
  constructor() {
    super('Nenhum perfil ativo: os dados não podem ser gravados.');
    this.name = 'NoActiveKeyError';
  }
}

/**
 * Pequeno store reativo sobre o localStorage.
 *
 * - Mantém o snapshot em cache enquanto a chave e o valor bruto não mudam
 *   (exigência do `useSyncExternalStore`).
 * - Notifica todos os componentes inscritos quando algo é gravado, inclusive em
 *   outras abas (evento `storage`).
 * - Nunca lança erro na leitura: dados corrompidos ou acesso bloqueado ao
 *   storage resultam no valor padrão.
 * - `dependsOn`: stores dos quais a chave depende (ex.: a sessão). Quando eles
 *   mudam, este store também notifica, pois passou a apontar para outra chave.
 */
export function createLocalStore<T>(
  key: StoreKey,
  fallback: T,
  normalize?: (value: unknown) => T,
  dependsOn: Subscribable[] = []
): LocalStore<T> {
  const resolveKey = typeof key === 'function' ? key : () => key;
  let cachedKey: string | null | undefined;
  let cachedRaw: string | null | undefined;
  let cachedValue: T = fallback;
  const listeners = new Set<Listener>();

  const read = (): T => {
    const currentKey = resolveKey();
    let raw: string | null = null;
    if (currentKey !== null) {
      try {
        raw = localStorage.getItem(currentKey);
      } catch {
        raw = null;
      }
    }

    if (currentKey === cachedKey && raw === cachedRaw) {
      return cachedValue;
    }

    cachedKey = currentKey;
    cachedRaw = raw;

    if (raw === null) {
      cachedValue = fallback;
      return cachedValue;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      cachedValue = normalize ? normalize(parsed) : (parsed as T);
    } catch {
      cachedValue = fallback;
    }

    return cachedValue;
  };

  const notify = () => listeners.forEach((listener) => listener());
  allNotifiers.add(notify);

  const write = (next: Updater<T>) => {
    const currentKey = resolveKey();
    if (currentKey === null) {
      throw new NoActiveKeyError();
    }

    const value = typeof next === 'function' ? (next as (previous: T) => T)(read()) : next;

    localStorage.setItem(currentKey, JSON.stringify(value));
    notify();
  };

  const subscribe = (listener: Listener) => {
    listeners.add(listener);

    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === resolveKey()) {
        listener();
      }
    };

    window.addEventListener('storage', onStorage);
    const unsubscribers = dependsOn.map((store) => store.subscribe(listener));

    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  };

  return {
    get key() {
      return resolveKey();
    },
    read,
    write,
    subscribe,
  };
}

export function useLocalStore<T>(store: LocalStore<T>) {
  return useSyncExternalStore(store.subscribe, store.read, store.read);
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
