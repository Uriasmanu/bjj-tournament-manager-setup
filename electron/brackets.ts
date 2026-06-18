import { ipcMain, dialog, app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import type { Atleta } from '../src/types/athlete';
import type { Arbitro } from '../src/types/referee';
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

function sortAtletas(atletas: Atleta[]): Atleta[] {
  return [...atletas].sort((a, b) => {
    if (a.pesoKg !== b.pesoKg) return b.pesoKg - a.pesoKg;
    const idadeA = new Date().getFullYear() - a.anoNascimento;
    const idadeB = new Date().getFullYear() - b.anoNascimento;
    if (idadeA !== idadeB) return idadeB - idadeA;
    return a.nome.localeCompare(b.nome);
  });
}

function aplicarSeedSorting(atletas: Atleta[]): Atleta[] {
  const sorted = sortAtletas(atletas);

  const n = sorted.length;
  if (n <= 2) return sorted;

  const half = Math.ceil(n / 2);
  const sideA = Array.from({ length: half }, (_, i) => i);
  const sideB = Array.from({ length: n - half }, (_, i) => i + half);

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

function aplicarSeedSorting16(atletas: Atleta[]): Atleta[] {
  const sorted = sortAtletas(atletas);

  const sideA = sorted.slice(0, 8);
  const sideB = sorted.slice(8, 16);

  for (const side of [sideA, sideB]) {
    const seen = new Map<string, number[]>();
    side.forEach((a, idx) => {
      if (a.equipe) {
        const list = seen.get(a.equipe) ?? [];
        list.push(idx);
        seen.set(a.equipe, list);
      }
    });
    for (const [team, indices] of seen) {
      if (indices.length < 2) continue;
      const otherSide = side === sideA ? sideB : sideA;
      for (let i = 1; i < indices.length; i++) {
        const swapIdx = otherSide.findIndex(o => o.equipe !== team);
        if (swapIdx >= 0) {
          [side[indices[i]], otherSide[swapIdx]] = [otherSide[swapIdx], side[indices[i]]];
        }
      }
    }
  }

  return [...sideA, ...sideB];
}

const TBD = 'tbd';

function criarLuta(ordem: number, rodada: number, atletaAId: string, atletaBId: string): Luta {
  return { id: crypto.randomUUID(), ordem, rodada, atletaAId, atletaBId, status: 'pending', vencedorId: null, updatedAt: new Date().toISOString() };
}

function gerarLutasDois(posicoes: Atleta[]): Luta[] {
  return [criarLuta(1, 1, posicoes[0].id, posicoes[1].id)];
}

function gerarLutasTres(posicoes: Atleta[]): Luta[] {
  return [
    criarLuta(1, 1, posicoes[0].id, posicoes[1].id),
    criarLuta(2, 2, TBD, posicoes[2].id),
    criarLuta(3, 3, TBD, TBD),
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
  const luta3 = criarLuta(3, 1, posicoes[4].id, TBD);
  luta3.vencedorId = posicoes[4].id;
  luta3.status = 'wo';

  return [
    criarLuta(1, 1, posicoes[0].id, posicoes[1].id),
    criarLuta(2, 1, posicoes[2].id, posicoes[3].id),
    luta3,
    criarLuta(4, 2, TBD, posicoes[4].id),
    criarLuta(5, 2, TBD, TBD),
    criarLuta(6, 3, TBD, TBD),
  ];
}

function gerarLutasNove(posicoes: Atleta[]): Luta[] {
  const lutas: Luta[] = [];
  let ordem = 1;

  // Rodada 1: 6 lutas (3 reais + 3 BYEs nos índices 1,3,5)
  const l1 = criarLuta(ordem++, 1, posicoes[0].id, posicoes[1].id);

  const l2 = criarLuta(ordem++, 1, posicoes[2].id, TBD);
  l2.vencedorId = posicoes[2].id;
  l2.status = 'wo';

  const l3 = criarLuta(ordem++, 1, posicoes[3].id, posicoes[4].id);

  const l4 = criarLuta(ordem++, 1, posicoes[5].id, TBD);
  l4.vencedorId = posicoes[5].id;
  l4.status = 'wo';

  const l5 = criarLuta(ordem++, 1, posicoes[6].id, posicoes[7].id);

  const l6 = criarLuta(ordem++, 1, posicoes[8].id, TBD);
  l6.vencedorId = posicoes[8].id;
  l6.status = 'wo';

  lutas.push(l1, l2, l3, l4, l5, l6);

  // Rodada 2: 3 lutas — BYE winners já preenchidos no slot B
  const l7 = criarLuta(ordem++, 2, TBD, posicoes[2].id);
  const l8 = criarLuta(ordem++, 2, TBD, posicoes[5].id);
  const l9 = criarLuta(ordem++, 2, TBD, posicoes[8].id);

  lutas.push(l7, l8, l9);

  // Rodada 3: 2 lutas (1 real + 1 BYE)
  // L10: winner(L7) vs winner(L8)
  // L11: winner(L9) vs BYE (auto-advance para final)
  const l10 = criarLuta(ordem++, 3, TBD, TBD);
  const l11 = criarLuta(ordem++, 3, TBD, TBD);

  lutas.push(l10, l11);

  // Rodada 4: 1 luta (final)
  const l12 = criarLuta(ordem++, 4, TBD, TBD);
  lutas.push(l12);

  return lutas;
}

function gerarLutasOnze(posicoes: Atleta[]): Luta[] {
  const lutas: Luta[] = [];
  let ordem = 1;

  // Rodada 1: 8 lutas (3 reais + 5 BYEs)
  const l1 = criarLuta(ordem++, 1, posicoes[0].id, posicoes[1].id);
  const l2 = criarLuta(ordem++, 1, posicoes[2].id, posicoes[3].id);
  const l3 = criarLuta(ordem++, 1, posicoes[4].id, posicoes[5].id);

  const l4 = criarLuta(ordem++, 1, posicoes[6].id, TBD);
  l4.vencedorId = posicoes[6].id;
  l4.status = 'wo';

  const l5 = criarLuta(ordem++, 1, posicoes[7].id, TBD);
  l5.vencedorId = posicoes[7].id;
  l5.status = 'wo';

  const l6 = criarLuta(ordem++, 1, posicoes[8].id, TBD);
  l6.vencedorId = posicoes[8].id;
  l6.status = 'wo';

  const l7 = criarLuta(ordem++, 1, posicoes[9].id, TBD);
  l7.vencedorId = posicoes[9].id;
  l7.status = 'wo';

  const l8 = criarLuta(ordem++, 1, posicoes[10].id, TBD);
  l8.vencedorId = posicoes[10].id;
  l8.status = 'wo';

  lutas.push(l1, l2, l3, l4, l5, l6, l7, l8);

  // Rodada 2: 4 lutas (quartas)
  const l9 = criarLuta(ordem++, 2, TBD, TBD);
  const l10 = criarLuta(ordem++, 2, TBD, posicoes[6].id);
  const l11 = criarLuta(ordem++, 2, posicoes[7].id, posicoes[8].id);
  const l12 = criarLuta(ordem++, 2, posicoes[9].id, posicoes[10].id);

  lutas.push(l9, l10, l11, l12);

  // Rodada 3: 2 lutas (semifinais)
  const l13 = criarLuta(ordem++, 3, TBD, TBD);
  const l14 = criarLuta(ordem++, 3, TBD, TBD);

  lutas.push(l13, l14);

  // Rodada 4: 1 luta (final)
  const l15 = criarLuta(ordem++, 4, TBD, TBD);
  lutas.push(l15);

  return lutas;
}

function gerarLutasDoze(posicoes: Atleta[]): Luta[] {
  const lutas: Luta[] = [];
  let ordem = 1;

  // Rodada 1: 8 lutas (4 reais + 4 BYEs)
  const l1 = criarLuta(ordem++, 1, posicoes[0].id, posicoes[1].id);
  const l2 = criarLuta(ordem++, 1, posicoes[2].id, posicoes[3].id);
  const l3 = criarLuta(ordem++, 1, posicoes[4].id, posicoes[5].id);
  const l4 = criarLuta(ordem++, 1, posicoes[6].id, posicoes[7].id);

  const l5 = criarLuta(ordem++, 1, posicoes[8].id, TBD);
  l5.vencedorId = posicoes[8].id;
  l5.status = 'wo';

  const l6 = criarLuta(ordem++, 1, posicoes[9].id, TBD);
  l6.vencedorId = posicoes[9].id;
  l6.status = 'wo';

  const l7 = criarLuta(ordem++, 1, posicoes[10].id, TBD);
  l7.vencedorId = posicoes[10].id;
  l7.status = 'wo';

  const l8 = criarLuta(ordem++, 1, posicoes[11].id, TBD);
  l8.vencedorId = posicoes[11].id;
  l8.status = 'wo';

  lutas.push(l1, l2, l3, l4, l5, l6, l7, l8);

  // Rodada 2: 4 lutas (quartas — chave perfeita, sem BYEs)
  // L9 e L10 são lutas reais entre vencedores das lutas reais da R1
  const l9 = criarLuta(ordem++, 2, TBD, TBD);
  const l10 = criarLuta(ordem++, 2, TBD, TBD);
  // L11 e L12 pré-preenchidas com vencedores dos BYEs (L5-L8)
  const l11 = criarLuta(ordem++, 2, posicoes[8].id, posicoes[9].id);
  const l12 = criarLuta(ordem++, 2, posicoes[10].id, posicoes[11].id);

  lutas.push(l9, l10, l11, l12);

  // Rodada 3: 2 lutas (semifinais)
  const l13 = criarLuta(ordem++, 3, TBD, TBD);
  const l14 = criarLuta(ordem++, 3, TBD, TBD);

  lutas.push(l13, l14);

  // Rodada 4: 1 luta (final)
  const l15 = criarLuta(ordem++, 4, TBD, TBD);
  lutas.push(l15);

  return lutas;
}

function gerarLutasTreze(posicoes: Atleta[]): Luta[] {
  const lutas: Luta[] = [];
  let ordem = 1;

  // Rodada 1: 8 lutas (5 reais + 3 BYEs)
  const l1 = criarLuta(ordem++, 1, posicoes[0].id, posicoes[1].id);
  const l2 = criarLuta(ordem++, 1, posicoes[2].id, posicoes[3].id);
  const l3 = criarLuta(ordem++, 1, posicoes[4].id, posicoes[5].id);
  const l4 = criarLuta(ordem++, 1, posicoes[6].id, posicoes[7].id);
  const l5 = criarLuta(ordem++, 1, posicoes[8].id, posicoes[9].id);

  const l6 = criarLuta(ordem++, 1, posicoes[10].id, TBD);
  l6.vencedorId = posicoes[10].id;
  l6.status = 'wo';

  const l7 = criarLuta(ordem++, 1, posicoes[11].id, TBD);
  l7.vencedorId = posicoes[11].id;
  l7.status = 'wo';

  const l8 = criarLuta(ordem++, 1, posicoes[12].id, TBD);
  l8.vencedorId = posicoes[12].id;
  l8.status = 'wo';

  lutas.push(l1, l2, l3, l4, l5, l6, l7, l8);

  // Rodada 2: 4 lutas (quartas — chave perfeita)
  // L9 e L10 são lutas reais entre vencedores das lutas reais da R1
  const l9 = criarLuta(ordem++, 2, TBD, TBD);
  const l10 = criarLuta(ordem++, 2, TBD, TBD);
  // L11: vencedor(L5) × pos[10] (pré-preenchido)
  const l11 = criarLuta(ordem++, 2, TBD, posicoes[10].id);
  // L12: pos[11] × pos[12] (pré-preenchido)
  const l12 = criarLuta(ordem++, 2, posicoes[11].id, posicoes[12].id);

  lutas.push(l9, l10, l11, l12);

  // Rodada 3: 2 lutas (semifinais)
  const l13 = criarLuta(ordem++, 3, TBD, TBD);
  const l14 = criarLuta(ordem++, 3, TBD, TBD);

  lutas.push(l13, l14);

  // Rodada 4: 1 luta (final)
  const l15 = criarLuta(ordem++, 4, TBD, TBD);
  lutas.push(l15);

  return lutas;
}

function gerarLutasQuatorze(posicoes: Atleta[]): Luta[] {
  const lutas: Luta[] = [];
  let ordem = 1;

  // Rodada 1: 8 lutas (6 reais + 2 BYEs)
  const l1 = criarLuta(ordem++, 1, posicoes[0].id, posicoes[1].id);
  const l2 = criarLuta(ordem++, 1, posicoes[2].id, posicoes[3].id);
  const l3 = criarLuta(ordem++, 1, posicoes[4].id, posicoes[5].id);
  const l4 = criarLuta(ordem++, 1, posicoes[6].id, posicoes[7].id);
  const l5 = criarLuta(ordem++, 1, posicoes[8].id, posicoes[9].id);
  const l6 = criarLuta(ordem++, 1, posicoes[10].id, posicoes[11].id);

  const l7 = criarLuta(ordem++, 1, posicoes[12].id, TBD);
  l7.vencedorId = posicoes[12].id;
  l7.status = 'wo';

  const l8 = criarLuta(ordem++, 1, posicoes[13].id, TBD);
  l8.vencedorId = posicoes[13].id;
  l8.status = 'wo';

  lutas.push(l1, l2, l3, l4, l5, l6, l7, l8);

  // Rodada 2: 4 lutas (quartas — chave perfeita)
  // L9, L10 e L11 são lutas reais entre vencedores das lutas reais da R1
  const l9 = criarLuta(ordem++, 2, TBD, TBD);
  const l10 = criarLuta(ordem++, 2, TBD, TBD);
  const l11 = criarLuta(ordem++, 2, TBD, TBD);
  // L12: pos[12] × pos[13] (pré-preenchido — vencedores dos BYEs)
  const l12 = criarLuta(ordem++, 2, posicoes[12].id, posicoes[13].id);

  lutas.push(l9, l10, l11, l12);

  // Rodada 3: 2 lutas (semifinais)
  const l13 = criarLuta(ordem++, 3, TBD, TBD);
  const l14 = criarLuta(ordem++, 3, TBD, TBD);

  lutas.push(l13, l14);

  // Rodada 4: 1 luta (final)
  const l15 = criarLuta(ordem++, 4, TBD, TBD);
  lutas.push(l15);

  return lutas;
}

function gerarLutasQuinze(posicoes: Atleta[]): Luta[] {
  const lutas: Luta[] = [];
  let ordem = 1;

  // Rodada 1: 8 lutas (7 reais + 1 BYE)
  const l1 = criarLuta(ordem++, 1, posicoes[0].id, posicoes[1].id);
  const l2 = criarLuta(ordem++, 1, posicoes[2].id, posicoes[3].id);
  const l3 = criarLuta(ordem++, 1, posicoes[4].id, posicoes[5].id);
  const l4 = criarLuta(ordem++, 1, posicoes[6].id, posicoes[7].id);
  const l5 = criarLuta(ordem++, 1, posicoes[8].id, posicoes[9].id);
  const l6 = criarLuta(ordem++, 1, posicoes[10].id, posicoes[11].id);
  const l7 = criarLuta(ordem++, 1, posicoes[12].id, posicoes[13].id);

  const l8 = criarLuta(ordem++, 1, posicoes[14].id, TBD);
  l8.vencedorId = posicoes[14].id;
  l8.status = 'wo';

  lutas.push(l1, l2, l3, l4, l5, l6, l7, l8);

  // Rodada 2: 4 lutas (quartas — chave perfeita)
  // L9, L10 e L11 são lutas reais entre vencedores das lutas reais da R1
  const l9 = criarLuta(ordem++, 2, TBD, TBD);
  const l10 = criarLuta(ordem++, 2, TBD, TBD);
  const l11 = criarLuta(ordem++, 2, TBD, TBD);
  // L12: vencedor(L7) × pos[14] (pré-preenchido)
  const l12 = criarLuta(ordem++, 2, TBD, posicoes[14].id);

  lutas.push(l9, l10, l11, l12);

  // Rodada 3: 2 lutas (semifinais)
  const l13 = criarLuta(ordem++, 3, TBD, TBD);
  const l14 = criarLuta(ordem++, 3, TBD, TBD);

  lutas.push(l13, l14);

  // Rodada 4: 1 luta (final)
  const l15 = criarLuta(ordem++, 4, TBD, TBD);
  lutas.push(l15);

  return lutas;
}

function gerarLutasDez(posicoes: Atleta[]): Luta[] {
  const lutas: Luta[] = [];
  let ordem = 1;

  // Rodada 1: 6 lutas (4 reais + 2 BYEs)
  const l1 = criarLuta(ordem++, 1, posicoes[0].id, posicoes[1].id);
  const l2 = criarLuta(ordem++, 1, posicoes[2].id, posicoes[3].id);
  const l3 = criarLuta(ordem++, 1, posicoes[4].id, posicoes[5].id);
  const l4 = criarLuta(ordem++, 1, posicoes[6].id, posicoes[7].id);

  const l5 = criarLuta(ordem++, 1, posicoes[8].id, TBD);
  l5.vencedorId = posicoes[8].id;
  l5.status = 'wo';

  const l6 = criarLuta(ordem++, 1, posicoes[9].id, TBD);
  l6.vencedorId = posicoes[9].id;
  l6.status = 'wo';

  lutas.push(l1, l2, l3, l4, l5, l6);

  // Rodada 2: 4 lutas (2 reais + 2 BYEs)
  const l7 = criarLuta(ordem++, 2, TBD, TBD);
  const l8 = criarLuta(ordem++, 2, TBD, TBD);
  const l9 = criarLuta(ordem++, 2, TBD, TBD);
  const l10 = criarLuta(ordem++, 2, posicoes[8].id, posicoes[9].id);

  lutas.push(l7, l8, l9, l10);

  // Rodada 3: 2 lutas (semifinais)
  const l11 = criarLuta(ordem++, 3, TBD, TBD);
  const l12 = criarLuta(ordem++, 3, TBD, TBD);

  lutas.push(l11, l12);

  // Rodada 4: 1 luta (final)
  const l13 = criarLuta(ordem++, 4, TBD, TBD);
  lutas.push(l13);

  return lutas;
}

function gerarLutasSeis(posicoes: Atleta[]): Luta[] {
  const luta2 = criarLuta(2, 1, posicoes[2].id, TBD);
  luta2.vencedorId = posicoes[2].id;
  luta2.status = 'wo';

  const luta4 = criarLuta(4, 1, posicoes[5].id, TBD);
  luta4.vencedorId = posicoes[5].id;
  luta4.status = 'wo';

  const luta5 = criarLuta(5, 2, posicoes[2].id, TBD);
  const luta6 = criarLuta(6, 2, posicoes[5].id, TBD);

  const lutas = [
    criarLuta(1, 1, posicoes[0].id, posicoes[1].id),
    luta2,
    criarLuta(3, 1, posicoes[3].id, posicoes[4].id),
    luta4,
    luta5,
    luta6,
    criarLuta(7, 3, TBD, TBD),
  ];

  return lutas;
}

function getTotalRodadas(totalAtletas: number): number {
  if (totalAtletas <= 2) return 1;
  if (totalAtletas === 3) return 3;
  if (totalAtletas <= 4) return 2;
  return Math.ceil(Math.log2(totalAtletas));
}

function gerarLutasGeral(posicoes: Atleta[]): Luta[] {
  const n = posicoes.length;
  const numRodadas = Math.ceil(Math.log2(n));
  const lutas: Luta[] = [];
  let ordem = 1;

  const round1Entries: (string)[] = [];
  for (let i = 0; i < n; i += 2) {
    if (i + 1 < n) {
      const luta = criarLuta(ordem++, 1, posicoes[i].id, posicoes[i + 1].id);
      lutas.push(luta);
      round1Entries.push(luta.id);
    } else {
      const byeLuta = criarLuta(ordem++, 1, posicoes[i].id, TBD);
      byeLuta.vencedorId = posicoes[i].id;
      byeLuta.status = 'wo';
      lutas.push(byeLuta);
      round1Entries.push(posicoes[i].id);
    }
  }

  let currentEntries = round1Entries;
  let rodada = 2;
  while (rodada <= numRodadas) {
    const nextEntries: string[] = [];
    for (let i = 0; i < currentEntries.length; i += 2) {
      if (i + 1 < currentEntries.length) {
        const luta = criarLuta(ordem++, rodada, TBD, TBD);
        lutas.push(luta);
        nextEntries.push(luta.id);
      } else {
        nextEntries.push(currentEntries[i]);
      }
    }
    currentEntries = nextEntries;
    rodada++;
  }

  for (let r = 1; r < numRodadas; r++) {
    const currentRoundLutas = lutas.filter(l => l.rodada === r);
    const nextRoundLutas = lutas.filter(l => l.rodada === r + 1);
    if (nextRoundLutas.length === 0) continue;

    const fightsPerNextMatch = currentRoundLutas.length / nextRoundLutas.length;
    if (!Number.isInteger(fightsPerNextMatch)) continue;

    for (let i = 0; i < currentRoundLutas.length; i++) {
      const luta = currentRoundLutas[i];
      if (luta.status !== 'wo' || !luta.vencedorId) continue;

      const nextMatchIndex = Math.floor(i / fightsPerNextMatch);
      const slotInNextMatch = i % fightsPerNextMatch;

      if (nextMatchIndex >= nextRoundLutas.length) continue;
      const nextLuta = nextRoundLutas[nextMatchIndex];

      if (slotInNextMatch === 0 && (nextLuta.atletaAId === 'tbd' || nextLuta.atletaAId === '')) {
        nextLuta.atletaAId = luta.vencedorId;
      } else if (slotInNextMatch === 1 && (nextLuta.atletaBId === 'tbd' || nextLuta.atletaBId === '')) {
        nextLuta.atletaBId = luta.vencedorId;
      }
    }
  }

  return lutas;
}

function gerarLutas16(posicoes: Atleta[]): Luta[] {
  const lutas: Luta[] = [];
  let ordem = 1;

  for (let i = 0; i < 8; i++) {
    lutas.push(criarLuta(ordem++, 1, posicoes[i * 2].id, posicoes[i * 2 + 1].id));
  }
  for (let i = 0; i < 4; i++) {
    lutas.push(criarLuta(ordem++, 2, TBD, TBD));
  }
  for (let i = 0; i < 2; i++) {
    lutas.push(criarLuta(ordem++, 3, TBD, TBD));
  }
  lutas.push(criarLuta(ordem++, 4, TBD, TBD));

  return lutas;
}

function gerarLutas(posicoes: Atleta[]): Luta[] {
  switch (posicoes.length) {
    case 2: return gerarLutasDois(posicoes);
    case 3: return gerarLutasTres(posicoes);
    case 4: return gerarLutasQuatro(posicoes);
    case 5: return gerarLutasCinco(posicoes);
    case 6: return gerarLutasSeis(posicoes);
    case 9: return gerarLutasNove(posicoes);
    case 10: return gerarLutasDez(posicoes);
    case 11: return gerarLutasOnze(posicoes);
    case 12: return gerarLutasDoze(posicoes);
    case 13: return gerarLutasTreze(posicoes);
    case 14: return gerarLutasQuatorze(posicoes);
    case 15: return gerarLutasQuinze(posicoes);
    case 16: return gerarLutas16(posicoes);
    default:
      if (posicoes.length >= 7 && posicoes.length <= 15) return gerarLutasGeral(posicoes);
      throw new Error('Número inválido de atletas');
  }
}

const FAIXA_ORDER: Record<string, number> = {
  'branca': 0, 'cinza': 1, 'amarela': 2, 'laranja': 3,
  'verde': 4, 'azul': 5, 'roxa': 6, 'marrom': 7, 'preta': 8,
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gerarChave(categoriaId: string, atletas: Atleta[], faixa?: string): Chave {
  if (atletas.length < 2 || atletas.length > 16) {
    throw new Error('A categoria precisa ter entre 2 e 16 atletas para gerar uma chave.');
  }

  const embaralhados = shuffleArray(atletas);
  const posicoes = embaralhados.length === 16 ? aplicarSeedSorting16(embaralhados) : aplicarSeedSorting(embaralhados);
  const lutas = gerarLutas(posicoes);

  return {
    id: crypto.randomUUID(),
    categoriaId,
    faixa,
    lutas,
    posicoesAtletas: posicoes.map(a => a.id),
    arbitroId: null,
    totalAtletas: posicoes.length,
    totalLutas: lutas.length,
    totalRodadas: getTotalRodadas(posicoes.length),
    status: 'gerada',
    updatedAt: new Date().toISOString(),
  };
}

function autoAtribuirArbitros(torneio: Torneio): void {
  const chaves = torneio.chaves ?? [];
  const arbitros = (torneio.arbitros ?? []).filter((r: Arbitro) => r.deletedAt == null);
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

function splitGrupo(grupo: Atleta[], maxPorChave: number): Atleta[][] {
  const n = grupo.length;
  if (n <= maxPorChave && n >= 2) return [grupo];

  const subgrupos: Atleta[][] = [];
  let idx = 0;

  while (idx < n) {
    const remaining = n - idx;
    if (remaining <= maxPorChave) {
      subgrupos.push(grupo.slice(idx));
      idx = n;
    } else {
      subgrupos.push(grupo.slice(idx, idx + maxPorChave));
      idx += maxPorChave;
    }
  }

  const last = subgrupos[subgrupos.length - 1];
  if (last && last.length === 1 && subgrupos.length > 1) {
    const prev = subgrupos[subgrupos.length - 2];
    const migrated = prev.pop()!;
    last.unshift(migrated);
  }

  return subgrupos;
}

interface GerarTodasResult {
  chaves: Chave[];
  metadados: { categoriaId: string; totalAtletas: number; chavesGeradas: number; atletasIgnorados: string[] }[];
  atletasSemChave: Atleta[];
}

function gerarTodasChavesHandler(torneioId: string, maxPorChave: number = 16, faixas?: string[], categorias?: string[]): GerarTodasResult {
  const torneio = loadTorneio(torneioId);
  let atletas = (torneio.atletas ?? []).filter((a: Atleta) => a.deletedAt == null);

  if (faixas && faixas.length > 0) {
    atletas = atletas.filter(a => faixas.includes(a.faixa));
  }
  if (categorias && categorias.length > 0) {
    atletas = atletas.filter(a => categorias.includes(a.categoria));
  }

  torneio.chaves = [];

  const atletasIgnorados: string[] = [];
  const grupos = new Map<string, Atleta[]>();
  for (const a of atletas) {
    if (!a.categoria) {
      atletasIgnorados.push(a.nome);
      continue;
    }
    const key = a.categoria;
    const g = grupos.get(key) ?? [];
    g.push(a);
    grupos.set(key, g);
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

    const subgrupos = splitGrupo(grupo, maxPorChave);

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

  const sideA: number[] = n === 4 ? [0, 3] : n === 5 ? [0, 1, 2] : n === 6 ? [0, 1, 2] : n === 9 ? [0, 1, 2, 3, 4] : n === 10 ? [0, 1, 2, 3, 4] : n === 11 ? [0, 1, 2, 3, 4, 5] : n === 12 ? [0, 1, 2, 3, 4, 5] : n === 13 ? [0, 1, 2, 3, 4, 5] : n === 14 ? [0, 1, 2, 3, 4, 5] : n === 15 ? [0, 1, 2, 3, 4, 5, 6] : [0, 1];
  const sideB: number[] = n === 4 ? [1, 2] : n === 5 ? [3, 4] : n === 6 ? [3, 4, 5] : n === 9 ? [5, 6, 7, 8] : n === 10 ? [5, 6, 7, 8, 9] : n === 11 ? [6, 7, 8, 9, 10] : n === 12 ? [6, 7, 8, 9, 10, 11] : n === 13 ? [6, 7, 8, 9, 10, 11, 12] : n === 14 ? [6, 7, 8, 9, 10, 11, 12, 13] : n === 15 ? [7, 8, 9, 10, 11, 12, 13, 14] : [2, 3, 4];

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

  if (atletas.length === 16) {
    const sorted = aplicarSeedSorting16(atletas);
    chave.posicoesAtletas = sorted.map(a => a.id);
  } else {
    separarEquipes(atletas);
    chave.posicoesAtletas = atletas.map(a => a.id);
  }
  chave.lutas = gerarLutas(atletas);
  chave.updatedAt = new Date().toISOString();

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
    if (newArbitro.deletedAt != null) throw new Error('Árbitro deletado não pode ser atribuído a uma chave.');
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

  const torneio = loadTorneio(torneioId);
  const now = new Date().toISOString();
  const chaves: Chave[] = (incoming as Record<string, unknown>[]).map((c) => {
    if (!c.categoriaId || !Array.isArray(c.lutas)) {
      throw new Error('Estrutura de chave inválida no arquivo.');
    }
    const lutas = (c.lutas as Record<string, unknown>[]).map(l => ({
      ...l,
      updatedAt: (l.updatedAt as string) ?? now,
    }));
    return {
      ...c,
      id: (c.id as string) || crypto.randomUUID(),
      lutas,
      updatedAt: (c.updatedAt as string) ?? now,
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
    desclassificadoId: (luta.desclassificadoId as string | undefined) ?? undefined,
    desempateArbitro: (luta.desempateArbitro as boolean) ?? undefined,
    horarioInicio: (luta.horarioInicio as string | undefined) ?? undefined,
    horarioTermino: (luta.horarioTermino as string | undefined) ?? undefined,
    updatedAt: (luta.updatedAt as string) ?? new Date().toISOString(),
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
    updatedAt: (chave.updatedAt as string) ?? new Date().toISOString(),
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
      l.updatedAt = new Date().toISOString();
      clearWinnerFromLaterRounds(chave, l.rodada, atletaId);
    }
    if (l.atletaBId === atletaId) {
      l.atletaBId = 'tbd';
      l.vencedorId = null;
      if (l.status === 'completed' || l.status === 'wo') l.status = 'pending';
      l.updatedAt = new Date().toISOString();
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

    const fightsPerNextMatch = currentRoundLutas.length / nextRoundLutas.length;
    const nextMatchIndex = Math.floor(matchIndex / fightsPerNextMatch);
    if (nextMatchIndex >= nextRoundLutas.length) return;

    const nextLuta = nextRoundLutas[nextMatchIndex];
    const slotInNextMatch = Math.floor(matchIndex % fightsPerNextMatch);

    if (slotInNextMatch === 0 && (nextLuta.atletaAId === 'tbd' || nextLuta.atletaAId === '')) {
      nextLuta.atletaAId = luta.vencedorId!;
      return;
    }
    if (slotInNextMatch === 1 && (nextLuta.atletaBId === 'tbd' || nextLuta.atletaBId === '')) {
      nextLuta.atletaBId = luta.vencedorId!;
      return;
    }

    targetRodada++;
  }
}

function advanceWinner5(chave: Chave, luta: Luta): void {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;

  if (luta.ordem === 1) {
    const luta5 = chave.lutas.find(l => l.ordem === 5);
    if (luta5) {
      luta5.atletaAId = winnerId;
      luta5.vencedorId = winnerId;
      luta5.status = 'wo';
    }
    const luta6 = chave.lutas.find(l => l.ordem === 6);
    if (luta6) {
      luta6.atletaBId = winnerId;
    }
  } else if (luta.ordem === 2) {
    const luta4 = chave.lutas.find(l => l.ordem === 4);
    if (luta4) {
      luta4.atletaAId = winnerId;
    }
  } else if (luta.ordem === 3) {
    const luta4 = chave.lutas.find(l => l.ordem === 4);
    if (luta4) {
      luta4.atletaBId = winnerId;
    }
  } else if (luta.ordem === 4) {
    const luta6 = chave.lutas.find(l => l.ordem === 6);
    if (luta6) {
      luta6.atletaAId = winnerId;
    }
  }
}

function advanceWinner6(chave: Chave, luta: Luta): void {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;

  const hasLuta4 = chave.lutas.some(l => l.ordem === 4 && l.rodada === 1);

  if (!hasLuta4) {
    if (luta.ordem === 1) {
      const r2lutas = chave.lutas.filter(l => l.rodada === 2);
      if (r2lutas[0]) r2lutas[0].atletaAId = winnerId;
    } else if (luta.ordem === 2) {
      const r2lutas = chave.lutas.filter(l => l.rodada === 2);
      if (r2lutas[0]) r2lutas[0].atletaBId = winnerId;
    } else if (luta.ordem === 3) {
      const r2lutas = chave.lutas.filter(l => l.rodada === 2);
      if (r2lutas[1]) r2lutas[1].atletaAId = winnerId;
    } else if (luta.rodada === 2) {
      const r3luta = chave.lutas.find(l => l.rodada === 3);
      const r2lutas = chave.lutas.filter(l => l.rodada === 2);
      const matchIndex = r2lutas.indexOf(luta);
      if (r3luta && matchIndex === 0) r3luta.atletaAId = winnerId;
      if (r3luta && matchIndex === 1) r3luta.atletaBId = winnerId;
    }
    return;
  }

  if (luta.ordem === 1) {
    const luta5 = chave.lutas.find(l => l.ordem === 5);
    if (luta5) luta5.atletaBId = winnerId;
  } else if (luta.ordem === 2) {
    // BYE — already processed at generation, do nothing
  } else if (luta.ordem === 3) {
    const luta6 = chave.lutas.find(l => l.ordem === 6);
    if (luta6) luta6.atletaBId = winnerId;
  } else if (luta.ordem === 4) {
    // BYE — already processed at generation, do nothing
  } else if (luta.ordem === 5) {
    const luta7 = chave.lutas.find(l => l.ordem === 7);
    if (luta7) luta7.atletaAId = winnerId;
  } else if (luta.ordem === 6) {
    const luta7 = chave.lutas.find(l => l.ordem === 7);
    if (luta7) luta7.atletaBId = winnerId;
  }

}

function advanceWinner9(chave: Chave, luta: Luta): void {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;

  const l7 = chave.lutas.find(l => l.ordem === 7);
  const l8 = chave.lutas.find(l => l.ordem === 8);
  const l9 = chave.lutas.find(l => l.ordem === 9);
  const l10 = chave.lutas.find(l => l.ordem === 10);
  const l11 = chave.lutas.find(l => l.ordem === 11);
  const l12 = chave.lutas.find(l => l.ordem === 12);

  if (luta.ordem === 1) {
    if (l7) l7.atletaAId = winnerId;
  } else if (luta.ordem === 2) {
    // BYE — already set by generation
    if (l7) l7.atletaBId = winnerId;
  } else if (luta.ordem === 3) {
    if (l8) l8.atletaAId = winnerId;
  } else if (luta.ordem === 4) {
    // BYE — already set by generation
    if (l8) l8.atletaBId = winnerId;
  } else if (luta.ordem === 5) {
    if (l9) l9.atletaAId = winnerId;
  } else if (luta.ordem === 6) {
    // BYE — already set by generation
    if (l9) l9.atletaBId = winnerId;
  } else if (luta.ordem === 7) {
    if (l10) l10.atletaAId = winnerId;
  } else if (luta.ordem === 8) {
    if (l10) l10.atletaBId = winnerId;
  } else if (luta.ordem === 9) {
    // Winner of L9 goes diretamente to L11 (BYE) and then to Final
    if (l11) {
      l11.atletaAId = winnerId;
      l11.vencedorId = winnerId;
      l11.status = 'wo';
    }
    if (l12) {
      l12.atletaBId = winnerId;
    }
  } else if (luta.ordem === 10) {
    if (l12) l12.atletaAId = winnerId;
  }
}

function advanceWinner10(chave: Chave, luta: Luta): void {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;

  const l7 = chave.lutas.find(l => l.ordem === 7);
  const l8 = chave.lutas.find(l => l.ordem === 8);
  const l9 = chave.lutas.find(l => l.ordem === 9);
  const l10 = chave.lutas.find(l => l.ordem === 10);
  const l11 = chave.lutas.find(l => l.ordem === 11);
  const l12 = chave.lutas.find(l => l.ordem === 12);
  const l13 = chave.lutas.find(l => l.ordem === 13);

  if (luta.ordem === 1) {
    if (l7) l7.atletaAId = winnerId;
  } else if (luta.ordem === 2) {
    if (l7) l7.atletaBId = winnerId;
  } else if (luta.ordem === 3) {
    if (l8) {
      l8.atletaAId = winnerId;
      l8.vencedorId = winnerId;
      l8.status = 'wo';
    }
    if (l11) l11.atletaBId = winnerId;
  } else if (luta.ordem === 4) {
    if (l9) {
      l9.atletaAId = winnerId;
      l9.vencedorId = winnerId;
      l9.status = 'wo';
    }
    if (l12) l12.atletaAId = winnerId;
  } else if (luta.ordem === 5) {
    if (l10) l10.atletaAId = winnerId;
  } else if (luta.ordem === 6) {
    if (l10) l10.atletaBId = winnerId;
  } else if (luta.ordem === 7) {
    if (l11) l11.atletaAId = winnerId;
  } else if (luta.ordem === 10) {
    if (l12) l12.atletaBId = winnerId;
  } else if (luta.ordem === 11) {
    if (l13) l13.atletaAId = winnerId;
  } else if (luta.ordem === 12) {
    if (l13) l13.atletaBId = winnerId;
  }
}

function advanceWinner11(chave: Chave, luta: Luta): void {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;

  const l9 = chave.lutas.find(l => l.ordem === 9);
  const l10 = chave.lutas.find(l => l.ordem === 10);
  const l13 = chave.lutas.find(l => l.ordem === 13);
  const l14 = chave.lutas.find(l => l.ordem === 14);
  const l15 = chave.lutas.find(l => l.ordem === 15);

  if (luta.ordem === 1) {
    if (l9) l9.atletaAId = winnerId;
  } else if (luta.ordem === 2) {
    if (l9) l9.atletaBId = winnerId;
  } else if (luta.ordem === 3) {
    if (l10) l10.atletaAId = winnerId;
  } else if (luta.ordem >= 4 && luta.ordem <= 8) {
    // BYE — already set at generation
  } else if (luta.ordem === 9) {
    if (l13) l13.atletaAId = winnerId;
  } else if (luta.ordem === 10) {
    if (l13) l13.atletaBId = winnerId;
  } else if (luta.ordem === 11) {
    if (l14) l14.atletaAId = winnerId;
  } else if (luta.ordem === 12) {
    if (l14) l14.atletaBId = winnerId;
  } else if (luta.ordem === 13) {
    if (l15) l15.atletaAId = winnerId;
  } else if (luta.ordem === 14) {
    if (l15) l15.atletaBId = winnerId;
  }
}

function advanceWinner12(chave: Chave, luta: Luta): void {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;

  const l9 = chave.lutas.find(l => l.ordem === 9);
  const l10 = chave.lutas.find(l => l.ordem === 10);
  const l13 = chave.lutas.find(l => l.ordem === 13);
  const l14 = chave.lutas.find(l => l.ordem === 14);
  const l15 = chave.lutas.find(l => l.ordem === 15);

  if (luta.ordem === 1) {
    if (l9) l9.atletaAId = winnerId;
  } else if (luta.ordem === 2) {
    if (l9) l9.atletaBId = winnerId;
  } else if (luta.ordem === 3) {
    if (l10) l10.atletaAId = winnerId;
  } else if (luta.ordem === 4) {
    if (l10) l10.atletaBId = winnerId;
  } else if (luta.ordem >= 5 && luta.ordem <= 8) {
    // BYE — already set at generation
  } else if (luta.ordem === 9) {
    if (l13) l13.atletaAId = winnerId;
  } else if (luta.ordem === 10) {
    if (l13) l13.atletaBId = winnerId;
  } else if (luta.ordem === 11) {
    // L11 é luta real entre vencedores de BYEs (L5 × L6)
    if (l14) l14.atletaAId = winnerId;
  } else if (luta.ordem === 12) {
    // L12 é luta real entre vencedores de BYEs (L7 × L8)
    if (l14) l14.atletaBId = winnerId;
  } else if (luta.ordem === 13) {
    if (l15) l15.atletaAId = winnerId;
  } else if (luta.ordem === 14) {
    if (l15) l15.atletaBId = winnerId;
  }
}

function advanceWinner13(chave: Chave, luta: Luta): void {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;

  const l9 = chave.lutas.find(l => l.ordem === 9);
  const l10 = chave.lutas.find(l => l.ordem === 10);
  const l11 = chave.lutas.find(l => l.ordem === 11);
  const l13 = chave.lutas.find(l => l.ordem === 13);
  const l14 = chave.lutas.find(l => l.ordem === 14);
  const l15 = chave.lutas.find(l => l.ordem === 15);

  if (luta.ordem === 1) {
    if (l9) l9.atletaAId = winnerId;
  } else if (luta.ordem === 2) {
    if (l9) l9.atletaBId = winnerId;
  } else if (luta.ordem === 3) {
    if (l10) l10.atletaAId = winnerId;
  } else if (luta.ordem === 4) {
    if (l10) l10.atletaBId = winnerId;
  } else if (luta.ordem === 5) {
    // L5: vencedor vai para L11.atletaAId
    if (l11) l11.atletaAId = winnerId;
  } else if (luta.ordem >= 6 && luta.ordem <= 8) {
    // BYE — already set at generation
  } else if (luta.ordem === 9) {
    if (l13) l13.atletaAId = winnerId;
  } else if (luta.ordem === 10) {
    if (l13) l13.atletaBId = winnerId;
  } else if (luta.ordem === 11) {
    if (l14) l14.atletaAId = winnerId;
  } else if (luta.ordem === 12) {
    if (l14) l14.atletaBId = winnerId;
  } else if (luta.ordem === 13) {
    if (l15) l15.atletaAId = winnerId;
  } else if (luta.ordem === 14) {
    if (l15) l15.atletaBId = winnerId;
  }
}

function advanceWinner14(chave: Chave, luta: Luta): void {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;

  const l9 = chave.lutas.find(l => l.ordem === 9);
  const l10 = chave.lutas.find(l => l.ordem === 10);
  const l11 = chave.lutas.find(l => l.ordem === 11);
  const l13 = chave.lutas.find(l => l.ordem === 13);
  const l14 = chave.lutas.find(l => l.ordem === 14);
  const l15 = chave.lutas.find(l => l.ordem === 15);

  if (luta.ordem === 1) {
    if (l9) l9.atletaAId = winnerId;
  } else if (luta.ordem === 2) {
    if (l9) l9.atletaBId = winnerId;
  } else if (luta.ordem === 3) {
    if (l10) l10.atletaAId = winnerId;
  } else if (luta.ordem === 4) {
    if (l10) l10.atletaBId = winnerId;
  } else if (luta.ordem === 5) {
    if (l11) l11.atletaAId = winnerId;
  } else if (luta.ordem === 6) {
    if (l11) l11.atletaBId = winnerId;
  } else if (luta.ordem >= 7 && luta.ordem <= 8) {
    // BYE — already set at generation
  } else if (luta.ordem === 9) {
    if (l13) l13.atletaAId = winnerId;
  } else if (luta.ordem === 10) {
    if (l13) l13.atletaBId = winnerId;
  } else if (luta.ordem === 11) {
    if (l14) l14.atletaAId = winnerId;
  } else if (luta.ordem === 12) {
    if (l14) l14.atletaBId = winnerId;
  } else if (luta.ordem === 13) {
    if (l15) l15.atletaAId = winnerId;
  } else if (luta.ordem === 14) {
    if (l15) l15.atletaBId = winnerId;
  }
}

function advanceWinner15(chave: Chave, luta: Luta): void {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;

  const l9 = chave.lutas.find(l => l.ordem === 9);
  const l10 = chave.lutas.find(l => l.ordem === 10);
  const l11 = chave.lutas.find(l => l.ordem === 11);
  const l12 = chave.lutas.find(l => l.ordem === 12);
  const l13 = chave.lutas.find(l => l.ordem === 13);
  const l14 = chave.lutas.find(l => l.ordem === 14);
  const l15 = chave.lutas.find(l => l.ordem === 15);

  if (luta.ordem === 1) {
    if (l9) l9.atletaAId = winnerId;
  } else if (luta.ordem === 2) {
    if (l9) l9.atletaBId = winnerId;
  } else if (luta.ordem === 3) {
    if (l10) l10.atletaAId = winnerId;
  } else if (luta.ordem === 4) {
    if (l10) l10.atletaBId = winnerId;
  } else if (luta.ordem === 5) {
    if (l11) l11.atletaAId = winnerId;
  } else if (luta.ordem === 6) {
    if (l11) l11.atletaBId = winnerId;
  } else if (luta.ordem === 7) {
    // L7: vencedor vai para L12.atletaAId
    if (l12) l12.atletaAId = winnerId;
  } else if (luta.ordem === 8) {
    // BYE — already set at generation
  } else if (luta.ordem === 9) {
    if (l13) l13.atletaAId = winnerId;
  } else if (luta.ordem === 10) {
    if (l13) l13.atletaBId = winnerId;
  } else if (luta.ordem === 11) {
    if (l14) l14.atletaAId = winnerId;
  } else if (luta.ordem === 12) {
    if (l14) l14.atletaBId = winnerId;
  } else if (luta.ordem === 13) {
    if (l15) l15.atletaAId = winnerId;
  } else if (luta.ordem === 14) {
    if (l15) l15.atletaBId = winnerId;
  }
}

function advanceWinner16(chave: Chave, luta: Luta): void {
  const winnerId = luta.vencedorId;
  if (!winnerId) return;

  const lutaIndex = chave.lutas.indexOf(luta);
  if (lutaIndex < 0) return;

  if (luta.rodada === 1) {
    const r2Index = 8 + Math.floor(lutaIndex / 2);
    const isFirst = lutaIndex % 2 === 0;
    const r2Luta = chave.lutas[r2Index];
    if (r2Luta) {
      if (isFirst) r2Luta.atletaAId = winnerId;
      else r2Luta.atletaBId = winnerId;
    }
  } else if (luta.rodada === 2) {
    const adjIdx = lutaIndex - 8;
    const r3Index = 12 + Math.floor(adjIdx / 2);
    const isFirst = adjIdx % 2 === 0;
    const r3Luta = chave.lutas[r3Index];
    if (r3Luta) {
      if (isFirst) r3Luta.atletaAId = winnerId;
      else r3Luta.atletaBId = winnerId;
    }
  } else if (luta.rodada === 3) {
    const r4Luta = chave.lutas[14];
    if (r4Luta) {
      const isFirst = (lutaIndex - 12) === 0;
      if (isFirst) r4Luta.atletaAId = winnerId;
      else r4Luta.atletaBId = winnerId;
    }
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
    horarioInicio?: string;
    horarioTermino?: string;
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
  luta.horarioInicio = data.horarioInicio ?? luta.horarioInicio;
  luta.horarioTermino = data.horarioTermino ?? luta.horarioTermino;
  luta.updatedAt = new Date().toISOString();

  // Compute which athlete was disqualified (the one who is NOT the winner)
  if (data.desclassificacao && luta.vencedorId) {
    luta.desclassificadoId = luta.atletaAId === luta.vencedorId ? luta.atletaBId : luta.atletaAId;
  } else {
    luta.desclassificadoId = undefined;
  }

  if (chave.totalAtletas === 3) {
    const r2 = chave.lutas.find(l => l.rodada === 2);
    const r3 = chave.lutas.find(l => l.rodada === 3);

    if (luta.rodada === 1) {
      const loserId = luta.vencedorId === luta.atletaAId ? luta.atletaBId : luta.atletaAId;

      if (data.desclassificacao) {
        // DQ: eliminated athlete does NOT advance; bye athlete goes directly to final
        if (r2 && r3) {
          r2.atletaAId = r2.atletaBId;
          r2.vencedorId = r2.atletaBId;
          r2.status = 'wo';
          r3.atletaAId = luta.vencedorId;
          r3.atletaBId = r2.atletaBId;
          r3.vencedorId = null;
          r3.status = 'pending';
        }
      } else {
        if (r2) {
          r2.atletaAId = loserId;
          r2.vencedorId = null;
          r2.status = 'pending';
        }
        if (r3) {
          r3.atletaAId = luta.vencedorId;
          r3.atletaBId = 'tbd';
          r3.vencedorId = null;
          r3.status = 'pending';
        }
      }
    } else if (luta.rodada === 2) {
      if (r3 && r3.atletaBId === 'tbd') {
        r3.atletaBId = luta.vencedorId;
        r3.status = 'pending';
      }
    }
  } else if (chave.totalAtletas === 5) {
    advanceWinner5(chave, luta);
  } else if (chave.totalAtletas === 6) {
    advanceWinner6(chave, luta);
  } else if (chave.totalAtletas === 9) {
    advanceWinner9(chave, luta);
  } else if (chave.totalAtletas === 10) {
    advanceWinner10(chave, luta);
  } else if (chave.totalAtletas === 11) {
    advanceWinner11(chave, luta);
  } else if (chave.totalAtletas === 12) {
    advanceWinner12(chave, luta);
  } else if (chave.totalAtletas === 13) {
    advanceWinner13(chave, luta);
  } else if (chave.totalAtletas === 14) {
    advanceWinner14(chave, luta);
  } else if (chave.totalAtletas === 15) {
    advanceWinner15(chave, luta);
  } else if (chave.totalAtletas === 16) {
    advanceWinner16(chave, luta);
  } else {
    advanceWinnerInChave(chave, luta);
  }

  const now = new Date().toISOString();
  for (const l of chave.lutas) {
    l.updatedAt = now;
  }
  chave.updatedAt = now;
  chaves[chaveIndex] = chave;
  torneio.chaves = chaves;
  torneio.updatedAt = now;
  saveTorneio(torneio);

  return chave;
}

export function registerBracketHandlers(): void {
  ipcMain.handle('gerar-todas-chaves', (_event, maxPorChave?: number, faixas?: string[], categorias?: string[]): GerarTodasResult => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    const max = (maxPorChave && maxPorChave >= 2 && maxPorChave <= 16) ? maxPorChave : 16;
    return gerarTodasChavesHandler(torneioId, max, faixas, categorias);
  });

  ipcMain.handle('gerar-chave', (_event, data: { categoriaId: string; faixa?: string; atletaIds?: string[]; nome?: string }): Chave => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    const torneio = loadTorneio(torneioId);

    let atletas: Atleta[];
    let isManual = false;

    if (data.atletaIds && data.atletaIds.length > 0) {
      // Manual key: use provided athlete IDs directly
      isManual = true;
      atletas = (torneio.atletas ?? []).filter((a: Atleta) =>
        a.deletedAt == null && data.atletaIds!.includes(a.id)
      );
      if (atletas.length !== data.atletaIds.length) {
        throw new Error('Um ou mais atletas selecionados não foram encontrados.');
      }
      // Check athletes are not already in another key
      const chavesExistentes = torneio.chaves ?? [];
      const emChaveIds = new Set<string>();
      for (const c of chavesExistentes) {
        for (const id of c.posicoesAtletas) {
          emChaveIds.add(id);
        }
      }
      const duplicados = atletas.filter(a => emChaveIds.has(a.id));
      if (duplicados.length > 0) {
        throw new Error(`Atleta(s) já em outra chave: ${duplicados.map(a => a.nome).join(', ')}`);
      }
    } else {
      // Automatic key: filter by category/faixa
      atletas = (torneio.atletas ?? []).filter((a: Atleta) =>
        a.deletedAt == null && a.categoria === data.categoriaId && (!data.faixa || a.faixa === data.faixa)
      );
    }

    if (atletas.length < 2 || atletas.length > 16) {
      throw new Error('A chave precisa ter entre 2 e 16 atletas.');
    }

    const chaves = torneio.chaves ?? [];
    if (!isManual) {
      if (chaves.some(c => c.categoriaId === data.categoriaId && (!data.faixa || c.faixa === data.faixa))) {
        throw new Error('Chave já existe para esta categoria/faixa.');
      }
    }

    const categoriaId = isManual ? 'manual' : data.categoriaId;
    const chave = gerarChave(categoriaId, atletas, data.faixa);
    if (isManual && data.nome) {
      chave.nome = data.nome;
    }
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
    const chaves = (loadTorneio(torneioId).chaves ?? []).map(c => normalizeChave(c as unknown as Record<string, unknown>));
    return chaves;
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

  ipcMain.handle('delete-chave', (_event, chaveId: string): void => {
    const torneioId = getActiveTournamentId();
    if (!torneioId) throw new Error('Nenhum torneio ativo');
    const torneio = loadTorneio(torneioId);
    const chaves = torneio.chaves ?? [];
    const idx = chaves.findIndex(c => c.id === chaveId);
    if (idx === -1) throw new Error('Chave não encontrada');
    const chave = chaves[idx];
    // Remove emChave flag from athletes in this key
    const athleteIds = new Set(chave.posicoesAtletas);
    for (const a of (torneio.atletas ?? [])) {
      if (athleteIds.has(a.id)) {
        a.emChave = false;
      }
    }
    chaves.splice(idx, 1);
    torneio.chaves = chaves;
    torneio.updatedAt = new Date().toISOString();
    saveTorneio(torneio);
  });
}
