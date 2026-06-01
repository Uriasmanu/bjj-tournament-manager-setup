import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { registerTournamentHandlers, getActiveTournamentId } from './tournament'
import { loadAthletes, saveAthlete, updateAthlete, deleteAthlete, deleteAthletes, importAthletesFromFile, openAthleteFileDialog, exportAthletes } from './athletes'
import { loadArbitros, saveArbitro, updateArbitro, deleteArbitro, deleteArbitros, importArbitrosFromFile, openArbitroFileDialog, exportArbitros } from './referees'
import { registerBracketHandlers } from './brackets'
import { checkActivation, validatePassword, activateLicense } from './activation'
import type { Atleta } from '../src/types/athlete'
import type { Arbitro } from '../src/types/referee'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  win.maximize()

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

function registerAthleteHandlers(): void {
  ipcMain.handle('load-athletes', (): ReturnType<typeof loadAthletes> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return loadAthletes(torneioId)
  })

  ipcMain.handle('save-athlete', (_event, athlete: Atleta): ReturnType<typeof saveAthlete> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return saveAthlete(torneioId, athlete)
  })

  ipcMain.handle('update-athlete', (_event, athlete: Atleta): ReturnType<typeof updateAthlete> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return updateAthlete(torneioId, athlete)
  })

  ipcMain.handle('delete-athlete', (_event, id: string): ReturnType<typeof deleteAthlete> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return deleteAthlete(torneioId, id)
  })

  ipcMain.handle('delete-athletes', (_event, ids: string[]): ReturnType<typeof deleteAthletes> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return deleteAthletes(torneioId, ids)
  })

  ipcMain.handle('import-athletes', async (): Promise<{ imported: number; skipped: number }> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    const filePath = await openAthleteFileDialog()
    if (!filePath) return { imported: 0, skipped: 0 }
    return importAthletesFromFile(torneioId, filePath)
  })

  ipcMain.handle('export-athletes', async (): Promise<void> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return exportAthletes(torneioId)
  })
}

function registerRefereeHandlers(): void {
  ipcMain.handle('save-arbitro', (_event, data: Omit<Arbitro, 'id' | 'createdAt' | 'updatedAt'>): Arbitro => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return saveArbitro(torneioId, data)
  })

  ipcMain.handle('update-arbitro', (_event, data: Arbitro): Arbitro => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return updateArbitro(torneioId, data)
  })

  ipcMain.handle('delete-arbitro', (_event, arbitroId: string): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return deleteArbitro(torneioId, arbitroId)
  })

  ipcMain.handle('delete-arbitros', (_event, arbitroIds: string[]): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return deleteArbitros(torneioId, arbitroIds)
  })

  ipcMain.handle('load-arbitros', (): Arbitro[] => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return loadArbitros(torneioId)
  })

  ipcMain.handle('import-arbitros', async (): Promise<{ imported: number; skipped: number }> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    const filePath = await openArbitroFileDialog()
    if (!filePath) return { imported: 0, skipped: 0 }
    return importArbitrosFromFile(torneioId, filePath)
  })

  ipcMain.handle('export-arbitros', async (): Promise<void> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return exportArbitros(torneioId)
  })
}

function registerActivationHandlers(): void {
  ipcMain.handle('check-activation', (): boolean => {
    return checkActivation()
  })

  ipcMain.handle('validate-password', (_event, password: string): boolean => {
    return validatePassword(password)
  })

  ipcMain.handle('activate-license', (): boolean => {
    return activateLicense()
  })
}

app.whenReady().then(() => {
  registerTournamentHandlers()
  registerAthleteHandlers()
  registerRefereeHandlers()
  registerBracketHandlers()
  registerActivationHandlers()
  createWindow()
})
