import { app, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import type { AreaLuta } from '../src/types/area'
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

function gerarNomeAreaPadrao(areas: AreaLuta[]): string {
  const usados = new Set<number>()
  for (const a of areas) {
    const m = a.nome.match(/^Área (\d+)$/i)
    if (m) usados.add(Number(m[1]))
  }
  let n = 1
  while (usados.has(n)) n += 1
  return `Área ${n}`
}

function normalizeArea(area: Record<string, unknown>): AreaLuta {
  return {
    id: area.id as string,
    nome: (area.nome as string) ?? '',
    arbitroIds: Array.isArray(area.arbitroIds)
      ? (area.arbitroIds as string[]).filter(Boolean)
      : area.arbitroId
        ? [(area.arbitroId as string)]
        : [],
    createdAt: (area.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (area.updatedAt as string) ?? new Date().toISOString(),
    deletedAt: (area.deletedAt as string | null | undefined) ?? null,
  }
}

function loadAreas(torneioId: string): AreaLuta[] {
  const torneio = loadTorneio(torneioId)
  const list = (torneio.areas ?? []).map(a => normalizeArea(a as unknown as Record<string, unknown>))
  return list.filter(a => a.deletedAt == null)
}

function checkRefereeNotInUse(torneioId: string, arbitroIds: string[], excludeAreaId?: string): void {
  const ids = arbitroIds ?? []
  if (ids.length === 0) return

  const torneio = loadTorneio(torneioId)
  const arbitrosAtivos = (torneio.arbitros ?? []).filter((a: { deletedAt?: string | null }) => a.deletedAt == null)
  const idsAtivos = new Set(arbitrosAtivos.map(r => r.id))
  const invalidos = ids.filter(id => id && !idsAtivos.has(id))
  if (invalidos.length > 0) {
    throw new Error('Um ou mais árbitros não existem ou estão deletados.')
  }

  const areas = loadAreas(torneioId)
  const assigned = new Set<string>()
  for (const area of areas) {
    if (area.id === excludeAreaId) continue
    for (const rid of area.arbitroIds) {
      assigned.add(rid)
    }
  }
  const conflict = ids.filter(rid => rid && assigned.has(rid))
  if (conflict.length > 0) {
    throw new Error('Um ou mais árbitros já estão atribuídos a outra área de luta.')
  }
}

function saveArea(torneioId: string, data: { nome: string; arbitroIds: string[] }): AreaLuta {
  const arbitroIds = data.arbitroIds ?? []
  checkRefereeNotInUse(torneioId, arbitroIds)
  const torneio = loadTorneio(torneioId)
  const allAreas = (torneio.areas ?? []).map(a => normalizeArea(a as unknown as Record<string, unknown>))
  const activeAreas = allAreas.filter(a => a.deletedAt == null)
  const now = new Date().toISOString()
  const nomeFinal = data.nome.trim() === '' ? gerarNomeAreaPadrao(activeAreas) : data.nome.trim()
  const area: AreaLuta = {
    id: crypto.randomUUID(),
    nome: nomeFinal,
    arbitroIds: arbitroIds.filter(Boolean),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  allAreas.push(area)
  torneio.areas = allAreas
  torneio.updatedAt = now
  saveTorneio(torneio)
  return area
}

function updateArea(torneioId: string, data: AreaLuta): AreaLuta {
  const arbitroIds = data.arbitroIds ?? []
  checkRefereeNotInUse(torneioId, arbitroIds, data.id)
  const torneio = loadTorneio(torneioId)
  const allAreas = (torneio.areas ?? []).map(a => normalizeArea(a as unknown as Record<string, unknown>))
  const index = allAreas.findIndex(a => a.id === data.id)
  if (index === -1) throw new Error('Área de luta não encontrada')
  const previous = allAreas[index]
  const now = new Date().toISOString()
  const activeOthers = allAreas.filter(a => a.deletedAt == null && a.id !== data.id)
  const nomeFinal = data.nome.trim() === '' ? gerarNomeAreaPadrao(activeOthers) : data.nome.trim()
  allAreas[index] = {
    ...data,
    nome: nomeFinal,
    arbitroIds: arbitroIds.filter(Boolean),
    createdAt: previous.createdAt,
    deletedAt: previous.deletedAt ?? null,
    updatedAt: now,
  }
  torneio.areas = allAreas
  torneio.updatedAt = now
  saveTorneio(torneio)
  return allAreas[index]
}

function deleteArea(torneioId: string, areaId: string): void {
  const torneio = loadTorneio(torneioId)
  const list = torneio.areas ?? []
  const now = new Date().toISOString()
  const index = list.findIndex(a => a.id === areaId)
  if (index === -1) throw new Error('Área de luta não encontrada')
  list[index] = {
    ...list[index],
    deletedAt: now,
    updatedAt: now,
  }
  torneio.areas = list
  torneio.updatedAt = now
  saveTorneio(torneio)
}

function deleteAreas(torneioId: string, areaIds: string[]): void {
  const torneio = loadTorneio(torneioId)
  const idSet = new Set(areaIds)
  const list = torneio.areas ?? []
  const now = new Date().toISOString()
  for (let i = 0; i < list.length; i += 1) {
    if (idSet.has(list[i].id)) {
      list[i] = {
        ...list[i],
        deletedAt: now,
        updatedAt: now,
      }
    }
  }
  torneio.areas = list
  torneio.updatedAt = now
  saveTorneio(torneio)
}

function restoreArea(torneioId: string, areaId: string): void {
  const torneio = loadTorneio(torneioId)
  const list = torneio.areas ?? []
  const now = new Date().toISOString()
  const index = list.findIndex(a => a.id === areaId)
  if (index === -1) throw new Error('Área de luta não encontrada')
  list[index] = {
    ...list[index],
    deletedAt: null,
    updatedAt: now,
  }
  torneio.areas = list
  torneio.updatedAt = now
  saveTorneio(torneio)
}

function loadDeletedAreas(torneioId: string): AreaLuta[] {
  const torneio = loadTorneio(torneioId)
  const list = (torneio.areas ?? []).map(a => normalizeArea(a as unknown as Record<string, unknown>))
  return list.filter(a => a.deletedAt != null)
}

function permanentlyDeleteArea(torneioId: string, areaId: string): void {
  const torneio = loadTorneio(torneioId)
  const list = torneio.areas ?? []
  const index = list.findIndex(a => a.id === areaId)
  if (index === -1) throw new Error('Área de luta não encontrada')
  list.splice(index, 1)
  torneio.areas = list
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
}

function permanentlyDeleteAreas(torneioId: string, areaIds: string[]): void {
  const torneio = loadTorneio(torneioId)
  const idSet = new Set(areaIds)
  const list = torneio.areas ?? []
  torneio.areas = list.filter(a => !idSet.has(a.id))
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
}

function importAreasFromFile(torneioId: string, filePath: string): { imported: number; skipped: number } {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const incoming: unknown = JSON.parse(raw)

  if (!Array.isArray(incoming)) {
    throw new Error('Arquivo inválido: o conteúdo deve ser um array de áreas de luta.')
  }

  const torneio = loadTorneio(torneioId)
  const allAreas = (torneio.areas ?? []).map(a => normalizeArea(a as unknown as Record<string, unknown>))
  const activeAreas = allAreas.filter(a => a.deletedAt == null)
  const now = new Date().toISOString()
  let imported = 0
  let skipped = 0

  for (const item of incoming) {
    if (!item || typeof item !== 'object') {
      throw new Error('Área inválida no arquivo: formato incorreto.')
    }
    const itemObj = item as Record<string, unknown>
    if (itemObj.arbitroIds !== undefined && !Array.isArray(itemObj.arbitroIds)) {
      throw new Error(`Área inválida no arquivo: "${String(itemObj.nome ?? 'sem nome')}" — arbitroIds deve ser um array.`)
    }

    const nomeRaw = typeof itemObj.nome === 'string' ? itemObj.nome.trim() : ''
    const arbitroIdsIn = Array.isArray(itemObj.arbitroIds)
      ? (itemObj.arbitroIds as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0)
      : []

    const duplicate = activeAreas.some(
      (ex) => ex.nome.trim().toLowerCase() === nomeRaw.toLowerCase() && nomeRaw !== ''
    )
    if (duplicate) {
      skipped += 1
      continue
    }

    checkRefereeNotInUse(torneioId, arbitroIdsIn)

    const nomeFinal = nomeRaw === '' ? gerarNomeAreaPadrao(activeAreas) : nomeRaw
    const area: AreaLuta = {
      id: crypto.randomUUID(),
      nome: nomeFinal,
      arbitroIds: arbitroIdsIn,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }
    allAreas.push(area)
    activeAreas.push(area)
    imported += 1
  }

  torneio.areas = allAreas
  torneio.updatedAt = now
  saveTorneio(torneio)
  return { imported, skipped }
}

async function openAreaFileDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
}

async function exportAreas(torneioId: string): Promise<void> {
  const list = loadAreas(torneioId)
  const result = await dialog.showSaveDialog({
    title: 'Exportar Áreas de Luta',
    defaultPath: 'areas.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(list, null, 2), 'utf-8')
  }
}

export { loadAreas, loadDeletedAreas, saveArea, updateArea, deleteArea, deleteAreas, restoreArea, permanentlyDeleteArea, permanentlyDeleteAreas, importAreasFromFile, openAreaFileDialog, exportAreas }
