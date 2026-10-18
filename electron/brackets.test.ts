import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { writeTorneioMeta, writeRecord, listRecords, getTorneioDir } from './storage/torneioStorage'
import { existsSync } from 'node:fs'
import type { Atleta } from '../src/types/athlete'
import type { Luta, Chave } from '../src/types/bracket'

vi.mock('./tournament', () => ({ getActiveTournamentId: () => 't1' }))

type Handler = (event: unknown, ...args: unknown[]) => unknown
const handlers = new Map<string, Handler>()

vi.mock('electron', () => ({
  ipcMain: { handle: (channel: string, listener: Handler) => handlers.set(channel, listener) },
  dialog: { showOpenDialog: vi.fn(), showSaveDialog: vi.fn() },
  app: { getPath: () => '' },
}))

describe('brackets (file-per-record storage)', () => {
  let dataDir: string

  beforeEach(async () => {
    dataDir = mkdtempSync(path.join(tmpdir(), 'bjj-brackets-'))
    vi.stubEnv('BJJ_DATA_DIR_OVERRIDE', dataDir)
    writeTorneioMeta({ id: 't1', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '' })
    writeRecord<Atleta>('t1', 'atletas', { id: 'a1', nome: 'joao', equipe: 'x', genero: 'masculino', categoria: 'adulto-masculino-leve', pesoKg: 70, faixa: 'azul', anoNascimento: 1990, createdAt: '', updatedAt: '' })
    writeRecord<Atleta>('t1', 'atletas', { id: 'a2', nome: 'pedro', equipe: 'y', genero: 'masculino', categoria: 'adulto-masculino-leve', pesoKg: 71, faixa: 'azul', anoNascimento: 1991, createdAt: '', updatedAt: '' })

    const { registerBracketHandlers } = await import('./brackets')
    handlers.clear()
    registerBracketHandlers()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(dataDir, { recursive: true, force: true })
  })

  it('gerar-chave cria uma chave em arquivo e load-chaves lê de volta', async () => {
    const chave = await handlers.get('gerar-chave')!({}, { categoriaId: 'manual', atletaIds: ['a1', 'a2'] }) as Chave
    expect(chave.lutas).toHaveLength(1)

    const chaves = await handlers.get('load-chaves')!({}) as Chave[]
    expect(chaves).toHaveLength(1)
    expect(chaves[0].lutas).toHaveLength(1)

    const lutasEmDisco = listRecords<Luta>('t1', 'lutas', `chaves/${chave.id}`)
    expect(lutasEmDisco).toHaveLength(1)
  })

  it('registrar-resultado grava o vencedor na luta individual', async () => {
    const chave = await handlers.get('gerar-chave')!({}, { categoriaId: 'manual', atletaIds: ['a1', 'a2'] }) as Chave
    const luta = chave.lutas[0]

    await handlers.get('registrar-resultado')!({}, {
      chaveId: chave.id,
      lutaId: luta.id,
      vencedorId: 'a1',
      status: 'completed',
    })

    const [lutaAtualizada] = listRecords<Luta>('t1', 'lutas', `chaves/${chave.id}`)
    expect(lutaAtualizada.vencedorId).toBe('a1')
    expect(lutaAtualizada.status).toBe('completed')
  })

  it('delete-chave remove a pasta da chave e suas lutas do disco', async () => {
    const chave = await handlers.get('gerar-chave')!({}, { categoriaId: 'manual', atletaIds: ['a1', 'a2'] }) as Chave

    await handlers.get('delete-chave')!({}, chave.id)

    expect(existsSync(`${getTorneioDir('t1')}/chaves/${chave.id}`)).toBe(false)
    expect(await handlers.get('load-chaves')!({})).toEqual([])
  })

  it('randomizar-chave não deixa lutas antigas órfãs em disco', async () => {
    const chave = await handlers.get('gerar-chave')!({}, { categoriaId: 'manual', atletaIds: ['a1', 'a2'] }) as Chave
    const lutaOriginalId = chave.lutas[0].id

    await handlers.get('randomizar-chave')!({}, { chaveId: chave.id })

    const lutasEmDisco = listRecords<Luta>('t1', 'lutas', `chaves/${chave.id}`)
    expect(lutasEmDisco.some(l => l.id === lutaOriginalId)).toBe(false)
    expect(lutasEmDisco).toHaveLength(1)
  })
})
