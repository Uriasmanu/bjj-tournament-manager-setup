import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  createTournament: (data: { nome: string; data: string }) =>
    ipcRenderer.invoke('create-tournament', data),
  listTournaments: () =>
    ipcRenderer.invoke('list-tournaments'),
  startTournament: (id: string) =>
    ipcRenderer.invoke('start-tournament', id),
  exportTournament: (id: string) =>
    ipcRenderer.invoke('export-tournament', id),
  importTournament: (data: { id: string; nome: string; data: string; createdAt: string; updatedAt: string }) =>
    ipcRenderer.invoke('import-tournament', data),
  importTournamentOverwrite: (data: { id: string; nome: string; data: string; createdAt: string; updatedAt: string }) =>
    ipcRenderer.invoke('import-tournament-overwrite', data),
  getActiveTournament: () =>
    ipcRenderer.invoke('get-active-tournament'),
  updateTournament: (data: { id: string; nome: string; data: string; createdAt: string; updatedAt: string }) =>
    ipcRenderer.invoke('update-tournament', data),
  deleteTournament: (id: string) =>
    ipcRenderer.invoke('delete-tournament', id),
  readFile: (path: string) =>
    ipcRenderer.invoke('read-file', path),
  loadAthletes: () =>
    ipcRenderer.invoke('load-athletes'),
  saveAthlete: (athlete: { id: string; nome: string; equipe: string; pesoKg: number; faixa: string; anoNascimento: number; createdAt: string; updatedAt: string }) =>
    ipcRenderer.invoke('save-athlete', athlete),
  updateAthlete: (athlete: { id: string; nome: string; equipe: string; pesoKg: number; faixa: string; anoNascimento: number; createdAt: string; updatedAt: string }) =>
    ipcRenderer.invoke('update-athlete', athlete),
  deleteAthlete: (id: string) =>
    ipcRenderer.invoke('delete-athlete', id),
})

contextBridge.exposeInMainWorld('activation', {
  check: () => ipcRenderer.invoke('check-activation'),
  validate: (password: string) => ipcRenderer.invoke('validate-password', password),
  activate: () => ipcRenderer.invoke('activate-license'),
})
