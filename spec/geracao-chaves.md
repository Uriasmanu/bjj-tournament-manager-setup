# Geração de Chaves de Luta

## 1. Visão Geral

O módulo de **Geração de Chaves** é responsável por criar as chaves de competição (brackets) para cada categoria configurada no torneio. A chave define o emparelhamento dos atletas em uma sequência de lutas no formato eliminatório simples (single-elimination), determinando quem enfrenta quem até a definição do campeão.

**Principais restrições:**
- **Máximo de 5 atletas** por chave
- **Chave editável** — o administrador pode ajustar manualmente as posições dos atletas na chave antes do início das lutas
- **Árbitro por chave** — cada chave pode ter um árbitro atribuído (cadastro em `spec/cadastro-arbitro.md`)

**Todos os dados de chaves são salvos no JSON do torneio** (campo `chaves`), dentro do diretório `{userData}/data/torneios/{id}.json`. Não há banco de dados externo — a persistência é 100% em arquivo JSON, assim como atletas e árbitros.

A geração de chaves depende do módulo de **Categorias**: uma chave só pode ser gerada para uma categoria que já exista e contenha atletas classificados.

---

## 2. Status da Implementação

| Funcionalidade | Status |
|---|---|---|
| Geração em lote de todas as chaves (2-5 atletas) | ✅ Completo |
| Atribuição automática de árbitros por hierarquia de faixa | ✅ Completo |
| Listagem de chaves em grid de cards | ✅ Completo |
| Edição manual: reordenar / embaralhar posições | ✅ Completo |
| Troca de árbitro por chave | ✅ Completo |
| Exportação de chaves (JSON) | ✅ Completo |
| Importação de chaves (JSON) | ✅ Completo |
| Registro de resultado de luta (vencedor / WO) | ✅ Completo |
| Avanço automático do vencedor à rodada seguinte | ✅ Completo |
| Suporte a WO / desistência | ✅ Completo |
| Histórico de lutas por chave | ❌ Pendente |

---

## 3. Regras de Negócio

### 3.1. Pré-requisitos

- A categoria deve existir no torneio.
- A categoria deve ter **mínimo de 2** e **máximo de 5 atletas** classificados para gerar uma chave.
- Categorias com **1 atleta** — o atleta é declarado campeão automaticamente sem necessidade de chave.
- Categorias com **0 atletas** não geram chave.
- Categorias com **mais de 5 atletas** não podem gerar chave — é necessário dividir em múltiplas chaves ou ajustar a categoria.

### 3.2. Formato da Chave

O sistema adota o formato **eliminatório simples** (single-elimination):

- Cada luta elimina o perdedor.
- O vencedor avança para a rodada seguinte.
- Ao final, resta um campeão invicto.
- **Não há repescagem** para disputa de primeiro lugar.
- **Não há disputa de terceiro lugar.** Os atletas eliminados nas semifinais dividem o 3º lugar no pódio.

#### 3.2.1. Definição de Rodadas

O número de rodadas e lutas varia conforme o total de atletas na categoria:

| Atletas | Rodadas | Total de Lutas | Estrutura |
|---|---|---|---|
| 2 | 1 | 1 | Final direta |
| 3 | 2 | 2 | 1 Semifinal + Final |
| 4 | 2 | 3 | 2 Semifinais + Final |
| 5 | 3 | 4 | 1 Quartas + 2 Semifinais + Final |

#### 3.2.2. Byes (Folgas)

Quando o número de atletas não é potência de 2 (3 ou 5 atletas), alguns atletas recebem byes automaticamente na primeira rodada:

| Atletas | Potência | Byes | Detalhe |
|---|---|---|---|
| 3 | 4 | 1 | Atleta melhor posicionado avança direto à Final |
| 5 | 8 | 3 | Atletas posições 1, 2 e 3 avançam direto às Semifinais |

- Byes são distribuídos para os atletas de melhor posicionamento (seeds mais altos).
- Atletas com bye avançam diretamente à rodada seguinte sem lutar.

### 3.3. Seed Sorting (Posicionamento)

O posicionamento dos atletas na chave segue estes critérios em ordem de prioridade:

1. **Bloqueio de equipe** — atletas da mesma equipe devem ser colocados em lados opostos da chave, só se encontrando na final.
2. **Peso** — atletas com peso mais próximo do limite superior da categoria recebem seeds mais altos.
3. **Idade** — desempate: atleta mais velho recebe seed mais alto.
4. **Ordem alfabética** — desempate final.

