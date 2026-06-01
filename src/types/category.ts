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
  { peso: 'pesado', nome: 'Pesado', masculino: 94.3, feminino: 79.3 },
  { peso: 'super-pesado', nome: 'Super Pesado', masculino: 97.5, feminino: null },
  { peso: 'pesadissimo', nome: 'Pesadíssimo', masculino: null, feminino: null },
];

const kidsLabel: Record<string, string> = {
  'pre-mirim': 'Pré-Mirim',
  'mirim': 'Mirim',
  'infantil-a': 'Infantil A',
  'infantil-b': 'Infantil B',
  'infanto-juvenil-a': 'Infanto-Juvenil A',
  'infanto-juvenil-b': 'Infanto-Juvenil B',
};

const KIDS_WEIGHT_FACTOR: Record<string, number> = {
  'pre-mirim': 0.30,
  'mirim': 0.40,
  'infantil-a': 0.50,
  'infantil-b': 0.60,
  'infanto-juvenil-a': 0.70,
  'infanto-juvenil-b': 0.85,
};

function arredondar(valor: number | null): number | null {
  if (valor === null) return null;
  return Math.round(valor * 10) / 10;
}

function getPesoLimite(
  faixaEtaria: FaixaEtaria,
  genero: 'masculino' | 'feminino',
  cat: CategoriaDef
): number | null {
  const base = genero === 'masculino' ? cat.masculino : cat.feminino;

  const factor = KIDS_WEIGHT_FACTOR[faixaEtaria];
  if (factor !== undefined) {
    if (cat.peso === 'pesadissimo') return null;
    if (cat.peso === 'super-pesado' && base === null) return null;
    return base !== null ? arredondar(base * factor) : null;
  }

  if (cat.peso === 'pesadissimo' && genero === 'feminino') return null;
  return base;
}

function gerarCategorias(): CategoriaIBJJF[] {
  const faixasEtarias: FaixaEtaria[] = [
    'pre-mirim', 'mirim', 'infantil-a', 'infantil-b',
    'infanto-juvenil-a', 'infanto-juvenil-b',
    'juvenil', 'adulto', 'master1', 'master2', 'master3',
    'master4', 'master5', 'master6', 'master7',
  ];
  const generos: ('masculino' | 'feminino')[] = ['masculino', 'feminino'];
  const result: CategoriaIBJJF[] = [];

  for (const fe of faixasEtarias) {
    const feLabel = kidsLabel[fe] || fe.charAt(0).toUpperCase() + fe.slice(1);
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
