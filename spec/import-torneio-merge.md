# Importação de Torneio com Merge por `updatedAt`

> Spec para o item `[aberto]` de `doc/spec.md`:
> *"import de torneio, deveria fazer merge nas informações caso o id do torneio seja o mesmo, exemplo, eu adicionei um atleta 10h50 e ele não existe nos outros JSON, então quando juntar tudo em uma maquina, esse atleta tem que permanecer, a data da ultima atualização vai ser importante, pois caso em um arquivo ele tenha sido adicionado as 10h50 e em outro arquivo ele foi deletado as 10h51, a informação de delete deve ser a que manda."*

---

## 1. Contexto e Objetivo

- **O que é:** refatorar o handler `import-tournament` (e remover `import-tournament-overwrite`) para que, quando o `id` do torneio importado já existir no diretório, o sistema faça **merge por sub-array** (`atletas`, `arbitros`, `areas`, `chaves`, `lutasCasadas`) usando a regra **last-write-wins** baseada em `updatedAt` — em que o item deletado mais recentemente vence sobre o item ativo mais antigo, exatamente como o usuário descreveu.
- **Por que existe:** o cenário real é importar o mesmo torneio a partir de várias máquinas (ou de vários backups JSON). Hoje o `import-tournament` apenas cria novo torneio; quando o `id` já existe, exige um "overwrite" destrutivo via `import-tournament-overwrite` que apaga tudo do disco e reescreve do zero, **perdendo** qualquer mudança local que não esteja no arquivo importado. O resultado é perda silenciosa de dados (atletas cadastrados em uma máquina que não estão no JSON da outra).
- **Quem usa:** organizador que mantém o torneio em mais de uma máquina (ex.: mesa 1 e mesa 2 do mesmo evento, ou赛前 vs. dia do evento) e sincroniza via JSON.
- **Escopo:**
  - **Dentro:** `electron/tournament.ts` (lógica de merge); `electron/preload.ts`; `src/types/electron.d.ts`; `src/pages/ImportarTorneio.tsx` (remoção do modal destrutivo + notificação com resumo do merge); `doc/requisitos.md`; `doc/spec.md`.
  - **Fora:** sync automático em background / watcher de pasta; UI de diff ("o que mudou"); resolução de conflito manual; tratamento de `chaves` que referenciam atletas que foram merge-deletados (regra: se a chave referencia um atleta deletado, a chave permanece — é o mesmo comportamento atual, o sistema não faz cascade).

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): 12 seções padrão.
- **Documento de requisitos** (`doc/requisitos.md`): seção **3.3 Importação de Torneio** (linhas 75-87) descreve o comportamento atual que será substituído.
- **Documentação técnica existente:**
  - `spec/soft-delete-atleta-arbitro-area.md` — define o campo `deletedAt: string | null` em `Atleta`, `Arbitro`, `AreaLuta` (consumido aqui para a regra "delete recente vence").
  - `electron/athletes.ts`, `electron/referees.ts`, `electron/areas.ts` — implementam o soft delete com `updatedAt = new Date().toISOString()` simultaneamente a `deletedAt`, ou seja, o `updatedAt` é a "última mudança" efetiva, seja ela update ou delete.
- **Código-fonte relevante lido:**
  - `electron/tournament.ts:97-136` — `import-tournament` atual: dedup, re-gera `id`/`createdAt`/`updatedAt`/`deletedAt` para TODOS os atletas, força `createdAt: now`/`updatedAt: now`. Destrutivo.
  - `electron/tournament.ts:138-172` — `import-tournament-overwrite` atual: dedup idêntico, sobrescreve o JSON inteiro.
  - `electron/athletes.ts:91-106` (`deleteAthlete`) — seta `deletedAt = now` E `updatedAt = now` simultaneamente. Confirma que `updatedAt` é a referência de "last write" mesmo em deletes.
  - `electron/athletes.ts:128-143` (`restoreAthlete`) — seta `deletedAt = null` E `updatedAt = now`. Confirma que restore também é uma "last write" que vence um delete anterior.
  - `src/pages/ImportarTorneio.tsx:71-77` — UI atual detecta `{ exists: true }` e abre modal de overwrite. Esse caminho deixa de existir.
  - `src/types/electron.d.ts:27-28` — assinatura atual: `importTournament(data: Torneio) => Promise<{ success: boolean; exists?: boolean }>`. Será alterada para incluir o resumo do merge.