### 3.4. Posições na Chave

A chave é representada como um array de lutas organizadas por rodada.

#### Chave de 2 atletas

```
Rodada 1 (Final):
Luta 1: Posição 1 vs Posição 2 → Campeão
(1 luta, 1 rodada)
```

#### Chave de 3 atletas

```
Rodada 1 (Semifinal):
Luta 1: Posição 2 vs Posição 3 → V1
                    (bye: Posição 1)

Rodada 2 (Final):
Luta 2: Posição 1 vs V1 → Campeão
(2 lutas, 2 rodadas)
```

#### Chave de 4 atletas

```
Rodada 1 (Semifinais):
Luta 1: Posição 1 vs Posição 4 → V1
Luta 2: Posição 2 vs Posição 3 → V2

Rodada 2 (Final):
Luta 3: V1 vs V2 → Campeão
(3 lutas, 2 rodadas)
```

#### Chave de 5 atletas

```
Rodada 1 (Quartas):
Luta 1: Posição 4 vs Posição 5 → V1
          (byes: Posição 1, 2 e 3)

Rodada 2 (Semifinais):
Luta 2: Posição 1 vs V1 → V2
Luta 3: Posição 2 vs Posição 3 → V3

Rodada 3 (Final):
Luta 4: V2 vs V3 → Campeão
(4 lutas, 3 rodadas)
```

Onde `Posição n` = posição do atleta na chave após seed sorting.

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

### 3.7. Edição Manual da Chave

A chave gerada automaticamente pode ser **editada manualmente** pelo administrador antes do início das lutas.

#### Regras de Edição

- A edição manual está disponível para chaves com **status `gerada`** (nenhuma luta iniciada).
- As seguintes operações de edição são permitidas:
  1. **Trocar posição** entre dois atletas na chave (drag & drop ou seletor de posição).
  2. **Remover atleta** da chave (remove o atleta da chave sem removê-lo da categoria).
- Ao salvar a edição, as lutas são recalculadas com base nas novas posições.
- O sistema alerta se a edição resultar em atletas da mesma equipe no mesmo lado da chave (recomendação, não bloqueio).
- Após a primeira luta ser iniciada, a edição da chave é bloqueada.

---

## 4. Modelo de Dados

### 4.1. Tipo Chave

```typescript
// src/types/bracket.ts

export type StatusLuta = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'wo';

export type RodadaNome =
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
  posicoesAtletas: string[];   // IDs dos atletas na ordem das posições (editável)
  arbitroId: string | null;     // ID do árbitro atribuído a esta chave
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
  chaves?: Chave[];
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
  "atletas": [ ... ],
  "chaves": [
    {
      "id": "uuid-chave",
      "categoriaId": "uuid-categoria",
      "posicoesAtletas": ["uuid-atleta-1", "uuid-atleta-2", "uuid-atleta-3", "uuid-atleta-4", "uuid-atleta-5"],
      "arbitroId": null,
      "lutas": [
        {
          "id": "uuid-luta",
          "categoriaId": "uuid-categoria",
          "rodada": 0,
          "rodadaNome": "quartas_de_final",
          "ordem": 1,
          "posicaoA": 4,
          "posicaoB": 5,
          "atletaAId": "uuid-atleta-4",
          "atletaBId": "uuid-atleta-5",
          "vencedorId": null,
          "status": "pending",
          "lutaAnteriorAId": null,
          "lutaAnteriorBId": null,
          "createdAt": "2026-05-31T10:00:00.000Z",
          "updatedAt": "2026-05-31T10:00:00.000Z"
        }
      ],
      "totalAtletas": 5,
      "totalRodadas": 3,
      "totalLutas": 4,
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

Rota: `/admin/categorias/chaves`

A tela possui dois estados:

**Estado inicial (antes da geração):**
1. Botão grande "Gerar Chaves" centralizado verticalmente.
2. Texto indicando quantas categorias possuem atletas suficientes (2 a 5).
3. Ao clicar, dispara IPC `gerar-todas-chaves` e transiciona para o estado pós-geração.

**Estado pós-geração:**
1. Barra de controles: "Gerar Novamente" (esquerda), "Importar Chaves" e "Exportar Chaves" (direita).
2. Grid de cards (`SimpleGrid`), um por chave gerada, com título, badges, árbitro, lista de atletas e botão "Editar Chave".
3. "Editar Chave" abre `EditarChaveModal` para reordenar posições, embaralhar ou trocar árbitro.

### 5.2. Algoritmo de Geração

```
function gerarChave(categoria: Categoria, atletas: Atleta[]): Chave {
  if (atletas.length < 2) throw new Error("Mínimo de 2 atletas necessário");
  if (atletas.length > 5) throw new Error("Máximo de 5 atletas por chave");

  const posicoes = aplicarSeedSorting(atletas);

  switch (atletas.length) {
    case 2: return gerarChaveDoisAtletas(posicoes);
    case 3: return gerarChaveTresAtletas(posicoes);
    case 4: return gerarChaveQuatroAtletas(posicoes);
    case 5: return gerarChaveCincoAtletas(posicoes);
  }
}

