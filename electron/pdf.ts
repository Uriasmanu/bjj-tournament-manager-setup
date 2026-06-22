import PDFDocument from 'pdfkit'
import type { Chave, Luta } from '../src/types/bracket'
import type { LutaCasada } from '../src/types/lutaCasada'
import type { Atleta } from '../src/types/athlete'
import type { Arbitro } from '../src/types/referee'
import type { CategoriaCustomizada } from '../src/types/category'

const FAIXA_LABEL: Record<string, string> = {
  branca: 'Branca', cinza: 'Cinza', amarela: 'Amarela', laranja: 'Laranja',
  verde: 'Verde', azul: 'Azul', roxa: 'Roxa', marrom: 'Marrom', preta: 'Preta',
}

const COLORS = {
  primary: '#1b325f',
  accent: '#3a89c9',
  gold: '#ccb24c',
  coral: '#f26c4f',
  lightBg: '#e9f2f9',
  white: '#ffffff',
  textDark: '#212529',
  textMuted: '#6c757d',
  borderLight: '#dee2e6',
  winnerBg: '#d4edda',
  winnerBorder: '#28a745',
}

function getNomeAtleta(id: string, atletas: Atleta[]): string {
  if (id === 'tbd' || id === 'bye') return id === 'bye' ? '(bye)' : 'A definir'
  const a = atletas.find(at => at.id === id)
  if (!a) return 'Atleta removido'
  return a.nome.charAt(0).toUpperCase() + a.nome.slice(1)
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getNomeArbitro(id: string | null, arbitros: Arbitro[]): string {
  if (!id) return '—'
  const arbitro = arbitros.find(a => a.id === id)
  if (!arbitro) return 'Árbitro removido'
  return arbitro.nome.charAt(0).toUpperCase() + arbitro.nome.slice(1)
}

function drawTableHeader(doc: PDFKit.PDFDocument, headers: string[], x: number, y: number, widths: number[]) {
  let curX = x
  doc.save()
  doc.rect(x, y, widths.reduce((a, b) => a + b, 0), 20).fill(COLORS.primary)
  doc.fontSize(8).fillColor(COLORS.white).font('Helvetica-Bold')
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], curX + 4, y + 6, { width: widths[i] - 8, align: 'left' })
    curX += widths[i]
  }
  doc.restore()
  return y + 20
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  cells: string[],
  x: number,
  y: number,
  widths: number[],
  opts?: { bold?: boolean; bgColor?: string; fontSize?: number }
) {
  const rowHeight = 16
  let curX = x
  doc.save()
  if (opts?.bgColor) {
    doc.rect(x, y, widths.reduce((a, b) => a + b, 0), rowHeight).fill(opts.bgColor)
  }
  doc.fontSize(opts?.fontSize ?? 7).fillColor(COLORS.textDark).font(opts?.bold ? 'Helvetica-Bold' : 'Helvetica')
  for (let i = 0; i < cells.length; i++) {
    doc.text(cells[i], curX + 4, y + 4, { width: widths[i] - 8, align: 'left' })
    curX += widths[i]
  }
  doc.restore()
  return y + rowHeight
}

function drawHorizontalLine(doc: PDFKit.PDFDocument, x: number, y: number, width: number) {
  doc.save().moveTo(x, y).lineTo(x + width, y).lineWidth(0.5).strokeColor(COLORS.borderLight).stroke().restore()
}

function collectPdfBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}

