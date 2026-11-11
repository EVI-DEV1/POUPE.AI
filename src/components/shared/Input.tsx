import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
  suffix?: string;
}

export function Input({ prefix, suffix, ...rest }: InputProps) {
  return (
    <div className="border-border bg-input focus-within:border-primary-glow flex h-14 items-center gap-3 rounded-2xl border px-4 transition focus-within:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]">
      {prefix && (
        <>
          <span className="text-muted-foreground text-sm font-medium">{prefix}</span>
          <span className="bg-border h-6 w-px" aria-hidden />
        </>
      )}
      <input
        className="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-base outline-none focus:ring-0"
        autoFocus
        {...rest}
      />
      {suffix && (
        <>
          <span className="bg-border h-6 w-px" aria-hidden />
          <span className="text-muted-foreground text-sm font-medium">{suffix}</span>
        </>
      )}
    </div>
  );
}