function gerarChaveDoisAtletas(posicoes: Atleta[]): Chave {
  // Luta 1 (Final): Posição 1 vs Posição 2
}

function gerarChaveTresAtletas(posicoes: Atleta[]): Chave {
  // Luta 1 (Semifinal): Posição 2 vs Posição 3  (Posição 1 com bye)
  // Luta 2 (Final): Posição 1 vs Vencedor L1
}

function gerarChaveQuatroAtletas(posicoes: Atleta[]): Chave {
  // Luta 1 (Semifinal): Posição 1 vs Posição 4
  // Luta 2 (Semifinal): Posição 2 vs Posição 3
  // Luta 3 (Final): Vencedor L1 vs Vencedor L2
}

function gerarChaveCincoAtletas(posicoes: Atleta[]): Chave {
  // Luta 1 (Quartas): Posição 4 vs Posição 5  (Posições 1, 2, 3 com bye)
  // Luta 2 (Semifinal): Posição 1 vs Vencedor L1
  // Luta 3 (Semifinal): Posição 2 vs Posição 3
  // Luta 4 (Final): Vencedor L2 vs Vencedor L3
}
```

### 5.3. Geração em Lote

O sistema não gera chave por categoria individualmente. O botão "Gerar Chaves" (tela inicial) dispara o handler `gerar-todas-chaves`, que:

1. Agrupa todos os atletas por `categoria`
2. Para cada grupo com 2 a 5 atletas, gera automaticamente uma chave com seed sorting
3. Atribui árbitros automaticamente com base na hierarquia de faixas (ver seção 10.1.2)
4. Salva todas as chaves no JSON do torneio

### 5.4. Regeneração em Lote

- O botão "Gerar Novamente" (exibido após a geração inicial) executa o mesmo fluxo da geração em lote, substituindo todas as chaves existentes e reatribuindo árbitros.
- Não há regeneração individual por chave — é sempre em lote.
- A regeneração é sempre permitida (o frontend não valida status individualmente).

### 5.5. Edição de Chave

- A edição é feita por chave individualmente através do modal `EditarChaveModal`.
- Disponível apenas para chaves com status `gerada`.
- Operações:
  1. **Reordenar posições** — botões de seta para cima/baixo em cada atleta
  2. **Embaralhar** — botão que randomiza todas as posições
  3. **Trocar árbitro** — seletor de árbitro no topo do modal
- Ao salvar, as lutas são recalculadas com base nas novas posições.
- Alerta visual (não bloqueante) se atletas da mesma equipe ficarem no mesmo lado da chave.

Ao salvar a edição, as lutas são recalculadas (IDs das lutas são recriados). O campo `posicoesAtletas` do JSON é atualizado com a nova ordem. O histórico de edições não é preservado.

---

## 6. Comunicação Main <> Renderer (IPC)

Canais IPC:

| Canal | Direção | Descrição |
|---|---|---|
| `gerar-todas-chaves` | Renderer → Main → Renderer | Gera chaves para todas as categorias com 2-5 atletas + atribui árbitros |
| `load-chaves` | Renderer → Main → Renderer | Carrega todas as chaves do torneio ativo |
| `atualizar-luta` | Renderer → Main → Renderer | Atualiza resultado de uma luta |
| `editar-chave` | Renderer → Main → Renderer | Salva edição manual da chave (novas posições) |
| `atribuir-arbitro-chave` | Renderer → Main → Renderer | Atribui ou remove árbitro de uma chave |
| `import-chaves` | Renderer → Main → Renderer | Abre diálogo nativo, lê JSON, importa chaves para o torneio |
| `export-chaves` | Renderer → Main | Abre diálogo "Salvar como" e exporta JSON das chaves |

### 6.1. Handler `gerar-todas-chaves`

```typescript
ipcMain.handle('gerar-todas-chaves', (): Chave[] => {
  // 1. Carrega torneio ativo
  // 2. Agrupa atletas por categoria
  // 3. Para cada grupo com 2-5 atletas, gera chave (seed sorting + lutas)
  // 4. Atribui árbitros automaticamente (hierarquia de faixa)
  // 5. Salva JSON com todas as chaves
  // 6. Retorna array de chaves
});
```

### 6.2. Handler `editar-chave`

```typescript
ipcMain.handle('editar-chave', (_event, data: {
  chaveId: string;
  posicoesAtletas: string[];  // Nova ordem dos IDs dos atletas
}): Chave => {
  // 1. Carrega torneio ativo
  // 2. Encontra chave por ID
  // 3. Valida: status === 'gerada'
  // 4. Atualiza posicoesAtletas
  // 5. Recalcula lutas com base nas novas posições
  // 6. Salva JSON
  // 7. Retorna chave atualizada
});
```

### 6.3. Handler `atribuir-arbitro-chave`

```typescript
ipcMain.handle('atribuir-arbitro-chave', (_event, data: {
  chaveId: string;
  arbitroId: string | null;
}): Chave => {
  // 1. Carrega torneio ativo
  // 2. Encontra chave por ID
  // 3. Remove chaveId do árbitro anterior (se houver)
  // 4. Se arbitroId não for null, adiciona chaveId ao novo árbitro
  // 5. Atualiza chave.arbitroId
  // 6. Salva JSON
  // 7. Retorna chave atualizada
});
```

### 6.4. Handler `import-chaves`

```typescript
ipcMain.handle('import-chaves', (): { imported: number } => {
  // 1. Abre diálogo nativo showOpenDialog (filtro *.json)
  // 2. Se cancelado, retorna { imported: 0 }
  // 3. Lê e parseia o JSON do arquivo
  // 4. Valida: o JSON raiz deve ser um array de objetos com os campos de Chave
  // 5. Substitui torneio.chaves pelo array importado
  // 6. Salva JSON
  // 7. Retorna { imported: chaves.length }
});
```

### 6.5. Handler `export-chaves`

```typescript
ipcMain.handle('export-chaves', (): void => {
  // 1. Carrega torneio ativo
  // 2. Abre diálogo nativo showSaveDialog (filtro *.json)
  // 3. Nome padrão: "{nome_torneio}_chaves.json"
  // 4. Escreve torneio.chaves como JSON formatado no arquivo selecionado
});
```

---

## 7. Preload (Métodos)

```typescript
// electron/preload.ts

