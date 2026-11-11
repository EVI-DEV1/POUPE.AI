import PiggyBankImage from '@/assets/images/piggy-bank.png';

interface SimulationHeroProps {
  title?: string;
  subtitle?: string;
}

export function SimulationHero({
  title = 'Vamos planejar seu futuro',
  subtitle = 'Responda algumas questões para ter insights financeiros personalizados',
}: SimulationHeroProps) {
  return (
    <div className="mb-8 flex flex-col items-center gap-2 text-center">
      <img
        src={PiggyBankImage}
        alt=""
        aria-hidden="true"
        className="animate-float h-20 w-20 drop-shadow-[0_10px_24px_rgba(147,51,234,0.6)]"
      />
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="text-muted-foreground text-sm sm:text-base">{subtitle}</p>
    </div>
  );
}
