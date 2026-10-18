import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { saveArbitro, loadArbitros, deleteArbitro } from './referees'
import { writeTorneioMeta } from './storage/torneioStorage'

describe('referees (file-per-record storage)', () => {
  let dataDir: string

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), 'bjj-referees-'))
    vi.stubEnv('BJJ_DATA_DIR_OVERRIDE', dataDir)
    writeTorneioMeta({ id: 't1', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '' })
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(dataDir, { recursive: true, force: true })
  })

  it('saveArbitro grava um arquivo por árbitro e loadArbitros lê de volta', () => {
    saveArbitro('t1', { nome: 'Carlos', equipe: 'X', faixa: 'preta', chaveIds: [] })
    const list = loadArbitros('t1')
    expect(list).toHaveLength(1)
    expect(list[0].nome).toBe('carlos')
  })

  it('deleteArbitro marca deletedAt e some de loadArbitros', () => {
    const a = saveArbitro('t1', { nome: 'Pedro', equipe: 'X', faixa: 'preta', chaveIds: [] })
    deleteArbitro('t1', a.id)
    expect(loadArbitros('t1').find(x => x.id === a.id)).toBeUndefined()
  })
})