contextBridge.exposeInMainWorld('electronAPI', {
  // ... métodos existentes ...

  gerarTodasChaves: () =>
    ipcRenderer.invoke('gerar-todas-chaves'),
  loadChaves: () =>
    ipcRenderer.invoke('load-chaves'),
  atualizarLuta: (data: { lutaId: string; vencedorId: string; status: string }) =>
    ipcRenderer.invoke('atualizar-luta', data),
  editarChave: (data: { chaveId: string; posicoesAtletas: string[] }) =>
    ipcRenderer.invoke('editar-chave', data),
  atribuirArbitroChave: (data: { chaveId: string; arbitroId: string | null }) =>
    ipcRenderer.invoke('atribuir-arbitro-chave', data),
  importChaves: () =>
    ipcRenderer.invoke('import-chaves'),
  exportChaves: () =>
    ipcRenderer.invoke('export-chaves'),
});
```

---

## 8. Tipos

```typescript
// src/types/bracket.ts

export type StatusLuta = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'wo';

export type RodadaNome =
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
  posicoesAtletas: string[];   // IDs dos atletas na ordem das posições (editável)
  arbitroId: string | null;     // ID do árbitro atribuído a esta chave
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
| `/admin/categorias/chaves` | `GerenciarChaves` | Tela principal de geração, edição e visualização de chaves |

---

## 10. Telas (UI)

### 10.1. GerenciarChaves (`/admin/categorias/chaves`)

Usa `PageLayout` com título "Gerenciar Chaves". A tela possui dois estados:

#### 10.1.0. Estado Inicial (antes da geração)

- Botão grande "Gerar Chaves" centralizado verticalmente na tela.
- Texto indicando quantas categorias possuem atletas suficientes (2 a 5).
- Se nenhuma categoria tiver atletas suficientes, exibe mensagem orientativa.
- Ao clicar, dispara IPC `gerar-todas-chaves` e transiciona para o estado pós-geração.

