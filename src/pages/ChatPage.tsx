import { Calculator, CalendarDays, Eraser, ShieldCheck, Target, Wallet } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ChatPanel } from '@/components/features/Chat/ChatPanel';
import { PageHero } from '@/components/shared/PageHero';
import { UIButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Panel } from '@/components/ui/Panel';
import { buildAssistantChatPrompt } from '@/data/assistantPrompt';
import type { AssistantMessage } from '@/data/finance';
import { useFinancialOverview } from '@/hooks/useFinancialOverview';
import { askQuestion } from '@/services/aiService';
import { assistantChatStore, useAssistantChat } from '@/stores';

const SUGGESTIONS = [
  'Como está minha saúde financeira?',
  'Minhas metas cabem no meu orçamento?',
  'Como montar uma reserva de emergência?',
  'Onde posso economizar este mês?',
];

export function ChatPage() {
  const messages = useAssistantChat();
  const { simulations, goals, planning, buildContext } = useFinancialOverview();
  const [searchParams] = useSearchParams();
  const initialQuestion = searchParams.get('q') ?? '';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const send = async (question: string, isRetry = false) => {
    if (isLoading) return;
    const history = assistantChatStore.read();

    if (!isRetry) {
      const userMessage: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: question,
        createdAt: new Date().toISOString(),
      };
      assistantChatStore.write([...history, userMessage]);
    }

    setError(null);
    setIsLoading(true);

    try {
      const prompt = buildAssistantChatPrompt(
        buildContext(),
        isRetry ? history.slice(0, -1) : history,
        question
      );
      const answer = await askQuestion(prompt);
      assistantChatStore.write((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: answer,
          createdAt: new Date().toISOString(),
        },
      ]);
      if (mounted.current) setFailed(null);
    } catch (err) {
      if (mounted.current) {
        setFailed(question);
        setError(err instanceof Error ? err.message : 'Não foi possível gerar uma resposta.');
      }
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  };

  const contextItems = [
    { icon: Calculator, label: 'Simulações', value: simulations.length },
    { icon: Target, label: 'Metas', value: goals.length },
    { icon: CalendarDays, label: 'Meses no planejamento', value: planning.months.length },
    {
      icon: Wallet,
      label: 'Saldo informado',
      value: planning.currentBalance !== null ? 'Sim' : 'Não',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] py-2">
      <PageHero
        title="Chat com IA"
        subtitle="Converse com o Assistente Poupe.ai sobre suas finanças."
        actions={
          messages.length > 0 && (
            <UIButton variant="secondary" icon={Eraser} onClick={() => setConfirmClear(true)}>
              Limpar conversa
            </UIButton>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <ChatPanel
          key={initialQuestion}
          initialInput={initialQuestion}
          messages={messages}
          isLoading={isLoading}
          error={error}
          onSend={(text) => void send(text)}
          onRetry={failed ? () => void send(failed, true) : undefined}
          suggestions={SUGGESTIONS}
          placeholder="Pergunte sobre metas, gastos, investimentos..."
          className="surface h-[calc(100dvh-240px)] min-h-[460px]"
        />

        <aside className="flex flex-col gap-4">
          <Panel title="O que a IA vê" as="div">
            <ul className="space-y-3 text-sm">
              {contextItems.map(({ icon: Icon, label, value }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="bg-muted-primary text-primary-glow flex h-8 w-8 items-center justify-center rounded-lg">
                    <Icon size={16} aria-hidden />
                  </span>
                  <span className="flex-1">{label}</span>
                  <span className="font-semibold tabular-nums">{value}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel as="div">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldCheck size={18} className="text-success" aria-hidden /> Privacidade
            </p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Um resumo dos dados acima é enviado à IA (Google Gemini) apenas quando você faz uma
              pergunta. O app não tem acesso a contas bancárias e a IA não deve inventar valores.
            </p>
          </Panel>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Limpar conversa?"
        description="Todas as mensagens deste chat serão apagadas. Conversas dentro das simulações não são afetadas."
        confirmLabel="Limpar"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          assistantChatStore.write([]);
          setConfirmClear(false);
          setError(null);
          setFailed(null);
        }}
      />
    </div>
  );
}
