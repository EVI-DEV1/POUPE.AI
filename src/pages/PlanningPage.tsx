import { CalendarDays, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FinancialEvolutionChart } from '@/components/features/Dashboard/FinancialEvolutionChart';
import { PageHero } from '@/components/shared/PageHero';
import { UIButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CurrencyField } from '@/components/ui/CurrencyField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Panel } from '@/components/ui/Panel';
import type { MonthEntry } from '@/data/finance';
import { planningActions, usePlanning } from '@/stores';
import { parseCurrency } from '@/utils/currency';
import { getMonthTotals } from '@/utils/finance';
import {
  currentMonthKey,
  formatBRL,
  formatDate,
  formatMonthLong,
  formatPercent,
  toMaskedCurrency,
} from '@/utils/format';

function BalanceCard() {
  const planning = usePlanning();
  const [value, setValue] = useState(
    planning.currentBalance !== null ? toMaskedCurrency(Math.abs(planning.currentBalance)) : ''
  );
  const [negative, setNegative] = useState((planning.currentBalance ?? 0) < 0);
  const [saved, setSaved] = useState(false);

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!value) {
      planningActions.setBalance(null);
    } else {
      const amount = parseCurrency(value);
      planningActions.setBalance(negative ? -amount : amount);
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Panel id="saldo" title="Saldo atual" className="scroll-mt-24">
      <p className="text-muted-foreground -mt-2 mb-4 text-sm">
        Quanto você tem disponível hoje (conta, carteira, reserva). O Poupe.ai não acessa bancos —
        você informa manualmente.
      </p>
      <form onSubmit={save} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <CurrencyField
            label="Saldo"
            value={value}
            onChange={setValue}
            hint="Deixe vazio para remover."
          />
        </div>
        <label className="text-muted-foreground flex items-center gap-2 pb-3 text-sm sm:pb-7">
          <input
            type="checkbox"
            checked={negative}
            onChange={(e) => setNegative(e.target.checked)}
            className="accent-primary h-4 w-4"
          />
          Saldo negativo
        </label>
        <UIButton type="submit" className="sm:mb-6">
          {saved ? 'Salvo ✓' : 'Salvar saldo'}
        </UIButton>
      </form>
      {planning.balanceUpdatedAt && (
        <p className="text-muted-foreground text-xs">
          Última atualização: {formatDate(planning.balanceUpdatedAt)}
        </p>
      )}
    </Panel>
  );
}

function MonthForm({
  entry,
  existingMonths,
  onDone,
}: {
  entry: MonthEntry | null;
  existingMonths: string[];
  onDone: () => void;
}) {
  const formId = useId();
  const [month, setMonth] = useState(entry?.month ?? currentMonthKey());
  const [income, setIncome] = useState(entry ? toMaskedCurrency(entry.income) : '');
  const [fixed, setFixed] = useState(entry ? toMaskedCurrency(entry.fixedExpenses) : '');
  const [variable, setVariable] = useState(entry ? toMaskedCurrency(entry.variableExpenses) : '');
  const [debts, setDebts] = useState(entry ? toMaskedCurrency(entry.debts) : '');
  const [error, setError] = useState('');

  const overwriting = !entry && existingMonths.includes(month);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{4}-\d{2}$/.test(month)) {
      setError('Escolha o mês de referência.');
      return;
    }
    if (parseCurrency(income) <= 0) {
      setError('Informe as receitas do mês.');
      return;
    }
    planningActions.upsertMonth({
      id: entry?.id,
      month,
      income: parseCurrency(income),
      fixedExpenses: parseCurrency(fixed),
      variableExpenses: parseCurrency(variable),
      debts: parseCurrency(debts),
    });
    onDone();
  };

  const preview =
    parseCurrency(income) - parseCurrency(fixed) - parseCurrency(variable) - parseCurrency(debts);

  return (
    <>
      <form id={formId} onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor={`${formId}-month`} className="text-sm font-medium">
            Mês de referência
          </label>
          <input
            id={`${formId}-month`}
            type="month"
            value={month}
            max={currentMonthKey()}
            onChange={(e) => setMonth(e.target.value)}
            className="field"
          />
          {overwriting && (
            <p className="text-warning text-xs">
              Já existe um registro para este mês — ele será substituído.
            </p>
          )}
        </div>
        <CurrencyField
          label="Receitas"
          value={income}
          onChange={setIncome}
          hint="Salário, renda extra, etc."
        />
        <CurrencyField
          label="Custos fixos"
          value={fixed}
          onChange={setFixed}
          hint="Aluguel, contas, escola…"
        />
        <CurrencyField
          label="Gastos variáveis"
          value={variable}
          onChange={setVariable}
          hint="Mercado, lazer, delivery…"
        />
        <CurrencyField
          label="Dívidas e parcelas"
          value={debts}
          onChange={setDebts}
          hint="Empréstimos, parcelas do cartão…"
        />
        <p className="bg-muted-primary rounded-xl px-4 py-3 text-sm sm:col-span-2">
          Sobra estimada:{' '}
          <strong className={preview >= 0 ? 'text-success' : 'text-danger'}>
            {formatBRL(preview)}
          </strong>
        </p>
        {error && <p className="text-danger text-sm sm:col-span-2">{error}</p>}
      </form>
      <div className="border-border mt-6 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <UIButton variant="secondary" onClick={onDone}>
          Cancelar
        </UIButton>
        <UIButton type="submit" form={formId}>
          Salvar mês
        </UIButton>
      </div>
    </>
  );
}

