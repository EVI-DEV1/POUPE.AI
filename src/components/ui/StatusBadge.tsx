import { FEASIBILITY_LABELS, type FeasibilityStatus } from '@/utils/finance';

const styles: Record<FeasibilityStatus, string> = {
  viable: 'bg-success-soft text-success ring-success/25',
  needs_adjustment: 'bg-warning-soft text-warning ring-warning/25',
  unfeasible: 'bg-danger-soft text-danger ring-danger/25',
};

export function StatusBadge({ status }: { status: FeasibilityStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 sm:px-4 sm:text-sm ${styles[status]}`}
    >
      {FEASIBILITY_LABELS[status]}
    </span>
  );
}
