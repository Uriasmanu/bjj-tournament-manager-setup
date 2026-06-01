# Geração de Chaves de Luta

## 1. Visão Geral

O módulo de **Geração de Chaves** é responsável por criar as chaves de competição (brackets) para cada categoria configurada no torneio. A chave define o emparelhamento dos atletas em uma sequência de lutas no formato eliminatório simples (single-elimination), determinando quem enfrenta quem até a definição do campeão.

A geração de chaves depende exclusivamente do módulo de **Categorias** (especificado em `spec/categorias-configuracao.md`): uma chave só pode ser gerada para uma categoria que já exista e contenha atletas classificados.

---

## 2. Status da Implementação

| Funcionalidade | Status |
|---|---|
| Geração automática de chaves por categoria | ❌ Pendente |
| Visualização de chave (bracket tree) | ❌ Pendente |
| Edição manual de posições na chave | ❌ Pendente |
| Histórico de lutas por chave | ❌ Pendente |
| Suporte a WO / desistência | ❌ Pendente |

---

## 3. Regras de Negócio

### 3.1. Pré-requisitos

- A categoria deve existir no torneio (ver `Categoria` em `spec/categorias-configuracao.md`).
- A categoria deve ter no mínimo **2 atletas** classificados para gerar uma chave.
- Categorias com **1 atleta** são consideradas "Categoria única" — o atleta é declarado campeão automaticamente sem necessidade de chave.
- Categorias com **0 atletas** não geram chave.

### 3.2. Formato da Chave

O sistema adota o formato **eliminatório simples** (single-elimination) da IBJJF:

- Cada luta elimina o perdedor.
- O vencedor avança para a rodada seguinte.
- Ao final, resta um campeão invicto.
- **Não há repescagem** para disputa de primeiro lugar.
- **Não há disputa de terceiro lugar.** Os dois atletas que perdem nas semifinais recebem a medalha de bronze e dividem o 3º lugar no pódio.
- A única exceção ao formato de eliminação direta é a chave de **3 atletas**, que utiliza o sistema *Three-Competitor Repechage* (ver seção 3.2.3).

#### 3.2.1. Definição de Rodadas

O número de rodadas (excluindo chaves de 3 atletas) é definido pelo total de atletas na categoria:

| Atletas | Rodadas | Total de Lutas |
|---|---|---|
| 2 | 1 (Final) | 1 |
| 4 | 2 (Semifinais + Final) | 3 |
| 5–8 | 3 (Quartas + Semi + Final) | 7 |
| 9–16 | 4 (Oitavas + Quartas + Semi + Final) | 15 |
| 17–32 | 5 | 31 |
| 33–64 | 6 | 63 |
| 65–128 | 7 | 127 |

Fórmula: `rodadas = ceil(log2(N))` onde N é o número de atletas (válido para N ≠ 3).

#### 3.2.2. Byes (Folgas)

Quando o número de atletas **não é potência de 2** (e N ≠ 3), atletas recebem byes automaticamente na primeira rodada.

- Número de byes = `próximaPotenciaDe2(N) - N`
- Byes são distribuídos preferencialmente para os atletas melhor posicionados (seed sorting).
- Atletas com bye avançam diretamente à rodada seguinte sem lutar.

Exemplo: 5 atletas → potência = 8 → 3 byes na primeira rodada.

#### 3.2.3. Exceção: Chave de 3 Atletas (Three-Competitor Repechage)

Quando exatamente **3** atletas estão inscritos na categoria, a IBJJF aplica o sistema de repescagem restrita (*Three-Competitor Repechage*), **não** o sistema de bye:

```
Luta 1 (Semifinal): Atleta A vs Atleta B
    ├── Vencedor → aguarda na Final
    └── Perdedor → Luta 2

Luta 2 (Repescagem): Perdedor da Luta 1 vs Atleta C
    └── Vencedor → Final

Luta 3 (Final): Vencedor da Luta 1 vs Vencedor da Luta 2
```

Regras:
- Um atleta pode perder a primeira luta e ainda se sagrar campeão se vencer as duas etapas seguintes.
- O Atleta C (que não lutou na Luta 1) **não** recebe bye — ele luta contra o perdedor da Luta 1.
- A chave de 3 atletas possui 3 lutas no total (não 2 como no sistema de bye).
- A alocação de A, B e C aos slots segue o seed sorting (equipes separadas ao máximo).

