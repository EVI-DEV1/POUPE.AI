import path from 'path';
import { defineConfig } from 'vitest/config';

// Configuração própria para os testes: só o alias `@`, sem os plugins de dev
// (Tailwind, proxy do Gemini) do vite.config.ts.
export default defineConfig({
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
  },
});
