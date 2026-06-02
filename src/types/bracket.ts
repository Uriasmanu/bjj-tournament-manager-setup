export interface Luta {
  id: string;
  ordem: number;
  rodada: number;
  atletaAId: string;   // ID do atleta ou "bye"
  atletaBId: string;   // ID do atleta ou "bye"
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'wo';
  vencedorId?: string | null;
}

export interface Chave {
  id: string;
  categoriaId: string;
  lutas: Luta[];
  posicoesAtletas: string[];
  arbitroId: string | null;
  totalAtletas: number;
  totalLutas: number;
  totalRodadas: number;
  status: 'gerada';
}
