# Feature — Toggle dinâmico entre Atletas Ativos e Deletados

> Origem: item `[aberto]` da seção **Problemas Encontrados** de `doc/spec.md` (linha 16) — atualizado pelo usuário em 2026-06-06.
> Substituir a atual chamada IPC a cada toggle por uma troca local instantânea entre duas listas pré-carregadas.

---

## 1. Contexto e Objetivo

- **O que é:** tornar o toggle "Mostrar apenas os deletados" em `AdminAthletes` **instantâneo e sem "flash" de loading** — sem chamada IPC e sem desmontar a UI a cada alternância.
- **Por que existe:** o item `[aberto]` em `doc/spec.md` (linha 16) registra que a renderização está "muito lenta": "quando ativo da primeira vez para mostrar os deletados, ele demora para dar uma resposta em tela, quando eu volto a tela inteira vai para load e depois volta. O ideal é algo mais dinâmico". A causa raiz é o `useEffect([showDeleted])` que dispara `loadList()` → `setLoading(true)` → **a página inteira é desmontada e substituída por um `<Loader />`** enquanto o IPC `loadDeletedAthletes`/`loadAthletes` resolve. O `setLoading(false)` só ocorre no `finally` do `try/catch`, então a UI "pisca" toda a cada alternância.
- **Quem usa:** o administrador do torneio que precisa alternar entre ativos e deletados várias vezes durante a operação (consultar, restaurar, excluir permanentemente).
- **Escopo:**
  - **Dentro:** `src/pages/AdminAthletes.tsx` — substituir o `useEffect([showDeleted])` + `setLoading(true)` + IPC único por um carregamento único no `useEffect([])` que busca as duas listas em paralelo, e um toggle 100% local entre elas. Manter a contagem do card "Inscritos" e o painel "Graduações" refletindo a lista atualmente exibida (consistente com a tabela).
  - **Fora:** handlers IPC (`loadAthletes`, `loadDeletedAthletes`, `restoreAthlete`, `permanentlyDeleteAthlete`, `permanentlyDeleteAthlete*s`, `saveAthlete`, `updateAthlete`, `deleteAthlete*s`) — continuam sendo usados, mas com semântica diferente (carregamento único inicial + sincronização local após mutações). Páginas `AdminArbitros` e `AdminAreas` ficam fora de escopo.

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): todas as seções deste documento preenchidas conforme o template.
- **Documento de requisitos** (`doc/requisitos.md`): o módulo "Cadastro de Atletas" (linha 25) já documenta CRUD com atletas armazenados por torneio e o soft-delete. A spec anterior (`spec/visualizacao-atletas-deletados.md`) já tratou o problema de "trocar de tela" (resolvido neste projeto, ver Histórico de Correções). O desempenho do toggle **não** está documentado.
- **Documentação técnica existente:** `spec/visualizacao-atletas-deletados.md` é o spec mais recente e descreve o estado atual. Esta spec é continuação direta (mesma feature, novo foco: performance).
- **Código-fonte relevante lido:**
  - `src/pages/AdminAthletes.tsx` (670 linhas) — pontos críticos:
    - Linha 48: `const [athletes, setAthletes] = useState<Atleta[]>([])` — estado único.
    - Linha 49: `const [loading, setLoading] = useState(true)` — controla o "flash".
    - Linhas 63-77: `loadList()` — `setLoading(true)` + IPC + `setLoading(false)`.
    - Linhas 103-106: `useEffect([showDeleted])` — re-dispara `loadList` a cada toggle.
    - Linhas 242-248: `if (loading) { return <Loader /> }` — **a página inteira é substituída** durante o loading.
    - Linhas 123-131 (`handleRestore`), 165-176 (`handleDeleteConfirm`), 178-189 (`handlePermanentConfirm`), 191-202 (`handleBulkPermanent`), 138-163 (`handleSave`): todos chamam `loadList()` após a mutação para revalidar — também disparam o "flash" em **toda** operação CRUD.
  - `src/types/electron.d.ts` (linhas 32-33) — `loadAthletes` e `loadDeletedAthletes` são IPCs independentes; podem ser chamados em paralelo via `Promise.all`.
  - `src/types/athlete.ts` (linha 24) — `deletedAt?: string | null` distingue ativo de deletado localmente, mas hoje o código confia no endpoint para fazer essa distinção.

