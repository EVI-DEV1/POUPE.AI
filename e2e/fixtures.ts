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

interface Fixtures {
  /** Prompts enviados a /api/gemini durante o teste. */
  geminiPrompts: string[];
  /** Define como /api/gemini responde (padrão: insight válido). */
  mockGemini: (handler: GeminiHandler) => void;
  /** Grava dados no localStorage antes do app carregar. */
  seedStorage: (data: Record<string, unknown>) => Promise<void>;
}

/**
 * Teste base:
 * - intercepta /api/gemini (nenhuma chamada real ao Google);
 * - falha se a página lançar qualquer erro de JavaScript ou erro de console.
 */
export const test = base.extend<Fixtures>({
  geminiPrompts: async ({}, use) => {
    await use([]);
  },

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
      await page.addInitScript((entries) => {
        // Só na primeira carga: recarregar a página não deve sobrescrever o que o app gravou.
        if (sessionStorage.getItem('__seeded')) return;
        sessionStorage.setItem('__seeded', '1');
        Object.entries(entries).forEach(([key, value]) =>
          localStorage.setItem(key, JSON.stringify(value))
        );
      }, data);
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
