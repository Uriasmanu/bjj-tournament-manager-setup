import { app, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import type { Arbitro } from '../src/types/referee'
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

function loadArbitros(torneioId: string): Arbitro[] {
  const torneio = loadTorneio(torneioId)
  return torneio.arbitros ?? []
}

function saveArbitro(torneioId: string, data: Omit<Arbitro, 'id' | 'createdAt' | 'updatedAt'>): Arbitro {
  const torneio = loadTorneio(torneioId)
  const list = torneio.arbitros ?? []
  const now = new Date().toISOString()
  const arbitro: Arbitro = {
    id: crypto.randomUUID(),
    nome: data.nome.trim().toLowerCase(),
    equipe: (data.equipe ?? '').trim().toLowerCase(),
    faixa: data.faixa,
    chaveIds: data.chaveIds ?? [],
    createdAt: now,
    updatedAt: now,
  }
  list.push(arbitro)
  torneio.arbitros = list
  torneio.updatedAt = now
  saveTorneio(torneio)
  return arbitro
}

function updateArbitro(torneioId: string, data: Arbitro): Arbitro {
  const torneio = loadTorneio(torneioId)
  const list = torneio.arbitros ?? []
  const index = list.findIndex(a => a.id === data.id)
  if (index === -1) throw new Error('Árbitro não encontrado')
  const now = new Date().toISOString()
  list[index] = {
    ...data,
    nome: data.nome.trim().toLowerCase(),
    updatedAt: now,
  }
  torneio.arbitros = list
  torneio.updatedAt = now
  saveTorneio(torneio)
  return list[index]
}

function deleteArbitro(torneioId: string, arbitroId: string): void {
  const torneio = loadTorneio(torneioId)
  torneio.arbitros = (torneio.arbitros ?? []).filter(a => a.id !== arbitroId)
  const t = torneio as unknown as Record<string, unknown>
  const chaves = t.chaves as { arbitroId?: string | null }[] | undefined
  if (chaves) {
    for (const chave of chaves) {
      if (chave.arbitroId === arbitroId) {
        chave.arbitroId = null
      }
    }
  }
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
}

async function openArbitroFileDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
}

function importArbitrosFromFile(torneioId: string, filePath: string): { imported: number; skipped: number } {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const incoming: unknown[] = JSON.parse(raw)

  if (!Array.isArray(incoming)) {
    throw new Error('Arquivo inválido: o conteúdo deve ser um array de árbitros.')
  }

  const faixasValidas = new Set(['roxa', 'marrom', 'preta'])

  for (const item of incoming) {
    const a = item as Record<string, unknown>
    if (!a.nome || typeof a.nome !== 'string' || a.nome.trim().length < 2) {
      throw new Error(`Árbitro inválido no arquivo: "${a.nome || 'sem nome'}" — nome deve ter ao menos 2 caracteres.`)
    }
    if (!a.faixa || typeof a.faixa !== 'string' || !faixasValidas.has(a.faixa)) {
      throw new Error(`Árbitro inválido no arquivo: "${a.nome}" — faixa inválida.`)
    }
    if (a.equipe !== undefined && (typeof a.equipe !== 'string' || (a.equipe as string).trim().length < 2)) {
      throw new Error(`Árbitro inválido no arquivo: "${a.nome}" — equipe deve ter ao menos 2 caracteres se informada.`)
    }
  }

  const torneio = loadTorneio(torneioId)
  const current = torneio.arbitros ?? []
  let imported = 0
  let skipped = 0

  for (const item of incoming) {
    const a = item as Record<string, unknown>
    const nomeLower = (a.nome as string).trim().toLowerCase()
    const exists = current.some(ex => ex.nome.trim().toLowerCase() === nomeLower)
    if (!exists) {
      current.push({
        ...a,
        id: (a.id as string) || crypto.randomUUID(),
        nome: nomeLower,
        equipe: (a.equipe && typeof a.equipe === 'string' ? (a.equipe as string).trim().toLowerCase() : ''),
        faixa: a.faixa as Arbitro['faixa'],
        chaveIds: (a.chaveIds as string[]) ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      imported++
    } else {
      skipped++
    }
  }

  torneio.arbitros = current
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
  return { imported, skipped }
}

async function exportArbitros(torneioId: string): Promise<void> {
  const list = loadArbitros(torneioId)
  const result = await dialog.showSaveDialog({
    title: 'Exportar Árbitros',
    defaultPath: 'arbitros.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(list, null, 2), 'utf-8')
  }
}

export { loadArbitros, saveArbitro, updateArbitro, deleteArbitro, importArbitrosFromFile, openArbitroFileDialog, exportArbitros }
