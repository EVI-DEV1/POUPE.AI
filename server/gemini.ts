/**
 * Proxy do Gemini executado no servidor (Vercel Function em produção,
 * middleware do Vite em desenvolvimento). A chave da API nunca chega ao
 * navegador.
 *
 * Variável de ambiente: GEMINI_API_KEY
 * (por compatibilidade com deploys antigos, VITE_GEMINI_API_KEY também é
 * aceita — mas apenas aqui, no servidor; o código do navegador não a referencia.)
 *
 * Camadas de proteção, em ordem:
 * 1. Método (POST) e origem (mesmo domínio ou ALLOWED_ORIGINS);
 * 2. Rate limiting por IP (memória da instância — ver `RateLimiter`);
 * 3. Content-Type, tamanho do corpo e do prompt;
 * 4. Timeout da chamada ao Gemini;
 * 5. Erros do provedor traduzidos para códigos próprios — o corpo de erro do
 *    Google nunca é repassado ao navegador.
 *
 * Logs: apenas código do erro e status. Nunca prompt, chave, IP ou resposta.
 */

export const GEMINI_MODEL = 'gemini-2.5-flash';

/** Maior prompt legítimo do app (contexto + histórico do chat) fica bem abaixo disso. */
export const MAX_PROMPT_LENGTH = 30_000;
/** Corpo JSON: prompt com acentos/escapes pode ocupar até ~4 bytes por caractere. */
export const MAX_BODY_BYTES = 128 * 1024;
const UPSTREAM_TIMEOUT_MS = 55_000;

export type GeminiErrorCode =
  | 'method_not_allowed'
  | 'forbidden_origin'
  | 'rate_limited'
  | 'invalid_content_type'
  | 'payload_too_large'
  | 'invalid_json'
  | 'invalid_prompt'
  | 'missing_api_key'
  | 'upstream_auth'
  | 'upstream_rejected'
  | 'upstream_rate_limited'
  | 'upstream_unavailable'
  | 'upstream_timeout'
  | 'upstream_unreachable'
  | 'upstream_error';

export interface ProxyResult {
  status: number;
  body: string;
  headers?: Record<string, string>;
}

type Env = Record<string, string | undefined>;

const error = (
  status: number,
  code: GeminiErrorCode,
  headers?: Record<string, string>
): ProxyResult => {
  // Somente metadados não sensíveis.
  console.warn(`[api/gemini] ${status} ${code}`);
  return { status, body: JSON.stringify({ error: code }), headers };
};

export function resolveApiKey(env: Env) {
  return env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '';
}

/* ------------------------------------------------------------------ */
/* Rate limiting                                                       */
/* ------------------------------------------------------------------ */

interface RateWindow {
  limit: number;
  ms: number;
}

/**
 * Janelas fixas em memória, por cliente.
 *
 * Em funções serverless a memória é por instância: o limite vale enquanto a
 * instância está viva (o Fluid Compute da Vercel reaproveita instâncias), mas
 * não é global. É uma proteção de melhor esforço; o limite global deve ser
 * configurado no Firewall da Vercel e na cota da chave no Google Cloud.
 */
export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }[]>();
  private readonly windows: RateWindow[];
  private readonly maxClients: number;

  constructor(windows: RateWindow[], maxClients = 5_000) {
    this.windows = windows;
    this.maxClients = maxClients;
  }

  /** Retorna `null` se permitido, ou os segundos até liberar. */
  check(clientId: string, now = Date.now()): number | null {
    if (this.hits.size > this.maxClients) this.prune(now);

    const state =
      this.hits.get(clientId) ?? this.windows.map((w) => ({ count: 0, resetAt: now + w.ms }));

    state.forEach((slot, index) => {
      if (now >= slot.resetAt) {
        slot.count = 0;
        slot.resetAt = now + this.windows[index].ms;
      }
    });

    const blocked = state.findIndex((slot, index) => slot.count >= this.windows[index].limit);
    if (blocked !== -1) {
      this.hits.set(clientId, state);
      return Math.max(1, Math.ceil((state[blocked].resetAt - now) / 1000));
    }

    state.forEach((slot) => slot.count++);
    this.hits.set(clientId, state);
    return null;
  }

  private prune(now: number) {
    for (const [key, state] of this.hits) {
      if (state.every((slot) => now >= slot.resetAt)) this.hits.delete(key);
    }
    // Se ainda estiver cheio (ataque com muitos IPs), descarta os mais antigos.
    const excess = this.hits.size - this.maxClients;
    if (excess > 0) {
      Array.from(this.hits.keys())
        .slice(0, excess)
        .forEach((key) => this.hits.delete(key));
    }
  }
}

const positiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const createRateLimiter = (env: Env) =>
  new RateLimiter([
    { limit: positiveInt(env.GEMINI_RATE_LIMIT_PER_MINUTE, 10), ms: 60_000 },
    { limit: positiveInt(env.GEMINI_RATE_LIMIT_PER_HOUR, 60), ms: 3_600_000 },
  ]);

/* ------------------------------------------------------------------ */
/* Requisição                                                          */
/* ------------------------------------------------------------------ */

export interface GeminiRequest {
  method: string;
  /** Lê um cabeçalho (nome em minúsculas). */
  header: (name: string) => string | null | undefined;
  /** IP do cliente informado pela plataforma. */
  clientIp: string | null;
  /** Lê o corpo; retorna `null` se ultrapassar `maxBytes`. */
  readBody: (maxBytes: number) => Promise<string | null>;
}

/** Origem permitida: o próprio domínio da requisição ou ALLOWED_ORIGINS. */
export function isAllowedOrigin(request: Pick<GeminiRequest, 'header'>, env: Env) {
  const origin = request.header('origin');
  if (!origin) return false;

  const host = request.header('x-forwarded-host') ?? request.header('host');
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  if (host && originHost === host) return true;

  const extra = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return extra.includes(origin.replace(/\/$/, ''));
}

const mapUpstreamError = (status: number, body: string): ProxyResult => {
  if (status === 401 || status === 403 || /API_KEY_INVALID|API key not valid/i.test(body)) {
    return error(502, 'upstream_auth');
  }
  if (status === 429) return error(429, 'upstream_rate_limited', { 'Retry-After': '60' });
  if (status >= 500) return error(503, 'upstream_unavailable');
  if (status === 400) return error(502, 'upstream_rejected');
  return error(502, 'upstream_error');
};

export interface HandlerOptions {
  env: Env;
  limiter: RateLimiter;
  fetchImpl?: typeof fetch;
}

export async function handleGeminiRequest(
  request: GeminiRequest,
  { env, limiter, fetchImpl = fetch }: HandlerOptions
): Promise<ProxyResult> {
  if (request.method !== 'POST') {
    return error(405, 'method_not_allowed', { Allow: 'POST' });
  }

  if (!isAllowedOrigin(request, env)) {
    return error(403, 'forbidden_origin');
  }

  const retryAfter = limiter.check(request.clientIp ?? 'unknown');
  if (retryAfter !== null) {
    return error(429, 'rate_limited', { 'Retry-After': String(retryAfter) });
  }

  if (!(request.header('content-type') ?? '').toLowerCase().startsWith('application/json')) {
    return error(400, 'invalid_content_type');
  }

  const declaredLength = Number(request.header('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return error(413, 'payload_too_large');
  }

  const rawBody = await request.readBody(MAX_BODY_BYTES);
  if (rawBody === null) {
    return error(413, 'payload_too_large');
  }

  let prompt: unknown;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    prompt =
      typeof parsed === 'object' && parsed !== null
        ? (parsed as { prompt?: unknown }).prompt
        : undefined;
  } catch {
    return error(400, 'invalid_json');
  }

  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT_LENGTH) {
    return error(400, 'invalid_prompt');
  }

  const apiKey = resolveApiKey(env);
  if (!apiKey) {
    return error(500, 'missing_api_key');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (cause) {
    const timedOut = cause instanceof DOMException && cause.name === 'TimeoutError';
    return timedOut ? error(504, 'upstream_timeout') : error(502, 'upstream_unreachable');
  }

  const body = await response.text().catch(() => '');
  if (!response.ok) {
    return mapUpstreamError(response.status, body);
  }

  return { status: 200, body };
}

/* ------------------------------------------------------------------ */
/* Adaptador Web (Request/Response) — usado pela Vercel Function        */
/* ------------------------------------------------------------------ */

async function readLimitedText(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/** IP do cliente atrás do proxy da Vercel (que sobrescreve esses cabeçalhos). */
const clientIpFrom = (header: (name: string) => string | null) =>
  header('x-vercel-forwarded-for')?.split(',')[0].trim() ||
  header('x-real-ip') ||
  header('x-forwarded-for')?.split(',')[0].trim() ||
  null;

export async function handleWebRequest(
  request: Request,
  options: HandlerOptions
): Promise<Response> {
  const header = (name: string) => request.headers.get(name);
  const result = await handleGeminiRequest(
    {
      method: request.method,
      header,
      clientIp: clientIpFrom(header),
      readBody: (maxBytes) => readLimitedText(request, maxBytes),
    },
    options
  );

  return new Response(result.body, {
    status: result.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...result.headers,
    },
  });
}
