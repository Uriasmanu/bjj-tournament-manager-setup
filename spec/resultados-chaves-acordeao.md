# spec/resultados-chaves-acordeao.md

> Feature: resolver os 2 itens `[aberto]` adicionados pelo usuário em `doc/spec.md`:
> 1. **Remover a aba "Lutas"** de `/admin/resultados` (a visualização de lutas migra para a aba "Chaves" via acordeão).
> 2. **Transformar a aba "Chaves" em acordeão**, mantendo o visual atual do cabeçalho, mas com as lutas (`LutaResumoCard`) visíveis apenas ao expandir a chave. Apenas uma chave expandida por vez.
>
> A busca por nome do atleta (que existia na aba "Lutas" removida) é descartada — a organização por chave é suficiente para localizar lutas de um atleta via clique na chave correspondente.

---

## 1. Contexto e Objetivo

- **O que é:** remover a aba "Lutas" de `/admin/resultados` e reformular a aba "Chaves" para usar o padrão acordeão: cabeçalho clicável por chave, com chevron rotativo, e a lista de lutas (`LutaResumoCard`) exibida em `<Collapse>` quando a chave está expandida.
- **Por que existe:** o usuário prefere uma única "porta de entrada" para a visualização detalhada das lutas (a aba "Chaves"), evitando fragmentação entre duas abas. A organização por chave é mais natural para um torneio — a chave é o agrupamento lógico de lutas, e a expansão sob demanda economiza espaço vertical quando há muitas chaves.
- **Quem usa:** organizador/árbitro/operador de mesa que consulta o histórico de lutas durante/após o torneio, em `/admin/resultados` → aba "Chaves".
- **Escopo:**
  - **Dentro:**
    - Remover `<Tabs.Tab value="lutas">` da lista de abas.
    - Remover `<Tabs.Panel value="lutas">` (e todo o seu conteúdo).
    - Limpar estados, memos, imports e `useEffect` que serviam exclusivamente à aba "Lutas".
    - Adicionar estado `expandedChaveId` (`string | null`) para a aba "Chaves".
    - Envolver o cabeçalho de cada `Card` de chave em `<UnstyledButton>` com `onClick` que alterna `expandedChaveId`.
    - Envolver a `<Stack>` de lutas em `<Collapse in={isExpanded}>`.
    - Adicionar `<IconChevronDown>` (Tabler) no cabeçalho, rotacionado 180° quando expandido, com `transition` CSS de 0.2s.
  - **Fora:** outras 4 abas (Visão Geral, Lutas Casadas, Equipes, Árbitros, Atletas), regras de persistência, IPC, geração de chaves, layout do menu/dashboard.

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): seções 1–12 aplicadas abaixo. Os 2 itens `[aberto]` (linhas 16–22) são o ponto de partida.
- **Documento de requisitos** (`doc/requisitos.md`): seção **3.23. Resultados — Tela com Tudo do Torneio** — descreve a página atual (6 abas → ficará com 5). A nova feature mantém o caráter read-only.
- **Documentação técnica existente:**
  - `spec/tempo-luta-padrao-ibjjf.md` e `spec/historico-lutas-resultados.md` (padrões de doc) — estrutura de 12 seções + Checklist Rápido.
  - `spec/formulario-adicionar-atleta.md` (padrão de doc) — convenções de cabeçalho/citação/decisões.
- **Código-fonte relevante:**
  - `src/pages/Resultados.tsx` — alvo principal. Contém a aba "Lutas" implementada no ciclo anterior (a ser removida) e a aba "Chaves" (a ser reformulada).
  - `src/components/PageLayout.tsx` — não muda.
  - `src/types/bracket.ts` — `Luta`, `PlacarLuta`, `Chave` (inalterados).
  - `src/types/lutaCasada.ts` — `LutaCasada` (inalterado; a aba "Lutas Casadas" segue usando `LutaResumoCard`).

