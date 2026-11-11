import { ArrowDown, ArrowUp, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface StatDelta {
  label: string;
  positive: boolean;
  /** Exibe como “pílula” (ex.: +4 p.p.). */
  pill?: boolean;
}

interface FinancialStatCardProps {
  icon: LucideIcon;
  label: string;
  value?: ReactNode;
  title?: ReactNode;
  delta?: StatDelta | null;
  footnote?: ReactNode;
  children?: ReactNode;
  empty?: { message: string; actionLabel: string; to: string };
}

export function FinancialStatCard({
  icon: Icon,
  label,
  value,
  title,
  delta,
  footnote,
  children,
  empty,
}: FinancialStatCardProps) {
  return (
    <article className="surface flex min-h-[124px] gap-4 px-5 py-4">
      <span className="icon-tile h-12 w-12">
        <Icon size={24} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="text-foreground/85 text-[0.95rem] font-medium">{label}</h3>

        {empty ? (
          <>
            <p className="text-muted-foreground mt-1.5 text-sm leading-snug">{empty.message}</p>
            <Link
              to={empty.to}
              className="text-primary-glow mt-2 inline-flex text-sm font-semibold hover:underline"
            >
              {empty.actionLabel} →
            </Link>
          </>
        ) : (
          <>
            {title && <p className="mt-0.5 truncate text-base font-semibold">{title}</p>}
            {value !== undefined && (
              <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight sm:text-[1.65rem]">
                {value}
              </p>
            )}
            {children}
            {delta && (
              <p
                className={[
                  'mt-2 inline-flex items-center gap-1 text-sm font-semibold tabular-nums',
                  delta.positive ? 'text-success' : 'text-danger',
                  delta.pill
                    ? `rounded-lg px-2.5 py-1 ${delta.positive ? 'bg-success-soft' : 'bg-danger-soft'}`
                    : '',
                ].join(' ')}
              >
                {delta.positive ? (
                  <ArrowUp size={16} strokeWidth={2.5} aria-hidden />
                ) : (
                  <ArrowDown size={16} strokeWidth={2.5} aria-hidden />
                )}
                {delta.label}
              </p>
            )}
            {footnote && (
              <p className="text-muted-foreground mt-1.5 truncate text-xs">{footnote}</p>
            )}
          </>
        )}
      </div>
    </article>
  );
}
