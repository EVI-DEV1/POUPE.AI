import { ChevronsLeft, ChevronsRight, Crown, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

import { isNavItemActive, MAIN_NAV, type NavItem, SETTINGS_NAV } from '@/data/navigation';

import { Logo } from './Logo';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Modo gaveta (mobile/tablet). */
  mobile?: boolean;
  onClose?: () => void;
}

function SidebarLink({
  item,
  collapsed,
  size,
}: {
  item: NavItem;
  collapsed: boolean;
  size: 'main' | 'settings';
}) {
  const { pathname } = useLocation();
  const active = isNavItemActive(item, pathname);
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={[
        'group relative flex items-center rounded-xl transition-all duration-200',
        size === 'main' ? 'h-[46px] gap-4 text-[1.0625rem]' : 'h-10 gap-3.5 text-base',
        collapsed ? 'justify-center px-0' : 'px-4',
        active
          ? 'text-foreground border-primary-glow/50 border bg-gradient-to-r from-[#7c3aed]/80 via-[#6d28d9]/55 to-[#4c1d95]/35 font-semibold shadow-[0_8px_28px_-10px_rgba(147,51,234,0.9),inset_0_1px_0_rgba(255,255,255,0.12)]'
          : 'text-foreground/85 hover:bg-secondary-button/80 hover:text-foreground border border-transparent font-normal',
      ].join(' ')}
    >
      <Icon
        size={size === 'main' ? 22 : 21}
        aria-hidden
        className={active ? 'text-white' : 'text-foreground/80 group-hover:text-primary-glow'}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

export function Sidebar({ collapsed, onToggleCollapsed, mobile, onClose }: SidebarProps) {
  const isCollapsed = collapsed && !mobile;

  return (
    <aside
      aria-label="Menu principal"
      className={[
        'bg-sidebar border-border relative flex h-full flex-col overflow-hidden border-r',
        isCollapsed ? 'w-[88px]' : 'w-[300px] xl:w-[308px]',
        'transition-[width] duration-300',
      ].join(' ')}
    >
      {/* brilho roxo na base, como na referência */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#7c3aed]/25 blur-3xl"
      />
      <div
        aria-hidden
        className="bg-[#7c3aed]/12 pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full blur-3xl"
      />

      <div
        className={`relative flex items-center ${isCollapsed ? 'justify-center px-2 pt-6' : 'justify-between pl-10 pr-4 pt-6'} pb-7`}
      >
        <NavLink
          to="/"
          onClick={mobile ? onClose : undefined}
          aria-label="Poupe.ai — ir para o Dashboard"
          className="rounded-xl"
        >
          <Logo compact={isCollapsed} />
        </NavLink>
        {mobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="text-muted-foreground hover:bg-secondary-button hover:text-foreground rounded-lg p-2"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav
        onClick={(event) => {
          if (mobile && (event.target as Element).closest('a')) onClose?.();
        }}
        className={`relative flex flex-1 flex-col overflow-y-auto ${isCollapsed ? 'px-3' : 'px-6'}`}
      >
        <ul className="flex flex-col gap-1.5">
          {MAIN_NAV.map((item) => (
            <li key={item.to}>
              <SidebarLink item={item} collapsed={isCollapsed} size="main" />
            </li>
          ))}
        </ul>

        <div className="bg-border mx-2 my-6 h-px" />

        {!isCollapsed && (
          <p className="text-foreground/80 mb-3 px-4 text-[0.95rem] font-medium">Configurações</p>
        )}
        <ul className="flex flex-col gap-1">
          {SETTINGS_NAV.map((item) => (
            <li key={item.to}>
              <SidebarLink item={item} collapsed={isCollapsed} size="settings" />
            </li>
          ))}
        </ul>

        <div className="min-h-6 flex-1" />

        {!isCollapsed && (
          <div className="mb-6 rounded-2xl border border-[#a855f7]/45 bg-gradient-to-br from-[#2a1463]/90 via-[#1c1048]/90 to-[#1a0f3d]/90 p-5 shadow-[0_0_32px_-12px_rgba(168,85,247,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
            <p className="flex items-center gap-2 text-lg font-semibold">
              <Crown size={22} className="fill-amber-400/90 text-amber-400" aria-hidden />
              <span className="text-gradient">Poupe.ai Pro</span>
            </p>
            <p className="text-foreground/80 mt-1.5 text-[0.95rem] leading-snug">
              Em breve: mais insights, metas e automações.
            </p>
          </div>
        )}
      </nav>

      {!mobile && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          aria-expanded={!isCollapsed}
          className={`text-muted-foreground hover:text-foreground hover:bg-secondary-button relative mb-4 flex h-9 items-center gap-2 self-center rounded-lg px-3 text-xs font-medium transition ${isCollapsed ? '' : 'ml-8 self-start'}`}
        >
          {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          {!isCollapsed && 'Recolher menu'}
        </button>
      )}
    </aside>
  );
}
