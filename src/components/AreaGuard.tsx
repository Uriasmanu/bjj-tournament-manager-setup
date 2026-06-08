import { Navigate } from 'react-router-dom';
import { useTournamentMode } from '../utils/TournamentModeContext';
import { Center, Loader } from '@mantine/core';

export function AreaGuard({ children }: { children: React.ReactNode }) {
  const { mode } = useTournamentMode();

  if (mode === null) {
    return (
      <Center py="xl" style={{ minHeight: '100vh' }}>
        <Loader />
      </Center>
    );
  }

  if (mode === 'area') {
    return <Navigate to="/admin/placar" replace />;
  }

  return <>{children}</>;
}
