import type { AreaLuta } from './area';
import type { Atleta } from './athlete';
import type { Arbitro } from './referee';
import type { Chave } from './bracket';
import type { LutaCasada } from './lutaCasada';

export interface Torneio {
  id: string;
  nome: string;
  data: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  atletas?: Atleta[];
  arbitros?: Arbitro[];
  chaves?: Chave[];
  areas?: AreaLuta[];
  lutasCasadas?: LutaCasada[];
}

export interface CreateTorneioInput {
  nome: string;
  data: string;
}
