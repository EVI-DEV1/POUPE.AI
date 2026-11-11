import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { DreamIllustration } from './DreamIllustration';

export function DreamBanner({ className = '' }: { className?: string }) {
  return (
    <section
      aria-labelledby="dream-title"
      className={`relative isolate overflow-hidden rounded-[1.25rem] border border-[#a855f7]/50 bg-gradient-to-br from-[#2a1260] via-[#3b1478] to-[#5b1673] text-white shadow-[0_0_40px_-14px_rgba(236,72,153,0.7),inset_0_1px_0_rgba(255,255,255,0.1)] ${className}`}
    >
      <DreamIllustration className="absolute inset-y-0 right-0 -z-10 h-full w-[70%] sm:w-[62%]" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#2a1260] via-[#2a1260]/85 to-transparent"
      />

      <div className="flex h-full max-w-[22rem] flex-col justify-center p-6 sm:p-8">
        <h2 id="dream-title" className="text-[1.6rem] font-bold leading-tight sm:text-[1.85rem]">
          Planeje seus sonhos com a IA{' '}
          <span role="img" aria-label="brilho">
            ✨
          </span>
        </h2>
        <p className="mt-3 text-[0.95rem] leading-snug text-white/85 sm:text-base">
          Simule, economize e conquiste seus objetivos de forma inteligente.
        </p>
        <Link
          to="/simulacoes"
          className="btn-glow mt-5 inline-flex h-11 w-fit items-center gap-2 rounded-xl px-5 text-[0.95rem] font-semibold text-white transition hover:brightness-110"
        >
          Nova simulação <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
