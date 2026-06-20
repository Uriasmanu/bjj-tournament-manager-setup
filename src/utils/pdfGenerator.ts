import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import type { Chave, Luta } from '../types/bracket';
import type { LutaCasada } from '../types/lutaCasada';
import type { Atleta } from '../types/athlete';
import type { Arbitro } from '../types/referee';
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

function getNomeArbitro(id: string | null, arbitros: Arbitro[]): string {
  if (!id) return '—';
  const arbitro = arbitros.find(a => a.id === id);
  if (!arbitro) return 'Árbitro removido';
  return arbitro.nome.charAt(0).toUpperCase() + arbitro.nome.slice(1);
}

export function gerarPdfLutasCasadas(lutas: LutaCasada[], nomeTorneio: string, arbitros: Arbitro[] = []): void {
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
    const arbitroNome = getNomeArbitro(luta.arbitroId, arbitros);

    body.push([
      { text: `${nomeA} vs ${nomeB}`, bold: true, fontSize: 10 },
      { text: `Status: ${statusLabel}`, fontSize: 8 },
      { text: `Vencedor: ${vencedor}`, fontSize: 8 },
      { text: placar, fontSize: 8 },
      { text: arbitroNome !== '—' ? `Árbitro: ${arbitroNome}` : '', fontSize: 8 },
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

const ROUND_LABELS: Record<number, string> = {
  1: 'PRIMEIRA RODADA',
  2: 'QUARTAS DE FINAL',
  3: 'SEMIFINAL',
  4: 'FINAL',
};

function getRoundLabel(rodada: number, totalRodadas: number): string {
  const offset = Math.max(0, 4 - totalRodadas);
  return ROUND_LABELS[rodada + offset] || `Rodada ${rodada}`;
}

function createBracketRow(
  luta: Luta,
  atletas: Atleta[]
): TableCell[] {
  const nomeA = getNomeAtleta(luta.atletaAId, atletas);
  const nomeB = getNomeAtleta(luta.atletaBId, atletas);
  const placar = luta.placarA && luta.placarB
    ? `${luta.placarA.total}-${luta.placarB.total}`
    : '';
  
  const winnerA = luta.vencedorId === luta.atletaAId;
  const winnerB = luta.vencedorId === luta.atletaBId;
  
  const nomeAStyle: Record<string, unknown> = { fontSize: 7, margin: [2, 1, 2, 1] as [number, number, number, number] };
  const nomeBStyle: Record<string, unknown> = { fontSize: 7, margin: [2, 1, 2, 1] as [number, number, number, number] };
  
  if (winnerA) nomeAStyle.bold = true;
  if (winnerB) nomeBStyle.bold = true;
  
  return [
    { text: nomeA, ...nomeAStyle },
    { text: placar ? `vs (${placar})` : 'vs', fontSize: 6, alignment: 'center' as const, margin: [0, 1, 0, 1] as [number, number, number, number] },
    { text: nomeB, ...nomeBStyle },
  ];
}

export function gerarPdfChaves(chaves: Chave[], atletas: Atleta[], nomeTorneio: string): void {
  const content: Content[] = [
    { text: `Chaves de Luta - ${nomeTorneio}`, style: 'header', alignment: 'center' },
    { text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, alignment: 'center', fontSize: 8, margin: [0, 0, 0, 10] },
  ];

  for (const chave of chaves) {
    const titulo = chave.nome || getCategoriaLabel(chave.categoriaId);
    const faixaText = chave.faixa ? ` — Faixa: ${FAIXA_LABEL[chave.faixa] ?? chave.faixa}` : '';
    const totalAtletas = chave.totalAtletas || chave.posicoesAtletas?.length || 0;

    content.push({ text: `${titulo}${faixaText} (${totalAtletas} atletas)`, style: 'chaveTitle', margin: [0, 6, 0, 4] as [number, number, number, number] });

    const rodadas = new Map<number, Luta[]>();
    for (const luta of chave.lutas) {
      const arr = rodadas.get(luta.rodada) ?? [];
      arr.push(luta);
      rodadas.set(luta.rodada, arr);
    }

    const sortedRodadas = [...rodadas.keys()].sort((a, b) => a - b);
    const maxRodada = sortedRodadas[sortedRodadas.length - 1] || 1;

    for (const rodadaNum of sortedRodadas) {
      const lutasDaRodada = rodadas.get(rodadaNum) ?? [];
      const roundLabel = getRoundLabel(rodadaNum, maxRodada);

      content.push({ text: roundLabel, bold: true, fontSize: 8, margin: [0, 4, 0, 2] as [number, number, number, number] });

      const tableBody: TableCell[][] = [];
      for (const luta of lutasDaRodada) {
        tableBody.push(createBracketRow(luta, atletas));
      }

      content.push({
        table: {
          widths: ['*', 'auto', '*'],
          body: tableBody,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#ccc',
          vLineColor: () => '#ccc',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
      });

      if (rodadaNum < maxRodada) {
        content.push({ text: '↓', alignment: 'center', fontSize: 10, margin: [0, 2, 0, 2] as [number, number, number, number] });
      }
    }

    content.push({ text: '', margin: [0, 10, 0, 10] as [number, number, number, number] });
  }

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [15, 20, 15, 20],
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

export function gerarPdfResultados(
  chaves: Chave[],
  atletas: Atleta[],
  arbitros: Arbitro[],
  medalhasPorEquipe: Record<string, { ouro: number; prata: number; bronze: number }>,
  nomeTorneio: string,
  getChaveVencedorId: (chave: Chave) => string | null,
  getChavePerdedorFinalId: (chave: Chave) => string | null,
  getPerdedoresSemifinal: (chave: Chave) => string[],
): void {
  const atletasMap = new Map(atletas.map(a => [a.id, a]));
  const resolveNome = (id: string | null): string => {
    if (!id || id === 'tbd' || id === 'bye') return '—';
    const a = atletasMap.get(id);
    if (!a) return 'Atleta removido';
    return capitalize(a.nome);
  };

  const chavesEncerradas = chaves.filter(c => {
    const max = Math.max(...c.lutas.map(l => l.rodada), 0);
    return c.lutas.some(l => l.rodada === max && l.vencedorId);
  });

  const content: Content[] = [
    { text: `Resultados - ${nomeTorneio}`, style: 'header', alignment: 'center' },
    { text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, alignment: 'center', fontSize: 9, margin: [0, 0, 0, 10] },
  ];

  // === MEDALHISTAS ===
  content.push({ text: 'Medalhistas', style: 'sectionTitle', margin: [0, 8, 0, 4] as [number, number, number, number] });

  if (chavesEncerradas.length === 0) {
    content.push({ text: 'Nenhuma chave encerrada.', fontSize: 9, margin: [0, 0, 0, 6] as [number, number, number, number] });
  } else {
    for (const chave of chavesEncerradas) {
      const titulo = chave.nome || getCategoriaLabel(chave.categoriaId);
      const faixaText = chave.faixa ? ` - ${FAIXA_LABEL[chave.faixa] ?? chave.faixa}` : '';
      const ouro = getChaveVencedorId(chave);
      const prata = getChavePerdedorFinalId(chave);
      const bronzes = getPerdedoresSemifinal(chave);

      content.push({ text: `${titulo}${faixaText} (${chave.totalAtletas} atletas)`, bold: true, fontSize: 9, margin: [0, 4, 0, 2] as [number, number, number, number] });

      const medalBody: TableCell[][] = [];
      if (ouro) medalBody.push([{ text: 'Ouro', bold: true, fontSize: 9 }, { text: resolveNome(ouro), fontSize: 9 }]);
      if (prata) medalBody.push([{ text: 'Prata', bold: true, fontSize: 9 }, { text: resolveNome(prata), fontSize: 9 }]);
      for (const id of bronzes) {
        medalBody.push([{ text: 'Bronze', bold: true, fontSize: 9 }, { text: resolveNome(id), fontSize: 9 }]);
      }

      if (medalBody.length > 0) {
        content.push({
          table: { widths: [60, '*'], body: medalBody },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 4] as [number, number, number, number],
        });
      }
    }
  }

  // === RANKING DE EQUIPES ===
  content.push({ text: 'Ranking de Equipes', style: 'sectionTitle', margin: [0, 10, 0, 4] as [number, number, number, number] });

  const equipes = Object.entries(medalhasPorEquipe)
    .map(([nome, m]) => ({ nome, totalAtletas: atletas.filter(a => (a.equipe || 'Sem equipe') === nome).length, ...m }))
    .sort((a, b) => b.ouro - a.ouro || b.prata - a.prata || b.bronze - a.bronze);

  if (equipes.length === 0) {
    content.push({ text: 'Nenhuma equipe registrada.', fontSize: 9, margin: [0, 0, 0, 6] as [number, number, number, number] });
  } else {
    const eqBody: TableCell[][] = [
      [
        { text: 'Equipe', bold: true, fontSize: 9 },
        { text: 'Atletas', bold: true, fontSize: 9, alignment: 'center' as const },
        { text: 'Ouro', bold: true, fontSize: 9, alignment: 'center' as const },
        { text: 'Prata', bold: true, fontSize: 9, alignment: 'center' as const },
        { text: 'Bronze', bold: true, fontSize: 9, alignment: 'center' as const },
      ],
      ...equipes.map(e => [
        { text: capitalize(e.nome), fontSize: 9 },
        { text: String(e.totalAtletas), fontSize: 9, alignment: 'center' as const },
        { text: String(e.ouro), fontSize: 9, alignment: 'center' as const },
        { text: String(e.prata), fontSize: 9, alignment: 'center' as const },
        { text: String(e.bronze), fontSize: 9, alignment: 'center' as const },
      ]),
    ];
    content.push({
      table: { widths: ['*', 'auto', 'auto', 'auto', 'auto'], body: eqBody },
      layout: 'lightHorizontalLines',
    });
  }

  // === ARBITROS ===
  content.push({ text: 'Arbitros', style: 'sectionTitle', margin: [0, 10, 0, 4] as [number, number, number, number] });

  if (arbitros.length === 0) {
    content.push({ text: 'Nenhum arbitro cadastrado.', fontSize: 9, margin: [0, 0, 0, 6] as [number, number, number, number] });
  } else {
    const lutasPorArbitro: Record<string, number> = {};
    for (const c of chaves) {
      if (c.arbitroId) lutasPorArbitro[c.arbitroId] = (lutasPorArbitro[c.arbitroId] ?? 0) + 1;
    }
    const arbBody: TableCell[][] = [
      [
        { text: 'Arbitro', bold: true, fontSize: 9 },
        { text: 'Faixa', bold: true, fontSize: 9 },
        { text: 'Equipe', bold: true, fontSize: 9 },
        { text: 'Lutas', bold: true, fontSize: 9, alignment: 'center' as const },
      ],
      ...arbitros.map(a => [
        { text: capitalize(a.nome), fontSize: 9 },
        { text: FAIXA_LABEL[a.faixa] ?? a.faixa, fontSize: 9 },
        { text: capitalize(a.equipe || '—'), fontSize: 9 },
        { text: String(lutasPorArbitro[a.id] ?? 0), fontSize: 9, alignment: 'center' as const },
      ]),
    ];
    content.push({
      table: { widths: ['*', 'auto', 'auto', 'auto'], body: arbBody },
      layout: 'lightHorizontalLines',
    });
  }

  // === ATLETAS ===
  content.push({ text: 'Atletas', style: 'sectionTitle', margin: [0, 10, 0, 4] as [number, number, number, number] });

  if (atletas.length === 0) {
    content.push({ text: 'Nenhum atleta cadastrado.', fontSize: 9, margin: [0, 0, 0, 6] as [number, number, number, number] });
  } else {
    const atBody: TableCell[][] = [
      [
        { text: 'Atleta', bold: true, fontSize: 8 },
        { text: 'Equipe', bold: true, fontSize: 8 },
        { text: 'Faixa', bold: true, fontSize: 8 },
        { text: 'Peso', bold: true, fontSize: 8, alignment: 'center' as const },
        { text: 'Categoria', bold: true, fontSize: 8 },
        { text: 'Chave', bold: true, fontSize: 8 },
      ],
      ...atletas.sort((a, b) => a.nome.localeCompare(b.nome)).map(a => {
        const chave = chaves.find(c => c.posicoesAtletas.includes(a.id));
        return [
          { text: capitalize(a.nome), fontSize: 7 },
          { text: capitalize(a.equipe || '—'), fontSize: 7 },
          { text: FAIXA_LABEL[a.faixa] ?? a.faixa, fontSize: 7 },
          { text: `${a.pesoKg.toFixed(1)}`, fontSize: 7, alignment: 'center' as const },
          { text: getCategoriaLabel(a.categoria), fontSize: 7 },
          { text: chave ? (chave.nome || getCategoriaLabel(chave.categoriaId)) : '—', fontSize: 7 },
        ];
      }),
    ];
    content.push({
      table: { widths: ['*', 'auto', 'auto', 'auto', '*', 'auto'], body: atBody },
      layout: 'lightHorizontalLines',
    });
  }

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [15, 20, 15, 20],
    content,
    defaultStyle: { font: 'Roboto' },
    styles: {
      header: { fontSize: 14, bold: true, margin: [0, 0, 0, 4] as [number, number, number, number] },
      sectionTitle: { fontSize: 12, bold: true, decoration: 'underline' },
    },
  };

  (pdfMake as any).createPdf(docDefinition).download(
    `resultados-${nomeTorneio.replace(/\s+/g, '-').toLowerCase()}.pdf`
  );
}
