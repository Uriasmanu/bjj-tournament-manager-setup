import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { writeTorneioMeta, writeRecord } from './storage/torneioStorage'
import type { Atleta } from '../src/types/athlete'
import type { Torneio } from '../src/types/tournament'

type Handler = (event: unknown, ...args: unknown[]) => unknown
const handlers = new Map<string, Handler>()
let currentDataDir = ''

vi.mock('electron', () => ({
  ipcMain: { handle: (channel: string, listener: Handler) => handlers.set(channel, listener) },
  dialog: { showOpenDialog: vi.fn(), showSaveDialog: vi.fn() },
  app: { getPath: () => currentDataDir },
}))

describe('tournament (file-per-record storage)', () => {
  let dataDir: string

  beforeEach(async () => {
    dataDir = mkdtempSync(path.join(tmpdir(), 'bjj-tournament-'))
    currentDataDir = dataDir
    vi.stubEnv('BJJ_DATA_DIR_OVERRIDE', path.join(dataDir, 'data'))
    vi.resetModules()

    const { registerTournamentHandlers } = await import('./tournament')
    handlers.clear()
    registerTournamentHandlers()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(dataDir, { recursive: true, force: true })
  })

  it('start-tournament migra um torneio legado e get-active-tournament lê do novo formato', async () => {
    writeTorneioMeta({ id: 't1', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '' })
    writeRecord<Atleta>('t1', 'atletas', { id: 'a1', nome: 'joao', equipe: 'x', genero: 'masculino', categoria: 'adulto-masculino-leve', pesoKg: 70, faixa: 'azul', anoNascimento: 1990, createdAt: '', updatedAt: '' })

    await handlers.get('start-tournament')!({}, { id: 't1', mode: 'admin' })
    const active = await handlers.get('get-active-tournament')!({}) as Torneio | null

    expect(active?.id).toBe('t1')
    expect(active?.atletas).toHaveLength(1)
  })

  it('update-tournament grava via storage compat e preserva atletas', async () => {
    writeTorneioMeta({ id: 't1', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '' })
    writeRecord<Atleta>('t1', 'atletas', { id: 'a1', nome: 'joao', equipe: 'x', genero: 'masculino', categoria: 'adulto-masculino-leve', pesoKg: 70, faixa: 'azul', anoNascimento: 1990, createdAt: '', updatedAt: '' })

    const updated = await handlers.get('update-tournament')!({}, { id: 't1', nome: 'Copa Renomeada', data: '2026-01-01', createdAt: '', updatedAt: '' }) as Torneio
    expect(updated.nome).toBe('Copa Renomeada')

    const active = await handlers.get('get-active-tournament')!({}) as Torneio | null
    expect(active).toBeNull() // nenhum torneio ativo setado neste teste

    writeTorneioMeta({ id: 't1', nome: 'outro nome', data: '2026-01-01', createdAt: '', updatedAt: '' })
    const list = await handlers.get('list-tournaments')!({}) as Torneio[]
    expect(list.find(t => t.id === 't1')?.nome).toBe('outro nome')
  })

  it('import-tournament cria um torneio novo e o mantém legível por get-active-tournament', async () => {
    const result = await handlers.get('import-tournament')!({}, {
      id: 't2', nome: 'Importado', data: '2026-02-01', createdAt: '', updatedAt: '',
      atletas: [{ id: 'a1', nome: 'joao', equipe: 'x', genero: 'masculino', categoria: 'adulto-masculino-leve', pesoKg: 70, faixa: 'azul', anoNascimento: 1990, createdAt: '', updatedAt: '', deletedAt: null }],
    }) as { success: true; merged: boolean }
    expect(result.merged).toBe(false)

    await handlers.get('start-tournament')!({}, { id: 't2', mode: 'admin' })
    const active = await handlers.get('get-active-tournament')!({}) as Torneio | null
    expect(active?.nome).toBe('Importado')
    expect(active?.atletas).toHaveLength(1)
  })

  it('list-tournaments não quebra a listagem inteira se um torneio estiver corrompido', async () => {
    writeTorneioMeta({ id: 't1', nome: 'Copa Boa', data: '2026-01-01', createdAt: '', updatedAt: '' })
    const { mkdirSync, writeFileSync } = await import('node:fs')
    const corruptDir = path.join(dataDir, 'data', 'torneios', 't-corrompido')
    mkdirSync(corruptDir, { recursive: true })
    writeFileSync(path.join(corruptDir, '_torneio.json'), '{ json invalido')

    const list = await handlers.get('list-tournaments')!({}) as Torneio[]

    expect(list.map(t => t.id)).toEqual(['t1'])
  })
})
