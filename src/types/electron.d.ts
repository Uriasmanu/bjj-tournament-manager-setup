import type { Torneio, CreateTorneioInput } from './tournament';
import type { Atleta } from './athlete';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    activation: ActivationAPI;
  }
}

interface ElectronAPI {
  createTournament: (data: CreateTorneioInput) => Promise<Torneio>;
  listTournaments: () => Promise<Torneio[]>;
  startTournament: (id: string) => Promise<Torneio>;
  exportTournament: (id: string) => Promise<void>;
  importTournament: (data: Torneio) => Promise<{ success: boolean; exists?: boolean }>;
  importTournamentOverwrite: (data: Torneio) => Promise<void>;
  getActiveTournament: () => Promise<Torneio | null>;
  updateTournament: (data: Torneio) => Promise<Torneio>;
  deleteTournament: (id: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
  loadAthletes: () => Promise<Atleta[]>;
  saveAthlete: (athlete: Atleta) => Promise<Atleta[]>;
  updateAthlete: (athlete: Atleta) => Promise<Atleta[]>;
  deleteAthlete: (id: string) => Promise<Atleta[]>;
  importAthletes: () => Promise<{ imported: number; skipped: number }>;
}

interface ActivationAPI {
  check: () => Promise<boolean>;
  validate: (password: string) => Promise<boolean>;
  activate: () => Promise<boolean>;
}
