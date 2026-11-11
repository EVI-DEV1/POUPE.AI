import { RefreshCw, SendHorizontal, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { AIAssistantMascot } from '@/components/features/Dashboard/AIAssistantMascot';
import { Avatar } from '@/components/ui/Avatar';
import type { ChatMessage } from '@/data/simulation';
import { useProfile } from '@/stores';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onRetry?: () => void;
  suggestions?: string[];
  placeholder?: string;
  initialInput?: string;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

function AssistantAvatar() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#2a1563] to-[#120c35] ring-1 ring-[#a855f7]/50">
      <AIAssistantMascot still className="mt-2 h-10 w-9" />
    </span>
  );
}

export function ChatPanel({
  messages,
  isLoading,
  error,
  onSend,
  onRetry,
  suggestions = [],
  placeholder = 'Escreva sua pergunta...',
  initialInput = '',
  className = '',
  emptyTitle = 'Como posso ajudar?',
  emptyDescription = 'Pergunte sobre suas simulações, metas ou qualquer dúvida de finanças pessoais.',
}: ChatPanelProps) {
  const profile = useProfile();
  const [input, setInput] = useState(initialInput);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading, error]);

  const send = (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <div
      className={`bg-input/60 border-border flex min-h-0 flex-col overflow-hidden rounded-2xl border ${className}`}
    >
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Mensagens do chat"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AIAssistantMascot className="h-28 w-24" />
            <p className="font-semibold">{emptyTitle}</p>
            <p className="text-muted-foreground max-w-sm text-sm">{emptyDescription}</p>
          </div>
        )}

        {messages.map((message) =>
          message.role === 'user' ? (
            <div key={message.id} className="animate-fade-up flex justify-end gap-2.5">
              <p className="btn-glow max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed text-white sm:max-w-[75%]">
                <span className="sr-only">Você: </span>
                {message.content}
              </p>
              <Avatar profile={profile} size={36} />
            </div>
          ) : (
            <div key={message.id} className="animate-fade-up flex gap-2.5">
              <AssistantAvatar />
              <div className="surface rounded-2xl! rounded-tl-md! max-w-[85%] whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]">
                <span className="sr-only">Assistente: </span>
                {message.content}
              </div>
            </div>
          )
        )}

        {isLoading && (
          <div className="flex gap-2.5" role="status">
            <AssistantAvatar />
            <div className="surface rounded-2xl! rounded-tl-md! flex items-center gap-1.5 px-4 py-3.5">
              <span className="sr-only">O assistente está digitando…</span>
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="bg-primary-glow h-2 w-2 animate-bounce rounded-full"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-danger-soft ring-danger/20 flex flex-wrap items-center gap-3 rounded-xl p-3 ring-1">
            <p className="text-danger flex-1 text-sm">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-foreground flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
              >
                <RefreshCw size={14} /> Tentar novamente
              </button>
            )}
          </div>
        )}
      </div>

      {suggestions.length > 0 && messages.length === 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={isLoading}
              onClick={() => send(s)}
              className="border-border hover:border-primary-glow/60 hover:bg-muted-primary flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-50"
            >
              <Sparkles size={12} className="text-primary-glow" aria-hidden /> {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-border flex items-center gap-2 border-t p-3"
      >
        <label htmlFor="chat-input" className="sr-only">
          Mensagem
        </label>
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          maxLength={1000}
          autoComplete="off"
          className="field rounded-full! h-12 flex-1 px-5"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="Enviar mensagem"
          className="btn-glow flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition hover:brightness-110 disabled:opacity-50"
        >
          <SendHorizontal size={20} />
        </button>
      </form>
    </div>
  );
}
