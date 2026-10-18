import { ipcMain, dialog, app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import type { Torneio } from '../src/types/tournament';
import type { Atleta } from '../src/types/athlete';
import type { Arbitro } from '../src/types/referee';
import type { AreaLuta } from '../src/types/area';
import type { Chave } from '../src/types/bracket';
import type { LutaCasada } from '../src/types/lutaCasada';
import { CATEGORIAS_IBJJF } from '../src/types/category';
import { readTorneioMeta, writeTorneioMeta, listTournamentIds, migrateLegacyTorneioIfNeeded, getTorneioDir, loadTorneioCompat, saveTorneioCompat } from './storage/torneioStorage';

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

export function getActiveTournamentId(): string | null {
  if (!fs.existsSync(ATIVO_FILE)) return null;
  try {
    const { id } = JSON.parse(fs.readFileSync(ATIVO_FILE, 'utf-8'));
    return id;
  } catch {
    return null;
  }
}

interface MergeCounters {
  created: number;
  updated: number;
  kept: number;
  removed: number;
}

type MergeableItem = {
  id: string;
  updatedAt: string;
  deletedAt?: string | null | undefined;
};

function mergeById<T extends MergeableItem>(
  existing: T[],
  incoming: T[]
): { merged: T[]; counters: MergeCounters } {
  const existingMap = new Map<string, T>();
  for (const item of existing) existingMap.set(item.id, item);

  const incomingMap = new Map<string, T>();
  for (const item of incoming) incomingMap.set(item.id, item);

  const result: T[] = [];
  let created = 0;
  let updated = 0;
  let removed = 0;

  for (const inc of incomingMap.values()) {
    const ext = existingMap.get(inc.id);
    if (!ext) {
      result.push(inc);
      created += 1;
    } else if (inc.updatedAt > ext.updatedAt) {
      result.push(inc);
      updated += 1;
      if (ext.deletedAt == null && inc.deletedAt != null) {
        removed += 1;
      }
    } else {
      result.push(ext);
    }
  }

  let kept = 0;
  for (const [id, ext] of existingMap) {
    if (!incomingMap.has(id)) {
      result.push(ext);
      kept += 1;
    }
  }

  return { merged: result, counters: { created, updated, kept, removed } };
}

function dedupById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of arr) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

function normalizeAtleta(a: Atleta): Atleta {
  const now = new Date().toISOString();
  return {
    ...a,
    id: a.id || crypto.randomUUID(),
    createdAt: a.createdAt || now,
    updatedAt: a.updatedAt || now,
    nome: (a.nome || '').trim().toLowerCase(),
    equipe: (a.equipe || '').trim().toLowerCase(),
    deletedAt: a.deletedAt ?? null,
  };
}

function normalizeArbitro(a: Arbitro): Arbitro {
  const now = new Date().toISOString();
  return {
    ...a,
    id: a.id || crypto.randomUUID(),
    createdAt: a.createdAt || now,
    updatedAt: a.updatedAt || now,
    nome: (a.nome || '').trim().toLowerCase(),
    equipe: (a.equipe || '').trim().toLowerCase(),
    chaveIds: a.chaveIds ?? [],
    deletedAt: a.deletedAt ?? null,
  };
}

function normalizeArea(a: AreaLuta): AreaLuta {
  const now = new Date().toISOString();
  return {
    ...a,
    id: a.id || crypto.randomUUID(),
    createdAt: a.createdAt || now,
    updatedAt: a.updatedAt || now,
    nome: (a.nome || '').trim(),
    arbitroIds: Array.isArray(a.arbitroIds) ? a.arbitroIds.filter(Boolean) : [],
    deletedAt: a.deletedAt ?? null,
  };
}