---

## 3. História de Usuário

```
Como organizador que mantém o mesmo torneio aberto em duas máquinas,
quero importar um JSON de torneio e, quando o id do torneio já existe localmente,
quero que o sistema una as duas versões mantendo os itens mais recentes de cada lado
(atleta que só existe na máquina A permanece, atleta deletado na máquina B às 10h51
prevalece sobre a versão ativa da máquina A de 10h50),
para que eu não perca trabalho e consiga sincronizar depois de um evento.
```

Cenários alternativos:
- **id não existe no disco** (novo torneio): comportamento atual preservado — cria o torneio com os dados do JSON.
- **id existe, sem sobreposição de sub-itens**: merge é trivial — itens da direita que não existem à esquerda são adicionados; itens da esquerda que não existem à direita permanecem.
- **id existe, com sobreposição parcial**: o item com `updatedAt` mais recente vence. O `updatedAt` mais recente é uma string ISO 8601 — comparação direta de string funciona (`'2026-06-05T10:51:00.000Z' > '2026-06-05T10:50:00.000Z'`).
- **id existe, item deletado em uma máquina e ativo em outra**: o delete é uma "last write" (porque `updatedAt` é setado no momento do delete) e vence.
- **id existe, item restaurado em uma máquina e deletado em outra**: o restore também é uma "last write" e vence sobre o delete.
- **JSON importado é totalmente diferente** (mesmo id, dados sem relação): merge aplica last-write-wins item a item, preservando tudo; o resultado é a união das duas histórias.
- **atletas/arbitros/areas com `id` ausente no JSON**: precisam ter `id` gerado (mantido do comportamento atual). Itens sem `updatedAt` recebem `updatedAt`/`createdAt` igual ao `now` da importação (auto-fix).

---

## 4. Requisitos Funcionais

### Identidade e merge
- [ ] **RF-01:** o handler `import-tournament` lê o JSON importado e, se o `id` do torneio ainda não existir no diretório, cria o torneio no disco usando os dados do JSON, **preservando** os campos `id`, `createdAt`, `updatedAt`, `startedAt` e os `id`/`updatedAt`/`deletedAt` de cada sub-item (atleta, árbitro, área, chave, luta casada) — diferentemente do comportamento atual que regenera `id` e zera `createdAt`/`updatedAt`. Se um sub-item chegar sem `id`, o sistema gera `crypto.randomUUID()`. Se chegar sem `updatedAt`/`createdAt`, o sistema usa o `now` da importação (auto-fix em ambos os caminhos, novo e merge, para manter compatibilidade com JSONs legados).
- [ ] **RF-02:** se o `id` do torneio já existir no disco, o sistema faz merge dos sub-arrays `atletas`, `arbitros`, `areas`, `chaves` e `lutasCasadas` item a item, identificando o item por `id`. A regra é **last-write-wins por `updatedAt`**: para cada `id` presente em qualquer um dos lados, o item com `updatedAt` mais recente substitui o mais antigo. Itens presentes em um único lado são preservados. A string `updatedAt` é ISO 8601 — comparação lexicográfica é equivalente a comparação cronológica.
- [ ] **RF-03:** **a informação de delete mais recente vence sobre a versão ativa mais antiga.** Como `delete*`/`restore*` setam `updatedAt = new Date().toISOString()` junto com `deletedAt`, basta comparar `updatedAt`. Resultado: se o `updatedAt` mais recente pertence a um item com `deletedAt != null`, o item fica como deletado no resultado do merge. Se pertence a um item com `deletedAt == null`, o item fica ativo.
- [ ] **RF-04:** o `updatedAt` do torneio mergeado é `max(existing.updatedAt, incoming.updatedAt)`. Os campos `nome` e `data` do torneio seguem o lado com o `updatedAt` mais recente (last-write-wins no nível do torneio).
- [ ] **RF-05:** `startedAt` é preservado de forma não destrutiva: se o torneio existente já tem `startedAt`, ele é mantido (é um registro de evento único); se só o incoming tem, é copiado; se nenhum dos dois tem, fica ausente.

