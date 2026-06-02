# Documentação - Menu Placar

> Documento técnico-funcional descrevendo, em detalhes, todas as telas, componentes, APIs e regras de negócio envolvidas no menu **Placar** do BJJ Tournament Manager.

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Fluxo de navegação](#2-fluxo-de-navegação)
3. [Estrutura de arquivos](#3-estrutura-de-arquivos)
4. [Tela 1 - PlacarMenu (seleção de área)](#4-tela-1---placarmenu-seleção-de-área)
5. [Tela 2 - PlacarChaves (chaves da área)](#5-tela-2---placarchaves-chaves-da-área)
6. [Tela 3 - PlacarBracket (visualização da chave)](#6-tela-3---placarbracket-visualização-da-chave)
7. [Tela 4 - PlacarLuta (placar individual)](#7-tela-4---placarluta-placar-individual)
8. [Componente BracketTree](#8-componente-brackettree)
9. [Componente RegistrarResultadoModal](#9-componente-registrarresultadomodal)
10. [APIs do Electron (IPC)](#10-apis-do-electron-ipc)
11. [Tipos de dados](#11-tipos-de-dados)
12. [Regras de negócio e fluxos](#12-regras-de-negócio-e-fluxos)
13. [Limitações conhecidas](#13-limitações-conhecidas)

---

## 1. Visão geral

O menu **Placar** é a área operacional do torneio: é onde a mesa de cada área de luta acompanha as chaves alocadas, abre as lutas, registra os resultados e visualiza o avanço dos vencedores na árvore.

Diferente do menu **Gerenciar Chaves** (que é administrativo - cria, embaralha, troca árbitros), o Placar é **read-only para a estrutura** (não cria nem reordena chaves) e **read-write para resultados** (registra vencedor por luta).

Conceitos-chave:

- **Área de luta** (`AreaLuta`): uma "mesa" / tatame com um conjunto de árbitros designados.
- **Chave** (`Chave`): a árvore de lutas de uma categoria; pertence a uma área indiretamente via árbitro.
- **Luta** (`Luta`): cada confronto individual dentro de uma chave, com rodada e ordem.

A vinculação **chave → área** é feita pelo árbitro: uma chave aparece na área cujo `area.arbitroIds` contém o `chave.arbitroId`.

---

## 2. Fluxo de navegação

```
MenuInicial
   │
   ▼
/admin/dashboard
   │
   ▼ (clique em "Placar")
/admin/placar                          ← PlacarMenu (seleciona área)
   │
   ▼ (clique em "Acessar")
/admin/placar/chaves/:areaId           ← PlacarChaves (lista chaves da área)
   │
   ▼ (clique numa chave)
/admin/placar/chave/:areaId/:chaveId   ← PlacarBracket (árvore + lutas para iniciar)
   │
   ▼ (clique em "Iniciar" numa luta)
/admin/placar/luta/:chaveId/:lutaId    ← PlacarLuta (placar individual)
```

As rotas estão registradas em `src/App.tsx:47-50`.

---

## 3. Estrutura de arquivos

### Páginas (`src/pages/`)

| Arquivo | Rota | Responsabilidade |
|---|---|---|
| `PlacarMenu.tsx` | `/admin/placar` | Selecionar a área de luta |
| `PlacarChaves.tsx` | `/admin/placar/chaves/:areaId` | Listar chaves daquela área |
| `PlacarBracket.tsx` | `/admin/placar/chave/:areaId/:chaveId` | Renderizar a árvore e listar lutas iniciáveis |
| `PlacarLuta.tsx` | `/admin/placar/luta/:chaveId/:lutaId` | Tela de placar de uma luta específica (em construção) |

### Componentes (`src/components/`)

| Arquivo | Usado por | Função |
|---|---|---|
| `BracketTree.tsx` | `PlacarBracket` | Desenha a árvore visual da chave com conexões SVG |
| `BracketCard.tsx` | (não utilizado atualmente no menu Placar) | Card branco alternativo de luta |
| `RegistrarResultadoModal.tsx` | `PlacarBracket` | Modal para confirmar vencedor / declarar WO |
| `PageLayout.tsx` | Todas | Wrapper de página com título e botão voltar |

### Backend (`electron/`)

| Arquivo | Função relevante ao Placar |
|---|---|
| `brackets.ts` | Handlers `load-chaves`, `load-chaves-por-area`, `registrar-resultado`, lógica `advanceWinnerInChave` |
| `preload.ts` | Expõe `loadChaves`, `loadChavesPorArea`, `registrarResultado` em `window.electronAPI` |
| `areas.ts` | `loadAreas` (usado para descobrir áreas) |

---

## 4. Tela 1 - PlacarMenu (seleção de área)

**Arquivo:** `src/pages/PlacarMenu.tsx`

### Função

Tela inicial do menu. O usuário escolhe **em qual área de luta** vai operar (ex.: Tatame 1, Área Central).

### Estado e ciclo de vida

```ts
const [areas, setAreas] = useState<AreaLuta[]>([])
const [selectedArea, setSelectedArea] = useState<string | null>(null)
const [loading, setLoading] = useState(true)
```

No `useEffect` (uma vez no mount), chama `window.electronAPI.loadAreas()` (`PlacarMenu.tsx:14`), que retorna todas as áreas cadastradas no torneio ativo.

### UI

- Ícone `IconScoreboard` + título "Placar".
- Se `areas.length === 0`: mensagem "Nenhuma área de luta cadastrada. Cadastre áreas primeiro."
- Caso contrário: `<Select>` (searchable) com `value=area.id, label=area.nome` e botão **Acessar**, desabilitado até haver seleção.

### Navegação de saída

Ao clicar em **Acessar** (`PlacarMenu.tsx:52`):

```ts
navigate(`/admin/placar/chaves/${selectedArea}`)
```

---

## 5. Tela 2 - PlacarChaves (chaves da área)

**Arquivo:** `src/pages/PlacarChaves.tsx`

### Função

Lista todas as chaves cuja designação de árbitro pertença à área selecionada.

### Carregamento de dados

Em `PlacarChaves.tsx:61-76`, dispara 4 chamadas paralelas:

```ts
Promise.all([
  window.electronAPI.loadAreas(),            // pra achar o nome da área
  window.electronAPI.loadChavesPorArea(areaId), // chaves filtradas
  window.electronAPI.loadArbitros(),         // pra exibir nome do árbitro
  window.electronAPI.loadAthletes(),         // pra montar título e listar atletas
])
```

A filtragem **chave → área** acontece no backend (`electron/brackets.ts:460-469`):

```ts
function loadChavesPorAreaHandler(torneioId, areaId) {
  const area = areas.find(a => a.id === areaId)
  const arbitroIds = new Set(area.arbitroIds)
  return torneio.chaves
    .map(normalizeChave)
    .filter(c => c.arbitroId && arbitroIds.has(c.arbitroId))
}
```

Ou seja: **chave só aparece se tiver árbitro atribuído e esse árbitro pertencer à área**.

### Busca

Campo `TextInput` com debounce implícito (filtra a cada digitação via `useMemo`). A filtragem é por título da chave (insensitive). O título é montado por `getChaveTitle()` (`PlacarChaves.tsx:35-49`):

- Faixa: menor a maior das faixas dos atletas da chave (ex.: "Branca a Azul").
- Peso: extraído do `categoriaId` (ex.: `adulto-masculino-leve` → "Leve").
- Quantidade: número de atletas.

Exemplo: `Azul a Roxa - Médio - 4 atletas`.

### Card de chave

Renderizado em `SimpleGrid` (`PlacarChaves.tsx:125`) com:

- Título (`getChaveTitle`)
- Badge: `{N} luta(s)`
- Badge: "Gerada"
- "Árbitro: ..." (formatado por `getArbitroNome` que usa nome + faixa)
- Lista capitalizada dos atletas
- Hover com elevação (`translateY(-2px) + boxShadow`)
- `onClick`: navega para `/admin/placar/chave/:areaId/:chaveId`

---

## 6. Tela 3 - PlacarBracket (visualização da chave)

**Arquivo:** `src/pages/PlacarBracket.tsx`

### Função

Tela principal de operação de uma chave: mostra a **árvore visual** (componente `BracketTree`) e uma **tabela de lutas prontas para iniciar**.

### Carregamento

`useEffect` em `PlacarBracket.tsx:30-43`:

```ts
Promise.all([
  window.electronAPI.loadChaves(),     // carrega todas, depois filtra por chaveId
  window.electronAPI.loadAthletes(),
  window.electronAPI.loadArbitros(),
])
```

Se não achar a chave: renderiza "Chave não encontrada."

### Lutas iniciáveis (`startableFights`)

`useMemo` em `PlacarBracket.tsx:62-69`:

```ts
chave.lutas.filter(l =>
  l.status === 'pending'
  && l.atletaAId !== 'bye' && l.atletaBId !== 'bye'
  && l.atletaAId !== 'tbd' && l.atletaBId !== 'tbd'
)
```

Uma luta é "iniciável" quando:

- Está pendente (não foi completada nem é WO).
- Ambos os slots têm atleta real (não placeholder `tbd` nem `bye`).

Slots `tbd` significam que aguardam o vencedor de uma luta anterior; logo, a luta posterior só fica iniciável depois que a anterior terminar.

### Renderização

#### 1. Cabeçalho informativo

```
Árbitro: Fulano (Preta) - 3 luta(s), 4 atleta(s)
```

#### 2. Bracket visual

```tsx
<Paper withBorder p="md" style={{ overflowX: 'auto', backgroundColor: '#FFF' }}>
  <BracketTree
    chave={chave}
    getAtletaNome={getAtletaNome}
    onSelectWinner={handleSelectWinner}
  />
</Paper>
```

A função `getAtletaNome` (`PlacarBracket.tsx:45-53`) traduz `id → "Nome (Equipe)"`, com fallbacks:

- `null | 'bye' | 'tbd'` → `"A definir"`
- ID inexistente → `"Atleta removido"`
- ID válido → `"Nome (Equipe)"` capitalizados

#### 3. Tabela "Lutas para Iniciar"

Tabela do Mantine com colunas: Luta (badge `#ordem`), Atleta A, Atleta B, Ação. Botão **Iniciar** verde com `IconPlayerPlay` navega para `/admin/placar/luta/:chaveId/:lutaId`.

### Registro de resultado

Existem **dois caminhos** para registrar o vencedor:

1. **Pelo BracketTree**: usuário clica no troféu de um atleta no card → chama `handleSelectWinner(luta, vencedorId)` → abre o `RegistrarResultadoModal`.
2. **Pela tabela "Iniciar"**: navega para a tela `PlacarLuta` (que ainda não persiste, ver Tela 4).

`handleConfirmResult` (`PlacarBracket.tsx:81-95`) chama o backend:

```ts
const updatedChave = await window.electronAPI.registrarResultado({
  chaveId, lutaId, vencedorId, status,  // status: 'completed' | 'wo'
})
setChave(updatedChave)
```

O backend devolve a chave inteira atualizada (com o vencedor propagado para as rodadas seguintes), e a UI re-renderiza.

---

## 7. Tela 4 - PlacarLuta (placar individual)

**Arquivo:** `src/pages/PlacarLuta.tsx`

### Função

Tela dedicada a **uma luta específica**. Atualmente é um **placeholder estrutural**: exibe a luta e os atletas, mas **não tem ainda placar de pontos** (vantagens, penalidades, tempo).

### Estado

```ts
const [chave, setChave] = useState<Chave | null>(null)
const [luta, setLuta] = useState<Luta | null>(null)
const [athletes, setAthletes] = useState<Atleta[]>([])
```

Em `useEffect`, carrega todas as chaves e atletas; encontra a chave pelo `chaveId` e a luta pelo `lutaId`.

### UI

```
┌────────────────────────────────────────┐
│              Placar                    │
│         [Luta {ordem}]                 │
│                                        │
│  [Atleta A]   VS   [Atleta B]          │
└────────────────────────────────────────┘
```

Cada atleta dentro de um `<Paper>` com `minWidth: 200`. `VS` central em texto grande.

### Estado atual (limitação)

Esta tela **não tem cronômetro, placar de pontos nem persiste resultado**. É uma página informativa. A persistência hoje só acontece via `PlacarBracket` (clique no troféu).

> **TODO funcional:** integrar controles de pontuação (pontos, vantagens, penalidades) e tempo regressivo, com persistência via `registrarResultado`.

---

## 8. Componente BracketTree

**Arquivo:** `src/components/BracketTree.tsx`

### Função

Desenha a árvore da chave com colunas por rodada e conexões SVG curvas entre os cards.

### Props

```ts
interface BracketTreeProps {
  chave: Chave
  getAtletaNome: (id: string | null) => string
  onSelectWinner?: (luta: Luta, vencedorId: string) => void
}
```

### Estilo visual

Tema escuro fixo (independente do tema Mantine):

- Container: `#020617` (slate-950)
- Card: `#0f172a` (slate-900) com borda `#1e293b` (slate-800)
- Vencedor: fundo `#064e3b` (emerald-900)
- Conexões SVG: stroke `#475569` (slate-600), curvas Bézier
- Texto principal: `#f1f5f9` (slate-100), legendas: `#64748b` (slate-500)

### Lógica de colunas

`useMemo` agrupa lutas por `rodada`, depois ordena por `ordem`:

```ts
const byRodada = new Map<number, Luta[]>()
for (const l of chave.lutas) byRodada.get(l.rodada).push(l)
const rodadas = [...byRodada.keys()].sort()
columns = rodadas.map(r => byRodada.get(r).sort((a,b) => a.ordem - b.ordem))
```

Cada coluna usa `justifyContent: 'space-around'` (ou `center` se só houver 1 luta) para distribuir verticalmente os cards.

### Lógica de conexões

`buildConnections(chave)` produz pares `{from: mId, to: mId}` com este algoritmo:

1. Ordena lutas por (rodada, ordem).
2. Mantém um mapa `vencedorId → luta` para detectar slots já preenchidos por vencedores anteriores.
3. Usa uma **fila** de lutas candidatas a ser "source" (origem de conexão).
4. Para cada luta da rodada > 1:
   - Conta slots de origem (`sourceSlots`): vale 1 se o slot é `'tbd'`, ou se é um ID que corresponde ao `vencedorId` de uma luta anterior.
   - Para cada source slot, retira da fila a primeira luta de rodada anterior e cria a conexão `from → to`.
5. Adiciona a luta atual na fila (pode virar source de uma rodada ainda maior).

Este algoritmo funciona para todos os tamanhos de chave suportados (2 a 5 atletas).

### Desenho das curvas SVG

Em `useEffect`, recalcula sempre que `connections` ou `chave` mudam:

```ts
const x1 = rect1.right - container.left          // saída do card origem
const y1 = rect1.top + rect1.height/2 - container.top
const x2 = rect2.left - container.left           // entrada do card destino
const y2 = rect2.top + rect2.height/2 - container.top
path = `M ${x1} ${y1} C ${x1+40} ${y1}, ${x2-40} ${y2}, ${x2} ${y2}`
```

Usa curva Bézier cúbica com pontos de controle 40px à frente do origem e 40px atrás do destino, criando a curva suave característica.

Registra `window.addEventListener('resize', drawConnections)` para redesenhar em resize de janela.

### Card interno

Componente `Card` local (não confundir com Mantine Card):

- Width 256px fixo.
- Título: `LUTA #{ordem}`.
- Duas linhas (slot 1 = atletaAId, slot 2 = atletaBId).
- Cada linha: nome + (se não é placeholder e `onSelectWinner` está definido) botão troféu.
- Vencedor recebe background emerald.
- Hover no troféu: muda background para `#1e293b`.

Clique no troféu chama `onSelectWinner(luta, slotId)` que, no PlacarBracket, abre o modal.

---

## 9. Componente RegistrarResultadoModal

**Arquivo:** `src/components/RegistrarResultadoModal.tsx`

### Função

Modal de confirmação onde o usuário escolhe **quem venceu** e se foi por **WO**.

### Props

```ts
interface RegistrarResultadoModalProps {
  opened: boolean
  onClose: () => void
  luta: Luta | null
  atletaANome: string
  atletaBNome: string
  initialVencedorId?: string | null    // pré-seleção (ex.: o troféu que foi clicado)
  onConfirm: (vencedorId: string, status: string) => void
}
```

### UI

1. **Radio.Group** com dois radios (atleta A e atleta B). Pré-selecionado conforme `initialVencedorId`.
2. **Dois botões "WO Atleta X"** (cor laranja) que setam `isWO = true` e fixam o vencedor para aquele atleta.
3. Botões **Cancelar** e **Confirmar**.
4. Se a luta tem slot indefinido: exibe "Esta luta aguarda definição de luta(s) anterior(es)." e não permite confirmar.

### Comportamento

`handleConfirm`:

```ts
onConfirm(vencedorId, isWO ? 'wo' : 'completed')
onClose()
```

Status `'completed'` = vitória normal; `'wo'` = walkover.

`useEffect([opened, initialVencedorId])`: reseta o estado quando abre o modal.

---

## 10. APIs do Electron (IPC)

Todas as chamadas do menu Placar passam por `window.electronAPI`, definido em `src/types/electron.d.ts` e exposto em `electron/preload.ts`.

### `loadAreas(): Promise<AreaLuta[]>`

Carrega todas as áreas de luta do torneio ativo. Cada `AreaLuta` tem `id`, `nome`, `arbitroIds[]`.

### `loadChavesPorArea(areaId): Promise<Chave[]>`

Filtra chaves do torneio ativo cujo `arbitroId` esteja no `area.arbitroIds`. **Chaves sem árbitro não aparecem**.

### `loadChaves(): Promise<Chave[]>`

Carrega **todas** as chaves do torneio (sem filtro por área). Usada em `PlacarBracket` e `PlacarLuta` para localizar uma chave específica por `chaveId`.

### `loadAthletes(): Promise<Atleta[]>`

Carrega todos os atletas. Usado para resolver IDs em nomes.

### `loadArbitros(): Promise<Arbitro[]>`

Carrega todos os árbitros. Usado para exibir nome+faixa do árbitro da chave.

### `registrarResultado(data): Promise<Chave>`

Argumentos:

```ts
{ chaveId: string, lutaId: string, vencedorId: string, status: 'completed' | 'wo' }
```

Comportamento no backend (`electron/brackets.ts:520-549`):

1. Carrega o torneio, clona a chave.
2. Se já havia vencedor anterior diferente: chama `clearWinnerFromLaterRounds()` para **limpar a propagação** desse vencedor em rodadas posteriores (essencial em caso de correção de resultado).
3. Atualiza `luta.vencedorId` e `luta.status`.
4. Chama `advanceWinnerInChave()` para propagar o vencedor ao próximo slot `tbd` da próxima rodada conforme a topologia da chave.
5. Salva o torneio e retorna a chave atualizada.

A função `advanceWinnerInChave` (`electron/brackets.ts:489-518`) usa a fórmula:

```
pairsPerMatch = 2^(targetRodada - lutaRodada - 1)
nextMatchIndex = floor(matchIndex / pairsPerMatch)
slotIndex = matchIndex % 2^(targetRodada - lutaRodada)
firstSlotAt = floor(slotIndex / pairsPerMatch)  // 0 → atletaA, 1 → atletaB
```

Se o slot já está ocupado ou o índice está fora, tenta a próxima rodada (loop até `totalRodadas`).

---

## 11. Tipos de dados

### `AreaLuta` (`src/types/area.ts`)

```ts
interface AreaLuta {
  id: string
  nome: string
  arbitroIds: string[]   // chave da relação chave→área
  createdAt: string
  updatedAt: string
}
```

### `Chave` (`src/types/bracket.ts`)

```ts
interface Chave {
  id: string
  categoriaId: string                 // ex.: 'adulto-masculino-leve'
  lutas: Luta[]
  posicoesAtletas: string[]           // ordem de seed dos atletas
  arbitroId: string | null            // determina em qual área aparece
  totalAtletas: number
  totalLutas: number
  totalRodadas: number                // 1, 2 ou 3
  status: 'gerada'
}
```

### `Luta` (`src/types/bracket.ts`)

```ts
interface Luta {
  id: string
  ordem: number                       // numeração visível (#1, #2, ...)
  rodada: number                      // 1, 2 ou 3
  atletaAId: string                   // ID, 'tbd' ou 'bye'
  atletaBId: string                   // ID, 'tbd' ou 'bye'
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'wo'
  vencedorId?: string | null
}
```

Placeholders:

- `'tbd'` = "to be determined" - aguarda vencedor de luta anterior.
- `'bye'` = atleta passou direto sem lutar (não usado nos tamanhos 2-5 atuais, mas previsto).

### Tamanhos de chave suportados

| Atletas | Rodadas | Lutas (por rodada) |
|---|---|---|
| 2 | 1 | R1: 1 |
| 3 | 2 | R1: 1, R2: 1 (TBD vs seed[2]) |
| 4 | 2 | R1: 2, R2: 1 (TBD vs TBD) |
| 5 | 3 | R1: 2, R2: 1 (TBD vs seed[4]), R3: 1 (TBD vs TBD) |

Limite: `MAX_ATLETAS_POR_CHAVE = 5` (`electron/brackets.ts:122`).

---

## 12. Regras de negócio e fluxos

### Por que a chave precisa ter árbitro pra aparecer

`loadChavesPorAreaHandler` filtra `c.arbitroId && arbitroIds.has(c.arbitroId)`. Logo:

- Chave **sem árbitro**: invisível em qualquer Placar.
- Chave com árbitro **não associado a nenhuma área**: invisível.
- Mesmo árbitro em duas áreas: chave aparece nas duas (uso raro mas válido).

Pra a chave aparecer no Placar é preciso ter passado por **Gerenciar Chaves** → atribuir árbitro automático ou manual, e o árbitro precisa estar na lista de árbitros da área (cadastro em **Áreas**).

### Fluxo completo de uma luta

```
1. Admin gera chave em /admin/categorias/chaves
   → árbitro é autoatribuído (autoAtribuirArbitros)
2. Admin cadastra/edita área em /admin/areas/lista,
   adicionando o árbitro da chave à lista da área
3. Mesa entra em /admin/placar, seleciona a área
4. /admin/placar/chaves/:areaId mostra a chave
5. Clique na chave → /admin/placar/chave/:areaId/:chaveId
6. BracketTree mostra a árvore; tabela mostra a luta da R1 como "iniciável"
7. Clica no troféu de um atleta no card
   → abre RegistrarResultadoModal
   → confirma → registrarResultado(...) → chave atualizada
   → vencedor propaga pra rodada 2 (slot 'tbd' vira o ID do vencedor)
8. Luta da R2 vira iniciável quando todos seus slots forem reais
9. Repetir até a final
```

### Correção de resultado

Se o admin registrar um vencedor errado e depois corrigir, `clearWinnerFromLaterRounds` **limpa recursivamente** o ID do vencedor antigo de todas as rodadas posteriores e reseta o status dessas lutas para `'pending'`. Em seguida `advanceWinnerInChave` propaga o vencedor novo. Isso mantém a integridade da árvore.

### Diferença entre status `completed` e `wo`

- `completed`: vitória normal (por pontos, finalização, decisão).
- `wo`: walkover - adversário não compareceu / desistiu. Marcado nos botões laranja "WO Atleta X" do modal.

Ambos propagam o vencedor da mesma forma; a diferença é apenas semântica para relatórios.

### Lutas com `bye`

Geração atual (2-5 atletas) **não cria slots `bye`**. O caso de número ímpar é tratado posicionando o atleta extra em rodada 2 (ex.: 3 atletas → seed[2] vai direto pra R2). O placeholder `bye` está previsto no tipo mas reservado para implementações futuras de chaves maiores.

### Múltiplas lutas iniciáveis em paralelo

Numa chave de 4 atletas, **as duas lutas da R1 podem ser iniciadas em paralelo** (a tabela mostra ambas). Cabe à mesa decidir qual chamar primeiro. Não há ordem obrigatória além de R(N) terminar antes de habilitar R(N+1).

---

## 13. Limitações conhecidas

1. **PlacarLuta sem placar real.** A tela `/admin/placar/luta/...` é cosmética; não tem cronômetro, pontuação ou persistência. O registro de vencedor hoje ocorre exclusivamente via troféu no `BracketTree`.

2. **Sem indicador de luta em andamento.** O status `in_progress` existe no tipo `Luta` mas nenhum fluxo o atribui hoje. Lutas são `pending` → `completed`/`wo` direto.

3. **Sem ordem obrigatória de execução.** A mesa pode marcar resultado de qualquer luta iniciável, em qualquer ordem.

4. **Sem histórico de alterações.** Trocar o vencedor sobrescreve o resultado anterior sem log. Há propagação reversa (`clearWinnerFromLaterRounds`) mas sem auditoria.

5. **Chave invisível se árbitro for removido da área.** Se o admin tirar o árbitro da `area.arbitroIds`, a chave desaparece do Placar daquela área até reassociação.

6. **BracketTree usa tema escuro fixo.** O `<Paper>` branco do `PlacarBracket` envolve o componente, criando contraste forte. Isto é proposital (visual do bracket é independente do tema da página).

7. **Tamanho máximo: 5 atletas/chave.** Chaves maiores precisam ser divididas previamente em **Gerenciar Chaves**.
