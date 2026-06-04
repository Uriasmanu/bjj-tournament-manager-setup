import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import type { LutaCasada, AtletaSnapshot, LutaCasadaStatus } from '../src/types/lutaCasada'
import type { Torneio } from '../src/types/tournament'

const DATA_DIR = path.join(app.getPath('userData'), 'data')
const TORNEIOS_DIR = path.join(DATA_DIR, 'torneios')

function getTorneioPath(torneioId: string): string {
  return path.join(TORNEIOS_DIR, `${torneioId}.json`)
}

function loadTorneio(torneioId: string): Torneio {
  const filePath = getTorneioPath(torneioId)
  if (!fs.existsSync(filePath)) throw new Error('Torneio não encontrado')
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function saveTorneio(torneio: Torneio): void {
  fs.writeFileSync(getTorneioPath(torneio.id), JSON.stringify(torneio, null, 2), 'utf-8')
}

function normalizeLutaCasada(raw: Record<string, unknown>): LutaCasada {
  const status = (raw.status as LutaCasadaStatus) ?? 'pending'
  return {
    id: raw.id as string,
    areaId: raw.areaId as string,
    arbitroId: (raw.arbitroId as string | null) ?? null,
    atletaAId: raw.atletaAId as string,
    atletaBId: raw.atletaBId as string,
    atletaASnapshot: raw.atletaASnapshot as AtletaSnapshot,
    atletaBSnapshot: raw.atletaBSnapshot as AtletaSnapshot,
    tag: 'luta-casada',
    status,
    placarA: raw.placarA as LutaCasada['placarA'],
    placarB: raw.placarB as LutaCasada['placarB'],
    vencedorId: (raw.vencedorId as string | null | undefined) ?? null,
    finalizacao: (raw.finalizacao as boolean | undefined) ?? false,
    desclassificacao: (raw.desclassificacao as boolean | undefined) ?? false,
    desempateArbitro: (raw.desempateArbitro as boolean | undefined) ?? false,
    dataFinalizacao: (raw.dataFinalizacao as string | null | undefined) ?? null,
    createdAt: (raw.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (raw.updatedAt as string) ?? new Date().toISOString(),
  }
}

function loadLutasCasadas(torneioId: string): LutaCasada[] {
  const torneio = loadTorneio(torneioId)
  return (torneio.lutasCasadas ?? []).map(l => normalizeLutaCasada(l as unknown as Record<string, unknown>))
}

function loadLutasCasadasPorArea(torneioId: string, areaId: string): LutaCasada[] {
  return loadLutasCasadas(torneioId).filter(l => l.areaId === areaId)
}

function saveLutaCasada(
  torneioId: string,
  data: Omit<LutaCasada, 'id' | 'tag' | 'createdAt' | 'updatedAt' | 'status'> & { status?: LutaCasadaStatus }
): LutaCasada {
  if (data.atletaAId === data.atletaBId) {
    throw new Error('Atleta A e Atleta B não podem ser o mesmo atleta.')
  }
  const torneio = loadTorneio(torneioId)
  const list = loadLutasCasadas(torneioId)
  const now = new Date().toISOString()
  const luta: LutaCasada = {
    id: crypto.randomUUID(),
    areaId: data.areaId,
    arbitroId: data.arbitroId,
    atletaAId: data.atletaAId,
    atletaBId: data.atletaBId,
    atletaASnapshot: data.atletaASnapshot,
    atletaBSnapshot: data.atletaBSnapshot,
    tag: 'luta-casada',
    status: data.status ?? 'pending',
    placarA: data.placarA,
    placarB: data.placarB,
    vencedorId: data.vencedorId ?? null,
    finalizacao: data.finalizacao ?? false,
    desclassificacao: data.desclassificacao ?? false,
    desempateArbitro: data.desempateArbitro ?? false,
    dataFinalizacao: data.dataFinalizacao ?? null,
    createdAt: now,
    updatedAt: now,
  }
  list.push(luta)
  torneio.lutasCasadas = list
  torneio.updatedAt = now
  saveTorneio(torneio)
  return luta
}

function updateLutaCasada(torneioId: string, data: LutaCasada): LutaCasada {
  if (data.atletaAId === data.atletaBId) {
    throw new Error('Atleta A e Atleta B não podem ser o mesmo atleta.')
  }
  const torneio = loadTorneio(torneioId)
  const list = loadLutasCasadas(torneioId)
  const index = list.findIndex(l => l.id === data.id)
  if (index === -1) throw new Error('Luta casada não encontrada')
  const now = new Date().toISOString()
  const updated: LutaCasada = {
    ...data,
    tag: 'luta-casada',
    updatedAt: now,
  }
  list[index] = updated
  torneio.lutasCasadas = list
  torneio.updatedAt = now
  saveTorneio(torneio)
  return updated
}

function deleteLutaCasada(torneioId: string, lutaCasadaId: string): void {
  const torneio = loadTorneio(torneioId)
  torneio.lutasCasadas = (torneio.lutasCasadas ?? []).filter(l => l.id !== lutaCasadaId)
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
}

export { loadLutasCasadasPorArea, saveLutaCasada, updateLutaCasada, deleteLutaCasada }
