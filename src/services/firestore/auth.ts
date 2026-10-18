import { getFunctions, httpsCallable } from 'firebase/functions'
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import { getFirebaseApp } from './firebaseApp'

export async function signInForTournament(torneioId: string): Promise<void> {
  const mintTournamentToken = httpsCallable<{ torneioId: string }, { token: string }>(
    getFunctions(getFirebaseApp()),
    'mintTournamentToken'
  )
  const result = await mintTournamentToken({ torneioId })
  await signInWithCustomToken(getAuth(getFirebaseApp()), result.data.token)
}
