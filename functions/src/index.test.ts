import { describe, it, expect, vi } from 'vitest'
import { validateMintTokenInput, mintTournamentTokenHandler } from './index'

describe('validateMintTokenInput', () => {
  it('aceita um torneioId de string não vazia', () => {
    expect(() => validateMintTokenInput({ torneioId: 't1' })).not.toThrow()
  })
  it('rejeita entrada sem torneioId', () => {
    expect(() => validateMintTokenInput({})).toThrow()
  })
  it('rejeita torneioId vazio', () => {
    expect(() => validateMintTokenInput({ torneioId: '' })).toThrow()
  })
})

describe('mintTournamentTokenHandler', () => {
  it('cria o documento do torneio quando ele ainda não existe, antes de emitir o token', async () => {
    const createTorneioDoc = vi.fn().mockResolvedValue(undefined)
    const deps = {
      getTorneioDoc: vi.fn().mockResolvedValue({ exists: false }),
      createTorneioDoc,
      createCustomToken: vi.fn().mockResolvedValue('o-token'),
    }

    const result = await mintTournamentTokenHandler('t1', deps)

    expect(createTorneioDoc).toHaveBeenCalledWith('t1')
    expect(result).toEqual({ token: 'o-token' })
  })

  it('não recria o documento quando ele já existe', async () => {
    const createTorneioDoc = vi.fn().mockResolvedValue(undefined)
    const deps = {
      getTorneioDoc: vi.fn().mockResolvedValue({ exists: true }),
      createTorneioDoc,
      createCustomToken: vi.fn().mockResolvedValue('o-token'),
    }

    await mintTournamentTokenHandler('t1', deps)

    expect(createTorneioDoc).not.toHaveBeenCalled()
  })
})