export function registerTournamentHandlers(): void {
  ipcMain.handle('create-tournament', (_event, data: { nome: string; data: string }): Torneio => {
    ensureDirs();
    const categoriasDesabilitadas = CATEGORIAS_IBJJF
      .filter(c => c.faixaEtaria !== 'adulto')
      .map(c => c.id);
    const torneio: Torneio = {
      id: crypto.randomUUID(),
      nome: data.nome,
      data: data.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      categoriasDesabilitadas,
    };
    writeTorneioMeta(torneio);
    return torneio;
  });

  ipcMain.handle('list-tournaments', (): Torneio[] => {
    ensureDirs();
    const result: Torneio[] = [];
    for (const id of listTournamentIds()) {
      try {
        migrateLegacyTorneioIfNeeded(id);
        result.push(readTorneioMeta(id));
      } catch (err) {
        console.error(`[tournament] torneio '${id}' corrompido ou ilegível, ignorando na listagem:`, err);
      }
    }
    return result;
  });

  ipcMain.handle('start-tournament', (_event, payload: { id: string; mode: 'admin' | 'area' }): Torneio => {
    ensureDirs();
    migrateLegacyTorneioIfNeeded(payload.id);
    fs.writeFileSync(ATIVO_FILE, JSON.stringify({ id: payload.id, mode: payload.mode }), 'utf-8');
    const meta = readTorneioMeta(payload.id);
    meta.startedAt = new Date().toISOString();
    meta.updatedAt = new Date().toISOString();
    writeTorneioMeta(meta);
    return meta;
  });

  ipcMain.handle('get-tournament-mode', (): 'admin' | 'area' | null => {
    ensureDirs();
    if (!fs.existsSync(ATIVO_FILE)) return null;
    try {
      const data = JSON.parse(fs.readFileSync(ATIVO_FILE, 'utf-8'));
      return data.mode ?? 'admin';
    } catch {
      return null;
    }
  });

  ipcMain.handle('get-active-tournament', (): Torneio | null => {
    ensureDirs();
    const id = getActiveTournamentId();
    if (!id) return null;
    migrateLegacyTorneioIfNeeded(id);
    try {
      return loadTorneioCompat(id);
    } catch {
      return null;
    }
  });

  ipcMain.handle('export-tournament', async (_event, id: string): Promise<void> => {
    ensureDirs();
    migrateLegacyTorneioIfNeeded(id);
    const torneio = loadTorneioCompat(id);
    const defaultName = torneio.nome || `Torneio ${torneio.data}`;

    const result = await dialog.showSaveDialog({
      title: 'Exportar Torneio',
      defaultPath: `${defaultName.replace(/[^a-zA-Z0-9]/g, '_')}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, JSON.stringify(torneio, null, 2), 'utf-8');
    }
  });

  ipcMain.handle(
    'import-tournament',
    (
      _event,
      data: Torneio
    ): { success: true; merged: boolean; created: number; updated: number; kept: number; removed: number } => {
      ensureDirs();
      if (!data.id || !data.data) {
        throw new Error('Estrutura inválida');
      }

      migrateLegacyTorneioIfNeeded(data.id);
      const now = new Date().toISOString();

      let existing: Torneio | null = null;
      try {
        existing = loadTorneioCompat(data.id);
      } catch {
        existing = null;
      }

      if (!existing) {
        const defaultDesabilitadas = CATEGORIAS_IBJJF
          .filter(c => c.faixaEtaria !== 'adulto')
          .map(c => c.id);
        const torneio: Torneio = {
          ...data,
          createdAt: data.createdAt || now,
          updatedAt: data.updatedAt || now,
          atletas: dedupById((data.atletas ?? []).map(a => normalizeAtleta(a))),
          arbitros: dedupById((data.arbitros ?? []).map(a => normalizeArbitro(a))),
          areas: dedupById((data.areas ?? []).map(a => normalizeArea(a))),
          chaves: dedupById(data.chaves ?? []),
          lutasCasadas: dedupById(data.lutasCasadas ?? []),
          categoriasDesabilitadas: data.categoriasDesabilitadas ?? defaultDesabilitadas,
          categoriasCustomizadas: data.categoriasCustomizadas ?? [],
        };
        saveTorneioCompat(torneio);
        return { success: true, merged: false, created: 0, updated: 0, kept: 0, removed: 0 };
      }

      const incomingAtletas = (data.atletas ?? []).map(a => normalizeAtleta(a));
      const incomingArbitros = (data.arbitros ?? []).map(a => normalizeArbitro(a));
      const incomingAreas = (data.areas ?? []).map(a => normalizeArea(a));
      const incomingChaves = data.chaves ?? [];
      const incomingLutasCasadas = data.lutasCasadas ?? [];

      const incomingIsMoreRecent = data.updatedAt > existing.updatedAt;

      const atletasMerge = mergeById<Atleta>(existing.atletas ?? [], incomingAtletas);
      const arbitrosMerge = mergeById<Arbitro>(existing.arbitros ?? [], incomingArbitros);
      const areasMerge = mergeById<AreaLuta>(existing.areas ?? [], incomingAreas);
      const chavesMerge = mergeById<Chave>(existing.chaves ?? [], incomingChaves);
      const lutasCasadasMerge = mergeById<LutaCasada>(existing.lutasCasadas ?? [], incomingLutasCasadas);

      const counters: MergeCounters = {
        created:
          atletasMerge.counters.created +
          arbitrosMerge.counters.created +
          areasMerge.counters.created +
          chavesMerge.counters.created +
          lutasCasadasMerge.counters.created,
        updated:
          atletasMerge.counters.updated +
          arbitrosMerge.counters.updated +
          areasMerge.counters.updated +
          chavesMerge.counters.updated +
          lutasCasadasMerge.counters.updated,
        kept:
          atletasMerge.counters.kept +
          arbitrosMerge.counters.kept +
          areasMerge.counters.kept +
          chavesMerge.counters.kept +
          lutasCasadasMerge.counters.kept,
        removed:
          atletasMerge.counters.removed +
          arbitrosMerge.counters.removed +
          areasMerge.counters.removed +
          chavesMerge.counters.removed +
          lutasCasadasMerge.counters.removed,
      };

      const merged: Torneio = {
        id: existing.id,
        nome: incomingIsMoreRecent ? data.nome : existing.nome,
        data: incomingIsMoreRecent ? data.data : existing.data,
        createdAt: existing.createdAt,
        updatedAt: data.updatedAt > existing.updatedAt ? data.updatedAt : existing.updatedAt,
        startedAt: existing.startedAt ?? data.startedAt,
        atletas: atletasMerge.merged,
        arbitros: arbitrosMerge.merged,
        areas: areasMerge.merged,
        chaves: chavesMerge.merged,
        lutasCasadas: lutasCasadasMerge.merged,
        categoriasDesabilitadas: incomingIsMoreRecent
          ? (data.categoriasDesabilitadas ?? existing.categoriasDesabilitadas ?? [])
          : (existing.categoriasDesabilitadas ?? data.categoriasDesabilitadas ?? []),
        categoriasCustomizadas: incomingIsMoreRecent
          ? (data.categoriasCustomizadas ?? existing.categoriasCustomizadas ?? [])
          : (existing.categoriasCustomizadas ?? data.categoriasCustomizadas ?? []),
      };

      saveTorneioCompat(merged);
      return { success: true, merged: true, ...counters };
    }
  );

  ipcMain.handle('update-tournament', (_event, data: Torneio): Torneio => {
    ensureDirs();
    migrateLegacyTorneioIfNeeded(data.id);
    loadTorneioCompat(data.id); // lança 'Torneio não encontrado' se não existir
    const torneio: Torneio = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveTorneioCompat(torneio);
    return torneio;
  });

  ipcMain.handle('delete-tournament', (_event, id: string): void => {
    ensureDirs();
    migrateLegacyTorneioIfNeeded(id);
    const dirPath = getTorneioDir(id);
    const legacyPath = getTorneioPath(id);
    const migratedPath = `${legacyPath}.migrated`;
    if (!fs.existsSync(dirPath) && !fs.existsSync(legacyPath) && !fs.existsSync(migratedPath)) {
      throw new Error('Torneio não encontrado');
    }
    if (fs.existsSync(dirPath)) fs.rmSync(dirPath, { recursive: true, force: true });
    if (fs.existsSync(legacyPath)) fs.unlinkSync(legacyPath);
    if (fs.existsSync(migratedPath)) fs.unlinkSync(migratedPath);

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
