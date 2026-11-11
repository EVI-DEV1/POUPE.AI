import { Check, CircleQuestionMark, HeartPulse, Info, Sparkles } from 'lucide-react';
import { useCallback, useId, useState } from 'react';
import { Link } from 'react-router-dom';

import { AIResponseDialog } from '@/components/ui/AIResponseDialog';
import { buttonClasses } from '@/components/ui/buttonStyles';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { buildHealthAnalysisPrompt } from '@/data/assistantPrompt';
import type { FinancialSnapshot } from '@/utils/finance';
import type { FinancialHealth } from '@/utils/financialHealth';
import { formatMonthLong } from '@/utils/format';

interface FinancialHealthCardProps {
  health: FinancialHealth | null;
  snapshot: FinancialSnapshot | null;
  buildContext: () => string;
  className?: string;
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative h-[150px] w-[150px] shrink-0">
      <div aria-hidden className="absolute inset-6 rounded-full bg-[#7c3aed]/25 blur-2xl" />
      <svg viewBox="0 0 180 180" className="relative h-full w-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="45%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <filter id={`${uid}f`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="90" cy="90" r={radius} fill="none" stroke="var(--border)" strokeWidth="13" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={`url(#${uid}g)`}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={`url(#${uid}f)`}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="leading-none">
          <span className="text-[2.4rem] font-bold tabular-nums tracking-tight">{score}</span>
          <span className="text-foreground/85 text-lg font-medium">/100</span>
        </p>
        <p className="text-success mt-1.5 text-lg font-semibold">{label}</p>
      </div>
    </div>
  );
}

export function FinancialHealthCard({
  health,
  snapshot,
  buildContext,
  className = '',
}: FinancialHealthCardProps) {
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const buildPrompt = useCallback(() => buildHealthAnalysisPrompt(buildContext()), [buildContext]);

  return (
    <section
      aria-labelledby="health-title"
      className={`surface flex flex-col p-5 sm:p-6 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="health-title" className="text-lg font-semibold sm:text-xl">
          Sua saúde financeira
        </h2>
        {health && (
          <button
            type="button"
            onClick={() => setCriteriaOpen(true)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-lg p-1 text-xs"
            aria-label="Como a pontuação é calculada"
          >
            <CircleQuestionMark size={16} />
          </button>
        )}
      </div>

      {!health ? (
        <EmptyState
          icon={HeartPulse}
          title="Precisamos de alguns dados"
          description="Informe sua receita e despesas no Planejamento (ou faça uma simulação) para calcular sua pontuação."
          action={
            <Link to="/planejamento?novo=1" className={buttonClasses('primary', 'sm')}>
              Informar dados
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-1 flex-col items-center gap-5 sm:flex-row sm:gap-7">
            <ScoreGauge score={health.score} label={health.label} />
            <ul className="w-full space-y-3.5">
              {health.checks.map((check) => (
                <li key={check.id} className="flex items-center gap-3 text-[0.95rem]">
                  {check.level === 'ok' ? (
                    <span className="bg-success flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white">
                      <Check size={15} strokeWidth={3} aria-hidden />
                    </span>
                  ) : (
                    <span className="border-warning text-warning flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2">
                      <Info size={14} strokeWidth={2.5} aria-hidden />
                    </span>
                  )}
                  <span>
                    {check.label}
                    <span className="sr-only">
                      {check.level === 'ok' ? ' (ok)' : ' (ponto de atenção)'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {snapshot?.source === 'simulation' && (
            <p className="text-muted-foreground mt-3 text-center text-xs sm:text-left">
              Base: simulação “{snapshot.sourceLabel}”
            </p>
          )}

          <button
            type="button"
            onClick={() => setAnalysisOpen(true)}
            className={buttonClasses('outline', 'md', 'rounded-full! mt-4 w-full text-base')}
          >
            <Sparkles size={18} aria-hidden /> Ver análise completa com IA
          </button>
        </>
      )}

      <AIResponseDialog
        open={analysisOpen}
        onClose={() => setAnalysisOpen(false)}
        title="Análise completa da sua saúde financeira"
        description="Gerada pela IA a partir dos dados cadastrados no app."
        buildPrompt={buildPrompt}
        followUpQuestion="Quais são as próximas ações mais importantes para melhorar minha saúde financeira?"
      />

      {health && (
        <Modal
          open={criteriaOpen}
          onClose={() => setCriteriaOpen(false)}
          title="Como calculamos sua pontuação"
          description="Indicador educativo baseado apenas nos dados que você informou."
          icon={<HeartPulse size={18} />}
        >
          {snapshot && (
            <p className="text-muted-foreground -mt-1 mb-4 text-xs">
              Base:{' '}
              {snapshot.source === 'planning'
                ? `planejamento de ${formatMonthLong(snapshot.sourceLabel)}`
                : `simulação “${snapshot.sourceLabel}”`}
            </p>
          )}
          <ul className="space-y-4">
            {health.criteria.map((c) => (
              <li key={c.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{c.label}</span>
                  <span className="tabular-nums">
                    {Math.round(c.points)} / {c.max} pts
                  </span>
                </div>
                <div className="bg-border mt-1.5 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#a855f7] to-[#22d3ee]"
                    style={{ width: `${(c.points / c.max) * 100}%` }}
                  />
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{c.detail}</p>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-5 text-xs leading-relaxed">
            Classificação: 80+ Excelente · 60–79 Boa · 40–59 Regular · abaixo de 40 Atenção. Não é
            uma avaliação de crédito. Veja todos os critérios em{' '}
            <Link
              to="/ajuda#pontuacao"
              className="text-primary-glow underline"
              onClick={() => setCriteriaOpen(false)}
            >
              Ajuda e Suporte
            </Link>
            .
          </p>
        </Modal>
      )}
    </section>
  );
}
