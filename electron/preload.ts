import { ipcRenderer, contextBridge } from 'electron'
import type { Torneio } from '../src/types/tournament'
import type { AreaLuta } from '../src/types/area'
import type { PlacarLuta } from '../src/types/bracket'
import type { LutaCasada } from '../src/types/lutaCasada'

contextBridge.exposeInMainWorld('electronAPI', {
  createTournament: (data: { nome: string; data: string }) =>
    ipcRenderer.invoke('create-tournament', data),
  listTournaments: () =>
    ipcRenderer.invoke('list-tournaments'),
  startTournament: (id: string) =>
    ipcRenderer.invoke('start-tournament', id),
  exportTournament: (id: string) =>
    ipcRenderer.invoke('export-tournament', id),
  importTournament: (data: Torneio) =>
    ipcRenderer.invoke('import-tournament', data),
  getActiveTournament: () =>
    ipcRenderer.invoke('get-active-tournament'),
  updateTournament: (data: Torneio) =>
    ipcRenderer.invoke('update-tournament', data),
  deleteTournament: (id: string) =>
    ipcRenderer.invoke('delete-tournament', id),
  readFile: (path: string) =>
    ipcRenderer.invoke('read-file', path),
  loadAthletes: () =>
    ipcRenderer.invoke('load-athletes'),
  loadDeletedAthletes: () =>
    ipcRenderer.invoke('load-deleted-athletes'),
  saveAthlete: (athlete: { id: string; nome: string; equipe: string; genero: string; categoria: string; pesoKg: number; faixa: string; anoNascimento: number; createdAt: string; updatedAt: string }) =>
    ipcRenderer.invoke('save-athlete', athlete),
  updateAthlete: (athlete: { id: string; nome: string; equipe: string; genero: string; categoria: string; pesoKg: number; faixa: string; anoNascimento: number; createdAt: string; updatedAt: string }) =>
    ipcRenderer.invoke('update-athlete', athlete),
  deleteAthlete: (id: string) =>
    ipcRenderer.invoke('delete-athlete', id),
  deleteAthletes: (ids: string[]) =>
    ipcRenderer.invoke('delete-athletes', ids),
  restoreAthlete: (id: string) =>
    ipcRenderer.invoke('restore-athlete', id),
  permanentlyDeleteAthlete: (id: string) =>
    ipcRenderer.invoke('permanently-delete-athlete', id),
  permanentlyDeleteAthletes: (ids: string[]) =>
    ipcRenderer.invoke('permanently-delete-athletes', ids),
  importAthletes: () =>
    ipcRenderer.invoke('import-athletes'),
  exportAthletes: () =>
    ipcRenderer.invoke('export-athletes'),
  saveArbitro: (data: { nome: string; equipe: string; faixa: string; chaveIds: string[] }) =>
    ipcRenderer.invoke('save-arbitro', data),
  updateArbitro: (data: { id: string; nome: string; equipe: string; faixa: string; chaveIds: string[]; createdAt: string; updatedAt: string }) =>
    ipcRenderer.invoke('update-arbitro', data),
  deleteArbitro: (arbitroId: string) =>
    ipcRenderer.invoke('delete-arbitro', arbitroId),
  deleteArbitros: (arbitroIds: string[]) =>
    ipcRenderer.invoke('delete-arbitros', arbitroIds),
  restoreArbitro: (arbitroId: string) =>
    ipcRenderer.invoke('restore-arbitro', arbitroId),
  permanentlyDeleteArbitro: (arbitroId: string) =>
    ipcRenderer.invoke('permanently-delete-arbitro', arbitroId),
  permanentlyDeleteArbitros: (arbitroIds: string[]) =>
    ipcRenderer.invoke('permanently-delete-arbitros', arbitroIds),
  loadArbitros: () =>
    ipcRenderer.invoke('load-arbitros'),
  loadDeletedArbitros: () =>
    ipcRenderer.invoke('load-deleted-arbitros'),
  importArbitros: () =>
    ipcRenderer.invoke('import-arbitros'),
  exportArbitros: () =>
    ipcRenderer.invoke('export-arbitros'),
  gerarTodasChaves: (maxAtletas?: number) =>
    ipcRenderer.invoke('gerar-todas-chaves', maxAtletas),
  gerarChave: (data: { categoriaId: string }) =>
    ipcRenderer.invoke('gerar-chave', data),
  loadChaves: () =>
    ipcRenderer.invoke('load-chaves'),
  loadChavePorCategoria: (categoriaId: string) =>
    ipcRenderer.invoke('load-chave-por-categoria', categoriaId),
  randomizarChave: (data: { chaveId: string }) =>
    ipcRenderer.invoke('randomizar-chave', data),
  atribuirArbitroChave: (data: { chaveId: string; arbitroId: string | null }) =>
    ipcRenderer.invoke('atribuir-arbitro-chave', data),
  importChaves: () =>
    ipcRenderer.invoke('import-chaves'),
  exportChaves: () =>
    ipcRenderer.invoke('export-chaves'),
  loadAreas: () =>
    ipcRenderer.invoke('load-areas'),
  loadDeletedAreas: () =>
    ipcRenderer.invoke('load-deleted-areas'),
  saveArea: (data: { nome: string; arbitroIds: string[] }) =>
    ipcRenderer.invoke('save-area', data),
  updateArea: (data: AreaLuta) =>
    ipcRenderer.invoke('update-area', data),
  deleteArea: (areaId: string) =>
    ipcRenderer.invoke('delete-area', areaId),
  deleteAreas: (areaIds: string[]) =>
    ipcRenderer.invoke('delete-areas', areaIds),
  restoreArea: (areaId: string) =>
    ipcRenderer.invoke('restore-area', areaId),
  permanentlyDeleteArea: (areaId: string) =>
    ipcRenderer.invoke('permanently-delete-area', areaId),
  permanentlyDeleteAreas: (areaIds: string[]) =>
    ipcRenderer.invoke('permanently-delete-areas', areaIds),
  importAreas: () =>
    ipcRenderer.invoke('import-areas'),
  exportAreas: () =>
    ipcRenderer.invoke('export-areas'),
  loadChavesPorArea: (areaId: string) =>
    ipcRenderer.invoke('load-chaves-por-area', areaId),
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
  }) => ipcRenderer.invoke('registrar-resultado', data),
  loadLutasCasadas: () =>
    ipcRenderer.invoke('load-lutas-casadas'),
  loadLutasCasadasPorArea: (areaId: string) =>
    ipcRenderer.invoke('load-lutas-casadas-por-area', areaId),
  saveLutaCasada: (data: Omit<LutaCasada, 'id' | 'tag' | 'createdAt' | 'updatedAt'>) =>
    ipcRenderer.invoke('save-luta-casada', data),
  updateLutaCasada: (data: LutaCasada) =>
    ipcRenderer.invoke('update-luta-casada', data),
  deleteLutaCasada: (lutaCasadaId: string) =>
    ipcRenderer.invoke('delete-luta-casada', lutaCasadaId),
})

contextBridge.exposeInMainWorld('activation', {
  check: () => ipcRenderer.invoke('check-activation'),
  validate: (password: string) => ipcRenderer.invoke('validate-password', password),
  activate: () => ipcRenderer.invoke('activate-license'),
  getInfo: () => ipcRenderer.invoke('get-activation-info'),
})
