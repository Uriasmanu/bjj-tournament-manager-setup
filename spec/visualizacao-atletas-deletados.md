# Feature — Alternar Lista de Atletas (Ativos ↔ Deletados) sem trocar a tela

> Origem: item `[aberto]` da seção **Problemas Encontrados** de `doc/spec.md` (linha 16).
> Correção: o toggle de "mostrar deletados" hoje **esconde** o cabeçalho, os botões de ação e os cards do dashboard. Deve apenas **trocar a lista/tabela** renderizada abaixo, mantendo todo o resto da página visível.

---

## 1. Contexto e Objetivo

- **O que é:** corrigir o comportamento do toggle de atletas deletados em `src/pages/AdminAthletes.tsx`. Hoje, ao ligar o `Switch` "Mostrar apenas os deletados", o cabeçalho, os botões de ação (Importar / Exportar / Cadastrar) e os cards do dashboard (Inscritos / Graduações) **somem** — dando a sensação de "trocar de tela". A correção é manter toda a moldura da página (header, ações, dashboard) e fazer **apenas a tabela** mudar de conteúdo.
- **Por que existe:** o item `[aberto]` em `doc/spec.md` (linha 16) registra exatamente esse incômodo. O usuário não quer uma segunda tela para a lixeira; quer a mesma tela com a lista diferente.
- **Quem usa:** o administrador do torneio que precisa consultar, restaurar ou excluir permanentemente atletas que foram removidos por engano, **sem perder o contexto** dos cards, do título e dos botões.
- **Escopo:**
  - **Dentro:** renderização condicional dentro de `src/pages/AdminAthletes.tsx` (remoção dos `!showDeleted && (...)` e `{showDeleted ? '...' : '...'}` no header e nos cards). O estado `showDeleted` e o `Switch` continuam existindo — só o que está ao redor deles muda.
  - **Fora:** handlers IPC (`loadAthletes`, `loadDeletedAthletes`, `restoreAthlete`, `permanentlyDeleteAthlete`, `permanentlyDeleteAthletes`) — já existem e continuam sendo usados. Páginas `AdminArbitros` e `AdminAreas` (que têm o mesmo padrão) **ficam fora de escopo** deste ciclo; podem ser padronizadas em feature posterior.

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): todas as seções deste documento preenchidas conforme o template.
- **Documento de requisitos** (`doc/requisitos.md`): o módulo "Cadastro de Atletas" (linha 25) já documenta o CRUD e o soft-delete (`deletedAt`). O toggle não é mencionado nominalmente, mas a feature de deleção/restauração sim.
- **Documentação técnica existente:** nenhum arquivo prévio em `spec/` — este é o primeiro spec do projeto. A versão anterior desta spec (`spec/visualizacao-atletas-deletados.md`) interpretou o problema como "trocar `Switch` por `Tabs`" — **interpretação errada** confirmada pelo usuário. O `Switch` permanece; o que muda é só o que está escondido ao redor dele.
- **Código-fonte relevante lido:**
  - `src/pages/AdminAthletes.tsx` (679 linhas) — pontos críticos:
    - Linha 58: estado `showDeleted`.
    - Linhas 269 e 272-275: título e subtítulo mudam de texto (deveriam **permanecer** fixos).
    - Linha 286: `!showDeleted && (...)` esconde Importar/Exportar/Cadastrar (deveria **sumir**).
    - Linha 322: `!showDeleted && (...)` esconde os cards Inscritos/Graduações (deveria **sumir**).
    - Linha 423: `!showDeleted && (<Select ...)` esconde o filtro de faixa (deveria **sumir**).
    - Linha 591: `showDeleted && selectedIds.length > 0 && (...)` mostra o botão de exclusão em massa (deveria **permanecer condicional** — só faz sentido na lixeira).
  - `src/components/AthleteTable.tsx` (129 linhas) — não é usado por `AdminAthletes`; unificação fica para ciclo futuro.
  - `src/types/electron.d.ts` (linhas 33, 38-40) — IPC já expõe `loadDeletedAthletes`, `restoreAthlete`, `permanentlyDeleteAthlete`, `permanentlyDeleteAthletes`. **Nenhuma alteração necessária no main process.**
  - `src/types/athlete.ts` (linha 24) — `deletedAt?: string | null` já existe.