> ⚠️ **Código a ser removido:** a aba "Lutas" do ciclo anterior é composta por `busca`/`expandedId` (estados), `todasLutasDetalhadas`/`lutasFiltradas` (memos), `useEffect(() => setExpandedId(null), [busca])`, `<TextInput>`/`<ActionIcon>` (componentes), `IconSearch`/`IconX` (ícones), `Fragment` (import) e o JSX completo de `<Tabs.Panel value="lutas">`. Tudo isso fica morto após a remoção — será removido nesta spec para evitar código órfão.

> ⚠️ **`todasLutasFinalizadas` (memo, linha 380 do arquivo atual):** criado no ciclo anterior para alimentar a aba "Lutas". Após a remoção da aba, não há mais consumidor → também deve ser removido.

> ⚠️ **`expandedId` (estado):** específico da aba "Lutas". Será substituído por `expandedChaveId` (mais descritivo para o novo uso). Os nomes são distintos para deixar claro o escopo.

> ⚠️ **Comportamento acordeão:** apenas uma chave expandida por vez (clássico acordeão). Se o usuário expandir A e depois B, A fecha automaticamente. Clicar na chave já expandida a fecha (`null`).

---

## 3. História de Usuário

```
Como organizador/árbitro,
quero ver as chaves do torneio em formato de cards fechadas por padrão,
e ao clicar no card as lutas da chave se expandem para consulta detalhada,
para que eu possa navegar rapidamente entre chaves sem rolar por pilhas de lutas não relacionadas.
```

**Cenários alternativos:**

- Nenhuma chave gerada — empty state preservado ("Nenhuma chave gerada.").
- Clique em uma chave com 0 lutas válidas — o cabeçalho expande mas o corpo fica vazio (sem `Divider` nem `<Stack>` de lutas) ou exibe um placeholder "Nenhuma luta nesta chave." — **decisão**: exibir texto "Nenhuma luta nesta chave." se a chave existir mas `lutas.length === 0`. (Edge case improvável, mas coberto para completude.)
- Clique em uma chave já expandida — a chave fecha (toggle).
- Clique em outra chave enquanto uma está expandida — a anterior fecha automaticamente e a nova abre.
- Teclado: `Tab` para focar no cabeçalho da chave, `Enter` ou `Space` para alternar expansão (`UnstyledButton` já tem suporte nativo).
- Múltiplas chaves visíveis — usuário expande/contrai independentemente; no máximo 1 expandida por vez (acordeão).

---

## 4. Requisitos Funcionais

