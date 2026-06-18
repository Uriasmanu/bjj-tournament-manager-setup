import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import type { Chave, Luta } from '../types/bracket';
import type { LutaCasada } from '../types/lutaCasada';
import type { Atleta } from '../types/athlete';
import { categoriaLabels } from '../types/category';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any);

const FAIXA_LABEL: Record<string, string> = {
  branca: 'Branca', cinza: 'Cinza', amarela: 'Amarela', laranja: 'Laranja',
  verde: 'Verde', azul: 'Azul', roxa: 'Roxa', marrom: 'Marrom', preta: 'Preta',
};

function getNomeAtleta(id: string, atletas: Atleta[]): string {
  if (id === 'tbd' || id === 'bye') return id === 'bye' ? '(bye)' : 'A definir';
  const a = atletas.find(at => at.id === id);
  if (!a) return 'Atleta removido';
  return a.nome.charAt(0).toUpperCase() + a.nome.slice(1);
}

function getCategoriaLabel(categoriaId: string): string {
  return categoriaLabels[categoriaId] ?? categoriaId;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function gerarPdfLutasCasadas(lutas: LutaCasada[], nomeTorneio: string): void {
  const body: TableCell[][] = [];

  for (const luta of lutas) {
    const nomeA = capitalize(luta.atletaASnapshot?.nome ?? luta.atletaAId);
    const nomeB = capitalize(luta.atletaBSnapshot?.nome ?? luta.atletaBId);
    const statusLabel = luta.status === 'completed' ? 'Finalizada' : luta.status === 'wo' ? 'W.O.' : 'Pendente';
    const vencedor = luta.vencedorId
      ? capitalize(luta.vencedorId === luta.atletaAId ? nomeA : nomeB)
      : '—';
    const placar = luta.placarA && luta.placarB
      ? `${luta.placarA.total} x ${luta.placarB.total}`
      : '';
    const arbitro = luta.arbitroId ?? '';

    body.push([
      { text: `${nomeA} vs ${nomeB}`, bold: true, fontSize: 10 },
      { text: `Status: ${statusLabel}`, fontSize: 8 },
      { text: `Vencedor: ${vencedor}`, fontSize: 8 },
      { text: placar, fontSize: 8 },
      { text: arbitro ? `Árbitro: ${arbitro}` : '', fontSize: 8 },
    ]);
  }

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [15, 20, 15, 20],
    content: [
      { text: `Lutas Casadas - ${nomeTorneio}`, style: 'header', alignment: 'center' },
      { text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, alignment: 'center', fontSize: 9, margin: [0, 0, 0, 10] },
      {
        table: {
          widths: ['*', 'auto', '*', 'auto', 'auto'],
          body,
        },
        layout: 'lightHorizontalLines',
      },
    ],
    defaultStyle: { font: 'Roboto' },
    styles: {
      header: { fontSize: 16, bold: true, margin: [0, 0, 0, 6] },
    },
  };

  (pdfMake as any).createPdf(docDefinition).download(
    `lutas-casadas-${nomeTorneio.replace(/\s+/g, '-').toLowerCase()}.pdf`
  );
}

export function gerarPdfChaves(chaves: Chave[], atletas: Atleta[], nomeTorneio: string): void {
  const content: Content[] = [
    { text: `Chaves de Luta - ${nomeTorneio}`, style: 'header', alignment: 'center' },
    { text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, alignment: 'center', fontSize: 8, margin: [0, 0, 0, 10] },
  ];

  for (const chave of chaves) {
    const titulo = chave.nome || getCategoriaLabel(chave.categoriaId);
    const faixaText = chave.faixa ? ` — Faixa: ${FAIXA_LABEL[chave.faixa] ?? chave.faixa}` : '';

    content.push({ text: `${titulo}${faixaText}`, style: 'chaveTitle', margin: [0, 6, 0, 4] as [number, number, number, number] });

    const rodadas = new Map<number, Luta[]>();
    for (const luta of chave.lutas) {
      const arr = rodadas.get(luta.rodada) ?? [];
      arr.push(luta);
      rodadas.set(luta.rodada, arr);
    }

    const sortedRodadas = [...rodadas.keys()].sort((a, b) => a - b);

    for (const rodadaNum of sortedRodadas) {
      const lutasDaRodada = rodadas.get(rodadaNum) ?? [];

      content.push({ text: `Rodada ${rodadaNum}`, bold: true, fontSize: 8, margin: [0, 4, 0, 2] as [number, number, number, number] });

      const tableBody: TableCell[][] = [];
      for (const luta of lutasDaRodada) {
        const nomeA = getNomeAtleta(luta.atletaAId, atletas);
        const nomeB = getNomeAtleta(luta.atletaBId, atletas);
        const placar = luta.placarA && luta.placarB
          ? `${luta.placarA.total}-${luta.placarB.total}`
          : '';
        tableBody.push([
          { text: nomeA, fontSize: 7 },
          { text: 'vs', fontSize: 7, alignment: 'center' as const },
          { text: nomeB, fontSize: 7 },
          { text: placar, fontSize: 7, alignment: 'right' as const },
        ]);
      }

      content.push({
        table: {
          widths: ['*', 'auto', '*', 'auto'],
          body: tableBody,
        },
        layout: 'lightHorizontalLines',
      });
    }
  }

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [10, 15, 10, 15],
    content,
    defaultStyle: { font: 'Roboto' },
    styles: {
      header: { fontSize: 14, bold: true, margin: [0, 0, 0, 4] as [number, number, number, number] },
      chaveTitle: { fontSize: 10, bold: true },
    },
  };

  (pdfMake as any).createPdf(docDefinition).download(
    `chaves-${nomeTorneio.replace(/\s+/g, '-').toLowerCase()}.pdf`
  );
}
