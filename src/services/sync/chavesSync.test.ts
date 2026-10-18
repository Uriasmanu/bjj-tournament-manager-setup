import { describe, it, expect, vi } from 'vitest'
import type { Chave, Luta } from '../../types/bracket'

vi.mock('../firestore/firebaseApp', () => ({ getDb: () => ({}) }))
const { setDocMock } = vi.hoisted(() => ({ setDocMock: vi.fn().mockResolvedValue(undefined) }))
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), setDoc: setDocMock, collection: vi.fn(), onSnapshot: vi.fn() }))

import { pushChaveMetaToFirestore, pushLutaToFirestore } from './chavesSync'

const chaveMeta: Omit<Chave, 'lutas'> = {
  id: 'c1', categoriaId: 'adulto-masculino-leve', posicoesAtletas: ['a1', 'a2'],
  arbitroId: null, totalAtletas: 2, totalLutas: 1, totalRodadas: 1, status: 'gerada', updatedAt: '',
}

const luta: Luta = { id: 'l1', ordem: 1, rodada: 1, atletaAId: 'a1', atletaBId: 'a2', status: 'pending', updatedAt: '' }

describe('chavesSync', () => {
  it('pushChaveMetaToFirestore chama setDoc e não lança se a escrita falhar', async () => {
    setDocMock.mockRejectedValueOnce(new Error('offline'))
    await expect(pushChaveMetaToFirestore('t1', chaveMeta)).resolves.toBeUndefined()
    expect(setDocMock).toHaveBeenCalled()
  })

  it('pushLutaToFirestore chama setDoc e não lança se a escrita falhar', async () => {
    setDocMock.mockRejectedValueOnce(new Error('offline'))
    await expect(pushLutaToFirestore('t1', 'c1', luta)).resolves.toBeUndefined()
    expect(setDocMock).toHaveBeenCalled()
  })
})
