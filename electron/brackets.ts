import { ipcMain, dialog, app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import type { Atleta } from '../src/types/athlete';
import type { Chave, Luta } from '../src/types/bracket';
import type { Torneio } from '../src/types/tournament';
import { getActiveTournamentId } from './tournament';
import { loadAreas } from './areas';

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

function criarLuta(ordem: number, rodada: number, atletaAId: string, atletaBId: string): Luta {
  return { id: crypto.randomUUID(), ordem, rodada, atletaAId, atletaBId, status: 'pending', vencedorId: null };
}

function gerarLutasDois(posicoes: Atleta[]): Luta[] {
  return [criarLuta(1, 1, posicoes[0].id, posicoes[1].id)];
}

const TBD = 'tbd';

function gerarLutasTres(posicoes: Atleta[]): Luta[] {
  return [
    criarLuta(1, 1, posicoes[0].id, posicoes[1].id),
    criarLuta(2, 2, TBD, posicoes[2].id),
  ];
}

function gerarLutasQuatro(posicoes: Atleta[]): Luta[] {
  return [
    criarLuta(1, 1, posicoes[0].id, posicoes[3].id),
    criarLuta(2, 1, posicoes[1].id, posicoes[2].id),
    criarLuta(3, 2, TBD, TBD),
  ];
}

function gerarLutasCinco(posicoes: Atleta[]): Luta[] {
  return [
    criarLuta(1, 1, posicoes[0].id, posicoes[1].id),
    criarLuta(2, 1, posicoes[2].id, posicoes[3].id),
    criarLuta(3, 2, TBD, posicoes[4].id),
    criarLuta(4, 3, TBD, TBD),
  ];
}

function getTotalRodadas(totalAtletas: number): number {
  if (totalAtletas <= 2) return 1;
  if (totalAtletas <= 4) return 2;
  return 3;
}

function gerarLutas(posicoes: Atleta[]): Luta[] {
  switch (posicoes.length) {
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
  if (atletas.length < 2 || atletas.length > MAX_ATLETAS_POR_CHAVE) {
    throw new Error('A categoria precisa ter entre 2 e 5 atletas para gerar uma chave.');
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
    totalRodadas: getTotalRodadas(posicoes.length),
    status: 'gerada',
  };
}

function autoAtribuirArbitros(torneio: Torneio): void {
  const chaves = torneio.chaves ?? [];
  const arbitros = torneio.arbitros ?? [];
  if (chaves.length === 0 || arbitros.length === 0) return;

  for (const r of arbitros) {
    r.chaveIds = [];
  }

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
  atletasSemChave: Atleta[];
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
  const atletasSemChave: Atleta[] = [];
  const metadados: GerarTodasResult['metadados'] = [];

  for (const [categoriaId, grupo] of grupos) {
    if (grupo.length === 0) continue;

    if (grupo.length === 1) {
      atletasSemChave.push(grupo[0]);
      metadados.push({
        categoriaId,
        totalAtletas: 1,
        chavesGeradas: 0,
        atletasIgnorados: [...atletasIgnorados],
      });
      continue;
    }

    const subgrupos = grupo.length > MAX_ATLETAS_POR_CHAVE
      ? splitGrupo(grupo)
      : [grupo];

    let chavesGeradas = 0;
    for (const sub of subgrupos) {
      if (sub.length === 1) {
        atletasSemChave.push(sub[0]);
        continue;
      }
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

  // Mark emChave on all athletes
  const atletasEmChaves = new Set<string>();
  for (const chave of novasChaves) {
    for (const id of chave.posicoesAtletas) {
      atletasEmChaves.add(id);
    }
  }
  for (const a of (torneio.atletas ?? [])) {
    a.emChave = atletasEmChaves.has(a.id);
  }

  torneio.updatedAt = new Date().toISOString();
  saveTorneio(torneio);

  return { chaves: novasChaves, metadados, atletasSemChave };
}

function separarEquipes(atletas: Atleta[]): void {
  const n = atletas.length;
  if (n < 4) return;

  const sideA: number[] = n === 4 ? [0, 3] : [0, 1];
  const sideB: number[] = n === 4 ? [1, 2] : [2, 3, 4];

  for (const side of [sideA, sideB]) {
    const seenTeams = new Set<string>();
    for (const idx of side) {
      const team = atletas[idx]?.equipe;
      if (!team) continue;
      if (seenTeams.has(team)) {
        const otherSide = side === sideA ? sideB : sideA;
        for (const oi of otherSide) {
          const otherTeam = atletas[oi]?.equipe;
          if (otherTeam !== team) {
            [atletas[idx], atletas[oi]] = [atletas[oi], atletas[idx]];
            break;
          }
        }
      }
      if (atletas[idx]?.equipe) seenTeams.add(atletas[idx].equipe);
    }
  }
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

  separarEquipes(atletas);

  chave.posicoesAtletas = atletas.map(a => a.id);
  chave.lutas = gerarLutas(atletas);

  chaves[index] = chave;
  torneio.chaves = chaves;

  // Mark emChave on athletes in this chave
  for (const a of (torneio.atletas ?? [])) {
    if (chave.posicoesAtletas.includes(a.id)) {
      a.emChave = true;
    }
  }

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

  const torneio = loadTorneio(torneioId);
  const chaves: Chave[] = (incoming as Record<string, unknown>[]).map((c) => {
    if (!c.categoriaId || !Array.isArray(c.lutas)) {
      throw new Error('Estrutura de chave inválida no arquivo.');
    }
    return {
      ...c,
      id: (c.id as string) || crypto.randomUUID(),
    } as Chave;
  });
  torneio.chaves = chaves;

  // Mark emChave on athletes
  const atletasEmChaves = new Set<string>();
  for (const chave of chaves) {
    for (const id of chave.posicoesAtletas) {
      atletasEmChaves.add(id);
    }
  }
  for (const a of (torneio.atletas ?? [])) {
    a.emChave = atletasEmChaves.has(a.id);
  }

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

function normalizeLuta(luta: Record<string, unknown>): Luta {
  return {
    id: luta.id as string,
    ordem: (luta.ordem as number) ?? 0,
    rodada: (luta.rodada as number) ?? 1,
    atletaAId: (luta.atletaAId as string) ?? '',
    atletaBId: (luta.atletaBId as string) ?? '',
    status: (luta.status as Luta['status']) ?? 'pending',
    vencedorId: (luta.vencedorId as string | null) ?? null,
    placarA: (luta.placarA as Luta['placarA']) ?? undefined,
    placarB: (luta.placarB as Luta['placarB']) ?? undefined,
    finalizacao: (luta.finalizacao as boolean) ?? undefined,
    desclassificacao: (luta.desclassificacao as boolean) ?? undefined,
    desempateArbitro: (luta.desempateArbitro as boolean) ?? undefined,
  };
}

function normalizeChave(chave: Record<string, unknown>): Chave {
  const lutas = (chave.lutas as Record<string, unknown>[] ?? []).map(normalizeLuta);
  return {
    id: chave.id as string,
    categoriaId: (chave.categoriaId as string) ?? '',
    lutas,
    posicoesAtletas: (chave.posicoesAtletas as string[]) ?? [],
    arbitroId: (chave.arbitroId as string | null) ?? null,
    totalAtletas: (chave.totalAtletas as number) ?? 0,
    totalLutas: (chave.totalLutas as number) ?? 0,
    totalRodadas: (chave.totalRodadas as number) ?? (lutas.length > 0 ? Math.max(...lutas.map(l => l.rodada)) : 1),
    status: (chave.status as Chave['status']) ?? 'gerada',
  };
}

function loadChavesPorAreaHandler(torneioId: string, areaId: string): Chave[] {
  const torneio = loadTorneio(torneioId);
  const areas = loadAreas(torneioId);
  const area = areas.find(a => a.id === areaId);
  if (!area) return [];
  const arbitroIds = new Set(area.arbitroIds);
  return (torneio.chaves ?? [])
    .map(c => normalizeChave(c as unknown as Record<string, unknown>))
    .filter(c => c.arbitroId && arbitroIds.has(c.arbitroId));
}

function clearWinnerFromLaterRounds(chave: Chave, rodada: number, atletaId: string): void {
  for (const l of chave.lutas) {
    if (l.rodada <= rodada) continue;
    if (l.atletaAId === atletaId) {
      l.atletaAId = 'tbd';
      l.vencedorId = null;
      if (l.status === 'completed' || l.status === 'wo') l.status = 'pending';
      clearWinnerFromLaterRounds(chave, l.rodada, atletaId);
    }
    if (l.atletaBId === atletaId) {
      l.atletaBId = 'tbd';
      l.vencedorId = null;
      if (l.status === 'completed' || l.status === 'wo') l.status = 'pending';
      clearWinnerFromLaterRounds(chave, l.rodada, atletaId);
    }
  }
}

function advanceWinnerInChave(chave: Chave, luta: Luta): void {
  const currentRoundLutas = chave.lutas.filter(l => l.rodada === luta.rodada);
  const matchIndex = currentRoundLutas.indexOf(luta);
  if (matchIndex < 0) return;

  let targetRodada = luta.rodada + 1;
  while (targetRodada <= (chave.totalRodadas || 3)) {
    const nextRoundLutas = chave.lutas.filter(l => l.rodada === targetRodada);
    if (nextRoundLutas.length === 0) return;

    const pairsPerMatch = Math.pow(2, targetRodada - luta.rodada - 1);
    const nextMatchIndex = Math.floor(matchIndex / pairsPerMatch);
    if (nextMatchIndex >= nextRoundLutas.length) return;

    const nextLuta = nextRoundLutas[nextMatchIndex];
    const slotIndex = matchIndex % Math.pow(2, targetRodada - luta.rodada);
    const firstSlotAt = Math.floor(slotIndex / pairsPerMatch);

    if (firstSlotAt === 0 && (nextLuta.atletaAId === 'tbd' || nextLuta.atletaAId === '')) {
      nextLuta.atletaAId = luta.vencedorId!;
      return;
    }
    if (firstSlotAt === 1 && (nextLuta.atletaBId === 'tbd' || nextLuta.atletaBId === '')) {
      nextLuta.atletaBId = luta.vencedorId!;
      return;
    }

    targetRodada++;
  }
}

function registrarResultadoHandler(
  torneioId: string,
  data: {
    chaveId: string;
    lutaId: string;
    vencedorId: string;
    status: string;
    placarA?: Luta['placarA'];
    placarB?: Luta['placarB'];
    finalizacao?: boolean;
    desclassificacao?: boolean;
    desempateArbitro?: boolean;
  }
): Chave {
  const torneio = loadTorneio(torneioId);
  const chaves = [...(torneio.chaves ?? [])];
  const chaveIndex = chaves.findIndex(c => c.id === data.chaveId);
  if (chaveIndex < 0) throw new Error('Chave não encontrada');

  const chave = JSON.parse(JSON.stringify(chaves[chaveIndex])) as Chave;
  const luta = chave.lutas.find(l => l.id === data.lutaId);
  if (!luta) throw new Error('Luta não encontrada');

  const oldWinnerId = luta.vencedorId;
  if (oldWinnerId && oldWinnerId !== data.vencedorId) {
    clearWinnerFromLaterRounds(chave, luta.rodada, oldWinnerId);
  }

  luta.vencedorId = data.vencedorId;
  luta.status = data.status === 'wo' ? 'wo' : 'completed';
  luta.placarA = data.placarA;
  luta.placarB = data.placarB;
  luta.finalizacao = data.finalizacao ?? false;
  luta.desclassificacao = data.desclassificacao ?? false;
  luta.desempateArbitro = data.desempateArbitro ?? false;

  advanceWinnerInChave(chave, luta);

  chaves[chaveIndex] = chave;
  torneio.chaves = chaves;
  torneio.updatedAt = new Date().toISOString();
  saveTorneio(torneio);

  return chave;
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

    if (atletas.length < 2 || atletas.length > MAX_ATLETAS_POR_CHAVE) {
      throw new Error('A categoria precisa ter entre 2 e 5 atletas para gerar uma chave.');
    }

    const chaves = torneio.chaves ?? [];
    if (chaves.some(c => c.categoriaId === data.categoriaId)) {
      throw new Error('Chave já existe para esta categoria.');
    }

    const chave = gerarChave(data.categoriaId, atletas);
    torneio.chaves = [...chaves, chave];

    // Mark emChave on athletes in this chave
    for (const a of (torneio.atletas ?? [])) {
      if (chave.posicoesAtletas.includes(a.id)) {
        a.emChave = true;
      }
    }

    torneio.updatedAt = new Date().toISOString();
    saveTorneio(torneio);
    return chave;
  });

  ipcMain.handle('load-chaves', (): Chave[] => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    return (loadTorneio(torneioId).chaves ?? []).map(c => normalizeChave(c as unknown as Record<string, unknown>));
  });

  ipcMain.handle('load-chave-por-categoria', (_event, categoriaId: string): Chave | null => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    const chaves = (loadTorneio(torneioId).chaves ?? []).map(c => normalizeChave(c as unknown as Record<string, unknown>));
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

  ipcMain.handle('load-chaves-por-area', (_event, areaId: string): Chave[] => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    return loadChavesPorAreaHandler(torneioId, areaId);
  });

  ipcMain.handle('registrar-resultado', (_event, data: {
    chaveId: string;
    lutaId: string;
    vencedorId: string;
    status: string;
    placarA?: Luta['placarA'];
    placarB?: Luta['placarB'];
    finalizacao?: boolean;
    desclassificacao?: boolean;
    desempateArbitro?: boolean;
  }): Chave => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    return registrarResultadoHandler(torneioId, data);
  });
}
