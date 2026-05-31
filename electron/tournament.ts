import { ipcMain, dialog, app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import type { Torneio } from '../src/types/tournament';

const DATA_DIR = path.join(app.getPath('userData'), 'data');
const TORNEIOS_DIR = path.join(DATA_DIR, 'torneios');
const ATIVO_FILE = path.join(DATA_DIR, 'torneio-ativo.json');

function ensureDirs(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(TORNEIOS_DIR)) fs.mkdirSync(TORNEIOS_DIR, { recursive: true });
}

function getTorneioPath(id: string): string {
  return path.join(TORNEIOS_DIR, `${id}.json`);
}

export function registerTournamentHandlers(): void {
  ipcMain.handle('create-tournament', (_event, data: { nome: string; data: string }): Torneio => {
    ensureDirs();
    const torneio: Torneio = {
      id: crypto.randomUUID(),
      nome: data.nome,
      data: data.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(getTorneioPath(torneio.id), JSON.stringify(torneio, null, 2), 'utf-8');
    return torneio;
  });

  ipcMain.handle('list-tournaments', (): Torneio[] => {
    ensureDirs();
    const files = fs.readdirSync(TORNEIOS_DIR).filter(f => f.endsWith('.json'));
    return files.map(f => {
      const content = fs.readFileSync(path.join(TORNEIOS_DIR, f), 'utf-8');
      return JSON.parse(content) as Torneio;
    });
  });

  ipcMain.handle('start-tournament', (_event, id: string): void => {
    ensureDirs();
    fs.writeFileSync(ATIVO_FILE, JSON.stringify({ id }), 'utf-8');
  });

  ipcMain.handle('get-active-tournament', (): Torneio | null => {
    ensureDirs();
    if (!fs.existsSync(ATIVO_FILE)) return null;
    try {
      const { id } = JSON.parse(fs.readFileSync(ATIVO_FILE, 'utf-8'));
      const filePath = getTorneioPath(id);
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Torneio;
    } catch {
      return null;
    }
  });

  ipcMain.handle('export-tournament', async (_event, id: string): Promise<void> => {
    ensureDirs();
    const sourcePath = getTorneioPath(id);
    if (!fs.existsSync(sourcePath)) throw new Error('Torneio não encontrado');

    const torneio = JSON.parse(fs.readFileSync(sourcePath, 'utf-8')) as Torneio;
    const defaultName = torneio.nome || `Torneio ${torneio.data}`;

    const result = await dialog.showSaveDialog({
      title: 'Exportar Torneio',
      defaultPath: `${defaultName.replace(/[^a-zA-Z0-9]/g, '_')}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (!result.canceled && result.filePath) {
      fs.copyFileSync(sourcePath, result.filePath);
    }
  });

  ipcMain.handle('import-tournament', (_event, data: Torneio): { success: boolean; exists?: boolean } => {
    ensureDirs();
    if (!data.id || !data.data) {
      throw new Error('Estrutura inválida');
    }
    const dest = getTorneioPath(data.id);
    if (fs.existsSync(dest)) {
      return { success: false, exists: true };
    }
    fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  });

  ipcMain.handle('import-tournament-overwrite', (_event, data: Torneio): void => {
    ensureDirs();
    const dest = getTorneioPath(data.id);
    fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf-8');
  });

  ipcMain.handle('update-tournament', (_event, data: Torneio): Torneio => {
    ensureDirs();
    const filePath = getTorneioPath(data.id);
    if (!fs.existsSync(filePath)) throw new Error('Torneio não encontrado');
    const torneio: Torneio = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(filePath, JSON.stringify(torneio, null, 2), 'utf-8');
    return torneio;
  });

  ipcMain.handle('delete-tournament', (_event, id: string): void => {
    ensureDirs();
    const filePath = getTorneioPath(id);
    if (!fs.existsSync(filePath)) throw new Error('Torneio não encontrado');
    fs.unlinkSync(filePath);

    if (fs.existsSync(ATIVO_FILE)) {
      try {
        const { id: activeId } = JSON.parse(fs.readFileSync(ATIVO_FILE, 'utf-8'));
        if (activeId === id) {
          fs.unlinkSync(ATIVO_FILE);
        }
      } catch {
        // ignore
      }
    }
  });

  ipcMain.handle('read-file', async (_event, filePath: string): Promise<string> => {
    return fs.readFileSync(filePath, 'utf-8');
  });
}