```
+--------------------------------------------------+
|  Gerenciar Chaves                           [←]  |
|                                                    |
|              Gerar Chaves do Torneio               |
|                                                    |
|         3 categoria(s) com atletas suficientes     |
|              (2 a 5) para gerar chave.             |
|                                                    |
|              ┌──────────────────────┐              |
|              │     Gerar Chaves     │              |
|              └──────────────────────┘              |
+--------------------------------------------------+
```

#### 10.1.1. Estado Pós-Geração

**Barra de controles (topo):**

| Elemento | Posição | Ação |
|---|---|---|
| "Gerar Novamente" | Canto superior esquerdo | Regenera todas as chaves + reatribui árbitros |
| "Importar Chaves" | Canto superior direito | Abre diálogo nativo para importar JSON |
| "Exportar Chaves" | Canto superior direito | Abre diálogo "Salvar como" para exportar JSON |

**Grid de cards:**

Abaixo da barra, um `SimpleGrid` (1-3 colunas responsivas) com um `Card` por chave gerada. Cada card exibe:

- **Título**: `"{FaixaMin} a {FaixaMax} - {Peso} - {N} atleta(s)"`
  - Ex: `"Azul a Marrom - Leve - 4 atletas"`
  - `FaixaMin`/`FaixaMax`: faixa mais baixa e mais alta entre os atletas da chave. Se todos iguais, exibe apenas uma faixa.
  - `Peso`: nome da categoria de peso extraído do `categoriaId` (ex: "Leve", "Médio", "Galo")
  - `N`: quantidade de atletas na chave
- **Badges**: rodadas (roxa), lutas (uva), status (verde/amarelo/azul)
- **Árbitro**: nome e faixa do árbitro atribuído
- **Atletas**: lista dos nomes dos atletas na chave
- **Botão "Editar Chave"**: visível apenas se status = `gerada`. Abre `EditarChaveModal`.

```
+--------------------------------------------------+
|  Gerenciar Chaves                           [←]  |
|                                                    |
| [Gerar Novamente]  [Importar Chaves] [Exportar]   |
|                                                    |
|  ┌─────────────────────┐ ┌─────────────────────┐  |
|  │ Azul a Marrom       │ │ Branca a Azul       │  |
|  │ Leve - 4 atletas    │ │ Galo - 3 atletas    │  |
|  │ [2 rod] [3 lut] [✓] │ │ [2 rod] [2 lut] [✓] │  |
|  │ Árbitro: Carlos(R)  │ │ Árbitro: Ana(P)     │  |
|  │ João, Pedro, ...    │ │ Marcos, Paulo, ...  │  |
|  │ [Editar Chave]      │ │ [Editar Chave]      │  |
|  └─────────────────────┘ └─────────────────────┘  |
|  ┌─────────────────────┐ ┌─────────────────────┐  |
|  │ ...                 │ │ ...                 │  |
|  └─────────────────────┘ └─────────────────────┘  |
+--------------------------------------------------+
```

#### 10.1.2. Atribuição Automática de Árbitros

- **Distribuição automática:** executada no backend pelo handler `gerar-todas-chaves`.
- Algoritmo:
  1. Para cada chave, calcula a faixa máxima entre seus atletas (maior valor na hierarquia).
  2. Ordena chaves por faixa máxima decrescente (mais restritiva primeiro).
  3. Para cada chave, seleciona o árbitro compatível (faixa ≥ faixa máxima da chave) com menor número de atribuições atuais.
  4. Atribui o árbitro e atualiza `chaveIds` no registro do árbitro.
- A distribuição pode ser ajustada manualmente pelo modal de edição de cada chave.

#### 10.1.3. Modal de Edição (EditarChaveModal)

Aberto ao clicar "Editar Chave" em um card. Contém:

1. **Seletor de Árbitro** (`Select`) — topo do modal. Permite trocar o árbitro da chave. Populado com "Sem árbitro" + lista de árbitros no formato "Nome (Faixa) — Equipe". Dispara IPC `atribuir-arbitro-chave` ao selecionar.

2. **Lista ordenável de atletas** — cada atleta em um `Card` com:
   - Número da posição (1 a N)
   - Nome do atleta
   - Botão seta para cima / seta para baixo para reordenar

3. **Botão "Embaralhar"** — randomiza a ordem dos atletas (Fisher-Yates shuffle).

4. **Alerta de conflito de equipe** — exibido se a edição resultar em atletas da mesma equipe no mesmo lado da chave. Apenas informativo, não bloqueia.

5. **Botões**: "Cancelar" e "Salvar Edição". Ao salvar, recalcula lutas via IPC `editar-chave`.

