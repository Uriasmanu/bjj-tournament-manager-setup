import type { Chave } from '../types/bracket';
import type { LutaCasada } from '../types/lutaCasada';
import type { Atleta } from '../types/athlete';
import type { Arbitro } from '../types/referee';
import type { CategoriaCustomizada } from '../types/category';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function bufferToBlob(buffer: number[], mime: string): Blob {
  const uint8 = new Uint8Array(buffer);
  return new Blob([uint8], { type: mime });
}

function sanitizeFilename(nome: string): string {
  return nome.replace(/\s+/g, '-').toLowerCase();
}

export async function gerarPdfLutasCasadas(
  lutas: LutaCasada[],
  nomeTorneio: string,
  arbitros: Arbitro[] = [],
  customizadas: CategoriaCustomizada[] = []
): Promise<void> {
  const buffer = await window.electronAPI.gerarPdfLutasCasadas(lutas, nomeTorneio, arbitros, customizadas);
  const blob = bufferToBlob(buffer, 'application/pdf');
  downloadBlob(blob, `lutas-casadas-${sanitizeFilename(nomeTorneio)}.pdf`);
}

export async function gerarPdfChaves(
  chaves: Chave[],
  atletas: Atleta[],
  nomeTorneio: string,
  customizadas: CategoriaCustomizada[] = []
): Promise<void> {
  const buffer = await window.electronAPI.gerarPdfChaves(chaves, atletas, nomeTorneio, customizadas);
  const blob = bufferToBlob(buffer, 'application/pdf');
  downloadBlob(blob, `chaves-${sanitizeFilename(nomeTorneio)}.pdf`);
}

export interface ResultadoMedalha {
  chave: Chave;
  ouro: string | null;
  prata: string | null;
  bronzes: string[];
}

export interface ResultadoEquipe {
  nome: string;
  totalAtletas: number;
  ouro: number;
  prata: number;
  bronze: number;
}

export async function gerarPdfResultados(
  chaves: Chave[],
  atletas: Atleta[],
  arbitros: Arbitro[],
  medalhasPorEquipe: Record<string, { ouro: number; prata: number; bronze: number }>,
  nomeTorneio: string,
  _getChaveVencedorId: (chave: Chave) => string | null,
  _getChavePerdedorFinalId: (chave: Chave) => string | null,
  _getPerdedoresSemifinal: (chave: Chave) => string[],
  customizadas: CategoriaCustomizada[] = []
): Promise<void> {
  const buffer = await window.electronAPI.gerarPdfResultados(chaves, atletas, arbitros, medalhasPorEquipe, nomeTorneio, customizadas);
  const blob = bufferToBlob(buffer, 'application/pdf');
  downloadBlob(blob, `resultados-${sanitizeFilename(nomeTorneio)}.pdf`);
}
