import { app } from 'electron'
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
  }
}

function loadAreas(torneioId: string): AreaLuta[] {
  const torneio = loadTorneio(torneioId)
  return (torneio.areas ?? []).map(a => normalizeArea(a as unknown as Record<string, unknown>))
}

function checkRefereeNotInUse(torneioId: string, arbitroIds: string[], excludeAreaId?: string): void {
  const ids = arbitroIds ?? []
  if (ids.length === 0) return
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
  const list = loadAreas(torneioId)
  const now = new Date().toISOString()
  const area: AreaLuta = {
    id: crypto.randomUUID(),
    nome: data.nome.trim(),
    arbitroIds: arbitroIds.filter(Boolean),
    createdAt: now,
    updatedAt: now,
  }
  list.push(area)
  torneio.areas = list
  torneio.updatedAt = now
  saveTorneio(torneio)
  return area
}

function updateArea(torneioId: string, data: AreaLuta): AreaLuta {
  const arbitroIds = data.arbitroIds ?? []
  checkRefereeNotInUse(torneioId, arbitroIds, data.id)
  const torneio = loadTorneio(torneioId)
  const list = loadAreas(torneioId)
  const index = list.findIndex(a => a.id === data.id)
  if (index === -1) throw new Error('Área de luta não encontrada')
  const now = new Date().toISOString()
  list[index] = {
    ...data,
    nome: data.nome.trim(),
    arbitroIds: arbitroIds.filter(Boolean),
    updatedAt: now,
  }
  torneio.areas = list
  torneio.updatedAt = now
  saveTorneio(torneio)
  return list[index]
}

function deleteArea(torneioId: string, areaId: string): void {
  const torneio = loadTorneio(torneioId)
  torneio.areas = (torneio.areas ?? []).filter(a => a.id !== areaId)
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
}

function deleteAreas(torneioId: string, areaIds: string[]): void {
  const torneio = loadTorneio(torneioId)
  const idSet = new Set(areaIds)
  torneio.areas = (torneio.areas ?? []).filter(a => !idSet.has(a.id))
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
}

export { loadAreas, saveArea, updateArea, deleteArea, deleteAreas }
