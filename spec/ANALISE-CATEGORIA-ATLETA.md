# Análise de Impacto — Obrigatoriedade de Categoria no Cadastro/Import de Atletas

## Objetivo

Tornar obrigatória a informação da **categoria de inscrição** do atleta (conforme categorias predeterminadas IBJJF) em todo o fluxo de cadastro e importação de atletas.

---

## Resumo das Mudanças Necessárias

| Tipo | Quantidade |
|------|-----------|
| Arquivos a **criar** | 1 |
| Arquivos a **modificar** | 11 |
| Arquivos de **documentação** a atualizar | 2 |
| **Total de arquivos afetados** | **14** |

---

## 1. NOVOS ARQUIVOS

### 1.1. `src/types/category.ts` — Tipos de Categoria IBJJF

**Motivo:** Definir as categorias oficiais IBJJF como tipos do TypeScript para reuso em toda a aplicação.

**Conteúdo necessário:**
- `CategoriaIBJJF` — interface unificada contendo:
  - `id: string`
  - `nome: string` (ex.: "Adulto Masculino Leve")
  - `faixaEtaria: FaixaEtaria` (Juvenil, Adulto, Master1..Master7)
  - `genero: 'masculino' | 'feminino'`
  - `pesoMaximoKg: number | null` (null para "sem limite")
  - `faixaMinima?: Faixa` (opcional, ex.: azul para Absoluto)
- `FaixaEtaria` — type union com as faixas etárias IBJJF
- `PesoCategoria` — enum/type com os nomes das categorias de peso IBJJF
- `CATEGORIAS_IBJJF` — array constante com todas as categorias pré-definidas (gerado a partir das tabelas do doc/IBJJF.md)
- Função `classificarCategoria(atleta): CategoriaIBJJF | null` — dado um atleta (com peso, faixa, idade, gênero), retorna a categoria IBJJF correspondente

**Depende de:** `src/types/athlete.ts` (tipo `Faixa`)

---

## 2. ARQUIVOS EXISTENTES A MODIFICAR

### 2.1. `src/types/athlete.ts` (Linha 12-21) — Interface Atleta

**O que muda:**
- Adicionar campo `categoria: string` (ID ou nome da categoria IBJJF)
- Adicionar campo `genero: 'masculino' | 'feminino'` (necessário para classificação IBJJF)
- Ambos os campos são **obrigatórios**

**Impacto:** Quebra de compatibilidade com JSONs existentes que não possuem `categoria` e `genero`. Todo atleta existente precisará ser migrado.

**Arquivo:** `src/types/athlete.ts:12`

---

### 2.2. `src/components/AthleteForm.tsx` (Linhas 31-159) — Formulário de Atleta

**O que muda:**
- Adicionar campo `Gênero *` — `Select` com opções `Masculino` / `Feminino` (obrigatório)
- Adicionar campo `Categoria *` — `Select` populado com `CATEGORIAS_IBJJF` agrupadas por faixa etária (obrigatório)
- O Select de Categoria deve ser **dinâmico**: listar apenas categorias compatíveis com a faixa etária + gênero + faixa do atleta (filtragem em tempo real)
- O label de cada opção deve exibir o **intervalo de peso** ao lado do nome, ex.: `Adulto Masculino Leve (até 76,0 kg)` ou `Adulto Masculino Pesadíssimo (sem limite)`
- Validar `genero` e `categoria` nas regras `validate` do `useForm`
- Incluir `genero` e `categoria` no objeto `Atleta` montado em `handleSubmit`

**Arquivo:** `src/components/AthleteForm.tsx:38-99`

---

### 2.3. `src/components/AthleteTable.tsx` (Linhas 27-73) — Tabela de Atletas

**O que muda:**
- Adicionar coluna `Categoria` entre as colunas `Faixa` e `Idade`
- Adicionar coluna `Gênero` (opcional, pode ser abreviada com ícone)
- Mapa de labels para categorias (ex.: `categoriaLabels: Record<string, string>`)

**Arquivo:** `src/components/AthleteTable.tsx:33-36`

---

### 2.4. `src/pages/AdminAthletes.tsx` (Linhas 1-238) — Tela de Gerenciamento de Atletas

