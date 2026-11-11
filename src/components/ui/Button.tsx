import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

import { buttonClasses, type Size, type Variant } from './buttonStyles';

export interface UIButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
}

export function UIButton({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: UIButtonProps) {
  return (
    <button
      type={type}
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 15 : 18} aria-hidden />
      )}
      {children}
      {IconRight && <IconRight size={size === 'sm' ? 15 : 18} aria-hidden />}
    </button>
  );
}
