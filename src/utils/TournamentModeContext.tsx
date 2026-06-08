import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type TournamentMode = 'admin' | 'area' | null;

interface TournamentModeContextValue {
  mode: TournamentMode;
  setMode: (mode: TournamentMode) => void;
  refresh: () => void;
}

const TournamentModeContext = createContext<TournamentModeContextValue>({
  mode: null,
  setMode: () => {},
  refresh: () => {},
});

export function TournamentModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TournamentMode>(null);

  const refresh = async () => {
    try {
      const m = await window.electronAPI.getTournamentMode();
      setMode(m);
    } catch {
      setMode(null);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <TournamentModeContext.Provider value={{ mode, setMode, refresh }}>
      {children}
    </TournamentModeContext.Provider>
  );
}

export function useTournamentMode() {
  return useContext(TournamentModeContext);
}
