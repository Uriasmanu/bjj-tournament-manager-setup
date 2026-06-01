# Regras de Negócio — Funcionalidade de Gerar Chaves

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Modelos de Dados](#3-modelos-de-dados)
4. [Fluxo de Geração de Chaves](#4-fluxo-de-geração-de-chaves)
5. [Algoritmo de Seed Sorting (Ordenação dos Atletas)](#5-algoritmo-de-seed-sorting-ordenação-dos-atletas)
6. [Algoritmo de Geração de Lutas](#6-algoritmo-de-geração-de-lutas)
7. [Auto-Atribuição de Árbitros](#7-auto-atribuição-de-árbitros)
8. [Operações Pós-Geração](#8-operações-pós-geração)
9. [Regras de Validação](#9-regras-de-validação)
10. [Casos de Borda](#10-casos-de-borda)
11. [Fluxo de Telas (Frontend)](#11-fluxo-de-telas-frontend)
12. [Pseudo-Código Completo](#12-pseudo-código-completo)
13. [Arquivos Envolvidos](#13-arquivos-envolvidos)

---

## 1. Visão Geral

A funcionalidade de **Gerar Chaves** é o coração do sistema de chaveamento de torneios de BJJ. Ela pega os atletas cadastrados, agrupa por categoria, ordena por critérios de seed (peso, idade, nome), separa atletas de mesma equipe em lados opostos da chave, gera as lutas no formato de eliminatória simples, e opcionalmente atribui árbitros automaticamente.

**Tecnologia:** Electron 30 + React 18 + TypeScript 5 + Mantine UI 7  
**Persistência:** Arquivos JSON no diretório `userData` do Electron  
**Comunicação:** IPC (Inter-Process Communication) via `contextBridge`

---

## 2. Arquitetura do Sistema

### 2.1 Camadas

```
[Renderizador React]  ←→  [Preload (contextBridge)]  ←→  [Main Process (Node.js)]
       |                           |                             |
  componentes UI             proxies IPC              handlers + File I/O
  GerenciarChaves.tsx        preload.ts                brackets.ts
  EditarChaveModal.tsx                                 referees.ts
  BracketTree.tsx                                      tournament.ts
  RegistrarResultadoModal.tsx
```

### 2.2 Fluxo de Dados

```
Usuário clica "Gerar Chaves"
  → GerenciarChaves.tsx chama window.electronAPI.gerarTodasChaves()
  → preload.ts traduz para ipcRenderer.invoke('gerar-todas-chaves')
  → main.ts rota para registerBracketHandlers()
  → brackets.ts: gerarTodasChavesHandler()
      → loadTorneio() → lê arquivo JSON do torneio ativo
      → Agrupa atletas por categoria
      → Para cada grupo (2-5 atletas): gerarChave()
          → aplicarSeedSorting()
          → gerarLutas()
      → autoAtribuirArbitros()
      → saveTorneio() → escreve JSON de volta
  → Retorna Chave[] para o renderizador
```

---

## 3. Modelos de Dados

### 3.1 `Torneio` (Tournament) — `src/types/tournament.ts`

```typescript
interface Torneio {
  id: string;
  nome: string;
  data: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  atletas?: Atleta[];
  arbitros?: Arbitro[];
  chaves?: Chave[];     // ← Chaves armazenadas aqui
}
```

### 3.2 `Atleta` (Athlete) — `src/types/athlete.ts`

```typescript
interface Atleta {
  id: string;
  nome: string;
  equipe: string;
  genero: 'masculino' | 'feminino';
  categoria: string;      // ex: "adulto-masculino-leve"
  pesoKg: number;
  faixa: Faixa;           // 'branca' | 'cinza' | ... | 'preta'
  anoNascimento: number;
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 `Chave` (Bracket) — `src/types/bracket.ts`

```typescript
interface Chave {
  id: string;                    // UUID
  categoriaId: string;           // referência à categoria IBJJF
  lutas: Luta[];                 // lista de lutas da chave
  posicoesAtletas: string[];     // IDs dos atletas na ordem de seed
  arbitroId: string | null;      // árbitro designado (null = sem árbitro)
  totalAtletas: number;          // 2, 3, 4 ou 5
  totalRodadas: number;          // 1, 2 ou 3
  totalLutas: number;            // 1, 2, 3 ou 4
  status: 'gerada' | 'em_andamento' | 'finalizada';
  createdAt: string;
  updatedAt: string;
}
```

### 3.4 `Luta` (Fight) — `src/types/bracket.ts`

```typescript
interface Luta {
  id: string;                    // UUID
  categoriaId: string;
  rodada: number;                // 1, 2 ou 3
  rodadaNome: RodadaNome;        // 'quartas_de_final' | 'semi_final' | 'final'
  ordem: number;                 // ordem dentro da rodada (1, 2, ...)
  posicaoA: number | null;       // posição de seed do atleta A (1-5)
  posicaoB: number | null;       // posição de seed do atleta B (1-5)
  atletaAId: string | null;      // ID do atleta (null = bye/aguardando)
  atletaBId: string | null;      // ID do atleta (null = bye/aguardando)
  vencedorId: string | null;     // ID do vencedor (null = indefinido)
  status: StatusLuta;            // 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'wo'
  lutaAnteriorAId: string | null; // luta anterior que alimenta posição A
  lutaAnteriorBId: string | null; // luta anterior que alimenta posição B
  createdAt: string;
  updatedAt: string;
}
```

### 3.5 `Arbitro` (Referee) — `src/types/referee.ts`

```typescript
interface Arbitro {
  id: string;
  nome: string;
  equipe: string;
  faixa: Faixa;           // usada para verificar se é qualificado
  chaveIds: string[];      // chaves atribuídas a este árbitro
  createdAt: string;
  updatedAt: string;
}
```

### 3.6 Relacionamentos

```
Torneio (1) ── tem muitos ──► Atleta (N)
Torneio (1) ── tem muitos ──► Arbitro (N)
Torneio (1) ── tem muitos ──► Chave (N)
Chave (1) ── pertence a ──► Categoria (via categoriaId)
Chave (N) ── pode ter ──► Arbitro (0-1) (via arbitroId)
Chave (1) ── tem muitas ──► Luta (N)
Luta (1) ── pode ter ──► Atleta (0-2) (via atletaAId, atletaBId)
Luta (1) ── referência ──► Luta (0-2) (via lutaAnteriorAId, lutaAnteriorBId)
```

---

## 4. Fluxo de Geração de Chaves

### 4.1 Pré-condição: Torneio Ativo

Todas as operações exigem um torneio ativo. A função `getActiveTournamentId()` em `electron/tournament.ts:20` lê o arquivo `{userData}/data/torneio-ativo.json`. Se nenhum torneio estiver ativo, todos os handlers lançam `'Nenhum torneio ativo'`.

### 4.2 Geração de Todas as Chaves (`gerarTodasChavesHandler`)

Arquivo: `electron/brackets.ts:200`

```
1. Carregar torneio do arquivo JSON
2. Agrupar atletas por categoria (Map<categoriaId, Atleta[]>)
3. Para cada grupo:
   a. Se 2 <= qtd_atletas <= 5 → gerarChave(categoriaId, atletas)
   b. Se qtd_atletas < 2 ou > 5 → pular (silenciosamente)
4. Salvar todas as chaves geradas no torneio
5. Auto-atribuir árbitros (autoAtribuirArbitros)
6. Salvar torneio no arquivo JSON
7. Retornar array de Chave[]
```

### 4.3 Geração de Chave Individual (`gerar-chave` handler)

Arquivo: `electron/brackets.ts:410`

```
1. Validar torneio ativo
2. Carregar torneio
3. Filtrar atletas da categoria específica
4. Validar: 2 <= atletas.length <= 5 (senão → erro)
5. Validar: chave já não existe para esta categoria (senão → erro)
6. Chamar gerarChave(categoriaId, atletas)
7. Adicionar chave à lista de chaves do torneio
8. Salvar torneio
9. Retornar chave criada
```

### 4.4 `gerarChave()` — Função Central

Arquivo: `electron/brackets.ts:145`

```
1. Validar: atletas.length entre 2 e 5
2. Aplicar seed sorting: posicoes = aplicarSeedSorting(atletas)
3. Gerar lutas: lutas = gerarLutas(categoriaId, posicoes)
4. Construir objeto Chave:
   - id: crypto.randomUUID()
   - categoriaId
   - lutas
   - posicoesAtletas: [id1, id2, ...] (ordem do seed sorting)
   - arbitroId: null
   - totalAtletas: posicoes.length
   - totalRodadas: getTotalRodadas(posicoes.length)
   - totalLutas: lutas.length
   - status: 'gerada'
   - createdAt: now
   - updatedAt: now
5. Retornar Chave
```

---

## 5. Algoritmo de Seed Sorting (Ordenação dos Atletas)

Arquivo: `electron/brackets.ts:27` — função `aplicarSeedSorting()`

### 5.1 Critérios de Ordenação (em ordem de prioridade)

1. **Peso (decrescente):** Mais pesado primeiro → `b.pesoKg - a.pesoKg`
2. **Idade (decrescente):** Mais velho primeiro → `idadeB - idadeA`
3. **Nome (alfabético A-Z):** Desempate final → `a.nome.localeCompare(b.nome)`

### 5.2 Separação por Equipes (Team Shielding)

Após a ordenação inicial, os atletas são divididos em dois lados da chave conforme a quantidade:

| Atletas | Lado A | Lado B |
|---------|--------|--------|
| 2 | N/A (sem separação) | N/A |
| 3 | [posição 0] | [posições 1, 2] |
| 4 | [posições 0, 3] | [posições 1, 2] |
| 5 | [posições 0, 3, 4] | [posições 1, 2] |

**Algoritmo de separação:**

```
Para cada lado (A e B):
  Para cada posição no lado:
    Se o atleta tem equipe E esta equipe já existe no mesmo lado:
      Procurar no lado oposto o primeiro atleta:
        - Que NÃO seja da mesma equipe
        - E cuja equipe NÃO esteja já presente no lado atual
      Trocar as posições dos dois atletas
```

**Importante:** Atletas sem equipe (equipe vazia) são ignorados na verificação de conflito.

---

## 6. Algoritmo de Geração de Lutas

Arquivo: `electron/brackets.ts:97-132`

A estrutura da chave varia conforme o número de atletas. Segue o padrão de **eliminatória simples** com byes.

### 6.1 Chave com **2 Atletas** — 1 luta, 1 rodada

```
Rodada 1 (Final):
  Luta 1: Posição 1 vs Posição 2
```

- `posicaoA=1, posicaoB=2`
- `atletaAId=posicoes[0], atletaBId=posicoes[1]`
- Sem lutas anteriores

### 6.2 Chave com **3 Atletas** — 2 lutas, 2 rodadas

```
Rodada 1 (Semifinal):
  Luta 1: Posição 2 vs Posição 3   ← atletas das posições 2 e 3 lutam
  Bye: Posição 1                    ← atleta da posição 1 aguarda na final

Rodada 2 (Final):
  Luta 2: Posição 1 vs Vencedor(Luta 1)
```

- Luta 1: `posicaoA=2, posicaoB=3`, `atletaAId=posicoes[1], atletaBId=posicoes[2]`
- Luta 2: `posicaoA=1, posicaoB=null`, `atletaAId=posicoes[0], atletaBId=null`, `lutaAnteriorAId=null, lutaAnteriorBId=luta1.id`
- A posição B da final é `null` porque o oponente virá da luta anterior

### 6.3 Chave com **4 Atletas** — 3 lutas, 2 rodadas

```
Rodada 1 (Semifinal):
  Luta 1: Posição 1 vs Posição 4
  Luta 2: Posição 2 vs Posição 3

Rodada 2 (Final):
  Luta 3: Vencedor(Luta 1) vs Vencedor(Luta 2)
```

- Luta 1: `posicaoA=1, posicaoB=4`, `atletaAId=posicoes[0], atletaBId=posicoes[3]`
- Luta 2: `posicaoA=2, posicaoB=3`, `atletaAId=posicoes[1], atletaBId=posicoes[2]`
- Luta 3: `posicaoA=null, posicaoB=null`, `atletaAId=null, atletaBId=null`, `lutaAnteriorAId=luta1.id, lutaAnteriorBId=luta2.id`

### 6.4 Chave com **5 Atletas** — 4 lutas, 3 rodadas

```
Rodada 1 (Quartas de Final):
  Luta 1: Posição 4 vs Posição 5
  Bye: Posições 1, 2, 3          ← atletas aguardam

Rodada 2 (Semifinal):
  Luta 2: Posição 1 vs Vencedor(Luta 1)
  Luta 3: Posição 2 vs Posição 3

Rodada 3 (Final):
  Luta 4: Vencedor(Luta 2) vs Vencedor(Luta 3)
```

- Luta 1: `posicaoA=4, posicaoB=5`, `atletaAId=posicoes[3], atletaBId=posicoes[4]`
- Luta 2: `posicaoA=1, posicaoB=null`, `atletaAId=posicoes[0], atletaBId=null`, `lutaAnteriorAId=null, lutaAnteriorBId=luta1.id`
- Luta 3: `posicaoA=2, posicaoB=3`, `atletaAId=posicoes[1], atletaBId=posicoes[2]`
- Luta 4: `posicaoA=null, posicaoB=null`, `lutaAnteriorAId=luta2.id, lutaAnteriorBId=luta3.id`

### 6.5 Mapeamento de Rodadas

Função `getTotalRodadas()` em `electron/brackets.ts:134`:

| Atletas | Rodadas |
|---------|---------|
| 2 | 1 |
| 3 | 2 |
| 4 | 2 |
| 5 | 3 |

### 6.6 Função `criarLuta()`

Arquivo: `electron/brackets.ts:66`

Toda luta é criada com:
- `id`: UUID (crypto.randomUUID())
- `vencedorId: null`
- `status: 'pending'`
- `createdAt/updatedAt`: timestamp atual

---

## 7. Auto-Atribuição de Árbitros

Arquivo: `electron/brackets.ts:168` — função `autoAtribuirArbitros()`

Executada **apenas** na geração de todas as chaves (`gerarTodasChavesHandler`). Não é executada na geração de chave individual.

### 7.1 Algoritmo

```
1. Se não há chaves OU não há árbitros → sair (sem fazer nada)

2. Calcular nível máximo de faixa de cada chave:
   Para cada chave:
     - Para cada atleta na chave (via posicoesAtletas):
       - Encontrar o atleta no torneio
       - Obter o nível numérico da faixa (FAIXA_ORDER)
     - maxLevel = maior nível entre todos os atletas da chave

3. Ordenar chaves por maxLevel (decrescente):
   - Chaves com atletas de faixa mais alta primeiro

4. Para cada chave (da mais difícil para a mais fácil):
   - Encontrar árbitros elegíveis:
     - Onde FAIXA_ORDER[arbitro.faixa] >= maxLevel da chave
   - Se houver elegíveis:
     - Escolher o árbitro com MENOS chaves atribuídas (menor usage)
     - Atribuir: chave.arbitroId = arbitro.id
     - Incrementar contagem de uso do árbitro
     - Adicionar chave.id a arbitro.chaveIds
   - Se não houver elegíveis:
     - Chave fica sem árbitro (arbitroId = null)
```

### 7.2 Ordem de Faixas (FAIXA_ORDER)

```typescript
const FAIXA_ORDER: Record<string, number> = {
  'branca': 0, 'cinza': 1, 'amarela': 2, 'laranja': 3,
  'verde': 4, 'azul': 5, 'roxa': 6, 'marrom': 7, 'preta': 8,
};
```

Um árbitro de faixa `roxa` (nível 6) pode arbitrar chaves cujo atleta de faixa mais alta tenha no máximo `roxa` (nível 6) ou inferior.

### 7.3 Regras de Elegibilidade

- A faixa do árbitro deve ser **maior ou igual** à faixa mais alta entre os atletas da chave
- Entre os elegíveis, escolhe-se o **menos sobrecarregado** (menos chaves atribuídas)
- Se nenhum árbitro atender ao requisito de faixa, a chave fica **sem árbitro**

### 7.4 Atribuição Manual de Árbitro

No handler `atribuir-arbitro-chave` (`electron/brackets.ts:320`):
- Remove a chave da lista do árbitro anterior (se existir)
- Adiciona a chave à lista do novo árbitro (se fornecido)
- **Não** verifica compatibilidade de faixa na atribuição manual
- O árbitro deve existir no torneio (validação)

---

## 8. Operações Pós-Geração

### 8.1 Registro de Resultado de Luta

Handler `atualizar-luta` em `electron/brackets.ts:226`:

```
1. Encontrar luta por ID em todas as chaves do torneio
2. Atualizar vencedorId e status da luta
3. Se status == 'completed' OU 'wo':
   - Encontrar a luta sucessora (onde lutaAnteriorAId == lutaId OU lutaAnteriorBId == lutaId)
   - Se existir sucessor:
     - Se lutaAnteriorAId == lutaId → successor.atletaAId = vencedorId
     - Se lutaAnteriorBId == lutaId → successor.atletaBId = vencedorId
4. Atualizar status da chave:
   - Se TODAS as lutas completadas/WO → status = 'finalizada'
   - Se ALGUMA luta em 'in_progress' → status = 'em_andamento'
   - Caso contrário → mantém status atual
5. Salvar torneio
6. Retornar chave atualizada
```

**Regras de propagação:**
- Quando uma semifinal termina, o vencedor é automaticamente colocado na luta da final
- Quando uma quartas de final termina, o vencedor vai para a semifinal
- Lutas com status `completed` ou `wo` disparam a propagação

### 8.2 Edição de Chave

Handler `editar-chave` em `electron/brackets.ts:285`:

```
Pré-condição: status da chave DEVE ser 'gerada'
  (lutas não podem ter começado)

1. Validar: chave.status === 'gerada' (senão → erro)
2. Validar: novo array de IDs tem o MESMO tamanho de totalAtletas
3. Regenerar lutas com a nova ordenação:
   chave.lutas = gerarLutas(chave.categoriaId, novosAtletas)
4. Atualizar posicoesAtletas
5. Salvar torneio
```

**O que pode ser editado:** apenas a ordem dos atletas (posições)
**O que NÃO pode:** adicionar/remover atletas, mudar estrutura da chave

### 8.3 Regeneração de Chave

Handler `regenerar-chave` em `electron/brackets.ts:445`:

```
Pré-condição: status da chave DEVE ser 'gerada'

1. Verificar se chave existe para a categoria
2. Verificar se status === 'gerada'
3. Recarregar atletas atuais da categoria
4. Validar: 2 <= atletas <= 5
5. Gerar nova chave (gerarChave)
6. Preservar o ID da chave antiga: newChave.id = oldChave.id
7. Salvar torneio
```

**Diferença da geração individual:** a regeneração **substitui** a chave existente e preserva o ID original.

### 8.4 Importação/Exportação de Chaves

**Exportação** (`electron/brackets.ts:388`):
- Abre diálogo nativo "Salvar como"
- Escreve `torneio.chaves` como JSON
- Nome padrão: `{nome_do_torneio}_chaves.json`

**Importação** (`electron/brackets.ts:365`):
- Abre diálogo nativo "Abrir arquivo"
- Valida: conteúdo deve ser array
- Valida: cada item deve ter `id`, `categoriaId`, `lutas` (array)
- Substitui completamente `torneio.chaves`

### 8.5 Exclusão de Árbitro

Quando um árbitro é excluído (`electron/referees.ts:67`):
- Remove o árbitro da lista do torneio
- Para todas as chaves que tinham este árbitro: `arbitroId = null`

---

## 9. Regras de Validação

| # | Regra | Onde | Ocorre Quando |
|---|-------|------|---------------|
| 1 | Torneio ativo é obrigatório | Todos os handlers | Qualquer operação |
| 2 | Mínimo 2 atletas por chave | `gerarChave()` | Geração |
| 3 | Máximo 5 atletas por chave | `gerarChave()` | Geração |
| 4 | Chave duplicada para categoria | `gerar-chave` handler | Geração individual |
| 5 | Status deve ser 'gerada' para editar | `editarChaveHandler()` | Edição |
| 6 | Status deve ser 'gerada' para regenerar | `regenerar-chave` handler | Regeneração |
| 7 | Novo array deve ter mesmo tamanho | `editarChaveHandler()` | Edição |
| 8 | Árbitro deve existir no torneio | `atribuirArbitroHandler()` | Atribuição manual |
| 9 | Arquivo importado deve ser array | `importChavesFromFile()` | Importação |
| 10 | Cada item importado deve ter id, categoriaId, lutas | `importChavesFromFile()` | Importação |

---

## 10. Casos de Borda

### 10.1 Categoria com 0 atletas
Nenhuma chave é gerada. Silenciosamente ignorada.

### 10.2 Categoria com 1 atleta
Nenhuma chave é gerada. Silenciosamente ignorada.

### 10.3 Categoria com mais de 5 atletas
Nenhuma chave é gerada. Silenciosamente ignorada.
**Limitação atual:** o sistema não suporta chaves com mais de 5 atletas.

### 10.4 Nenhum árbitro cadastrado
Chaves são geradas sem árbitro (`arbitroId = null`). A função `autoAtribuirArbitros` retorna imediatamente se `arbitros.length === 0`.

### 10.5 Nenhum árbitro qualificado para a chave
Se todos os árbitros têm faixa inferior à faixa mais alta dos atletas, a chave fica sem árbitro.

### 10.6 Atleta removido após chave gerada
O frontend exibe "Atleta removido" no lugar do nome, mas o sistema não impede. O ID do atleta permanece na chave.

### 10.7 Luta com bye (atleta null)
O `BracketCard` exibe "Bye" no lugar do nome. O `RegistrarResultadoModal` exibe a mensagem "Esta luta aguarda definição de luta(s) anterior(es)." e desabilita a seleção de vencedor.

### 10.8 WO (Walkover)
- Status `'wo'` é tratado como luta completa
- O perdedor tem seu nome exibido com `text-decoration: line-through` no `BracketCard`
- O vencedor é propagado para a próxima rodada normalmente

### 10.9 Atletas sem equipe
Não são considerados no algoritmo de team shielding (separação de equipes).

### 10.10 Conflito de equipes na edição manual
O `EditarChaveModal` exibe um aviso em laranja: "Atenção: atletas da mesma equipe estão no mesmo lado da chave" — mas **não bloqueia** o salvamento.

---

## 11. Fluxo de Telas (Frontend)

### 11.1 Página `GerenciarChaves` (`src/pages/GerenciarChaves.tsx`)

**Estado Inicial (sem chaves):**
```
+----------------------------------+
|   Gerar Chaves do Torneio        |
|   "3 categoria(s) com atletas    |
|    suficientes (2 a 5)..."       |
|   [       Gerar Chaves      ]    |
+----------------------------------+
```

**Estado Pós-Geração (com chaves):**
```
+------------------------------------------+
|  [Gerar Novamente]   [Importar][Exportar] |
|                                           |
|  Chaves Geradas (3)                       |
|  +-------+  +-------+  +-------+         |
|  |Branca  |  |Azul a |  |Roxa a |         |
|  |a Azul  |  |Roxa   |  |Preta  |         |
|  |Leve    |  |Médio  |  |Pesado |         |
|  |3 atlet |  |4 atlet|  |5 atlet|         |
|  |2 rod   |  |2 rod  |  |3 rod  |         |
|  |2 lutas |  |3 lutas|  |4 lutas|         |
|  |Status  |  |Status |  |Status |         |
|  |[Editar]|  |       |  |[Editar]|         |
|  +-------+  +-------+  +-------+         |
+------------------------------------------+
```

### 11.2 Componentes Envolvidos

| Componente | Arquivo | Função |
|------------|---------|--------|
| `GerenciarChaves` | `src/pages/GerenciarChaves.tsx` | Página principal |
| `EditarChaveModal` | `src/components/EditarChaveModal.tsx` | Modal de edição manual |
| `BracketTree` | `src/components/BracketTree.tsx` | Visualização da árvore de chaves |
| `BracketCard` | `src/components/BracketCard.tsx` | Card individual de luta |
| `RegistrarResultadoModal` | `src/components/RegistrarResultadoModal.tsx` | Modal de registro de resultado |

### 11.3 Jornada do Usuário

```
Dashboard
  └─► /admin/categorias/chaves (GerenciarChaves)
       ├─► [Gerar Chaves] → IPC → gera todas as chaves + auto-atribui árbitros
       ├─► [Gerar Novamente] → IPC → regenra todas + reatribui árbitros
       ├─► [Importar Chaves] → diálogo nativo → substitui chaves
       ├─► [Exportar Chaves] → diálogo nativo → salva JSON
       ├─► Card "[Editar Chave]" → EditarChaveModal
       │    ├─► Reordenar atletas (setas ↑↓)
       │    ├─► Embaralhar (aleatório)
       │    ├─► Trocar árbitro (dropdown)
       │    └─► Salvar Edição → IPC → atualiza chave
       └─► (em tela de detalhes) BracketTree
            └─► BracketCard → click → RegistrarResultadoModal
                 ├─► Selecionar vencedor (rádio)
                 ├─► WO (botões)
                 └─► Confirmar → IPC → atualiza luta + propaga
```

### 11.4 Canais IPC (Bracket)

| Canal IPC | Direção | Descrição |
|-----------|---------|-----------|
| `gerar-todas-chaves` | Render → Main | Gera todas as chaves |
| `gerar-chave` | Render → Main | Gera chave de uma categoria |
| `load-chaves` | Render → Main | Carrega todas as chaves |
| `load-chave-por-categoria` | Render → Main | Carrega chave de uma categoria |
| `regenerar-chave` | Render → Main | Regenera chave de uma categoria |
| `atualizar-luta` | Render → Main | Atualiza resultado de luta |
| `editar-chave` | Render → Main | Edita ordem de atletas |
| `atribuir-arbitro-chave` | Render → Main | Atribui/remove árbitro |
| `import-chaves` | Render → Main | Importa chaves de arquivo |
| `export-chaves` | Render → Main | Exporta chaves para arquivo |

---

## 12. Pseudo-Código Completo

### 12.1 Geração de Todas as Chaves

```
FUNCAO gerarTodasChavesHandler(torneioId):
    torneio = carregarTorneio(torneioId)
    atletas = torneio.atletas ?? []

    grupos = Mapa VAZIO
    PARA CADA atleta EM atletas:
        grupo = grupos[atleta.categoria] ?? []
        grupo.ADICIONAR(atleta)
        grupos[atleta.categoria] = grupo

    novasChaves = []
    PARA CADA (categoriaId, grupo) EM grupos:
        SE grupo.tamanho >= 2 E grupo.tamanho <= 5:
            novasChaves.ADICIONAR(gerarChave(categoriaId, grupo))

    torneio.chaves = novasChaves
    autoAtribuirArbitros(torneio)
    salvarTorneio(torneio)
    RETORNAR novasChaves
```

### 12.2 Seed Sorting

```
FUNCAO aplicarSeedSorting(atletas):
    // 1. Ordenar: peso DESC, idade DESC, nome ASC
    ordenados = atletas.ORDENAR(
        a.pesoKg != b.pesoKg ? b.pesoKg - a.pesoKg :
        idade(a) != idade(b) ? idade(b) - idade(a) :
        a.nome.localeCompare(b.nome)
    )
    n = ordenados.tamanho

    SE n <= 2: RETORNAR ordenados

    // 2. Dividir em lados conforme quantidade
    SE n == 3:  ladoA = [0],           ladoB = [1, 2]
    SE n == 4:  ladoA = [0, 3],        ladoB = [1, 2]
    SE n == 5:  ladoA = [0, 3, 4],     ladoB = [1, 2]

    // 3. Separar atletas da mesma equipe
    PARA CADA lado EM [ladoA, ladoB]:
        visitados = {}
        PARA CADA indice EM lado:
            equipe = ordenados[indice].equipe
            SE equipe VAZIA: CONTINUAR
            SE equipe JÁ EM visitados:
                outroLado = (lado == ladoA ? ladoB : ladoA)
                PARA CADA oi EM outroLado:
                    outraEquipe = ordenados[oi].equipe
                    SE outraEquipe != equipe E outraEquipe NÃO EM visitados:
                        TROCAR ordenados[indice] COM ordenados[oi]
                        INTERROMPER
            visitados.ADICIONAR(ordenados[indice].equipe)

    RETORNAR ordenados
```

### 12.3 Geração de Lutas para 2 Atletas

```
FUNCAO gerarLutasDois(categoriaId, posicoes):
    luta1 = criarLuta(
        categoriaId,
        rodada = 1,
        rodadaNome = 'final',
        ordem = 1,
        posicaoA = 1, posicaoB = 2,
        atletaAId = posicoes[0].id, atletaBId = posicoes[1].id,
        lutaAnteriorAId = null, lutaAnteriorBId = null
    )
    RETORNAR [luta1]
```

### 12.4 Geração de Lutas para 3 Atletas

```
FUNCAO gerarLutasTres(categoriaId, posicoes):
    luta1 = criarLuta(categoriaId, 1, 'semi_final', 1,
                      posicaoA=2, posicaoB=3,
                      atletaAId=posicoes[1].id, atletaBId=posicoes[2].id,
                      lutaAnteriorAId=null, lutaAnteriorBId=null)
    luta2 = criarLuta(categoriaId, 2, 'final', 1,
                      posicaoA=1, posicaoB=null,
                      atletaAId=posicoes[0].id, atletaBId=null,
                      lutaAnteriorAId=null, lutaAnteriorBId=luta1.id)
    RETORNAR [luta1, luta2]
```

### 12.5 Geração de Lutas para 4 Atletas

```
FUNCAO gerarLutasQuatro(categoriaId, posicoes):
    luta1 = criarLuta(categoriaId, 1, 'semi_final', 1,
                      posicaoA=1, posicaoB=4,
                      atletaAId=posicoes[0].id, atletaBId=posicoes[3].id,
                      lutaAnteriorAId=null, lutaAnteriorBId=null)
    luta2 = criarLuta(categoriaId, 1, 'semi_final', 2,
                      posicaoA=2, posicaoB=3,
                      atletaAId=posicoes[1].id, atletaBId=posicoes[2].id,
                      lutaAnteriorAId=null, lutaAnteriorBId=null)
    luta3 = criarLuta(categoriaId, 2, 'final', 1,
                      posicaoA=null, posicaoB=null,
                      atletaAId=null, atletaBId=null,
                      lutaAnteriorAId=luta1.id, lutaAnteriorBId=luta2.id)
    RETORNAR [luta1, luta2, luta3]
```

### 12.6 Geração de Lutas para 5 Atletas

```
FUNCAO gerarLutasCinco(categoriaId, posicoes):
    luta1 = criarLuta(categoriaId, 1, 'quartas_de_final', 1,
                      posicaoA=4, posicaoB=5,
                      atletaAId=posicoes[3].id, atletaBId=posicoes[4].id,
                      lutaAnteriorAId=null, lutaAnteriorBId=null)
    luta2 = criarLuta(categoriaId, 2, 'semi_final', 1,
                      posicaoA=1, posicaoB=null,
                      atletaAId=posicoes[0].id, atletaBId=null,
                      lutaAnteriorAId=null, lutaAnteriorBId=luta1.id)
    luta3 = criarLuta(categoriaId, 2, 'semi_final', 2,
                      posicaoA=2, posicaoB=3,
                      atletaAId=posicoes[1].id, atletaBId=posicoes[2].id,
                      lutaAnteriorAId=null, lutaAnteriorBId=null)
    luta4 = criarLuta(categoriaId, 3, 'final', 1,
                      posicaoA=null, posicaoB=null,
                      atletaAId=null, atletaBId=null,
                      lutaAnteriorAId=luta2.id, lutaAnteriorBId=luta3.id)
    RETORNAR [luta1, luta2, luta3, luta4]
```

### 12.7 Atualização de Resultado de Luta

```
FUNCAO atualizarLutaHandler(torneioId, dados):
    torneio = carregarTorneio(torneioId)

    // Encontrar luta
    chave = torneio.chaves[onde luta.id == dados.lutaId]
    luta = chave.lutas[onde luta.id == dados.lutaId]

    // Atualizar resultado
    luta.vencedorId = dados.vencedorId
    luta.status = dados.status

    // Propagar vencedor para próxima rodada
    SE dados.status == 'completed' OU 'wo':
        sucessor = chave.lutas[onde lutaAnteriorAId == lutaId OU lutaAnteriorBId == lutaId]
        SE sucessor EXISTE:
            SE sucessor.lutaAnteriorAId == lutaId:
                sucessor.atletaAId = dados.vencedorId
            SENÃO:
                sucessor.atletaBId = dados.vencedorId

    // Atualizar status da chave
    SE todas as lutas completed/WO:
        chave.status = 'finalizada'
    SENÃO SE qualquer luta in_progress:
        chave.status = 'em_andamento'

    salvarTorneio(torneio)
    RETORNAR chave
```

### 12.8 Auto-Atribuição de Árbitros

```
FUNCAO autoAtribuirArbitros(torneio):
    chaves = torneio.chaves ?? []
    arbitros = torneio.arbitros ?? []
    SE chaves VAZIO OU arbitros VAZIO: RETORNAR

    // Calcular nível máximo de faixa por chave
    chavesComNivel = []
    PARA CADA chave EM chaves:
        atletasDaChave = chave.posicoesAtletas
            .MAPEAR(id → encontrarAtleta(torneio, id))
            .FILTRAR(atleta → atleta EXISTE)
        maxLevel = MAXIMO(atletasDaChave MAPEAR FAIXA_ORDER[faixa])
        chavesComNivel.ADICIONAR({ chave, maxLevel })

    // Ordenar da mais difícil para a mais fácil
    chavesComNivel.ORDENAR(maxLevel DECRESCENTE)

    // Distribuir árbitros
    uso = MAPA VAZIO
    PARA CADA arbitro EM arbitros: uso[arbitro.id] = 0

    PARA CADA { chave, maxLevel } EM chavesComNivel:
        elegiveis = arbitros.ONDE FAIXA_ORDER[faixa] >= maxLevel
        SE elegiveis NÃO VAZIO:
            melhor = elegiveis.COM_MENOR(uso[id])
            chave.arbitroId = melhor.id
            uso[melhor.id]++
            melhor.chaveIds.ADICIONAR(chave.id)
```

---

## 13. Arquivos Envolvidos

### 13.1 Backend (Main Process)

| Arquivo | Linhas | Função |
|---------|--------|--------|
| `electron/brackets.ts` | 1-501 | **Handler central**: toda a lógica de geração, edição, resultado, import/export |
| `electron/tournament.ts` | 1-148 | Gerenciamento de torneios, `getActiveTournamentId()` |
| `electron/referees.ts` | 1-158 | CRUD de árbitros, limpeza de referências ao excluir |
| `electron/main.ts` | 1-176 | Registro dos handlers IPC na inicialização |
| `electron/preload.ts` | 1-75 | Exposição dos canais IPC via `contextBridge` |

### 13.2 Frontend (Renderer)

| Arquivo | Linhas | Função |
|---------|--------|--------|
| `src/pages/GerenciarChaves.tsx` | 1-287 | Página principal de gerenciamento de chaves |
| `src/components/EditarChaveModal.tsx` | 1-257 | Modal de edição manual de chave |
| `src/components/BracketTree.tsx` | 1-54 | Visualização da árvore de chaves |
| `src/components/BracketCard.tsx` | 1-55 | Card individual de luta |
| `src/components/RegistrarResultadoModal.tsx` | 1-105 | Modal de registro de resultado |

### 13.3 Types (Compartilhados)

| Arquivo | Linhas | Função |
|---------|--------|--------|
| `src/types/bracket.ts` | 1-35 | Interfaces `Chave`, `Luta`, `StatusLuta`, `RodadaNome` |
| `src/types/tournament.ts` | 1-20 | Interface `Torneio` (contém `chaves?`) |
| `src/types/athlete.ts` | 1-23 | Interface `Atleta` e tipo `Faixa` |
| `src/types/referee.ts` | 1-11 | Interface `Arbitro` |
| `src/types/category.ts` | 1-185 | Sistema de categorias IBJJF e constantes |
| `src/types/electron.d.ts` | 1-52 | Declarações de tipos para `window.electronAPI` |

---

## 14. Limitações Conhecidas

1. **Hard cap de 5 atletas:** O sistema não suporta categorias com mais de 5 atletas. Para torneios reais com 8, 16 ou mais atletas, seria necessário expandir o algoritmo.

2. **Sem disputa de 3º lugar:** Seguindo regras IBJJF, não há luta pelo bronze. Ambos os perdedores das semifinais dividem o 3º lugar.

3. **Sem repescagem:** Eliminatória simples apenas. Não há chave de repescagem.

4. **Sem round-robin:** Não há opção de fase de grupos.

5. **Edição limitada:** O modal de edição só permite reordenar atletas e trocar árbitro. Não é possível adicionar/remover atletas ou alterar a estrutura da chave.

6. **Sem undo:** Resultados de luta não podem ser revertidos após confirmação.

7. **Sem verificação de faixa na atribuição manual:** A auto-atribuição verifica compatibilidade de faixa, mas a atribuição manual no modal não.

8. **Persistência em JSON único:** Todas as chaves são armazenadas em um único arquivo JSON do torneio, o que pode se tornar grande.

---

*Documento gerado em 01/06/2026 — BJJ Tournament Manager Setup v1.0*
