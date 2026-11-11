import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react';

interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  action?: ReactNode;
  as?: 'section' | 'div' | 'article';
}

/** Card padrão do dashboard: superfície escura com borda e brilho sutil. */
export function Panel({
  title,
  action,
  as: Tag = 'section',
  className = '',
  children,
  ...props
}: PropsWithChildren<PanelProps>) {
  return (
    <Tag className={`surface p-5 sm:p-6 ${className}`} {...props}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </Tag>
  );
}
