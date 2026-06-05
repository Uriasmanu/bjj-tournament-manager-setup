# spec/busca-todas-abas-resultados.md

> Feature: resolver o item `[aberto]` adicionado em `doc/spec.md`:
> **"Adicionar busca em todas as abas de Resultados"**.
>
> Decisões consolidadas (confirmadas pelo usuário):
> 1. **Local:** um input por aba (6 abas × 1 input), dentro de cada `<Tabs.Panel>`.
> 2. **Escopo:** todas as 6 abas recebem busca: Visão Geral, Chaves, Lutas Casadas, Equipes, Árbitros, Atletas.
> 3. **Chaves:** auto-expand da primeira chave com match ao digitar; reset ao limpar.
>
> Referências: ciclo anterior (`spec/historico-lutas-resultados.md`) implementou busca apenas na aba "Lutas" (removida nesta etapa anterior); esta spec restaura e **expande** a funcionalidade para todas as abas.

---

## 1. Contexto e Objetivo

- **O que é:** adicionar um campo de busca (`<TextInput>`) no topo de cada uma das 6 abas de `/admin/resultados`, com lógica de filtro específica por aba, contador opcional, botão de limpar e empty state. Na aba "Chaves", a busca também dispara a expansão automática da primeira chave com match.
- **Por que existe:** o usuário precisa localizar rapidamente atletas, equipes, árbitros, categorias e lutas sem rolar por listas longas. A busca que existia na aba "Lutas" (removida no ciclo anterior) precisa ser restaurada e ampliada — agora como funcionalidade por aba.
- **Quem usa:** organizador/árbitro/operador de mesa que consulta Resultados durante/após o torneio, em `/admin/resultados` → qualquer aba.
- **Escopo:**
  - **Dentro:**
    - Adicionar 6 estados `busca*` (um por aba) em `src/pages/Resultados.tsx`.
    - Adicionar 6 `<TextInput>` no topo dos 6 `<Tabs.Panel>` correspondentes.
    - Lógica de filtro por aba (case-insensitive, `String.includes`).
    - Empty state distinto para "M=0 (sem dados)" e "M>0 e N=0 (filtro sem match)".
    - Na aba "Chaves": `useEffect` que observa `buscaChaves` e define `expandedChaveId` para a primeira chave com match; reset para `null` ao limpar.
    - Reusar o pattern visual do ciclo anterior: `IconSearch` à esquerda, `ActionIcon` com `IconX` à direita (clear button) — mas apenas nas abas onde fizer sentido (listas com nome a filtrar).
  - **Fora:** outras páginas do app, IPC, regras de geração de chaves, persistência, autocomplete, debounce, busca fuzzy.

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): seções 1–12 aplicadas. O item `[aberto]` "Adicionar busca em todas as abas de Resultados" é o ponto de partida.
- **Documento de requisitos** (`doc/requisitos.md`): seção **3.23. Resultados — Tela com Tudo do Torneio** — descreve a página (6 abas após o ciclo do acordeão). Read-only — esta spec mantém esse caráter.
- **Documentação técnica existente:**
  - `spec/historico-lutas-resultados.md` — pattern de busca (TextInput + IconSearch + IconX + empty states + contador) que será reusado.
  - `spec/resultados-chaves-acordeao.md` — spec do ciclo anterior; introduziu o estado `expandedChaveId` que esta spec reusa para auto-expand.
  - `spec/tempo-luta-padrao-ibjjf.md`, `spec/formulario-adicionar-atleta.md` — padrões de doc (12 seções + Checklist Rápido).
- **Código-fonte relevante:**
  - `src/pages/Resultados.tsx` — alvo principal. Já tem o pattern de busca no histórico (apagado na spec do acordeão; será restaurado e multiplicado).
  - `src/types/bracket.ts` — `Chave`, `Luta` (inalterados).
  - `src/types/lutaCasada.ts` — `LutaCasada` (inalterado).
  - `src/types/athlete.ts` — `Atleta` (inalterado).
  - `src/types/referee.ts` — `Arbitro` (inalterado).
  - `src/types/tournament.ts` — `Torneio` (inalterado).
  - `src/utils/format.ts` — `formatarDuracao` (inalterado, não usado nesta spec).

