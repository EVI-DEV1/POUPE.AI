import { proxyGemini, resolveApiKey } from '../server/gemini';

/** Vercel Function: POST /api/gemini  { prompt: string } */
export async function POST(request: Request) {
  const result = await proxyGemini(await request.text(), resolveApiKey(process.env));

  return new Response(result.body, {
    status: result.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
