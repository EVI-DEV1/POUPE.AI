import { useEffect, useRef, useState } from 'react'

import type { ChatMessage, SimulationRecord } from '@/data/simulation'
import { useSimulationStorage } from '@/hooks/useSimulationStorage'
import type { InsightData } from '@/services/aiService'
import { askQuestion } from '@/services/aiService'
import { Send } from 'lucide-react'


interface ChatSectionProps {
  simulationId: string
  insight: InsightData
}

export function ChatSection({
  simulationId,
  insight,
}: ChatSectionProps) {
  const { getFormData, updateSimulation } = useSimulationStorage()

  const simulation = getFormData(simulationId)

  const [question, setQuestion] = useState('')

  const [messages, setMessages] = useState<ChatMessage[]>(
    simulation?.chatHistory ?? []
  )

  const [isLoading, setIsLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [lastFailedQuestion, setLastFailedQuestion] =
  useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages])

async function handleSend(customQuestion?: string) {
  const questionToSend = customQuestion ?? question

  if (!questionToSend.trim()) return

  const isRetry = !!customQuestion

  let updatedMessages = messages

  if (!isRetry) {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: questionToSend,
    }

    updatedMessages = [...messages, userMessage]

    setMessages(updatedMessages)

    if (simulation) {
      updateSimulation(
        simulationId,
        {
          ...simulation,
          chatHistory: updatedMessages,
        } as SimulationRecord
      )
    }
  }
    setQuestion('')
    setError(null)
    setIsLoading(true)

    try {
const prompt = `
Você é um educador financeiro Você é o Educador Financeiro do aplicativo PoupeAI..

Dados da simulação:
${JSON.stringify(insight)}

Pergunta do usuário:
${questionToSend}

Regras:
- Responda como uma conversa natural.
- Seja amigável e acolhedor.
- Responda em português.
- Seja objetivo.
- Divida a resposta em 2 ou 3 parágrafos curtos.
- Use no máximo 120 palavras.
- Não utilize Markdown.
- Não utilize títulos.
- Não utilize ** ou ##.
- Responda como uma conversa natural.
- Não repita os dados completos da simulação.
- Foque apenas no que ajuda o usuário naquele momento.
- Pode usar emojis


Resposta:
`


      const answer = await askQuestion(prompt)

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: answer,
      }

     const finalMessages = [
  ...updatedMessages,
  assistantMessage,
]

setMessages(finalMessages)

const currentSimulation = getFormData(simulationId)

if (currentSimulation) {
  updateSimulation(
    simulationId,
    {
      ...currentSimulation,
      chatHistory: finalMessages,
    } as SimulationRecord
  )
}
  } catch (err) {
  console.error(err)

  setLastFailedQuestion(questionToSend)

  if (err instanceof Error) {
    setError(err.message)
  } else {
    setError('Não foi possível gerar uma resposta.')
  }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="mb-4 text-sm font-semibold">
        💬 Converse com o Educador Financeiro
      </h3>

      <div className="max-h-96 overflow-y-auto rounded-xl border border-border px-4 py-3">
        {messages.map((message) => (
           <div
    key={message.id}
    className="mb-4 rounded-xl border border-border p-4"
  >
    <p className="mb-2 text-sm font-semibold">
      {message.role === 'user'
        ? '💬 Você'
        : '🤖 Resposta da IA'}
    </p>

    <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
      {message.content}
        </p>
          </div>
        ))}

        {isLoading && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            🤖 Pensando...
          </p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
  <div className="mt-3 flex items-center gap-3">
    <p className="text-sm text-red-500">
      {error}
    </p>

    <button
    type="button"
  onClick={() => {
    if (!lastFailedQuestion) return

    setError(null)

    void handleSend(lastFailedQuestion)
  }}
  className="text-primary text-sm font-medium underline"
>
  Tentar novamente
    </button>
  </div>
)}
      <div className="mt-4 flex items-center gap-3">
        <input
          type="text"
  value={question}
  onChange={(e) => setQuestion(e.target.value)}
  placeholder="Faça uma pergunta sobre sua simulação..."
  disabled={isLoading}
  className="
    bg-background
    flex-1
    rounded-full
    border
    px-4
    py-3
    text-sm
  " 
   onKeyDown={(e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend()
    }
  }}
  />
        <button
    onClick={handleSend}
  disabled={isLoading}
  className="
    bg-primary
    text-primary-foreground
    flex
    h-12
    w-12
    items-center
    justify-center
    rounded-xl
    shrink-0
  " >
    <Send size={18} />
       
        </button>
      </div>
    </div>
  )
}