### Normalização e contadores
- [ ] **RF-06:** ao importar (novo ou merge), o backend normaliza `nome`/`equipe` de atletas e árbitros (`trim().toLowerCase()`) e força `deletedAt: null` apenas em atletas/árbitros/áreas recém-criados (que não existiam no disco). Itens que já existem no disco preservam o seu `deletedAt` (que pode ser `null` ou uma ISO string).
- [ ] **RF-07:** o retorno do `import-tournament` é `{ success: true; merged: boolean; created: number; updated: number; kept: number; removed: number }`, onde:
  - `merged: boolean` — `true` se houve colisão de `id` e merge foi executado; `false` se foi um torneio novo.
  - `created` — número de sub-itens (somando `atletas + arbitros + areas + chaves + lutasCasadas`) que foram adicionados (presentes no incoming, ausentes no existing).
  - `updated` — número de sub-itens que existiam em ambos os lados mas foram sobrescritos pelo lado mais recente.
  - `kept` — número de sub-itens que existiam no existing mas não estavam no incoming.
  - `removed` — número de sub-itens que passaram a `deletedAt != null` como resultado do merge (sub-itens que estavam ativos no existing e foram substituídos pela versão deletada do incoming, ou vice-versa, mas o resultado final tem `deletedAt != null`).

### UI
- [ ] **RF-08:** a tela `ImportarTorneio.tsx` deixa de exibir o modal "Sobrescrever Torneio" (que perguntava se o usuário queria descartar o torneio local e reescrever). O caminho de overwrite é removido: `importTournamentOverwrite` deixa de ser chamado pela UI e o handler IPC é removido.
- [ ] **RF-09:** após uma importação bem-sucedida, a UI exibe uma notificação verde com o resumo do merge:
  - torneio novo: `"Torneio importado com sucesso!"`.
  - merge: `"Torneio mesclado: X adicionado(s), Y atualizado(s), Z mantido(s)."` (usa `created`/`updated`/`kept`).
  - se `removed > 0`, uma segunda notificação amarela informa: `"W itens marcados como deletados (delete recente prevaleceu)."`.
- [ ] **RF-10:** o erro de validação de estrutura (`!data.id || !data.data`) continua existindo e exibe notificação vermelha `"Arquivo inválido. Estrutura de torneio não reconhecida."`.

### Compatibilidade
- [ ] **RF-11:** JSONs legados sem o campo `deletedAt` em atletas/árbitros/áreas continuam funcionando (o auto-fix dos handlers `load*` preenche `deletedAt: null` ao carregar, então o merge encontra `updatedAt` mas `deletedAt` ausente é tratado como `null` na hora do merge).
- [ ] **RF-12:** o método `importTournamentOverwrite` no `preload.ts` e o handler IPC `import-tournament-overwrite` no `main.ts` são **removidos** (não apenas deprecados). A tipagem em `src/types/electron.d.ts` é atualizada para refletir a remoção.

---

## 5. Requisitos Não-Funcionais

- **Performance:** `mergeById` itera cada sub-array uma vez com `Map<id, item>` → O(n+m). Volumes esperados: < 1000 atletas, < 100 árbitros, < 20 áreas, < 200 chaves, < 1000 lutas casadas. Total < 5 ms mesmo em volumes grandes.
- **Segurança:** nenhuma exposição adicional. Validação de estrutura mantida.
- **Acessibilidade:** notificações Mantine (`@mantine/notifications`) — padrão já usado no app.
- **Compatibilidade:** Electron 30 + React 18 + Mantine 7. Sem novas dependências.
- **Observabilidade:** contadores (`created`/`updated`/`kept`/`removed`) retornados ao renderer e exibidos em notificação. Útil para o organizador auditar o merge.

---

## 6. Análise da Aplicação

- **Arquitetura geral:** Electron com main process (Node) + renderer (React). Mudanças no main + preload + typings + UI.
- **Padrões em uso:**
  - `loadTorneio` / `saveTorneio` em `electron/tournament.ts:17-23` — leitura/escrita do JSON do torneio. Já está no padrão.
  - `notifications.show({ title, message, color })` do `@mantine/notifications` — feedback padrão.
  - Comparação de `updatedAt` via string ISO 8601 — já usada em `lutasCasadas.ts` e em `brackets.ts` para ordenação implícita.
