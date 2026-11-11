/** Classes dos botões — também usadas em <Link> estilizados como botão. */
export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'btn-glow text-white hover:brightness-110',
  secondary: 'bg-secondary-button text-foreground border border-border hover:border-border-strong',
  outline:
    'border border-primary-glow/60 text-foreground bg-muted-primary hover:bg-primary/25 shadow-[0_0_24px_-10px_rgba(168,85,247,0.9)]',
  ghost: 'text-muted-foreground hover:text-foreground hover:bg-secondary-button',
  danger: 'bg-danger text-white hover:brightness-110',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-sm gap-2 rounded-xl',
};

export const buttonClasses = (variant: Variant = 'primary', size: Size = 'md', extra = '') =>
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
    variants[variant],
    sizes[size],
    extra,
  ].join(' ');
