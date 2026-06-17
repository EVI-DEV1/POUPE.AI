import 'react-loading-skeleton/dist/skeleton.css'

import Skeleton from 'react-loading-skeleton'

import { useInsight } from '@/hooks/useInsight'

import { Content } from '../Insights/Content'
import { Error } from '../Insights/Error'

import { ChatSection } from '../Insights/ChatSection'

interface AIInsightCardProps {
  simulationId: string
}

export function AIInsightsCard({ simulationId }: AIInsightCardProps) {
  const { insight, isLoading, error, fetchInsight } = useInsight(simulationId)
 if (insight) {
  console.log(insight)
}
  return (
    <div className="bg-card rounded-2xl p-6 overflow-y-auto shadow-[4px_4px_18px_0px_rgba(0,0,0,0.2)] lg:order-1 lg:col-span-2">
      <div className="mb-3 flex items-center gap-1.5">
        <span>✨</span>
        <span className="text-primary text-xs font-semibold tracking-widest uppercase">
          Insight Financeiro Personalizado
        </span>
      </div>

      {isLoading && (
        <div className="flex">
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
            fetchInsight(simulationId)
          }}
        />
      )}
      {!isLoading && insight && !error && (
      <>
        <Content insight={insight} />

        <ChatSection
          simulationId={simulationId}
          insight={insight}
        />
      </>
    )}
  </div>   
)
}
