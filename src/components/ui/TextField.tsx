import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { type InputHTMLAttributes, useId, useState } from 'react';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  icon?: LucideIcon;
  hint?: string;
  error?: string;
}

/** Campo de texto com rótulo, ícone, dica e erro acessíveis (mesmo estilo `.field`). */
export function TextField({
  label,
  icon: Icon,
  hint,
  error,
  type = 'text',
  className = '',
  ...rest
}: TextFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
          />
        )}
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={`field ${Icon ? 'pl-11' : ''} ${isPassword ? 'pr-12' : ''}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg transition"
          >
            {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-danger text-xs">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-muted-foreground text-xs">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
