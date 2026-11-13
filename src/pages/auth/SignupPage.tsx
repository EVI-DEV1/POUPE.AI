import { LockKeyhole, Mail, User, UserPlus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { UIButton } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/hooks/useAuth';
import { NAME_MAX, PASSWORD_MIN, type FormErrors, type SignUpForm } from '@/utils/validation';

const EMPTY: SignUpForm = { name: '', email: '', password: '', confirmPassword: '' };

export function SignupPage() {
  const { signUp } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState<SignUpForm>(EMPTY);
  const [errors, setErrors] = useState<FormErrors<SignUpForm>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: keyof SignUpForm) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await signUp(form);
      // Sucesso: já entra com o novo perfil (o PublicOnlyRoute redireciona).
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message);
      }
    } catch {
      setFormError('Não foi possível criar o perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Criar perfil demonstrativo"
      subtitle="Leva menos de um minuto e mantém seus dados separados de outros perfis."
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Nome"
          icon={User}
          autoComplete="name"
          maxLength={NAME_MAX}
          placeholder="Como quer ser chamado(a)"
          value={form.name}
          onChange={(e) => update('name')(e.target.value)}
          error={errors.name}
          autoFocus
        />
        <TextField
          label="E-mail"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="voce@exemplo.com"
          hint="Pode ser fictício: ele só identifica o perfil neste navegador."
          value={form.email}
          onChange={(e) => update('email')(e.target.value)}
          error={errors.email}
        />
        <TextField
          label="Senha"
          type="password"
          icon={LockKeyhole}
          autoComplete="new-password"
          hint={`Mínimo de ${PASSWORD_MIN} caracteres. Não reutilize uma senha real.`}
          value={form.password}
          onChange={(e) => update('password')(e.target.value)}
          error={errors.password}
        />
        <TextField
          label="Confirmar senha"
          type="password"
          icon={LockKeyhole}
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(e) => update('confirmPassword')(e.target.value)}
          error={errors.confirmPassword}
        />

        {formError && (
          <p role="alert" className="text-danger text-sm">
            {formError}
          </p>
        )}

        <UIButton type="submit" size="lg" icon={UserPlus} loading={loading}>
          {loading ? 'Criando perfil…' : 'Criar perfil'}
        </UIButton>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Já tem um perfil?{' '}
        <Link
          to="/entrar"
          state={location.state}
          className="text-primary-glow font-semibold hover:underline"
        >
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
