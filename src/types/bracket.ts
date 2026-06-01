export type StatusLuta = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'wo';

export type RodadaNome = 'quartas_de_final' | 'semi_final' | 'final';

export interface Luta {
  id: string;
  categoriaId: string;
  rodada: number;
  rodadaNome: RodadaNome;
  ordem: number;
  posicaoA: number | null;
  posicaoB: number | null;
  atletaAId: string | null;
  atletaBId: string | null;
  vencedorId: string | null;
  status: StatusLuta;
  lutaAnteriorAId: string | null;
  lutaAnteriorBId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Chave {
  id: string;
  categoriaId: string;
  lutas: Luta[];
  posicoesAtletas: string[];
  arbitroId: string | null;
  totalAtletas: number;
  totalRodadas: number;
  totalLutas: number;
  status: 'gerada' | 'em_andamento' | 'finalizada';
  createdAt: string;
  updatedAt: string;
}
