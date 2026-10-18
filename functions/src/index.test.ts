import { describe, it, expect } from 'vitest'
import { validateMintTokenInput } from './index'

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
