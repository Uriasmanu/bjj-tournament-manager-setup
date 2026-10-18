import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { signInForTournament } from '../services/firestore/auth';

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
  const signedInTorneioId = useRef<string | null>(null);

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

    try {
      const torneio = await window.electronAPI.getActiveTournament();
      if (torneio && signedInTorneioId.current !== torneio.id) {
        signedInTorneioId.current = torneio.id;
        await signInForTournament(torneio.id);
      }
    } catch (err) {
      // best-effort: sem rede ou sem config do Firebase, o app continua funcionando local
      console.error('[TournamentModeContext] falha ao autenticar para sincronização', err);
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
