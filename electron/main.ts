import { app, BrowserWindow, ipcMain, screen } from 'electron'
import path from 'node:path'
import { registerTournamentHandlers, getActiveTournamentId } from './tournament'
import { gerarPdfLutasCasadas, gerarPdfChaves, gerarPdfResultados } from './pdf'
import { loadAthletes, loadDeletedAthletes, saveAthlete, updateAthlete, deleteAthlete, deleteAthletes, restoreAthlete, permanentlyDeleteAthlete, permanentlyDeleteAthletes, importAthletesFromFile, openAthleteFileDialog, exportAthletes } from './athletes'
import { loadArbitros, loadDeletedArbitros, saveArbitro, updateArbitro, deleteArbitro, deleteArbitros, restoreArbitro, permanentlyDeleteArbitro, permanentlyDeleteArbitros, importArbitrosFromFile, openArbitroFileDialog, exportArbitros } from './referees'
import { loadAreas, loadDeletedAreas, saveArea, updateArea, deleteArea, deleteAreas, restoreArea, permanentlyDeleteArea, permanentlyDeleteAreas, importAreasFromFile, openAreaFileDialog, exportAreas } from './areas'
import { registerBracketHandlers } from './brackets'
import { loadLutasCasadas, loadDeletedLutasCasadas, loadLutasCasadasPorArea, saveLutaCasada, updateLutaCasada, deleteLutaCasada, deleteLutasCasadas, permanentlyDeleteLutaCasada, permanentlyDeleteLutasCasadas, restoreLutaCasada, restoreLutasCasadas } from './lutasCasadas'
import { loadCategorias, toggleCategoria, saveCategoriaCustomizada, updateCategoriaCustomizada, deleteCategoriaCustomizada } from './categorias'
import { checkActivation, validatePassword, activateLicense, getActivationInfo } from './activation'
import type { AreaLuta } from '../src/types/area'
import type { Chave } from '../src/types/bracket'
import type { Atleta } from '../src/types/athlete'
import type { Arbitro } from '../src/types/referee'
import type { LutaCasada } from '../src/types/lutaCasada'
import type { CategoriaCustomizada } from '../src/types/category'

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
let telaoWin: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: true,
      contextIsolation: true,
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

function createTelaoWindow(url: string) {
  if (telaoWin && !telaoWin.isDestroyed()) {
    telaoWin.focus()
    return telaoWin
  }

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
  const telaoHeight = Math.round(screenHeight * 0.10)

  telaoWin = new BrowserWindow({
    title: 'Telão - Placar',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.svg'),
    width: screenWidth,
    height: telaoHeight,
    x: 0,
    y: screenHeight - telaoHeight,
    resizable: true,
    alwaysOnTop: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: true,
      contextIsolation: true,
    },
  })

  telaoWin.on('closed', () => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('telao-fechado')
    }
    telaoWin = null
  })

  if (VITE_DEV_SERVER_URL) {
    telaoWin.loadURL(`${VITE_DEV_SERVER_URL}#${url}`)
  } else {
    telaoWin.loadFile(path.join(RENDERER_DIST, 'index.html'), { hash: url })
  }

  return telaoWin
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

  ipcMain.handle('restore-athlete', (_event, id: string): ReturnType<typeof restoreAthlete> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return restoreAthlete(torneioId, id)
  })

  ipcMain.handle('load-deleted-athletes', (): ReturnType<typeof loadDeletedAthletes> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return loadDeletedAthletes(torneioId)
  })

  ipcMain.handle('permanently-delete-athlete', (_event, id: string): ReturnType<typeof permanentlyDeleteAthlete> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return permanentlyDeleteAthlete(torneioId, id)
  })

  ipcMain.handle('permanently-delete-athletes', (_event, ids: string[]): ReturnType<typeof permanentlyDeleteAthletes> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return permanentlyDeleteAthletes(torneioId, ids)
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

  ipcMain.handle('restore-arbitro', (_event, arbitroId: string): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return restoreArbitro(torneioId, arbitroId)
  })

  ipcMain.handle('load-deleted-arbitros', (): Arbitro[] => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return loadDeletedArbitros(torneioId)
  })

  ipcMain.handle('permanently-delete-arbitro', (_event, arbitroId: string): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return permanentlyDeleteArbitro(torneioId, arbitroId)
  })

  ipcMain.handle('permanently-delete-arbitros', (_event, arbitroIds: string[]): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return permanentlyDeleteArbitros(torneioId, arbitroIds)
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

function registerAreaHandlers(): void {
  ipcMain.handle('load-areas', (): AreaLuta[] => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return loadAreas(torneioId)
  })

  ipcMain.handle('save-area', (_event, data: { nome: string; arbitroIds: string[] }): AreaLuta => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return saveArea(torneioId, data)
  })

  ipcMain.handle('update-area', (_event, data: AreaLuta): AreaLuta => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return updateArea(torneioId, data)
  })

  ipcMain.handle('delete-area', (_event, areaId: string): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return deleteArea(torneioId, areaId)
  })

  ipcMain.handle('delete-areas', (_event, areaIds: string[]): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return deleteAreas(torneioId, areaIds)
  })

  ipcMain.handle('restore-area', (_event, areaId: string): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return restoreArea(torneioId, areaId)
  })

  ipcMain.handle('load-deleted-areas', (): AreaLuta[] => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return loadDeletedAreas(torneioId)
  })

  ipcMain.handle('permanently-delete-area', (_event, areaId: string): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return permanentlyDeleteArea(torneioId, areaId)
  })

  ipcMain.handle('permanently-delete-areas', (_event, areaIds: string[]): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return permanentlyDeleteAreas(torneioId, areaIds)
  })

  ipcMain.handle('import-areas', async (): Promise<{ imported: number; skipped: number }> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    const filePath = await openAreaFileDialog()
    if (!filePath) return { imported: 0, skipped: 0 }
    return importAreasFromFile(torneioId, filePath)
  })

  ipcMain.handle('export-areas', async (): Promise<void> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return exportAreas(torneioId)
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

  ipcMain.handle('get-activation-info', () => {
    return getActivationInfo()
  })
}

