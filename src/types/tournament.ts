import type { Atleta } from './athlete';
import type { Arbitro } from './referee';

export interface Torneio {
  id: string;
  nome: string;
  data: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  atletas?: Atleta[];
  arbitros?: Arbitro[];
}

export interface CreateTorneioInput {
  nome: string;
  data: string;
}