> ⚠️ Inferência: a "lentidão" pode ter duas causas combinadas: (a) IPC síncrono que serializa/disk-read no main process, (b) remontagem completa da UI no `if (loading)`. A spec ataca as duas com a mesma solução (carregamento único + toggle local). **A confirmar** se o usuário quer `Promise.all` (carrega as duas listas no mount) ou lazy-load da deletada no primeiro toggle.

---

## 3. História de Usuário

```
Como administrador do torneio,
quero que o toggle "Mostrar apenas os deletados" troque de lista de forma instantânea, sem a tela piscar para um estado de loading,
para que eu possa alternar entre ativos e deletados várias vezes seguidas sem ruído visual e sem atraso perceptível.
```

**Cenários alternativos:**

- Primeira carga da página: ambas as listas (ativos e deletados) são buscadas em paralelo; enquanto carrega, mostra `<Loader />` (estado inicial inevitável).
- Toggle ON→OFF→ON→OFF em sequência: a UI nunca desmonta; apenas o conteúdo da tabela e a contagem dos cards mudam.
- Restaurar um atleta na lixeira: o atleta some da `deletedAthletes` e aparece em `activeAthletes` sem chamar `loadList` — atualização local dos dois estados.
- Excluir permanentemente: some de `deletedAthletes`, sem reload.
- Soft-deletar um atleta ativo: some de `activeAthletes` e aparece em `deletedAthletes` — atualização local dos dois estados.
- Erro no carregamento inicial: `<Loader />` é substituído pela tela de erro (comportamento atual preservado). Toggle subsequente não é afetado (lista já carregada).
- Salvar/editar um atleta: depois do IPC, atualiza localmente o item em `activeAthletes` (e em `deletedAthletes` se aplicável) sem reload.

---

## 4. Requisitos Funcionais

- [ ] **RF-01:** no `useEffect` de mount da página (`useEffect([])`), `loadList` busca **ambas** as listas (`loadAthletes` e `loadDeletedAthletes`) em paralelo via `Promise.all`, e armazena em dois estados: `activeAthletes` e `deletedAthletes`.
- [ ] **RF-02:** `showDeleted` deixa de disparar IPC; alterná-lo é puramente local (sem `setLoading(true)`, sem `useEffect([showDeleted])`).
- [ ] **RF-03:** a lista renderizada na tabela é derivada: `athletes = showDeleted ? deletedAthletes : activeAthletes` (memoizada via `useMemo`).
- [ ] **RF-04:** o card "Inscritos" e o painel "Graduações" continuam exibindo `athletes.length` e `faixaCounts` da lista **atualmente renderizada** (decisão registrada na spec anterior — `active` ou `deleted`, consistente com a tabela).
- [ ] **RF-05:** `selectedIds` continua sendo resetado ao alternar o toggle (comportamento atual preservado).
- [ ] **RF-06:** `handleDelete` (soft) — após IPC `deleteAthlete`, **atualiza localmente** os dois estados: remove de `activeAthletes` e adiciona a `deletedAthletes` (com `deletedAt` setado pelo backend). Sem `loadList`.
- [ ] **RF-07:** `handleDelete` em lote (`deleteAthletes`) — mesma lógica do RF-06 para o array de IDs.
- [ ] **RF-08:** `handleRestore` — após IPC `restoreAthlete`, **atualiza localmente**: remove de `deletedAthletes` e adiciona a `activeAthletes` (com `deletedAt = null`). Sem `loadList`.
- [ ] **RF-09:** `handlePermanent` e `handleBulkPermanent` — após IPC, **remove localmente** de `deletedAthletes`. Sem `loadList`.
- [ ] **RF-10:** `handleSave` (criar/editar) — após IPC `saveAthlete`/`updateAthlete`, **atualiza localmente** o item em `activeAthletes`. Se o atleta sendo salvo estiver em `deletedAthletes` (raro, mas possível se a deleção for desfeita por edição), reflete a mudança também lá. Sem `loadList`.
- [ ] **RF-11:** o estado `loading` continua existindo apenas para o carregamento **inicial**. Após o primeiro `Promise.all` resolver, `loading = false` e permanece `false` — o toggle e as mutações subsequentes não causam loading.
- [ ] **RF-12:** o estado `error` é setado se o `Promise.all` inicial falhar. Erros em mutações pontuais continuam sendo tratados pelos `try/catch` existentes (notificações vermelhas) e não afetam `error` global.
- [ ] **RF-13:** os estados derivados (`filteredAthletes`, `faixaCounts`) continuam funcionando — recalculam automaticamente quando `athletes` muda, e `athletes` muda quando `activeAthletes`/`deletedAthletes` mudam.

