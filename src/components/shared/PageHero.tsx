import type { ReactNode } from 'react';

interface PageHeroProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function PageHero({ title, subtitle, actions }: PageHeroProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && (
          <div className="text-muted-foreground mt-1.5 text-sm sm:text-base">{subtitle}</div>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