> ⚠️ **Padrão de busca do ciclo anterior (referência):**
> - `<TextInput leftSection={<IconSearch size={16} />} placeholder="..." value={busca} onChange={(e) => setBusca(e.currentTarget.value)} rightSection={busca ? <ActionIcon variant="subtle" color="gray" onClick={() => setBusca('')} aria-label="Limpar busca" size="sm"><IconX size={14} /></ActionIcon> : null} aria-label="..." style={{ flex: 1, maxWidth: 400 }} />`
> - Counter: `<Text size="sm" c="dimmed" fw={600}>Exibindo {filtered.length} de {total} {item}</Text>`
> - Empty state sem match: `<Text c="dimmed" ta="center">Nenhum(a) {item} encontrado(a) para o termo '{busca}'.</Text>` + `<Button variant="default" onClick={() => setBusca('')}>Limpar busca</Button>`
>
> **Esta spec reusa esse pattern em todas as 6 abas** com adaptações de label e texto.

> ⚠️ **Auto-expand Chaves (decisão nova):**
> - O ciclo anterior definiu `expandedChaveId: string | null` para acordeão manual.
> - Esta spec adiciona um `useEffect` que sincroniza `buscaChaves` → `expandedChaveId`:
>   - `buscaChaves` vazia → `setExpandedChaveId(null)` (reset).
>   - `buscaChaves` não vazia → `setExpandedChaveId(firstMatch.id)` (primeira chave com match).
> - **Conflito potencial:** se o usuário clica manualmente em outra chave enquanto a busca está ativa, o `useEffect` **não re-roda** (a busca não mudou), então a escolha manual do usuário é preservada. Quando o usuário digita mais um caractere (mudando a busca), o effect re-roda e sobrescreve. UX aceitável.

> ⚠️ **6 estados separados vs 1 objeto:**
> - Decisão: 6 `useState<string>` separados, não `useState<{overview, chaves, ...}>`.
> - Razão: padrão Mantine/React idiomático, fácil de ler, fácil de debugar. Cada aba é independente (não há cruzamento).

> ⚠️ **Imports a restaurar do ciclo anterior:**
> - `TextInput`, `ActionIcon` (de `@mantine/core`)
> - `IconSearch`, `IconX` (de `@tabler/icons-react`)
> - Esses imports foram removidos na spec do acordeão. Esta spec os restaura.

> ⚠️ **`PlacarDetalhado` permanece** (usado por `LutaResumoCard` em Chaves e Lutas Casadas). Nenhuma mudança nesse componente.

---

## 3. História de Usuário

```
Como organizador/árbitro,
quero buscar por nome de atleta, equipe, árbitro ou categoria em cada aba de Resultados,
para que eu possa localizar rapidamente o item desejado sem rolar por listas longas.
```

**Cenários alternativos (por aba):**

- **Visão Geral:** digito "joão" → a seção "Medalhistas" filtra para mostrar apenas as chaves em que "joão" ganhou 🥇🥈🥉. As métricas do topo (atletas, chaves, etc) permanecem visíveis (não são filtradas).
- **Chaves:** digito "leve" → a lista filtra para chaves cuja categoria contém "leve" OU que tenham lutas com atletas de nome contendo "leve". A primeira chave com match **expande automaticamente**, revelando as lutas. Limpar a busca fecha a chave expandida e mostra todas.
- **Lutas Casadas:** digito "maria" → a lista de `<LutaResumoCard>` filtra para lutas onde "maria" aparece em atleta A ou B.
- **Equipes:** digito "gracie" → a tabela filtra para equipes com nome contendo "gracie".
- **Árbitros:** digito "carlos" → a tabela filtra para árbitros com nome "carlos".
- **Atletas:** digito "ana" → a tabela filtra para atletas com nome "ana".
- **Sem dados na aba:** empty state original preservado (ex.: "Nenhum atleta cadastrado.").
- **Filtro sem match:** empty state novo (ex.: "Nenhuma equipe encontrada para o termo 'xyz'." + botão "Limpar busca").
- **Botão "Limpar busca"** ou **X no input** restaura a lista completa e reseta a expansão (Chaves).

---

