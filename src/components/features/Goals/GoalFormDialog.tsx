import { Target } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';

import { UIButton } from '@/components/ui/Button';
import { CurrencyField } from '@/components/ui/CurrencyField';
import { Modal } from '@/components/ui/Modal';
import type { Goal, GoalCategory } from '@/data/finance';
import type { GoalInput } from '@/stores';
import { GOAL_CATEGORIES } from '@/utils/categories';
import { parseCurrency } from '@/utils/currency';
import { toMaskedCurrency } from '@/utils/format';

export interface GoalPrefill {
  name?: string;
  category?: GoalCategory;
  targetAmount?: number;
  deadline?: string;
  simulationId?: string;
}

interface GoalFormDialogProps {
  open: boolean;
  goal?: Goal | null;
  prefill?: GoalPrefill | null;
  onClose: () => void;
  onSubmit: (input: GoalInput) => void;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

function GoalForm({ goal, prefill, onClose, onSubmit }: Omit<GoalFormDialogProps, 'open'>) {
  const formId = useId();
  const [name, setName] = useState(goal?.name ?? prefill?.name ?? '');
  const [category, setCategory] = useState<GoalCategory>(
    goal?.category ?? prefill?.category ?? 'other'
  );
  const [target, setTarget] = useState(
    goal
      ? toMaskedCurrency(goal.targetAmount)
      : prefill?.targetAmount
        ? toMaskedCurrency(prefill.targetAmount)
        : ''
  );
  const [saved, setSaved] = useState('');
  const [deadline, setDeadline] = useState(goal?.deadline ?? prefill?.deadline ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const targetAmount = parseCurrency(target);
    const savedAmount = parseCurrency(saved);

    if (!name.trim()) nextErrors.name = 'Dê um nome para a meta.';
    if (targetAmount <= 0) nextErrors.target = 'Informe um valor maior que zero.';
    if (!goal && savedAmount > targetAmount && targetAmount > 0)
      nextErrors.saved = 'O valor guardado não pode ser maior que a meta.';
    if (deadline && !goal && deadline < todayIso())
      nextErrors.deadline = 'Escolha uma data futura.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      name: name.trim().slice(0, 60),
      category,
      targetAmount,
      savedAmount: goal ? goal.savedAmount : savedAmount,
      deadline,
      simulationId: goal?.simulationId ?? prefill?.simulationId,
    });
  };

  return (
    <>
      <form id={formId} onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor={`${formId}-name`} className="text-sm font-medium">
            Nome da meta
          </label>
          <input
            id={`${formId}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Ex.: Viagem para a Bahia"
            aria-invalid={!!errors.name || undefined}
            className="field"
            autoFocus
          />
          {errors.name && <p className="text-danger text-xs">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor={`${formId}-category`} className="text-sm font-medium">
            Categoria
          </label>
          <select
            id={`${formId}-category`}
            value={category}
            onChange={(e) => setCategory(e.target.value as GoalCategory)}
            className="field"
          >
            {Object.entries(GOAL_CATEGORIES).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <CurrencyField
          label="Valor da meta"
          value={target}
          onChange={setTarget}
          error={errors.target}
        />

        {goal ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Valor guardado</span>
            <p className="field text-muted-foreground">R$ {toMaskedCurrency(goal.savedAmount)}</p>
            <p className="text-muted-foreground text-xs">Use “Registrar aporte” para alterar.</p>
          </div>
        ) : (
          <CurrencyField
            label="Já guardado (opcional)"
            value={saved}
            onChange={setSaved}
            error={errors.saved}
          />
        )}

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor={`${formId}-deadline`} className="text-sm font-medium">
            Prazo (opcional)
          </label>
          <input
            id={`${formId}-deadline`}
            type="date"
            value={deadline}
            min={goal ? undefined : todayIso()}
            onChange={(e) => setDeadline(e.target.value)}
            aria-invalid={!!errors.deadline || undefined}
            className="field"
          />
          {errors.deadline && <p className="text-danger text-xs">{errors.deadline}</p>}
        </div>
      </form>

      <div className="border-border mt-6 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <UIButton variant="secondary" onClick={onClose}>
          Cancelar
        </UIButton>
        <UIButton type="submit" form={formId}>
          {goal ? 'Salvar alterações' : 'Criar meta'}
        </UIButton>
      </div>
    </>
  );
}

export function GoalFormDialog({ open, goal, prefill, onClose, onSubmit }: GoalFormDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={goal ? 'Editar meta' : 'Nova meta'}
      description={
        prefill?.simulationId && !goal
          ? 'Pré-preenchida com os dados da simulação. Ajuste se quiser.'
          : 'Defina o objetivo, o valor e, se quiser, um prazo.'
      }
      icon={<Target size={18} />}
    >
      <GoalForm
        key={goal?.id ?? `new-${prefill?.simulationId ?? ''}`}
        goal={goal}
        prefill={prefill}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}