- [ ] RF-01: a aba "Lutas" (`<Tabs.Tab value="lutas">` na lista e `<Tabs.Panel value="lutas">`) é **completamente removida** de `src/pages/Resultados.tsx`. Após a remoção, a página tem 5 abas: Visão Geral, Chaves, Lutas Casadas, Equipes, Árbitros, Atletas.
- [ ] RF-02: o componente `<Tabs>` mantém o `defaultValue="overview"` (aba padrão continua sendo "Visão Geral").
- [ ] RF-03: na aba "Chaves", cada chave é renderizada em um `<Card>` (mesmo padrão visual do ciclo anterior) com **cabeçalho clicável** envolvendo o `<Group>` existente (categoria+info à esquerda, status+vencedor à direita).
- [ ] RF-04: o cabeçalho clicável é um `<UnstyledButton>` do Mantine com `onClick` que alterna `expandedChaveId` entre `chave.id` e `null` (toggle). `aria-expanded` reflete o estado atual; `aria-controls` aponta para o id do `<Collapse>` correspondente.
- [ ] RF-05: à direita do cabeçalho, adiciona-se um `<IconChevronDown>` (Tabler) que rotaciona 180° quando `isExpanded === true`, com `transition: transform 0.2s ease` aplicada via `style` inline.
- [ ] RF-06: o corpo do Card (a `<Stack>` com os `LutaResumoCard` de cada luta) fica envolto em `<Collapse in={isExpanded}>` do Mantine. Quando `isExpanded === false`, o corpo está oculto; quando `true`, está visível com animação padrão do Mantine (slide vertical).
- [ ] RF-07: o `<Divider>` que separava cabeçalho do corpo passa a ser renderizado apenas quando `isExpanded === true` (evita um divisor solto no card quando a chave está fechada).
- [ ] RF-08: comportamento acordeão — apenas uma chave expandida por vez. Expandir B enquanto A está aberta fecha A automaticamente (substitui `expandedChaveId` em vez de acumular).
- [ ] RF-09: a estrutura interna de cada `LutaResumoCard` (props, layout) permanece **idêntica** à versão atual da aba "Chaves" — sem mudança no componente.
- [ ] RF-10: ao expandir uma chave, o `LutaResumoCard` de cada luta já é renderizado (não há lazy load); a performance é garantida pelo `<Collapse>` que só monta o conteúdo quando necessário — **a confirmar** se isso se aplica (Mantine `Collapse` renderiza os filhos sempre, só anima visibilidade; para muitas lutas isso pode ser otimizado no futuro com `keepMounted={false}`).
- [ ] RF-11: código morto é removido: estados `busca` e `expandedId`, memos `todasLutasFinalizadas`, `todasLutasDetalhadas`, `lutasFiltradas`, `useEffect` de reset, imports `TextInput`/`ActionIcon`/`IconSearch`/`IconX`/`Fragment` (do React). Cada remoção é feita sob confirmação visual no diff.
- [ ] RF-12: novo estado `expandedChaveId: string | null` é adicionado no topo do componente `Resultados`, após os estados de UI existentes (substitui o `expandedId` antigo, com nome mais descritivo).
- [ ] RF-13: novo import `Collapse` e `UnstyledButton` de `@mantine/core`; novo import `IconChevronDown` de `@tabler/icons-react`. Outros imports permanecem inalterados.

---

## 5. Requisitos Não-Funcionais

- **Performance:** acordeão com `Collapse` do Mantine (CSS-driven, sem JS de animação). Sem IPC novo. Para chaves com muitas lutas, o conteúdo é renderizado mas fica oculto via CSS — `keepMounted` é `true` por padrão; se necessário no futuro, ajustar para `false`.
- **Segurança:** nenhuma entrada nova do usuário; nenhuma persistência; nenhuma chamada IPC.
- **Acessibilidade:** `<UnstyledButton>` fornece `role="button"`, suporte nativo a `Enter`/`Space`, `aria-expanded` controlado, foco visível herdado do tema. `aria-controls` aponta para o id do `<Collapse>`. O chevron recebe `aria-hidden="true"` (decorativo; o estado é comunicado pelo `aria-expanded` do botão).
- **Compatibilidade:** Electron + React 18 + Mantine 7. Sem mudança de browser-only API.
- **Observabilidade:** nenhuma métrica/log novo.

---

## 6. Análise da Aplicação

- **Arquitetura geral:** renderer React consumindo IPC do main process (já carrega `getActiveTournament`). Esta feature é 100% client-side após o load (mudança de UI).
- **Padrões em uso:**
  - `@mantine/core` (Tabs, Card, Stack, Group, Badge, Text, Divider, Collapse, UnstyledButton, ActionIcon).
  - `useState` para estado local de UI.
  - `useMemo` para memoização (já há 4 memos: `atletas`, `chaves`, `chavesEncerradas`, `medalhasPorEquipe`, `lutasPorArbitro`).
  - Ícones: `@tabler/icons-react` (já há vários; adicionar `IconChevronDown`).
- **Fluxo de dados:** o `getActiveTournament` (useEffect) carrega `torneio` uma única vez. `chaves` (memo) é o array de chaves. Esta spec:
  - Adiciona `useState<string | null> expandedChaveId` para controlar qual chave está expandida.
  - Remove `todasLutasFinalizadas`, `todasLutasDetalhadas`, `lutasFiltradas` (não usados após remover a aba "Lutas").
  - Remove `busca`, `expandedId` (não usados após remover a aba "Lutas").
  - Remove o `useEffect(() => setExpandedId(null), [busca])` (não usado).