## 4. Requisitos Funcionais

- [ ] RF-01: o componente `Resultados` em `src/pages/Resultados.tsx` declara **6 estados** `useState<string>('')` no topo da função, na ordem das abas: `buscaOverview`, `buscaChaves`, `buscaCasadas`, `buscaEquipes`, `buscaArbitros`, `buscaAtletas`.
- [ ] RF-02: cada um dos 6 `<Tabs.Panel>` renderiza um `<TextInput>` no topo (antes do conteúdo da aba), com `IconSearch` à esquerda, `ActionIcon` com `IconX` à direita (aparece quando há texto), `placeholder` e `aria-label` específicos da aba, e `style={{ flex: 1, maxWidth: 400 }}` para alinhar com o pattern do ciclo anterior.
- [ ] RF-03: cada aba exibe um **contador** ao lado do input, formato "Exibindo N de M {item}", onde N = filtrados e M = total. Para a aba Visão Geral, o item é "medalhista(s)" e o total é derivado de `chavesEncerradas.length` (cada chave contribui 1+ medalistas; contagem de medalistas mostrados pode ser aproximada).
- [ ] RF-04: o filtro é case-insensitive via `String.includes` sobre o(s) campo(s) relevante(s) da aba. Termo vazio (`busca.trim() === ''`) → lista completa.
- [ ] RF-05: lógica de filtro por aba:
  - **Visão Geral:** filtra `chavesEncerradas` mantendo apenas chaves em que `getAtletaNome(ouro|prata|bronzes).toLowerCase()` contém o termo.
  - **Chaves:** filtra `chaves` mantendo chaves em que `getCategoriaTitulo(c.categoriaId).toLowerCase()` contém o termo **OU** `chave.lutas.some(l => /* atletaA ou B da luta casa */)`. A função `getAtletaNome` é usada para lookup de nomes.
  - **Lutas Casadas:** filtra `lutasCasadas` mantendo lutas em que `atletaASnapshot.nome` ou `atletaBSnapshot.nome` (lowercase) contém o termo.
  - **Equipes:** filtra as chaves do `Record<string, number>` mantendo apenas nomes que contêm o termo.
  - **Árbitros:** filtra `arbitros` mantendo apenas `a.nome.toLowerCase().includes(termo)`.
  - **Atletas:** filtra `atletas` mantendo apenas `a.nome.toLowerCase().includes(termo)`.
- [ ] RF-06: para cada aba, há **dois empty states** distintos:
  - **M=0 (sem dados):** mantém o texto original (ex.: "Nenhuma chave gerada.", "Nenhum atleta cadastrado.", "Nenhum árbitro cadastrado.", "Nenhuma luta casada cadastrada.", "Nenhuma equipe cadastrada.", "Nenhuma chave encerrada ainda.").
  - **M>0 e N=0 (filtro sem match):** novo texto "Nenhum(a) {item} encontrado(a) para o termo '{busca}'." + `<Button variant="default" onClick={() => setBuscaX('')}>Limpar busca</Button>`.
- [ ] RF-07: na aba "Chaves", adicionar um `useEffect` que:
  - Se `buscaChaves.trim() === ''` → `setExpandedChaveId(null)`.
  - Senão → `setExpandedChaveId(<id da primeira chave filtrada>)`. Se o usuário clicar manualmente em outra chave, o effect não re-roda (a busca não mudou), preservando o clique. Re-tipar redefine o effect.
  - **Dependências:** `[buscaChaves, chaves, atletas]`. **A confirmar** se `atletas` é necessário (é, para o filtro de lutas por nome de atleta).
