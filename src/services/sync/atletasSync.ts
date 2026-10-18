import { doc, setDoc, collection, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { getDb } from '../firestore/firebaseApp'
import type { Atleta } from '../../types/athlete'

export async function pushAthleteToFirestore(torneioId: string, atleta: Atleta): Promise<void> {
  try {
    await setDoc(doc(getDb(), 'torneios', torneioId, 'atletas', atleta.id), atleta)
  } catch (error) {
    console.error('[atletasSync] falha ao sincronizar atleta com o Firestore', error)
  }
}

export function subscribeAthletesFromFirestore(
  torneioId: string,
  onRemoteChange: (atleta: Atleta) => void
): Unsubscribe {
  return onSnapshot(collection(getDb(), 'torneios', torneioId, 'atletas'), snapshot => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'removed') continue
      onRemoteChange(change.doc.data() as Atleta)
    }
  })
}
