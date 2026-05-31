export interface Torneio {
  id: string;
  nome: string;
  data: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
}

export interface CreateTorneioInput {
  nome: string;
  data: string;
}
