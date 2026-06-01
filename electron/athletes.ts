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
  }
  if (modified) {
    torneio.updatedAt = new Date().toISOString()
    saveTorneio(torneio)
  }
  return list
}

function saveAthlete(torneioId: string, athlete: Atleta): Atleta[] {
  const torneio = loadTorneio(torneioId)
  const list = torneio.atletas ?? []
  const data: Atleta = {
    ...athlete,
    id: athlete.id || crypto.randomUUID(),
    createdAt: athlete.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  list.push(data)
  torneio.atletas = list
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
  return list
}

function updateAthlete(torneioId: string, updated: Atleta): Atleta[] {
  const torneio = loadTorneio(torneioId)
  const list = torneio.atletas ?? []
  const index = list.findIndex(a => a.id === updated.id)
  if (index === -1) throw new Error('Atleta não encontrado')
  list[index] = updated
  torneio.atletas = list
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
  return list
}

function deleteAthlete(torneioId: string, id: string): Atleta[] {
  const torneio = loadTorneio(torneioId)
  let list = torneio.atletas ?? []
  list = list.filter(a => a.id !== id)
  torneio.atletas = list
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
  return list
}

function importAthletesFromFile(torneioId: string, filePath: string): { imported: number; skipped: number } {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const incoming: Atleta[] = JSON.parse(raw)

  if (!Array.isArray(incoming)) {
    throw new Error('Arquivo inválido: o conteúdo deve ser um array de atletas.')
  }

  const categoriasValidas = new Set(CATEGORIAS_IBJJF.map(c => c.id))

  for (const a of incoming) {
    if (!a.nome || !a.equipe || !a.faixa || !a.anoNascimento || !a.pesoKg || !a.genero || !a.categoria) {
      throw new Error(`Atleta inválido no arquivo: "${a.nome || 'sem nome'}" — campos obrigatórios ausentes (categoria, genero).`)
    }
    if (!categoriasValidas.has(a.categoria)) {
      throw new Error(`Atleta inválido no arquivo: "${a.nome}" — categoria "${a.categoria}" não reconhecida.`)
    }
  }

  const torneio = loadTorneio(torneioId)
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
        createdAt: a.createdAt || new Date().toISOString(),
        updatedAt: a.updatedAt || new Date().toISOString(),
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

export { loadAthletes, saveAthlete, updateAthlete, deleteAthlete, importAthletesFromFile, openAthleteFileDialog, exportAthletes }
