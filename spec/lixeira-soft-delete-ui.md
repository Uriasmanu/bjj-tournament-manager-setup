# UI de Lixeira — Visualizar, Restaurar e Excluir Permanentemente

> Spec para o item `[aberto]` de `doc/spec.md`:
> *"Nas listas de atleta, arbitro,area tera um botao de exibir apenas os deletados, e no nome tera o botao de desfazer ou apagar, esse apagar é permanente, aparece uma mensagem no centro da tela perguntando se tem certeza"*

> ⚠️ Esta spec depende do backend de soft delete entregue em `spec/soft-delete-atleta-arbitro-area.md`. Os endpoints `restore-*` e o campo `deletedAt` já existem.

---

## 1. Contexto e Objetivo

- **O que é:** adicionar UI de "lixeira" em `AdminAthletes`, `AdminArbitros` e `AdminAreas`: (a) toggle para alternar entre "ativos" e "deletados"; (b) na view de deletados, ações de **restaurar** e **excluir permanentemente**; (c) modal centralizado de confirmação para exclusão permanente; (d) hard delete (permanente) no backend.
- **Por que existe:** o soft delete sem UI de recuperação torna a feature inútil — o usuário pode soft-deletar mas não consegue desfazer. Este ciclo entrega a interface que completa o ciclo de vida do soft delete.
- **Quem usa:** organizadores que precisam revisar/recuperar itens deletados por engano.
- **Escopo:**
  - **Dentro:** 3 páginas `Admin*` (toggle + view de deletados + ações); 3 handlers de hard delete no backend (`permanentlyDeleteAthlete`/`Arbitro`/`Area`); 3 handlers `loadDeleted*` no backend; exposição via preload + typings; modal de confirmação de exclusão permanente centralizado; `doc/requisitos.md`.
  - **Fora:** mudanças no fluxo de cadastro (a regra de "duplicata contra deletados" será tratada em ciclo separado, se necessário); novas rotas ou menus; histórico de auditoria de quem/restore; expiração automática de soft-deletados.

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): 12 seções padrão.
- **Documento de requisitos** (`doc/requisitos.md`): seções 3.8 (Atletas), 3.17 (Árbitros), 3.18 (Áreas) já documentam soft delete (ciclo anterior). Esta spec complementa com a UI.
- **Documentação técnica existente:** `spec/soft-delete-atleta-arbitro-area.md` — define os endpoints `restore-*` e o campo `deletedAt` consumidos aqui.
- **Código-fonte relevante lido:**
  - `src/pages/AdminAthletes.tsx` — estrutura de página com `loadAthletes`, ações por linha (lápis/lixeira), modal de confirmação, bulk delete, busca.
  - `src/pages/AdminArbitros.tsx` — análogo a AdminAthletes, com bulk delete e modal próprio.
  - `src/pages/AdminAreas.tsx` — análogo, sem bulk delete por linha (apenas checkboxes).
  - `electron/athletes.ts`, `electron/referees.ts`, `electron/areas.ts` — handlers de domínio (soft delete + restore já implementados).

---

## 3. História de Usuário

```
Como organizador,
quero um botão "Mostrar apenas os deletados" na lista de atletas/árbitros/áreas,
para que eu possa revisar e recuperar itens deletados por engano, ou apagá-los de vez.
```

Cenários alternativos:
- Sem itens deletados: view mostra empty state com mensagem "Nenhum item deletado".
- Restaurar item: o item some da lixeira e volta para a lista ativa.
- Excluir permanentemente: modal centralizado pede confirmação; após confirmar, item some para sempre.
- Tentar cadastrar com nome+ano iguais a um item deletado: a UI atual ainda permite (a verificação de duplicata não consulta deletados — melhoria futura fora do escopo).

---

## 4. Requisitos Funcionais

### Toggle
- [ ] RF-01: cada página `Admin*` exibe um controle (Switch ou Button toggle) no header com label **"Mostrar apenas os deletados"** (ou equivalente curto). Estado padrão: `false` (mostrando ativos).
- [ ] RF-02: ao alternar o toggle, a lista recarrega do backend correspondente (`load*` ou `loadDeleted*`) e os botões de ação são trocados (ver RF-04/RF-05).
- [ ] RF-03: na view "deletados", o botão "Cadastrar" some (não faz sentido criar um item já deletado); os botões "Importar"/"Exportar" continuam (Importar nunca traz itens deletados, Exportar exporta apenas ativos por enquanto — ver §8.2).

### View ativos (toggle OFF)
- [ ] RF-04: ações por linha = `[editar, soft-deletar]` (status atual preservado). Modal de confirmação de soft delete permanece, com texto adaptado: **"O item será movido para os deletados. Você poderá restaurá-lo na aba de lixeira."** (substitui o atual "Esta ação não pode ser desfeita").

