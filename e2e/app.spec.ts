import { expect, geminiText, readStorage, test } from './fixtures';

const ROUTES = [
  '/',
  '/simulacoes',
  '/simulacoes/nova',
  '/historico',
  '/metas',
  '/planejamento',
  '/chat',
  '/educacao',
  '/perfil',
  '/preferencias',
  '/ajuda',
];

/** Simulação no formato das primeiras versões do app (sem `createdAt`). */
const LEGACY_SIMULATION = {
  income: '3.000,00',
  expenses: '2.500,00',
  debts: '400,00',
  goalName: 'Viagem antiga',
  goalAmount: '20.000,00',
  goalDeadline: '12',
  id: 'legacy-1',
};

test.describe('rotas', () => {
  for (const route of ROUTES) {
    test(`abre ${route} sem erros`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible();
    });
  }

  test('rota inexistente não quebra o app', async ({ page }) => {
    const response = await page.goto('/rota-que-nao-existe');
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('dashboard', () => {
  test('abre com dados antigos e registros incompletos (regressão das notificações)', async ({
    page,
    seedStorage,
  }) => {
    await seedStorage({
      'simulation-data': [
        LEGACY_SIMULATION,
        { ...LEGACY_SIMULATION, id: 'null-date', goalName: 'Sem data', createdAt: null },
        null,
        { id: 'incompleto' },
      ],
      'poupeai-goals': [
        { id: 'g1', name: 'Reserva', targetAmount: 1000, savedAmount: 1000, deadline: '' },
      ],
    });

    await page.goto('/');
    await expect(page.getByText('Viagem antiga').first()).toBeVisible();

    await page.getByRole('button', { name: /Notificações/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Notificações' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Meta concluída: Reserva')).toBeVisible();

    // Nada foi apagado do localStorage.
    expect(await readStorage(page, 'simulation-data')).toHaveLength(4);
  });
});

test.describe('simulações e histórico', () => {
  test('cria uma simulação, gera o diagnóstico e persiste após recarregar', async ({
    page,
    geminiPrompts,
  }) => {
    await page.goto('/simulacoes/nova');

    const answers = ['500000', '250000', '50000', 'Viagem ao Japão', '1500000', '12'];
    for (const answer of answers) {
      const input = page.locator('main form input').first();
      await input.fill(answer);
      await input.press('Enter');
    }

    await expect(page).toHaveURL(/\/resultado\/[\w-]+$/);
    await expect(page.getByRole('heading', { name: 'Resultado da sua simulação' })).toBeVisible();
    await expect(page.getByText('Diagnóstico de teste gerado pelo mock.')).toBeVisible();
    expect(geminiPrompts[0]).toContain('Viagem ao Japão');

    const saved = (await readStorage(page, 'simulation-data')) as {
      goalName: string;
      createdAt: string;
      insight?: unknown;
    }[];
    expect(saved).toHaveLength(1);
    expect(saved[0].goalName).toBe('Viagem ao Japão');
    expect(saved[0].createdAt).toBeTruthy();
    await expect
      .poll(
        async () =>
          !!((await readStorage(page, 'simulation-data')) as { insight?: unknown }[])[0].insight
      )
      .toBe(true);

    // Recarregar não gera nova chamada: o diagnóstico salvo é reaproveitado.
    await page.reload();
    await expect(page.getByText('Diagnóstico de teste gerado pelo mock.')).toBeVisible();
    expect(geminiPrompts).toHaveLength(1);

    await page.goto('/historico');
    await expect(page.getByRole('heading', { name: 'Viagem ao Japão' })).toBeVisible();

    await page.goto('/');
    await expect(page.getByText('Viagem ao Japão').first()).toBeVisible();
  });

  test('histórico lista registros antigos e filtra por nome', async ({ page, seedStorage }) => {
    await seedStorage({
      'simulation-data': [
        LEGACY_SIMULATION,
        {
          ...LEGACY_SIMULATION,
          id: 'novo',
          goalName: 'Carro novo',
          createdAt: '2026-10-01T10:00:00.000Z',
        },
      ],
    });

    await page.goto('/historico');
    await expect(page.getByRole('heading', { name: 'Viagem antiga' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Carro novo' })).toBeVisible();

    await page.getByPlaceholder('Filtrar por nome...').fill('carro');
    await expect(page.getByRole('heading', { name: 'Carro novo' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Viagem antiga' })).toBeHidden();
  });
});

test.describe('metas', () => {
  test('cria uma meta e mantém após recarregar', async ({ page }) => {
    await page.goto('/metas');
    await page.getByRole('button', { name: 'Nova meta' }).first().click();

    await page.getByLabel('Nome da meta').fill('Reserva de emergência');
    await page.getByLabel('Valor da meta').fill('1000000');
    await page.getByRole('button', { name: 'Criar meta' }).click();

    await expect(page.getByText('Reserva de emergência').first()).toBeVisible();

    await page.reload();
    await expect(page.getByText('Reserva de emergência').first()).toBeVisible();
    const goals = (await readStorage(page, 'poupeai-goals')) as {
      name: string;
      targetAmount: number;
    }[];
    expect(goals).toEqual([
      expect.objectContaining({ name: 'Reserva de emergência', targetAmount: 10000 }),
    ]);
  });
});

test.describe('planejamento', () => {
  test('registra o mês atual e mantém após recarregar', async ({ page }) => {
    await page.goto('/planejamento');
    await page.getByRole('button', { name: 'Registrar mês' }).first().click();

    await page.getByLabel('Receitas', { exact: true }).fill('600000');
    await page.getByLabel('Custos fixos', { exact: true }).fill('250000');
    await page.getByLabel('Gastos variáveis', { exact: true }).fill('100000');
    await page.getByLabel('Dívidas e parcelas', { exact: true }).fill('50000');
    await page.getByRole('button', { name: 'Salvar mês' }).click();

    await page.reload();
    const planning = (await readStorage(page, 'poupeai-planning')) as {
      months: { income: number; fixedExpenses: number }[];
    };
    expect(planning.months).toEqual([
      expect.objectContaining({ income: 6000, fixedExpenses: 2500 }),
    ]);

    // O dashboard passa a usar os dados do planejamento.
    await page.goto('/');
    // 6.000 − 2.500 − 1.000 − 500 = 2.000 de economia (33,3% da receita).
    const economy = page.getByRole('article').filter({ hasText: 'Economia mensal' });
    await expect(economy).toContainText(/2\.000,00/);
    const rate = page.getByRole('article').filter({ hasText: 'Taxa de economia' });
    await expect(rate).toContainText('33,3%');
  });
});

test.describe('chat com IA', () => {
  test('envia o contexto do usuário, exibe a resposta e mantém o histórico', async ({
    page,
    seedStorage,
    mockGemini,
    geminiPrompts,
  }) => {
    await seedStorage({ 'simulation-data': [LEGACY_SIMULATION] });
    mockGemini((_, route) =>
      route.fulfill({ json: geminiText('Sua meta Viagem antiga precisa de ajustes.') })
    );

    await page.goto('/chat');
    await page.getByLabel('Mensagem', { exact: true }).fill('Como está minha meta?');
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();

    await expect(page.getByText('Sua meta Viagem antiga precisa de ajustes.')).toBeVisible();
    // A resposta é contextualizada com o histórico de simulações.
    expect(geminiPrompts[0]).toContain('Viagem antiga');
    expect(geminiPrompts[0]).toContain('Como está minha meta?');

    await page.reload();
    await expect(page.getByText('Sua meta Viagem antiga precisa de ajustes.')).toBeVisible();
  });

  test('mostra mensagem amigável quando o limite de uso é atingido', async ({
    page,
    mockGemini,
  }) => {
    mockGemini((_, route) =>
      route.fulfill({
        status: 429,
        headers: { 'Retry-After': '60' },
        json: { error: 'rate_limited' },
      })
    );

    await page.goto('/chat');
    await page.getByLabel('Mensagem', { exact: true }).fill('Olá');
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();

    await expect(page.getByText(/Limite de uso da IA atingido/)).toBeVisible();
  });
});