- **Fluxo de dados:**
  - Renderer faz upload do JSON → `importTournament(parsedData)` → main process lê `existing` (se houver) → aplica `mergeById` em cada sub-array → grava o torneio mergeado no disco → retorna contadores → renderer exibe notificação.
- **Contratos de API:**
  - **Remove:** `import-tournament-overwrite` (handler IPC), `importTournamentOverwrite` (preload + typings).
  - **Altera:** `import-tournament` agora retorna `{ success: true; merged: boolean; created: number; updated: number; kept: number; removed: number }` em vez de `{ success: boolean; exists?: boolean }`.

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/tournament.ts` | Modificar | Adicionar `mergeById<T>`, refatorar `import-tournament` para fazer merge, remover `import-tournament-overwrite` |
| `electron/main.ts` | Modificar | Remover registro do handler `import-tournament-overwrite` |
| `electron/preload.ts` | Modificar | Remover `importTournamentOverwrite`, ajustar tipo de retorno de `importTournament` |
| `src/types/electron.d.ts` | Modificar | Remover `importTournamentOverwrite`, ajustar tipo de retorno |
| `src/pages/ImportarTorneio.tsx` | Modificar | Remover modal de overwrite, usar retorno com contadores, exibir notificação de merge |
| `doc/requisitos.md` | Modificar | Reescrever seção 3.3 (Importação de Torneio) com a nova semântica |
| `doc/spec.md` | Modificar | Mover item `[aberto]` para `[resolvido]`, adicionar entrada no Histórico de Correções |
| `spec/import-torneio-merge.md` | Criar | Este documento |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- **Sub-itens sem `id` no JSON importado:** itens podem chegar sem `id` (atletas importados manualmente, JSONs antigos, etc.). A normalização atual do `import-tournament` gera `crypto.randomUUID()`. No novo fluxo, o item recebe um novo `id` e entra no merge como "novo" (criado). Isso é desejável: evita colisão com itens já existentes no disco.
- **`updatedAt` ausente em sub-itens legados:** tratado pelo auto-fix (`new Date().toISOString()`). Itens sem `updatedAt` viram "agora" e, na prática, sempre vencem o merge — o que é razoável porque estão sendo importados pela primeira vez.
- **Chaves com referências a atletas deletados:** após o merge, uma `chave` pode referenciar atletas que passaram para `deletedAt != null`. O sistema **não** faz cascade (mesmo comportamento atual). A chave permanece com a referência; a UI já trata `loadAthletes` filtrando deletados e mostra o slot como ausente quando o atleta não está na lista ativa. Decisão: não tratar nesta spec (fora de escopo).
- **`chaveIds` em árbitros:** o campo `chaveIds: string[]` em `Arbitro` referencia chaves por `id`. Após o merge, se uma chave for sobrescrita por uma versão com `id` igual mas dados diferentes, `chaveIds` permanece. Se uma chave for removida (não estiver nem no existing nem no incoming), os `chaveIds` que a referenciam ficarão com IDs órfãos — comportamento já presente, fora do escopo.

### 8.2 Ambiguidades nos Requisitos

- **Merge com perda intencional:** se o usuário quer **substituir** (não mesclar) o torneio, hoje ele usaria `import-tournament-overwrite`. Após esta spec, não há mais "substituir". O usuário pode: (a) excluir o torneio via `deleteTournament` e re-importar; (b) aceitar o merge. Decisão: remover o overwrite é a mudança de UX pretendida (merge é não-destrutivo). Se o usuário precisar de overwrite destrutivo, ele deleta antes — documentar no `ImportarTorneio.tsx` ou em `requisitos.md` seria ruído.
- **Resolução de conflito por `updatedAt` do torneio (camada de cima):** se existing e incoming têm o mesmo `id` mas `nome`/`data` diferentes, qual prevalece? Decisão: o lado com `updatedAt` mais recente. Isso evita surpresa (o estado mais recente do torneio é o que vale). Documentado em RF-04.
- **`merged` vs `success`:** o retorno agora carrega `merged: boolean` em vez de `exists?: boolean`. Mantenho `success: true` para indicar sucesso da operação IPC; `merged` indica se houve colisão. UI não precisa mais do `exists` (não há mais decisão "sobrescrever?").

### 8.3 Riscos

- **Regressão de comportamento atual:** usuários que dependiam do overwrite destrutivo (importar para "resetar" o torneio) perdem esse caminho. Mitigação: o caminho continua acessível via `deleteTournament` + re-import. Documentar implicitamente via contadores do merge.
- **Merge silencioso:** se o usuário importa um JSON antigo por engano, o merge é silencioso (atletas do JSON novo que não existem no antigo são preservados). Não há confirmação. Decisão: isso é desejável — o pedido original do usuário é exatamente "fazer merge, não sobrescrever". O nome do modal sumido e a notificação com contadores dão visibilidade suficiente.
- **Concorrência:** se dois `import-tournament` rodarem em paralelo (improvável em Electron desktop), podem ocorrer condições de corrida (read-modify-write não atômico). Fora do escopo: o sistema não tem casos de uso concorrentes.

---

## 9. Critérios de Aceite

- [ ] **CA-01:** dado um torneio `T` no disco com `updatedAt = T1` e o mesmo torneio `T'` no JSON importado com `updatedAt = T2 > T1`, quando o usuário importar o JSON, então o torneio no disco passa a ter `updatedAt = T2` e os sub-itens com `updatedAt > T1` em `T'` sobrescrevem os correspondentes em `T` (last-write-wins).
- [ ] **CA-02:** dado um torneio `T` no disco com um atleta `A` ativo (sem `deletedAt`) e o mesmo torneio `T'` no JSON importado com o atleta `A` marcado como deletado (`deletedAt` setado, `updatedAt` mais recente que o do `T`), quando o usuário importar o JSON, então o atleta `A` no disco passa a ter `deletedAt` não-nulo, e `loadAthletes` deixa de retorná-lo.
- [ ] **CA-03:** dado um torneio `T` no disco com atletas `A1`, `A2` e o JSON importado com apenas `A3`, `A4` (IDs novos), quando o usuário importar o JSON, então `T` no disco passa a conter `A1`, `A2`, `A3`, `A4` (sem perda) e a notificação informa `"2 adicionado(s), 0 atualizado(s), 2 mantido(s)."`.
- [ ] **CA-04:** dado um torneio `T` no disco com `id = X` e o JSON importado com `id = Y` (torneio diferente), quando o usuário importar o JSON, então o sistema cria um novo torneio com `id = Y` sem alterar o torneio `X`.
- [ ] **CA-05:** dado um JSON importado com `id` faltando ou `data` faltando, quando o usuário tentar importar, então a UI exibe notificação vermelha `"Arquivo inválido. Estrutura de torneio não reconhecida."` e o disco não é modificado.
- [ ] **CA-06:** o handler IPC `import-tournament-overwrite` e o método `importTournamentOverwrite` no preload/typings não existem mais (removidos, não apenas deprecados).
- [ ] **CA-07:** a UI `ImportarTorneio.tsx` não exibe mais o modal de "Sobrescrever Torneio"; o botão "Importar" chama `importTournament` diretamente e a notificação de sucesso reflete o resultado do merge.
- [ ] **CA-08:** o retorno de `importTournament` é tipado como `{ success: true; merged: boolean; created: number; updated: number; kept: number; removed: number }` em `electron.d.ts` e em `electron/preload.ts`.
- [ ] **CA-09:** `npx tsc --noEmit` passa sem novos erros.
- [ ] **CA-10:** `doc/spec.md` tem o item `[aberto]` movido para `[resolvido]` e uma entrada nova no Histórico de Correções datada de 2026-06-05; `doc/requisitos.md` seção 3.3 está reescrita refletindo a semântica de merge.

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Adicionar mergeById<T> em electron/tournament.ts
  - O que fazer: criar função genérica `mergeById<T extends { id: string; updatedAt: string }>(existing: T[], incoming: T[]): { merged: T[]; counters: { created: number; updated: number; kept: number; removed: number } }`. Para cada id em `incoming`: se já existe em `existing` e `incomingItem.updatedAt > existingItem.updatedAt`, substituir. Se não existe, adicionar. Ao final, juntar com os itens de `existing` que não estavam em `incoming`.
  - Arquivo(s): electron/tournament.ts
  - Como validar: tsc