### 3.3. Seed Sorting (Posicionamento) — Regra IBJJF

A IBJJF determina que **atletas da mesma equipe/academia sejam colocados em lados opostos da chave**, de forma que só possam se enfrentar na final. Este é o critério mais importante e deve ser rigorosamente respeitado.

#### 3.3.1. Algoritmo de Separação por Equipe (IBJJF)

```
1. Agrupar atletas por equipe.
2. Ordenar grupos do maior para o menor (mais atletas primeiro).
3. Distribuir atletas intercaladamente nos lados opostos da chave:
   - Metade superior: posições 1, 2, 3, ..., N/2
   - Metade inferior: posições N, N-1, N-2, ..., N/2+1
4. Atletas da MESMA equipe devem cair em lados OPOSTOS:
   - Primeiro atleta da equipe → metade superior
   - Segundo atleta da mesma equipe → metade inferior
   - Terceiro atleta → metade superior (se houver)
   - (alternando sempre entre superior e inferior)
5. Dentro de cada metade, a ordem é definida por peso (maior peso primeiro).
```

#### 3.3.2. Critérios de Desempate (para ranked seeding em grandes eventos)

Em eventos como o Mundial, a IBJJF utiliza ranking oficial para posicionar **cabeças de chave** (seeds) em posições estratégicas, evitando que os melhores atletas se enfrentem nas primeiras rodadas.

Para torneios sem ranking, o sistema utiliza como critérios de desempate:
1. **Bloqueio de equipe** (obrigatório) — lados opostos, só se encontram na final
2. **Peso** — atletas com peso mais próximo do limite superior recebem seeds mais altos
3. **Idade** — desempate: atleta mais velho recebe seed mais alto
4. **Ordem alfabética** — desempate final

Esquema visual da distribuição (exemplo com 8 atletas, 3 equipes):

```
Metade Superior:
Posição 1  ─────  Atleta A (Equipe X)  ← maior equipe
Posição 2  ─────  Atleta C (Equipe Z)  ← terceira equipe
Posição 3  ─────  Atleta E (Equipe X)  ← mesmo lado, evita 1º confrontation
Posição 4  ─────  Atleta G (Equipe Z)

Metade Inferior:
Posição 8  ─────  Atleta B (Equipe Y)  ← segunda maior equipe
Posição 7  ─────  Atleta D (Equipe X)  ← mesmo lado oposto do Atleta A
Posição 6  ─────  Atleta F (Equipe Y)
Posição 5  ─────  Atleta H (Equipe X)
```

> Atletas da Equipe X (A, D, E, H) estão em lados opostos: A e E na superior, D e H na inferior. Eles só se enfrentam na final.

### 3.4. Posições na Chave

A chave é representada como um array de lutas organizadas por rodada.

```
Rodada 1 (Oitavas)               Rodada 2 (Quartas)    Rodada 3 (Semi)    Rodada 4 (Final)
Luta 1:  A1 vs A16  ────────┐
                              ├── Luta 9:  V1 vs V2  ────┐
Luta 2:  A8 vs A9   ────────┘                            │
                                                          ├── Luta 13: V9 vs V10 ──┐
Luta 3:  A5 vs A12  ────────┐                            │                          │
                              ├── Luta 10: V3 vs V4 ────┘                          │
Luta 4:  A4 vs A13  ────────┘                                                       │
                                                                                     ├── Luta 15: V13 vs V14
Luta 5:  A3 vs A14  ────────┐                                                       │
                              ├── Luta 11: V5 vs V6 ────┐                          │
Luta 6:  A6 vs A11  ────────┘                            │                          │
                                                          ├── Luta 14: V11 vs V12 ──┘
Luta 7:  A7 vs A10  ────────┐                            │
                              ├── Luta 12: V7 vs V8 ────┘
Luta 8:  A2 vs A15  ────────┘
```

Onde `An` = atleta na posição n, `Vn` = vencedor da luta n.

### 3.5. Regras de Estado da Luta

Cada luta na chave possui um estado:

| Estado | Descrição |
|---|---|
| `pending` | Luta ainda não realizada |
| `scheduled` | Luta agendada para uma área/mesa |
| `in_progress` | Luta em andamento |
| `completed` | Luta finalizada com vencedor |
| `wo` | WO (desistência de um dos atletas) |

### 3.6. Atualização da Chave

