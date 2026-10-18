import { doc, setDoc, collection, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { getDb } from '../firestore/firebaseApp'
import type { AreaLuta } from '../../types/area'

export async function pushAreaToFirestore(torneioId: string, area: AreaLuta): Promise<void> {
  try {
    await setDoc(doc(getDb(), 'torneios', torneioId, 'areas', area.id), area)
  } catch (error) {
    console.error('[areasSync] falha ao sincronizar área com o Firestore', error)
  }
}

export function subscribeAreasFromFirestore(
  torneioId: string,
  onRemoteChange: (area: AreaLuta) => void
): Unsubscribe {
  return onSnapshot(collection(getDb(), 'torneios', torneioId, 'areas'), snapshot => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'removed') continue
      onRemoteChange(change.doc.data() as AreaLuta)
    }
  })
}
