import { BookOpen, Calculator, ChartColumnIncreasing, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AIAssistantMascot } from './AIAssistantMascot';
import { QuickActionCard } from './QuickActionCard';

interface WelcomeBannerProps {
  userName: string;
}

const ACTIONS = [
  { to: '/simulacoes', icon: Calculator, label: 'Nova Simulação', highlighted: true },
  { to: '/metas?nova=1', icon: Target, label: 'Criar Meta' },
  { to: '/planejamento', icon: ChartColumnIncreasing, label: 'Planejamento Mensal' },
  { to: '/educacao', icon: BookOpen, label: 'Aprender Finanças' },
];

export function WelcomeBanner({ userName }: WelcomeBannerProps) {
  const firstName = userName.trim().split(/\s+/)[0];

  return (
    <section
      aria-labelledby="welcome-title"
      className="from-(--hero-from) via-(--hero-via) to-(--hero-to) relative overflow-hidden rounded-[1.5rem] border border-[#7c3aed]/45 bg-gradient-to-br text-white shadow-[0_20px_60px_-25px_rgba(124,58,237,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      {/* luzes */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[58%] top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a855f7]/35 blur-[90px]" />
        <div className="absolute -left-10 -top-24 h-56 w-72 rounded-full bg-[#7c3aed]/30 blur-[80px]" />
        <div className="absolute bottom-0 right-0 h-40 w-96 rounded-full bg-[#9333ea]/25 blur-[80px]" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
          <defs>
            <pattern id="welcome-dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#fff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#welcome-dots)" />
        </svg>
      </div>

      <div className="relative grid gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)] xl:gap-2 xl:py-5 xl:pr-8">
        <div className="min-w-0">
          <h1
            id="welcome-title"
            className="text-[1.75rem] font-bold tracking-tight sm:text-[2.1rem]"
          >
            {firstName ? `Olá, ${firstName}!` : 'Olá!'}{' '}
            <span role="img" aria-label="aceno">
              👋
            </span>
          </h1>
          <p className="mt-1 text-base text-white/85 sm:text-[1.2rem]">
            Vamos cuidar do seu futuro financeiro hoje?
          </p>
          {!firstName && (
            <Link
              to="/perfil"
              className="mt-2 inline-block text-sm text-[#e9d5ff] underline-offset-4 hover:underline"
            >
              Personalize seu perfil →
            </Link>
          )}

          <nav aria-label="Atalhos" className="mt-5">
            <ul className="grid max-w-[560px] grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {ACTIONS.map((action) => (
                <li key={action.to}>
                  <QuickActionCard {...action} />
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 xl:-my-4">
          <AIAssistantMascot className="h-36 w-32 shrink-0 sm:h-44 sm:w-40 xl:h-[232px] xl:w-[200px]" />

          <Link
            to="/chat"
            aria-label="Abrir o chat com o Assistente Poupe.ai"
            className="group relative flex-1 rounded-[1.4rem] border border-[#c084fc]/55 bg-[#1a1048]/55 p-4 shadow-[0_0_36px_-10px_rgba(168,85,247,0.9),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md transition hover:border-[#e9d5ff]/80 sm:p-6 xl:max-w-[340px]"
          >
            {/* ponta do balão */}
            <span
              aria-hidden
              className="absolute -left-[9px] top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-b border-l border-[#c084fc]/55 bg-[#1f1250]"
            />
            <p className="flex items-center gap-2 text-base font-semibold sm:text-[1.2rem]">
              <Sparkles size={20} className="text-[#e9d5ff]" aria-hidden />
              Assistente Poupe.ai
            </p>
            <p className="mt-2 text-sm leading-snug text-white/85 sm:text-[1.05rem]">
              Com IA, eu analiso suas simulações, sugiro estratégias e te ajudo a alcançar seus
              objetivos.
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}
