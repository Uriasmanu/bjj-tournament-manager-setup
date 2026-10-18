import { dialog } from 'electron'
import fs from 'node:fs'
import crypto from 'node:crypto'
import type { Atleta } from '../src/types/athlete'
import type { Chave } from '../src/types/bracket'
import { CATEGORIAS_IBJJF } from '../src/types/category'
import { listRecords, listAllRecords, readRecord, writeRecord, readTorneioMeta, deleteRecordFile } from './storage/torneioStorage'

function loadAthletes(torneioId: string): Atleta[] {
  const list = listAllRecords<Atleta>(torneioId, 'atletas')
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
    if (a.deletedAt === undefined) {
      a.deletedAt = null
      modified = true
    }
  }
  if (modified) {
    for (const a of list) writeRecord(torneioId, 'atletas', a)
  }
  return list.filter(a => a.deletedAt == null)
}

function saveAthlete(torneioId: string, athlete: Atleta): Atleta[] {
  const now = new Date().toISOString()
  const existing = athlete.id ? readRecord<Atleta>(torneioId, 'atletas', athlete.id) : null
  const data: Atleta = existing
    ? { ...athlete, createdAt: existing.createdAt, deletedAt: existing.deletedAt ?? null, updatedAt: now }
    : { ...athlete, id: athlete.id || crypto.randomUUID(), createdAt: athlete.createdAt || now, updatedAt: now, deletedAt: null }
  writeRecord(torneioId, 'atletas', data)
  return listRecords<Atleta>(torneioId, 'atletas')
}

function updateAthlete(torneioId: string, updated: Atleta): Atleta[] {
  const previous = readRecord<Atleta>(torneioId, 'atletas', updated.id)
  if (!previous) throw new Error('Atleta não encontrado')
  writeRecord(torneioId, 'atletas', {
    ...updated,
    createdAt: previous.createdAt,
    deletedAt: previous.deletedAt ?? null,
  })
  return listRecords<Atleta>(torneioId, 'atletas')
}

function removeAthleteFromChaves(torneioId: string, athleteId: string): void {
  const chaves = listAllRecords<Chave>(torneioId, 'chaves')
  for (const chave of chaves) {
    const posIdx = chave.posicoesAtletas.indexOf(athleteId)
    let changed = false
    if (posIdx !== -1) {
      chave.posicoesAtletas.splice(posIdx, 1)
      chave.totalAtletas = chave.posicoesAtletas.length
      changed = true
    }
    const lutas = listAllRecords<{ id: string; updatedAt: string; atletaAId: string; atletaBId: string } & Record<string, unknown>>(torneioId, 'lutas', `chaves/${chave.id}`)
    for (const luta of lutas) {
      let lutaChanged = false
      if (luta.atletaAId === athleteId) { luta.atletaAId = 'tbd'; lutaChanged = true }
      if (luta.atletaBId === athleteId) { luta.atletaBId = 'tbd'; lutaChanged = true }
      if (lutaChanged) writeRecord(torneioId, 'lutas', luta, `chaves/${chave.id}`)
    }
    if (changed) writeRecord(torneioId, 'chaves', chave)
  }
}

function deleteAthlete(torneioId: string, id: string): Atleta[] {
  const existing = readRecord<Atleta>(torneioId, 'atletas', id)
  if (!existing) throw new Error('Atleta não encontrado')
  const now = new Date().toISOString()
  writeRecord(torneioId, 'atletas', { ...existing, deletedAt: now })
  removeAthleteFromChaves(torneioId, id)
  return listRecords<Atleta>(torneioId, 'atletas')
}

function deleteAthletes(torneioId: string, ids: string[]): Atleta[] {
  const now = new Date().toISOString()
  for (const id of ids) {
    const existing = readRecord<Atleta>(torneioId, 'atletas', id)
    if (existing) writeRecord(torneioId, 'atletas', { ...existing, deletedAt: now })
    removeAthleteFromChaves(torneioId, id)
  }
  return listRecords<Atleta>(torneioId, 'atletas')
}

function restoreAthlete(torneioId: string, id: string): Atleta[] {
  const existing = readRecord<Atleta>(torneioId, 'atletas', id)
  if (!existing) throw new Error('Atleta não encontrado')
  writeRecord(torneioId, 'atletas', { ...existing, deletedAt: null })
  return listRecords<Atleta>(torneioId, 'atletas')
}

function loadDeletedAthletes(torneioId: string): Atleta[] {
  return listAllRecords<Atleta>(torneioId, 'atletas').filter(a => a.deletedAt != null)
}

function permanentlyDeleteAthlete(torneioId: string, id: string): Atleta[] {
  deleteRecordFile(torneioId, 'atletas', id)
  removeAthleteFromChaves(torneioId, id)
  return listRecords<Atleta>(torneioId, 'atletas')
}

function permanentlyDeleteAthletes(torneioId: string, ids: string[]): Atleta[] {
  for (const id of ids) {
    deleteRecordFile(torneioId, 'atletas', id)
    removeAthleteFromChaves(torneioId, id)
  }
  return listRecords<Atleta>(torneioId, 'atletas')
}

function importAthletesFromFile(torneioId: string, filePath: string): { imported: number; skipped: number } {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const incoming: Atleta[] = JSON.parse(raw)

  if (!Array.isArray(incoming)) {
    throw new Error('Arquivo inválido: o conteúdo deve ser um array de atletas.')
  }

  const meta = readTorneioMeta(torneioId)
  const categoriasValidas = new Set(CATEGORIAS_IBJJF.map(c => c.id))
  for (const c of (meta.categoriasCustomizadas ?? [])) {
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

  const current = listAllRecords<Atleta>(torneioId, 'atletas')
  let imported = 0
  let skipped = 0

  for (const a of incoming) {
    const nomeLower = a.nome.trim().toLowerCase()
    const exists = current.some(
      ex =>
        (a.id && ex.id === a.id) ||
        (ex.nome.trim().toLowerCase() === nomeLower && ex.anoNascimento === a.anoNascimento)
    )
    if (!exists) {
      const equipeLower = a.equipe.trim().toLowerCase()
      const data: Atleta = {
        ...a,
        nome: nomeLower,
        equipe: equipeLower,
        id: a.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      }
      writeRecord(torneioId, 'atletas', data)
      current.push(data)
      imported++
    } else {
      skipped++
    }
  }

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
