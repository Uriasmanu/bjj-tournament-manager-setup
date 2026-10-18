import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { saveArea, loadAreas, deleteArea, applyRemoteArea } from './areas'
import { writeTorneioMeta, readRecord } from './storage/torneioStorage'
import type { AreaLuta } from '../src/types/area'

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

  it('applyRemoteArea cria uma área que só existia em outro PC, preservando o updatedAt remoto', () => {
    const remota: AreaLuta = { id: 'ar9', nome: 'remota', arbitroIds: [], createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }
    applyRemoteArea('t1', remota)
    const salvo = readRecord<AreaLuta>('t1', 'areas', 'ar9')
    expect(salvo?.updatedAt).toBe('2025-01-01T00:00:00.000Z')
    expect(loadAreas('t1').map(a => a.id)).toContain('ar9')
  })
})
