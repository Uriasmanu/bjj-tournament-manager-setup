import type { AreaLuta } from './area';
import type { Torneio, CreateTorneioInput } from './tournament';
import type { Atleta } from './athlete';
import type { Arbitro } from './referee';
import type { Chave, PlacarLuta } from './bracket';
import type { LutaCasada } from './lutaCasada';
import type { CategoriaCustomizada } from './category';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    activation: ActivationAPI;
  }

  interface ActivationInfo {
    activated: boolean;
    activatedAt: string | null;
    expiresAt: string | null;
    daysRemaining: number | null;
  }
}

interface ElectronAPI {
  createTournament: (data: CreateTorneioInput) => Promise<Torneio>;
  listTournaments: () => Promise<Torneio[]>;
  startTournament: (id: string, mode: 'admin' | 'area') => Promise<Torneio>;
  getTournamentMode: () => Promise<'admin' | 'area' | null>;
  exportTournament: (id: string) => Promise<void>;
  importTournament: (data: Torneio) => Promise<{ success: true; merged: boolean; created: number; updated: number; kept: number; removed: number }>;
  getActiveTournament: () => Promise<Torneio | null>;
  updateTournament: (data: Torneio) => Promise<Torneio>;
  deleteTournament: (id: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
  loadAthletes: () => Promise<Atleta[]>;
  loadDeletedAthletes: () => Promise<Atleta[]>;
  saveAthlete: (athlete: Atleta) => Promise<Atleta[]>;
  updateAthlete: (athlete: Atleta) => Promise<Atleta[]>;
  deleteAthlete: (id: string) => Promise<Atleta[]>;
  deleteAthletes: (ids: string[]) => Promise<Atleta[]>;
  restoreAthlete: (id: string) => Promise<Atleta[]>;
  permanentlyDeleteAthlete: (id: string) => Promise<Atleta[]>;
  permanentlyDeleteAthletes: (ids: string[]) => Promise<Atleta[]>;
  importAthletes: () => Promise<{ imported: number; skipped: number }>;
  exportAthletes: () => Promise<void>;
  saveArbitro: (data: Omit<Arbitro, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Arbitro>;
  updateArbitro: (data: Arbitro) => Promise<Arbitro>;
  deleteArbitro: (arbitroId: string) => Promise<void>;
  deleteArbitros: (arbitroIds: string[]) => Promise<void>;
  restoreArbitro: (arbitroId: string) => Promise<void>;
  permanentlyDeleteArbitro: (arbitroId: string) => Promise<void>;
  permanentlyDeleteArbitros: (arbitroIds: string[]) => Promise<void>;
  loadArbitros: () => Promise<Arbitro[]>;
  loadDeletedArbitros: () => Promise<Arbitro[]>;
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
  loadDeletedAreas: () => Promise<AreaLuta[]>;
  saveArea: (data: { nome: string; arbitroIds: string[] }) => Promise<AreaLuta>;
  updateArea: (data: AreaLuta) => Promise<AreaLuta>;
  deleteArea: (areaId: string) => Promise<void>;
  deleteAreas: (areaIds: string[]) => Promise<void>;
  restoreArea: (areaId: string) => Promise<void>;
  permanentlyDeleteArea: (areaId: string) => Promise<void>;
  permanentlyDeleteAreas: (areaIds: string[]) => Promise<void>;
  importAreas: () => Promise<{ imported: number; skipped: number }>;
  exportAreas: () => Promise<void>;
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
    horarioInicio?: string;
    horarioTermino?: string;
  }) => Promise<Chave>;
  loadLutasCasadas: () => Promise<LutaCasada[]>;
  loadDeletedLutasCasadas: () => Promise<LutaCasada[]>;
  loadLutasCasadasPorArea: (areaId: string) => Promise<LutaCasada[]>;
  saveLutaCasada: (data: Omit<LutaCasada, 'id' | 'tag' | 'createdAt' | 'updatedAt'>) => Promise<LutaCasada>;
  updateLutaCasada: (data: LutaCasada) => Promise<LutaCasada>;
  deleteLutaCasada: (lutaCasadaId: string) => Promise<void>;
  deleteLutasCasadas: (ids: string[]) => Promise<void>;
  permanentlyDeleteLutaCasada: (lutaCasadaId: string) => Promise<void>;
  permanentlyDeleteLutasCasadas: (ids: string[]) => Promise<void>;
  restoreLutaCasada: (lutaCasadaId: string) => Promise<void>;
  restoreLutasCasadas: (ids: string[]) => Promise<void>;
  loadCategorias: () => Promise<{ desabilitadas: string[]; customizadas: CategoriaCustomizada[] }>;
  toggleCategoria: (categoriaId: string) => Promise<string[]>;
  saveCategoriaCustomizada: (data: Omit<CategoriaCustomizada, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CategoriaCustomizada>;
  updateCategoriaCustomizada: (data: CategoriaCustomizada) => Promise<CategoriaCustomizada>;
  deleteCategoriaCustomizada: (categoriaId: string) => Promise<void>;
}

interface ActivationAPI {
  check: () => Promise<boolean>;
  validate: (password: string) => Promise<boolean>;
  activate: () => Promise<boolean>;
  getInfo: () => Promise<ActivationInfo>;
}