- [ ] RF-08: a estrutura visual de cada input (TextInput + IconSearch + IconX) é **idêntica** à da busca original (ciclo da aba "Lutas"). Reuso do pattern.
- [ ] RF-09: o input em cada aba fica dentro do `<Tabs.Panel>` correspondente, **acima** do conteúdo filtrado, dentro de um `<Group gap="md" align="center" wrap="wrap" w="100%">` que também contém o counter.
- [ ] RF-10: o counter é oculto quando `M === 0` (empty state original) e visível quando `M > 0`. Quando `M > 0` e `N === 0`, o counter mostra "Exibindo 0 de M" e o empty state de "filtro sem match" é mostrado logo abaixo.
- [ ] RF-11: imports a restaurar em `src/pages/Resultados.tsx`: `TextInput`, `ActionIcon` (de `@mantine/core`); `IconSearch`, `IconX` (de `@tabler/icons-react`).
- [ ] RF-12: nenhum novo memo `useMemo` é necessário para os filtros simples de tabela (Equipes, Árbitros, Atletas) — filtragem inline é eficiente o suficiente (listas pequenas). Para Chaves, Visão Geral e Lutas Casadas, a filtragem acontece inline no `map`. **A confirmar** se a perfomance é OK.
- [ ] RF-13: nenhum `useEffect` novo além do de auto-expand (RF-07).
- [ ] RF-14: nenhum IPC novo, nenhum tipo novo, nenhum arquivo novo além do spec.

---

## 5. Requisitos Não-Funcionais

- **Performance:** cada filtro é O(N) com `String.includes` (N = tamanho da lista). Listas esperadas: <100 atletas, <20 chaves, <50 lutas casadas, <10 equipes, <10 árbitros. Performance trivial.
- **Segurança:** nenhuma entrada nova sensível; sem persistência.
- **Acessibilidade:** cada TextInput tem `aria-label` descritivo (ex.: "Buscar medalhistas por nome de atleta", "Buscar chaves por categoria ou atleta", etc). O `ActionIcon` de limpar tem `aria-label="Limpar busca"`. Foco visível herdado do tema Mantine. Suporte nativo a teclado no input.
- **Compatibilidade:** Electron + React 18 + Mantine 7. Sem mudança de API.
- **Observabilidade:** nenhuma métrica/log novo.

---

## 6. Análise da Aplicação

- **Arquitetura geral:** renderer React consumindo IPC do main process. Esta feature é 100% client-side.
- **Padrões em uso:**
  - `@mantine/core` (Tabs, Card, Stack, Group, Badge, Text, Divider, Collapse, UnstyledButton, ActionIcon, TextInput, Table, Paper, SimpleGrid, Loader, Center, Title, Button).
  - `useState` para estado local de UI.
  - `useMemo` para memoização.
  - `useEffect` para sincronização (auto-expand).
  - Ícones: `@tabler/icons-react` (já há vários; reusar `IconSearch`, `IconX`).
- **Fluxo de dados:** o `getActiveTournament` (useEffect) carrega `torneio` uma única vez. `atletas`, `chaves`, `lutasCasadas`, `arbitros` (memos) alimentam os filtros.
- **Contratos de API:** **inalterados**. Nenhum IPC novo.

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---|---|---|
| `src/pages/Resultados.tsx` | Modificar | (1) Adicionar 6 estados `busca*`; (2) restaurar imports `TextInput`, `ActionIcon`, `IconSearch`, `IconX`; (3) adicionar 6 `<TextInput>` no topo dos 6 `<Tabs.Panel>`; (4) implementar lógica de filtro por aba; (5) adicionar empty states de "filtro sem match"; (6) adicionar `useEffect` de auto-expand na aba Chaves. |
| `spec/busca-todas-abas-resultados.md` | Criar | Esta especificação. |
| `doc/spec.md` | Modificar | Mover o item `[aberto]` "Adicionar busca em todas as abas de Resultados" para **Histórico de Correções**; adicionar entry consolidada referenciando esta spec. |

