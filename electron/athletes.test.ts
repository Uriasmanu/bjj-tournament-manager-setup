import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { saveAthlete, loadAthletes, deleteAthlete, applyRemoteAtleta } from './athletes'
import { writeRecord, readRecord } from './storage/torneioStorage'
import type { Atleta } from '../src/types/athlete'

describe('athletes (file-per-record storage)', () => {
  let dataDir: string

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), 'bjj-athletes-'))
    vi.stubEnv('BJJ_DATA_DIR_OVERRIDE', dataDir)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(dataDir, { recursive: true, force: true })
  })

  it('saveAthlete grava um arquivo por atleta e loadAthletes lê de volta', () => {
    const novo: Atleta = { id: '', nome: 'Maria', equipe: 'X', genero: 'feminino', categoria: 'adulto-feminino-leve', pesoKg: 60, faixa: 'azul', anoNascimento: 1995, createdAt: '', updatedAt: '' }
    saveAthlete('t1', novo)
    const list = loadAthletes('t1')
    expect(list).toHaveLength(1)
    expect(list[0].nome).toBe('Maria') // saveAthlete não normaliza caixa (só importAthletesFromFile faz isso no código original)
  })

  it('deleteAthlete marca deletedAt e some de loadAthletes', () => {
    const novo: Atleta = { id: '', nome: 'Pedro', equipe: 'X', genero: 'masculino', categoria: 'adulto-masculino-leve', pesoKg: 70, faixa: 'azul', anoNascimento: 1990, createdAt: '', updatedAt: '' }
    const [a] = saveAthlete('t1', novo)
    deleteAthlete('t1', a.id)
    expect(loadAthletes('t1').find((x: Atleta) => x.id === a.id)).toBeUndefined()
  })

  it('loadAthletes não re-carimba updatedAt de um atleta já íntegro quando outro atleta precisa de correção', () => {
    writeRecord<Atleta>('t1', 'atletas', { id: 'a1', nome: 'joao', equipe: 'x', genero: 'masculino', categoria: 'adulto-masculino-leve', pesoKg: 70, faixa: 'azul', anoNascimento: 1990, createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '', deletedAt: null })
    const a1Antes = readRecord<Atleta>('t1', 'atletas', 'a1')
    // atleta legado sem deletedAt definido — dispara a normalização
    writeRecord<Atleta>('t1', 'atletas', { id: 'a2', nome: 'pedro', equipe: 'y', genero: 'masculino', categoria: 'adulto-masculino-leve', pesoKg: 71, faixa: 'azul', anoNascimento: 1991, createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '' })

    loadAthletes('t1')

    const a1Depois = readRecord<Atleta>('t1', 'atletas', 'a1')
    expect(a1Depois?.updatedAt).toBe(a1Antes?.updatedAt)
  })

  it('applyRemoteAtleta cria um atleta que só existia em outro PC (upsert), preservando o updatedAt remoto', () => {
    const remoto: Atleta = { id: 'a9', nome: 'remoto', equipe: 'x', genero: 'masculino', categoria: 'adulto-masculino-leve', pesoKg: 70, faixa: 'azul', anoNascimento: 1990, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }
    applyRemoteAtleta('t1', remoto)
    const salvo = readRecord<Atleta>('t1', 'atletas', 'a9')
    expect(salvo?.updatedAt).toBe('2025-01-01T00:00:00.000Z')
    expect(loadAthletes('t1').map(a => a.id)).toContain('a9')
  })

  it('applyRemoteAtleta aplica uma exclusão (deletedAt) vinda de outro PC', () => {
    const [local] = saveAthlete('t1', { id: '', nome: 'Carlos', equipe: 'X', genero: 'masculino', categoria: 'adulto-masculino-leve', pesoKg: 80, faixa: 'azul', anoNascimento: 1988, createdAt: '', updatedAt: '' })
    applyRemoteAtleta('t1', { ...local, deletedAt: '2025-02-01T00:00:00.000Z', updatedAt: '2025-02-01T00:00:00.000Z' })
    expect(loadAthletes('t1').find(a => a.id === local.id)).toBeUndefined()
  })
})
