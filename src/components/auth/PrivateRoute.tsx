import type { PropsWithChildren } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

/**
 * Leva visitantes sem sessão para o login e guarda a página pedida para voltar
 * a ela depois.
 *
 * Isto controla a NAVEGAÇÃO, não protege dados: os perfis são demonstrativos e
 * tudo fica no localStorage deste navegador, acessível a quem usa o aparelho.
 */
export function PrivateRoute({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/entrar" replace state={{ from: location }} />;
  }

  return children ?? <Outlet />;
}