> ⚠️ Nenhum outro arquivo precisa ser tocado. Nenhum IPC novo. Nenhum tipo novo.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- **Auto-expand vs clique manual na aba Chaves:** o `useEffect` que define `expandedChaveId` pode conflitar com o clique manual do usuário em uma chave diferente. Decisão: o effect re-roda **apenas quando `buscaChaves` muda** (deps do useEffect). Cliques manuais não disparam o effect. Se o usuário clica em B (após o effect ter definido A), o estado vai para B; o effect não re-roda; a escolha manual é preservada. Quando o usuário digita outro caractere, o effect re-roda e redefine para a primeira chave com match do novo termo.
- **Filtro duplo em Chaves (categoria + lutas):** a aba Chaves pode casar tanto por título de categoria quanto por nome de atleta em lutas. Decisão: usar `||` (match em qualquer um) com a função `getAtletaNome(id)` (já existente) para lookup de nome. Performance: O(N × M) onde N = chaves e M = lutas por chave (≤ 16). Trivial.
- **Empty state em Visão Geral:** a aba tem **métricas** (não filtradas) **e** medalhistas (filtrados). Decisão: o input + counter + filtro aplicam-se **apenas aos medalhistas**. As métricas do topo permanecem sempre visíveis. Empty state para medalhistas: "Nenhum medalhista encontrado para o termo '{busca}'."
- **Counter "Exibindo N de M":** para abas simples (Equipes, Árbitros, Atletas), `M` é o tamanho da lista. Para Lutas Casadas, `M` é `lutasCasadas.length`. Para Chaves, `M` é `chaves.length`. Para Visão Geral, `M` é `chavesEncerradas.length` (cada chave tem 1+ medalhistas, mas o counter "Exibindo N de M chaves encerradas" é mais claro).
- **Imports restaurados:** `TextInput`, `ActionIcon`, `IconSearch`, `IconX` foram removidos na spec do acordeão. Esta spec os restaura (mas só para uso em Resultados.tsx, não para uso em outras telas).
- **Reuso de `LutaResumoCard`:** nenhuma mudança no componente. Continua sendo usado em Chaves e Lutas Casadas (Lutas Casadas agora com filtro aplicado antes do map).

### 8.2 Ambiguidades nos Requisitos

- **"Coloque bucar em todas as abas de resultado"** (descrição original do usuário): extremamente breve. Esclarecido com o usuário:
  - **Local:** um input por aba (não global no topo da página).
  - **Escopo:** todas as 6 abas (não só algumas).
  - **Chaves:** auto-expand ao buscar.
- **Visão Geral merece busca?** Decisão: sim, porque tem a seção "Medalhistas" (lista filtrável por nome de atleta). As métricas do topo (atletas, chaves, etc) **não** são filtradas.
- **Debounce?** Não mencionado. Decisão: sem debounce — listas pequenas, filtragem trivial. Pode ser adicionado no futuro se necessário.
- **Busca fuzzy?** Não mencionado. Decisão: substring match via `String.includes` (case-insensitive). Simples, suficiente.
- **Persistência da busca entre navegações?** Não mencionado. Decisão: estado local ao componente, reseta ao sair/voltar para `/admin/resultados`. Consistente com outras telas do app.

### 8.3 Riscos

- **Risco baixo.** Mudança isolada em `src/pages/Resultados.tsx`. Nenhuma regra de negócio. Nenhum IPC. Nenhuma migração.
- **Regressão potencial:** nenhuma — feature é puramente aditiva (campos de busca + lógica de filtro). Listas vazias (M=0) seguem com empty states originais.
- **Performance do filtro em Chaves com muitas chaves/lutas:** trivial (<20 chaves × <16 lutas). Sem risco.
- **Linter com `--max-warnings 0`:** o `useEffect` de auto-expand tem deps `[buscaChaves, chaves, atletas]`. **A confirmar** se o lint reclama de deps (no ciclo anterior, `useEffect` com deps `[busca]` causou warning de exhaustive-deps; refatorado para inline lookup). Se reclamar, refatorar para `setExpandedChaveId` dentro de um `useMemo` que deriva o `expandedChaveId` de `buscaChaves` + chaves filtradas, sem useEffect.

> ⚠️ Nenhum impedimento bloqueante.

---

## 9. Critérios de Aceite

