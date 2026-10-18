import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import type { Torneio } from '../../src/types/tournament'

export interface StampedRecord {
  id: string
  updatedAt: string
  deletedAt?: string | null
}

function getDataDir(): string {
  if (process.env.BJJ_DATA_DIR_OVERRIDE) return process.env.BJJ_DATA_DIR_OVERRIDE
  return path.join(app.getPath('userData'), 'data')
}

function getTorneiosDir(): string {
  return path.join(getDataDir(), 'torneios')
}

export function getTorneioDir(torneioId: string): string {
  return path.join(getTorneiosDir(), torneioId)
}

function getLegacyTorneioPath(torneioId: string): string {
  return path.join(getTorneiosDir(), `${torneioId}.json`)
}

function getTorneioMetaPath(torneioId: string): string {
  return path.join(getTorneioDir(torneioId), '_torneio.json')
}

function getCollectionDir(torneioId: string, collection: string, parentPath?: string): string {
  const base = parentPath ? path.join(getTorneioDir(torneioId), parentPath) : getTorneioDir(torneioId)
  return path.join(base, collection)
}

function getRecordPath(torneioId: string, collection: string, id: string, parentPath?: string): string {
  if (collection === 'chaves') {
    return path.join(getCollectionDir(torneioId, collection, parentPath), id, '_chave.json')
  }
  return path.join(getCollectionDir(torneioId, collection, parentPath), `${id}.json`)
}

function atomicWriteFile(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const tmpPath = `${filePath}.tmp`
  fs.writeFileSync(tmpPath, contents, 'utf-8')
  fs.renameSync(tmpPath, filePath)
}

export function readTorneioMeta(torneioId: string): Torneio {
  const metaPath = getTorneioMetaPath(torneioId)
  if (!fs.existsSync(metaPath)) throw new Error('Torneio não encontrado')
  return JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
}

export function writeTorneioMeta(meta: Torneio): void {
  atomicWriteFile(getTorneioMetaPath(meta.id), JSON.stringify(meta, null, 2))
}

function readRecordFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

export function readRecord<T extends StampedRecord>(
  torneioId: string,
  collection: string,
  id: string,
  parentPath?: string
): T | null {
  return readRecordFile<T>(getRecordPath(torneioId, collection, id, parentPath))
}

function listRecordFiles(torneioId: string, collection: string, parentPath?: string): string[] {
  if (collection === 'chaves') {
    const dir = getCollectionDir(torneioId, collection, parentPath)
    if (!fs.existsSync(dir)) return []
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(dir, entry.name, '_chave.json'))
      .filter(filePath => fs.existsSync(filePath))
  }
  const dir = getCollectionDir(torneioId, collection, parentPath)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter(name => name.endsWith('.json'))
    .map(name => path.join(dir, name))
}

export function listAllRecords<T extends StampedRecord>(
  torneioId: string,
  collection: string,
  parentPath?: string
): T[] {
  return listRecordFiles(torneioId, collection, parentPath)
    .map(filePath => readRecordFile<T>(filePath))
    .filter((record): record is T => record !== null)
}

export function listRecords<T extends StampedRecord>(
  torneioId: string,
  collection: string,
  parentPath?: string
): T[] {
  return listAllRecords<T>(torneioId, collection, parentPath).filter(record => record.deletedAt == null)
}

export function writeRecord<T extends StampedRecord>(
  torneioId: string,
  collection: string,
  record: T,
  parentPath?: string
): T {
  const stamped: T = { ...record, updatedAt: new Date().toISOString() }
  atomicWriteFile(getRecordPath(torneioId, collection, stamped.id, parentPath), JSON.stringify(stamped, null, 2))
  return stamped
}

