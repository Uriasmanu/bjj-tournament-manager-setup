import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type TournamentMode = 'admin' | 'area' | null;

interface TournamentModeContextValue {
  mode: TournamentMode;
  loading: boolean;
  setMode: (mode: TournamentMode) => void;
  refresh: () => void;
}

const TournamentModeContext = createContext<TournamentModeContextValue>({
  mode: null,
  loading: true,
  setMode: () => {},
  refresh: () => {},
});

export function TournamentModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TournamentMode>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setLoading(true);
      const m = await window.electronAPI.getTournamentMode();
      setMode(m);
    } catch {
      setMode(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <TournamentModeContext.Provider value={{ mode, loading, setMode, refresh }}>
      {children}
    </TournamentModeContext.Provider>
  );
}

export function useTournamentMode() {
  return useContext(TournamentModeContext);
}
