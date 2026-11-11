import 'react-loading-skeleton/dist/skeleton.css';

import { Sparkles } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';

import { useInsight } from '@/hooks/useInsight';

import { ChatSection } from '../Insights/ChatSection';
import { Content } from '../Insights/Content';
import { Error } from '../Insights/Error';

interface AIInsightCardProps {
  simulationId: string;
}

export function AIInsightsCard({ simulationId }: AIInsightCardProps) {
  const { insight, isLoading, error, fetchInsight } = useInsight(simulationId);

  return (
    <section
      className="surface p-5 sm:p-6 lg:order-1 lg:col-span-2"
      aria-labelledby="insight-title"
      aria-busy={isLoading}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="icon-tile rounded-lg! h-8 w-8">
          <Sparkles size={16} aria-hidden />
        </span>
        <h2
          id="insight-title"
          className="text-primary-glow text-xs font-semibold uppercase tracking-widest"
        >
          Insight Financeiro Personalizado
        </h2>
      </div>

      {isLoading && (
        <div className="flex" role="status">
          <span className="sr-only">Gerando diagnóstico com IA…</span>
          <Skeleton
            count={10.5}
            baseColor="var(--color-skeleton-base)"
            highlightColor="var(--color-skeleton-highlight)"
            className="mb-3 flex rounded-lg"
            containerClassName="flex-1"
            inline
          />
        </div>
      )}
      {!isLoading && error && (
        <Error
          simulationId={simulationId}
          message={error}
          onRetry={() => {
            void fetchInsight(simulationId);
          }}
        />
      )}
      {!isLoading && insight && !error && (
        <>
          <Content insight={insight} />
          <ChatSection simulationId={simulationId} insight={insight} />
        </>
      )}
    </section>
  );
}