- Ao completar uma luta, o vencedor avança automaticamente para a próxima rodada.
- A próxima luta na chave só fica disponível quando ambas as lutas anteriores da mesma bifurcação forem concluídas.
- Se um atleta desistir (WO), o oponente avança automaticamente.

---

## 4. Modelo de Dados

### 4.1. Tipo Chave

```typescript
// src/types/bracket.ts

export type StatusLuta = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'wo';

export type RodadaNome =
  | 'primeira_rodada'
  | 'segunda_rodada'
  | 'terceira_rodada'
  | 'quartas_de_final'
  | 'semi_final'
  | 'final';

export interface Luta {
  id: string;
  categoriaId: string;
  rodada: number;              // 0-based: 0 = primeira rodada, N = final
  rodadaNome: RodadaNome;      // Nome legível da rodada
  ordem: number;               // Ordem da luta dentro da rodada
  posicaoA: number | null;     // Slot do atleta A (posição na chave, null se WO)
  posicaoB: number | null;     // Slot do atleta B (posição na chave, null se WO)
  atletaAId: string | null;    // ID do atleta A (null se ainda indefinido)
  atletaBId: string | null;    // ID do atleta B (null se ainda indefinido)
  vencedorId: string | null;   // ID do atleta vencedor (null se não realizada)
  status: StatusLuta;
  lutaAnteriorAId: string | null; // ID da luta anterior que alimenta o slot A
  lutaAnteriorBId: string | null; // ID da luta anterior que alimenta o slot B
  createdAt: string;
  updatedAt: string;
}

export interface Chave {
  id: string;
  categoriaId: string;
  lutas: Luta[];
  totalAtletas: number;
  totalRodadas: number;
  totalLutas: number;
  status: 'gerada' | 'em_andamento' | 'finalizada';
  createdAt: string;
  updatedAt: string;
}
```

### 4.2. Tipo Chave no Torneio

O campo `chaves` deve ser adicionado ao JSON do torneio:

```typescript
// src/types/tournament.ts

export interface Torneio {
  id: string;
  nome: string;
  data: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  atletas?: Atleta[];
  categorias?: Categoria[];
  configuracaoCategorias?: ConfiguracaoCategorias;
  chaves?: Chave[];                // NOVO
}
```

### 4.3. JSON do Torneio (após implementação)

```json
{
  "id": "uuid-v4",
  "nome": "Nome do Torneio",
  "data": "2026-12-25",
  "createdAt": "2026-05-31T10:00:00.000Z",
  "updatedAt": "2026-05-31T10:00:00.000Z",
  "startedAt": "2026-06-01T08:00:00.000Z",
  "atletas": [ ... ],
  "categorias": [ ... ],
  "chaves": [
    {
      "id": "uuid-chave",
      "categoriaId": "uuid-categoria",
      "lutas": [
        {
          "id": "uuid-luta",
          "categoriaId": "uuid-categoria",
          "rodada": 0,
          "rodadaNome": "quartas_de_final",
          "ordem": 1,
          "posicaoA": 1,
          "posicaoB": 8,
          "atletaAId": "uuid-atleta-1",
          "atletaBId": "uuid-atleta-2",
          "vencedorId": null,
          "status": "pending",
          "lutaAnteriorAId": null,
          "lutaAnteriorBId": null,
          "createdAt": "2026-05-31T10:00:00.000Z",
          "updatedAt": "2026-05-31T10:00:00.000Z"
        }
      ],
      "totalAtletas": 8,
      "totalRodadas": 3,
      "totalLutas": 7,
      "status": "gerada",
      "createdAt": "2026-05-31T10:00:00.000Z",
      "updatedAt": "2026-05-31T10:00:00.000Z"
    }
  ]
}
```

---

## 5. Fluxo de Geração de Chaves

### 5.1. Tela de Geração

Nova rota: `/admin/categorias/chaves`

A tela deve conter:

1. **Seletor de Categoria** — dropdown listando todas as categorias configuradas com contagem de atletas.
2. **Botão "Gerar Chave"** — disponível apenas se a categoria selecionada tiver ≥ 2 atletas e não possuir chave gerada.
3. **Botão "Regenerar Chave"** — disponível apenas se a chave existir e estiver com status `gerada` (nenhuma luta iniciada). Exibe confirmação: "Regenerar a chave irá descartar a chave atual. Confirmar?"
4. **Visualização da Chave** — árvore de brackets da categoria selecionada.

### 5.2. Algoritmo de Geração

