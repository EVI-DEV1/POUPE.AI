import { ChartNoAxesCombined, Sparkles, Target } from 'lucide-react';
import type { PropsWithChildren } from 'react';

import { Logo } from '@/components/layout/Logo';

import { DemoNotice } from './DemoNotice';

const HIGHLIGHTS = [
  { icon: Target, text: 'Simule metas e descubra se elas cabem no seu orçamento.' },
  { icon: Sparkles, text: 'Receba diagnósticos e sugestões de um assistente com IA.' },
  { icon: ChartNoAxesCombined, text: 'Acompanhe planejamento, metas e evolução em um só lugar.' },
];

interface AuthLayoutProps {
  title: string;
  subtitle: string;
}

/** Estrutura das telas de acesso (padrão do DevOrbit, com a identidade do Poupe.ai). */
export function AuthLayout({ title, subtitle, children }: PropsWithChildren<AuthLayoutProps>) {
  return (
    <div className="bg-background relative min-h-dvh overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[480px] w-[640px] rounded-full bg-[#6d28d9]/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[520px] rounded-full bg-[#2563eb]/10 blur-[120px]" />
      </div>

      <main
        id="conteudo"
        className="relative mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-16"
      >
        <section className="flex flex-col gap-8">
          <Logo />
          <div className="hidden lg:block">
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              Planeje seus sonhos com <span className="text-gradient">clareza e IA</span>.
            </h2>
            <ul className="mt-8 space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="icon-tile h-10 w-10">
                    <Icon size={18} aria-hidden />
                  </span>
                  <span className="text-foreground/85">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="surface animate-fade-up mx-auto w-full max-w-md p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
          <div className="mt-5">
            <DemoNotice />
          </div>
          <div className="mt-6">{children}</div>
        </section>
      </main>
    </div>
  );
}