---

## 5. Requisitos Não-Funcionais

- **Performance:**
  - Tempo de toggle: **< 16ms** (1 frame) — troca puramente de estado React, sem IPC, sem remontagem.
  - Carregamento inicial: igual ou melhor que o atual (1 IPC paralelo em vez de 1 IPC sequencial).
  - Sem re-renderizações de elementos que não dependem da lista (header, cards, busca, paginação) ao alternar o toggle — apenas a tabela e o conteúdo dos cards mudam.
- **Segurança:** nenhuma mudança.
- **Acessibilidade:** nenhuma mudança — `aria-label`s e navegação por teclado permanecem.
- **Compatibilidade:** React 18 + Mantine 7. Sem novas dependências.
- **Observabilidade:** nenhuma mudança.
- **Consistência:** após qualquer mutação, ambos os estados (`active` e `deleted`) ficam sincronizados localmente — sem janela de inconsistência.

---

## 6. Análise da Aplicação

- **Arquitetura:** frontend React + IPC com main process Electron. Estado de UI em `useState`. Persistência em JSON do torneio.
- **Padrões em uso:** `PageLayout` para header + container, `useDisclosure` para modais, `useMemo` para filtros derivados, `useEffect` para carregamento inicial.
- **Fluxo de dados (proposto):**
  1. `useEffect([])` no mount → `Promise.all([loadAthletes(), loadDeletedAthletes()])`
  2. Estados `activeAthletes` e `deletedAthletes` são populados; `setLoading(false)`
  3. `athletes = showDeleted ? deletedAthletes : activeAthletes` (memoizado)
  4. `filteredAthletes` e `faixaCounts` derivados de `athletes`
  5. Toggle `showDeleted` → apenas re-deriva `athletes`, sem IPC
  6. Mutações (delete, restore, save, permanent) → IPC + atualização local dos estados relevantes
- **Contratos de API:** nenhum endpoint novo. Os dois IPCs existentes (`loadAthletes`, `loadDeletedAthletes`) continuam sendo usados, apenas com semântica de "carregamento único".

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---|---|---|
| `src/pages/AdminAthletes.tsx` | Modificar | Trocar `useState<Atleta[]>(athletes)` por dois estados (`activeAthletes`, `deletedAthletes`); trocar `useEffect([showDeleted])` por `useEffect([])` com `Promise.all`; remover `setLoading(true)` do toggle; adicionar atualização local nos handlers de mutação. |
| `spec/toggle-dinamico-lista-atletas.md` | Criar | Este documento. |
| `doc/spec.md` | Modificar (após implementação) | Mover o item `[aberto]` para o **Histórico de Correções** quando validado. Atualizar a seção **Feature**. |
| `doc/requisitos.md` | Modificar (após implementação) | Atualizar a seção da Lixeira (linha 184) para descrever o novo comportamento. |

