interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

export interface InsightData {
  feasibility: {
    status: 'viable' | 'needs_adjustment' | 'unfeasible';
    content: string;
  };
  diagnosis: {
    content: string;
  };
  suggestions: {
    items: string[];
  };
  extraIncome: {
    items: string[];
  };
  investment: {
    items: string[];
  };
  motivation: {
    content: string;
  };
}

/**
 * A chamada ao Gemini passa por `/api/gemini` (função serverless), para que
 * a chave da API nunca seja publicada no bundle do navegador.
 */
const AI_ENDPOINT = '/api/gemini';

const errorCodeFrom = (body: string): string | null => {
  try {
    const parsed: unknown = JSON.parse(body);
    const code = (parsed as { error?: unknown } | null)?.error;
    return typeof code === 'string' ? code : null;
  } catch {
    return null;
  }
};

/** Mensagem exibida ao usuário a partir do código devolvido por `/api/gemini`. */
export function errorMessage(status: number, code: string | null): string {
  switch (code) {
    case 'missing_api_key':
      return '🤖 A IA ainda não foi configurada neste ambiente (GEMINI_API_KEY ausente).';
    case 'invalid_prompt':
    case 'payload_too_large':
      return '🤖 Mensagem vazia ou longa demais para a IA. Tente encurtar o texto.';
    case 'rate_limited':
    case 'upstream_rate_limited':
      return '🤖 Limite de uso da IA atingido. Tente novamente em alguns minutos.';
    case 'upstream_unavailable':
    case 'upstream_timeout':
    case 'upstream_unreachable':
      return '🤖 Serviço de IA temporariamente indisponível. Tente novamente mais tarde.';
    case 'upstream_auth':
      return '🤖 Erro de autenticação da IA. Verifique a chave da API.';
    case 'forbidden_origin':
      return '🤖 Acesso à IA indisponível no momento.';
  }

  switch (status) {
    case 429:
      return '🤖 Limite de uso da IA atingido. Tente novamente em alguns minutos.';
    case 503:
      return '🤖 Serviço de IA temporariamente indisponível. Tente novamente mais tarde.';
    case 401:
      return '🤖 Erro de autenticação da IA. Verifique a chave da API.';
    case 403:
      return '🤖 Acesso à IA indisponível no momento.';
    case 404:
      return '🤖 Serviço de IA não encontrado neste ambiente.';
    default:
      return '🤖 Não foi possível gerar a resposta no momento. Tente novamente.';
  }
}

const callGeminiAPI = async (prompt: string) => {
  let response: Response;

  try {
    response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
  } catch {
    throw new Error(
      '🤖 Sem conexão com o serviço de IA. Verifique sua internet e tente novamente.'
    );
  }

  const body = await response.text();

  if (!response.ok) {
    const code = errorCodeFrom(body);
    // Apenas metadados: o corpo de erro não contém dados do usuário.
    console.error('Erro na IA:', response.status, code ?? 'sem_codigo');
    throw new Error(errorMessage(response.status, code));
  }

  try {
    return JSON.parse(body) as GeminiResponse;
  } catch {
    throw new Error('🤖 Resposta inesperada do serviço de IA.');
  }
};

const extractText = (response: GeminiResponse) => {
  const text = response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('');

  if (!text) {
    throw new Error('🤖 A IA não retornou uma resposta. Tente reformular a pergunta.');
  }
  return text;
};

export const getInsight = async (prompt: string) => {
  const response = await callGeminiAPI(prompt);

  try {
    const json = extractText(response)
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const data = JSON.parse(json) as InsightData;

    // O schema antigo do prompt tinha um erro de digitação ("needs_adjustement").
    if ((data.feasibility?.status as string) === 'needs_adjustement') {
      data.feasibility.status = 'needs_adjustment';
    }

    return data;
  } catch {
    throw new Error('🤖 Não foi possível interpretar a resposta da IA.');
  }
};

export const askQuestion = async (prompt: string) => {
  const response = await callGeminiAPI(prompt);

  return extractText(response).replace(/\*\*/g, '').replace(/###/g, '').replace(/##/g, '').trim();
};