```
function gerarChave(categoria: Categoria, atletas: Atleta[]): Chave {
  // 1. Validar mínimo de atletas
  if (atletas.length < 2) throw new Error("Mínimo de 2 atletas necessário");

  // 2. Caso especial: 3 atletas (Three-Competitor Repechage)
  if (atletas.length === 3) {
    return gerarChaveTresAtletas(atletas);
  }

  // 3. Aplicar seed sorting com separação IBJJF (lados opostos)
  const posicoes = aplicarSeedSortingIBJJF(atletas);

  // 4. Calcular estrutura da chave
  const totalAtletas = posicoes.length;
  const potencia = próximaPotênciaDe2(totalAtletas);
  const totalRodadas = Math.log2(potencia);
  const totalLutas = potencia - 1;
  const numByes = potencia - totalAtletas;

  // 5. Preencher posições com byes
  const chavePreenchida = preencherByes(posicoes, numByes, potencia);

  // 6. Gerar lutas por rodada (emparelhamento padrão: 1 vs N, 2 vs N-1, etc.)
  const lutas: Luta[] = [];
  // ...

  // 7. Vincular lutas anteriores (propagação de vencedores)
  //    Luta X na rodada R é alimentada pelas lutas Y e Z da rodada R-1

  return { id, categoriaId, lutas, ... };
}

function gerarChaveTresAtletas(atletas: Atleta[]): Chave {
  // Three-Competitor Repechage (IBJJF):
  // Luta 1: Atleta A vs Atleta B  (semifinal)
  // Luta 2: Perdedor L1 vs Atleta C (repescagem)
  // Luta 3: Vencedor L1 vs Vencedor L2 (final)
  // Nota: Não há disputa de 3º lugar
}
```

### 5.3. Regeneração de Chave

- Permitida apenas se nenhuma luta da chave tiver sido iniciada (`status === 'pending'`).
- Se qualquer luta estiver com status `scheduled`, `in_progress` ou `completed`, a regeneração é bloqueada.
- Exibição de modal de confirmação antes de regenerar.
- Ao confirmar, a chave existente é substituída por uma nova, mantendo o mesmo `id`.

---

## 6. Comunicação Main <> Renderer (IPC)

Novos canais IPC necessários:

| Canal | Direção | Descrição |
|---|---|---|
| `gerar-chave` | Renderer → Main → Renderer | Gera chave para uma categoria |
| `load-chaves` | Renderer → Main → Renderer | Carrega todas as chaves do torneio ativo |
| `load-chave-por-categoria` | Renderer → Main → Renderer | Carrega chave de uma categoria específica |
| `regenerar-chave` | Renderer → Main → Renderer | Regenera chave de uma categoria |
| `atualizar-luta` | Renderer → Main → Renderer | Atualiza resultado de uma luta |

### 6.1. Handler `gerar-chave`

```typescript
ipcMain.handle('gerar-chave', (_event, data: { categoriaId: string }): Chave => {
  // 1. Carrega torneio ativo
  // 2. Encontra categoria por ID
  // 3. Obtém atletas da categoria (categoria.atletasIds)
  // 4. Valida: mínimo 2 atletas
  // 5. Valida: chave ainda não existe para esta categoria
  // 6. Executa algoritmo de geração
  // 7. Salva chave no torneio
  // 8. Retorna chave gerada
});
```

### 6.2. Handler `load-chaves`

```typescript
ipcMain.handle('load-chaves', (): Chave[] => {
  // 1. Carrega torneio ativo
  // 2. Retorna torneio.chaves ?? []
});
```

### 6.3. Handler `load-chave-por-categoria`

```typescript
ipcMain.handle('load-chave-por-categoria', (_event, categoriaId: string): Chave | null => {
  // 1. Carrega torneio ativo
  // 2. Busca chave onde chave.categoriaId === categoriaId
  // 3. Retorna chave ou null
});
```

### 6.4. Handler `regenerar-chave`

```typescript
ipcMain.handle('regenerar-chave', (_event, data: { categoriaId: string }): Chave => {
  // 1. Carrega torneio ativo
  // 2. Encontra chave existente da categoria
  // 3. Valida: todas as lutas com status 'pending'
  // 4. Remove chave existente
  // 5. Executa geração (mesmo fluxo de gerar-chave)
  // 6. Retorna nova chave
});
```

### 6.5. Handler `atualizar-luta`

