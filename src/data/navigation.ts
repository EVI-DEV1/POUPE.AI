import {
  BookOpen,
  Calculator,
  CalendarDays,
  CircleQuestionMark,
  History,
  LayoutDashboard,
  type LucideIcon,
  MessageCircleMore,
  Settings,
  Target,
  User,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  description: string;
  /** Considera ativo também em sub-rotas (ex.: /resultado/:id → Simulações). */
  matches?: string[];
}

export const MAIN_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/',
    icon: LayoutDashboard,
    description: 'Visão geral das suas finanças',
  },
  {
    label: 'Simulações',
    to: '/simulacoes',
    icon: Calculator,
    description: 'Simule uma meta financeira',
    matches: ['/simulacoes', '/resultado'],
  },
  { label: 'Histórico', to: '/historico', icon: History, description: 'Simulações anteriores' },
  { label: 'Metas', to: '/metas', icon: Target, description: 'Crie e acompanhe objetivos' },
  {
    label: 'Planejamento',
    to: '/planejamento',
    icon: CalendarDays,
    description: 'Receitas, despesas e saldo do mês',
  },
  {
    label: 'Chat com IA',
    to: '/chat',
    icon: MessageCircleMore,
    description: 'Converse com o assistente',
  },
  {
    label: 'Educação Financeira',
    to: '/educacao',
    icon: BookOpen,
    description: 'Aprenda conceitos essenciais',
  },
];

export const SETTINGS_NAV: NavItem[] = [
  { label: 'Perfil', to: '/perfil', icon: User, description: 'Nome e avatar' },
  { label: 'Preferências', to: '/preferencias', icon: Settings, description: 'Tema e dados' },
  {
    label: 'Ajuda e Suporte',
    to: '/ajuda',
    icon: CircleQuestionMark,
    description: 'Dúvidas frequentes',
  },
];

export const isNavItemActive = (item: NavItem, pathname: string) => {
  if (item.to === '/') return pathname === '/';
  return (item.matches ?? [item.to]).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
};
