import { doc, setDoc, collection, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { getDb } from '../firestore/firebaseApp'
import type { Chave, Luta } from '../../types/bracket'

type ChaveMeta = Omit<Chave, 'lutas'>

export async function pushChaveMetaToFirestore(torneioId: string, chave: ChaveMeta): Promise<void> {
  try {
    await setDoc(doc(getDb(), 'torneios', torneioId, 'chaves', chave.id), chave)
  } catch (error) {
    console.error('[chavesSync] falha ao sincronizar chave com o Firestore', error)
  }
}

export async function pushLutaToFirestore(torneioId: string, chaveId: string, luta: Luta): Promise<void> {
  try {
    await setDoc(doc(getDb(), 'torneios', torneioId, 'chaves', chaveId, 'lutas', luta.id), luta)
  } catch (error) {
    console.error('[chavesSync] falha ao sincronizar luta com o Firestore', error)
  }
}

export function subscribeChavesFromFirestore(
  torneioId: string,
  onRemoteChange: (chave: ChaveMeta) => void
): Unsubscribe {
  return onSnapshot(collection(getDb(), 'torneios', torneioId, 'chaves'), snapshot => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'removed') continue
      onRemoteChange(change.doc.data() as ChaveMeta)
    }
  })
}

export function subscribeLutasFromFirestore(
  torneioId: string,
  chaveId: string,
  onRemoteChange: (luta: Luta) => void
): Unsubscribe {
  return onSnapshot(collection(getDb(), 'torneios', torneioId, 'chaves', chaveId, 'lutas'), snapshot => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'removed') continue
      onRemoteChange(change.doc.data() as Luta)
    }
  })
}