#### 10.1.4. Hierarquia de Faixas para Arbitragem

A faixa do árbitro define quais chaves ele pode arbitrar:

| Faixa do Árbitro | Pode Arbitrar Chaves com Atletas até a Faixa |
|---|---|
| `roxa` | `branca`, `cinza`, `amarela`, `laranja`, `verde`, `azul`, `roxa` |
| `marrom` | `branca`, `cinza`, `amarela`, `laranja`, `verde`, `azul`, `roxa`, `marrom` |
| `preta` | Todas as faixas (branca a preta) |

A distribuição automática respeita esta hierarquia. A edição manual não valida a hierarquia.

---

## 11. Componentes

| Componente | Descrição | Local | Status |
|---|---|---|---|
| `GerenciarChaves.tsx` | Tela principal (botão gerar → grid de cards) | `src/pages/` | ✅ Em uso |
| `EditarChaveModal.tsx` | Modal de edição manual (reordenar, embaralhar, trocar árbitro) | `src/components/` | ✅ Em uso |
| `BracketTree.tsx` | Renderização visual da árvore de brackets | `src/components/` | 🔶 Criado, não integrado |
| `BracketCard.tsx` | Card de luta individual na árvore | `src/components/` | 🔶 Criado, não integrado |
| `RegistrarResultadoModal.tsx` | Modal de registro de resultado de luta | `src/components/` | 🔶 Criado, não integrado |