> ⚠️ Nenhuma alteração em `electron/`, `src/types/` ou `src/components/AthleteTable.tsx`. As páginas `AdminArbitros` e `AdminAreas` (mesmo padrão) ficam fora de escopo.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- **Carregamento simultâneo vs. lazy:** `Promise.all` no mount carrega as duas listas antes da página ficar interativa. Se `loadDeletedAthletes` for lento, atrasa o primeiro paint. **Proposta:** `Promise.all` no mount (mais simples, suficiente para o volume de atletas de um torneio). **A confirmar com o usuário.**
- **Sincronização local após mutação:** cada handler precisa garantir que ambos os estados fiquem consistentes. Risco de divergência se uma mutação falhar parcialmente. Mitigação: tratar como "best-effort" local; em caso de erro, exibir notificação (já feito) e fazer um reload defensivo (RF-14 abaixo).
- **RF-14 (defensivo):** se uma mutação lançar exceção não tratada, o handler dispara um `loadList` de fallback (recarregando ambas as listas) para garantir consistência.

### 8.2 Ambiguidades nos Requisitos

- **"Algo mais dinâmico":** interpreto como "instantâneo e sem flash". **A confirmar.**
- **Card "Inscritos" e "Graduações":** mantêm o comportamento atual (reflete a lista renderizada, seja ativa ou deletada). **A confirmar.**

### 8.3 Riscos

- Regressão funcional se a atualização local ficar dessincronizada do JSON em disco. Mitigação: RF-14 (fallback de reload) e testes manuais dos fluxos criar/editar/excluir/restaurar.
- Aumento de memória ao manter as duas listas em estado. Para o volume típico de um torneio de BJJ (centenas de atletas), irrelevante.

> ⚠️ Nenhum impedimento bloqueante; 2 pontos a validar antes de codar.

---

## 9. Critérios de Aceite

- [ ] **CA-01:** ao abrir `/admin/atletas/lista`, um único `<Loader />` aparece durante o carregamento inicial; após resolver, a página fica interativa.
- [ ] **CA-02:** ao ligar o toggle "Mostrar apenas os deletados", a tabela troca de conteúdo **instantaneamente** (sem loader, sem flash). O card "Inscritos" e o painel "Graduações" refletem a lista de deletados.
- [ ] **CA-03:** ao desligar o toggle, a tabela volta para os atletas ativos de forma instantânea. Cards voltam aos números dos ativos.
- [ ] **CA-04:** alternar o toggle 5 vezes seguidas em 2 segundos não causa re-fetch (Network tab do DevTools não mostra chamadas `loadAthletes`/`loadDeletedAthletes` após a carga inicial).
- [ ] **CA-05:** restaurar um atleta: o atleta some da tabela de deletados (instantâneo, sem loader) e aparece na lista de ativos ao alternar.
- [ ] **CA-06:** soft-deletar um atleta ativo: o atleta some da tabela de ativos (instantâneo) e aparece na lista de deletados ao alternar.
- [ ] **CA-07:** excluir permanentemente um atleta: o atleta some da tabela de deletados (instantâneo, sem reload).
- [ ] **CA-08:** excluir permanentemente em lote (N>1): os N atletas somem da tabela (instantâneo).
- [ ] **CA-09:** criar/editar um atleta via `AthleteForm`: o atleta aparece/atualiza na tabela de ativos (instantâneo) após o modal fechar.
- [ ] **CA-10:** em caso de erro em uma mutação, notificação vermelha é exibida e os estados permanecem consistentes (sem atletas "fantasma").
- [ ] **CA-11:** o tempo medido de toggle (DevTools Performance: do clique no `Switch` até a nova tabela pintada) é **< 100ms** em hardware modesto.

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Trocar o estado único por dois estados
  - O que fazer: substituir `const [athletes, setAthletes] = useState<Atleta[]>([])` por `const [activeAthletes, setActiveAthletes] = useState<Atleta[]>([])` e `const [deletedAthletes, setDeletedAthletes] = useState<Atleta[]>([])`. Adicionar `const athletes = useMemo(() => showDeleted ? deletedAthletes : activeAthletes, [showDeleted, activeAthletes, deletedAthletes])`.
  - Arquivo(s): src/pages/AdminAthletes.tsx
  - Como validar: typecheck passa.