> ⚠️ Inferência: o usuário descreveu o problema como "troca de tela em vez de só trocar a lista em baixo". Interpreto "lista em baixo" como a tabela (Table) que renderiza os atletas. A confirmar se o comportamento esperado também se aplica a outras listas eventualmente adicionadas abaixo da tabela (não há nenhuma no momento).

---

## 3. História de Usuário

```
Como administrador do torneio,
quero ligar o "Mostrar apenas os deletados" e ver APENAS a lista/tabela mudar para os atletas deletados,
para que o cabeçalho, os botões de ação e os cards do dashboard continuem visíveis e eu não perca o contexto da página.
```

**Cenários alternativos:**

- Lista de ativos vazia, deletados com itens — o card "Inscritos" mostra `0`, o painel "Graduações" mostra tudo zerado, mas a tabela já reflete a lista de deletados.
- Lixeira vazia — a tabela mostra o estado vazio "Nenhum atleta na lixeira" (comportamento atual já cobre).
- Usuário liga/desliga o toggle várias vezes — os cards e botões **não devem piscar/sumir**; só o conteúdo da tabela e (eventualmente) o botão "Excluir Selecionados" no rodapé mudam.
- Usuário marca itens na lixeira e desliga o toggle — `selectedIds` é resetado.

---

## 4. Requisitos Funcionais

- [ ] **RF-01:** o título e o subtítulo do header permanecem **fixos**, independentemente do estado de `showDeleted`. Texto: "Lista Oficial de Atletas" + "Gerencie inscrições, importe dados e controle os atletas."
- [ ] **RF-02:** os botões **"Importar"**, **"Exportar JSON"** e **"Cadastrar Atleta"** ficam **sempre visíveis** no header, independentemente de `showDeleted`.
- [ ] **RF-03:** o `Switch` "Mostrar apenas os deletados" continua existindo (nome e posição podem ser revisados — ver Pontos a validar), mas **não** esconde mais o que está ao redor.
- [ ] **RF-04:** os cards **"Inscritos"** e **"Graduações (Faixas)"** ficam **sempre visíveis**. O card "Inscritos" continua exibindo `athletes.length` (que será o tamanho da lista atualmente carregada — ativa ou deletada — ver Pontos a validar).
- [ ] **RF-05:** o filtro de faixa (`Select` "Todas as Faixas") **só** aparece quando `showDeleted === false`. Na lixeira, o filtro de faixa não é exibido (comportamento atual mantido).
- [ ] **RF-06:** a tabela renderizada muda de conteúdo conforme `showDeleted`:
  - `showDeleted === false`: tabela de atletas ativos (Nome, Equipe, Faixa, Categoria, Idade, Ações = Editar/Excluir).
  - `showDeleted === true`: tabela de atletas deletados (Nome, Equipe, Faixa, Categoria, Idade, **Deletado em**, Ações = **Restaurar** / **Excluir Permanentemente**), com checkbox de seleção em massa na primeira coluna.
- [ ] **RF-07:** a coluna **"Deletado em"** (`formatDeletedAt(a.deletedAt)`) só aparece na tabela quando `showDeleted === true`.
- [ ] **RF-08:** o botão **"Excluir Selecionados (N)"** no rodapé só aparece quando `showDeleted === true && selectedIds.length > 0` (comportamento atual mantido).
- [ ] **RF-09:** a busca por texto (nome / equipe / categoria) continua funcionando nas duas listas; o placeholder adapta o texto.
- [ ] **RF-10:** ao alternar `showDeleted`, `selectedIds` é resetado (comportamento atual mantido via `loadList`).
- [ ] **RF-11:** estado vazio da lixeira ("Nenhum atleta na lixeira") permanece como está; estado vazio dos ativos permanece como está.

---

## 5. Requisitos Não-Funcionais

- **Performance:** nenhuma requisição extra — a única chamada é `loadList()` via `useEffect([showDeleted])`, igual ao comportamento atual.
- **Segurança:** nenhuma mudança.
- **Acessibilidade:** o `Switch` mantém `aria-label` e rótulo legível; cards e botões permanecem acessíveis em ambos os estados.
- **Compatibilidade:** Mantine v7. Sem novas dependências.
- **Observabilidade:** nenhuma mudança.

