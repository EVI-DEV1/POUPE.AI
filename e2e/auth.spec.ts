import type { Page } from '@playwright/test';

import { expect, geminiText, profileKey, readStorage, test } from './fixtures';

// Estes testes começam sem perfil: tudo é feito pela interface.
test.use({ authenticated: false });

const PASSWORD = 'senha-demo-123';

const LEGACY_SIMULATION = {
  income: '3.000,00',
  expenses: '2.500,00',
  debts: '400,00',
  goalName: 'Viagem antiga',
  goalAmount: '20.000,00',
  goalDeadline: '12',
  id: 'legacy-1',
};

/**
 * Cadastra pela tela. Por padrão espera o app abrir com o novo perfil — a
 * derivação da senha (PBKDF2) é assíncrona e a sessão só existe depois dela.
 */
async function signUp(
  page: Page,
  name: string,
  email: string,
  { password = PASSWORD, expectSuccess = true } = {}
) {
  await page.goto('/cadastro');
  await page.getByLabel('Nome').fill(name);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByLabel('Confirmar senha').fill(password);
  await page.getByRole('button', { name: 'Criar perfil' }).click();
  if (expectSuccess) {
    await expect(page.getByRole('button', { name: 'Menu do perfil' })).toContainText(name);
  }
}

/** Login pela tela; por padrão espera a sessão existir (a verificação da senha é assíncrona). */
async function signIn(
  page: Page,
  email: string,
  { password = PASSWORD, expectSuccess = true } = {}
) {
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  if (expectSuccess) {
    await expect(page.getByRole('button', { name: 'Menu do perfil' })).toBeVisible();
  }
}

async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Menu do perfil' }).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/entrar$/);
}

const profileMenu = (page: Page) => page.getByRole('button', { name: 'Menu do perfil' });

test.describe('acesso de visitantes', () => {
  test('visitante é levado ao login e pode ir ao cadastro', async ({ page }) => {
    await page.goto('/metas');
    await expect(page).toHaveURL(/\/entrar$/);
    await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();
    // O aviso destacado saiu das telas de acesso; a explicação fica na Ajuda.
    await expect(page.getByLabel('Modo demonstração')).toHaveCount(0);

    await page.getByRole('link', { name: 'Criar perfil demonstrativo' }).click();
    await expect(page).toHaveURL(/\/cadastro$/);
    await expect(page.getByRole('heading', { name: 'Criar conta', exact: true })).toBeVisible();
    await expect(page.getByLabel('Modo demonstração')).toHaveCount(0);
  });

  test('cadastro mostra mensagens de validação', async ({ page }) => {
    await page.goto('/cadastro');
    await page.getByRole('button', { name: 'Criar perfil' }).click();

    await expect(page.getByText('Informe seu nome.')).toBeVisible();
    await expect(page.getByText('Informe um e-mail.')).toBeVisible();
    await expect(page.getByText('Informe uma senha.')).toBeVisible();
    await expect(page.getByText('Confirme a senha.')).toBeVisible();

    await page.getByLabel('Senha', { exact: true }).fill('12345678');
    await page.getByLabel('Confirmar senha').fill('87654321');
    await page.getByRole('button', { name: 'Criar perfil' }).click();
    await expect(page.getByText('As senhas não coincidem.')).toBeVisible();
  });
});

test.describe('cadastro, login e logout', () => {
  test('cadastra, mantém a sessão ao recarregar e não guarda a senha em texto puro', async ({
    page,
  }) => {
    // Nenhuma requisição pode levar os dados do cadastro para fora do navegador.
    const leaked: string[] = [];
    page.on('request', (request) => {
      const payload = `${request.url()} ${request.postData() ?? ''}`;
      if (payload.includes(PASSWORD) || payload.includes('ana@exemplo.com')) {
        leaked.push(request.url());
      }
    });

    await signUp(page, 'Ana Demo', 'ana@exemplo.com');

    await expect(page).toHaveURL(/\/$/);
    await expect(profileMenu(page)).toContainText('Ana Demo');
    await expect(profileMenu(page)).toContainText('Perfil demonstrativo');

    const users = JSON.stringify(await readStorage(page, 'poupeai-demo-users'));
    expect(users).toContain('PBKDF2-SHA256');
    expect(users).not.toContain(PASSWORD);

    await page.reload();
    await expect(profileMenu(page)).toContainText('Ana Demo');

    // Com sessão, login e cadastro não aparecem de novo.
    await page.goto('/entrar');
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/cadastro');
    await expect(page).toHaveURL(/\/$/);

    expect(leaked, 'dados de cadastro enviados pela rede').toEqual([]);
  });

  test('logout encerra a sessão; login volta à página pedida', async ({ page }) => {
    await signUp(page, 'Ana Demo', 'ana@exemplo.com');
    await signOut(page);

    await page.goto('/planejamento');
    await expect(page).toHaveURL(/\/entrar$/);

    await signIn(page, 'ana@exemplo.com', { password: 'senha-errada', expectSuccess: false });
    await expect(page.getByRole('alert')).toHaveText('E-mail ou senha incorretos.');

    await signIn(page, 'ana@exemplo.com');
    await expect(page).toHaveURL(/\/planejamento$/);
  });

  test('não permite dois perfis com o mesmo e-mail', async ({ page }) => {
    await signUp(page, 'Ana Demo', 'ana@exemplo.com');
    await signOut(page);
    await signUp(page, 'Outra Ana', 'ANA@exemplo.com', { expectSuccess: false });

    await expect(
      page.getByText('Já existe um perfil demonstrativo com este e-mail neste navegador.').first()
    ).toBeVisible();
    await expect(page).toHaveURL(/\/cadastro$/);
  });
});

