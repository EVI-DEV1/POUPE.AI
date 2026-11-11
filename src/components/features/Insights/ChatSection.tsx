import { useEffect, useRef, useState } from 'react';

import { ChatPanel } from '@/components/features/Chat/ChatPanel';
import type { ChatMessage, SimulationRecord } from '@/data/simulation';
import { useSimulationStorage } from '@/hooks/useSimulationStorage';
import type { InsightData } from '@/services/aiService';
import { askQuestion } from '@/services/aiService';

interface ChatSectionProps {
  simulationId: string;
  insight: InsightData;
}

const SUGGESTIONS = [
  'Como posso atingir essa meta mais rápido?',
  'Onde posso cortar gastos?',
  'Qual investimento combina com essa meta?',
];

/** Chat contextual da simulação — o histórico continua salvo em `chatHistory`. */
export function ChatSection({ simulationId, insight }: ChatSectionProps) {
  const { getFormData, updateSimulation } = useSimulationStorage();

  const [messages, setMessages] = useState<ChatMessage[]>(
    () => getFormData(simulationId)?.chatHistory ?? []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const persist = (chatHistory: ChatMessage[]) => {
    const current = getFormData(simulationId);
    if (current) {
      updateSimulation(simulationId, { ...current, chatHistory } as SimulationRecord);
    }
  };

  async function handleSend(questionToSend: string, isRetry = false) {
    if (!questionToSend.trim() || isLoading) return;

    let updatedMessages = messages;

    if (!isRetry) {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: questionToSend,
      };
      updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      persist(updatedMessages);
    }

    setError(null);
    setIsLoading(true);

    try {
      const simulation = getFormData(simulationId);
      const prompt = `
Você é o Educador Financeiro do aplicativo Poupe.ai.

Dados da simulação:
${JSON.stringify({
  renda: simulation?.income,
  custosFixos: simulation?.expenses,
  dividas: simulation?.debts,
  meta: simulation?.goalName,
  valorMeta: simulation?.goalAmount,
  prazoMeses: simulation?.goalDeadline,
})}

Diagnóstico já gerado:
${JSON.stringify(insight)}

Conversa até agora:
${updatedMessages
  .slice(-8, -1)
  .map((m) => `${m.role === 'user' ? 'Usuário' : 'Educador'}: ${m.content}`)
  .join('\n')}

Pergunta do usuário:
${questionToSend}

Regras:
- Responda como uma conversa natural, amigável e acolhedora.
- Responda em português.
- Seja objetivo: 2 ou 3 parágrafos curtos, no máximo 120 palavras.
- Não utilize Markdown, títulos, ** ou ##.
- Não repita os dados completos da simulação.
- Use apenas os dados acima; nunca invente valores nem diga ter acesso a contas bancárias.
- Pode usar emojis.

Resposta:
`;

      const answer = await askQuestion(prompt);

      const finalMessages = [
        ...updatedMessages,
        { id: crypto.randomUUID(), role: 'assistant' as const, content: answer },
      ];

      persist(finalMessages);
      if (mounted.current) {
        setMessages(finalMessages);
        setLastFailedQuestion(null);
      }
    } catch (err) {
      console.error(err);
      if (mounted.current) {
        setLastFailedQuestion(questionToSend);
        setError(err instanceof Error ? err.message : 'Não foi possível gerar uma resposta.');
      }
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }

  return (
    <div className="border-border mt-6 border-t pt-5">
      <h3 className="mb-3 text-base font-semibold">💬 Converse com o Educador Financeiro</h3>
      <ChatPanel
        messages={messages}
        isLoading={isLoading}
        error={error}
        onRetry={lastFailedQuestion ? () => void handleSend(lastFailedQuestion, true) : undefined}
        onSend={(text) => void handleSend(text)}
        suggestions={SUGGESTIONS}
        placeholder="Faça uma pergunta sobre sua simulação..."
        className="h-[420px]"
      />
    </div>
  );
}