---

## 6. Análise da Aplicação

- **Arquitetura:** frontend React + IPC com main process Electron. Estado de UI em `useState`. Persistência em JSON do torneio.
- **Padrões em uso:** `PageLayout` para header + container, `useDisclosure` para modais, `useMemo` para filtros derivados, `useEffect` para carregamento ao mudar dependência. Naming em pt-BR.
- **Fluxo de dados:**
  1. `useEffect([showDeleted])` → `loadList()`
  2. `loadList()` chama IPC `loadAthletes()` ou `loadDeletedAthletes()`
  3. Estado `athletes` é populado; `filteredAthletes` aplica busca + filtro de faixa
  4. Renderização condicional baseada em `showDeleted` (a ser reduzida a **apenas** o que precisa mudar: tabela, colunas da tabela, ações da tabela, botão de bulk, filtro de faixa).
- **Contratos de API:** nenhum endpoint novo.

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---|---|---|
| `src/pages/AdminAthletes.tsx` | Modificar | Remover condicionais `!showDeleted && (...)` e ternários no header/cards. Manter condicionais na **tabela** e em colunas/ações/bulk. |
| `spec/visualizacao-atletas-deletados.md` | Manter (com conteúdo corrigido) | Este documento — é a spec da feature. |
| `doc/spec.md` | Modificar (após implementação) | Mover o item `[aberto]` para **Histórico de Correções** quando validado. |

> ⚠️ Nenhuma alteração em `electron/`, `src/types/` ou `src/components/AthleteTable.tsx`.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- O card "Inscritos" exibe `athletes.length` e o painel "Graduações" usa `faixaCounts` derivado de `athletes`. **Decisão (confirmada com usuário):** `athletes.length` e `faixaCounts` continuam refletindo a lista carregada no momento (consistência com a tabela). Nada a alterar — já é o comportamento atual.

### 8.2 Ambiguidades nos Requisitos

- Botões "Importar / Exportar / Cadastrar" na lixeira: **decisão (confirmada com usuário):** ficam **sempre visíveis**. "Cadastrar Atleta" continua funcionando na lixeira — o atleta é criado como ativo, então aparece na lista de ativos ao desligar o toggle.
- Posição e cor do `Switch`: **decisão (confirmada com usuário):** mover para logo acima da tabela e trocar `color="red"` pelo azul padrão do tema (`color` omitido). Deixa de ser ponto focal e ganha papel secundário.
- Filtro de faixa (`Select`) na lixeira: **decisão:** manter escondido na lixeira (não faz sentido semântico filtrar deletados por faixa no MVP).

### 8.3 Riscos

- Mudança puramente visual/UX; risco funcional baixo.
- Risco de regressão na contagem do card "Inscritos" se o usuário espera que o número sempre reflita atletas ativos. Mitigado pelo esclarecimento acima.

> ⚠️ Nenhum impedimento bloqueante; dois pontos a validar antes de codar.

---

## 9. Critérios de Aceite

- [ ] **CA-01:** ao abrir `/admin/atletas/lista`, o cabeçalho mostra "Lista Oficial de Atletas" + subtítulo, e os botões Importar / Exportar / Cadastrar estão visíveis.
- [ ] **CA-02:** ao ligar o `Switch` "Mostrar apenas os deletados", o cabeçalho **permanece o mesmo** (mesmo título, mesmo subtítulo, mesmos botões visíveis). Apenas a **tabela** muda para a lista de deletados.
- [ ] **CA-03:** os cards "Inscritos" e "Graduações (Faixas)" permanecem visíveis em ambos os estados do toggle. (Ver Pontos a validar sobre o que o número do card reflete.)
- [ ] **CA-04:** a tabela da lixeira exibe a coluna extra "Deletado em" e a coluna de ações com "Restaurar" (verde) e "Excluir Permanentemente" (vermelho).
- [ ] **CA-05:** ao desligar o `Switch`, a tabela volta a mostrar os atletas ativos com as colunas originais (sem "Deletado em", ações = Editar/Excluir).
- [ ] **CA-06:** o filtro de faixa só aparece na aba de ativos; na lixeira o `Select` de faixa fica oculto.
- [ ] **CA-07:** o botão "Excluir Selecionados (N)" só aparece na lixeira quando há itens selecionados.
- [ ] **CA-08:** busca por texto funciona nas duas listas; placeholder adapta o texto.
- [ ] **CA-09:** ao alternar o toggle, `selectedIds` é zerado.
- [ ] **CA-10:** nenhum elemento da página (exceto a tabela, o botão de bulk, o filtro de faixa e a coluna "Deletado em") pisca, esconde ou reaparece ao alternar o toggle.

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Remover condicionais que escondem o header
  - O que fazer: substituir `{showDeleted ? 'Atletas Deletados' : 'Lista Oficial de Atletas'}` por texto fixo "Lista Oficial de Atletas". Idem para o subtítulo. Remover o `!showDeleted && (...)` que envolve os botões Importar/Exportar/Cadastrar.
  - Arquivo(s): src/pages/AdminAthletes.tsx
  - Como validar: alternar o toggle e confirmar que o header não muda.

