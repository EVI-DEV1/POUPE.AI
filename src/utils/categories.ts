import {
  Car,
  GraduationCap,
  Heart,
  House,
  Laptop,
  type LucideIcon,
  Plane,
  ShieldCheck,
  Target,
} from 'lucide-react';

import type { GoalCategory } from '@/data/finance';

export const GOAL_CATEGORIES: Record<GoalCategory, { label: string; icon: LucideIcon }> = {
  travel: { label: 'Viagem', icon: Plane },
  home: { label: 'Imóvel', icon: House },
  vehicle: { label: 'Veículo', icon: Car },
  education: { label: 'Educação', icon: GraduationCap },
  emergency: { label: 'Reserva de emergência', icon: ShieldCheck },
  electronics: { label: 'Eletrônicos', icon: Laptop },
  event: { label: 'Evento', icon: Heart },
  other: { label: 'Outro objetivo', icon: Target },
};

const KEYWORDS: [GoalCategory, RegExp][] = [
  ['travel', /viag|f[ée]rias|interc[aâ]mbio|passagem|turismo|disney|europa|jap[aã]o|bahia/],
  ['home', /casa|im[oó]vel|apartamento|apto|reforma|financiamento|aluguel|terreno/],
  ['vehicle', /carro|moto|ve[ií]culo|autom[oó]vel|bicicleta|bike/],
  ['education', /curso|faculdade|estud|p[oó]s|mba|escola|gradua/],
  ['emergency', /reserva|emerg[eê]ncia|seguran/],
  ['electronics', /celular|iphone|notebook|computador|pc|videogame|playstation|tv|eletr/],
  ['event', /casamento|festa|anivers|filho|beb[eê]|lua de mel/],
];

/** Infere a categoria a partir do nome da meta (para simulações, que não têm categoria). */
export function inferCategory(name: string): GoalCategory {
  const normalized = name.toLowerCase();
  return KEYWORDS.find(([, regex]) => regex.test(normalized))?.[0] ?? 'other';
}