**O que muda:**
- Adicionar `genero` e `categoria` nos tipos de retorno
- Atualizar o resumo de faixas (`faixaCounts`) para incluir também contagem por categoria
- Exibir badges de categorias no topo (similar aos badges de faixa já existentes)
- Atualizar verificação de duplicidade (se necessário considerar categoria)
- Garantir que export inclua `categoria` e `genero`

**Arquivo:** `src/pages/AdminAthletes.tsx:131-137` e `178-190`

---

### 2.5. `src/pages/AthletesMenu.tsx` (Linhas 11-136) — Menu de Atletas

**O que muda:**
- Garantir que o fluxo de importação (cartão "Importar Atletas") lide corretamente com a validação de `categoria` e `genero`
- Atualizar tipagem nos states locais

**Arquivo:** `src/pages/AthletesMenu.tsx:7,13`

---

### 2.6. `electron/athletes.ts` (Linhas 61-106) — CRUD e Importação (Main Process)

**O que muda:**
- `importAthletesFromFile()` — validação `categoria` e `genero` como campos obrigatórios (linha 70)
- Adicionar verificação se `categoria` informada existe em `CATEGORIAS_IBJJF`
- Mensagem de erro: `"Atleta inválido no arquivo: '{nome}' — campos obrigatórios ausentes (categoria, genero)."` ou `"Categoria '{categoria}' não reconhecida."`
- Garantir que `categoria` e `genero` sejam preservados durante merge

**Arquivo:** `electron/athletes.ts:69-73`

---

### 2.7. `electron/preload.ts` (Linhas 27-30) — Exposição IPC

**O que muda:**
- Atualizar os tipos dos parâmetros `athlete` nos métodos `saveAthlete` e `updateAthlete` para incluir `categoria: string` e `genero: string`

**Arquivo:** `electron/preload.ts:27,29`

---

### 2.8. `src/types/electron.d.ts` (Linhas 22-27) — Tipos Globais IPC

**O que muda:**
- Atualizar os tipos dos métodos `saveAthlete` e `updateAthlete` para usar a interface `Atleta` atualizada (já usa `Atleta` diretamente, então a atualização é automática se a interface for alterada). Verificar se a tipagem reflete os novos campos obrigatórios.

**Arquivo:** `src/types/electron.d.ts:22-27`

---

### 2.9. `src/types/tournament.ts` (Linha 10) — Interface Torneio

**O que muda:**
- Nenhuma mudança direta na interface, mas o campo `atletas?: Atleta[]` refletirá automaticamente os novos campos `categoria` e `genero` ao importar o tipo `Atleta` atualizado.

**Impacto:** Indireto — o JSON do torneio passará a conter `categoria` e `genero` em cada atleta.

---

### 2.10. `src/pages/Dashboard.tsx` (Linhas 17-24) — Dashboard

**O que muda:**
- O card "Geração de Chaves" (linha 20) e outros cards "planned" não precisam de mudança imediata, mas o card "Categorias" (futuro) deverá ser ativado ou planejado. Por ora, nenhuma alteração no código, apenas documentação.

---

### 2.11. `src/pages/Equipes.tsx` (Linhas 8-120) — Tela de Equipes

**O que muda:**
- Atualmente agrupa atletas apenas por `equipe`. Se for desejável agrupar também por categoria, adicionar coluna ou filtro. Impacto baixo.

---

## 3. DOCUMENTAÇÃO A ATUALIZAR

### 3.1. `doc/IBJJF.md` (Linhas 1-78) — Regras IBJJF

**O que muda:**
- Permanecer como documento de referência, sem alteração de conteúdo (já contém as tabelas de peso e divisões etárias IBJJF)

### 3.2. `doc/requisitos.md` — Documento Mestre de Requisitos

**O que muda:**
- **Seção 2.1** (Implementado): Atualizar entrada "Cadastro de Atletas" e "Importação em Massa de Atletas" para incluir obrigatoriedade de categoria/gênero
- **Seção 2.2** (Planejado): Mover "Cadastro de Categorias" para implementado ou atualizar status
- **Seção 3.8** (Atletas): Adicionar regras sobre `categoria` e `genero` como campos obrigatórios
- **Seção 3.10** (Importação): Adicionar `categoria` e `genero` como campos obrigatórios
- **Seção 6.3/6.4** (JSON Structures): Atualizar exemplos de JSON para incluir `categoria` e `genero`
- **Seção 11.2** (Validação): Adicionar regras de validação para `categoria` e `genero`
- **Seção 12** (Duplicidade): Verificar se duplicidade deve considerar também categoria

