import { signInForTournament } from '../firestore/auth'
import { pushAthleteToFirestore } from './atletasSync'
import { pushArbitroToFirestore } from './arbitrosSync'
import { pushAreaToFirestore } from './areasSync'
import { pushChaveMetaToFirestore, pushLutaToFirestore } from './chavesSync'
import { pushLutaCasadaToFirestore } from './lutasCasadasSync'
import { pushTorneioMetaToFirestore } from './categoriasSync'
import type { Chave } from '../../types/bracket'

type ElectronAPI = Window['electronAPI']

export async function enviarTorneioParaNuvem(
  torneioId: string,
  api: ElectronAPI = window.electronAPI
): Promise<{ enviados: number }> {
  await signInForTournament(torneioId)

  const [torneio, atletas, arbitros, areas, chaves, lutasCasadas, categorias] = await Promise.all([
    api.getActiveTournament(),
    api.loadAthletes(),
    api.loadArbitros(),
    api.loadAreas(),
    api.loadChaves(),
    api.loadLutasCasadas(),
    api.loadCategorias(),
  ])

  let enviados = 0

  if (torneio) {
    await pushTorneioMetaToFirestore({
      id: torneio.id,
      nome: torneio.nome,
      data: torneio.data,
      categoriasDesabilitadas: categorias.desabilitadas,
      categoriasCustomizadas: categorias.customizadas,
      updatedAt: torneio.updatedAt,
    })
    enviados += 1
  }

  for (const atleta of atletas) {
    await pushAthleteToFirestore(torneioId, atleta)
    enviados += 1
  }
  for (const arbitro of arbitros) {
    await pushArbitroToFirestore(torneioId, arbitro)
    enviados += 1
  }
  for (const area of areas) {
    await pushAreaToFirestore(torneioId, area)
    enviados += 1
  }
  for (const chave of chaves as Chave[]) {
    const { lutas, ...meta } = chave
    await pushChaveMetaToFirestore(torneioId, meta)
    enviados += 1
    for (const luta of lutas) {
      await pushLutaToFirestore(torneioId, chave.id, luta)
      enviados += 1
    }
  }
  for (const lutaCasada of lutasCasadas) {
    await pushLutaCasadaToFirestore(torneioId, lutaCasada)
    enviados += 1
  }

  return { enviados }
}
