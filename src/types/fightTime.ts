import type { Atleta, Faixa } from './athlete';

export type FaixaEtariaTempo = 'mirim' | 'infantil' | 'infanto-juvenil' | 'juvenil' | 'adulto' | 'master';

const TEMPO_FALLBACK_MINUTOS = 5;

function calcularIdade(anoNascimento: number): number {
  if (!anoNascimento || anoNascimento <= 0) return -1;
  return new Date().getFullYear() - anoNascimento;
}

function classificarFaixaEtariaTempo(idade: number): FaixaEtariaTempo | null {
  if (idade < 0) return null;
  if (idade >= 4 && idade <= 6) return 'mirim';
  if (idade >= 7 && idade <= 9) return 'infantil';
  if (idade >= 10 && idade <= 15) return 'infanto-juvenil';
  if (idade >= 16 && idade <= 17) return 'juvenil';
  if (idade >= 18 && idade <= 29) return 'adulto';
  if (idade >= 30) return 'master';
  return null;
}

const FAIXAS_KIDS: ReadonlyArray<Faixa> = ['branca', 'cinza', 'amarela', 'laranja', 'verde'];

function tempoAdulto(faixa: Faixa): number {
  if (FAIXAS_KIDS.includes(faixa)) return 5;
  if (faixa === 'azul') return 6;
  if (faixa === 'roxa') return 7;
  if (faixa === 'marrom') return 8;
  if (faixa === 'preta') return 10;
  return TEMPO_FALLBACK_MINUTOS;
}

function tempoMaster(faixa: Faixa): number {
  if (faixa === 'branca' || faixa === 'azul') return 5;
  if (faixa === 'roxa') return 6;
  if (faixa === 'marrom' || faixa === 'preta') return 7;
  if (FAIXAS_KIDS.includes(faixa)) return 5;
  return TEMPO_FALLBACK_MINUTOS;
}

export function sugerirTempoLutaMinutos(atleta: Pick<Atleta, 'anoNascimento' | 'faixa'>): number {
  const idade = calcularIdade(atleta.anoNascimento);
  const grupo = classificarFaixaEtariaTempo(idade);
  if (!grupo) return TEMPO_FALLBACK_MINUTOS;

  switch (grupo) {
    case 'mirim':
      return 2;
    case 'infantil':
      return 3;
    case 'infanto-juvenil':
      return 4;
    case 'juvenil':
      return 5;
    case 'adulto':
      return tempoAdulto(atleta.faixa);
    case 'master':
      return tempoMaster(atleta.faixa);
    default:
      return TEMPO_FALLBACK_MINUTOS;
  }
}

export const TEMPO_LUTA_FALLBACK_MINUTOS = TEMPO_FALLBACK_MINUTOS;