---

## 4. Estruturas JSON Atualizadas

### 4.1. JSON do Atleta (após implementação)

```json
{
  "id": "uuid-v4",
  "nome": "joão silva",
  "equipe": "gracie barra",
  "genero": "masculino",
  "categoria": "adulto-masculino-leve",
  "pesoKg": 76.5,
  "faixa": "azul",
  "anoNascimento": 1998,
  "createdAt": "2026-05-31T10:00:00.000Z",
  "updatedAt": "2026-05-31T10:00:00.000Z"
}
```

### 4.2. JSON do Torneio (campo `atletas[]` atualizado)

```json
{
  "atletas": [
    {
      "id": "uuid-v4",
      "nome": "joão silva",
      "equipe": "gracie barra",
      "genero": "masculino",
      "categoria": "adulto-masculino-leve",
      "pesoKg": 76.5,
      "faixa": "azul",
      "anoNascimento": 1998,
      "createdAt": "2026-05-31T10:00:00.000Z",
      "updatedAt": "2026-05-31T10:00:00.000Z"
    }
  ]
}
```

### 4.3. JSON de Importação (array de atletas)

```json
[
  {
    "nome": "joão silva",
    "equipe": "gracie barra",
    "genero": "masculino",
    "categoria": "adulto-masculino-leve",
    "pesoKg": 76.5,
    "faixa": "azul",
    "anoNascimento": 1998
  }
]
```

---

## 5. Lista Consolidada de Arquivos

### 5.1. Criar (1 arquivo)

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `src/types/category.ts` | Interface CategoriaIBJJF, FaixaEtaria, constantes, função classificarCategoria() |

### 5.2. Modificar (11 arquivos)

| # | Arquivo | O que muda |
|---|---------|------------|
| 1 | `src/types/athlete.ts` | + campo `categoria: string`, + campo `genero: 'masculino' \| 'feminino'` |
| 2 | `src/components/AthleteForm.tsx` | + Select Gênero, + Select Categoria (filtrado dinamicamente), validação |
| 3 | `src/components/AthleteTable.tsx` | + coluna Categoria, + coluna Gênero |
| 4 | `src/pages/AdminAthletes.tsx` | + badges de categoria no resumo, atualizar tipagem |
| 5 | `src/pages/AthletesMenu.tsx` | Atualizar tipagem do estado local |
| 6 | `electron/athletes.ts` | Validar `categoria` + `genero` como obrigatórios no import; validar categoria contra lista IBJJF |
| 7 | `electron/preload.ts` | Atualizar tipos dos parâmetros saveAthlete/updateAthlete |
| 8 | `src/types/electron.d.ts` | Verificar compatibilidade de tipos (já usa interface Atleta) |
| 9 | `src/types/tournament.ts` | Impacto indireto via tipo Atleta |
| 10 | `src/pages/Dashboard.tsx` | Nenhuma mudança imediata (futuro card Categorias) |
| 11 | `src/pages/Equipes.tsx` | Possível agrupamento extra por categoria (baixa prioridade) |

### 5.3. Documentação (2 arquivos)

| # | Arquivo | O que muda |
|---|---------|------------|
| 1 | `doc/requisitos.md` | Atualizar seções 2.1, 3.8, 3.10, 6.3, 6.4, 11.2, 12 |
| 2 | `doc/IBJJF.md` | Referência (inalterado, já contém as tabelas) |

### 5.4. Arquivos NÃO afetados (para referência)

| Arquivo | Motivo |
|---------|--------|
| `src/App.tsx` | Rotas permanecem as mesmas (categoria é campo, não rota nova) |
| `electron/main.ts` | Handlers IPC permanecem, só dados mudam |
| `electron/tournament.ts` | CRUD de torneio inalterado |
| `electron/activation.ts` | Sem relação |
| `src/pages/MenuInicial.tsx` | Sem relação |
| `src/pages/CriarTorneio.tsx` | Sem relação |
| `src/pages/ImportarTorneio.tsx` | Sem relação |
| `src/pages/ListarTorneios.tsx` | Sem relação |
| `src/components/PageLayout.tsx` | Sem relação |
| `src/components/ActivationScreen.tsx` | Sem relação |
| `src/components/ErrorBoundary.tsx` | Sem relação |
| `src/styles/theme.ts` | Sem relação |
| `src/styles/global.css` | Sem relação |
| `spec/geracao-chaves.md` | Documento de especificação futura |
| `spec/validacao-credential.md` | Sem relação |

