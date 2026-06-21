import type { Faixa } from './athlete';

export type FaixaEtaria =
  | 'pre-mirim'
  | 'mirim'
  | 'infantil-a'
  | 'infantil-b'
  | 'infanto-juvenil-a'
  | 'infanto-juvenil-b'
  | 'juvenil'
  | 'adulto'
  | 'master1'
  | 'master2'
  | 'master3'
  | 'master4'
  | 'master5'
  | 'master6'
  | 'master7';

export type PesoCategoria =
  | 'galo'
  | 'pluma'
  | 'pena'
  | 'leve'
  | 'medio'
  | 'meio-pesado'
  | 'pesado'
  | 'super-pesado'
  | 'pesadissimo';

export interface CategoriaIBJJF {
  id: string;
  nome: string;
  faixaEtaria: FaixaEtaria;
  genero: 'masculino' | 'feminino';
  peso: PesoCategoria;
  pesoMaximoKg: number | null;
  faixaMinima?: Faixa;
}

interface CategoriaDef {
  peso: PesoCategoria;
  nome: string;
  masculino: number | null;
  feminino: number | null;
}

const CATEGORIAS_PESO: CategoriaDef[] = [
  { peso: 'galo', nome: 'Galo', masculino: 57.5, feminino: 48.5 },
  { peso: 'pluma', nome: 'Pluma', masculino: 64.0, feminino: 53.5 },
  { peso: 'pena', nome: 'Pena', masculino: 70.0, feminino: 58.5 },
  { peso: 'leve', nome: 'Leve', masculino: 76.0, feminino: 64.0 },
  { peso: 'medio', nome: 'Médio', masculino: 82.3, feminino: 69.0 },
  { peso: 'meio-pesado', nome: 'Meio-Pesado', masculino: 88.3, feminino: 74.0 },
  { peso: 'pesado', nome: 'Pesado', masculino: 94.3, feminino: null },
  { peso: 'super-pesado', nome: 'Super Pesado', masculino: 100.5, feminino: null },
  { peso: 'pesadissimo', nome: 'Pesadíssimo', masculino: null, feminino: null },
];

const KIDS_PESO_LIMITES: Record<string, Record<string, number | null>> = {
  'pre-mirim':         { galo: 14.7, pluma: 17.9, pena: 20.0, leve: 24.0, medio: 26.0, 'meio-pesado': 29.0, pesado: 31.2, 'super-pesado': 33.2, pesadissimo: null },
  'mirim':             { galo: 21.0, pluma: 24.0, pena: 27.0, leve: 30.2, medio: 33.2, 'meio-pesado': 36.2, pesado: 39.3, 'super-pesado': 42.3, pesadissimo: null },
  'infantil-a':        { galo: 27.0, pluma: 30.2, pena: 33.2, leve: 36.2, medio: 39.3, 'meio-pesado': 42.3, pesado: 45.3, 'super-pesado': 48.3, pesadissimo: null },
  'infantil-b':        { galo: 36.2, pluma: 40.3, pena: 44.3, leve: 48.3, medio: 52.5, 'meio-pesado': 56.5, pesado: 60.5, 'super-pesado': 65.0, pesadissimo: null },
  'infanto-juvenil-a': { galo: 40.3, pluma: 44.3, pena: 48.3, leve: 52.5, medio: 56.5, 'meio-pesado': 60.5, pesado: 65.0, 'super-pesado': 69.5, pesadissimo: null },
  'infanto-juvenil-b': { galo: 48.3, pluma: 52.5, pena: 56.5, leve: 60.5, medio: 65.0, 'meio-pesado': 69.5, pesado: 74.0, 'super-pesado': 78.5, pesadissimo: null },
};

function getPesoLimite(
  faixaEtaria: FaixaEtaria,
  genero: 'masculino' | 'feminino',
  cat: CategoriaDef
): number | null | undefined {
  const kidsLimites = KIDS_PESO_LIMITES[faixaEtaria];
  if (kidsLimites) {
    return kidsLimites[cat.peso] ?? null;
  }

  if (genero === 'feminino' && (cat.peso === 'super-pesado' || cat.peso === 'pesadissimo')) {
    return undefined;
  }

  const base = genero === 'masculino' ? cat.masculino : cat.feminino;
  return base;
}

