export type LessonCategory = 'Fundamentos' | 'Orçamento' | 'Dívidas' | 'Investimentos' | 'Metas';

export interface Lesson {
  id: string;
  title: string;
  category: LessonCategory;
  minutes: number;
  summary: string;
  paragraphs: string[];
  keyPoints: string[];
  question: string;
}

/**
 * Conteúdo educativo geral (não é recomendação individual de investimento).
 */
export const LESSONS: Lesson[] = [
  {
    id: 'orcamento-50-30-20',
    title: 'Regra 50/30/20: um ponto de partida para o orçamento',
    category: 'Orçamento',
    minutes: 4,
    summary: 'Uma forma simples de dividir a renda entre necessidades, desejos e futuro.',
    paragraphs: [
      'A regra 50/30/20 sugere destinar cerca de 50% da renda líquida às necessidades (moradia, contas, alimentação, transporte), 30% aos desejos (lazer, assinaturas, compras não essenciais) e 20% ao futuro (reserva, metas, investimentos e quitação antecipada de dívidas).',
      'Ela não é uma lei: em muitas realidades brasileiras as necessidades passam de 50%. O valor da regra está em dar um parâmetro para comparar. Se os custos fixos ocupam 70% da renda, você sabe onde está a pressão do orçamento.',
      'Comece registrando um mês completo no Planejamento do Poupe.ai. Com os números reais, ajuste as porcentagens aos poucos, priorizando sempre reservar algo para o futuro, mesmo que seja 5%.',
    ],
    keyPoints: [
      '50% necessidades, 30% desejos, 20% futuro',
      'Use como referência, não como regra rígida',
      'O primeiro passo é conhecer os próprios números',
    ],
    question: 'Como aplicar a regra 50/30/20 com a minha renda atual?',
  },
  {
    id: 'reserva-de-emergencia',
    title: 'Reserva de emergência: por que ela vem antes de tudo',
    category: 'Fundamentos',
    minutes: 5,
    summary: 'O colchão financeiro que evita dívidas caras quando o imprevisto chega.',
    paragraphs: [
      'A reserva de emergência é um valor guardado para imprevistos: perda de renda, problemas de saúde, consertos urgentes. Ela evita recorrer ao cheque especial ou ao rotativo do cartão, que estão entre os créditos mais caros do país.',
      'Uma referência comum é acumular de 3 a 6 meses do seu custo de vida mensal. Quem tem renda variável ou é autônomo costuma mirar em períodos maiores, como 12 meses.',
      'Esse dinheiro precisa de segurança e liquidez (poder ser resgatado rapidamente), não de alta rentabilidade. Por isso, aplicações conservadoras com resgate diário costumam ser as mais indicadas para essa finalidade.',
    ],
    keyPoints: [
      'Meta comum: 3 a 6 meses do custo de vida',
      'Prioridade: segurança e liquidez',
      'Evita juros altos em momentos de crise',
    ],
    question: 'Quanto eu deveria ter de reserva de emergência com base nos meus gastos?',
  },
  {
    id: 'juros-compostos',
    title: 'Juros compostos: o tempo trabalhando a seu favor (ou contra)',
    category: 'Investimentos',
    minutes: 4,
    summary: 'Entenda o efeito “juros sobre juros” em investimentos e dívidas.',
    paragraphs: [
      'Nos juros compostos, o rendimento de cada período é somado ao valor principal e passa a render também. Com o tempo, o crescimento deixa de ser linear e acelera.',
      'O mesmo mecanismo funciona contra você nas dívidas: no rotativo do cartão, por exemplo, os juros incidem sobre um saldo que já inclui juros anteriores, e a dívida cresce rápido.',
      'Por isso, começar cedo — mesmo com pouco — e evitar dívidas caras são as duas decisões que mais aproveitam os juros compostos a seu favor.',
    ],
    keyPoints: [
      'Rendimento gera novo rendimento',
      'Tempo é o fator mais poderoso',
      'Nas dívidas, o efeito é o mesmo — e perigoso',
    ],
    question: 'Pode me explicar juros compostos com um exemplo usando a minha meta?',
  },
  {
    id: 'sair-das-dividas',
    title: 'Como organizar e sair das dívidas',
    category: 'Dívidas',
    minutes: 6,
    summary: 'Um passo a passo para recuperar o controle do orçamento.',
    paragraphs: [
      'Liste todas as dívidas com valor total, parcela, taxa de juros e número de parcelas restantes. Ver tudo junto é o que permite decidir com clareza.',
      'Priorize as dívidas com juros mais altos (método avalanche) para pagar menos no total, ou as menores (método bola de neve) se você precisa de vitórias rápidas para manter a motivação.',
      'Procure renegociar: credores costumam oferecer descontos para quitação. Trocar uma dívida cara por uma mais barata (como um consignado no lugar do rotativo) pode ajudar — desde que você não volte a usar o crédito caro.',
    ],
    keyPoints: [
      'Liste tudo: valor, parcela e juros',
      'Avalanche (juros altos) ou bola de neve (menores)',
      'Renegocie e evite novas dívidas caras',
    ],
    question: 'Qual estratégia de quitação de dívidas faz mais sentido para mim?',
  },
  {
    id: 'renda-fixa-basico',
    title: 'Renda fixa para iniciantes',
    category: 'Investimentos',
    minutes: 5,
    summary: 'Tesouro Direto, CDB, LCI e LCA: o que são e para que servem.',
    paragraphs: [
      'Na renda fixa, as regras de remuneração são definidas no momento da aplicação: um percentual do CDI, uma taxa prefixada ou a inflação mais uma taxa.',
      'O Tesouro Selic é um título público com baixa volatilidade e liquidez diária, muito usado para reserva de emergência. CDBs são emitidos por bancos e, assim como LCIs e LCAs, contam com a proteção do FGC dentro dos limites estabelecidos.',
      'Antes de investir, observe: o prazo em que você precisará do dinheiro, a liquidez, a incidência de imposto de renda e quem é o emissor. Compare sempre a rentabilidade líquida.',
    ],
    keyPoints: [
      'Regras de rendimento conhecidas no início',
      'Liquidez e prazo devem casar com o objetivo',
      'Compare a rentabilidade líquida (após IR)',
    ],
    question: 'Quais tipos de investimento combinam com o prazo da minha meta?',
  },
  {
    id: 'metas-smart',
    title: 'Metas financeiras que saem do papel',
    category: 'Metas',
    minutes: 3,
    summary: 'Transforme sonhos em objetivos com valor, prazo e plano mensal.',
    paragraphs: [
      'Um objetivo vago como “juntar dinheiro” é difícil de acompanhar. Uma meta clara tem nome, valor, prazo e quanto precisa ser guardado por mês: “Viagem para a Bahia, R$ 5.000 em 10 meses, R$ 500 por mês”.',
      'Divida metas grandes em marcos menores e registre cada aporte. Ver o progresso aumenta muito a chance de continuar.',
      'Revise a meta quando a vida mudar. Ajustar prazo ou valor não é fracasso, é planejamento.',
    ],
    keyPoints: [
      'Nome, valor, prazo e valor mensal',
      'Registre cada aporte para ver o progresso',
      'Revisar a meta faz parte do processo',
    ],
    question: 'Como posso dividir minha meta em etapas mensais?',
  },
  {
    id: 'cartao-de-credito',
    title: 'Cartão de crédito sem sustos',
    category: 'Dívidas',
    minutes: 4,
    summary: 'Use o cartão como meio de pagamento, não como extensão da renda.',
    paragraphs: [
      'O cartão é útil para concentrar gastos e ganhar prazo, mas a fatura precisa caber no orçamento do mês. Pagar apenas o mínimo leva ao rotativo, uma das linhas de crédito mais caras.',
      'Parcelamentos “sem juros” somados viram um compromisso fixo dos próximos meses. Anote as parcelas no Planejamento como dívidas para enxergar o impacto real.',
      'Defina um limite pessoal menor que o limite do banco e acompanhe a fatura durante o mês, não só no vencimento.',
    ],
    keyPoints: [
      'Pague sempre a fatura total',
      'Parcelas somadas viram gasto fixo',
      'Tenha um limite pessoal abaixo do limite do banco',
    ],
    question: 'Como controlar melhor os gastos no cartão de crédito?',
  },
  {
    id: 'gastos-invisiveis',
    title: 'Gastos invisíveis: onde o dinheiro escapa',
    category: 'Orçamento',
    minutes: 3,
    summary: 'Assinaturas, taxas e pequenas compras que somam muito no fim do mês.',
    paragraphs: [
      'Pequenos valores recorrentes passam despercebidos: assinaturas esquecidas, tarifas bancárias, delivery frequente, compras por impulso em aplicativos.',
      'Revise o extrato e a fatura uma vez por mês procurando cobranças recorrentes. Cancele o que não usa e negocie pacotes de serviços.',
      'Uma técnica útil é a “regra das 24 horas”: antes de uma compra não planejada, espere um dia. Muitas vezes o desejo passa.',
    ],
    keyPoints: [
      'Revise assinaturas e tarifas todo mês',
      'Pequenos gastos recorrentes somam muito',
      'Espere 24 horas antes de compras por impulso',
    ],
    question: 'Quais gastos eu poderia revisar para economizar mais?',
  },
];
