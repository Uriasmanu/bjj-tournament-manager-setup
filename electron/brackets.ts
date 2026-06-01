import { ipcMain, dialog, app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import type { Atleta } from '../src/types/athlete';
import type { Chave, Luta } from '../src/types/bracket';
import type { Torneio } from '../src/types/tournament';
import { getActiveTournamentId } from './tournament';

const DATA_DIR = path.join(app.getPath('userData'), 'data');
const TORNEIOS_DIR = path.join(DATA_DIR, 'torneios');

function getTorneioPath(torneioId: string): string {
  return path.join(TORNEIOS_DIR, `${torneioId}.json`);
}

function loadTorneio(torneioId: string): Torneio {
  const filePath = getTorneioPath(torneioId);
  if (!fs.existsSync(filePath)) throw new Error('Torneio não encontrado');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveTorneio(torneio: Torneio): void {
  fs.writeFileSync(getTorneioPath(torneio.id), JSON.stringify(torneio, null, 2), 'utf-8');
}

function aplicarSeedSorting(atletas: Atleta[]): Atleta[] {
  const sorted = [...atletas].sort((a, b) => {
    if (a.pesoKg !== b.pesoKg) return b.pesoKg - a.pesoKg;
    const idadeA = new Date().getFullYear() - a.anoNascimento;
    const idadeB = new Date().getFullYear() - b.anoNascimento;
    if (idadeA !== idadeB) return idadeB - idadeA;
    return a.nome.localeCompare(b.nome);
  });

  const n = sorted.length;
  if (n <= 2) return sorted;

  let sideA: number[], sideB: number[];
  if (n === 3) { sideA = [0]; sideB = [1, 2]; }
  else if (n === 4) { sideA = [0, 3]; sideB = [1, 2]; }
  else { sideA = [0, 3, 4]; sideB = [1, 2]; }

  for (const side of [sideA, sideB]) {
    const seen = new Set<string>();
    for (const idx of side) {
      const team = sorted[idx].equipe;
      if (!team) continue;
      if (seen.has(team)) {
        const otherSide = side === sideA ? sideB : sideA;
        for (const oi of otherSide) {
          const otherTeam = sorted[oi].equipe;
          if (otherTeam !== team && !seen.has(otherTeam)) {
            [sorted[idx], sorted[oi]] = [sorted[oi], sorted[idx]];
            break;
          }
        }
      }
      seen.add(sorted[idx].equipe);
    }
  }

  return sorted;
}

function criarLuta(ordem: number, atletaAId: string, atletaBId: string): Luta {
  return { id: crypto.randomUUID(), ordem, atletaAId, atletaBId };
}

function gerarLutasDois(posicoes: Atleta[]): Luta[] {
  return [criarLuta(1, posicoes[0].id, posicoes[1].id)];
}

function gerarLutasTres(posicoes: Atleta[]): Luta[] {
  return [criarLuta(1, posicoes[1].id, posicoes[2].id)];
}

function gerarLutasQuatro(posicoes: Atleta[]): Luta[] {
  return [
    criarLuta(1, posicoes[0].id, posicoes[3].id),
    criarLuta(2, posicoes[1].id, posicoes[2].id),
  ];
}

function gerarLutasCinco(posicoes: Atleta[]): Luta[] {
  return [criarLuta(1, posicoes[3].id, posicoes[4].id)];
}

function gerarLutas(posicoes: Atleta[]): Luta[] {
  switch (posicoes.length) {
    case 1: return [criarLuta(1, posicoes[0].id, 'bye')];
    case 2: return gerarLutasDois(posicoes);
    case 3: return gerarLutasTres(posicoes);
    case 4: return gerarLutasQuatro(posicoes);
    case 5: return gerarLutasCinco(posicoes);
    default: throw new Error('Número inválido de atletas');
  }
}

const FAIXA_ORDER: Record<string, number> = {
  'branca': 0, 'cinza': 1, 'amarela': 2, 'laranja': 3,
  'verde': 4, 'azul': 5, 'roxa': 6, 'marrom': 7, 'preta': 8,
};

const MAX_ATLETAS_POR_CHAVE = 5;

function gerarChave(categoriaId: string, atletas: Atleta[]): Chave {
  if (atletas.length < 1 || atletas.length > MAX_ATLETAS_POR_CHAVE) {
    throw new Error('A categoria precisa ter entre 1 e 5 atletas para gerar uma chave.');
  }

  const posicoes = aplicarSeedSorting(atletas);
  const lutas = gerarLutas(posicoes);

  return {
    id: crypto.randomUUID(),
    categoriaId,
    lutas,
    posicoesAtletas: posicoes.map(a => a.id),
    arbitroId: null,
    totalAtletas: posicoes.length,
    totalLutas: lutas.length,
    status: 'gerada',
  };
}

function autoAtribuirArbitros(torneio: Torneio): void {
  const chaves = torneio.chaves ?? [];
  const arbitros = torneio.arbitros ?? [];
  if (chaves.length === 0 || arbitros.length === 0) return;

  const chaveMaxLevel = chaves.map(chave => {
    const atletas = chave.posicoesAtletas
      .map(id => (torneio.atletas ?? []).find(a => a.id === id))
      .filter((a): a is Atleta => a !== undefined);
    const maxLevel = Math.max(...atletas.map(a => FAIXA_ORDER[a.faixa] ?? 0), 0);
    return { chave, maxLevel };
  });

  chaveMaxLevel.sort((a, b) => b.maxLevel - a.maxLevel);

  const usage = new Map<string, number>();
  for (const r of arbitros) usage.set(r.id, 0);

  for (const { chave, maxLevel } of chaveMaxLevel) {
    const best = arbitros
      .filter(r => (FAIXA_ORDER[r.faixa] ?? 0) >= maxLevel)
      .sort((a, b) => (usage.get(a.id) ?? 0) - (usage.get(b.id) ?? 0))[0];
    if (best) {
      chave.arbitroId = best.id;
      usage.set(best.id, (usage.get(best.id) ?? 0) + 1);
      if (!best.chaveIds.includes(chave.id)) {
        best.chaveIds.push(chave.id);
      }
    }
  }
}

function splitGrupo(grupo: Atleta[]): Atleta[][] {
  const subgrupos: Atleta[][] = [];
  for (let i = 0; i < grupo.length; i += MAX_ATLETAS_POR_CHAVE) {
    subgrupos.push(grupo.slice(i, i + MAX_ATLETAS_POR_CHAVE));
  }
  return subgrupos;
}

interface GerarTodasResult {
  chaves: Chave[];
  metadados: { categoriaId: string; totalAtletas: number; chavesGeradas: number; atletasIgnorados: string[] }[];
}

function gerarTodasChavesHandler(torneioId: string): GerarTodasResult {
  const torneio = loadTorneio(torneioId);
  const atletas = torneio.atletas ?? [];

  const atletasIgnorados: string[] = [];
  const grupos = new Map<string, Atleta[]>();
  for (const a of atletas) {
    if (!a.categoria) {
      atletasIgnorados.push(a.nome);
      continue;
    }
    const g = grupos.get(a.categoria) ?? [];
    g.push(a);
    grupos.set(a.categoria, g);
  }

  const novasChaves: Chave[] = [];
  const metadados: GerarTodasResult['metadados'] = [];

  for (const [categoriaId, grupo] of grupos) {
    if (grupo.length === 0) continue;

    const subgrupos = grupo.length > MAX_ATLETAS_POR_CHAVE
      ? splitGrupo(grupo)
      : [grupo];

    let chavesGeradas = 0;
    for (const sub of subgrupos) {
      novasChaves.push(gerarChave(categoriaId, sub));
      chavesGeradas++;
    }

    metadados.push({
      categoriaId,
      totalAtletas: grupo.length,
      chavesGeradas,
      atletasIgnorados: [...atletasIgnorados],
    });
  }

  torneio.chaves = novasChaves;
  autoAtribuirArbitros(torneio);
  torneio.updatedAt = new Date().toISOString();
  saveTorneio(torneio);

  return { chaves: novasChaves, metadados };
}

function randomizarChaveHandler(torneioId: string, data: { chaveId: string }): Chave {
  const torneio = loadTorneio(torneioId);
  const chaves = torneio.chaves ?? [];
  const index = chaves.findIndex(c => c.id === data.chaveId);
  if (index < 0) throw new Error('Chave não encontrada');

  const chave = chaves[index];

  const shuffled = [...chave.posicoesAtletas];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const atletas = shuffled
    .map(id => (torneio.atletas ?? []).find(a => a.id === id))
    .filter((a): a is Atleta => a !== undefined);

  const sorted = aplicarSeedSorting(atletas);

  chave.posicoesAtletas = sorted.map(a => a.id);
  chave.lutas = gerarLutas(sorted);

  chaves[index] = chave;
  torneio.chaves = chaves;
  torneio.updatedAt = new Date().toISOString();
  saveTorneio(torneio);

  return chave;
}

function atribuirArbitroHandler(
  torneioId: string,
  data: { chaveId: string; arbitroId: string | null }
): Chave {
  const torneio = loadTorneio(torneioId);
  const chaves = torneio.chaves ?? [];
  const chaveIndex = chaves.findIndex(c => c.id === data.chaveId);
  if (chaveIndex < 0) throw new Error('Chave não encontrada');

  const chave = chaves[chaveIndex];
  const oldArbitroId = chave.arbitroId;

  if (oldArbitroId) {
    const oldArbitro = (torneio.arbitros ?? []).find(r => r.id === oldArbitroId);
    if (oldArbitro) {
      oldArbitro.chaveIds = oldArbitro.chaveIds.filter(id => id !== data.chaveId);
    }
  }

  if (data.arbitroId) {
    const newArbitro = (torneio.arbitros ?? []).find(r => r.id === data.arbitroId);
    if (!newArbitro) throw new Error('Árbitro não encontrado no torneio.');
    if (!newArbitro.chaveIds.includes(data.chaveId)) {
      newArbitro.chaveIds.push(data.chaveId);
    }
  }

  chave.arbitroId = data.arbitroId;
  chaves[chaveIndex] = chave;
  torneio.chaves = chaves;
  torneio.updatedAt = new Date().toISOString();
  saveTorneio(torneio);

  return chave;
}

async function openBracketFileDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
}

function importChavesFromFile(torneioId: string, filePath: string): { imported: number } {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const incoming: unknown[] = JSON.parse(raw);

  if (!Array.isArray(incoming)) {
    throw new Error('Arquivo inválido: o conteúdo deve ser um array de chaves.');
  }

  for (const item of incoming) {
    const c = item as Record<string, unknown>;
    if (!c.id || !c.categoriaId || !Array.isArray(c.lutas)) {
      throw new Error('Estrutura de chave inválida no arquivo.');
    }
  }

  const torneio = loadTorneio(torneioId);
  torneio.chaves = incoming as Chave[];
  torneio.updatedAt = new Date().toISOString();
  saveTorneio(torneio);

  return { imported: incoming.length };
}

async function exportChavesToFile(torneioId: string): Promise<void> {
  const torneio = loadTorneio(torneioId);
  const chaves = torneio.chaves ?? [];

  const result = await dialog.showSaveDialog({
    title: 'Exportar Chaves',
    defaultPath: `${(torneio.nome || 'torneio').replace(/[^a-zA-Z0-9]/g, '_')}_chaves.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(chaves, null, 2), 'utf-8');
  }
}

export function registerBracketHandlers(): void {
  ipcMain.handle('gerar-todas-chaves', (): GerarTodasResult => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    return gerarTodasChavesHandler(torneioId);
  });

  ipcMain.handle('gerar-chave', (_event, data: { categoriaId: string }): Chave => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    const torneio = loadTorneio(torneioId);
    const atletas = (torneio.atletas ?? []).filter(a => a.categoria === data.categoriaId);

    if (atletas.length < 1 || atletas.length > MAX_ATLETAS_POR_CHAVE) {
      throw new Error('A categoria precisa ter entre 1 e 5 atletas para gerar uma chave.');
    }

    const chaves = torneio.chaves ?? [];
    if (chaves.some(c => c.categoriaId === data.categoriaId)) {
      throw new Error('Chave já existe para esta categoria.');
    }

    const chave = gerarChave(data.categoriaId, atletas);
    torneio.chaves = [...chaves, chave];
    torneio.updatedAt = new Date().toISOString();
    saveTorneio(torneio);
    return chave;
  });

  ipcMain.handle('load-chaves', (): Chave[] => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    return loadTorneio(torneioId).chaves ?? [];
  });

  ipcMain.handle('load-chave-por-categoria', (_event, categoriaId: string): Chave | null => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    const chaves = loadTorneio(torneioId).chaves ?? [];
    return chaves.find(c => c.categoriaId === categoriaId) ?? null;
  });

  ipcMain.handle('randomizar-chave', (_event, data: { chaveId: string }): Chave => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    return randomizarChaveHandler(torneioId, data);
  });

  ipcMain.handle('atribuir-arbitro-chave', (_event, data: { chaveId: string; arbitroId: string | null }): Chave => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    return atribuirArbitroHandler(torneioId, data);
  });

  ipcMain.handle('import-chaves', async (): Promise<{ imported: number }> => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    const filePath = await openBracketFileDialog();
    if (!filePath) return { imported: 0 };
    return importChavesFromFile(torneioId, filePath);
  });

  ipcMain.handle('export-chaves', async (): Promise<void> => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    return exportChavesToFile(torneioId);
  });
}