```typescript
ipcMain.handle('atualizar-luta', (_event, data: {
  lutaId: string;
  vencedorId: string;
  status: StatusLuta;
}): Chave => {
  // 1. Carrega torneio ativo
  // 2. Encontra a luta na chave correspondente
  // 3. Atualiza vencedorId e status
  // 4. Se completed: propaga vencedor para luta seguinte
  //    (preenche atletaAId ou atletaBId da luta da próxima rodada)
  // 5. Salva JSON
  // 6. Retorna chave atualizada
});
```

---

## 7. Preload (Novos Métodos)

```typescript
// electron/preload.ts — adicionar ao electronAPI

contextBridge.exposeInMainWorld('electronAPI', {
  // ... métodos existentes ...
  // ... métodos de categorias ...

  // NOVOS
  gerarChave: (data: { categoriaId: string }) =>
    ipcRenderer.invoke('gerar-chave', data),
  loadChaves: () =>
    ipcRenderer.invoke('load-chaves'),
  loadChavePorCategoria: (categoriaId: string) =>
    ipcRenderer.invoke('load-chave-por-categoria', categoriaId),
  regenerarChave: (data: { categoriaId: string }) =>
    ipcRenderer.invoke('regenerar-chave', data),
  atualizarLuta: (data: { lutaId: string; vencedorId: string; status: StatusLuta }) =>
    ipcRenderer.invoke('atualizar-luta', data),
});
```

---

## 8. Tipos (Novos)

```typescript
// src/types/bracket.ts

export type StatusLuta = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'wo';

export type RodadaNome =
  | 'primeira_rodada'
  | 'segunda_rodada'
  | 'terceira_rodada'
  | 'quartas_de_final'
  | 'semi_final'
  | 'final';

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
  totalAtletas: number;
  totalRodadas: number;
  totalLutas: number;
  status: 'gerada' | 'em_andamento' | 'finalizada';
  createdAt: string;
  updatedAt: string;
}
```

---

## 9. Rotas (Novas)

| Rota | Componente | Descrição |
|---|---|---|
| `/admin/categorias/chaves` | `GerenciarChaves` | Tela principal de geração e visualização de chaves |

### Fluxo de Navegação (Atualizado)

```
[Dashboard /admin/dashboard]
    └── Categorias
         └── /admin/categorias (CategoriasMenu)
              ├── Configurar Categorias → /admin/categorias/configurar
              │    └── (após salvar) → /admin/categorias/visualizar
              │
              ├── Visualizar Categorias → /admin/categorias/visualizar
              │    └── Clique em categoria → modal atletas
              │    └── Botão "Gerar Chaves" → /admin/categorias/chaves
              │
              └── Gerenciar Chaves → /admin/categorias/chaves  (NOVO)
                   ├── Seletor de categoria
                   ├── Visualização da chave (árvore de brackets)
                   └── Registro de resultados de lutas
```

### Integração com VisualizarCategorias

O botão "Gerar Chaves" em `VisualizarCategorias` deve:
- Se nenhuma chave foi gerada ainda: navegar para `/admin/categorias/chaves`
- Se já existirem chaves geradas: exibir badge "X chaves geradas" e navegar para `/admin/categorias/chaves`

---

## 10. Telas (UI)

### 10.1. GerenciarChaves (`/admin/categorias/chaves`)

- Usa `PageLayout` com título "Gerenciar Chaves"
- **Seletor de Categoria**: `Select` populado com lista de categorias + contagem de atletas
  - Opções desabilitadas se categoria tem < 2 atletas
  - Indicador visual se chave já foi gerada para a categoria
- Painel dividido em duas áreas:

#### 10.1.1. Área de Controles (topo)

| Elemento | Condição | Ação |
|---|---|---|
| "Gerar Chave" | Categoria selecionada, ≥ 2 atletas, sem chave | Gera chave via IPC |
| "Regenerar Chave" | Chave existe, status `gerada` | Modal confirmação → regenera |
| Badge "X atletas" | Sempre visível | Contagem de atletas na categoria |
| Badge "Chave Gerada" | Chave existe | Indicador verde |
| Badge "Em Andamento" | Chave com lutas `in_progress` | Indicador amarelo |
| Badge "Finalizada" | Todas as lutas `completed` | Indicador azul |

#### 10.1.2. Área de Visualização da Chave

A chave é renderizada como uma **árvore de brackets** no formato visual de torneio:

