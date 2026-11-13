import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PrivateRoute } from './components/auth/PrivateRoute';
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute';
import { RootLayout } from './components/layout/RootLayout';
import { RouteError } from './components/layout/RouteError';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { DashboardPage } from './pages/DashboardPage';

/** Carrega a página sob demanda (code splitting por rota). */
const page = <T extends Record<string, unknown>>(loader: () => Promise<T>, name: keyof T) => ({
  lazy: async () => ({ Component: (await loader())[name] as ComponentType }),
});

export const router = createBrowserRouter([
  {
    // Acesso: só para quem ainda não tem sessão.
    element: <PublicOnlyRoute />,
    errorElement: <RouteError />,
    children: [
      { path: '/entrar', element: <LoginPage /> },
      { path: '/cadastro', element: <SignupPage /> },
    ],
  },
  {
    // Área do app: visitantes sem sessão vão para /entrar.
    element: (
      <PrivateRoute>
        <RootLayout />
      </PrivateRoute>
    ),
    errorElement: <RouteError />,
    hydrateFallbackElement: <></>,
    children: [
      { path: '/', element: <DashboardPage /> },
      {
        path: '/simulacoes',
        ...page(() => import('./pages/SimulationFormPage'), 'SimulationFormPage'),
      },
      { path: '/simulacoes/nova', element: <Navigate to="/simulacoes" replace /> },
      {
        path: '/simulacoes/:id/editar',
        ...page(() => import('./pages/SimulationEditPage'), 'SimulationEditPage'),
      },
      {
        path: '/resultado/:id',
        ...page(() => import('./pages/SimulationResultsPage'), 'SimulationResultsPage'),
      },
      {
        path: '/historico',
        ...page(() => import('./pages/SimulationHistoryPage'), 'SimulationHistoryPage'),
      },
      { path: '/metas', ...page(() => import('./pages/GoalsPage'), 'GoalsPage') },
      { path: '/planejamento', ...page(() => import('./pages/PlanningPage'), 'PlanningPage') },
      { path: '/chat', ...page(() => import('./pages/ChatPage'), 'ChatPage') },
      { path: '/educacao', ...page(() => import('./pages/EducationPage'), 'EducationPage') },
      { path: '/perfil', ...page(() => import('./pages/ProfilePage'), 'ProfilePage') },
      {
        path: '/preferencias',
        ...page(() => import('./pages/PreferencesPage'), 'PreferencesPage'),
      },
      { path: '/ajuda', ...page(() => import('./pages/HelpPage'), 'HelpPage') },
      { path: '*', ...page(() => import('./pages/NotFoundPage'), 'NotFoundPage') },
    ],
  },
]);
