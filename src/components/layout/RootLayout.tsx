import { Outlet } from 'react-router-dom';

import { LegacyImportDialog } from '@/components/auth/LegacyImportDialog';
import { useAuth } from '@/hooks/useAuth';

import { DashboardLayout } from './DashboardLayout';

export function RootLayout() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <Outlet />
      {/* `key`: ao trocar de perfil, a oferta é reavaliada para o novo perfil. */}
      {user && <LegacyImportDialog key={user.id} userId={user.id} />}
    </DashboardLayout>
  );
}
