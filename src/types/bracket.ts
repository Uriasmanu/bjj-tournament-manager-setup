export interface PlacarLuta {
  pontos2: number;
  pontos3: number;
  pontos4: number;
  vantagens: number;
  punicoes: number;
  total: number;
}

export interface Luta {
  id: string;
  ordem: number;
  rodada: number;
  atletaAId: string;
  atletaBId: string;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'wo';
  vencedorId?: string | null;
  placarA?: PlacarLuta;
  placarB?: PlacarLuta;
  finalizacao?: boolean;
  desclassificacao?: boolean;
  desclassificadoId?: string;
  desempateArbitro?: boolean;
  tempoRealSegundos?: number;
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
