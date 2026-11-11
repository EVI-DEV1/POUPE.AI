import { SimulationForm } from '@/components/features/Simulation/Form';
import { SimulationHero } from '@/components/features/Simulation/Hero';

export function SimulationFormPage() {
  return (
    <div className="mx-auto max-w-xl py-6 sm:py-10">
      <SimulationHero />
      <SimulationForm />
    </div>
  );
}