Passo 2: Remover condicional que esconde os cards do dashboard
  - O que fazer: remover o `!showDeleted && (...)` que envolve o grid dos cards (linha 322).
  - Arquivo(s): src/pages/AdminAthletes.tsx
  - Como validar: alternar o toggle e confirmar que "Inscritos" e "Graduações" continuam visíveis.

Passo 3: Manter filtro de faixa condicional (comportamento atual)
  - O que fazer: manter `!showDeleted && (<Select ...)` no campo de busca.
  - Arquivo(s): src/pages/AdminAthletes.tsx
  - Como validar: filtro aparece só na lista de ativos.

Passo 4: Mover o Switch para logo acima da tabela e mudar a cor
  - O que fazer: remover o `Switch` do header (linha 278-285) e adicioná-lo dentro do bloco "Search + Filter" (linhas 403-433), à direita do `TextInput` de busca. Remover `color="red"` e o `styles` customizado. Manter `size="md"` e o label.
  - Arquivo(s): src/pages/AdminAthletes.tsx
  - Como validar: visual + funcional (toggle continua funcionando; vira papel secundário, não mais ponto focal).

Passo 5: Garantir que selectedIds reseta ao alternar
  - O que fazer: comportamento já existe via `loadList`; revisar que `setSelectedIds([])` é chamado em `loadList` (linha 71).
  - Arquivo(s): src/pages/AdminAthletes.tsx
  - Como validar: marcar itens na lixeira, alternar — selectedIds = [].

Passo 6: Lint + typecheck + revisão manual
  - O que fazer: rodar `npm run lint` e `tsc --noEmit` (ou `npm run build` se build dispara tsc).
  - Arquivo(s): —
  - Como validar: zero warnings, zero erros.

Passo 7: Atualizar doc/spec.md
  - O que fazer: mover o item `[aberto]` (linha 16) para o **Histórico de Correções** com data, descrição da correção e CA atendidos.
  - Arquivo(s): doc/spec.md
  - Como validar: spec.md mantém todos os comentários e estrutura.
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** alteração puramente de UI em build desktop. Sem feature flag.
- **Como monitorar:** feedback do usuário administrador.
- **Plano de rollback:** `git revert` do commit que altera `AdminAthletes.tsx`. Sem migração de dados.

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite (CA-01 a CA-10) verificados manualmente
- [ ] `npm run lint` sem warnings
- [ ] `tsc --noEmit` (ou build) sem erros
- [ ] Item `[aberto]` movido para **Histórico de Correções** em `doc/spec.md`
- [ ] Nenhuma regressão funcional: CRUD de atletas (criar, editar, soft-delete) continua funcionando
- [ ] Restaurar e excluir permanentemente continuam funcionando

---

## Checklist Rápido

- [x] Li os itens em **Problemas Encontrados** e vou tratá-los antes de qualquer código novo
- [x] Li os documentos de referência (spec.md, requisitos.md, IBJJF.md)
- [x] Entendi a história de usuário e o objetivo de negócio (após correção do usuário)
- [x] Identifiquei todos os arquivos envolvidos e os li
- [x] Listei os problemas e impedimentos
- [x] O plano de implementação está em ordem lógica
- [x] Os critérios de aceite são verificáveis
- [x] Sinalizei todas as incertezas explicitamente (contagem do card "Inscritos", ações de botões na lixeira, posição/cor do Switch)