function gerarCategorias(): CategoriaIBJJF[] {
  const faixasEtarias: FaixaEtaria[] = ['adulto'];
  const generos: ('masculino' | 'feminino')[] = ['masculino', 'feminino'];
  const result: CategoriaIBJJF[] = [];

  for (const fe of faixasEtarias) {
    const feLabel = fe.charAt(0).toUpperCase() + fe.slice(1);
    for (const gen of generos) {
      const genLabel = gen === 'masculino' ? 'Masculino' : 'Feminino';
      for (const cat of CATEGORIAS_PESO) {
        const pesoLimite = getPesoLimite(fe, gen, cat);
        if (pesoLimite === undefined) continue;
        result.push({
          id: `${fe}-${gen}-${cat.peso}`,
          nome: `${feLabel} ${genLabel} ${cat.nome}`,
          faixaEtaria: fe,
          genero: gen,
          peso: cat.peso,
          pesoMaximoKg: pesoLimite,
        });
      }
    }
  }
  return result;
}

export const CATEGORIAS_IBJJF: CategoriaIBJJF[] = gerarCategorias();

export const categoriaLabels: Record<string, string> = {};
for (const c of CATEGORIAS_IBJJF) {
  categoriaLabels[c.id] = c.nome;
}

export function getCategoriaLabel(categoriaId: string, customizadas?: CategoriaCustomizada[]): string {
  if (categoriaLabels[categoriaId]) return categoriaLabels[categoriaId];
  if (customizadas) {
    const custom = customizadas.find(c => c.id === categoriaId);
    if (custom) return custom.nome;
  }
  return categoriaId;
}

function calcularFaixaEtaria(idade: number): FaixaEtaria | null {
  if (idade >= 4 && idade <= 5) return 'pre-mirim';
  if (idade >= 6 && idade <= 7) return 'mirim';
  if (idade >= 8 && idade <= 9) return 'infantil-a';
  if (idade >= 10 && idade <= 11) return 'infantil-b';
  if (idade >= 12 && idade <= 13) return 'infanto-juvenil-a';
  if (idade >= 14 && idade <= 15) return 'infanto-juvenil-b';
  if (idade >= 16 && idade <= 17) return 'juvenil';
  if (idade >= 18 && idade <= 29) return 'adulto';
  if (idade >= 30 && idade <= 35) return 'master1';
  if (idade >= 36 && idade <= 40) return 'master2';
  if (idade >= 41 && idade <= 45) return 'master3';
  if (idade >= 46 && idade <= 50) return 'master4';
  if (idade >= 51 && idade <= 55) return 'master5';
  if (idade >= 56 && idade <= 60) return 'master6';
  if (idade >= 61) return 'master7';
  return null;
}

function encontrarCategoriaPorPeso(
  faixaEtaria: FaixaEtaria,
  genero: 'masculino' | 'feminino',
  pesoKg: number
): CategoriaIBJJF | null {
  const candidatas = CATEGORIAS_IBJJF.filter(
    (c) => c.faixaEtaria === faixaEtaria && c.genero === genero
  );

  candidatas.sort((a, b) => {
    if (a.pesoMaximoKg === null) return 1;
    if (b.pesoMaximoKg === null) return -1;
    return a.pesoMaximoKg - b.pesoMaximoKg;
  });

  for (const cat of candidatas) {
    if (cat.pesoMaximoKg === null) return cat;
    if (pesoKg <= cat.pesoMaximoKg) return cat;
  }
  return null;
}

export interface ClassificarInput {
  pesoKg: number;
  anoNascimento: number;
  faixa: string;
  genero: 'masculino' | 'feminino';
}

export function classificarCategoria(atleta: ClassificarInput): CategoriaIBJJF | null {
  const idade = new Date().getFullYear() - atleta.anoNascimento;
  const faixaEtaria = calcularFaixaEtaria(idade);
  if (!faixaEtaria) return null;

  return encontrarCategoriaPorPeso(faixaEtaria, atleta.genero, atleta.pesoKg);
}

export interface CategoriaCustomizada {
  id: string;
  nome: string;
  pesoMinimoKg: number;
  pesoMaximoKg: number;
  tempoLutaMinutos: number;
  createdAt: string;
  updatedAt: string;
}
