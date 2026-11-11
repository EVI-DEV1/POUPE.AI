import type { LucideIcon } from 'lucide-react';

interface CardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle: string;
  variant?: 'default' | 'primary';
  compact?: boolean;
}

export function Card({
  icon: Icon,
  label,
  value,
  subtitle,
  variant = 'default',
  compact = false,
}: CardProps) {
  if (compact) {
    return (
      <div className="border-border flex gap-3 border-b py-4 last:border-b-0">
        <span className="bg-muted-primary text-primary-glow flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <Icon size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums">{value}</p>
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        </div>
      </div>
    );
  }

  const primary = variant === 'primary';

  return (
    <div
      className={
        primary
          ? 'rounded-[1.25rem] border border-[#c084fc]/50 bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] p-5 text-white shadow-[0_0_36px_-12px_rgba(168,85,247,0.9)]'
          : 'surface p-5'
      }
    >
      <div className="mb-3 flex items-center gap-3">
        <span
          className={
            primary
              ? 'flex h-10 w-10 items-center justify-center rounded-xl bg-white/15'
              : 'icon-tile h-10 w-10'
          }
        >
          <Icon size={20} aria-hidden />
        </span>
        <span
          className={`text-xs font-semibold uppercase tracking-widest ${primary ? 'text-white/85' : 'text-muted-foreground'}`}
        >
          {label}
        </span>
      </div>

      <p className="text-2xl font-bold tabular-nums tracking-tight sm:text-[1.65rem]">{value}</p>
      <p className={`mt-1 text-sm ${primary ? 'text-white/75' : 'text-muted-foreground'}`}>
        {subtitle}
      </p>
    </div>
  );
}
