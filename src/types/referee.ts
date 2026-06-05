import type { Faixa } from './athlete';

export interface Arbitro {
  id: string;
  nome: string;
  equipe: string;
  faixa: Faixa;
  chaveIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
