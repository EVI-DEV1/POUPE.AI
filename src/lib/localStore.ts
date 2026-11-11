import { useSyncExternalStore } from 'react';

type Listener = () => void;
type Updater<T> = T | ((previous: T) => T);

export interface LocalStore<T> {
  key: string;
  read: () => T;
  write: (next: Updater<T>) => void;
  subscribe: (listener: Listener) => () => void;
}

/**
 * Pequeno store reativo sobre o localStorage.
 *
 * - Mantém o snapshot em cache enquanto o valor bruto não muda (exigência do
 *   `useSyncExternalStore`).
 * - Notifica todos os componentes inscritos quando algo é gravado, inclusive em
 *   outras abas (evento `storage`).
 * - Nunca lança erro na leitura: dados corrompidos ou acesso bloqueado ao
 *   storage resultam no valor padrão.
 */
export function createLocalStore<T>(
  key: string,
  fallback: T,
  normalize?: (value: unknown) => T
): LocalStore<T> {
  let cachedRaw: string | null | undefined;
  let cachedValue: T = fallback;
  const listeners = new Set<Listener>();

  const read = (): T => {
    let raw: string | null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      raw = null;
    }

    if (raw === cachedRaw) {
      return cachedValue;
    }

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

  const write = (next: Updater<T>) => {
    const value = typeof next === 'function' ? (next as (previous: T) => T)(read()) : next;

    localStorage.setItem(key, JSON.stringify(value));
    notify();
  };

  const subscribe = (listener: Listener) => {
    listeners.add(listener);

    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        listener();
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  };

  return { key, read, write, subscribe };
}

export function useLocalStore<T>(store: LocalStore<T>) {
  return useSyncExternalStore(store.subscribe, store.read, store.read);
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