// ============================================================
// LUTAS CASADAS
// ============================================================
export async function gerarPdfLutasCasadas(
  lutas: LutaCasada[],
  nomeTorneio: string,
  arbitros: Arbitro[] = [],
  _customizadas: CategoriaCustomizada[] = []
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 30 })

  // Header
  doc.save()
  doc.rect(0, 0, doc.page.width, 60).fill(COLORS.primary)
  doc.fontSize(18).fillColor(COLORS.white).font('Helvetica-Bold')
    .text(`Lutas Casadas - ${nomeTorneio}`, 30, 20, { align: 'center', width: doc.page.width - 60 })
  doc.fontSize(9).fillColor('#a0c4e8')
    .text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 30, 42, { align: 'center', width: doc.page.width - 60 })
  doc.restore()

  let y = 80

  if (lutas.length === 0) {
    doc.fontSize(10).fillColor(COLORS.textMuted).font('Helvetica')
      .text('Nenhuma luta casada registrada.', 30, y)
    return collectPdfBuffer(doc)
  }

  for (const luta of lutas) {
    if (y > doc.page.height - 100) {
      doc.addPage()
      y = 30
    }

    const nomeA = capitalize(luta.atletaASnapshot?.nome ?? luta.atletaAId)
    const nomeB = capitalize(luta.atletaBSnapshot?.nome ?? luta.atletaBId)
    const statusLabel = luta.status === 'completed' ? 'Finalizada' : luta.status === 'wo' ? 'W.O.' : 'Pendente'
    const vencedor = luta.vencedorId
      ? capitalize(luta.vencedorId === luta.atletaAId ? nomeA : nomeB)
      : '—'
    const placar = luta.placarA && luta.placarB
      ? `${luta.placarA.total} x ${luta.placarB.total}`
      : ''
    const arbitroNome = getNomeArbitro(luta.arbitroId, arbitros)

    // Card background
    doc.save()
    doc.roundedRect(30, y, doc.page.width - 60, 50, 4)
      .fill(COLORS.white)
      .lineWidth(1).strokeColor(COLORS.borderLight).stroke()

    // Left accent
    doc.rect(30, y, 4, 50).fill(COLORS.accent)

    // Content
    doc.fontSize(9).fillColor(COLORS.primary).font('Helvetica-Bold')
      .text(`${nomeA} vs ${nomeB}`, 42, y + 6, { width: 300 })
    doc.fontSize(7).fillColor(COLORS.textMuted).font('Helvetica')
      .text(`Status: ${statusLabel}  |  Vencedor: ${vencedor}  ${placar ? `|  Placar: ${placar}` : ''}  ${arbitroNome !== '—' ? `|  Árbitro: ${arbitroNome}` : ''}`, 42, y + 22, { width: doc.page.width - 90 })

    doc.restore()
    y += 58
  }

  return collectPdfBuffer(doc)
}

// ============================================================
// BRACKET DRAWING
// ============================================================

const ROUND_LABELS: Record<number, string> = {
  1: 'PRIMEIRA RODADA',
  2: 'QUARTAS DE FINAL',
  3: 'SEMIFINAL',
  4: 'FINAL',
}

function getRoundLabel(rodada: number, totalRodadas: number): string {
  const offset = Math.max(0, 4 - totalRodadas)
  return ROUND_LABELS[rodada + offset] || `Rodada ${rodada}`
}

function drawBracketCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  nomeA: string,
  nomeB: string,
  placar?: string,
  winnerA?: boolean,
  winnerB?: boolean,
) {
  doc.save()

  // Card shadow
  doc.roundedRect(x + 1, y + 1, width, height, 3).fill('#e0e0e0')
  // Card body fill
  doc.roundedRect(x, y, width, height, 3).fill(COLORS.white)

  // Left accent
  doc.rect(x, y, 3, height).fill(winnerA || winnerB ? COLORS.gold : COLORS.accent)

  // Border on all sides (drawn after accent so it's visible)
  doc.roundedRect(x, y, width, height, 3).lineWidth(1).strokeColor(COLORS.borderLight).stroke()

  // Divider line
  const midY = y + height / 2
  doc.save().moveTo(x + 4, midY).lineTo(x + width - 4, midY)
    .lineWidth(0.5).strokeColor(COLORS.borderLight).stroke().restore()

  const textOpts: PDFKit.Mixins.TextOptions = { width: width - 14, align: 'left' }

  // Athlete A
  doc.fontSize(7).font(winnerA ? 'Helvetica-Bold' : 'Helvetica').fillColor(winnerA ? COLORS.primary : COLORS.textDark)
  doc.text(nomeA, x + 10, y + 3, textOpts)

  // Athlete B
  doc.font(winnerB ? 'Helvetica-Bold' : 'Helvetica').fillColor(winnerB ? COLORS.primary : COLORS.textDark)
  doc.text(nomeB, x + 10, midY + 3, textOpts)

  // Score badge
  if (placar) {
    const badgeW = 30
    const badgeH = 10
    doc.roundedRect(x + width - badgeW - 4, midY - badgeH / 2, badgeW, badgeH, 2).fill(COLORS.primary)
    doc.fontSize(6).fillColor(COLORS.white).font('Helvetica-Bold')
      .text(placar, x + width - badgeW - 4, midY - badgeH / 2 + 2, { width: badgeW, align: 'center' })
  }

  doc.restore()
}

