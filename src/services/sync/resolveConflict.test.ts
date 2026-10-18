import { describe, it, expect } from 'vitest'
import { resolveConflict } from './resolveConflict'

describe('resolveConflict', () => {
  it('escolhe o updatedAt mais recente', () => {
    const local = { id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' }
    const remote = { id: 'a', updatedAt: '2026-01-02T00:00:00.000Z' }
    expect(resolveConflict(local, remote)).toBe(remote)
  })

  it('mantém o local se for mais recente que o remoto', () => {
    const local = { id: 'a', updatedAt: '2026-01-02T00:00:00.000Z' }
    const remote = { id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' }
    expect(resolveConflict(local, remote)).toBe(local)
  })

  it('usa o que existe quando o outro é null', () => {
    const local = { id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' }
    expect(resolveConflict(local, null)).toBe(local)
    expect(resolveConflict(null, local)).toBe(local)
  })

  it('retorna null se os dois são null', () => {
    expect(resolveConflict(null, null)).toBeNull()
  })

  it('trata updatedAt ausente como a data mais antiga possível', () => {
    const semData: { id: string; updatedAt?: string } = { id: 'a' }
    const comData = { id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' }
    expect(resolveConflict(semData, comData)).toBe(comData)
    expect(resolveConflict(comData, semData)).toBe(comData)
  })

  it('trata updatedAt com texto inválido (não parseável como data) como a data mais antiga possível', () => {
    const invalido = { id: 'a', updatedAt: 'não é uma data' }
    const valido = { id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' }
    expect(resolveConflict(invalido, valido)).toBe(valido)
    expect(resolveConflict(valido, invalido)).toBe(valido)
  })
})
