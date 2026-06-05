import type { InputHTMLAttributes } from 'react';
import { Divider } from './Divider';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
  suffix?: string;
}

export function Input({ prefix, suffix, ...rest }: InputProps) {
  return (
    <div className="bg-input rounded-2x1 flex items-center p-4 px-4 py-2 shadow-[4px_4px_18px_0px_rgba(0,0,0,0.2)]">
      {prefix && (
        <>
          <span className="text-muted-foreground text-sm font-medium">{prefix}</span>
          <Divider orientation="vertical" />
        </>
      )}
      <input
        className="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none focus:ring-0"
        autoFocus
        {...rest}
      />
      {suffix && (
        <>
          <Divider orientation="vertical" />
          <span className="text-muted-foreground text-sm font-medium">{suffix}</span>
        </>
      )}
    </div>
  );
}
