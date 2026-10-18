import { doc, setDoc, collection, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { getDb } from '../firestore/firebaseApp'
import type { Arbitro } from '../../types/referee'

export async function pushArbitroToFirestore(torneioId: string, arbitro: Arbitro): Promise<void> {
  try {
    await setDoc(doc(getDb(), 'torneios', torneioId, 'arbitros', arbitro.id), arbitro)
  } catch (error) {
    console.error('[arbitrosSync] falha ao sincronizar árbitro com o Firestore', error)
  }
}

export function subscribeArbitrosFromFirestore(
  torneioId: string,
  onRemoteChange: (arbitro: Arbitro) => void
): Unsubscribe {
  return onSnapshot(collection(getDb(), 'torneios', torneioId, 'arbitros'), snapshot => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'removed') continue
      onRemoteChange(change.doc.data() as Arbitro)
    }
  })
}