```
┌──────────────┐
│ Luta 1       │
│ A1 vs A8     │
│ [Resultado]  │
└──────┬───────┘
       │
┌──────┴───────┐
│ Luta 5       │
│ V1 vs V2     │
│ [Resultado]  │
└──────┬───────┘
       │
┌──────┴───────┐
│ Luta 7       │  ← Final
│ V5 vs V6     │
│ [Resultado]  │
└──────────────┘
```

Implementação:
- Cada luta é um `Card` ou `Paper` com borda.
- Cards conectados por linhas (usando CSS borders ou elementos `div` com bordas laterais).
- Atleta A (topo), Atleta B (base).
- Vencedor destacado (fundo verde, texto em negrito) quando luta `completed`.
- Lutas `pending`: placeholder "Aguardando..." nos slots não preenchidos.
- Lutas `wo`: estilo riscado no atleta ausente.
- Clique em luta `pending`: abre modal para registrar resultado.

#### 10.1.3. Registro de Resultado

Modal aberto ao clicar em uma luta pendente:

- Título: "Registrar Resultado — {Rodada}"
- Dois cards lado a lado: Atleta A vs Atleta B
- Cada card com: Nome, Equipe, Foto ilustrativa (placeholder)
- Botões de ação: "WO" (ao lado de cada atleta) e "Iniciar Luta"
- Ao clicar "Iniciar Luta": status muda para `in_progress`, botões viram "Finalizar com vitória de {Atleta}"
- Ao selecionar vencedor: modal de confirmação → IPC `atualizar-luta`

### 10.2. Indicadores no VisualizarCategorias (Atualização)

A tela `VisualizarCategorias` deve ser atualizada para exibir, ao lado de cada categoria:

| Indicador | Condição |
|---|---|
| Badge "Chave" (verde) | Chave gerada e finalizada |
| Badge "Chave" (amarelo) | Chave gerada e em andamento |
| Badge "Chave" (cinza) | Chave gerada, nenhuma luta iniciada |
| Badge "Chave" (sem badge) | Nenhuma chave gerada |

---

## 11. Componentes (Novos)

| Componente | Descrição | Local |
|---|---|---|
| `GerenciarChaves.tsx` | Tela principal de geração e visualização de chaves | `src/pages/` |
| `BracketTree.tsx` | Renderização visual da árvore de brackets | `src/components/` |
| `BracketCard.tsx` | Card de luta individual na árvore | `src/components/` |
| `RegistrarResultadoModal.tsx` | Modal de registro de resultado de luta | `src/components/` |

---

## 12. Estrutura de Diretórios (Atualizada com Chaves)

```
bjj-tournament-manager-setup/
├── electron/
│   ├── main.ts               ← + registro de handlers de chaves
│   ├── preload.ts            ← + exposição de métodos de chaves
│   ├── tournament.ts         ← (inalterado)
│   ├── athletes.ts           ← (inalterado)
│   ├── activation.ts         ← (inalterado)
│   ├── categories.ts         ← Handlers IPC de categorias
│   └── brackets.ts           ← NOVO — handlers IPC de chaves
│
├── src/
│   ├── main.tsx              ← (inalterado)
│   ├── App.tsx               ← + rota de chaves
│   ├── types/
│   │   ├── tournament.ts     ← + campo chaves
│   │   ├── athlete.ts        ← (conforme categorias)
│   │   ├── category.ts       ← (conforme categorias)
│   │   ├── bracket.ts        ← NOVO — interfaces Chave, Luta, StatusLuta, RodadaNome
│   │   └── electron.d.ts     ← + métodos de chaves no ElectronAPI
│   ├── pages/
│   │   ├── ... (existentes)
│   │   ├── CategoriasMenu.tsx       ← (conforme categorias)
│   │   ├── ConfigurarCategorias.tsx  ← (conforme categorias)
│   │   ├── VisualizarCategorias.tsx  ← + indicadores de chave por categoria
│   │   └── GerenciarChaves.tsx       ← NOVO
│   └── components/
│       ├── ... (existentes)
│       ├── ... (componentes de categorias)
│       ├── BracketTree.tsx              ← NOVO
│       ├── BracketCard.tsx              ← NOVO
│       └── RegistrarResultadoModal.tsx   ← NOVO
│
├── doc/
│   └── requisitos.md
│
├── spec/
│   ├── categorias-configuracao.md
│   └── geracao-chaves.md        ← este documento
```

---

## 13. Arquivos Afetados (Modificações em Arquivos Existentes)

