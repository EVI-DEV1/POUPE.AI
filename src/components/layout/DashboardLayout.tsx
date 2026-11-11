import { type PropsWithChildren, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { preferencesStore, usePreferences } from '@/stores';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function DashboardLayout({ children }: PropsWithChildren) {
  const { sidebarCollapsed } = usePreferences();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname, hash } = useLocation();

  // Volta ao topo ao navegar; rola até âncoras (#id) quando houver.
  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() =>
        document
          .getElementById(hash.slice(1))
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      );
    } else {
      document.getElementById('main-scroll')?.scrollTo({ top: 0 });
      window.scrollTo({ top: 0 });
    }
  }, [pathname, hash]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const toggleCollapsed = () =>
    preferencesStore.write((prefs) => ({ ...prefs, sidebarCollapsed: !prefs.sidebarCollapsed }));

  return (
    <div className="bg-background relative min-h-dvh lg:flex lg:h-dvh lg:overflow-hidden">
      <a
        href="#conteudo"
        className="focus:bg-primary sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo
      </a>

      {/* Fundo com brilho sutil */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-[480px] w-[640px] rounded-full bg-[#6d28d9]/10 blur-[120px]" />
        <div className="bg-[#db2777]/6 absolute bottom-0 right-0 h-[420px] w-[520px] rounded-full blur-[120px]" />
      </div>

      {/* Sidebar fixa (desktop) */}
      <div className="relative z-20 hidden shrink-0 lg:block">
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapsed={toggleCollapsed} />
      </div>

      {/* Gaveta (mobile/tablet) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-[#04050f]/70 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 max-w-[85vw] transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <Sidebar
            mobile
            collapsed={false}
            onToggleCollapsed={toggleCollapsed}
            onClose={() => setMobileOpen(false)}
          />
        </div>
      </div>

      <div
        id="main-scroll"
        className="relative z-10 flex min-w-0 flex-1 flex-col lg:overflow-y-auto"
      >
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main id="conteudo" tabIndex={-1} className="flex-1 px-4 pb-8 pt-2 outline-none sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
