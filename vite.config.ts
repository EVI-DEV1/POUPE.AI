import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { type Connect, defineConfig, loadEnv, type Plugin } from 'vite';

import { createRateLimiter, handleGeminiRequest } from './server/gemini';

/** Lê o corpo com limite de tamanho; `null` se ultrapassar. */
const readBody = (req: Connect.IncomingMessage, maxBytes: number) =>
  new Promise<string | null>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let exceeded = false;
    req.on('data', (chunk: Buffer) => {
      if (exceeded) return;
      total += chunk.length;
      if (total > maxBytes) {
        exceeded = true;
        resolve(null);
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => !exceeded && resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

/**
 * Reproduz a rota serverless `/api/gemini` durante o `vite dev` e o
 * `vite preview`, com as mesmas validações da produção, lendo a chave do .env
 * sem expô-la ao bundle do navegador.
 */
function geminiApiPlugin(env: Record<string, string | undefined>): Plugin {
  const limiter = createRateLimiter(env);

  const handler: Connect.NextHandleFunction = (req, res) => {
    const header = (name: string) => {
      const value = req.headers[name];
      return Array.isArray(value) ? value.join(', ') : (value ?? null);
    };

    void handleGeminiRequest(
      {
        method: req.method ?? 'GET',
        header,
        clientIp: req.socket.remoteAddress ?? null,
        readBody: (maxBytes) => readBody(req, maxBytes),
      },
      { env, limiter }
    )
      .catch(() => ({ status: 500, body: JSON.stringify({ error: 'upstream_error' }) }))
      .then((result) => {
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        Object.entries('headers' in result ? (result.headers ?? {}) : {}).forEach(([k, v]) =>
          res.setHeader(k, v)
        );
        res.end(result.body);
      });
  };

  return {
    name: 'poupeai-gemini-api',
    configureServer(server) {
      server.middlewares.use('/api/gemini', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/gemini', handler);
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss(), geminiApiPlugin(env)],
    resolve: {
      alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
    },
  };
});
