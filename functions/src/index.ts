import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

initializeApp()

export interface MintTokenInput {
  torneioId: string
}

export function validateMintTokenInput(data: unknown): asserts data is MintTokenInput {
  const torneioId = (data as Partial<MintTokenInput> | undefined)?.torneioId
  if (!torneioId || typeof torneioId !== 'string') {
    throw new HttpsError('invalid-argument', 'torneioId é obrigatório')
  }
}

export const mintTournamentToken = onCall<MintTokenInput>(async (request) => {
  validateMintTokenInput(request.data)
  const { torneioId } = request.data

  const doc = await getFirestore().collection('torneios').doc(torneioId).get()
  if (!doc.exists) {
    throw new HttpsError('not-found', 'Torneio não encontrado')
  }

  const token = await getAuth().createCustomToken(torneioId, { torneioId })
  return { token }
})
