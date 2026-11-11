import { Outlet } from 'react-router-dom';

import { DashboardLayout } from './DashboardLayout';

export function RootLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
