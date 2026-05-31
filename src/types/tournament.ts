export interface Torneio {
  id: string;
  nome: string;
  data: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTorneioInput {
  nome: string;
  data: string;
}
