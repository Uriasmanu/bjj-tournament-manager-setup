import { describe, it, expect, vi } from 'vitest'

vi.mock('../firestore/firebaseApp', () => ({ getDb: () => ({}) }))
const { setDocMock } = vi.hoisted(() => ({ setDocMock: vi.fn().mockResolvedValue(undefined) }))
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), setDoc: setDocMock, onSnapshot: vi.fn() }))

import { pushTorneioMetaToFirestore } from './categoriasSync'

const meta = { id: 't1', nome: 'Copa', data: '2026-01-01', categoriasDesabilitadas: [], categoriasCustomizadas: [], updatedAt: '' }

describe('pushTorneioMetaToFirestore', () => {
  it('chama setDoc e não lança se a escrita falhar', async () => {
    setDocMock.mockRejectedValueOnce(new Error('offline'))
    await expect(pushTorneioMetaToFirestore(meta)).resolves.toBeUndefined()
    expect(setDocMock).toHaveBeenCalled()
  })

  it('não lança quando a escrita é bem-sucedida', async () => {
    setDocMock.mockResolvedValueOnce(undefined)
    await expect(pushTorneioMetaToFirestore(meta)).resolves.toBeUndefined()
  })
})