### View deletados (toggle ON)
- [ ] RF-05: ações por linha = `[restaurar, excluir permanentemente]`. Ícones: `IconRestore` (seta circular) e `IconTrashX` (lixeira com X) do `@tabler/icons-react`. Cores: verde/teal para restaurar, vermelho para permanente.
- [ ] RF-06: o botão "Editar" **não** aparece (itens deletados não são editáveis; para usar o item, restaure primeiro).
- [ ] RF-07: bulk select + bulk **excluir permanentemente** no header, com confirmação.
- [ ] RF-08: ao restaurar um item, a UI mostra notificação verde "Item restaurado com sucesso" e a view recarrega.
- [ ] RF-09: ao excluir permanentemente um item, abre modal centralizado (`Modal centered`) com:
  - Título: **"Excluir Permanentemente"**
  - Mensagem: **"Esta ação é IRREVERSÍVEL. O item <nome> será removido para sempre e não poderá ser restaurado."**
  - Botões: **Cancelar** (outline) | **Excluir Permanentemente** (vermelho, `color="red"`).

### Backend
- [ ] RF-10: nova função `loadDeletedAthletes(torneioId): Atleta[]` retorna apenas itens com `deletedAt != null` (análoga a `loadAthletes`, mas invertendo o filtro).
- [ ] RF-11: `loadDeletedArbitros(torneioId)` e `loadDeletedAreas(torneioId)` análogas.
- [ ] RF-12: nova função `permanentlyDeleteAthlete(torneioId, id)`: remove fisicamente o item do array, atualiza `updatedAt` do torneio.
- [ ] RF-13: `permanentlyDeleteAthletes(torneioId, ids)`: variante em lote.
- [ ] RF-14: `permanentlyDeleteArbitro(torneioId, id)` e `permanentlyDeleteArbitros(torneioId, ids)`: análogas.
- [ ] RF-15: `permanentlyDeleteArea(torneioId, id)` e `permanentlyDeleteAreas(torneioId, ids)`: análogas.
- [ ] RF-16: as 9 novas funções (3 load + 6 perm-delete) são expostas via IPC, preload e typings.

### Export (nota)
- [ ] RF-17: `exportAthletes`/`exportArbitros`/`exportAreas` continuam exportando apenas itens ativos (comportamento atual). Exportar a lixeira está fora do escopo.

---

## 5. Requisitos Não-Funcionais

- **Performance:** `loadDeleted*` itera o array completo; para volumes esperados (< 1000 itens) é negligível.
- **Segurança:** nenhuma exposição adicional de dados sensíveis.
- **Acessibilidade:** `aria-label` em todos os botões de ação; contraste mantido.
- **Compatibilidade:** Electron 30 + Mantine 7 + Tabler icons (já usados). `IconRestore` e `IconTrashX` precisam existir no `@tabler/icons-react@^3.44.0` — verificar no Passo 1 da implementação.
- **Observabilidade:** notificações toast (`@mantine/notifications`) para feedback de sucesso/erro, padrão já usado no app.

---

## 6. Análise da Aplicação

- **Arquitetura geral:** React (Mantine) no renderer + IPC para o main process. Mudanças em ambos.
- **Padrões em uso:**
  - `Modal` centralizado para confirmações (padrão atual).
  - `Switch`/`Button` no header para toggles (padrão atual em outros lugares, ex.: `IconTrophy` na dashboard).
  - `ActionIcon` para ações inline na tabela (padrão atual).
  - `notifications.show(...)` para feedback (padrão atual).
