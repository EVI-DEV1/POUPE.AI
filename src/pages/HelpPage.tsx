import { ChevronDown, ExternalLink, HeartPulse } from 'lucide-react';

import { PageHero } from '@/components/shared/PageHero';
import { Panel } from '@/components/ui/Panel';

const FAQ = [
  {
    q: 'Onde meus dados ficam salvos?',
    a: 'No armazenamento local (localStorage) do seu navegador. Não há servidor nem conta: se você limpar os dados do navegador ou trocar de dispositivo, as informações não acompanham. Use Preferências → Exportar dados para guardar uma cópia.',
  },
  {
    q: 'O Poupe.ai acessa minha conta bancária?',
    a: 'Não. Todos os valores são informados por você nas Simulações, Metas e Planejamento. O app não se conecta a bancos, cartões ou Open Finance.',
  },
  {
    q: 'Como a IA funciona?',
    a: 'Quando você pede um diagnóstico ou faz uma pergunta, o app envia um resumo dos seus dados cadastrados ao Google Gemini por meio de uma função no servidor (a chave da API não fica no navegador). As respostas são educativas e podem conter imprecisões.',
  },
  {
    q: 'Qual a diferença entre Simulação e Planejamento?',
    a: 'A simulação é um cenário: “se eu ganho X e gasto Y, consigo juntar Z no prazo?”. O Planejamento registra o que realmente aconteceu em cada mês e alimenta os indicadores e o gráfico do dashboard. Sem planejamento, o dashboard usa a simulação mais recente e avisa isso.',
  },
  {
    q: 'Editei uma simulação e o diagnóstico mudou. Por quê?',
    a: 'Quando algum valor muda, o diagnóstico antigo deixa de valer e a IA gera um novo. A conversa daquela simulação é mantida.',
  },
];

export function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 py-2">
      <PageHero
        title="Ajuda e Suporte"
        subtitle="Dúvidas frequentes e como os indicadores são calculados."
      />

      <Panel title="Perguntas frequentes">
        <div className="divide-border divide-y">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  size={18}
                  className="text-muted-foreground shrink-0 transition group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </Panel>

      <Panel
        id="pontuacao"
        className="scroll-mt-24"
        title={
          <span className="flex items-center gap-2">
            <HeartPulse size={20} className="text-primary-glow" aria-hidden /> Pontuação de saúde
            financeira
          </span>
        }
      >
        <p className="text-muted-foreground text-sm leading-relaxed">
          Indicador educativo de 0 a 100, calculado só com os dados que você informou (último mês do
          Planejamento ou, na falta dele, a simulação mais recente). Não é uma avaliação de crédito.
        </p>
        <div className="-mx-5 mt-4 overflow-x-auto sm:-mx-6">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase tracking-wider">
                <th scope="col" className="px-5 py-2 sm:px-6">
                  Critério
                </th>
                <th scope="col" className="px-3 py-2">
                  Pontos
                </th>
                <th scope="col" className="px-5 py-2 sm:px-6">
                  Como é calculado
                </th>
              </tr>
            </thead>
            <tbody className="[&_td]:align-top">
              <tr className="border-border/60 border-b">
                <td className="px-5 py-3 font-medium sm:px-6">Taxa de economia</td>
                <td className="px-3 py-3">35</td>
                <td className="text-muted-foreground px-5 py-3 sm:px-6">
                  Sobra ÷ receita. 20% ou mais = 35; 0% ou menos = 0; proporcional entre eles.
                </td>
              </tr>
              <tr className="border-border/60 border-b">
                <td className="px-5 py-3 font-medium sm:px-6">Dívidas</td>
                <td className="px-3 py-3">25</td>
                <td className="text-muted-foreground px-5 py-3 sm:px-6">
                  Dívidas ÷ receita. Até 10% = 25; 40% ou mais = 0.
                </td>
              </tr>
              <tr className="border-border/60 border-b">
                <td className="px-5 py-3 font-medium sm:px-6">Custos fixos</td>
                <td className="px-3 py-3">20</td>
                <td className="text-muted-foreground px-5 py-3 sm:px-6">
                  Custos fixos ÷ receita. Até 50% = 20; 80% ou mais = 0.
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium sm:px-6">Metas</td>
                <td className="px-3 py-3">20</td>
                <td className="text-muted-foreground px-5 py-3 sm:px-6">
                  Sem metas ativas = 0. Com metas: 8 pontos + até 12 conforme a sobra mensal cobre o
                  valor necessário para as metas com prazo.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground mt-4 text-xs">
          Classificação: 80+ Excelente · 60–79 Boa · 40–59 Regular · abaixo de 40 Atenção.
        </p>
      </Panel>

      <Panel title="Projeto">
        <p className="text-muted-foreground text-sm leading-relaxed">
          O Poupe.ai é um projeto de portfólio desenvolvido no Bootcamp Santander/DIO com React,
          TypeScript, Tailwind CSS e IA generativa.
        </p>
        <a
          href="https://github.com/EVI-DEV1/POUPE.AI"
          target="_blank"
          rel="noreferrer"
          className="text-primary-glow mt-3 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          Ver código no GitHub <ExternalLink size={14} aria-hidden />
        </a>
      </Panel>
    </div>
  );
}
