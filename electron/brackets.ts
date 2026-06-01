import { ipcMain, dialog, app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import type { Atleta } from '../src/types/athlete';
import type { Chave, Luta, StatusLuta, RodadaNome } from '../src/types/bracket';
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

function criarLuta(
  categoriaId: string,
  rodada: number,
  rodadaNome: RodadaNome,
  ordem: number,
  posicaoA: number | null,
  posicaoB: number | null,
  atletaAId: string | null,
  atletaBId: string | null,
  lutaAnteriorAId: string | null,
  lutaAnteriorBId: string | null,
): Luta {
  return {
    id: crypto.randomUUID(),
    categoriaId,
    rodada,
    rodadaNome,
    ordem,
    posicaoA,
    posicaoB,
    atletaAId,
    atletaBId,
    vencedorId: null,
    status: 'pending' as StatusLuta,
    lutaAnteriorAId,
    lutaAnteriorBId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function gerarLutasDois(categoriaId: string, posicoes: Atleta[]): Luta[] {
  return [
    criarLuta(categoriaId, 1, 'final', 1, 1, 2, posicoes[0].id, posicoes[1].id, null, null),
  ];
}

function gerarLutasTres(categoriaId: string, posicoes: Atleta[]): Luta[] {
  const l1 = criarLuta(categoriaId, 1, 'semi_final', 1, 2, 3, posicoes[1].id, posicoes[2].id, null, null);
  const l2 = criarLuta(categoriaId, 2, 'final', 1, 1, null, posicoes[0].id, null, null, l1.id);
  return [l1, l2];
}

function gerarLutasQuatro(categoriaId: string, posicoes: Atleta[]): Luta[] {
  const l1 = criarLuta(categoriaId, 1, 'semi_final', 1, 1, 4, posicoes[0].id, posicoes[3].id, null, null);
  const l2 = criarLuta(categoriaId, 1, 'semi_final', 2, 2, 3, posicoes[1].id, posicoes[2].id, null, null);
  const l3 = criarLuta(categoriaId, 2, 'final', 1, null, null, null, null, l1.id, l2.id);
  return [l1, l2, l3];
}

function gerarLutasCinco(categoriaId: string, posicoes: Atleta[]): Luta[] {
  const l1 = criarLuta(categoriaId, 1, 'quartas_de_final', 1, 4, 5, posicoes[3].id, posicoes[4].id, null, null);
  const l2 = criarLuta(categoriaId, 2, 'semi_final', 1, 1, null, posicoes[0].id, null, null, l1.id);
  const l3 = criarLuta(categoriaId, 2, 'semi_final', 2, 2, 3, posicoes[1].id, posicoes[2].id, null, null);
  const l4 = criarLuta(categoriaId, 3, 'final', 1, null, null, null, null, l2.id, l3.id);
  return [l1, l2, l3, l4];
}

function gerarLutas(categoriaId: string, posicoes: Atleta[]): Luta[] {
  switch (posicoes.length) {
    case 2: return gerarLutasDois(categoriaId, posicoes);
    case 3: return gerarLutasTres(categoriaId, posicoes);
    case 4: return gerarLutasQuatro(categoriaId, posicoes);
    case 5: return gerarLutasCinco(categoriaId, posicoes);
    default: throw new Error('Número inválido de atletas');
  }
}

function getTotalRodadas(qtd: number): number {
  if (qtd === 2) return 1;
  if (qtd <= 4) return 2;
  return 3;
}

const FAIXA_ORDER: Record<string, number> = {
  'branca': 0, 'cinza': 1, 'amarela': 2, 'laranja': 3,
  'verde': 4, 'azul': 5, 'roxa': 6, 'marrom': 7, 'preta': 8,
};

function gerarChave(categoriaId: string, atletas: Atleta[]): Chave {
  if (atletas.length < 2 || atletas.length > 5) {
    throw new Error('A categoria precisa ter entre 2 e 5 atletas para gerar uma chave.');
  }

  const posicoes = aplicarSeedSorting(atletas);
  const lutas = gerarLutas(categoriaId, posicoes);

  return {
    id: crypto.randomUUID(),
    categoriaId,
    lutas,
    posicoesAtletas: posicoes.map(a => a.id),
    arbitroId: null,
    totalAtletas: posicoes.length,
    totalRodadas: getTotalRodadas(posicoes.length),
    totalLutas: lutas.length,
    status: 'gerada',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

function gerarTodasChavesHandler(torneioId: string): Chave[] {
  const torneio = loadTorneio(torneioId);
  const atletas = torneio.atletas ?? [];

  const grupos = new Map<string, Atleta[]>();
  for (const a of atletas) {
    const g = grupos.get(a.categoria) ?? [];
    g.push(a);
    grupos.set(a.categoria, g);
  }

  const novasChaves: Chave[] = [];
  for (const [categoriaId, grupo] of grupos) {
    if (grupo.length >= 2 && grupo.length <= 5) {
      novasChaves.push(gerarChave(categoriaId, grupo));
    }
  }

  torneio.chaves = novasChaves;
  autoAtribuirArbitros(torneio);
  torneio.updatedAt = new Date().toISOString();
  saveTorneio(torneio);

  return novasChaves;
}

function atualizarLutaHandler(
  torneioId: string,
  data: { lutaId: string; vencedorId: string; status: StatusLuta }
): Chave {
  const torneio = loadTorneio(torneioId);
  const chaves = torneio.chaves ?? [];
  let chaveIndex = -1;
  let lutaIndex = -1;

  for (let ci = 0; ci < chaves.length; ci++) {
    const li = chaves[ci].lutas.findIndex(l => l.id === data.lutaId);
    if (li >= 0) {
      chaveIndex = ci;
      lutaIndex = li;
      break;
    }
  }

  if (chaveIndex < 0) throw new Error('Luta não encontrada');

  const chave = chaves[chaveIndex];
  const luta = chave.lutas[lutaIndex];

  luta.vencedorId = data.vencedorId;
  luta.status = data.status;
  luta.updatedAt = new Date().toISOString();

  if (data.status === 'completed' || data.status === 'wo') {
    const successor = chave.lutas.find(
      l => l.lutaAnteriorAId === data.lutaId || l.lutaAnteriorBId === data.lutaId
    );
    if (successor) {
      if (successor.lutaAnteriorAId === data.lutaId) {
        successor.atletaAId = data.vencedorId;
      } else if (successor.lutaAnteriorBId === data.lutaId) {
        successor.atletaBId = data.vencedorId;
      }
      successor.updatedAt = new Date().toISOString();
    }
  }

  const allCompleted = chave.lutas.every(l => l.status === 'completed' || l.status === 'wo');
  const anyInProgress = chave.lutas.some(l => l.status === 'in_progress');

  if (allCompleted) {
    chave.status = 'finalizada';
  } else if (anyInProgress) {
    chave.status = 'em_andamento';
  }

  chave.updatedAt = new Date().toISOString();
  chaves[chaveIndex] = chave;
  torneio.chaves = chaves;
  torneio.updatedAt = new Date().toISOString();
  saveTorneio(torneio);

  return chave;
}

function editarChaveHandler(
  torneioId: string,
  data: { chaveId: string; posicoesAtletas: string[] }
): Chave {
  const torneio = loadTorneio(torneioId);
  const chaves = torneio.chaves ?? [];
  const index = chaves.findIndex(c => c.id === data.chaveId);
  if (index < 0) throw new Error('Chave não encontrada');

  const chave = chaves[index];
  if (chave.status !== 'gerada') {
    throw new Error('Não é possível editar a chave após o início das lutas.');
  }

  const atletasIds = data.posicoesAtletas;
  const atletas = atletasIds
    .map(id => (torneio.atletas ?? []).find(a => a.id === id))
    .filter((a): a is Atleta => a !== undefined);

  if (atletas.length !== chave.totalAtletas) {
    throw new Error('Número de atletas não corresponde ao total da chave.');
  }

  chave.lutas = gerarLutas(chave.categoriaId, atletas);
  chave.posicoesAtletas = atletasIds;
  chave.updatedAt = new Date().toISOString();

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
  chave.updatedAt = new Date().toISOString();
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
  ipcMain.handle('gerar-todas-chaves', (): Chave[] => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    return gerarTodasChavesHandler(torneioId);
  });

  ipcMain.handle('gerar-chave', (_event, data: { categoriaId: string }): Chave => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    const torneio = loadTorneio(torneioId);
    const atletas = (torneio.atletas ?? []).filter(a => a.categoria === data.categoriaId);

    if (atletas.length < 2 || atletas.length > 5) {
      throw new Error('A categoria precisa ter entre 2 e 5 atletas para gerar uma chave.');
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

  ipcMain.handle('regenerar-chave', (_event, data: { categoriaId: string }): Chave => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    const torneio = loadTorneio(torneioId);
    const chaves = torneio.chaves ?? [];
    const existingIndex = chaves.findIndex(c => c.categoriaId === data.categoriaId);
    if (existingIndex < 0) throw new Error('Chave não encontrada para esta categoria.');
    if (chaves[existingIndex].status !== 'gerada') {
      throw new Error('Não é possível regenerar a chave pois já existem lutas em andamento ou concluídas.');
    }

    const atletas = (torneio.atletas ?? []).filter(a => a.categoria === data.categoriaId);
    if (atletas.length < 2 || atletas.length > 5) {
      throw new Error('A categoria precisa ter entre 2 e 5 atletas para gerar uma chave.');
    }

    const newChave = gerarChave(data.categoriaId, atletas);
    newChave.id = chaves[existingIndex].id;
    chaves[existingIndex] = newChave;
    torneio.chaves = chaves;
    torneio.updatedAt = new Date().toISOString();
    saveTorneio(torneio);
    return newChave;
  });

  ipcMain.handle('atualizar-luta', (_event, data: { lutaId: string; vencedorId: string; status: StatusLuta }): Chave => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    return atualizarLutaHandler(torneioId, data);
  });

  ipcMain.handle('editar-chave', (_event, data: { chaveId: string; posicoesAtletas: string[] }): Chave => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    return editarChaveHandler(torneioId, data);
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
