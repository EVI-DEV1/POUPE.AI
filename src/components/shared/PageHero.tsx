interface PageHeroProps {
  title: string;
  subtitle: string;
}

export function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <>
      <h1 className="text-foreground text-2x1 sm:text-3x1 mb-1 font-semibold">{title}</h1>
      <p className="text-muted-foreground mb-8 text-sm">{subtitle} </p>
    </>
  );
}
