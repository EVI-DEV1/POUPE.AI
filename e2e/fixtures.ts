import { expect, test as base, type Page, type Route } from '@playwright/test';

/** Resposta no formato da API do Gemini, contendo o texto informado. */
export const geminiText = (text: string) => ({
  candidates: [{ content: { parts: [{ text }] } }],
});

export const INSIGHT = {
  feasibility: { status: 'needs_adjustment', content: 'A meta está quase cabendo no orçamento.' },
  diagnosis: { content: 'Diagnóstico de teste gerado pelo mock.' },
  suggestions: { items: ['Reduzir gastos com delivery'] },
  extraIncome: { items: ['Vender itens parados'] },
  investment: { items: ['Tesouro Selic'] },
  motivation: { content: 'Você está no caminho certo!' },
};

type GeminiHandler = (prompt: string, route: Route) => Promise<void> | void;

/** Perfil demonstrativo usado pelos testes que já começam logados. */
export const E2E_USER = { id: 'e2e-perfil', name: 'Perfil E2E', email: 'e2e@exemplo.com' };

/** Mesmo formato de `profileKey` em src/auth/session.ts. */
export const profileKey = (base: string, userId = E2E_USER.id) =>
  `poupeai:perfil:${userId}:${base}`;

interface Options {
  /** `true` (padrão): o teste começa com o perfil E2E logado. */
  authenticated: boolean;
}

interface Fixtures {
  /** Prompts enviados a /api/gemini durante o teste. */
  geminiPrompts: string[];
  /** Define como /api/gemini responde (padrão: insight válido). */
  mockGemini: (handler: GeminiHandler) => void;
  /** Cria a sessão do perfil E2E antes do app carregar (quando `authenticated`). */
  demoSession: void;
  /** Grava dados do perfil E2E (nomes-base, ex.: `simulation-data`) antes do app carregar. */
  seedStorage: (data: Record<string, unknown>) => Promise<void>;
  /** Grava dados nas chaves antigas, de antes dos perfis demonstrativos. */
  seedLegacy: (data: Record<string, unknown>) => Promise<void>;
}

/** Grava entradas no localStorage só na primeira carga: recarregar não sobrescreve o app. */
const seedOnce = (page: Page, flag: string, entries: Record<string, unknown>) =>
  page.addInitScript(
    ({ flag, entries }) => {
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, '1');
      Object.entries(entries).forEach(([key, value]) =>
        localStorage.setItem(key, JSON.stringify(value))
      );
    },
    { flag, entries }
  );

/**
 * Teste base:
 * - intercepta /api/gemini (nenhuma chamada real ao Google);
 * - começa com um perfil demonstrativo logado (desligue com `authenticated: false`);
 * - falha se a página lançar qualquer erro de JavaScript ou erro de console.
 */
export const test = base.extend<Fixtures & Options>({
  authenticated: [true, { option: true }],

  geminiPrompts: async ({}, use) => {
    await use([]);
  },

  demoSession: [
    async ({ page, authenticated }, use) => {
      if (authenticated) {
        await seedOnce(page, '__session', {
          'poupeai-demo-users': [
            {
              ...E2E_USER,
              // Registro fictício: estes testes não fazem login pela tela.
              password: { algorithm: 'PBKDF2-SHA256', iterations: 1, salt: 'AA==', hash: 'AA==' },
              createdAt: '2026-11-01T00:00:00.000Z',
            },
          ],
          'poupeai-demo-session': { userId: E2E_USER.id, startedAt: '2026-11-01T00:00:00.000Z' },
          [profileKey('poupeai-profile')]: { name: E2E_USER.name },
        });
      }
      await use();
    },
    { auto: true },
  ],

  // `auto`: ativo em todos os testes, mesmo nos que não o usam diretamente —
  // nenhum teste pode chegar ao Gemini real.
  mockGemini: [
    async ({ page, geminiPrompts }, use) => {
      let handler: GeminiHandler = (_, route) =>
        route.fulfill({ json: geminiText(JSON.stringify(INSIGHT)) });

      await page.route('**/api/gemini', async (route) => {
        const body = route.request().postDataJSON() as { prompt: string };
        geminiPrompts.push(body.prompt);
        await handler(body.prompt, route);
      });

      await use((next) => {
        handler = next;
      });
    },
    { auto: true },
  ],

  seedStorage: async ({ page }, use) => {
    await use(async (data) => {
      const entries = Object.fromEntries(
        Object.entries(data).map(([base, value]) => [profileKey(base), value])
      );
      await seedOnce(page, '__seeded', entries);
    });
  },

  seedLegacy: async ({ page }, use) => {
    await use(async (data) => {
      await seedOnce(page, '__legacy', data);
    });
  },

  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      // Falhas simuladas da IA: o app registra "Erro na IA:" e o navegador avisa
      // do status HTTP da própria /api/gemini. Qualquer outro erro reprova o teste.
      const fromGemini = message.location().url.includes('/api/gemini');
      if (message.text().startsWith('Erro na IA:') || fromGemini) return;
      errors.push(`console: ${message.text()}`);
    });
    await use(page);
    expect(errors, 'a página não deve registrar erros').toEqual([]);
  },
});

export { expect };

/** Lê e interpreta uma chave do localStorage. */
export const readStorage = (page: Page, key: string) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null') as unknown, key);

/** Lê um dado do perfil E2E pelo nome-base (ex.: `poupeai-goals`). */
export const readProfileStorage = (page: Page, base: string, userId = E2E_USER.id) =>
  readStorage(page, profileKey(base, userId));
