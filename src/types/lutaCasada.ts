import type { PlacarLuta } from './bracket';

export interface AtletaSnapshot {
  id: string;
  nome: string;
  faixa: string;
  pesoKg: number;
  equipe: string;
  categoria: string;
}

export type LutaCasadaStatus = 'pending' | 'completed' | 'wo';

export interface LutaCasada {
  id: string;
  areaId: string;
  arbitroId: string | null;
  atletaAId: string;
  atletaBId: string;
  atletaASnapshot: AtletaSnapshot;
  atletaBSnapshot: AtletaSnapshot;
  tag: 'luta-casada';
  status: LutaCasadaStatus;
  placarA?: PlacarLuta;
  placarB?: PlacarLuta;
  vencedorId?: string | null;
  finalizacao?: boolean;
  desclassificacao?: boolean;
  desempateArbitro?: boolean;
  dataFinalizacao?: string | null;
  tempoRealSegundos?: number;
  horarioInicio?: string;
  createdAt: string;
  updatedAt: string;
}
