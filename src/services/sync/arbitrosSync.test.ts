import { describe, it, expect, vi } from 'vitest'
import type { Arbitro } from '../../types/referee'

vi.mock('../firestore/firebaseApp', () => ({ getDb: () => ({}) }))
const { setDocMock } = vi.hoisted(() => ({ setDocMock: vi.fn().mockResolvedValue(undefined) }))
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), setDoc: setDocMock, collection: vi.fn(), onSnapshot: vi.fn() }))

import { pushArbitroToFirestore } from './arbitrosSync'

const arbitro: Arbitro = { id: 'r1', nome: 'carlos', equipe: 'x', faixa: 'preta', chaveIds: [], createdAt: '', updatedAt: '' }

describe('pushArbitroToFirestore', () => {
  it('chama setDoc e não lança se a escrita falhar', async () => {
    setDocMock.mockRejectedValueOnce(new Error('offline'))
    await expect(pushArbitroToFirestore('t1', arbitro)).resolves.toBeUndefined()
    expect(setDocMock).toHaveBeenCalled()
  })

  it('não lança quando a escrita é bem-sucedida', async () => {
    setDocMock.mockResolvedValueOnce(undefined)
    await expect(pushArbitroToFirestore('t1', arbitro)).resolves.toBeUndefined()
  })
})
