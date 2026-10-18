import { describe, it, expect, vi } from 'vitest'
import type { Atleta } from '../../types/athlete'

vi.mock('../firestore/firebaseApp', () => ({ getDb: () => ({}) }))
const { setDocMock } = vi.hoisted(() => ({ setDocMock: vi.fn().mockResolvedValue(undefined) }))
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), setDoc: setDocMock, collection: vi.fn(), onSnapshot: vi.fn() }))

import { pushAthleteToFirestore } from './atletasSync'

const atleta: Atleta = {
  id: 'a1', nome: 'joao', equipe: 'x', genero: 'masculino', categoria: 'adulto-masculino-leve',
  pesoKg: 70, faixa: 'azul', anoNascimento: 1990, createdAt: '', updatedAt: '',
}

describe('pushAthleteToFirestore', () => {
  it('chama setDoc e não lança se a escrita falhar', async () => {
    setDocMock.mockRejectedValueOnce(new Error('offline'))
    await expect(pushAthleteToFirestore('t1', atleta)).resolves.toBeUndefined()
    expect(setDocMock).toHaveBeenCalled()
  })

  it('não lança quando a escrita é bem-sucedida', async () => {
    setDocMock.mockResolvedValueOnce(undefined)
    await expect(pushAthleteToFirestore('t1', atleta)).resolves.toBeUndefined()
  })
})
