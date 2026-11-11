import { BookOpen, Calculator, type LucideIcon, Search, Target, X } from 'lucide-react';
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LESSONS } from '@/data/education';
import { MAIN_NAV, SETTINGS_NAV } from '@/data/navigation';
import { useSimulations } from '@/hooks/useSimulationStorage';
import { useGoals } from '@/stores';
import { formatBRL } from '@/utils/format';

interface SearchResult {
  id: string;
  group: 'Simulações' | 'Metas' | 'Conteúdos' | 'Páginas';
  title: string;
  subtitle: string;
  to: string;
  icon: LucideIcon;
}

const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function SearchBox() {
  const navigate = useNavigate();
  const simulations = useSimulations();
  const goals = useGoals();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const results = useMemo<SearchResult[]>(() => {
    const q = normalize(deferredQuery.trim());
    if (!q) return [];

    const match = (...fields: string[]) => fields.some((f) => normalize(f).includes(q));

    const fromSimulations: SearchResult[] = simulations
      .filter((s) => match(s.goalName, s.goalAmount))
      .slice(0, 4)
      .map((s) => ({
        id: `sim-${s.id}`,
        group: 'Simulações',
        title: s.goalName,
        subtitle: `R$ ${s.goalAmount} • ${s.goalDeadline} meses`,
        to: `/resultado/${s.id}`,
        icon: Calculator,
      }));

    const fromGoals: SearchResult[] = goals
      .filter((g) => match(g.name))
      .slice(0, 4)
      .map((g) => ({
        id: `goal-${g.id}`,
        group: 'Metas',
        title: g.name,
        subtitle: `${formatBRL(g.savedAmount)} de ${formatBRL(g.targetAmount)}`,
        to: `/metas#meta-${g.id}`,
        icon: Target,
      }));

    const fromLessons: SearchResult[] = LESSONS.filter((l) =>
      match(l.title, l.summary, l.category, ...l.keyPoints)
    )
      .slice(0, 4)
      .map((l) => ({
        id: `lesson-${l.id}`,
        group: 'Conteúdos',
        title: l.title,
        subtitle: `${l.category} • ${l.minutes} min`,
        to: `/educacao#${l.id}`,
        icon: BookOpen,
      }));

    const fromPages: SearchResult[] = [...MAIN_NAV, ...SETTINGS_NAV]
      .filter((p) => match(p.label, p.description))
      .slice(0, 3)
      .map((p) => ({
        id: `page-${p.to}`,
        group: 'Páginas',
        title: p.label,
        subtitle: p.description,
        to: p.to,
        icon: p.icon,
      }));

    return [...fromSimulations, ...fromGoals, ...fromLessons, ...fromPages];
  }, [deferredQuery, simulations, goals]);

  // Atalho Ctrl/⌘ + K
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const go = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
    void navigate(result.to);
  };

  const showPanel = open && query.trim().length > 0;
  const safeIndex = Math.min(activeIndex, Math.max(0, results.length - 1));

  return (
    <div ref={rootRef} className="relative w-full max-w-[560px]">
      <div className="surface rounded-full! flex h-12 items-center gap-2 px-5 focus-within:border-[#a855f7]/70">
        <label htmlFor={`${listId}-input`} className="sr-only">
          Buscar simulação, meta ou conteúdo
        </label>
        <input
          ref={inputRef}
          id={`${listId}-input`}
          type="search"
          role="combobox"
          autoComplete="off"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={
            showPanel && results[safeIndex] ? `${listId}-${results[safeIndex].id}` : undefined
          }
          placeholder="Buscar simulação, meta ou conteúdo..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((i) =>
                results.length ? (i - 1 + results.length) % results.length : 0
              );
            } else if (e.key === 'Enter' && results[safeIndex]) {
              e.preventDefault();
              go(results[safeIndex]);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-[0.95rem] outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        ) : (
          <Search size={22} className="text-foreground/80" aria-hidden />
        )}
      </div>

      {showPanel && (
        <div className="surface animate-fade-up absolute left-0 right-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm" role="status">
              Nada encontrado para “{query}”.
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Resultados da busca">
              {results.map((result, index) => {
                const Icon = result.icon;
                const showGroup = index === 0 || results[index - 1].group !== result.group;
                return (
                  <li key={result.id} role="presentation">
                    {showGroup && (
                      <p className="text-muted-foreground px-3 pb-1 pt-2 text-[0.7rem] font-semibold uppercase tracking-wider">
                        {result.group}
                      </p>
                    )}
                    <div
                      id={`${listId}-${result.id}`}
                      role="option"
                      aria-selected={index === safeIndex}
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => go(result)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${index === safeIndex ? 'bg-secondary-button' : ''}`}
                    >
                      <span className="bg-muted-primary text-primary-glow flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                        <Icon size={17} aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{result.title}</span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {result.subtitle}
                        </span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
