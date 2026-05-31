import { app, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import type { Atleta } from '../src/types/athlete'

const DATA_DIR = path.join(app.getPath('userData'), 'data')
const FILE = path.join(DATA_DIR, 'atletas.json')

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function loadAthletes(): Atleta[] {
  ensureDataDir()
  if (!fs.existsSync(FILE)) return []
  return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
}

function saveAthlete(athlete: Atleta): Atleta[] {
  const list = loadAthletes()
  list.push(athlete)
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), 'utf-8')
  return list
}

function updateAthlete(updated: Atleta): Atleta[] {
  const list = loadAthletes()
  const index = list.findIndex(a => a.id === updated.id)
  if (index === -1) throw new Error('Atleta não encontrado')
  list[index] = updated
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), 'utf-8')
  return list
}

function deleteAthlete(id: string): Atleta[] {
  let list = loadAthletes()
  list = list.filter(a => a.id !== id)
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), 'utf-8')
  return list
}

function importAthletesFromFile(filePath: string): { imported: number; skipped: number } {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const incoming: Atleta[] = JSON.parse(raw)

  if (!Array.isArray(incoming)) {
    throw new Error('Arquivo inválido: o conteúdo deve ser um array de atletas.')
  }

  for (const a of incoming) {
    if (!a.id || !a.nome || !a.equipe || !a.faixa || !a.anoNascimento || !a.pesoKg) {
      throw new Error(`Atleta inválido no arquivo: "${a.nome || 'sem nome'}" — campos obrigatórios ausentes.`)
    }
  }

  const current = loadAthletes()
  let imported = 0
  let skipped = 0

  for (const a of incoming) {
    const nomeLower = a.nome.trim().toLowerCase()
    const equipeLower = a.equipe.trim().toLowerCase()
    const exists = current.some(
      ex =>
        ex.id === a.id ||
        (ex.nome.trim().toLowerCase() === nomeLower && ex.anoNascimento === a.anoNascimento)
    )
    if (!exists) {
      a.nome = nomeLower
      a.equipe = equipeLower
      current.push({
        ...a,
        createdAt: a.createdAt || new Date().toISOString(),
        updatedAt: a.updatedAt || new Date().toISOString(),
      })
      imported++
    } else {
      skipped++
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(current, null, 2), 'utf-8')
  return { imported, skipped }
}

async function openAthleteFileDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
}

export { loadAthletes, saveAthlete, updateAthlete, deleteAthlete, importAthletesFromFile, openAthleteFileDialog }
