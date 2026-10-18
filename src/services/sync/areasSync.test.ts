import { describe, it, expect, vi } from 'vitest'
import type { AreaLuta } from '../../types/area'

vi.mock('../firestore/firebaseApp', () => ({ getDb: () => ({}) }))
const { setDocMock } = vi.hoisted(() => ({ setDocMock: vi.fn().mockResolvedValue(undefined) }))
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), setDoc: setDocMock, collection: vi.fn(), onSnapshot: vi.fn() }))

import { pushAreaToFirestore } from './areasSync'

const area: AreaLuta = { id: 'ar1', nome: 'Área 1', arbitroIds: [], createdAt: '', updatedAt: '' }

describe('pushAreaToFirestore', () => {
  it('chama setDoc e não lança se a escrita falhar', async () => {
    setDocMock.mockRejectedValueOnce(new Error('offline'))
    await expect(pushAreaToFirestore('t1', area)).resolves.toBeUndefined()
    expect(setDocMock).toHaveBeenCalled()
  })

  it('não lança quando a escrita é bem-sucedida', async () => {
    setDocMock.mockResolvedValueOnce(undefined)
    await expect(pushAreaToFirestore('t1', area)).resolves.toBeUndefined()
  })
})
