import type { PasswordRecord } from './session';

/**
 * Derivação de senha com PBKDF2-SHA256 (Web Crypto), sal aleatório por perfil
 * e 600 mil iterações (mínimo recomendado pela OWASP para PBKDF2-SHA256).
 *
 * Evita guardar a senha em texto puro ou um hash simples. Ainda assim, como
 * tudo fica no navegador, isto NÃO transforma o login demonstrativo em
 * autenticação segura — apenas não expõe a senha digitada.
 */
export const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    material,
    HASH_BITS
  );
  return new Uint8Array(bits);
}

export async function hashPassword(
  password: string,
  iterations = PBKDF2_ITERATIONS
): Promise<PasswordRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, iterations);
  return { algorithm: 'PBKDF2-SHA256', iterations, salt: toBase64(salt), hash: toBase64(hash) };
}

/** Comparação em tempo constante (não para no primeiro byte diferente). */
function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

export async function verifyPassword(password: string, record: PasswordRecord) {
  try {
    const expected = fromBase64(record.hash);
    const actual = await derive(password, fromBase64(record.salt), record.iterations);
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}
