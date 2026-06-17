import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import type { Torneio } from '../src/types/tournament'
import type { CategoriaCustomizada } from '../src/types/category'

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

function loadCategorias(torneioId: string): { desabilitadas: string[]; customizadas: CategoriaCustomizada[] } {
  const torneio = loadTorneio(torneioId)
  return {
    desabilitadas: torneio.categoriasDesabilitadas ?? [],
    customizadas: torneio.categoriasCustomizadas ?? [],
  }
}

function toggleCategoria(torneioId: string, categoriaId: string): string[] {
  const torneio = loadTorneio(torneioId)
  const list = torneio.categoriasDesabilitadas ?? []
  const index = list.indexOf(categoriaId)
  if (index === -1) {
    list.push(categoriaId)
  } else {
    list.splice(index, 1)
  }
  torneio.categoriasDesabilitadas = list
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
  return list
}

function saveCategoriaCustomizada(torneioId: string, data: Omit<CategoriaCustomizada, 'id' | 'createdAt' | 'updatedAt'>): CategoriaCustomizada {
  const torneio = loadTorneio(torneioId)
  const list = torneio.categoriasCustomizadas ?? []
  const now = new Date().toISOString()
  const nova: CategoriaCustomizada = {
    ...data,
    id: `custom-${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  }
  list.push(nova)
  torneio.categoriasCustomizadas = list
  torneio.updatedAt = now
  saveTorneio(torneio)
  return nova
}

function updateCategoriaCustomizada(torneioId: string, updated: CategoriaCustomizada): CategoriaCustomizada {
  const torneio = loadTorneio(torneioId)
  const list = torneio.categoriasCustomizadas ?? []
  const index = list.findIndex(c => c.id === updated.id)
  if (index === -1) throw new Error('Categoria customizada não encontrada')
  const previous = list[index]
  list[index] = {
    ...updated,
    createdAt: previous.createdAt,
    updatedAt: new Date().toISOString(),
  }
  torneio.categoriasCustomizadas = list
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
  return list[index]
}

function deleteCategoriaCustomizada(torneioId: string, categoriaId: string): void {
  const torneio = loadTorneio(torneioId)
  const list = torneio.categoriasCustomizadas ?? []
  const index = list.findIndex(c => c.id === categoriaId)
  if (index === -1) throw new Error('Categoria customizada não encontrada')
  list.splice(index, 1)
  torneio.categoriasCustomizadas = list
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
}

export {
  loadCategorias,
  toggleCategoria,
  saveCategoriaCustomizada,
  updateCategoriaCustomizada,
  deleteCategoriaCustomizada,
}
