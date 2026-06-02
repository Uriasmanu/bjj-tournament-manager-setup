export type Faixa =
  | 'branca'
  | 'cinza'
  | 'amarela'
  | 'laranja'
  | 'verde'
  | 'azul'
  | 'roxa'
  | 'marrom'
  | 'preta';

export interface Atleta {
  id: string;
  nome: string;
  equipe: string;
  genero: 'masculino' | 'feminino';
  categoria: string;
  pesoKg: number;
  faixa: Faixa;
  anoNascimento: number;
  emChave?: boolean;
  createdAt: string;
  updatedAt: string;
}