Passo 2: Carregar ambas as listas no mount
  - O que fazer: trocar `useEffect([showDeleted])` por `useEffect([], ...)`; dentro, fazer `Promise.all([loadAthletes(), loadDeletedAthletes()])` e setar os dois estados. Em caso de erro, `setError(true)`. `setLoading(false)` apenas após o `Promise.all` resolver.
  - Arquivo(s): src/pages/AdminAthletes.tsx
  - Como validar: devtools network mostra 2 IPCs na carga inicial; nenhum IPC após.

Passo 3: Remover setLoading(true) de loadList
  - O que fazer: como `loadList` agora só é chamado no mount, remover `setLoading(true)` e `setError(false)` do início de `loadList` (ou tornar `loadList` um helper de carga única, sem estado de loading). Manter `setLoading(false)` apenas no `finally`.
  - Arquivo(s): src/pages/AdminAthletes.tsx
  - Como validar: toggle não causa mudança em `loading`.

Passo 4: Atualizar handlers de mutação
  - O que fazer: em `handleDelete`, `handleDeleteConfirm`, `handleRestore`, `handlePermanentConfirm`, `handleBulkPermanent`, `handleSave`: substituir `await loadList()` por atualização local dos estados (`setActiveAthletes` / `setDeletedAthletes`).
  - Arquivo(s): src/pages/AdminAthletes.tsx
  - Como validar: cada fluxo (criar, editar, soft-deletar, restaurar, excluir permanente, em lote) atualiza a UI sem reload.

Passo 5: Garantir fallback defensivo
  - O que fazer: no `catch` de cada handler, se o erro for inesperado, disparar reload defensivo das duas listas (RF-14).
  - Arquivo(s): src/pages/AdminAthletes.tsx
  - Como validar: forçar erro e ver consistência.

Passo 6: Lint + typecheck
  - O que fazer: rodar `npm run lint` (esperar 0 warnings/errors novos) e `tsc --noEmit` (esperar 0 erros).
  - Arquivo(s): —
  - Como validar: zero warnings, zero erros.

Passo 7: Verificação manual
  - O que fazer: abrir `/admin/atletas/lista`, alternar o toggle várias vezes, fazer CRUD de um atleta, restaurar e excluir permanentemente. Verificar CA-01 a CA-11.
  - Arquivo(s): —
  - Como validar: comportamento esperado em cada CA.

Passo 8: Atualizar doc/spec.md e doc/requisitos.md
  - O que fazer: mover o item `[aberto]` (linha 16) para o **Histórico de Correções** com data, descrição da correção e CA atendidos. Atualizar `doc/requisitos.md` (linha 184) para descrever o novo comportamento de carregamento.
  - Arquivo(s): doc/spec.md, doc/requisitos.md
  - Como validar: spec.md e requisitos.md refletem o novo comportamento.
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** alteração em build desktop. Sem feature flag.
- **Como monitorar:** feedback do usuário administrador; medição manual de tempo de toggle.
- **Plano de rollback:** `git revert` do commit que altera `AdminAthletes.tsx`. Sem migração de dados.

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite (CA-01 a CA-11) verificados manualmente
- [ ] `npm run lint` sem warnings novos
- [ ] `tsc --noEmit` sem erros
- [ ] Item `[aberto]` movido para **Histórico de Correções** em `doc/spec.md`
- [ ] `doc/requisitos.md` atualizado
- [ ] Nenhuma regressão funcional: CRUD de atletas continua funcionando
- [ ] Tempo de toggle < 100ms (medido)

---

## Checklist Rápido

- [x] Li os itens em **Problemas Encontrados** e vou tratá-los antes de qualquer código novo
- [x] Li os documentos de referência (spec.md, requisitos.md, IBJJF.md) e o spec anterior (`spec/visualizacao-atletas-deletados.md`)
- [x] Entendi a história de usuário e o objetivo de negócio
- [x] Identifiquei todos os arquivos envolvidos e os li
- [x] Listei os problemas e impedimentos
- [x] O plano de implementação está em ordem lógica
- [x] Os critérios de aceite são verificáveis
- [x] Sinalizei todas as incertezas explicitamente (Promise.all no mount vs. lazy, RF-14 fallback)