function drawConnectingLines(
  doc: PDFKit.PDFDocument,
  fromX: number,
  fromYs: number[],
  toX: number,
  toY: number,
  cardHeight: number,
) {
  doc.save()
  doc.lineWidth(1).strokeColor(COLORS.accent)

  const midX = fromX + 5

  for (const fromY of fromYs) {
    const fromMidY = fromY + cardHeight / 2
    doc.moveTo(midX, fromMidY)
    doc.lineTo(midX + 10, fromMidY)
    doc.lineTo(midX + 10, toY + cardHeight / 2)
    doc.lineTo(toX, toY + cardHeight / 2)
    doc.stroke()
  }

  doc.restore()
}

function drawBracket(
  doc: PDFKit.PDFDocument,
  chave: Chave,
  atletas: Atleta[],
  startY: number,
  _customizadas: CategoriaCustomizada[]
): number {
  const titulo = chave.nome || getCategoriaLabel(chave.categoriaId, _customizadas)
  const faixaText = chave.faixa ? ` — Faixa: ${FAIXA_LABEL[chave.faixa] ?? chave.faixa}` : ''
  const totalAtletas = chave.totalAtletas || chave.posicoesAtletas?.length || 0

  // Title
  doc.save()
  doc.fontSize(11).fillColor(COLORS.primary).font('Helvetica-Bold')
    .text(`${titulo}${faixaText} (${totalAtletas} atletas)`, 30, startY, { width: doc.page.width - 60 })
  doc.restore()

  let y = startY + 20

  // Group lutas by round
  const rodadas = new Map<number, Luta[]>()
  for (const luta of chave.lutas) {
    const arr = rodadas.get(luta.rodada) ?? []
    arr.push(luta)
    rodadas.set(luta.rodada, arr)
  }

  const sortedRodadas = [...rodadas.keys()].sort((a, b) => a - b)
  const maxRodada = sortedRodadas[sortedRodadas.length - 1] || 1

  const CARD_W = 150
  const CARD_H = 36
  const ROUND_GAP = 50
  const MATCH_GAP = 8

  // Calculate layout
  const roundMatchCounts = sortedRodadas.map(r => (rodadas.get(r) ?? []).length)
  const maxMatches = Math.max(...roundMatchCounts)

  // Starting X for each round
  const roundXs = sortedRodadas.map((_, i) => 30 + i * (CARD_W + ROUND_GAP))

  // Draw round labels
  for (let i = 0; i < sortedRodadas.length; i++) {
    const rodadaNum = sortedRodadas[i]
    const label = getRoundLabel(rodadaNum, maxRodada)
    doc.save()
    doc.fontSize(7).fillColor(COLORS.textMuted).font('Helvetica-Bold')
      .text(label, roundXs[i], y, { width: CARD_W, align: 'center' })
    doc.restore()
  }
  y += 14

  // Draw cards for each round
  const roundTopYs: number[][] = []

  for (let r = 0; r < sortedRodadas.length; r++) {
    const rodadaNum = sortedRodadas[r]
    const lutasDaRodada = rodadas.get(rodadaNum) ?? []
    const matchCount = roundMatchCounts[r]

    // Calculate Y positions centered around the middle
    const totalHeight = matchCount * CARD_H + (matchCount - 1) * MATCH_GAP
    const offsetY = r === 0 ? 0 : (maxMatches * CARD_H + (maxMatches - 1) * MATCH_GAP - totalHeight) / 2
    const baseY = y + offsetY

    const matchYs: number[] = []

    for (let m = 0; m < lutasDaRodada.length; m++) {
      const luta = lutasDaRodada[m]
      const nomeA = getNomeAtleta(luta.atletaAId, atletas)
      const nomeB = getNomeAtleta(luta.atletaBId, atletas)
      const placar = luta.placarA && luta.placarB
        ? `${luta.placarA.total}-${luta.placarB.total}`
        : undefined
      const winnerA = luta.vencedorId === luta.atletaAId
      const winnerB = luta.vencedorId === luta.atletaBId

      const cardY = baseY + m * (CARD_H + MATCH_GAP)
      matchYs.push(cardY)

      drawBracketCard(doc, roundXs[r], cardY, CARD_W, CARD_H, nomeA, nomeB, placar, winnerA, winnerB)
    }

    roundTopYs.push(matchYs)
  }

  // Draw connecting lines between rounds
  for (let r = 0; r < sortedRodadas.length - 1; r++) {
    const fromYs = roundTopYs[r]
    const toYs = roundTopYs[r + 1]

    for (let t = 0; t < toYs.length; t++) {
      // Each next-round match connects to 2 from previous round
      const fromIndices = [t * 2, t * 2 + 1]
      const validFromYs = fromIndices
        .filter(i => i < fromYs.length)
        .map(i => fromYs[i])

      if (validFromYs.length > 0) {
        drawConnectingLines(
          doc,
          roundXs[r] + CARD_W,
          validFromYs,
          roundXs[r + 1],
          toYs[t],
          CARD_H,
        )
      }
    }
  }

  const totalBracketHeight = maxMatches * CARD_H + (maxMatches - 1) * MATCH_GAP + 40
  return y + totalBracketHeight
}