- [ ] CA-01: dado que o usuário abre `/admin/resultados` e seleciona a aba "Visão Geral", quando a aba carrega, então o input "Buscar medalhistas por nome de atleta" aparece **acima** da seção "Medalhistas" (e abaixo das métricas do topo). Métricas do topo permanecem inalteradas pelo filtro.
- [ ] CA-02: dado que o usuário digita "joão" no input da aba Visão Geral, quando o input muda, então a lista de chaves encerradas filtra para mostrar apenas as que têm "joão" como medalhista (🥇🥈🥉). O counter mostra "Exibindo N de M chaves encerradas".
- [ ] CA-03: dado que o usuário abre a aba "Chaves" e digita "leve" no input, quando o filtro aplica, então (a) a lista de chaves filtra para as que contêm "leve" na categoria **ou** "leve" no nome de algum atleta das lutas; (b) **a primeira chave com match expande automaticamente**; (c) o counter atualiza; (d) o cabeçalho da chave expandida mostra chevron rotacionado (▲).
- [ ] CA-04: dado que a aba Chaves tem uma chave expandida por auto-expand e o usuário clica manualmente em outra chave, quando o clique processa, então **a escolha manual do usuário é preservada** (o effect não re-roda). O usuário pode navegar manualmente sem ser sobrescrito.
- [ ] CA-05: dado que o usuário limpa o input da aba Chaves (digitando vazio ou clicando no X), quando o input fica vazio, então `expandedChaveId` é resetado para `null` (todas as chaves fechadas) e a lista completa de chaves volta a ser exibida.
- [ ] CA-06: dado que o usuário digita "maria" no input da aba "Lutas Casadas", quando o filtro aplica, então apenas lutas em que "maria" é atleta A ou B são exibidas. O counter "Exibindo N de M lutas casadas" atualiza.
- [ ] CA-07: dado que o usuário digita "gracie" no input da aba "Equipes", quando o filtro aplica, então a tabela mostra apenas equipes com nome contendo "gracie" (case-insensitive).
- [ ] CA-08: dado que o usuário digita "carlos" no input da aba "Árbitros", quando o filtro aplica, então a tabela mostra apenas árbitros com nome "carlos".
- [ ] CA-09: dado que o usuário digita "ana" no input da aba "Atletas", quando o filtro aplica, então a tabela mostra apenas atletas com nome "ana" (case-insensitive).
- [ ] CA-10: dado que o usuário digita um termo que **não casa** com nenhum item (ex.: "xyz" em qualquer aba), quando o filtro aplica, então o empty state "Nenhum(a) {item} encontrado(a) para o termo 'xyz'." aparece com um botão "Limpar busca" que, ao ser clicado, restaura a lista completa e limpa o input.
- [ ] CA-11: dado que uma aba tem M=0 (ex.: "Atletas" sem cadastro), quando a aba carrega, então o empty state original ("Nenhum atleta cadastrado.") aparece **sem** input de busca visível. **A confirmar** — decisão: o input aparece sempre, mas o empty state original é mostrado sem o botão "Limpar busca".
- [ ] CA-12: dado que o código está limpo, quando rodamos `npx tsc --noEmit`, então 0 erros. Quando rodamos `npm run lint`, então 0 warnings/erros novos (apenas os 3 pré-existentes).
- [ ] CA-13: dado que o `doc/spec.md` foi atualizado, quando rodamos `grep "aberto" doc/spec.md` para itens pendentes, então nenhum item `[aberto]` está pendente (apenas o template em `doc/spec.md:11-15`).

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Restaurar imports
  - O que fazer: readicionar TextInput, ActionIcon em @mantine/core; IconSearch, IconX em @tabler/icons-react.
  - Arquivo: src/pages/Resultados.tsx (linhas 1-30)
  - Como validar: tsc passa sem erro de import ausente.

Passo 2: Adicionar 6 estados de busca
  - O que fazer: declarar 6 useState<string>('') no topo do componente Resultados: buscaOverview, buscaChaves, buscaCasadas, buscaEquipes, buscaArbitros, buscaAtletas.
  - Arquivo: src/pages/Resultados.tsx (linha ~300)
  - Como validar: tsc passa.

Passo 3: Adicionar useEffect de auto-expand
  - O que fazer: useEffect que observa buscaChaves e atualiza expandedChaveId. Deps: [buscaChaves, chaves, atletas].
  - Arquivo: src/pages/Resultados.tsx (linha ~380)
  - Como validar: abrir Chaves, digitar termo, ver chave expandir. Limpar, ver chave fechar.

Passo 4: Adicionar input + counter + empty state na aba Visão Geral
  - O que fazer: input + counter acima do "Medalhistas". Filtro inline no map das chaves. Empty state para "filtro sem match".
  - Arquivo: src/pages/Resultados.tsx (linhas 425-510)
  - Como validar: digitar "joão" e ver medalhistas filtrados.

