import type { LegacySummary } from '@/auth/legacyImport';

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Resumo dos dados antigos encontrados no navegador. */
export function LegacySummaryList({ summary }: { summary: LegacySummary }) {
  const items = [
    summary.simulations > 0 && plural(summary.simulations, 'simulação', 'simulações'),
    summary.goals > 0 && plural(summary.goals, 'meta', 'metas'),
    summary.months > 0 && plural(summary.months, 'mês de planejamento', 'meses de planejamento'),
    summary.chatMessages > 0 &&
      plural(summary.chatMessages, 'mensagem do chat', 'mensagens do chat'),
  ].filter(Boolean) as string[];

  return (
    <ul className="bg-muted-primary space-y-1 rounded-xl px-4 py-3 text-sm">
      {items.map((item) => (
        <li key={item}>• {item}</li>
      ))}
    </ul>
  );
}
