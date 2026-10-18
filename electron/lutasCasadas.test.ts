import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { saveLutaCasada, loadLutasCasadas, deleteLutaCasada, applyRemoteLutaCasada } from './lutasCasadas'
import { writeTorneioMeta, readRecord } from './storage/torneioStorage'
import type { AtletaSnapshot, LutaCasada } from '../src/types/lutaCasada'

const snapshot: AtletaSnapshot = { id: 'a1', nome: 'joao', equipe: 'x', faixa: 'azul', pesoKg: 70, categoria: 'adulto-masculino-leve' }

describe('lutasCasadas (file-per-record storage)', () => {
  let dataDir: string

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), 'bjj-lutascasadas-'))
    vi.stubEnv('BJJ_DATA_DIR_OVERRIDE', dataDir)
    writeTorneioMeta({ id: 't1', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '' })
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(dataDir, { recursive: true, force: true })
  })

  it('saveLutaCasada grava um arquivo por luta casada e loadLutasCasadas lê de volta', () => {
    saveLutaCasada('t1', {
      areaId: 'area1', arbitroId: null, atletaAId: 'a1', atletaBId: 'a2',
      atletaASnapshot: snapshot, atletaBSnapshot: { ...snapshot, id: 'a2', nome: 'pedro' },
    })
    expect(loadLutasCasadas('t1')).toHaveLength(1)
  })

  it('deleteLutaCasada marca deletedAt e some de loadLutasCasadas', () => {
    const l = saveLutaCasada('t1', {
      areaId: 'area1', arbitroId: null, atletaAId: 'a1', atletaBId: 'a2',
      atletaASnapshot: snapshot, atletaBSnapshot: { ...snapshot, id: 'a2', nome: 'pedro' },
    })
    deleteLutaCasada('t1', l.id)
    expect(loadLutasCasadas('t1').find(x => x.id === l.id)).toBeUndefined()
  })

  it('applyRemoteLutaCasada cria uma luta casada que só existia em outro PC, preservando o updatedAt remoto', () => {
    const remota: LutaCasada = {
      id: 'lc9', areaId: 'area1', arbitroId: null, atletaAId: 'a1', atletaBId: 'a2',
      atletaASnapshot: snapshot, atletaBSnapshot: { ...snapshot, id: 'a2', nome: 'pedro' },
      tag: 'luta-casada', status: 'pending', vencedorId: null, finalizacao: false,
      desclassificacao: false, desempateArbitro: false, dataFinalizacao: null,
      deletedAt: null, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
    }
    applyRemoteLutaCasada('t1', remota)
    const salvo = readRecord<LutaCasada>('t1', 'lutasCasadas', 'lc9')
    expect(salvo?.updatedAt).toBe('2025-01-01T00:00:00.000Z')
    expect(loadLutasCasadas('t1').map(l => l.id)).toContain('lc9')
  })
})