export async function gerarPdfChaves(
  chaves: Chave[],
  atletas: Atleta[],
  nomeTorneio: string,
  customizadas: CategoriaCustomizada[] = []
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 30 })

  // Header
  doc.save()
  doc.rect(0, 0, doc.page.width, 60).fill(COLORS.primary)
  doc.fontSize(18).fillColor(COLORS.white).font('Helvetica-Bold')
    .text(`Chaves de Luta - ${nomeTorneio}`, 30, 20, { align: 'center', width: doc.page.width - 60 })
  doc.fontSize(9).fillColor('#a0c4e8')
    .text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 30, 42, { align: 'center', width: doc.page.width - 60 })
  doc.restore()

  let y = 80

  for (const chave of chaves) {
    if (y > doc.page.height - 120) {
      doc.addPage()
      y = 30
    }

    y = drawBracket(doc, chave, atletas, y, customizadas)
    y += 20
  }

  return collectPdfBuffer(doc)
}

// ============================================================
// RESULTADOS
// ============================================================

function getChaveVencedorId(chave: Chave): string | null {
  const maxRodada = Math.max(...chave.lutas.map(l => l.rodada), 0)
  const finalLuta = chave.lutas.find(l => l.rodada === maxRodada)
  if (!finalLuta) return null
  return finalLuta.vencedorId ?? null
}

function getChavePerdedorFinalId(chave: Chave): string | null {
  const maxRodada = Math.max(...chave.lutas.map(l => l.rodada), 0)
  const finalLuta = chave.lutas.find(l => l.rodada === maxRodada)
  if (!finalLuta || !finalLuta.vencedorId) return null
  const perdedorId = finalLuta.vencedorId === finalLuta.atletaAId ? finalLuta.atletaBId : finalLuta.atletaAId
  return perdedorId
}

function getPerdedoresSemifinal(chave: Chave): string[] {
  const maxRodada = Math.max(...chave.lutas.map(l => l.rodada), 0)
  if (maxRodada < 3) return []
  const semis = chave.lutas.filter(l => l.rodada === maxRodada - 1)
  return semis
    .filter(l => l.vencedorId)
    .map(l => (l.vencedorId === l.atletaAId ? l.atletaBId : l.atletaAId))
}

function getCategoriaLabel(categoriaId: string, customizadas?: CategoriaCustomizada[]): string {
  const cat = customizadas?.find(c => c.id === categoriaId)
  return cat?.nome ?? categoriaId
}

