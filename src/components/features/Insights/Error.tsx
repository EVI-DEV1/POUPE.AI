import { RefreshCw } from 'lucide-react';

import { UIButton } from '@/components/ui/Button';

interface ErrorProps {
  simulationId: string;
  message: string;
  onRetry: () => void;
}

export function Error({ simulationId, message, onRetry }: ErrorProps) {
  if (!simulationId || !message) {
    return null;
  }

  return (
    <div className="bg-danger-soft ring-danger/20 flex flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center ring-1">
      <p className="text-danger text-sm">⚠️ {message}</p>
      <UIButton icon={RefreshCw} onClick={onRetry}>
        Tentar novamente
      </UIButton>
    </div>
  );
}
