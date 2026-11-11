import { X } from 'lucide-react';
import { type PropsWithChildren, type ReactNode, useEffect, useId, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
}

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

/** Diálogo acessível baseado no <dialog> nativo (foco preso, Esc fecha). */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  size = 'md',
  footer,
  children,
}: PropsWithChildren<ModalProps>) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={`surface text-foreground m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${sizes[size]} open:animate-fade-up overflow-hidden p-0 backdrop:bg-[#04050f]/70 backdrop:backdrop-blur-sm open:flex open:flex-col`}
    >
      {open && (
        <>
          <header className="flex items-start gap-3 px-6 pt-6">
            {icon && <span className="icon-tile h-10 w-10">{icon}</span>}
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="text-muted-foreground mt-1 text-sm">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="text-muted-foreground hover:bg-secondary-button hover:text-foreground -mr-2 -mt-1 rounded-lg p-2 transition"
            >
              <X size={18} />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && (
            <footer className="border-border flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
              {footer}
            </footer>
          )}
        </>
      )}
    </dialog>
  );
}
