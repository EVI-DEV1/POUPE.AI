import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { redirectTarget } from '@/auth/redirect';
import { useAuth } from '@/hooks/useAuth';

/**
 * Login e cadastro: quem já tem sessão não vê essas páginas de novo e vai para
 * a página que tentou abrir (ou para o dashboard).
 */
export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={redirectTarget(location.state)} replace />;
  }

  return <Outlet />;
}
