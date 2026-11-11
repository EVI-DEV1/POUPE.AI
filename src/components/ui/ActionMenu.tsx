import { EllipsisVertical, type LucideIcon } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

export interface ActionMenuItem {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
}

interface ActionMenuProps {
  label: string;
  items: ActionMenuItem[];
}

/** Menu “⋮” com navegação por teclado (setas, Home/End, Esc). */
export function ActionMenu({ label, items }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    itemRefs.current[0]?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent) => {
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    const last = items.length - 1;
    const focus = (i: number) => itemRefs.current[i]?.focus();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focus(current >= last ? 0 : current + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focus(current <= 0 ? last : current - 1);
        break;
      case 'Home':
        event.preventDefault();
        focus(0);
        break;
      case 'End':
        event.preventDefault();
        focus(last);
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'Tab':
        close(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="text-muted-foreground hover:bg-secondary-button hover:text-foreground flex h-10 w-10 items-center justify-center rounded-lg transition"
      >
        <EllipsisVertical size={20} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className="surface animate-fade-up absolute right-0 top-full z-30 mt-1 w-52 p-1.5"
        >
          {items.map(({ label: itemLabel, icon: Icon, onSelect, danger }, index) => (
            <button
              key={itemLabel}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                close(false);
                onSelect();
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm outline-none transition ${
                danger
                  ? 'text-danger hover:bg-danger-soft focus:bg-danger-soft'
                  : 'hover:bg-secondary-button focus:bg-secondary-button'
              }`}
            >
              <Icon size={16} aria-hidden />
              {itemLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
