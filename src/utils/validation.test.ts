import { describe, expect, it } from 'vitest';

import { normalizeEmail, validateSignIn, validateSignUp } from './validation';

const valid = {
  name: 'Ana',
  email: 'ana@exemplo.com',
  password: '12345678',
  confirmPassword: '12345678',
};

describe('validação do cadastro', () => {
  it('aceita um formulário válido', () => {
    expect(validateSignUp(valid)).toEqual({});
  });

  it.each([
    ['nome vazio', { name: '  ' }, 'name', 'Informe seu nome.'],
    ['nome curto', { name: 'A' }, 'name', 'O nome deve ter pelo menos 2 caracteres.'],
    ['e-mail inválido', { email: 'ana@' }, 'email', 'Digite um e-mail válido.'],
    [
      'senha curta',
      { password: '1234567', confirmPassword: '1234567' },
      'password',
      'A senha deve ter pelo menos 8 caracteres.',
    ],
    ['confirmação vazia', { confirmPassword: '' }, 'confirmPassword', 'Confirme a senha.'],
    [
      'senhas diferentes',
      { confirmPassword: '87654321' },
      'confirmPassword',
      'As senhas não coincidem.',
    ],
  ])('%s', (_, override, field, message) => {
    expect(validateSignUp({ ...valid, ...override })).toEqual({ [field]: message });
  });
});

describe('validação do login', () => {
  it('exige e-mail válido e senha preenchida', () => {
    expect(validateSignIn({ email: '', password: '' })).toEqual({
      email: 'Informe um e-mail.',
      password: 'Informe sua senha.',
    });
    expect(validateSignIn({ email: 'ana@exemplo.com', password: 'x' })).toEqual({});
  });

  it('normaliza o e-mail', () => {
    expect(normalizeEmail('  Ana@Exemplo.COM ')).toBe('ana@exemplo.com');
  });
});
