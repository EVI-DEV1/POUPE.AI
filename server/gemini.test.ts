import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createRateLimiter,
  handleGeminiRequest,
  handleWebRequest,
  MAX_BODY_BYTES,
  MAX_PROMPT_LENGTH,
  RateLimiter,
  type GeminiRequest,
} from './gemini.js';

const KEY = 'test-key-AIzaSECRET';
const ENV = { GEMINI_API_KEY: KEY };
const ORIGIN = 'https://poupe.example.com';

const okResponse = () =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'oi' }] } }] }), {
    status: 200,
  });

function makeRequest(overrides: Partial<GeminiRequest> & { body?: string; headers?: object } = {}) {
  const headers: Record<string, string> = {
    origin: ORIGIN,
    host: 'poupe.example.com',
    'content-type': 'application/json',
    ...(overrides.headers as Record<string, string>),
  };
  const body = overrides.body ?? JSON.stringify({ prompt: 'Olá' });
  return {
    method: 'POST',
    header: (name: string) => headers[name] ?? null,
    clientIp: '203.0.113.1',
    readBody: async (max: number) => (Buffer.byteLength(body) > max ? null : body),
    ...overrides,
  } satisfies GeminiRequest;
}

const run = (
  request: GeminiRequest,
  fetchImpl: typeof fetch = vi.fn(async () => okResponse()),
  env: Record<string, string | undefined> = ENV
) => handleGeminiRequest(request, { env, limiter: createRateLimiter(env), fetchImpl });

