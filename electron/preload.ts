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
  readFile: (path: string) =>
    ipcRenderer.invoke('read-file', path),
})
