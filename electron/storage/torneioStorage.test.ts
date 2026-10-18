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
  loadTorneioCompat,
  saveTorneioCompat,
  getTorneioDir,
} from './torneioStorage'
import type { Torneio } from '../../src/types/tournament'

interface TestRecord {
  id: string
  updatedAt: string
  deletedAt?: string | null
  nome?: string
  [key: string]: unknown
}

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
    const saved = writeRecord<TestRecord>('t1', 'atletas', { id: 'a1', nome: 'joao', updatedAt: '2000-01-01T00:00:00.000Z' })
    expect(saved.updatedAt).not.toBe('2000-01-01T00:00:00.000Z')
    expect(readRecord<TestRecord>('t1', 'atletas', 'a1')).toEqual(saved)
  })

  it('listRecords ignora registros com deletedAt preenchido', () => {
    writeRecord<TestRecord>('t1', 'atletas', { id: 'a1', updatedAt: '', deletedAt: null })
    writeRecord<TestRecord>('t1', 'atletas', { id: 'a2', updatedAt: '', deletedAt: new Date().toISOString() })
    expect(listRecords<TestRecord>('t1', 'atletas').map(r => r.id)).toEqual(['a1'])
  })

  it('listAllRecords inclui registros deletados', () => {
    writeRecord<TestRecord>('t1', 'atletas', { id: 'a1', updatedAt: '', deletedAt: new Date().toISOString() })
    expect(listAllRecords<TestRecord>('t1', 'atletas').map(r => r.id)).toEqual(['a1'])
  })

  it('deleteRecordFile remove o arquivo do disco', () => {
    writeRecord<TestRecord>('t1', 'atletas', { id: 'a1', updatedAt: '' })
    deleteRecordFile('t1', 'atletas', 'a1')
    expect(readRecord<TestRecord>('t1', 'atletas', 'a1')).toBeNull()
  })

  it('listRecords com parentPath lê lutas aninhadas em uma chave', () => {
    writeRecord<TestRecord>('t1', 'lutas', { id: 'l1', updatedAt: '' }, 'chaves/c1')
    expect(listRecords<TestRecord>('t1', 'lutas', 'chaves/c1').map(r => r.id)).toEqual(['l1'])
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
    expect(listRecords<TestRecord>('t1', 'atletas').map(r => r.id)).toEqual(['a1'])
    expect(existsSync(path.join(legacyDir, 't1.json.migrated'))).toBe(true)
    expect(existsSync(path.join(legacyDir, 't1.json'))).toBe(false)
  })

  it('migrateLegacyTorneioIfNeeded atribui um id a registros legados sem id, em vez de colidir em um arquivo só', () => {
    const legacyDir = path.join(dataDir, 'torneios')
    mkdirSync(legacyDir, { recursive: true })
    writeFileSync(path.join(legacyDir, 't9.json'), JSON.stringify({
      id: 't9', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '',
      atletas: [{ nome: 'joao', updatedAt: '' }, { nome: 'pedro', updatedAt: '' }],
    }))

    migrateLegacyTorneioIfNeeded('t9')

    const atletas = listRecords<TestRecord>('t9', 'atletas')
    expect(atletas).toHaveLength(2)
    expect(new Set(atletas.map(a => a.id)).size).toBe(2)
    expect(atletas.every(a => !!a.id)).toBe(true)
  })

  it('migrateLegacyTorneioIfNeeded não faz nada se já está no formato novo', () => {
    writeRecord<TestRecord>('t2', 'atletas', { id: 'a1', updatedAt: '' })
    migrateLegacyTorneioIfNeeded('t2') // não deve lançar nem apagar nada
    expect(listRecords<TestRecord>('t2', 'atletas').map(r => r.id)).toEqual(['a1'])
  })

  describe('loadTorneioCompat / saveTorneioCompat', () => {
    it('faz round-trip de um torneio completo (atletas, arbitros, areas, lutasCasadas, chaves com lutas)', () => {
      saveTorneioCompat({
        id: 't3', nome: 'Copa Y', data: '2026-02-01', createdAt: '', updatedAt: '',
        atletas: [{ id: 'a1', nome: 'joao', updatedAt: '' }] as unknown as Torneio['atletas'],
        arbitros: [{ id: 'r1', nome: 'carlos', updatedAt: '' }] as unknown as Torneio['arbitros'],
        areas: [{ id: 'ar1', nome: 'Área 1', updatedAt: '' }] as unknown as Torneio['areas'],
        lutasCasadas: [{ id: 'lc1', updatedAt: '' }] as unknown as Torneio['lutasCasadas'],
        chaves: [{ id: 'c1', updatedAt: '', lutas: [{ id: 'l1', updatedAt: '' }] }] as unknown as Torneio['chaves'],
      })

      const loaded = loadTorneioCompat('t3')

      expect(loaded.nome).toBe('Copa Y')
      expect(loaded.atletas?.map(a => a.id)).toEqual(['a1'])
      expect(loaded.arbitros?.map(a => a.id)).toEqual(['r1'])
      expect(loaded.areas?.map(a => a.id)).toEqual(['ar1'])
      expect(loaded.lutasCasadas?.map(l => l.id)).toEqual(['lc1'])
      expect(loaded.chaves?.[0]?.id).toBe('c1')
      expect(loaded.chaves?.[0]?.lutas?.map(l => l.id)).toEqual(['l1'])
    })

    it('remove do disco um atleta que não está mais no array salvo (ex.: exclusão permanente)', () => {
      saveTorneioCompat({
        id: 't6', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '',
        atletas: [{ id: 'a1', updatedAt: '' }, { id: 'a2', updatedAt: '' }] as unknown as Torneio['atletas'],
      })
      saveTorneioCompat({
        id: 't6', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '',
        atletas: [{ id: 'a1', updatedAt: '' }] as unknown as Torneio['atletas'],
      })
      expect(loadTorneioCompat('t6').atletas?.map(a => a.id)).toEqual(['a1'])
    })

    it('remove a pasta inteira de uma chave (e suas lutas) quando ela não está mais no array salvo', () => {
      saveTorneioCompat({
        id: 't7', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '',
        chaves: [{ id: 'c1', updatedAt: '', lutas: [{ id: 'l1', updatedAt: '' }] }] as unknown as Torneio['chaves'],
      })
      saveTorneioCompat({
        id: 't7', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '',
        chaves: [],
      })
      const loaded = loadTorneioCompat('t7')
      expect(loaded.chaves).toEqual([])
      expect(existsSync(getTorneioDir('t7') + '/chaves/c1')).toBe(false)
    })

    it('remove lutas antigas de uma chave quando a chave é regravada com ids de luta diferentes (ex.: randomizar)', () => {
      saveTorneioCompat({
        id: 't8', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '',
        chaves: [{ id: 'c1', updatedAt: '', lutas: [{ id: 'l1', updatedAt: '' }] }] as unknown as Torneio['chaves'],
      })
      saveTorneioCompat({
        id: 't8', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '',
        chaves: [{ id: 'c1', updatedAt: '', lutas: [{ id: 'l2', updatedAt: '' }] }] as unknown as Torneio['chaves'],
      })
      const loaded = loadTorneioCompat('t8')
      expect(loaded.chaves?.[0]?.lutas?.map(l => l.id)).toEqual(['l2'])
    })

    it('não altera updatedAt quando o registro é logicamente igual mas as chaves vêm em outra ordem (ex.: normalizeLutaCasada reconstrói o objeto)', () => {
      saveTorneioCompat({
        id: 't10', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '',
        lutasCasadas: [{ id: 'lc1', areaId: 'a1', arbitroId: null, updatedAt: '' }] as unknown as Torneio['lutasCasadas'],
      })
      const antes = readRecord<TestRecord>('t10', 'lutasCasadas', 'lc1')

      saveTorneioCompat({
        id: 't10', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '',
        lutasCasadas: [{ arbitroId: null, id: 'lc1', updatedAt: '', areaId: 'a1' }] as unknown as Torneio['lutasCasadas'],
      })
      const depois = readRecord<TestRecord>('t10', 'lutasCasadas', 'lc1')

      expect(depois?.updatedAt).toBe(antes?.updatedAt)
    })

    it('não altera updatedAt de um registro que não mudou entre dois saveTorneioCompat', () => {
      saveTorneioCompat({
        id: 't4', nome: 'Copa Z', data: '2026-03-01', createdAt: '', updatedAt: '',
        atletas: [{ id: 'a1', nome: 'joao', updatedAt: '' }] as unknown as Torneio['atletas'],
      })
      const primeiraGravacao = readRecord<TestRecord>('t4', 'atletas', 'a1')

      saveTorneioCompat(loadTorneioCompat('t4'))
      const segundaGravacao = readRecord<TestRecord>('t4', 'atletas', 'a1')

      expect(segundaGravacao?.updatedAt).toBe(primeiraGravacao?.updatedAt)
    })

    it('atualiza updatedAt quando um registro realmente muda', () => {
      saveTorneioCompat({
        id: 't5', nome: 'Copa W', data: '2026-04-01', createdAt: '', updatedAt: '',
        atletas: [{ id: 'a1', nome: 'joao', updatedAt: '' }] as unknown as Torneio['atletas'],
      })
      const primeiraGravacao = readRecord<TestRecord>('t5', 'atletas', 'a1')

      const torneio = loadTorneioCompat('t5')
      torneio.atletas = [{ ...(torneio.atletas?.[0] as NonNullable<Torneio['atletas']>[number]), nome: 'joao alterado' }]
      saveTorneioCompat(torneio)
      const segundaGravacao = readRecord<TestRecord>('t5', 'atletas', 'a1')

      expect(segundaGravacao?.updatedAt).not.toBe(primeiraGravacao?.updatedAt)
      expect(segundaGravacao?.nome).toBe('joao alterado')
    })
  })
})
