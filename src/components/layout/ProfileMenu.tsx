import { ChevronDown, CircleQuestionMark, Moon, Settings, Sun, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/stores';

export function ProfileMenu() {
  const navigate = useNavigate();
  const profile = useProfile();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (to: string) => {
    setOpen(false);
    void navigate(to);
  };

  const items = [
    { label: 'Editar perfil', icon: User, onClick: () => go('/perfil') },
    { label: 'Preferências', icon: Settings, onClick: () => go('/preferencias') },
    {
      label: theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro',
      icon: theme === 'dark' ? Sun : Moon,
      onClick: toggleTheme,
    },
    { label: 'Ajuda e Suporte', icon: CircleQuestionMark, onClick: () => go('/ajuda') },
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu do perfil"
        className="hover:bg-secondary-button/60 flex items-center gap-3 rounded-2xl py-1.5 pl-1.5 pr-2 transition"
      >
        <Avatar profile={profile} size={46} />
        <span className="hidden min-w-0 text-left md:block">
          <span className="block max-w-36 truncate text-[0.95rem] font-semibold">
            {profile.name || 'Visitante'}
          </span>
          <span className="text-muted-foreground block text-xs">
            {profile.name ? 'Plano Gratuito' : 'Configure seu perfil'}
          </span>
        </span>
        <ChevronDown
          size={20}
          className={`text-foreground/80 hidden transition md:block ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Perfil"
          className="surface animate-fade-up absolute right-0 top-full z-40 mt-2 w-60 p-1.5"
        >
          {items.map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              onClick={onClick}
              className="hover:bg-secondary-button flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition"
            >
              <Icon size={16} aria-hidden /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
