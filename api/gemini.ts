// A extensão `.js` é obrigatória: com "type": "module", a Vercel transpila cada
// arquivo separadamente e o Node ESM não resolve imports sem extensão.
import { createRateLimiter, handleWebRequest } from '../server/gemini.js';

// Criado no escopo do módulo para ser reaproveitado entre invocações da mesma instância.
const limiter = createRateLimiter(process.env);

/** Vercel Function: POST /api/gemini  { prompt: string } */
export function POST(request: Request) {
  return handleWebRequest(request, { env: process.env, limiter });
}

/** Demais métodos respondem 405 com o mesmo formato de erro. */
export const GET = POST;
export const PUT = POST;
export const PATCH = POST;
export const DELETE = POST;
