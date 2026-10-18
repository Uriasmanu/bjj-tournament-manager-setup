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

export interface MintTokenDeps {
  getTorneioDoc: (torneioId: string) => Promise<{ exists: boolean }>
  createTorneioDoc: (torneioId: string) => Promise<void>
  createCustomToken: (torneioId: string) => Promise<string>
}

/**
 * Se o torneio ainda não existe no Firestore (primeira vez que este PC sincroniza
 * um torneio criado localmente), cria um documento mínimo via Admin SDK antes de
 * emitir o token — sem isso, nenhum cliente jamais conseguiria autenticar, porque
 * a regra de segurança exige o claim do token para criar o próprio documento que
 * o token depende de já existir.
 */
export async function mintTournamentTokenHandler(torneioId: string, deps: MintTokenDeps): Promise<{ token: string }> {
  const doc = await deps.getTorneioDoc(torneioId)
  if (!doc.exists) {
    await deps.createTorneioDoc(torneioId)
  }
  const token = await deps.createCustomToken(torneioId)
  return { token }
}

export const mintTournamentToken = onCall<MintTokenInput>(async (request) => {
  validateMintTokenInput(request.data)
  const { torneioId } = request.data

  return mintTournamentTokenHandler(torneioId, {
    getTorneioDoc: async (id) => getFirestore().collection('torneios').doc(id).get(),
    createTorneioDoc: async (id) => {
      await getFirestore().collection('torneios').doc(id).set({ id }, { merge: true })
    },
    createCustomToken: async (id) => getAuth().createCustomToken(id, { torneioId: id }),
  })
})
