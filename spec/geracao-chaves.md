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
| Geração automática de chaves por categoria | ❌ Pendente |
| Visualização de chave (bracket tree) | ❌ Pendente |
| Edição manual de posições na chave | ❌ Pendente |
| Exportação de chaves (JSON) | ❌ Pendente |
| Importação de chaves (JSON) | ❌ Pendente |
| Histórico de lutas por chave | ❌ Pendente |
| Suporte a WO / desistência | ❌ Pendente |

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

A tela deve conter:

1. **Seletor de Categoria** — dropdown listando todas as categorias configuradas com contagem de atletas.
2. **Botão "Gerar Chave"** — disponível apenas se a categoria tiver entre 2 e 5 atletas e não possuir chave.
3. **Botão "Regenerar Chave"** — disponível apenas se a chave existir e estiver com status `gerada`. Exibe confirmação antes de regenerar.
4. **Botão "Editar Chave"** — disponível se a chave existir e estiver com status `gerada`. Abre modo de edição de posições.
5. **Botões "Importar Chaves" e "Exportar Chaves"** — disponíveis sempre. Importar abre diálogo nativo, exportar salva JSON com todas as chaves.
6. **Visualização da Chave** — árvore de brackets com suporte a edição manual.

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

### 5.3. Regeneração de Chave

- Permitida apenas se nenhuma luta da chave tiver sido iniciada (`status === 'gerada'`).
- Se qualquer luta estiver com status diferente de `pending`, a regeneração é bloqueada.
- Exibição de modal de confirmação antes de regenerar.
- Ao confirmar, a chave existente é substituída por uma nova, mantendo o mesmo `id`.

### 5.4. Edição de Chave

- A edição permite reordenar as posições dos atletas na chave.
- A edição só é permitida se o status da chave for `gerada`.
- Ao salvar a edição, as lutas são recalculadas com base nas novas posições mantendo os mesmos `id`s de lutas.
- O campo `posicoesAtletas` do JSON é atualizado com a nova ordem.
- O histórico de edições não é preservado.

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
| `editar-chave` | Renderer → Main → Renderer | Salva edição manual da chave (novas posições) |
| `atribuir-arbitro-chave` | Renderer → Main → Renderer | Atribui ou remove árbitro de uma chave |
| `import-chaves` | Renderer → Main → Renderer | Abre diálogo nativo, lê JSON, importa chaves para o torneio |
| `export-chaves` | Renderer → Main | Abre diálogo "Salvar como" e exporta JSON das chaves |

### 6.1. Handler `gerar-chave`

```typescript
ipcMain.handle('gerar-chave', (_event, data: { categoriaId: string }): Chave => {
  // 1. Carrega torneio ativo
  // 2. Encontra categoria por ID
  // 3. Obtém atletas da categoria
  // 4. Valida: mínimo 2, máximo 5 atletas
  // 5. Valida: chave ainda não existe para esta categoria
  // 6. Executa algoritmo de geração
  // 7. Salva chave no torneio
  // 8. Retorna chave gerada
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
  arbitroId: string | null;  // ID do árbitro ou null para remover
}): Chave => {
  // 1. Carrega torneio ativo
  // 2. Encontra chave por ID
  // 3. Se arbitroId não for null:
  //    a. Verifica se o árbitro existe no torneio
  //    b. Atualiza chave.arbitroId = arbitroId
  //    c. Adiciona chaveId ao array chaveIds do árbitro
  // 4. Se arbitroId for null:
  //    a. Obtém o arbitroId antigo
  //    b. Remove chaveId do array chaveIds do árbitro antigo
  //    c. Atualiza chave.arbitroId = null
  // 5. Salva JSON
  // 6. Retorna chave atualizada
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

## 7. Preload (Novos Métodos)

```typescript
// electron/preload.ts — adicionar ao electronAPI