Passo 2: Refatorar import-tournament em electron/tournament.ts
  - O que fazer: alterar o handler para:
    a) Validar `data.id` e `data.data` (já faz).
    b) Se NÃO existir torneio com esse id no disco: gravar incoming como novo torneio (preservando ids, updatedAt, deletedAt de sub-itens; auto-fix de id/updatedAt/createdAt ausentes).
    c) Se existir: ler existing; aplicar mergeById em `atletas`, `arbitros`, `areas`, `chaves`, `lutasCasadas`; resolver `nome`/`data`/`updatedAt` do torneio por last-write-wins; preservar `startedAt` se existing já tem; gravar torneio mergeado.
    d) Retornar `{ success: true, merged, created, updated, kept, removed }`.
  - Arquivo(s): electron/tournament.ts
  - Como validar: tsc + (mental) tracing do exemplo "atleta adicionado às 10h50, deletado às 10h51"

Passo 3: Remover import-tournament-overwrite
  - O que fazer: deletar a função e o registro do handler em electron/main.ts; remover o método do preload e a tipagem.
  - Arquivo(s): electron/tournament.ts, electron/main.ts, electron/preload.ts, src/types/electron.d.ts
  - Como validar: tsc + grep `importTournamentOverwrite` deve retornar 0 ocorrências