export function deleteRecordFile(
  torneioId: string,
  collection: string,
  id: string,
  parentPath?: string
): void {
  if (collection === 'chaves' && !parentPath) {
    const chaveDir = path.join(getCollectionDir(torneioId, collection), id)
    if (fs.existsSync(chaveDir)) fs.rmSync(chaveDir, { recursive: true, force: true })
    return
  }
  const filePath = getRecordPath(torneioId, collection, id, parentPath)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

function pickTorneioMeta(torneio: Torneio): Torneio {
  return {
    id: torneio.id,
    nome: torneio.nome,
    data: torneio.data,
    createdAt: torneio.createdAt,
    updatedAt: torneio.updatedAt,
    startedAt: torneio.startedAt,
    categoriasDesabilitadas: torneio.categoriasDesabilitadas,
    categoriasCustomizadas: torneio.categoriasCustomizadas,
  }
}

const LEGACY_COLLECTIONS: Array<{ key: keyof Torneio; collection: string }> = [
  { key: 'atletas', collection: 'atletas' },
  { key: 'arbitros', collection: 'arbitros' },
  { key: 'areas', collection: 'areas' },
  { key: 'lutasCasadas', collection: 'lutasCasadas' },
]

export function migrateLegacyTorneioIfNeeded(torneioId: string): void {
  const legacyPath = getLegacyTorneioPath(torneioId)
  if (!fs.existsSync(legacyPath)) return

  const legacy: Torneio = JSON.parse(fs.readFileSync(legacyPath, 'utf-8'))

  writeTorneioMeta(pickTorneioMeta(legacy))
  const { chaves } = legacy

  for (const { key, collection } of LEGACY_COLLECTIONS) {
    const list = (legacy[key] as StampedRecord[] | undefined) ?? []
    for (const record of list) {
      atomicWriteFile(
        getRecordPath(torneioId, collection, record.id),
        JSON.stringify(record, null, 2)
      )
    }
  }

  for (const chave of chaves ?? []) {
    const { lutas, ...chaveMeta } = chave as unknown as { id: string; lutas?: StampedRecord[] } & Record<string, unknown>
    atomicWriteFile(
      getRecordPath(torneioId, 'chaves', chaveMeta.id),
      JSON.stringify(chaveMeta, null, 2)
    )
    for (const luta of lutas ?? []) {
      atomicWriteFile(
        getRecordPath(torneioId, 'lutas', luta.id, `chaves/${chaveMeta.id}`),
        JSON.stringify(luta, null, 2)
      )
    }
  }

  fs.renameSync(legacyPath, `${legacyPath}.migrated`)
}

const COMPAT_COLLECTIONS: Array<{ key: 'atletas' | 'arbitros' | 'areas' | 'lutasCasadas'; collection: string }> = [
  { key: 'atletas', collection: 'atletas' },
  { key: 'arbitros', collection: 'arbitros' },
  { key: 'areas', collection: 'areas' },
  { key: 'lutasCasadas', collection: 'lutasCasadas' },
]

export function loadTorneioCompat(torneioId: string): Torneio {
  migrateLegacyTorneioIfNeeded(torneioId)
  const meta = readTorneioMeta(torneioId)
  const chaves = listAllRecords<Record<string, unknown> & StampedRecord>(torneioId, 'chaves').map(chaveMeta => ({
    ...chaveMeta,
    lutas: listAllRecords(torneioId, 'lutas', `chaves/${chaveMeta.id}`),
  }))

  return {
    ...meta,
    atletas: listAllRecords(torneioId, 'atletas'),
    arbitros: listAllRecords(torneioId, 'arbitros'),
    areas: listAllRecords(torneioId, 'areas'),
    lutasCasadas: listAllRecords(torneioId, 'lutasCasadas'),
    chaves: chaves as Torneio['chaves'],
  } as Torneio
}

function sameRecordIgnoringUpdatedAt(a: unknown, b: unknown): boolean {
  const strip = (x: unknown) => JSON.stringify(x, (key, value) => (key === 'updatedAt' ? undefined : value))
  return strip(a) === strip(b)
}

function writeRecordIfChanged<T extends StampedRecord>(
  torneioId: string,
  collection: string,
  record: T,
  parentPath?: string
): void {
  const existing = readRecord<T>(torneioId, collection, record.id, parentPath)
  if (existing && sameRecordIgnoringUpdatedAt(existing, record)) return
  writeRecord(torneioId, collection, record, parentPath)
}

function pruneRemovedRecords(
  torneioId: string,
  collection: string,
  incoming: StampedRecord[],
  parentPath?: string
): void {
  const incomingIds = new Set(incoming.map(r => r.id))
  for (const existing of listAllRecords<StampedRecord>(torneioId, collection, parentPath)) {
    if (!incomingIds.has(existing.id)) deleteRecordFile(torneioId, collection, existing.id, parentPath)
  }
}

export function saveTorneioCompat(torneio: Torneio): void {
  const { atletas, arbitros, areas, lutasCasadas, chaves, ...meta } = torneio
  writeTorneioMeta(meta as Torneio)

  const byKey: Record<string, StampedRecord[] | undefined> = { atletas, arbitros, areas, lutasCasadas }
  for (const { key, collection } of COMPAT_COLLECTIONS) {
    const records = (byKey[key] as StampedRecord[] | undefined) ?? []
    pruneRemovedRecords(torneio.id, collection, records)
    for (const record of records) {
      writeRecordIfChanged(torneio.id, collection, record)
    }
  }

  const chaveRecords = (chaves ?? []) as unknown as Array<{ id: string; lutas?: StampedRecord[] } & Record<string, unknown>>
  pruneRemovedRecords(torneio.id, 'chaves', chaveRecords.map(c => ({ id: c.id, updatedAt: '' })))
  for (const chave of chaveRecords) {
    const { lutas, ...chaveMeta } = chave
    writeRecordIfChanged(torneio.id, 'chaves', chaveMeta as unknown as StampedRecord)
    pruneRemovedRecords(torneio.id, 'lutas', lutas ?? [], `chaves/${chaveMeta.id}`)
    for (const luta of lutas ?? []) {
      writeRecordIfChanged(torneio.id, 'lutas', luta, `chaves/${chaveMeta.id}`)
    }
  }
}

export function listTournamentIds(): string[] {
  const dir = getTorneiosDir()
  if (!fs.existsSync(dir)) return []
  const ids = new Set<string>()
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      ids.add(entry.name)
    } else if (entry.name.endsWith('.json') && !entry.name.endsWith('.migrated')) {
      ids.add(entry.name.replace(/\.json$/, ''))
    }
  }
  return Array.from(ids)
}