> **Nota:** `BracketTree`, `BracketCard` e `RegistrarResultadoModal` foram criados seguindo a especificação original, mas a UI atual usa listagem de cards (sem árvore visual). Eles podem ser integrados posteriormente se a visualização em árvore for necessária.

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
│   ├── brackets.ts           ← Handlers IPC de chaves (+ atribuir árbitro)
│   └── referees.ts           ← Handlers IPC de árbitros
│
├── src/
│   ├── main.tsx              ← (inalterado)
│   ├── App.tsx               ← + rota de chaves, + rotas de árbitros
│   ├── types/
│   │   ├── tournament.ts     ← + campo chaves
│   │   ├── athlete.ts        ← (inalterado)
│   │   ├── category.ts       ← (inalterado)
│   │   ├── bracket.ts        ← Interfaces Chave (+ arbitroId), Luta, StatusLuta, RodadaNome
│   │   ├── referee.ts        ← Interface Arbitro
│   │   └── electron.d.ts     ← + métodos de chaves + métodos de árbitros
│   ├── pages/
│   │   ├── ... (existentes)
│   │   ├── CategoriasMenu.tsx       ← (conforme categorias)
│   │   ├── ConfigurarCategorias.tsx ← (conforme categorias)
│   │   ├── VisualizarCategorias.tsx ← + indicadores de chave por categoria
│   │   └── GerenciarChaves.tsx       ← NOVO
│   └── components/
│       ├── ... (existentes)
│       ├── ... (componentes de categorias)
│       ├── BracketTree.tsx              ← NOVO
│       ├── BracketCard.tsx              ← NOVO
│       ├── RegistrarResultadoModal.tsx   ← NOVO
│       └── EditarChaveModal.tsx          ← NOVO
│
├── doc/
│   └── requisitos.md
│
├── spec/
│   ├── categorias-configuracao.md
│   ├── geracao-chaves.md        ← este documento
│   └── cadastro-arbitro.md      ← Especificação do cadastro de árbitros
```

---

## 13. Arquivos Afetados

### Modificações em Arquivos Existentes

| Arquivo | Tipo de Alteração |
|---|---|
| `src/types/tournament.ts` | + campo `chaves?: Chave[]` |
| `src/types/electron.d.ts` | + métodos `gerarTodasChaves`, `loadChaves`, `atualizarLuta`, `editarChave`, `atribuirArbitroChave`, `importChaves`, `exportChaves` |
| `src/pages/Dashboard.tsx` | + card "Geração de Chaves" com rota `/admin/categorias/chaves` |
| `src/App.tsx` | + rota `/admin/categorias/chaves` → `GerenciarChaves` |
| `electron/main.ts` | + import e registro de `registerBracketHandlers()` |
| `electron/preload.ts` | + exposição dos métodos IPC de chaves |

### Arquivos que Permaneceram Inalterados

| Arquivo | Motivo |
|---|---|
| `src/pages/VisualizarCategorias.tsx` | Sem indicador de chave por categoria (não implementado) |
| `src/pages/CategoriasMenu.tsx` | Rota adicionada via Dashboard, não pelo menu de categorias |
| `electron/categories.ts` | Handlers de categorias inalterados |
| `src/types/athlete.ts` | Atleta não precisa de novos campos |
| `src/types/category.ts` | Categoria já possui `atletasIds` suficiente |
| `src/pages/ConfigurarCategorias.tsx` | Escopo separado |
| `electron/athletes.ts` | CRUD de atletas inalterado |
| `electron/tournament.ts` | CRUD de torneios inalterado |
| `src/types/referee.ts` | Interface separada em arquivo próprio |

---

## 14. Arquivos Novos

### Módulo de Chaves (este escopo)

| Arquivo | Descrição |
|---|---|
| `electron/brackets.ts` | Handlers IPC: `gerar-todas-chaves`, `load-chaves`, `atualizar-luta`, `editar-chave`, `atribuir-arbitro-chave`, `import-chaves`, `export-chaves` |
| `src/types/bracket.ts` | Interfaces `Chave`, `Luta`, `StatusLuta`, `RodadaNome` |
| `src/pages/GerenciarChaves.tsx` | Tela principal (botão gerar → grid de cards + modais) |
| `src/components/BracketTree.tsx` | Renderização visual da árvore de brackets (não integrada) |
| `src/components/BracketCard.tsx` | Card de luta individual (não integrado) |
| `src/components/RegistrarResultadoModal.tsx` | Modal de registro de resultado (não integrado) |
| `src/components/EditarChaveModal.tsx` | Modal de edição manual de posições |

### Módulo de Árbitros (escopo separado, criado anteriormente)

| Arquivo | Descrição |
|---|---|
| `src/types/referee.ts` | Interface `Arbitro` |
| `electron/referees.ts` | Handlers IPC de árbitros |
| `src/pages/ArbitrosMenu.tsx` | Menu intermediário de árbitros |
| `src/pages/AdminArbitros.tsx` | Tabela CRUD de árbitros |
| `src/components/ArbitroForm.tsx` | Modal de cadastro/edição de árbitro |

---

## 15. Implementação Executada (Ordem Real)

| Fase | Tarefa | Status |
|---|---|---|
| **1** | Criar `src/types/bracket.ts` | ✅ |
| **2** | Estender `src/types/tournament.ts` (+ campo `chaves`) | ✅ |
| **3** | Criar `electron/brackets.ts` (seed sorting + geração + handlers IPC + auto-atribuir árbitros) | ✅ |
| **4** | Estender `electron/main.ts` (registrar `registerBracketHandlers`) | ✅ |
| **5** | Estender `electron/preload.ts` (expor métodos) | ✅ |
| **6** | Estender `src/types/electron.d.ts` (tipos IPC) | ✅ |
| **7** | Criar `src/pages/GerenciarChaves.tsx` (dois estados: botão gerar → grid de cards) | ✅ |
| **8** | Criar `src/components/BracketTree.tsx` | ✅ (não integrado) |
| **9** | Criar `src/components/BracketCard.tsx` | ✅ (não integrado) |
| **10** | Criar `src/components/RegistrarResultadoModal.tsx` | ✅ (não integrado) |
| **11** | Criar `src/components/EditarChaveModal.tsx` (reordenar, embaralhar, trocar árbitro) | ✅ |
| **12** | Atualizar `src/pages/Dashboard.tsx` (+ card Geração de Chaves) | ✅ |
| **13** | Atualizar `src/App.tsx` (+ rota `/admin/categorias/chaves`) | ✅ |
| **14** | Adicionar campo `arbitroId` em `Chave` | ✅ |
| **15** | Criar handler `atribuir-arbitro-chave` em `brackets.ts` | ✅ |
| **16** | Adicionar seletor de árbitro em `EditarChaveModal.tsx` | ✅ |
| **17** | Atualizar este spec (`geracao-chaves.md`) para refletir a implementação real | ✅ |

> **Nota:** A implementação de chaves depende do módulo de Categorias estar concluído. Sem categorias configuradas e atletas classificados, não há base para gerar chaves.

---

## 16. Regras de Validação

| Regra | Mensagem |
|---|---|
| Categoria deve ter entre 2 e 5 atletas para gerar chave | "A categoria precisa ter entre 2 e 5 atletas para gerar uma chave." |
| Categoria com 1 atleta: campeão declarado automaticamente | "Atleta {nome} declarado campeão — categoria com apenas 1 atleta." |
| Categoria com mais de 5 atletas: não gera chave | "A categoria possui mais de 5 atletas. Reduza para no máximo 5 atletas por chave." |
| Edição bloqueada: lutas já iniciadas | "Não é possível editar a chave após o início das lutas." (verificado pelo status `gerada`) |
| Luta já possui resultado: bloqueia re-registro | "Esta luta já possui resultado registrado." |
| Atleta não pertence à categoria: bloqueia atribuição como vencedor | "O atleta selecionado não pertence a esta categoria." |
| Árbitro não encontrado: bloqueia atribuição | "Árbitro não encontrado no torneio." |
| Conflito de equipe na atribuição | "Atenção: o árbitro é da equipe {equipe}, que possui atletas nesta chave." (apenas aviso, não bloqueia) |

---

## 17. Notificações

| Evento | Tipo | Mensagem |
|---|---|---|
| Chaves geradas com sucesso | Sucesso (verde) | "{N} chave(s) gerada(s) com sucesso para {M} categoria(s)." |
| Chaves regeneradas | Sucesso (verde) | "{N} chave(s) regenerada(s) com sucesso." |
| Chave editada | Sucesso (verde) | "Chave editada com sucesso." |
| Resultado registrado | Sucesso (verde) | "Resultado registrado: {nome do atleta} venceu." |
| WO registrado | Alerta (amarelo) | "WO — {nome do atleta} avançou sem lutar." |
| Categoria sem atletas suficientes | Alerta (amarelo) | "{N} categoria(s) com apenas 1 atleta. Campeão(ões) declarado(s) automaticamente." |
| Categoria com excesso de atletas | Alerta (amarelo) | "{N} categoria(s) com mais de 5 atletas. Não é possível gerar chave(s)." |
| Alerta de equipe no mesmo lado | Alerta (amarelo) | "Atletas da equipe {equipe} estão no mesmo lado da chave." |
| Erro ao gerar chaves | Erro (vermelho) | "Erro ao gerar chaves. Verifique os dados das categorias." |
| Erro ao editar chave | Erro (vermelho) | "Erro ao salvar edição da chave." |
| Erro ao registrar resultado | Erro (vermelho) | "Erro ao registrar resultado da luta." |
| Conflito de equipe na atribuição de árbitro | Alerta (amarelo) | "Atenção: o árbitro é da equipe {equipe}, que possui atletas nesta chave." |
| Árbitro atribuído | Sucesso (verde) | "{nome do árbitro} atribuído à chave." |
| Árbitro removido | Informação (azul) | "Árbitro removido da chave." |

---

## 18. Casos de Borda

1. **Categoria com 1 atleta:** O atleta é declarado campeão automaticamente. Não é gerada chave — apenas um registro de "Campeão automático" é criado com status `finalizada`.

2. **Categoria com mais de 5 atletas:** O sistema bloqueia a geração de chave e exibe alerta: "A categoria possui mais de 5 atletas. Reduza para no máximo 5 atletas por chave."

3. **Atleta removido da categoria após chave gerada:** A chave existente é invalidada (status `invalida`). O sistema exibe alerta: "Atleta(s) removido(s) da categoria após geração da chave. Regenere a chave." Chaves com lutas `in_progress` ou `completed` são preservadas — o atleta removido é marcado como WO nas lutas pendentes.

4. **Categoria com nova classificação de atleta:** Se um atleta for realocado para outra categoria e a chave da categoria origem já existir, a chave é marcada como `invalida` e o alerta do caso 3 é exibido.

5. **Chave em andamento com interrupção:** Se o sistema for fechado durante uma luta `in_progress`, o status permanece `in_progress` ao recarregar. O administrador pode finalizar a luta ou marcar como WO.

6. **Edição com sobreposição de equipes:** O sistema alerta se a edição resultar em atletas da mesma equipe no mesmo lado da chave. O alerta é informativo, não bloqueante.

7. **Empate não é permitido:** No Jiu-Jitsu competitivo não há empate. O sistema não prevê este estado. Toda luta deve ter um vencedor.

8. **Ausência de ambos os atletas:** Se ambos os atletas não comparecerem, o administrador pode marcar ambos como WO. A luta seguinte recebe um slot vazio (null).

9. **Disputa de 3º lugar:** O sistema não realiza disputa de terceiro lugar. Ambos os perdedores das semifinais recebem medalha de bronze.

10. **Árbitro removido durante o torneio:** As chaves que estavam atribuídas a ele ficam com `arbitroId = null`. O administrador deve reatribuir um novo árbitro antes do início das lutas.