- **Contratos de API:** **inalterados**. Nenhum IPC novo.

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---|---|---|
| `src/pages/Resultados.tsx` | Modificar | (1) Remover aba "Lutas" completamente; (2) reformular aba "Chaves" como acordeão; (3) limpar código morto (estados, memos, imports). |
| `spec/resultados-chaves-acordeao.md` | Criar | Esta especificação. |
| `doc/spec.md` | Modificar | Mover os 2 itens `[aberto]` para **Histórico de Correções** após implementação; adicionar entrada consolidada. |

> ⚠️ Nenhum outro arquivo precisa ser tocado. `LutaResumoCard` é reutilizado sem mudança. A aba "Lutas Casadas" (que também usa `LutaResumoCard`) segue intacta.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- **`<Tabs.Tab>` removal:** ao remover o `<Tabs.Tab value="lutas">` da `<Tabs.List>`, o índice visual das abas muda. Como a aba "Chaves" já existia antes da "Lutas Casadas" e "Equipes" e "Árbitros" e "Atletas", a ordem final fica: Visão Geral · Chaves · Lutas Casadas · Equipes · Árbitros · Atletas (5 abas visíveis para o usuário, na ordem do `defaultValue`).
- **`<UnstyledButton>` dentro de `<Card>`:** ambos são elementos de bloco; o `UnstyledButton` envolve o `<Group>` e ocupa `width: 100%` para garantir área de clique ampla. O `Card` permanece visualmente idêntico.
- **`<Collapse>` com `Divider`:** o `<Divider>` é renderizado condicionalmente dentro do `<Collapse>`, fora do `in` (sempre que renderizado junto com o corpo). Decisão: usar `{isExpanded && <Divider mb="sm" />}` para simplicidade, evitando reflow do `<Collapse>`.
- **Chevron rotativo:** `<IconChevronDown>` com `style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}`. Animação CSS pura, sem JS.
- **Acessibilidade do chevron:** o chevron é decorativo; o estado é comunicado por `aria-expanded` no botão. Decisão: `aria-hidden="true"` no chevron.
- **Reuso de `LutaResumoCard`:** o componente continua sendo usado nas abas "Chaves" (corpo do acordeão) e "Lutas Casadas" (lista plana). Nenhuma mudança no componente.

### 8.2 Ambiguidades nos Requisitos

- **"Manter como está" (Feature original do usuário):** o usuário disse "Na aba chaves mantenha cmo esta". Decisão: preservar **o visual do cabeçalho** (categoria, info, status, vencedor), mas mudar o **comportamento** de exibição das lutas (acordeão). O cabeçalho em si não muda visualmente; o que muda é que ele vira clicável e ganha um chevron.
- **Acordeão vs múltiplas chaves abertas:** "acordeão" tecnicamente significa uma seção aberta por vez. Decisão: acordeão (apenas 1 expandida) — mais limpo e consistente com a remoção da aba "Lutas" (reduz confusão visual).
- **Chave sem lutas válidas:** edge case improvável (chave gerada mas todas as lutas em `tbd`/`bye`/`pending`). Decisão: renderizar a chave normalmente; o `<Collapse>` mostra o corpo vazio (sem `LutaResumoCard`). Não adiciono placeholder explícito — é improvável e o `Collapse` fechado já indica "conteúdo não visível".
- **Busca de atleta:** a busca da aba "Lutas" removida é perdida. Decisão: aceitar — a organização por chave substitui; o usuário pode abrir a chave da categoria do atleta e procurar manualmente. (Decisão consciente: não manter busca em outro lugar.)
- **Lembrar estado de expansão ao navegar para outra rota:** o estado `expandedChaveId` é local ao componente. Se o usuário sair de `/admin/resultados` e voltar, a expansão é resetada para `null`. Decisão: aceitar — é o comportamento padrão de `useState` e consistente com outras telas do app.

### 8.3 Riscos

