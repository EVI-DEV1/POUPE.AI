import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'gap-2 py-4' : 'gap-3 py-10'}`}
    >
      <span className="bg-muted-primary text-primary-glow ring-primary/30 flex h-12 w-12 items-center justify-center rounded-2xl ring-1">
        <Icon size={22} aria-hidden />
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}
