import { ipcRenderer, contextBridge } from 'electron'
import type { Torneio } from '../src/types/tournament'

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
  importTournamentOverwrite: (data: Torneio) =>
    ipcRenderer.invoke('import-tournament-overwrite', data),
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
  saveAthlete: (athlete: { id: string; nome: string; equipe: string; genero: string; categoria: string; pesoKg: number; faixa: string; anoNascimento: number; createdAt: string; updatedAt: string }) =>
    ipcRenderer.invoke('save-athlete', athlete),
  updateAthlete: (athlete: { id: string; nome: string; equipe: string; genero: string; categoria: string; pesoKg: number; faixa: string; anoNascimento: number; createdAt: string; updatedAt: string }) =>
    ipcRenderer.invoke('update-athlete', athlete),
  deleteAthlete: (id: string) =>
    ipcRenderer.invoke('delete-athlete', id),
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
  loadArbitros: () =>
    ipcRenderer.invoke('load-arbitros'),
  importArbitros: () =>
    ipcRenderer.invoke('import-arbitros'),
  exportArbitros: () =>
    ipcRenderer.invoke('export-arbitros'),
})

contextBridge.exposeInMainWorld('activation', {
  check: () => ipcRenderer.invoke('check-activation'),
  validate: (password: string) => ipcRenderer.invoke('validate-password', password),
  activate: () => ipcRenderer.invoke('activate-license'),
})
