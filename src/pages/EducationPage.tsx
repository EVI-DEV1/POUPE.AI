import { BookOpen, ChevronDown, Clock, MessageCircleMore } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { PageHero } from '@/components/shared/PageHero';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { LESSONS, type LessonCategory } from '@/data/education';

const CATEGORIES: ('Todas' | LessonCategory)[] = [
  'Todas',
  'Fundamentos',
  'Orçamento',
  'Dívidas',
  'Investimentos',
  'Metas',
];

export function EducationPage() {
  const { hash } = useLocation();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Todas');
  const [openId, setOpenId] = useState<string | null>(hash ? hash.slice(1) : null);
  const [lastHash, setLastHash] = useState(hash);

  // Abre a lição vinda da busca (#id) mesmo quando a página já está montada.
  if (hash !== lastHash) {
    setLastHash(hash);
    if (hash) setOpenId(hash.slice(1));
  }

  const lessons = LESSONS.filter((l) => category === 'Todas' || l.category === category);

  return (
    <div className="mx-auto w-full max-w-[1100px] py-2">
      <PageHero
        title="Educação financeira"
        subtitle="Conteúdos curtos e práticos para decidir melhor. Material educativo — não é recomendação de investimento."
      />

      <div role="group" aria-label="Filtrar por categoria" className="mb-5 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${category === c ? 'border-primary-glow bg-muted-primary text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {lessons.map((lesson) => {
          const open = openId === lesson.id;
          const panelId = `${lesson.id}-panel`;
          return (
            <li key={lesson.id} id={lesson.id} className="surface scroll-mt-24 overflow-hidden">
              <h2>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenId(open ? null : lesson.id)}
                  className="hover:bg-secondary-button/40 flex w-full items-center gap-4 p-5 text-left transition"
                >
                  <span className="icon-tile h-11 w-11">
                    <BookOpen size={20} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold sm:text-lg">{lesson.title}</span>
                    <span className="text-muted-foreground mt-0.5 block text-sm">
                      {lesson.summary}
                    </span>
                    <span className="text-muted-foreground mt-1.5 flex items-center gap-3 text-xs">
                      <span className="bg-muted-primary text-primary-glow rounded-full px-2 py-0.5 font-medium">
                        {lesson.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} aria-hidden /> {lesson.minutes} min
                      </span>
                    </span>
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-muted-foreground shrink-0 transition ${open ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
              </h2>
              {open && (
                <div
                  id={panelId}
                  className="animate-fade-up border-border border-t px-5 pb-5 pt-4 sm:pl-[5.25rem]"
                >
                  <div className="space-y-3 text-[0.95rem] leading-relaxed">
                    {lesson.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  <div className="bg-muted-primary mt-4 rounded-xl p-4">
                    <p className="mb-2 text-sm font-semibold">Pontos-chave</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {lesson.keyPoints.map((k) => (
                        <li key={k}>{k}</li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    to={`/chat?q=${encodeURIComponent(lesson.question)}`}
                    className={buttonClasses('outline', 'md', 'mt-4')}
                  >
                    <MessageCircleMore size={16} aria-hidden /> Perguntar à IA sobre isso
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