### Modificações Diretas

| Arquivo | Tipo de Alteração |
|---|---|
| `src/types/tournament.ts` | + campo `chaves: Chave[]` |
| `src/types/electron.d.ts` | + métodos `gerarChave`, `loadChaves`, `loadChavePorCategoria`, `regenerarChave`, `atualizarLuta` |
| `src/pages/VisualizarCategorias.tsx` | + indicador de chave por categoria, + botão "Gerenciar Chaves" |
| `src/pages/CategoriasMenu.tsx` | + card "Gerenciar Chaves" |
| `src/App.tsx` | + rota `/admin/categorias/chaves` |
| `electron/main.ts` | + import e registro de `registerBracketHandlers()` |
| `electron/preload.ts` | + exposição dos 5 novos métodos IPC |
| `electron/categories.ts` | (inalterado, mas seus dados alimentam chaves) |

### Arquivos que Permanecerão Inalterados

| Arquivo | Motivo |
|---|---|
| `src/types/athlete.ts` | Atleta não precisa de novos campos para chaves |
| `src/types/category.ts` | Categoria já possui `atletasIds` suficiente |
| `src/pages/ConfigurarCategorias.tsx` | Escopo separado |
| `electron/athletes.ts` | CRUD de atletas permanece igual |
| `electron/tournament.ts` | CRUD de torneios permanece igual |

---

## 14. Arquivos Novos

| Arquivo | Descrição |
|---|---|
| `electron/brackets.ts` | Handlers IPC: `gerar-chave`, `load-chaves`, `load-chave-por-categoria`, `regenerar-chave`, `atualizar-luta` |
| `src/types/bracket.ts` | Interfaces `Chave`, `Luta`, `StatusLuta`, `RodadaNome` |
| `src/pages/GerenciarChaves.tsx` | Tela principal de geração e visualização de chaves |
| `src/components/BracketTree.tsx` | Renderização visual da árvore de brackets |
| `src/components/BracketCard.tsx` | Card de luta individual |
| `src/components/RegistrarResultadoModal.tsx` | Modal de registro de resultado |

---

## 15. Plano de Implementação (Ordem Sugerida)

| Fase | Tarefa | Dependências |
|---|---|---|
| **1** | Criar `src/types/bracket.ts` | Nenhuma |
| **2** | Estender `src/types/tournament.ts` (+ campo `chaves`) | Fase 1 |
| **3** | Criar `electron/brackets.ts` (algoritmo de geração + handlers IPC) | Fases 1–2, módulo Categorias implementado |
| **4** | Estender `electron/main.ts` (registrar handlers) | Fase 3 |
| **5** | Estender `electron/preload.ts` (expor métodos) | Fase 3 |
| **6** | Estender `src/types/electron.d.ts` (tipos) | Fase 1 |
| **7** | Criar `src/pages/GerenciarChaves.tsx` | Fase 3 |
| **8** | Criar `src/components/BracketTree.tsx` | Fase 1 |
| **9** | Criar `src/components/BracketCard.tsx` | Fase 1 |
| **10** | Criar `src/components/RegistrarResultadoModal.tsx` | Fase 1 |
| **11** | Atualizar `src/pages/CategoriasMenu.tsx` (+ card Gerenciar Chaves) | Fase 7 |
| **12** | Atualizar `src/pages/VisualizarCategorias.tsx` (+ indicadores de chave) | Fase 7 |
| **13** | Atualizar `src/App.tsx` (+ rota) | Fase 11 |

> **Nota:** A implementação de chaves **depende** do módulo de Categorias estar concluído (fases 1–15 de `spec/categorias-configuracao.md`). Sem categorias configuradas e atletas classificados, não há base para gerar chaves.

---

## 16. Regras de Validação

| Regra | Mensagem |
|---|---|
| Categoria deve ter ≥ 2 atletas para gerar chave | "A categoria precisa de no mínimo 2 atletas para gerar uma chave." |
| Categoria com 1 atleta: campeão declarado automaticamente | "Atleta {nome} declarado campeão — categoria com apenas 1 atleta." |
| Categoria com 3 atletas: gera chave de 3 com repescagem (3 lutas) | "Chave de 3 atletas gerada com sistema de repescagem (3 lutas)." |
| Chave já existe e está em andamento: bloqueia regeneração | "Não é possível regenerar a chave pois já existem lutas em andamento ou concluídas." |
| Luta já possui resultado: bloqueia re-registro | "Esta luta já possui resultado registrado." |
| Atleta não pertence à categoria: bloqueia atribuição como vencedor | "O atleta selecionado não pertence a esta categoria." |