- **Risco baixo.** Mudança é isolada em `src/pages/Resultados.tsx`. Nenhuma regra de negócio removida (apenas a aba "Lutas" some, junto com o que era específico dela). Nenhum IPC novo. Nenhuma migração de dados.
- **Regressão potencial:** se a remoção da aba "Lutas" quebrar links ou expectativas de outros lugares, é necessário revisar. Mas `Resultados.tsx` é auto-contido (sem export da aba) — sem risco externo.
- **Performance do acordeão com muitas lutas:** para chaves grandes (16 atletas → 15 lutas), renderizar todas de uma vez pode pesar. Mitigação futura: usar `keepMounted={false}` no `<Collapse>` (a confirmar se vale o trade-off de remontagem a cada expansão).
- **Linter com `--max-warnings 0`:** imports não usados após a limpeza vão falhar o lint. Mitigação: garantir que `Fragment`, `TextInput`, `ActionIcon`, `IconSearch`, `IconX` são removidos dos imports junto com o código que os usava.

> ⚠️ Nenhum impedimento bloqueante.

---

## 9. Critérios de Aceite

- [ ] CA-01: dado que o usuário abre `/admin/resultados`, quando a página carrega, então a aba padrão é "Visão Geral" e o menu de abas exibe **5 abas**: Visão Geral · Chaves · Lutas Casadas · Equipes · Árbitros · Atletas. A aba "Lutas" **não aparece** nem no menu nem no conteúdo.
- [ ] CA-02: dado que a aba "Chaves" tem 3 chaves, quando o usuário abre a aba "Chaves", então cada chave é renderizada como um `Card` com cabeçalho visível (categoria, info, status, vencedor) e **sem o corpo expandido** (lutas não visíveis). Um chevron apontando para baixo (`▼`) aparece à direita do cabeçalho.
- [ ] CA-03: dado que o usuário clica no cabeçalho de uma chave, quando o clique é processado, então a chave expande (animação slide vertical) mostrando a lista de `LutaResumoCard` de cada luta. O chevron rotaciona 180° (`▲`). O `aria-expanded` do botão vira `"true"`.
- [ ] CA-04: dado que o usuário clica novamente na mesma chave já expandida, quando o clique é processado, então a chave fecha (animação reversa). O chevron volta à posição original (`▼`). O `aria-expanded` vira `"false"`.
- [ ] CA-05: dado que a chave A está expandida e o usuário clica no cabeçalho da chave B, quando o clique é processado, então **A fecha automaticamente** e B abre (acordeão). Apenas uma chave expandida por vez.
- [ ] CA-06: dado que uma chave está expandida, quando o usuário navega com `Tab` para o cabeçalho de outra chave e pressiona `Enter` ou `Space`, então o cabeçalho focado aciona o mesmo toggle (a11y).
- [ ] CA-07: dado que o usuário redimensiona a janela para <700px, os Cards continuam responsivos (`wrap="wrap"` no Group do cabeçalho) e o acordeão continua funcional.
- [ ] CA-08: dado que o código está limpo, quando rodamos `npx tsc --noEmit`, então 0 erros. Quando rodamos `npm run lint`, então 0 warnings novos (apenas os 3 erros pré-existentes em `PageLayout.tsx`/`PlacarBracket.tsx`).
- [ ] CA-09: dado que o código foi limpo, quando buscamos `busca`/`expandedId`/`todasLutasDetalhadas`/`lutasFiltradas`/`Fragment`/`IconSearch`/`IconX`/`TextInput`/`ActionIcon` no arquivo, então **nenhuma referência** é encontrada (código morto eliminado).
- [ ] CA-10: dado que o `doc/spec.md` foi atualizado, quando rodamos `grep "aberto" doc/spec.md`, então a única ocorrência é no template de comentário (linha 11) — nenhum item `[aberto]` pendente.

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Criar novo estado expandedChaveId
  - O que fazer: substituir `useState<string | null>(null) expandedId` por `useState<string | null>(null) expandedChaveId`. Remover `useState<string>('') busca`.
  - Arquivo: src/pages/Resultados.tsx (linha ~302)
  - Como validar: tsc passa.