- **Fluxo de dados:** renderer → IPC → função de domínio (carrega `loadTorneio` → filtra → retorna). Persistência via `saveTorneio` (mesmo padrão dos handlers de soft delete).
- **Contratos de API:** 9 novos handlers IPC (3 `load-deleted-*`, 6 `permanently-delete-*`).

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/athletes.ts` | Modificar | Adicionar `loadDeletedAthletes`, `permanentlyDeleteAthlete(s)` |
| `electron/referees.ts` | Modificar | Adicionar `loadDeletedArbitros`, `permanentlyDeleteArbitro(s)` |
| `electron/areas.ts` | Modificar | Adicionar `loadDeletedAreas`, `permanentlyDeleteArea(s)` |
| `electron/main.ts` | Modificar | Registrar 9 novos handlers IPC |
| `electron/preload.ts` | Modificar | Expor 9 novos métodos |
| `src/types/electron.d.ts` | Modificar | Adicionar 9 typings |
| `src/pages/AdminAthletes.tsx` | Modificar | Toggle + view deletados + ações + modal permanente + texto do modal de soft delete |
| `src/pages/AdminArbitros.tsx` | Modificar | Idem |
| `src/pages/AdminAreas.tsx` | Modificar | Idem (sem bulk soft-delete existente — bulk permanente apenas na view deletados) |
| `doc/requisitos.md` | Modificar | Documentar UI de lixeira em 3.8, 3.17, 3.18 |
| `doc/spec.md` | Modificar | Mover item para `[resolvido]`; entrada no Histórico de Correções |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- **Ícones do Tabler:** preciso confirmar que `IconRestore` e `IconTrashX` existem em `@tabler/icons-react@^3.44.0`. Fallback: usar `IconArrowBackUp` (curva de retorno) para restore e `IconTrash` com `color="red"` para permanente. Decisão fica no Passo 1.
- **Bulk permanent delete de árbitros:** a view atual tem bulk select. Ao alternar para "deletados", o bulk select deve reaparecer com bulk permanent delete.

### 8.2 Ambiguidades nos Requisitos
- **Exportar a lixeira:** a spec original não menciona. Decisão: fora do escopo (exporta apenas ativos). Documentado em RF-17.
- **"Apagar permanente" via checkbox em massa:** o item original diz "no nome tera o botao de desfazer ou apagar" — refere-se a ações por linha, não bulk. Decisão: bulk permanent delete **é** incluído porque é um padrão já existente no app (bulk soft delete). É uma adição de UX, não desobediência.
- **Soft-deletar da view de deletados:** sem sentido. Decisão: não permitir (não há botão de soft delete na view deletados — as únicas ações são restaurar e permanente).
- **Reativar duplicata:** se o usuário restaura um atleta que conflita com um atleta ativo de mesmo nome+ano, isso passa silenciosamente. Fora do escopo (pode ser regra futura em ciclo de merge de importados).

### 8.3 Riscos
- Nenhum risco de regressão (apenas adições; comportamento de soft delete existente preservado).
- Risco de UX: se o toggle for confundido com filtro de busca. Mitigação: o toggle fica em destaque no header, com label explícito.

---

## 9. Critérios de Aceite

- [ ] CA-01: em `AdminAthletes`, quando o toggle "Mostrar apenas os deletados" está OFF, a lista mostra atletas ativos com ações `[editar, soft-deletar]`. Quando está ON, mostra apenas atletas com `deletedAt != null` com ações `[restaurar, excluir permanentemente]`.
- [ ] CA-02: ao restaurar um atleta, ele some da lixeira, volta a aparecer na lista ativa e `deletedAt` é `null` no JSON.
- [ ] CA-03: ao clicar "Excluir permanentemente", modal centralizado aparece com aviso em destaque sobre irreversibilidade.
- [ ] CA-04: ao confirmar a exclusão permanente, o atleta é fisicamente removido do JSON do torneio.
- [ ] CA-05: a mesma UI está implementada em `AdminArbitros` e `AdminAreas`.
- [ ] CA-06: o modal de soft delete (view ativos) agora diz "irá para os deletados" em vez de "não pode ser desfeita".
- [ ] CA-07: 9 novos endpoints (`loadDeleted*` × 3 + `permanentlyDelete*` × 6) estão tipados em `electron.d.ts` e expostos em `preload.ts`.

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Verificar ícones disponíveis no Tabler
  - O que fazer: confirmar que IconRestore e IconTrashX existem (ou usar fallbacks).
  - Arquivo(s): —
  - Como validar: ls node_modules/@tabler/icons-react/dist/esm/icons/ | grep -i restore

Passo 2: Adicionar funções de backend
  - O que fazer: implementar loadDeleted* e permanentlyDelete* em athletes.ts, referees.ts, areas.ts.
  - Arquivo(s): electron/athletes.ts, electron/referees.ts, electron/areas.ts
  - Como validar: tsc

Passo 3: Registrar 9 handlers IPC
  - O que fazer: ipcMain.handle para load-deleted-athletes, load-deleted-arbitros, load-deleted-areas, permanently-delete-athlete, permanently-delete-athletes (idem árbitro/área).
  - Arquivo(s): electron/main.ts
  - Como validar: tsc

Passo 4: Expor APIs no preload + typings
  - O que fazer: adicionar 9 métodos em preload.ts e electron.d.ts.
  - Arquivo(s): electron/preload.ts, src/types/electron.d.ts
  - Como validar: tsc

Passo 5: Implementar UI em AdminAthletes
  - O que fazer: adicionar estado `showDeleted`, Switch no header, carregar lista correta, renderizar ações condicionais, modal permanente centralizado, atualizar texto do modal de soft delete.
  - Arquivo(s): src/pages/AdminAthletes.tsx
  - Como validar: tsc + inspeção visual

Passo 6: Replicar UI em AdminArbitros
  - O que fazer: mesma lógica de Passo 5 adaptada (bulk delete já existe).
  - Arquivo(s): src/pages/AdminArbitros.tsx
  - Como validar: tsc

Passo 7: Replicar UI em AdminAreas
  - O que fazer: mesma lógica adaptada.
  - Arquivo(s): src/pages/AdminAreas.tsx
  - Como validar: tsc
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto. Adição pura de UI + endpoints. Sem mudança de comportamento dos fluxos existentes.
- **Como monitorar:** feedback do usuário. Notificações toast facilitam observar uso.
- **Plano de rollback:** reverter o commit. Endpoints novos não são usados por nada além desta UI, então rollback é seguro.

---

## 12. Definição de Pronto (DoD)

- [x] Critérios CA-01 a CA-07 verificados.
- [x] `npx tsc --noEmit` sem novos erros.
- [x] `doc/spec.md` atualizado: item movido para `[resolvido]`; entrada no Histórico de Correções.
- [x] `doc/requisitos.md` atualizado com a nova UI de lixeira.