export function PlanningPage() {
  const planning = usePlanning();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState<MonthEntry | null>(null);
  const [deleting, setDeleting] = useState<MonthEntry | null>(null);
  const creating = searchParams.get('novo') === '1';
  const months = [...planning.months].sort((a, b) => b.month.localeCompare(a.month));

  const closeForm = () => {
    setEditing(null);
    if (creating) setSearchParams({}, { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] py-2">
      <PageHero
        title="Planejamento mensal"
        subtitle="Registre receitas e despesas de cada mês. Esses dados alimentam os indicadores do dashboard."
        actions={
          <UIButton icon={Plus} onClick={() => setSearchParams({ novo: '1' })}>
            Registrar mês
          </UIButton>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <BalanceCard />
        <FinancialEvolutionChart
          months={planning.months}
          simulations={[]}
          title="Receitas x despesas"
        />
      </div>

      <Panel title="Meses registrados" className="mt-4">
        {months.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum mês registrado"
            description="Comece pelo mês atual: quanto entrou e quanto saiu."
            action={
              <UIButton size="sm" icon={Plus} onClick={() => setSearchParams({ novo: '1' })}>
                Registrar mês atual
              </UIButton>
            }
          />
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase tracking-wider">
                  <th scope="col" className="px-5 py-3 font-semibold sm:px-6">
                    Mês
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">
                    Receitas
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">
                    Despesas
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">
                    Sobra
                  </th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">
                    Taxa
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold sm:px-6">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => {
                  const t = getMonthTotals(m);
                  return (
                    <tr key={m.id} className="border-border/60 border-b last:border-b-0">
                      <th
                        scope="row"
                        className="px-5 py-3 text-left font-medium capitalize sm:px-6"
                      >
                        {formatMonthLong(m.month)}
                      </th>
                      <td className="px-3 py-3 text-right tabular-nums">{formatBRL(m.income)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {formatBRL(t.totalExpenses)}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-semibold tabular-nums ${t.savings >= 0 ? 'text-success' : 'text-danger'}`}
                      >
                        {formatBRL(t.savings)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {t.savingsRate !== null ? formatPercent(t.savingsRate) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-2 text-right sm:px-6">
                        <button
                          type="button"
                          onClick={() => setEditing(m)}
                          aria-label={`Editar ${formatMonthLong(m.month)}`}
                          className="text-muted-foreground hover:bg-secondary-button hover:text-foreground rounded-lg p-2"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(m)}
                          aria-label={`Excluir ${formatMonthLong(m.month)}`}
                          className="text-muted-foreground hover:bg-danger-soft hover:text-danger rounded-lg p-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal
        open={creating || !!editing}
        onClose={closeForm}
        title={editing ? `Editar ${formatMonthLong(editing.month)}` : 'Registrar mês'}
        description="Valores informados por você. Nada é importado de bancos."
        icon={<Wallet size={18} />}
      >
        <MonthForm
          key={editing?.id ?? 'new'}
          entry={editing}
          existingMonths={planning.months.map((m) => m.month)}
          onDone={closeForm}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir registro do mês?"
        description={`O registro de ${deleting ? formatMonthLong(deleting.month) : ''} será removido.`}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) planningActions.removeMonth(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