const code = (body: string) => (JSON.parse(body) as { error: string }).error;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('validação da requisição', () => {
  it('aceita POST do mesmo domínio e repassa a resposta do Gemini', async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    const result = await run(makeRequest(), fetchImpl);

    expect(result.status).toBe(200);
    expect(JSON.parse(result.body).candidates[0].content.parts[0].text).toBe('oi');
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe(KEY);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('405 para métodos diferentes de POST', async () => {
    const result = await run(makeRequest({ method: 'GET' }));
    expect([result.status, code(result.body)]).toEqual([405, 'method_not_allowed']);
  });

  it.each([
    ['sem Origin', { origin: undefined }],
    ['de outro site', { origin: 'https://malicioso.example' }],
    ['Origin inválido', { origin: 'not a url' }],
  ])('403 para requisição %s', async (_, headers) => {
    const result = await run(makeRequest({ headers }));
    expect([result.status, code(result.body)]).toEqual([403, 'forbidden_origin']);
  });

  it('aceita domínios extras em ALLOWED_ORIGINS', async () => {
    const env = { ...ENV, ALLOWED_ORIGINS: 'https://app.poupe.ai, https://outro.example/' };
    const result = await run(
      makeRequest({ headers: { origin: 'https://outro.example' } }),
      undefined,
      env
    );
    expect(result.status).toBe(200);
  });

  it('respeita x-forwarded-host (proxy da Vercel)', async () => {
    const result = await run(
      makeRequest({ headers: { host: 'interno', 'x-forwarded-host': 'poupe.example.com' } })
    );
    expect(result.status).toBe(200);
  });

  it('400 para Content-Type diferente de JSON', async () => {
    const result = await run(makeRequest({ headers: { 'content-type': 'text/plain' } }));
    expect([result.status, code(result.body)]).toEqual([400, 'invalid_content_type']);
  });

  it('413 pelo Content-Length declarado e pelo corpo real', async () => {
    const declared = await run(
      makeRequest({ headers: { 'content-length': String(MAX_BODY_BYTES + 1) } })
    );
    expect([declared.status, code(declared.body)]).toEqual([413, 'payload_too_large']);

    const real = await run(makeRequest({ body: 'x'.repeat(MAX_BODY_BYTES + 1) }));
    expect([real.status, code(real.body)]).toEqual([413, 'payload_too_large']);
  });

  it.each(['{', 'null', '"texto"'])('400 para JSON inválido ou sem objeto: %s', async (body) => {
    const result = await run(makeRequest({ body }));
    expect(result.status).toBe(400);
  });

  it.each([
    ['ausente', {}],
    ['vazio', { prompt: '   ' }],
    ['não texto', { prompt: 123 }],
    ['longo demais', { prompt: 'a'.repeat(MAX_PROMPT_LENGTH + 1) }],
  ])('400 para prompt %s', async (_, payload) => {
    const result = await run(makeRequest({ body: JSON.stringify(payload) }));
    expect([result.status, code(result.body)]).toEqual([400, 'invalid_prompt']);
  });

  it('500 quando a chave não está configurada (sem chamar o Gemini)', async () => {
    const fetchImpl = vi.fn(async () => okResponse());
    const result = await run(makeRequest(), fetchImpl, {});
    expect([result.status, code(result.body)]).toEqual([500, 'missing_api_key']);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('erros do Gemini', () => {
  const upstream = (status: number, body = '{}') =>
    vi.fn(async () => new Response(body, { status }));

  it.each([
    [
      400,
      '{"error":{"message":"API key not valid. Please pass a valid API key."}}',
      502,
      'upstream_auth',
    ],
    [401, '{}', 502, 'upstream_auth'],
    [403, '{}', 502, 'upstream_auth'],
    [400, '{"error":{"message":"Invalid argument"}}', 502, 'upstream_rejected'],
    [429, '{}', 429, 'upstream_rate_limited'],
    [500, '{}', 503, 'upstream_unavailable'],
    [503, '{}', 503, 'upstream_unavailable'],
    [404, '{}', 502, 'upstream_error'],
  ])('Gemini %i → %i %s', async (status, body, expectedStatus, expectedCode) => {
    const result = await run(makeRequest(), upstream(status, body));
    expect([result.status, code(result.body)]).toEqual([expectedStatus, expectedCode]);
  });

  it('nunca repassa o corpo de erro do Google ao navegador', async () => {
    const secret = '{"error":{"message":"detalhe interno do projeto 12345"}}';
    const result = await run(makeRequest(), upstream(400, secret));
    expect(result.body).not.toContain('12345');
  });

  it('504 em timeout e 502 se o Gemini estiver inacessível', async () => {
    const timeout = vi.fn(async () => {
      throw new DOMException('timeout', 'TimeoutError');
    });
    const offline = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    expect(code((await run(makeRequest(), timeout)).body)).toBe('upstream_timeout');
    expect((await run(makeRequest(), offline)).status).toBe(502);
  });
});

describe('rate limiting', () => {
  it('bloqueia após o limite por minuto e libera depois da janela', () => {
    const limiter = new RateLimiter([{ limit: 2, ms: 60_000 }]);
    expect(limiter.check('ip', 0)).toBeNull();
    expect(limiter.check('ip', 1)).toBeNull();
    expect(limiter.check('ip', 2)).toBe(60);
    expect(limiter.check('outro-ip', 2)).toBeNull();
    expect(limiter.check('ip', 60_000)).toBeNull();
  });

  it('aplica também o limite por hora', () => {
    const limiter = new RateLimiter([
      { limit: 10, ms: 60_000 },
      { limit: 3, ms: 3_600_000 },
    ]);
    [0, 61_000, 122_000].forEach((t) => expect(limiter.check('ip', t)).toBeNull());
    expect(limiter.check('ip', 183_000)).toBeGreaterThan(60);
  });

  it('limita o número de clientes guardados em memória', () => {
    const limiter = new RateLimiter([{ limit: 1, ms: 60_000 }], 10);
    for (let i = 0; i < 1_000; i++) limiter.check(`ip-${i}`, 0);
    expect((limiter as unknown as { hits: Map<string, unknown> }).hits.size).toBeLessThanOrEqual(
      11
    );
  });

  it('responde 429 com Retry-After e não chama o Gemini', async () => {
    const env = { ...ENV, GEMINI_RATE_LIMIT_PER_MINUTE: '1' };
    const limiter = createRateLimiter(env);
    const fetchImpl = vi.fn(async () => okResponse());

    await handleGeminiRequest(makeRequest(), { env, limiter, fetchImpl });
    const blocked = await handleGeminiRequest(makeRequest(), { env, limiter, fetchImpl });

    expect([blocked.status, code(blocked.body)]).toEqual([429, 'rate_limited']);
    expect(Number(blocked.headers?.['Retry-After'])).toBeGreaterThan(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('logs e adaptador Web', () => {
  it('não registra prompt, chave nem IP nos logs', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const prompt = 'minha renda é 5000 e meu CPF é 000';
    await run(
      makeRequest({ body: JSON.stringify({ prompt }) }),
      vi.fn(async () => new Response('{}', { status: 401 }))
    );
    await run(makeRequest({ headers: { origin: 'https://x.example' } }));

    const logged = warn.mock.calls.flat().join(' ');
    expect(logged).toContain('upstream_auth');
    expect(logged).not.toContain(KEY);
    expect(logged).not.toContain('CPF');
    expect(logged).not.toContain('203.0.113.1');
  });

  it('handleWebRequest lê o IP da Vercel, limita o corpo e define cabeçalhos', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const env = { ...ENV, GEMINI_RATE_LIMIT_PER_MINUTE: '1' };
    const limiter = createRateLimiter(env);
    const fetchImpl = vi.fn(async () => okResponse());
    const request = (ip: string, body = JSON.stringify({ prompt: 'oi' })) =>
      new Request('https://poupe.example.com/api/gemini', {
        method: 'POST',
        headers: {
          origin: ORIGIN,
          host: 'poupe.example.com',
          'content-type': 'application/json',
          'x-vercel-forwarded-for': ip,
        },
        body,
      });

    const first = await handleWebRequest(request('198.51.100.1'), { env, limiter, fetchImpl });
    expect(first.status).toBe(200);
    expect(first.headers.get('cache-control')).toBe('no-store');

    const sameIp = await handleWebRequest(request('198.51.100.1'), { env, limiter, fetchImpl });
    expect(sameIp.status).toBe(429);
    expect(sameIp.headers.get('retry-after')).toBeTruthy();

    const big = await handleWebRequest(request('198.51.100.2', 'x'.repeat(MAX_BODY_BYTES + 10)), {
      env,
      limiter,
      fetchImpl,
    });
    expect(big.status).toBe(413);
  });
});
