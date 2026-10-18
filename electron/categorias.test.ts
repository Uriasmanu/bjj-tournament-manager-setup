import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { toggleCategoria, loadCategorias, applyRemoteCategoriasMeta } from './categorias'
import { writeTorneioMeta } from './storage/torneioStorage'

describe('categorias (file-per-record storage)', () => {
  let dataDir: string

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), 'bjj-categorias-'))
    vi.stubEnv('BJJ_DATA_DIR_OVERRIDE', dataDir)
    writeTorneioMeta({ id: 't1', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '', categoriasDesabilitadas: [] })
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(dataDir, { recursive: true, force: true })
  })

  it('toggleCategoria habilita/desabilita e loadCategorias reflete', () => {
    toggleCategoria('t1', 'adulto-masculino-leve')
    expect(loadCategorias('t1').desabilitadas).toEqual(['adulto-masculino-leve'])
    toggleCategoria('t1', 'adulto-masculino-leve')
    expect(loadCategorias('t1').desabilitadas).toEqual([])
  })

  it('applyRemoteCategoriasMeta sobrescreve desabilitadas e customizadas localmente', () => {
    applyRemoteCategoriasMeta('t1', ['x'], [{ id: 'custom-1', nome: 'Faixa Extra', pesoMinimoKg: 0, pesoMaximoKg: 100, tempoLutaMinutos: 5, createdAt: '', updatedAt: '' }], '2026-01-01T00:00:00.000Z')
    const result = loadCategorias('t1')
    expect(result.desabilitadas).toEqual(['x'])
    expect(result.customizadas).toHaveLength(1)
  })
})
