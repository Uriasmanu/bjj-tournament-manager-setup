import type { Torneio, CreateTorneioInput } from './tournament';
import type { Atleta } from './athlete';
import type { Arbitro } from './referee';
import type { Chave, StatusLuta } from './bracket';

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
  exportAthletes: () => Promise<void>;
  saveArbitro: (data: Omit<Arbitro, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Arbitro>;
  updateArbitro: (data: Arbitro) => Promise<Arbitro>;
  deleteArbitro: (arbitroId: string) => Promise<void>;
  loadArbitros: () => Promise<Arbitro[]>;
  importArbitros: () => Promise<{ imported: number; skipped: number }>;
  exportArbitros: () => Promise<void>;
  gerarTodasChaves: () => Promise<Chave[]>;
  gerarChave: (data: { categoriaId: string }) => Promise<Chave>;
  loadChaves: () => Promise<Chave[]>;
  loadChavePorCategoria: (categoriaId: string) => Promise<Chave | null>;
  regenerarChave: (data: { categoriaId: string }) => Promise<Chave>;
  atualizarLuta: (data: { lutaId: string; vencedorId: string; status: StatusLuta }) => Promise<Chave>;
  editarChave: (data: { chaveId: string; posicoesAtletas: string[] }) => Promise<Chave>;
  atribuirArbitroChave: (data: { chaveId: string; arbitroId: string | null }) => Promise<Chave>;
  importChaves: () => Promise<{ imported: number }>;
  exportChaves: () => Promise<void>;
}

interface ActivationAPI {
  check: () => Promise<boolean>;
  validate: (password: string) => Promise<boolean>;
  activate: () => Promise<boolean>;
}
