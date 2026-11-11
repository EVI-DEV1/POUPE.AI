import { MessageCircleMore, RefreshCw, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { askQuestion } from '@/services/aiService';

import { UIButton } from './Button';
import { Modal } from './Modal';

interface AIResponseDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Monta o prompt no momento da abertura, com os dados mais recentes. */
  buildPrompt: () => string;
  /** Pergunta sugerida caso o usuário queira continuar no chat. */
  followUpQuestion?: string;
}

export function AIResponseDialog({
  open,
  onClose,
  title,
  description,
  buildPrompt,
  followUpQuestion,
}: AIResponseDialogProps) {
  const navigate = useNavigate();
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const run = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const text = await askQuestion(buildPrompt());
      if (id === requestId.current) setAnswer(text);
    } catch (err) {
      if (id === requestId.current) {
        setError(err instanceof Error ? err.message : 'Não foi possível gerar a análise.');
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [buildPrompt]);

  useEffect(() => {
    if (open) {
      // Dispara a análise ao abrir; respostas antigas são descartadas via requestId.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void run();
    } else {
      requestId.current += 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      icon={<Sparkles size={18} />}
      footer={
        <>
          {followUpQuestion && (
            <UIButton
              variant="secondary"
              icon={MessageCircleMore}
              onClick={() => {
                onClose();
                void navigate(`/chat?q=${encodeURIComponent(followUpQuestion)}`);
              }}
            >
              Continuar no chat
            </UIButton>
          )}
          <UIButton onClick={onClose}>Fechar</UIButton>
        </>
      }
    >
      <div aria-live="polite" aria-busy={loading}>
        {loading && (
          <div className="space-y-3" role="status">
            <span className="sr-only">Gerando análise com IA…</span>
            {[92, 100, 85, 96, 70, 88].map((w, i) => (
              <div
                key={i}
                className="bg-skeleton-base h-3.5 animate-pulse rounded-full"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bg-danger-soft ring-danger/20 flex flex-col items-start gap-3 rounded-xl p-4 ring-1">
            <p className="text-danger text-sm">{error}</p>
            <UIButton size="sm" variant="secondary" icon={RefreshCw} onClick={() => void run()}>
              Tentar novamente
            </UIButton>
          </div>
        )}

        {!loading && answer && (
          <div className="space-y-3 whitespace-pre-wrap text-sm leading-relaxed">{answer}</div>
        )}

        <p className="text-muted-foreground mt-5 text-xs">
          Conteúdo educativo gerado por IA com base nos dados que você cadastrou no app. Não
          substitui a orientação de um profissional.
        </p>
      </div>
    </Modal>
  );
}