---

## 17. Notificações

| Evento | Tipo | Mensagem |
|---|---|---|
| Chave gerada com sucesso (N ≥ 4) | Sucesso (verde) | "Chave gerada com sucesso para {nome da categoria}." |
| Chave de 3 atletas gerada | Sucesso (verde) | "Chave de 3 atletas gerada para {nome da categoria} com sistema de repescagem IBJJF." |
| Chave regenerada | Sucesso (verde) | "Chave regenerada com sucesso para {nome da categoria}." |
| Resultado registrado | Sucesso (verde) | "Resultado registrado: {nome do atleta} venceu." |
| Luta iniciada | Informação (azul) | "Luta {id} iniciada: {atletaA} vs {atletaB}." |
| WO registrado | Alerta (amarelo) | "WO — {nome do atleta} avançou sem lutar." |
| Categoria sem atletas suficientes | Alerta (amarelo) | "{nome da categoria} tem apenas 1 atleta. Campeão declarado automaticamente." |
| Erro ao gerar chave | Erro (vermelho) | "Erro ao gerar chave para {nome da categoria}." |
| Erro ao registrar resultado | Erro (vermelho) | "Erro ao registrar resultado da luta." |
| Chave finalizada | Sucesso (verde) | "Chave {nome da categoria} finalizada! Campeão: {nome do atleta}." |

---

## 18. Casos de Borda

1. **Categoria com 1 atleta:** O atleta é declarado campeão automaticamente. Uma chave não é gerada — apenas um registro de "Campeão automático" é criado com status `finalizada`. O atleta recebe badge "Campeão" na listagem.

2. **Categoria com 2 atletas:** Chave com 1 única luta (Final). Não há byes. A geração é direta.

3. **Categoria com 3 atletas:** Aplica-se o sistema *Three-Competitor Repechage* da IBJJF (seção 3.2.3). **Não há bye.** Atleta A vs B na Luta 1; perdedor vs Atleta C na Luta 2; vencedores se enfrentam na Final (Luta 3). Total de 3 lutas.

4. **Todos os atletas da mesma equipe:** Não é possível separar por equipe. A distribuição segue critérios de peso e idade. O seed sorting simplesmente ordena os atletas e distribui nas posições padrão.

5. **Atleta removido da categoria após chave gerada:** A chave existente é invalidada (status `invalida`). O sistema exibe alerta: "Atleta(s) removido(s) da categoria após geração da chave. Regenere a chave." Chaves com lutas `in_progress` ou `completed` são preservadas — o atleta removido é marcado como WO nas lutas pendentes.

6. **Categoria com nova classificação de atleta:** Se um atleta for realocado para outra categoria (via `realocar-atleta` do módulo de Categorias) e a chave da categoria origem já existir, a chave é marcada como `invalida` e o alerta do caso 5 é exibido.

7. **Chave em andamento com interrupção:** Se o sistema for fechado durante uma luta `in_progress`, o status permanece `in_progress` ao recarregar. O administrador pode finalizar a luta ou marcar como WO.

8. **Bye em luta da primeira rodada:** (Apenas para N ≥ 4 e não potência de 2) A luta é gerada com apenas 1 atleta (slot oponente = null, status = `wo`). O vencedor é o atleta presente, e a propagação ocorre automaticamente. Para N = 3, o sistema de repescagem é usado, não byes.

9. **Empate não é permitido:** No Jiu-Jitsu competitivo não há empate. O sistema não prevê este estado. Toda luta deve ter um vencedor.

10. **Ausência de ambos os atletas:** Se ambos os atletas não comparecerem para uma luta, o administrador pode marcar ambos como WO. Neste caso, a luta seguinte recebe um slot vazio (null), propagando a desistência.

11. **Disputa de 3º lugar:** A IBJJF **não** realiza disputa de terceiro lugar. Ambos os perdedores das semifinais recebem medalha de bronze. O sistema não deve gerar luta para 3º lugar em nenhuma chave.

12. **Chave de 3 atletas sem 3º lugar:** Na chave de 3 atletas, o atleta que perder ambas as lutas (Luta 1 e Luta 2) é o 3º colocado. O perdedor da Final é o 2º colocado. Não há luta extra.
