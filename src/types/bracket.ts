export interface Luta {
  id: string;
  ordem: number;
  atletaAId: string;   // ID do atleta ou "bye"
  atletaBId: string;   // ID do atleta ou "bye"
}

export interface Chave {
  id: string;
  categoriaId: string;
  lutas: Luta[];
  posicoesAtletas: string[];
  arbitroId: string | null;
  totalAtletas: number;
  totalLutas: number;
  status: 'gerada';
}
