import type { AreaLuta } from './area';
import type { Torneio, CreateTorneioInput } from './tournament';
import type { Atleta } from './athlete';
import type { Arbitro } from './referee';
import type { Chave, PlacarLuta } from './bracket';
import type { LutaCasada } from './lutaCasada';

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
  deleteAthletes: (ids: string[]) => Promise<Atleta[]>;
  importAthletes: () => Promise<{ imported: number; skipped: number }>;
  exportAthletes: () => Promise<void>;
  saveArbitro: (data: Omit<Arbitro, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Arbitro>;
  updateArbitro: (data: Arbitro) => Promise<Arbitro>;
  deleteArbitro: (arbitroId: string) => Promise<void>;
  deleteArbitros: (arbitroIds: string[]) => Promise<void>;
  loadArbitros: () => Promise<Arbitro[]>;
  importArbitros: () => Promise<{ imported: number; skipped: number }>;
  exportArbitros: () => Promise<void>;
  gerarTodasChaves: (maxAtletas?: number) => Promise<{ chaves: Chave[]; metadados: unknown[]; atletasSemChave: Atleta[] }>;
  gerarChave: (data: { categoriaId: string }) => Promise<Chave>;
  loadChaves: () => Promise<Chave[]>;
  loadChavePorCategoria: (categoriaId: string) => Promise<Chave | null>;
  randomizarChave: (data: { chaveId: string }) => Promise<Chave>;
  atribuirArbitroChave: (data: { chaveId: string; arbitroId: string | null }) => Promise<Chave>;
  importChaves: () => Promise<{ imported: number }>;
  exportChaves: () => Promise<void>;
  loadAreas: () => Promise<AreaLuta[]>;
  saveArea: (data: { nome: string; arbitroIds: string[] }) => Promise<AreaLuta>;
  updateArea: (data: AreaLuta) => Promise<AreaLuta>;
  deleteArea: (areaId: string) => Promise<void>;
  deleteAreas: (areaIds: string[]) => Promise<void>;
  loadChavesPorArea: (areaId: string) => Promise<Chave[]>;
  registrarResultado: (data: {
    chaveId: string;
    lutaId: string;
    vencedorId: string;
    status: string;
    placarA?: PlacarLuta;
    placarB?: PlacarLuta;
    finalizacao?: boolean;
    desclassificacao?: boolean;
    desempateArbitro?: boolean;
  }) => Promise<Chave>;
  loadLutasCasadasPorArea: (areaId: string) => Promise<LutaCasada[]>;
  saveLutaCasada: (data: Omit<LutaCasada, 'id' | 'tag' | 'createdAt' | 'updatedAt'>) => Promise<LutaCasada>;
  updateLutaCasada: (data: LutaCasada) => Promise<LutaCasada>;
  deleteLutaCasada: (lutaCasadaId: string) => Promise<void>;
}

interface ActivationAPI {
  check: () => Promise<boolean>;
  validate: (password: string) => Promise<boolean>;
  activate: () => Promise<boolean>;
}
