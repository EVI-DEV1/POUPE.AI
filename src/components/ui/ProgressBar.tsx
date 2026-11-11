interface ProgressBarProps {
  value: number;
  label: string;
  className?: string;
}

/** Barra de progresso com gradiente roxo (valor entre 0 e 1). */
export function ProgressBar({ value, label, className = '' }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={`bg-border/70 h-2.5 w-full overflow-hidden rounded-full ${className}`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#c084fc] shadow-[0_0_12px_rgba(168,85,247,0.7)] transition-[width] duration-700 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