export async function gerarPdfResultados(
  chaves: Chave[],
  atletas: Atleta[],
  arbitros: Arbitro[],
  medalhasPorEquipe: Record<string, { ouro: number; prata: number; bronze: number }>,
  nomeTorneio: string,
  customizadas: CategoriaCustomizada[] = []
): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 30 })

  const atletasMap = new Map(atletas.map(a => [a.id, a]))
  const resolveNome = (id: string | null): string => {
    if (!id || id === 'tbd' || id === 'bye') return '—'
    const a = atletasMap.get(id)
    if (!a) return 'Atleta removido'
    return capitalize(a.nome)
  }

  const chavesEncerradas = chaves.filter(c => {
    const max = Math.max(...c.lutas.map(l => l.rodada), 0)
    return c.lutas.some(l => l.rodada === max && l.vencedorId)
  })

  const pageW = doc.page.width - 60

  // ========== HEADER ==========
  doc.save()
  doc.rect(0, 0, doc.page.width, 60).fill(COLORS.primary)
  doc.fontSize(18).fillColor(COLORS.white).font('Helvetica-Bold')
    .text(`Resultados - ${nomeTorneio}`, 30, 20, { align: 'center', width: pageW })
  doc.fontSize(9).fillColor('#a0c4e8')
    .text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 30, 42, { align: 'center', width: pageW })
  doc.restore()

  let y = 80

  // ========== MEDALHISTAS ==========
  doc.save()
  doc.fontSize(13).fillColor(COLORS.primary).font('Helvetica-Bold').text('Medalhistas', 30, y)
  doc.restore()
  y += 20

  if (chavesEncerradas.length === 0) {
    doc.fontSize(9).fillColor(COLORS.textMuted).font('Helvetica').text('Nenhuma chave encerrada.', 30, y)
    y += 15
  } else {
    const headers = ['Categoria', 'Atletas', 'Ouro', 'Prata', 'Bronze']
    const widths = [160, 40, 120, 120, 120]
    y = drawTableHeader(doc, headers, 30, y, widths)

    for (const chave of chavesEncerradas) {
      if (y > doc.page.height - 50) { doc.addPage(); y = 30; y = drawTableHeader(doc, headers, 30, y, widths) }
      const titulo = chave.nome || getCategoriaLabel(chave.categoriaId, customizadas)
      const faixaText = chave.faixa ? ` - ${FAIXA_LABEL[chave.faixa] ?? chave.faixa}` : ''
      const ouro = getChaveVencedorId(chave)
      const prata = getChavePerdedorFinalId(chave)
      const bronzes = getPerdedoresSemifinal(chave)
      const cells = [
        `${titulo}${faixaText}`,
        String(chave.totalAtletas),
        ouro ? resolveNome(ouro) : '—',
        prata ? resolveNome(prata) : '—',
        bronzes.length > 0 ? bronzes.map(id => resolveNome(id)).join(', ') : '—',
      ]
      y = drawTableRow(doc, cells, 30, y, widths)
      drawHorizontalLine(doc, 30, y, pageW)
    }
  }

  // ========== RANKING DE EQUIPES ==========
  doc.addPage()
  y = 30
  doc.save()
  doc.rect(0, 0, doc.page.width, 50).fill(COLORS.primary)
  doc.fontSize(14).fillColor(COLORS.white).font('Helvetica-Bold')
    .text('Ranking de Equipes', 30, 18, { align: 'center', width: pageW })
  doc.restore()
  y = 70

  const equipes = Object.entries(medalhasPorEquipe)
    .map(([nome, m]) => ({ nome, totalAtletas: atletas.filter(a => (a.equipe || 'Sem equipe') === nome).length, ...m }))
    .sort((a, b) => b.ouro - a.ouro || b.prata - a.prata || b.bronze - a.bronze)

  if (equipes.length === 0) {
    doc.fontSize(9).fillColor(COLORS.textMuted).font('Helvetica').text('Nenhuma equipe registrada.', 30, y)
  } else {
    const headers = ['#', 'Equipe', 'Atletas', 'Ouro', 'Prata', 'Bronze']
    const widths = [30, 180, 60, 50, 50, 50]
    y = drawTableHeader(doc, headers, 30, y, widths)

    for (let i = 0; i < equipes.length; i++) {
      if (y > doc.page.height - 50) { doc.addPage(); y = 30; y = drawTableHeader(doc, headers, 30, y, widths) }
      const e = equipes[i]
      const cells = [String(i + 1), capitalize(e.nome), String(e.totalAtletas), String(e.ouro), String(e.prata), String(e.bronze)]
      const bg = i % 2 === 0 ? '#f8f9fa' : undefined
      y = drawTableRow(doc, cells, 30, y, widths, { bgColor: bg })
      drawHorizontalLine(doc, 30, y, pageW)
    }
  }

  // ========== ARBITROS ==========
  doc.addPage()
  y = 30
  doc.save()
  doc.rect(0, 0, doc.page.width, 50).fill(COLORS.primary)
  doc.fontSize(14).fillColor(COLORS.white).font('Helvetica-Bold')
    .text('Árbitros', 30, 18, { align: 'center', width: pageW })
  doc.restore()
  y = 70

  if (arbitros.length === 0) {
    doc.fontSize(9).fillColor(COLORS.textMuted).font('Helvetica').text('Nenhum árbitro cadastrado.', 30, y)
  } else {
    const lutasPorArbitro: Record<string, number> = {}
    for (const c of chaves) {
      if (c.arbitroId) lutasPorArbitro[c.arbitroId] = (lutasPorArbitro[c.arbitroId] ?? 0) + 1
    }
    const headers = ['#', 'Árbitro', 'Faixa', 'Equipe', 'Lutas']
    const widths = [30, 150, 60, 150, 50]
    y = drawTableHeader(doc, headers, 30, y, widths)

    for (let i = 0; i < arbitros.length; i++) {
      if (y > doc.page.height - 50) { doc.addPage(); y = 30; y = drawTableHeader(doc, headers, 30, y, widths) }
      const a = arbitros[i]
      const cells = [String(i + 1), capitalize(a.nome), FAIXA_LABEL[a.faixa] ?? a.faixa, capitalize(a.equipe || '—'), String(lutasPorArbitro[a.id] ?? 0)]
      const bg = i % 2 === 0 ? '#f8f9fa' : undefined
      y = drawTableRow(doc, cells, 30, y, widths, { bgColor: bg })
      drawHorizontalLine(doc, 30, y, pageW)
    }
  }

  // ========== ATLETAS ==========
  doc.addPage()
  y = 30
  doc.save()
  doc.rect(0, 0, doc.page.width, 50).fill(COLORS.primary)
  doc.fontSize(14).fillColor(COLORS.white).font('Helvetica-Bold')
    .text('Atletas', 30, 18, { align: 'center', width: pageW })
  doc.restore()
  y = 70

  if (atletas.length === 0) {
    doc.fontSize(9).fillColor(COLORS.textMuted).font('Helvetica').text('Nenhum atleta cadastrado.', 30, y)
  } else {
    const headers = ['#', 'Atleta', 'Equipe', 'Faixa', 'Peso', 'Categoria', 'Chave']
    const widths = [25, 120, 100, 50, 40, 130, 100]
    y = drawTableHeader(doc, headers, 30, y, widths)

    const sorted = [...atletas].sort((a, b) => a.nome.localeCompare(b.nome))
    for (let i = 0; i < sorted.length; i++) {
      if (y > doc.page.height - 50) { doc.addPage(); y = 30; y = drawTableHeader(doc, headers, 30, y, widths) }
      const a = sorted[i]
      const chave = chaves.find(c => c.posicoesAtletas.includes(a.id))
      const cells = [
        String(i + 1),
        capitalize(a.nome),
        capitalize(a.equipe || '—'),
        FAIXA_LABEL[a.faixa] ?? a.faixa,
        `${a.pesoKg.toFixed(1)}`,
        getCategoriaLabel(a.categoria, customizadas),
        chave ? (chave.nome || getCategoriaLabel(chave.categoriaId, customizadas)) : '—',
      ]
      const bg = i % 2 === 0 ? '#f8f9fa' : undefined
      y = drawTableRow(doc, cells, 30, y, widths, { bgColor: bg, fontSize: 6.5 })
      drawHorizontalLine(doc, 30, y, pageW)
    }
  }

  return collectPdfBuffer(doc)
}