---

## 6. Dependências entre Arquivos

```
src/types/category.ts (NOVO)
    └─ depende de: src/types/athlete.ts (Faixa)

src/types/athlete.ts (MODIFICADO: +categoria, +genero)
    └─ afeta: todas as importações de Atleta

src/components/AthleteForm.tsx
    └─ importa: Atleta de athlete.ts
    └─ importa: CATEGORIAS_IBJJF de category.ts

src/components/AthleteTable.tsx
    └─ importa: Atleta de athlete.ts

src/pages/AdminAthletes.tsx
    └─ importa: Atleta de athlete.ts

src/pages/AthletesMenu.tsx
    └─ importa: Atleta de athlete.ts

electron/athletes.ts
    └─ importa: Atleta de athlete.ts
    └─ importa: CATEGORIAS_IBJJF de category.ts (para validação)

electron/preload.ts
    └─ tipos inline de athlete (atualizar)

src/types/electron.d.ts
    └─ importa: Atleta de athlete.ts (já referenciado)

src/types/tournament.ts
    └─ importa: Atleta de athlete.ts (indireto)

doc/requisitos.md
    └─ documentação (sem dependência de código)
```

---

## 7. Ordem de Implementação Sugerida

| Fase | Tarefa | Arquivos |
|------|--------|----------|
| 1 | Criar tipo Categoria | `src/types/category.ts` |
| 2 | Atualizar interface Atleta | `src/types/athlete.ts` |
| 3 | Atualizar formulário | `src/components/AthleteForm.tsx` |
| 4 | Atualizar tabela | `src/components/AthleteTable.tsx` |
| 5 | Atualizar páginas | `src/pages/AdminAthletes.tsx`, `AthletesMenu.tsx` |
| 6 | Atualizar validação no backend | `electron/athletes.ts` |
| 7 | Atualizar preload/types | `electron/preload.ts`, `src/types/electron.d.ts` |
| 8 | Atualizar documentação | `doc/requisitos.md` |

---

## 8. Categorias IBJJF Pré-Definidas (para referência)

Extraídas de `doc/IBJJF.md`:

### Faixas Etárias
- Juvenil: 16-17 anos
- Adulto: 18-29 anos
- Master 1: 30-35 anos
- Master 2: 36-40 anos
- Master 3: 41-45 anos
- Master 4: 46-50 anos (a cada 5 anos)

### Categorias de Peso — Masculino Adulto
| ID | Nome | Limite (kg) |
|----|------|------------|
| adulto-masculino-galo | Galo | 57,50 |
| adulto-masculino-pluma | Pluma | 64,00 |
| adulto-masculino-pena | Pena | 70,00 |
| adulto-masculino-leve | Leve | 76,00 |
| adulto-masculino-medio | Médio | 82,30 |
| adulto-masculino-meio-pesado | Meio-Pesado | 88,30 |
| adulto-masculino-pesado | Pesado | 94,30 |
| adulto-masculino-super-pesado | Super Pesado | 97,50 |
| adulto-masculino-pesadissimo | Pesadíssimo | Sem limite |

### Categorias de Peso — Feminino Adulto
| ID | Nome | Limite (kg) |
|----|------|------------|
| adulto-feminino-galo | Galo | 48,50 |
| adulto-feminino-pluma | Pluma | 53,50 |
| adulto-feminino-pena | Pena | 58,50 |
| adulto-feminino-leve | Leve | 64,00 |
| adulto-feminino-medio | Médio | 69,00 |
| adulto-feminino-meio-pesado | Meio-Pesado | 74,00 |
| adulto-feminino-pesado | Pesado | 79,30 |
| adulto-feminino-super-pesado | Super Pesado | Sem limite |

> O mesmo padrão se repete para cada faixa etária (Juvenil, Master 1, Master 2, etc.)

### Categoria Absoluto
- Aberto para todas as faixas de peso (mesma faixa etária e gênero)
- Geralmente disponível a partir da faixa azul