Passo 5: Adicionar input + counter + empty state na aba Chaves
  - O que fazer: input + counter acima do Stack de chaves. Filtro inline. Lógica: categoria OU atleta das lutas. Empty state para "filtro sem match".
  - Arquivo: src/pages/Resultados.tsx (linhas 510-590)
  - Como validar: digitar "leve" e ver chaves filtradas + auto-expand.

Passo 6: Adicionar input + counter + empty state na aba Lutas Casadas
  - O que fazer: input + counter. Filtro por atletaASnapshot.nome ou atletaBSnapshot.nome. Empty state.
  - Arquivo: src/pages/Resultados.tsx (linhas 590-640)
  - Como validar: digitar "maria" e ver lutas filtradas.

Passo 7: Adicionar input + counter + empty state na aba Equipes
  - O que fazer: input + counter. Filtro por nome de equipe. Empty state.
  - Arquivo: src/pages/Resultados.tsx (linhas 640-700)
  - Como validar: digitar "gracie" e ver equipes filtradas.

Passo 8: Adicionar input + counter + empty state na aba Árbitros
  - O que fazer: input + counter. Filtro por nome de árbitro. Empty state.
  - Arquivo: src/pages/Resultados.tsx (linhas 700-760)
  - Como validar: digitar "carlos" e ver árbitros filtrados.

Passo 9: Adicionar input + counter + empty state na aba Atletas
  - O que fazer: input + counter. Filtro por nome de atleta. Empty state.
  - Arquivo: src/pages/Resultados.tsx (linhas 760-820)
  - Como validar: digitar "ana" e ver atletas filtrados.

Passo 10: Validar com lint e tsc
  - O que fazer: rodar npx tsc --noEmit e npm run lint. Garantir 0 erros e 0 warnings novos.
  - Como validar: tsc e lint OK.

Passo 11: Atualizar doc/spec.md
  - O que fazer: remover o [aberto] "Adicionar busca em todas as abas de Resultados" da seção Problemas Encontrados. Adicionar entry consolidada no Histórico de Correções referenciando esta spec.
  - Arquivo: doc/spec.md
  - Como validar: grep "[aberto]" retorna apenas o template.
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto (mudança isolada em renderer; sem migração).
- **Como monitorar:** visualmente em `npm run dev` — abrir Resultados, navegar por cada aba, testar buscas com match e sem match, testar auto-expand das Chaves, testar clear button.
- **Plano de rollback:** `git revert` do commit desta feature.

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os 13 CA verificados manualmente em dev.
- [ ] `npx tsc --noEmit` e `npm run lint` passam (0 erros, 0 warnings novos).
- [ ] Cada uma das 6 abas tem input de busca funcional.
- [ ] Auto-expand das Chaves funciona; clique manual é preservado.
- [ ] Empty states distintos para M=0 e M>0/N=0.
- [ ] Botão "Limpar busca" presente em todos os empty states de "filtro sem match".
- [ ] Nenhum item `[aberto]` pendente em `doc/spec.md` (movido para Histórico de Correções).
- [ ] `doc/spec.md` (Histórico de Correções) atualizado com entry consolidada referenciando esta spec.

---

## Checklist Rápido

- [x] Itens em "Problemas Encontrados" lidos — **1 `[aberto]` encontrado** (busca em todas as abas).
- [x] Documentos de referência lidos (`doc/requisitos.md` §3.23, código-fonte, 4 specs anteriores).
- [x] Decisões do usuário coletadas (local: por aba; escopo: todas as 6; Chaves: auto-expand).
- [x] História de usuário e objetivo claros.
- [x] Arquivos envolvidos identificados (apenas `Resultados.tsx`).
- [x] Problemas e impedimentos listados (auto-expand vs clique manual, filtro duplo em Chaves, empty states).
- [x] Plano de implementação em ordem lógica (base → topo: imports → estados → effect → 6 abas → validação).
- [x] Critérios de aceite verificáveis (13 CA).
- [x] Incertezas sinalizadas explicitamente (debounce, fuzzy, persistência — todas "não mencionadas pelo usuário, decididas no escopo").
