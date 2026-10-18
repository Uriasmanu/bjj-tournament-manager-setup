import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { saveAthlete, loadAthletes, deleteAthlete } from './athletes'

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
    saveAthlete('t1', { id: '', nome: 'Maria', equipe: 'X', genero: 'feminino', categoria: 'adulto-feminino-leve', pesoKg: 60, faixa: 'azul', anoNascimento: 1995, createdAt: '', updatedAt: '' } as any)
    const list = loadAthletes('t1')
    expect(list).toHaveLength(1)
    expect(list[0].nome).toBe('Maria') // saveAthlete não normaliza caixa (só importAthletesFromFile faz isso no código original)
  })

  it('deleteAthlete marca deletedAt e some de loadAthletes', () => {
    const [a] = saveAthlete('t1', { id: '', nome: 'Pedro', equipe: 'X', genero: 'masculino', categoria: 'adulto-masculino-leve', pesoKg: 70, faixa: 'azul', anoNascimento: 1990, createdAt: '', updatedAt: '' } as any)
    deleteAthlete('t1', a.id)
    expect(loadAthletes('t1').find((x: any) => x.id === a.id)).toBeUndefined()
  })
})
