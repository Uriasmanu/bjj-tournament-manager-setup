import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { saveArea, loadAreas, deleteArea } from './areas'
import { writeTorneioMeta } from './storage/torneioStorage'

describe('areas (file-per-record storage)', () => {
  let dataDir: string

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), 'bjj-areas-'))
    vi.stubEnv('BJJ_DATA_DIR_OVERRIDE', dataDir)
    writeTorneioMeta({ id: 't1', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '' })
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(dataDir, { recursive: true, force: true })
  })

  it('saveArea grava um arquivo por área e loadAreas lê de volta', () => {
    saveArea('t1', { nome: 'Área 1', arbitroIds: [] })
    const list = loadAreas('t1')
    expect(list).toHaveLength(1)
    expect(list[0].nome).toBe('Área 1')
  })

  it('deleteArea marca deletedAt e some de loadAreas', () => {
    const a = saveArea('t1', { nome: 'Área 2', arbitroIds: [] })
    deleteArea('t1', a.id)
    expect(loadAreas('t1').find(x => x.id === a.id)).toBeUndefined()
  })
})
