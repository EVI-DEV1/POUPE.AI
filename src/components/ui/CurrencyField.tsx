import { type InputHTMLAttributes, useId } from 'react';

import { formatCurrencyMask } from '@/utils/currency';

interface CurrencyFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'prefix'
> {
  label: string;
  value: string;
  onChange: (masked: string) => void;
  hint?: string;
  error?: string;
}

/** Campo monetário com a mesma máscara usada no formulário de simulação. */
export function CurrencyField({
  label,
  value,
  onChange,
  hint,
  error,
  ...rest
}: CurrencyFieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <span className="text-muted-foreground pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium">
          R$
        </span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0,00"
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          {...rest}
          value={value}
          onChange={(e) => onChange(formatCurrencyMask(e.target.value))}
          className="field pl-11"
        />
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