test.describe('isolamento entre perfis', () => {
  test('um perfil não vê as metas de outro perfil do mesmo navegador', async ({ page }) => {
    await signUp(page, 'Ana Demo', 'ana@exemplo.com');
    await page.goto('/metas');
    await page.getByRole('button', { name: 'Nova meta' }).first().click();
    await page.getByLabel('Nome da meta').fill('Meta secreta da Ana');
    await page.getByLabel('Valor da meta').fill('500000');
    await page.getByRole('button', { name: 'Criar meta' }).click();
    await expect(page.getByText('Meta secreta da Ana').first()).toBeVisible();
    await signOut(page);

    await signUp(page, 'Bia Demo', 'bia@exemplo.com');
    await page.goto('/metas');
    await expect(page.getByRole('heading', { name: 'Metas' }).first()).toBeVisible();
    await expect(page.getByText('Meta secreta da Ana')).toHaveCount(0);
    await signOut(page);

    await signIn(page, 'ana@exemplo.com');
    await page.goto('/metas');
    await expect(page.getByText('Meta secreta da Ana').first()).toBeVisible();
  });
});

test.describe('dados anteriores do navegador', () => {
  test('oferece importar, copia para o perfil e mantém os originais', async ({
    page,
    seedLegacy,
  }) => {
    await seedLegacy({ 'simulation-data': [LEGACY_SIMULATION] });
    await signUp(page, 'Ana Demo', 'ana@exemplo.com');

    const dialog = page.getByRole('dialog', { name: 'Importar dados deste navegador?' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('1 simulação');
    await dialog.getByRole('button', { name: 'Importar para este perfil' }).click();
    await expect(dialog).toBeHidden();

    await expect(page.getByText('Viagem antiga').first()).toBeVisible();
    // A chave original continua intacta.
    expect(await readStorage(page, 'simulation-data')).toEqual([LEGACY_SIMULATION]);

    // Outro perfil não recebe a oferta nem os dados.
    await signOut(page);
    await signUp(page, 'Bia Demo', 'bia@exemplo.com');
    await expect(profileMenu(page)).toContainText('Bia Demo');
    await expect(page.getByRole('dialog', { name: 'Importar dados deste navegador?' })).toHaveCount(
      0
    );
    await expect(page.getByText('Viagem antiga')).toHaveCount(0);
  });

  test('"Agora não" fecha o aviso; dá para importar depois em Preferências', async ({
    page,
    seedLegacy,
  }) => {
    await seedLegacy({ 'simulation-data': [LEGACY_SIMULATION] });
    await signUp(page, 'Ana Demo', 'ana@exemplo.com');

    await page.getByRole('button', { name: 'Agora não' }).click();
    await page.reload();
    await expect(page.getByRole('dialog', { name: 'Importar dados deste navegador?' })).toHaveCount(
      0
    );

    await page.goto('/preferencias');
    await page.getByRole('button', { name: 'Importar para este perfil' }).click();
    await expect(page.getByText('já foram importados para este perfil')).toBeVisible();

    const user = (await readStorage(page, 'poupeai-demo-users')) as { id: string }[];
    expect(await readStorage(page, profileKey('simulation-data', user[0].id))).toEqual([
      LEGACY_SIMULATION,
    ]);
  });
});

test.describe('IA com perfil demonstrativo', () => {
  test('o chat funciona e não envia e-mail nem senha do perfil', async ({
    page,
    mockGemini,
    geminiPrompts,
  }) => {
    mockGemini((_, route) => route.fulfill({ json: geminiText('Resposta de teste.') }));
    await signUp(page, 'Ana Demo', 'ana@exemplo.com');

    await page.goto('/chat');
    await page.getByLabel('Mensagem', { exact: true }).fill('Olá');
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();
    await expect(page.getByText('Resposta de teste.')).toBeVisible();

    expect(geminiPrompts).toHaveLength(1);
    expect(geminiPrompts[0]).not.toContain('ana@exemplo.com');
    expect(geminiPrompts[0]).not.toContain(PASSWORD);
  });
});
