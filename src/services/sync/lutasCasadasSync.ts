import { doc, setDoc, collection, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { getDb } from '../firestore/firebaseApp'
import type { LutaCasada } from '../../types/lutaCasada'

export async function pushLutaCasadaToFirestore(torneioId: string, lutaCasada: LutaCasada): Promise<void> {
  try {
    await setDoc(doc(getDb(), 'torneios', torneioId, 'lutasCasadas', lutaCasada.id), lutaCasada)
  } catch (error) {
    console.error('[lutasCasadasSync] falha ao sincronizar luta casada com o Firestore', error)
  }
}

export function subscribeLutasCasadasFromFirestore(
  torneioId: string,
  onRemoteChange: (lutaCasada: LutaCasada) => void
): Unsubscribe {
  return onSnapshot(collection(getDb(), 'torneios', torneioId, 'lutasCasadas'), snapshot => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'removed') continue
      onRemoteChange(change.doc.data() as LutaCasada)
    }
  })
}
