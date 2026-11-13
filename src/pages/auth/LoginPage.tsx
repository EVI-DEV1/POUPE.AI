import { LockKeyhole, LogIn, Mail } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { UIButton } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/hooks/useAuth';
import type { FormErrors, SignInForm } from '@/utils/validation';

export function LoginPage() {
  const { signIn } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState<SignInForm>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors<SignInForm>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: keyof SignInForm) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await signIn(form);
      // Sucesso: o PublicOnlyRoute leva à página de origem.
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message);
      }
    } catch {
      setFormError('Não foi possível entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse seu perfil demonstrativo para continuar de onde parou."
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextField
          label="E-mail"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="voce@exemplo.com"
          value={form.email}
          onChange={(e) => update('email')(e.target.value)}
          error={errors.email}
          autoFocus
        />
        <TextField
          label="Senha"
          type="password"
          icon={LockKeyhole}
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => update('password')(e.target.value)}
          error={errors.password}
        />

        {formError && (
          <p role="alert" className="text-danger text-sm">
            {formError}
          </p>
        )}

        <UIButton type="submit" size="lg" icon={LogIn} loading={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </UIButton>
      </form>

      <div className="text-muted-foreground mt-6 space-y-2 text-center text-sm">
        <p>
          Ainda não tem perfil?{' '}
          <Link
            to="/cadastro"
            state={location.state}
            className="text-primary-glow font-semibold hover:underline"
          >
            Criar perfil demonstrativo
          </Link>
        </p>
        <p className="text-xs">
          Esqueceu a senha? Como os perfis são locais, não há recuperação por e-mail — crie um novo
          perfil.
        </p>
      </div>
    </AuthLayout>
  );
}