function registerCategoriaHandlers(): void {
  ipcMain.handle('load-categorias', (): { desabilitadas: string[]; customizadas: CategoriaCustomizada[] } => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return loadCategorias(torneioId)
  })

  ipcMain.handle('toggle-categoria', (_event, categoriaId: string): string[] => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return toggleCategoria(torneioId, categoriaId)
  })

  ipcMain.handle('save-categoria-customizada', (_event, data: Omit<CategoriaCustomizada, 'id' | 'createdAt' | 'updatedAt'>): CategoriaCustomizada => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return saveCategoriaCustomizada(torneioId, data)
  })

  ipcMain.handle('update-categoria-customizada', (_event, data: CategoriaCustomizada): CategoriaCustomizada => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return updateCategoriaCustomizada(torneioId, data)
  })

  ipcMain.handle('delete-categoria-customizada', (_event, categoriaId: string): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return deleteCategoriaCustomizada(torneioId, categoriaId)
  })
}

function registerLutasCasadasHandlers(): void {
  ipcMain.handle('load-lutas-casadas', (): LutaCasada[] => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return loadLutasCasadas(torneioId)
  })

  ipcMain.handle('load-deleted-lutas-casadas', (): LutaCasada[] => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return loadDeletedLutasCasadas(torneioId)
  })

  ipcMain.handle('load-lutas-casadas-por-area', (_event, areaId: string): LutaCasada[] => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return loadLutasCasadasPorArea(torneioId, areaId)
  })

  ipcMain.handle('save-luta-casada', (_event, data: Omit<LutaCasada, 'id' | 'tag' | 'createdAt' | 'updatedAt'>): LutaCasada => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return saveLutaCasada(torneioId, data)
  })

  ipcMain.handle('update-luta-casada', (_event, data: LutaCasada): LutaCasada => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return updateLutaCasada(torneioId, data)
  })

  ipcMain.handle('delete-luta-casada', (_event, lutaCasadaId: string): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return deleteLutaCasada(torneioId, lutaCasadaId)
  })

  ipcMain.handle('delete-lutas-casadas', (_event, ids: string[]): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return deleteLutasCasadas(torneioId, ids)
  })

  ipcMain.handle('permanently-delete-luta-casada', (_event, lutaCasadaId: string): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return permanentlyDeleteLutaCasada(torneioId, lutaCasadaId)
  })

  ipcMain.handle('permanently-delete-lutas-casadas', (_event, ids: string[]): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return permanentlyDeleteLutasCasadas(torneioId, ids)
  })

  ipcMain.handle('restore-luta-casada', (_event, lutaCasadaId: string): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return restoreLutaCasada(torneioId, lutaCasadaId)
  })

  ipcMain.handle('restore-lutas-casadas', (_event, ids: string[]): void => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return restoreLutasCasadas(torneioId, ids)
  })
}

function registerPdfHandlers(): void {
  ipcMain.handle('gerar-pdf-lutas-casadas', (_event, lutas: LutaCasada[], nomeTorneio: string, arbitros: Arbitro[], customizadas: CategoriaCustomizada[]): Promise<Buffer> => {
    return gerarPdfLutasCasadas(lutas, nomeTorneio, arbitros, customizadas)
  })

  ipcMain.handle('gerar-pdf-chaves', (_event, chaves: Chave[], atletas: Atleta[], nomeTorneio: string, customizadas: CategoriaCustomizada[]): Promise<Buffer> => {
    return gerarPdfChaves(chaves, atletas, nomeTorneio, customizadas)
  })

  ipcMain.handle('gerar-pdf-resultados', (_event, chaves: Chave[], atletas: Atleta[], arbitros: Arbitro[], medalhasPorEquipe: Record<string, { ouro: number; prata: number; bronze: number }>, nomeTorneio: string, customizadas: CategoriaCustomizada[]): Promise<Buffer> => {
    return gerarPdfResultados(chaves, atletas, arbitros, medalhasPorEquipe, nomeTorneio, customizadas)
  })
}

function registerTelaoHandlers(): void {
  ipcMain.handle('abrir-telao', (_event, url: string): void => {
    createTelaoWindow(url)
  })

  ipcMain.handle('enviar-dados-placar-telao', (_event, dados: unknown): void => {
    if (telaoWin && !telaoWin.isDestroyed()) {
      telaoWin.webContents.send('atualizar-placar-telao', dados)
    }
  })

  ipcMain.handle('fechar-telao', (): void => {
    if (telaoWin && !telaoWin.isDestroyed()) {
      telaoWin.close()
      telaoWin = null
    }
  })
}

app.whenReady().then(() => {
  registerTournamentHandlers()
  registerAthleteHandlers()
  registerRefereeHandlers()
  registerBracketHandlers()
  registerAreaHandlers()
  registerLutasCasadasHandlers()
  registerCategoriaHandlers()
  registerActivationHandlers()
  registerPdfHandlers()
  registerTelaoHandlers()
  createWindow()
})
