import { describe, it, expect, vi } from 'vitest'

vi.mock('../firestore/auth', () => ({ signInForTournament: vi.fn().mockResolvedValue(undefined) }))
const { pushAthleteToFirestoreMock } = vi.hoisted(() => ({ pushAthleteToFirestoreMock: vi.fn().mockResolvedValue(undefined) }))
vi.mock('./atletasSync', () => ({ pushAthleteToFirestore: pushAthleteToFirestoreMock }))
const { pushArbitroToFirestoreMock } = vi.hoisted(() => ({ pushArbitroToFirestoreMock: vi.fn().mockResolvedValue(undefined) }))
vi.mock('./arbitrosSync', () => ({ pushArbitroToFirestore: pushArbitroToFirestoreMock }))
const { pushAreaToFirestoreMock } = vi.hoisted(() => ({ pushAreaToFirestoreMock: vi.fn().mockResolvedValue(undefined) }))
vi.mock('./areasSync', () => ({ pushAreaToFirestore: pushAreaToFirestoreMock }))
const { pushChaveMetaToFirestoreMock, pushLutaToFirestoreMock } = vi.hoisted(() => ({
  pushChaveMetaToFirestoreMock: vi.fn().mockResolvedValue(undefined),
  pushLutaToFirestoreMock: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('./chavesSync', () => ({ pushChaveMetaToFirestore: pushChaveMetaToFirestoreMock, pushLutaToFirestore: pushLutaToFirestoreMock }))
const { pushLutaCasadaToFirestoreMock } = vi.hoisted(() => ({ pushLutaCasadaToFirestoreMock: vi.fn().mockResolvedValue(undefined) }))
vi.mock('./lutasCasadasSync', () => ({ pushLutaCasadaToFirestore: pushLutaCasadaToFirestoreMock }))
const { pushTorneioMetaToFirestoreMock } = vi.hoisted(() => ({ pushTorneioMetaToFirestoreMock: vi.fn().mockResolvedValue(undefined) }))
vi.mock('./categoriasSync', () => ({ pushTorneioMetaToFirestore: pushTorneioMetaToFirestoreMock }))

import { enviarTorneioParaNuvem } from './enviarTorneioParaNuvem'

const fakeApi = {
  getActiveTournament: vi.fn().mockResolvedValue({ id: 't1', nome: 'Copa', data: '2026-01-01', createdAt: '', updatedAt: '', categoriasDesabilitadas: [], categoriasCustomizadas: [] }),
  loadAthletes: vi.fn().mockResolvedValue([{ id: 'a1' }]),
  loadArbitros: vi.fn().mockResolvedValue([{ id: 'r1' }]),
  loadAreas: vi.fn().mockResolvedValue([{ id: 'ar1' }]),
  loadChaves: vi.fn().mockResolvedValue([{ id: 'c1', lutas: [{ id: 'l1' }, { id: 'l2' }] }]),
  loadLutasCasadas: vi.fn().mockResolvedValue([{ id: 'lc1' }]),
  loadCategorias: vi.fn().mockResolvedValue({ desabilitadas: [], customizadas: [] }),
} as unknown as Window['electronAPI']

describe('enviarTorneioParaNuvem', () => {
  it('envia cada registro local e conta o total enviado (1 torneio + 1 atleta + 1 árbitro + 1 área + 1 chave + 2 lutas + 1 luta casada)', async () => {
    const result = await enviarTorneioParaNuvem('t1', fakeApi)
    expect(result.enviados).toBe(8)
    expect(pushAthleteToFirestoreMock).toHaveBeenCalledWith('t1', { id: 'a1' })
    expect(pushArbitroToFirestoreMock).toHaveBeenCalledWith('t1', { id: 'r1' })
    expect(pushAreaToFirestoreMock).toHaveBeenCalledWith('t1', { id: 'ar1' })
    expect(pushChaveMetaToFirestoreMock).toHaveBeenCalledWith('t1', { id: 'c1' })
    expect(pushLutaToFirestoreMock).toHaveBeenCalledTimes(2)
    expect(pushLutaCasadaToFirestoreMock).toHaveBeenCalledWith('t1', { id: 'lc1' })
    expect(pushTorneioMetaToFirestoreMock).toHaveBeenCalledTimes(1)
  })
})