contextBridge.exposeInMainWorld('electronAPI', {
  // ... métodos existentes ...

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

## 8. Tipos (Novos)

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
  posicoesAtletas: string[];
  arbitroId: string | null;
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

- Usa `PageLayout` com título "Gerenciar Chaves"
- **Seletor de Categoria**: `Select` populado com lista de categorias + contagem de atletas
  - Opções desabilitadas se categoria tem < 2 ou > 5 atletas
  - Indicador visual se chave já foi gerada para a categoria
- Painel dividido em duas áreas:

#### 10.1.1. Área de Controles (topo)

| Elemento | Condição | Ação |
|---|---|---|
| "Gerar Chave" | Categoria selecionada, 2-5 atletas, sem chave | Gera chave via IPC |
| "Regenerar Chave" | Chave existe, status `gerada` | Modal confirmação → regenera |
| "Editar Chave" | Chave existe, status `gerada` | Abre modo de edição de posições |
| "Salvar Edição" | Modo de edição ativo | Salva posições via IPC `editar-chave` |
| "Atribuir Árbitro" | Chave existe | Abre seletor de árbitro para a chave |
| "Importar Chaves" | Sempre disponível | Abre diálogo nativo para importar JSON de chaves |
| "Exportar Chaves" | Sempre disponível | Abre diálogo "Salvar como" para exportar JSON das chaves |
| Badge "X atletas" | Sempre visível | Contagem de atletas na categoria |
| Badge "Árbitro: {nome}" | Árbitro atribuído | Exibe nome do árbitro da chave |
| Badge "Chave Gerada" | Chave existe | Indicador verde |
| Badge "Em Andamento" | Chave com lutas `in_progress` | Indicador amarelo |
| Badge "Finalizada" | Todas as lutas `completed` | Indicador azul |

#### 10.1.2. Área de Visualização da Chave

A chave é renderizada como uma **árvore de brackets** no formato visual de torneio:

```
Rodada 1 (Quartas)    Rodada 2 (Semifinais)    Rodada 3 (Final)

┌──────────────┐
│ Luta 1       │
│ A4 vs A5     │
│ [Resultado]  │
└──────┬───────┘
       │
┌──────┴───────┐
│ Luta 2       │
│ A1 vs V1     │
│ [Resultado]  │
└──────┬───────┘
       │
┌──────┴───────┐
│ Luta 4       │  ← Final
│ V2 vs V3     │
│ [Resultado]  │
└──────────────┘


┌──────────────┐
│ Luta 3       │
│ A2 vs A3     │
│ [Resultado]  │
└──────┬───────┘
       │
┌──────┴───────┐
│ (alimenta)   │
└──────────────┘
```

#### 10.1.3. Atribuição de Árbitro

- No topo da visualização da chave, exibe um seletor "Árbitro da Chave".
- O seletor é um `Select` populado com a lista de árbitros cadastrados (formato: "Nome (Faixa)").
- Inclui opção "Sem árbitro" para remover a atribuição.
- Ao selecionar um árbitro, dispara IPC `atribuir-arbitro-chave`.
- A lista `chaveIds` do árbitro é atualizada automaticamente no backend.

Implementação:
- Cada luta é um `Card` ou `Paper` com borda.
- Cards conectados por linhas (CSS borders ou elementos `div`).
- Atleta A (topo), Atleta B (base).
- Vencedor destacado (fundo verde) quando luta `completed`.
- Lutas `pending`: placeholder "Aguardando..." nos slots não preenchidos.
- Lutas `wo`: estilo riscado no atleta ausente.
- Clique em luta `pending`: abre modal para registrar resultado.
- Badge do árbitro no topo da chave (nome e faixa), com botão "Trocar" para reatribuir.

#### 10.1.4. Modo de Edição

Ao clicar "Editar Chave":
- Os atletas são exibidos em uma lista ordenável (drag & drop) representando as posições 1 a N.
- Após reordenar, o administrador clica "Salvar Edição".
- O sistema recalcula as lutas com base na nova ordem de posições.
- Um alerta visual é exibido se atletas da mesma equipe ficarem no mesmo lado da chave (não bloqueante).

---

## 11. Componentes (Novos)

| Componente | Descrição | Local |
|---|---|---|
| `GerenciarChaves.tsx` | Tela principal de geração, edição e visualização | `src/pages/` |
| `BracketTree.tsx` | Renderização visual da árvore de brackets | `src/components/` |
| `BracketCard.tsx` | Card de luta individual na árvore | `src/components/` |
| `RegistrarResultadoModal.tsx` | Modal de registro de resultado de luta | `src/components/` |
| `EditarChaveModal.tsx` | Modal de edição manual de posições dos atletas | `src/components/` |

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

## 13. Arquivos Afetados (Modificações em Arquivos Existentes)

### Modificações Diretas

| Arquivo | Tipo de Alteração |
|---|---|
| `src/types/tournament.ts` | + campo `chaves: Chave[]` |
| `src/types/electron.d.ts` | + métodos `gerarChave`, `loadChaves`, `loadChavePorCategoria`, `regenerarChave`, `atualizarLuta`, `editarChave`, `atribuirArbitroChave`, `importChaves`, `exportChaves` |
| `src/pages/VisualizarCategorias.tsx` | + indicador de chave por categoria |
| `src/pages/CategoriasMenu.tsx` | + card "Gerenciar Chaves" |
| `src/App.tsx` | + rota `/admin/categorias/chaves` |
| `electron/main.ts` | + import e registro de `registerBracketHandlers()` |
| `electron/preload.ts` | + exposição dos novos métodos IPC |
| `electron/categories.ts` | (inalterado, mas seus dados alimentam chaves) |
| `src/types/bracket.ts` | + campo `arbitroId: string | null` em `Chave` |
| `src/pages/GerenciarChaves.tsx` | + seletor de árbitro por chave |

### Arquivos que Permanecerão Inalterados

| Arquivo | Motivo |
|---|---|
| `src/types/athlete.ts` | Atleta não precisa de novos campos para chaves |
| `src/types/category.ts` | Categoria já possui `atletasIds` suficiente |
| `src/pages/ConfigurarCategorias.tsx` | Escopo separado |
| `electron/athletes.ts` | CRUD de atletas permanece igual |
| `electron/tournament.ts` | CRUD de torneios permanece igual |
| `src/types/referee.ts` | Interface separada em arquivo próprio |

---

## 14. Arquivos Novos

| Arquivo | Descrição |
|---|---|
| `electron/brackets.ts` | Handlers IPC: `gerar-chave`, `load-chaves`, `load-chave-por-categoria`, `regenerar-chave`, `atualizar-luta`, `editar-chave`, `atribuir-arbitro-chave`, `import-chaves`, `export-chaves` |
| `src/types/bracket.ts` | Interfaces `Chave` (+ `arbitroId`), `Luta`, `StatusLuta`, `RodadaNome` |
| `src/pages/GerenciarChaves.tsx` | Tela principal de geração, edição e visualização (+ seletor de árbitro) |
| `src/components/BracketTree.tsx` | Renderização visual da árvore de brackets |
| `src/components/BracketCard.tsx` | Card de luta individual |
| `src/components/RegistrarResultadoModal.tsx` | Modal de registro de resultado |
| `src/components/EditarChaveModal.tsx` | Modal de edição manual de posições |
| `src/types/referee.ts` | Interface `Arbitro` |
| `electron/referees.ts` | Handlers IPC de árbitros |
| `src/pages/ArbitrosMenu.tsx` | Menu intermediário de árbitros |
| `src/pages/AdminArbitros.tsx` | Tabela CRUD de árbitros |
| `src/components/ArbitroForm.tsx` | Modal de cadastro/edição de árbitro |

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
| **11** | Criar `src/components/EditarChaveModal.tsx` | Fase 1 |
| **12** | Atualizar `src/pages/CategoriasMenu.tsx` (+ card Gerenciar Chaves) | Fase 7 |
| **13** | Atualizar `src/pages/VisualizarCategorias.tsx` (+ indicadores de chave) | Fase 7 |
| **14** | Atualizar `src/App.tsx` (+ rota) | Fase 12 |
| **15** | Adicionar campo `arbitroId` em `Chave` | Módulo Árbitros implementado |
| **16** | Criar handler `atribuir-arbitro-chave` em `brackets.ts` | Fase 15 |
| **17** | Adicionar seletor de árbitro em `GerenciarChaves.tsx` | Fase 16 |

> **Nota:** A implementação de chaves depende do módulo de Categorias estar concluído. Sem categorias configuradas e atletas classificados, não há base para gerar chaves.

---

## 16. Regras de Validação

| Regra | Mensagem |
|---|---|
| Categoria deve ter entre 2 e 5 atletas para gerar chave | "A categoria precisa ter entre 2 e 5 atletas para gerar uma chave." |
| Categoria com 1 atleta: campeão declarado automaticamente | "Atleta {nome} declarado campeão — categoria com apenas 1 atleta." |
| Categoria com mais de 5 atletas: não gera chave | "A categoria possui mais de 5 atletas. Reduza para no máximo 5 atletas por chave." |
| Chave já existe e está em andamento: bloqueia regeneração | "Não é possível regenerar a chave pois já existem lutas em andamento ou concluídas." |
| Edição bloqueada: lutas já iniciadas | "Não é possível editar a chave após o início das lutas." |
| Luta já possui resultado: bloqueia re-registro | "Esta luta já possui resultado registrado." |
| Atleta não pertence à categoria: bloqueia atribuição como vencedor | "O atleta selecionado não pertence a esta categoria." |
| Árbitro não encontrado: bloqueia atribuição | "Árbitro não encontrado no torneio." |
| Máximo 1 árbitro por chave | "Esta chave já possui um árbitro atribuído." (verificado no frontend) |

---

## 17. Notificações

| Evento | Tipo | Mensagem |
|---|---|---|
| Chave gerada com sucesso | Sucesso (verde) | "Chave gerada com sucesso para {nome da categoria}." |
| Chave regenerada | Sucesso (verde) | "Chave regenerada com sucesso para {nome da categoria}." |
| Chave editada | Sucesso (verde) | "Posições da chave atualizadas com sucesso para {nome da categoria}." |
| Resultado registrado | Sucesso (verde) | "Resultado registrado: {nome do atleta} venceu." |
| Luta iniciada | Informação (azul) | "Luta {id} iniciada: {atletaA} vs {atletaB}." |
| WO registrado | Alerta (amarelo) | "WO — {nome do atleta} avançou sem lutar." |
| Categoria sem atletas suficientes | Alerta (amarelo) | "{nome da categoria} tem apenas 1 atleta. Campeão declarado automaticamente." |
| Categoria com excesso de atletas | Alerta (amarelo) | "{nome da categoria} tem mais de 5 atletas. Não é possível gerar chave." |
| Alerta de equipe no mesmo lado | Alerta (amarelo) | "Atletas da equipe {equipe} estão no mesmo lado da chave." |
| Erro ao gerar chave | Erro (vermelho) | "Erro ao gerar chave para {nome da categoria}." |
| Erro ao editar chave | Erro (vermelho) | "Erro ao salvar edição da chave." |
| Erro ao registrar resultado | Erro (vermelho) | "Erro ao registrar resultado da luta." |
| Chave finalizada | Sucesso (verde) | "Chave {nome da categoria} finalizada! Campeão: {nome do atleta}." |
| Árbitro atribuído | Sucesso (verde) | "{nome do árbitro} atribuído à chave {nome da categoria}." |
| Árbitro removido | Informação (azul) | "Árbitro removido da chave {nome da categoria}." |

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
