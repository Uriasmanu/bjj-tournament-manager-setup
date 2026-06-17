import { app, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import type { Atleta } from '../src/types/athlete'
import type { Torneio } from '../src/types/tournament'
import { CATEGORIAS_IBJJF } from '../src/types/category'

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

function loadAthletes(torneioId: string): Atleta[] {
  const torneio = loadTorneio(torneioId)
  const list = torneio.atletas ?? []
  let modified = false
  for (const a of list) {
    if (!a.id) {
      a.id = crypto.randomUUID()
      modified = true
    }
    if (!a.createdAt) {
      a.createdAt = new Date().toISOString()
      modified = true
    }
    if (!a.updatedAt) {
      a.updatedAt = new Date().toISOString()
      modified = true
    }
    if (a.deletedAt === undefined) {
      a.deletedAt = null
      modified = true
    }
  }
  if (modified) {
    torneio.updatedAt = new Date().toISOString()
    saveTorneio(torneio)
  }
  return list.filter(a => a.deletedAt == null)
}

function saveAthlete(torneioId: string, athlete: Atleta): Atleta[] {
  const torneio = loadTorneio(torneioId)
  const list = torneio.atletas ?? []
  const now = new Date().toISOString()
  const data: Atleta = {
    ...athlete,
    id: athlete.id || crypto.randomUUID(),
    createdAt: athlete.createdAt || now,
    updatedAt: now,
    deletedAt: null,
  }
  list.push(data)
  torneio.atletas = list
  torneio.updatedAt = now
  saveTorneio(torneio)
  return list.filter(a => a.deletedAt == null)
}

function updateAthlete(torneioId: string, updated: Atleta): Atleta[] {
  const torneio = loadTorneio(torneioId)
  const list = torneio.atletas ?? []
  const index = list.findIndex(a => a.id === updated.id)
  if (index === -1) throw new Error('Atleta não encontrado')
  const previous = list[index]
  list[index] = {
    ...updated,
    createdAt: previous.createdAt,
    deletedAt: previous.deletedAt ?? null,
    updatedAt: new Date().toISOString(),
  }
  torneio.atletas = list
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
  return list.filter(a => a.deletedAt == null)
}

function deleteAthlete(torneioId: string, id: string): Atleta[] {
  const torneio = loadTorneio(torneioId)
  const list = torneio.atletas ?? []
  const now = new Date().toISOString()
  const index = list.findIndex(a => a.id === id)
  if (index === -1) throw new Error('Atleta não encontrado')
  list[index] = {
    ...list[index],
    deletedAt: now,
    updatedAt: now,
  }
  torneio.atletas = list
  torneio.updatedAt = now
  saveTorneio(torneio)
  return list.filter(a => a.deletedAt == null)
}

function deleteAthletes(torneioId: string, ids: string[]): Atleta[] {
  const torneio = loadTorneio(torneioId)
  const idSet = new Set(ids)
  const list = torneio.atletas ?? []
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
  torneio.atletas = list
  torneio.updatedAt = now
  saveTorneio(torneio)
  return list.filter(a => a.deletedAt == null)
}

function restoreAthlete(torneioId: string, id: string): Atleta[] {
  const torneio = loadTorneio(torneioId)
  const list = torneio.atletas ?? []
  const now = new Date().toISOString()
  const index = list.findIndex(a => a.id === id)
  if (index === -1) throw new Error('Atleta não encontrado')
  list[index] = {
    ...list[index],
    deletedAt: null,
    updatedAt: now,
  }
  torneio.atletas = list
  torneio.updatedAt = now
  saveTorneio(torneio)
  return list.filter(a => a.deletedAt == null)
}

function loadDeletedAthletes(torneioId: string): Atleta[] {
  const torneio = loadTorneio(torneioId)
  const list = torneio.atletas ?? []
  return list.filter(a => a.deletedAt != null)
}

function permanentlyDeleteAthlete(torneioId: string, id: string): Atleta[] {
  const torneio = loadTorneio(torneioId)
  const list = torneio.atletas ?? []
  const index = list.findIndex(a => a.id === id)
  if (index === -1) throw new Error('Atleta não encontrado')
  list.splice(index, 1)
  torneio.atletas = list
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
  return list.filter(a => a.deletedAt == null)
}

function permanentlyDeleteAthletes(torneioId: string, ids: string[]): Atleta[] {
  const torneio = loadTorneio(torneioId)
  const idSet = new Set(ids)
  const list = torneio.atletas ?? []
  torneio.atletas = list.filter(a => !idSet.has(a.id))
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
  return torneio.atletas.filter(a => a.deletedAt == null)
}

function importAthletesFromFile(torneioId: string, filePath: string): { imported: number; skipped: number } {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const incoming: Atleta[] = JSON.parse(raw)

  if (!Array.isArray(incoming)) {
    throw new Error('Arquivo inválido: o conteúdo deve ser um array de atletas.')
  }

  const torneio = loadTorneio(torneioId)
  const categoriasValidas = new Set(CATEGORIAS_IBJJF.map(c => c.id))
  for (const c of (torneio.categoriasCustomizadas ?? [])) {
    categoriasValidas.add(c.id)
  }

  for (const a of incoming) {
    if (!a.nome || !a.equipe || !a.faixa || !a.anoNascimento || !a.pesoKg || !a.genero || !a.categoria) {
      throw new Error(`Atleta inválido no arquivo: "${a.nome || 'sem nome'}" — campos obrigatórios ausentes (categoria, genero).`)
    }
    if (!categoriasValidas.has(a.categoria)) {
      throw new Error(`Atleta inválido no arquivo: "${a.nome}" — categoria "${a.categoria}" não reconhecida.`)
    }
  }

  const current = torneio.atletas ?? []
  let imported = 0
  let skipped = 0

  for (const a of incoming) {
    const nomeLower = a.nome.trim().toLowerCase()
    const equipeLower = a.equipe.trim().toLowerCase()
    const exists = current.some(
      ex =>
        (a.id && ex.id === a.id) ||
        (ex.nome.trim().toLowerCase() === nomeLower && ex.anoNascimento === a.anoNascimento)
    )
    if (!exists) {
      a.nome = nomeLower
      a.equipe = equipeLower
      current.push({
        ...a,
        id: a.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      })
      imported++
    } else {
      skipped++
    }
  }

  torneio.atletas = current
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
  return { imported, skipped }
}

async function openAthleteFileDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
}

async function exportAthletes(torneioId: string): Promise<void> {
  const list = loadAthletes(torneioId)
  const result = await dialog.showSaveDialog({
    title: 'Exportar Atletas',
    defaultPath: 'atletas.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(list, null, 2), 'utf-8')
  }
}

export { loadAthletes, loadDeletedAthletes, saveAthlete, updateAthlete, deleteAthlete, deleteAthletes, restoreAthlete, permanentlyDeleteAthlete, permanentlyDeleteAthletes, importAthletesFromFile, openAthleteFileDialog, exportAthletes }
