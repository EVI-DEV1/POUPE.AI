import PiggyBankImage from '@/assets/images/piggy-bank.png';

interface LogoProps {
  compact?: boolean;
}

/** Logotipo: reaproveita o porquinho roxo já existente no projeto. */
export function Logo({ compact = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={PiggyBankImage}
        alt=""
        aria-hidden
        width={52}
        height={52}
        className="h-12 w-12 shrink-0 drop-shadow-[0_6px_16px_rgba(147,51,234,0.6)]"
      />
      {!compact && (
        <div className="min-w-0 leading-tight">
          <p className="text-[1.75rem] font-bold tracking-tight">
            Poupe<span className="text-gradient">.ai</span>
          </p>
          <p className="text-muted-foreground -mt-0.5 whitespace-nowrap text-xs font-medium">
            Seu educador financeiro com IA
          </p>
        </div>
      )}
    </div>
  );
}