Passo 2: Remover memos e useEffect da aba Lutas
  - O que fazer: remover `todasLutasFinalizadas`, `todasLutasDetalhadas`, `lutasFiltradas` e o `useEffect(() => setExpandedId(null), [busca])`.
  - Arquivo: src/pages/Resultados.tsx (linhas ~380-454)
  - Como validar: tsc passa (pode dar erro de variável não usada em `Fragment`; resolver no Passo 3).

Passo 3: Atualizar imports
  - O que fazer: remover `TextInput`, `ActionIcon`, `IconSearch`, `IconX` de @mantine/core/@tabler; remover `Fragment` de react. Adicionar `Collapse` e `UnstyledButton` de @mantine/core; adicionar `IconChevronDown` de @tabler.
  - Arquivo: src/pages/Resultados.tsx (linhas 1-28)
  - Como validar: lint passa sem warning de import não usado.

Passo 4: Remover aba Lutas do menu e do conteúdo
  - O que fazer: remover `<Tabs.Tab value="lutas">` da `<Tabs.List>` e o `<Tabs.Panel value="lutas">` inteiro.
  - Arquivo: src/pages/Resultados.tsx (linhas ~449 e ~585-748)
  - Como validar: tsc + lint passam; abrir a página e ver apenas 5 abas.

Passo 5: Reformular aba Chaves como acordeão
  - O que fazer: envolver o `<Group>` do cabeçalho em `<UnstyledButton>` com onClick que alterna expandedChaveId. Adicionar `<IconChevronDown>` rotativo. Envolver a `<Stack>` de lutas em `<Collapse in={isExpanded}>`. Renderizar o `<Divider>` apenas quando expandido.
  - Arquivo: src/pages/Resultados.tsx (linhas ~750-820)
  - Como validar: abrir /admin/resultados → Chaves, clicar nos cards, ver expansão e chevron rotativo.

Passo 6: Validar com lint e tsc
  - O que fazer: rodar npm run lint e npx tsc --noEmit. Garantir 0 erros e 0 warnings novos.
  - Como validar: tsc e lint OK.

Passo 7: Atualizar doc/spec.md
  - O que fazer: remover os 2 itens [aberto] da seção Problemas Encontrados. Adicionar entrada consolidada no Histórico de Correções referenciando esta spec e o que foi feito.
  - Arquivo: doc/spec.md (linhas 16-22 e 21-23)
  - Como validar: grep "aberto" retorna apenas o template.
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto (mudança isolada em renderer; sem migração).
- **Como monitorar:** visualmente em `npm run dev` — abrir Resultados, verificar que a aba "Lutas" sumiu, abrir Chaves, clicar em cada card e ver o acordeão funcionar.
- **Plano de rollback:** `git revert` do commit desta feature.

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os 10 CA verificados manualmente em dev.
- [ ] `npx tsc --noEmit` e `npm run lint` passam (0 erros, 0 warnings novos).
- [ ] A aba "Lutas" foi completamente removida (código JSX, estados, memos, imports).
- [ ] A aba "Chaves" funciona como acordeão com chevron rotativo.
- [ ] As outras 4 abas (Visão Geral, Lutas Casadas, Equipes, Árbitros, Atletas) seguem intactas.
- [ ] Nenhum item `[aberto]` pendente em `doc/spec.md` (movidos para Histórico de Correções).
- [ ] `doc/spec.md` (Histórico de Correções) atualizado com entrada consolidada referenciando esta spec.

---

## Checklist Rápido

- [x] Itens em "Problemas Encontrados" lidos — **2 `[aberto]` encontrados** (remover aba Lutas + Chaves em acordeão).
- [x] Documentos de referência lidos (`doc/requisitos.md` §3.23, código-fonte, 3 specs anteriores).
- [x] História de usuário e objetivo claros.
- [x] Arquivos envolvidos identificados e lidos.
- [x] Problemas e impedimentos listados (remoção de código morto, a11y do chevron, sem busca).
- [x] Plano de implementação em ordem lógica.
- [x] Critérios de aceite verificáveis (10 CA).
- [x] Incertezas sinalizadas explicitamente (decisões em 8.2).
