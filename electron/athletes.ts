import { app } from 'electron'
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

export { loadAthletes, saveAthlete, updateAthlete, deleteAthlete }