Passo 4: Atualizar UI ImportarTorneio.tsx
  - O que fazer:
    a) Remover o estado `overwriteData`, o `useDisclosure`, o modal de "Sobrescrever Torneio" e o handler `handleOverwrite`.
    b) Alterar o retorno esperado de `importTournament` para o novo shape.
    c) No `handleImport`, exibir a notificação apropriada baseada em `merged`/`created`/`updated`/`kept`/`removed`.
  - Arquivo(s): src/pages/ImportarTorneio.tsx
  - Como validar: tsc + inspeção visual do código

Passo 5: Validar com tsc e lint
  - O que fazer: rodar `npx tsc --noEmit` e `npm run lint` (ignorando erros pré-existentes não relacionados).
  - Arquivo(s): —
  - Como validar: tsc sem novos erros; lint sem novos erros nos arquivos tocados

Passo 6: Atualizar doc/requisitos.md seção 3.3
  - O que fazer: substituir o conteúdo da seção 3.3 pela nova semântica de merge.
  - Arquivo(s): doc/requisitos.md
  - Como validar: leitura crítica

Passo 7: Atualizar doc/spec.md
  - O que fazer: (a) marcar o item da linha 20 como `[resolvido]`; (b) adicionar entrada no Histórico de Correções datada de 2026-06-05 com o resumo da implementação, o spec referenciado (`spec/import-torneio-merge.md`) e os CAs verificados.
  - Arquivo(s): doc/spec.md
  - Como validar: spec mantém o formato padrão do Histórico
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto. Mudança no `import-tournament` é compatível com todos os JSONs legados (auto-fix trata campos ausentes). O modal de overwrite some — quem usava esse caminho precisa excluir o torneio antes de re-importar (decisão documentada no item 8.2).
- **Como monitorar:** o usuário vê a notificação com os contadores do merge. Se o número de `updated` for muito grande, o usuário percebe que importou um JSON "mais novo" do que o estado local — comportamento desejado.
- **Plano de rollback:** reverter o commit. Como o handler `import-tournament-overwrite` é removido, rollback é seguro (não há cliente chamando-o após a remoção). O overwrite destrutivo antigo volta a estar disponível no rollback.

---

## 12. Definição de Pronto (DoD)

- [x] Todos os critérios CA-01 a CA-10 verificados.
- [x] `npx tsc --noEmit` sem novos erros.
- [x] `npm run lint` sem novos erros nos arquivos alterados (erros pré-existentes em `PageLayout.tsx` e `PlacarBracket.tsx` são de outros ciclos e não serão corrigidos aqui).
- [x] `doc/spec.md` atualizado: item movido para `[resolvido]`; entrada no Histórico de Correções.
- [x] `doc/requisitos.md` seção 3.3 reescrita com a nova semântica de merge.
