import { describe, it, expect, vi } from 'vitest'
import type { LutaCasada, AtletaSnapshot } from '../../types/lutaCasada'

vi.mock('../firestore/firebaseApp', () => ({ getDb: () => ({}) }))
const { setDocMock } = vi.hoisted(() => ({ setDocMock: vi.fn().mockResolvedValue(undefined) }))
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), setDoc: setDocMock, collection: vi.fn(), onSnapshot: vi.fn() }))

import { pushLutaCasadaToFirestore } from './lutasCasadasSync'

const snapshot: AtletaSnapshot = { id: 'a1', nome: 'joao', equipe: 'x', faixa: 'azul', pesoKg: 70, categoria: 'adulto-masculino-leve' }

const lutaCasada: LutaCasada = {
  id: 'lc1', areaId: 'area1', arbitroId: null, atletaAId: 'a1', atletaBId: 'a2',
  atletaASnapshot: snapshot, atletaBSnapshot: { ...snapshot, id: 'a2', nome: 'pedro' },
  tag: 'luta-casada', status: 'pending', vencedorId: null, finalizacao: false,
  desclassificacao: false, desempateArbitro: false, dataFinalizacao: null,
  deletedAt: null, createdAt: '', updatedAt: '',
}

describe('pushLutaCasadaToFirestore', () => {
  it('chama setDoc e não lança se a escrita falhar', async () => {
    setDocMock.mockRejectedValueOnce(new Error('offline'))
    await expect(pushLutaCasadaToFirestore('t1', lutaCasada)).resolves.toBeUndefined()
    expect(setDocMock).toHaveBeenCalled()
  })

  it('não lança quando a escrita é bem-sucedida', async () => {
    setDocMock.mockResolvedValueOnce(undefined)
    await expect(pushLutaCasadaToFirestore('t1', lutaCasada)).resolves.toBeUndefined()
  })
})
