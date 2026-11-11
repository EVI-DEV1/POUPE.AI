/**
 * Proxy do Gemini executado no servidor (Vercel Function em produção,
 * middleware do Vite em desenvolvimento). A chave da API nunca chega ao
 * navegador.
 *
 * Variável de ambiente: GEMINI_API_KEY
 * (por compatibilidade com deploys antigos, VITE_GEMINI_API_KEY também é
 * aceita — mas apenas aqui, no servidor.)
 */

export const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_PROMPT_LENGTH = 30_000;

export interface ProxyResult {
  status: number;
  body: string;
}

const json = (status: number, payload: unknown): ProxyResult => ({
  status,
  body: JSON.stringify(payload),
});

export function resolveApiKey(env: Record<string, string | undefined>) {
  return env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '';
}

export async function proxyGemini(rawBody: unknown, apiKey: string): Promise<ProxyResult> {
  if (!apiKey) {
    return json(500, { error: 'missing_api_key' });
  }

  let prompt: unknown;
  try {
    prompt = (typeof rawBody === 'string' ? JSON.parse(rawBody) : (rawBody as { prompt?: unknown }))
      ?.prompt;
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT_LENGTH) {
    return json(400, { error: 'invalid_prompt' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    return { status: response.status, body: await response.text() };
  } catch {
    return json(502, { error: 'upstream_unreachable' });
  }
}
