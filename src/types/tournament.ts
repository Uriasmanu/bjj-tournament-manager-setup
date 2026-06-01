import type { Atleta } from './athlete';

export interface Torneio {
  id: string;
  nome: string;
  data: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  atletas?: Atleta[];
}

export interface CreateTorneioInput {
  nome: string;
  data: string;
}
