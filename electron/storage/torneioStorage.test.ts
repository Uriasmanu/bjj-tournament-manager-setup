import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  writeRecord,
  readRecord,
  listRecords,
  listAllRecords,
  deleteRecordFile,
  migrateLegacyTorneioIfNeeded,
  readTorneioMeta,
} from './torneioStorage'

describe('torneioStorage', () => {
  let dataDir: string

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), 'bjj-storage-'))
    vi.stubEnv('BJJ_DATA_DIR_OVERRIDE', dataDir)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(dataDir, { recursive: true, force: true })
  })

  it('writeRecord grava um arquivo por registro e atualiza updatedAt', () => {
    const saved = writeRecord('t1', 'atletas', { id: 'a1', nome: 'joao', updatedAt: '2000-01-01T00:00:00.000Z' } as any)
    expect(saved.updatedAt).not.toBe('2000-01-01T00:00:00.000Z')
    expect(readRecord('t1', 'atletas', 'a1')).toEqual(saved)
  })

  it('listRecords ignora registros com deletedAt preenchido', () => {
    writeRecord('t1', 'atletas', { id: 'a1', updatedAt: '', deletedAt: null } as any)
    writeRecord('t1', 'atletas', { id: 'a2', updatedAt: '', deletedAt: new Date().toISOString() } as any)
    expect(listRecords('t1', 'atletas').map((r: any) => r.id)).toEqual(['a1'])
  })

  it('listAllRecords inclui registros deletados', () => {
    writeRecord('t1', 'atletas', { id: 'a1', updatedAt: '', deletedAt: new Date().toISOString() } as any)
    expect(listAllRecords('t1', 'atletas').map((r: any) => r.id)).toEqual(['a1'])
  })

  it('deleteRecordFile remove o arquivo do disco', () => {
    writeRecord('t1', 'atletas', { id: 'a1', updatedAt: '' } as any)
    deleteRecordFile('t1', 'atletas', 'a1')
    expect(readRecord('t1', 'atletas', 'a1')).toBeNull()
  })

  it('listRecords com parentPath lê lutas aninhadas em uma chave', () => {
    writeRecord('t1', 'lutas', { id: 'l1', updatedAt: '' } as any, 'chaves/c1')
    expect(listRecords('t1', 'lutas', 'chaves/c1').map((r: any) => r.id)).toEqual(['l1'])
  })

  it('migra um torneio no formato antigo (arquivo único) para o novo formato', () => {
    const legacyDir = path.join(dataDir, 'torneios')
    mkdirSync(legacyDir, { recursive: true })
    writeFileSync(path.join(legacyDir, 't1.json'), JSON.stringify({
      id: 't1', nome: 'Copa X', data: '2026-01-01', createdAt: '', updatedAt: '',
      atletas: [{ id: 'a1', nome: 'joao', updatedAt: '2020-01-01T00:00:00.000Z' }],
    }))

    migrateLegacyTorneioIfNeeded('t1')

    expect(readTorneioMeta('t1').nome).toBe('Copa X')
    expect(listRecords('t1', 'atletas').map((r: any) => r.id)).toEqual(['a1'])
    expect(existsSync(path.join(legacyDir, 't1.json.migrated'))).toBe(true)
    expect(existsSync(path.join(legacyDir, 't1.json'))).toBe(false)
  })

  it('migrateLegacyTorneioIfNeeded não faz nada se já está no formato novo', () => {
    writeRecord('t2', 'atletas', { id: 'a1', updatedAt: '' } as any)
    migrateLegacyTorneioIfNeeded('t2') // não deve lançar nem apagar nada
    expect(listRecords('t2', 'atletas').map((r: any) => r.id)).toEqual(['a1'])
  })
})
