import { doc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { getDb } from '../firestore/firebaseApp'
import type { Torneio } from '../../types/tournament'

type TorneioMeta = Pick<Torneio, 'id' | 'nome' | 'data' | 'categoriasDesabilitadas' | 'categoriasCustomizadas' | 'updatedAt'>

export async function pushTorneioMetaToFirestore(meta: TorneioMeta): Promise<void> {
  try {
    await setDoc(doc(getDb(), 'torneios', meta.id), meta)
  } catch (error) {
    console.error('[categoriasSync] falha ao sincronizar metadados do torneio com o Firestore', error)
  }
}

export function subscribeTorneioMetaFromFirestore(
  torneioId: string,
  onRemoteChange: (meta: Torneio) => void
): Unsubscribe {
  return onSnapshot(doc(getDb(), 'torneios', torneioId), snapshot => {
    const data = snapshot.data()
    if (data) onRemoteChange(data as Torneio)
  })
}
