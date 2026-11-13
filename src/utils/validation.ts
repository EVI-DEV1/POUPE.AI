/**
 * Validação dos formulários de cadastro e login (padrão do DevOrbit, com
 * senha mais forte). Cada função devolve a mensagem de erro ou `null`.
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NAME_MIN = 2;
export const NAME_MAX = 40;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function validateName(name: string) {
  const value = name.trim();
  if (!value) return 'Informe seu nome.';
  if (value.length < NAME_MIN) return `O nome deve ter pelo menos ${NAME_MIN} caracteres.`;
  if (value.length > NAME_MAX) return `O nome deve ter no máximo ${NAME_MAX} caracteres.`;
  return null;
}

export function validateEmail(email: string) {
  const value = email.trim();
  if (!value) return 'Informe um e-mail.';
  if (!EMAIL_REGEX.test(value) || value.length > 254) return 'Digite um e-mail válido.';
  return null;
}

export function validatePassword(password: string) {
  if (!password) return 'Informe uma senha.';
  if (password.length < PASSWORD_MIN)
    return `A senha deve ter pelo menos ${PASSWORD_MIN} caracteres.`;
  if (password.length > PASSWORD_MAX)
    return `A senha deve ter no máximo ${PASSWORD_MAX} caracteres.`;
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string) {
  if (!confirmation) return 'Confirme a senha.';
  if (password !== confirmation) return 'As senhas não coincidem.';
  return null;
}

export interface SignUpForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignInForm {
  email: string;
  password: string;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

const compact = <T>(errors: Record<keyof T, string | null>): FormErrors<T> =>
  Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as FormErrors<T>;

export const validateSignUp = (form: SignUpForm) =>
  compact<SignUpForm>({
    name: validateName(form.name),
    email: validateEmail(form.email),
    password: validatePassword(form.password),
    confirmPassword: validatePasswordConfirmation(form.password, form.confirmPassword),
  });

export const validateSignIn = (form: SignInForm) =>
  compact<SignInForm>({
    email: validateEmail(form.email),
    // No login só exige preenchimento: a regra de tamanho vale para o cadastro.
    password: form.password ? null : 'Informe sua senha.',
  });
