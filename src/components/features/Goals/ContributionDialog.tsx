import { PiggyBank } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';

import { UIButton } from '@/components/ui/Button';
import { CurrencyField } from '@/components/ui/CurrencyField';
import { Modal } from '@/components/ui/Modal';
import type { Goal } from '@/data/finance';
import { parseCurrency } from '@/utils/currency';
import { formatBRL, formatDate } from '@/utils/format';

interface ContributionDialogProps {
  goal: Goal | null;
  onClose: () => void;
  onSubmit: (amount: number, note?: string) => void;
}

function ContributionForm({ goal, onClose, onSubmit }: ContributionDialogProps & { goal: Goal }) {
  const formId = useId();
  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = parseCurrency(amount);
    if (value <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }
    if (type === 'withdraw' && value > goal.savedAmount) {
      setError(`Você só tem ${formatBRL(goal.savedAmount)} guardados nesta meta.`);
      return;
    }
    onSubmit(type === 'deposit' ? value : -value, note.trim() || undefined);
  };

  const history = [...goal.contributions].reverse().slice(0, 5);

  return (
    <>
      <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div
          role="radiogroup"
          aria-label="Tipo de movimentação"
          className="bg-input border-border grid grid-cols-2 rounded-xl border p-1"
        >
          {(['deposit', 'withdraw'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={type === t}
              onClick={() => setType(t)}
              className={`rounded-lg py-2 text-sm font-medium transition ${type === t ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t === 'deposit' ? 'Guardar' : 'Retirar'}
            </button>
          ))}
        </div>

        <CurrencyField label="Valor" value={amount} onChange={setAmount} error={error} autoFocus />

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${formId}-note`} className="text-sm font-medium">
            Observação (opcional)
          </label>
          <input
            id={`${formId}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={80}
            placeholder="Ex.: 13º salário"
            className="field"
          />
        </div>
      </form>

      {history.length > 0 && (
        <div className="mt-5">
          <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wider">
            Últimas movimentações
          </p>
          <ul className="divide-border divide-y text-sm">
            {history.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-muted-foreground truncate">
                  {formatDate(c.date)}
                  {c.note ? ` • ${c.note}` : ''}
                </span>
                <span
                  className={`font-semibold tabular-nums ${c.amount >= 0 ? 'text-success' : 'text-danger'}`}
                >
                  {c.amount >= 0 ? '+' : '−'}
                  {formatBRL(Math.abs(c.amount))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-border mt-6 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <UIButton variant="secondary" onClick={onClose}>
          Cancelar
        </UIButton>
        <UIButton type="submit" form={formId}>
          Registrar
        </UIButton>
      </div>
    </>
  );
}

export function ContributionDialog({ goal, onClose, onSubmit }: ContributionDialogProps) {
  return (
    <Modal
      open={!!goal}
      onClose={onClose}
      title="Registrar aporte"
      description={
        goal
          ? `${goal.name}: ${formatBRL(goal.savedAmount)} de ${formatBRL(goal.targetAmount)}`
          : ''
      }
      icon={<PiggyBank size={18} />}
      size="sm"
    >
      {goal && <ContributionForm key={goal.id} goal={goal} onClose={onClose} onSubmit={onSubmit} />}
    </Modal>
  );
}
