import type { Atleta } from './athlete';
import type { Arbitro } from './referee';
import type { Chave } from './bracket';

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
}

export interface CreateTorneioInput {
  nome: string;
  data: string;
}
