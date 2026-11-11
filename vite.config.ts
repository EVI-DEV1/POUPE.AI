import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { type Connect, defineConfig, loadEnv, type Plugin } from 'vite';

import { proxyGemini, resolveApiKey } from './server/gemini';

/**
 * Reproduz a rota serverless `/api/gemini` durante o `vite dev` e o
 * `vite preview`, lendo a chave do .env sem expô-la ao bundle do navegador.
 */
function geminiApiPlugin(apiKey: string): Plugin {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    if (req.method !== 'POST') {
      next();
      return;
    }

    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      void proxyGemini(body, apiKey).then((result) => {
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(result.body);
      });
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
    plugins: [react(), tailwindcss(), geminiApiPlugin(resolveApiKey(env))],
    resolve: {
      alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
    },
  };
});
