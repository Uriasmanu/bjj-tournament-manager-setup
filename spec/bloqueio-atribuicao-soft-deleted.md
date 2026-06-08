# spec/bloqueio-atribuicao-soft-deleted.md

> Feature: impedir que itens soft-deleted sejam atribuídos a outros itens no sistema.

---

## 1. Contexto e Objetivo

- **O que é:** Validar no backend que atletas, árbitros e áreas com `deletedAt != null` não sejam utilizados em atribuições: atletas em chaves, árbitros em chaves/áreas, áreas com árbitros deletados.
- **Por que existe:** Atualmente os handlers de geração de chaves e salvamento de áreas acessam `torneio.atletas`/`torneio.arbitros` diretamente sem filtrar soft-deleted. Frontend já filtra, mas backend não — o que pode levar a inconsistências.
- **Quem usa:** Organizador do torneio ao gerar chaves, atribuir árbitros manualmente ou salvar áreas de luta.
- **Escopo:**
  - **Dentro:** `electron/brackets.ts` (geração de chaves, atribuição automática e manual de árbitros) e `electron/areas.ts` (validação de árbitros ativos ao salvar/atualizar área).
  - **Fora:** Frontend (já está correto — todos os componentes usam funções IPC que filtram `deletedAt`), IPC de carregamento CRUD, tipos.

---

## 2. Analise dos Documentos de Referência

- **doc/spec.md:** feature registrada na seção `## Feature`.
- **doc/requisitos.md:** seções 3.8 (Atletas em chave), 3.11 (Geração de Chaves), 3.17 (Árbitros), 3.18 (Áreas de Luta) — nenhuma delas menciona explicitamente o filtro de `deletedAt` no backend, apenas o comportamento esperado de carregamento.
- **Código-fonte relevante (lido):**
  - `electron/brackets.ts:714` — `gerarTodasChavesHandler` usa `torneio.atletas` sem filtro.
  - `electron/brackets.ts:1572` — `gerar-chave` IPC usa `torneio.atletas` sem filtro.
  - `electron/brackets.ts:644` — `autoAtribuirArbitros` usa `torneio.arbitros` sem filtro.
  - `electron/brackets.ts:878` — `atribuirArbitroHandler` não valida `deletedAt` do árbitro.
  - `electron/areas.ts:57-72` — `checkRefereeNotInUse` não valida se árbitros existem/estão ativos.

---

## 3. Historia de Usuario

```
Como organizador do torneio,
quero que atletas e árbitros soft-deleted sejam ignorados na geração de chaves e na atribuição de árbitros a chaves/áreas,
para que itens deletados (lixeira) nunca sejam usados em atribuições do torneio ativo.
```

Cenários alternativos:
- Se um atleta for restaurado da lixeira, volta a ser elegível automaticamente (já funciona — `restoreAthlete` limpa `deletedAt`).
- Se a lista ativa de árbitros estiver vazia, a atribuição automática simplesmente não atribui ninguém.

---

## 4. Requisitos Funcionais

- [ ] RF-01: `gerarTodasChavesHandler` deve ignorar atletas com `deletedAt != null`.
- [ ] RF-02: `gerar-chave` (individual) deve ignorar atletas com `deletedAt != null`.
- [ ] RF-03: `autoAtribuirArbitros` deve ignorar árbitros com `deletedAt != null`.
- [ ] RF-04: `atribuirArbitroHandler` deve rejeitar atribuição de árbitro com `deletedAt != null`.
- [ ] RF-05: `saveArea` e `updateArea` devem rejeitar arbitroIds que referenciem árbitros soft-deleted.
- [ ] RF-06: `checkRefereeNotInUse` deve validar que todos os arbitroIds fornecidos referenciam árbitros ativos.

---

## 5. Requisitos Nao-Funcionais

- **Performance:** filtros adicionais são O(n) sobre arrays já carregados em memória — sem impacto mensurável.
- **Segurança:** validação no backend impede bypass via chamada IPC direta.
- **Compatibilidade:** nenhuma mudança em tipos, contratos IPC ou persistência.

---

## 6. Analise da Aplicação

- **Arquitetura geral:** backend Electron (main process) com funções puras que manipulam `Torneio` em memória e persistem em JSON. Frontend React+Mantine consome IPC.
- **Padrões em uso:** funções `load*` filtradas, handlers IPC com `getActiveTournamentId()`, acesso direto ao torneio para geração de chaves.
- **Fluxo de dados:** handlers de geração de chaves recebem `torneioId`, carregam torneio via `loadTorneio()` (sem filtro), acessam arrays diretamente. A correção adiciona `.filter(deletedAt == null)` nesses acessos diretos.
- **Contratos de API:** inalterados.

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Adicionar filtro `deletedAt == null` em 3 locais + validação em 1 local. |
| `electron/areas.ts` | Modificar | Adicionar validação de árbitros ativos em `checkRefereeNotInUse`. |
| `doc/spec.md` | Modificar | Atualizar seção Feature e Histórico de Correções. |
| `doc/requisitos.md` | Modificar | Adicionar regra de que soft-deleted não são atribuíveis. |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Nenhum. Mudanças são filtros booleanos em arrays já carregados.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma.

### 8.3 Riscos
- Risco baixo: todos os fluxos de frontend já filtram item deletados (camada dupla de segurança).
- `checkRefereeNotInUse` não possui acesso direto a `loadArbitros` — a validação será inline, carregando torneio e filtrando árbitros ativos manualmente.

---

## 9. Criterios de Aceite

- [ ] CA-01: Ao gerar chaves (em massa ou individual), atleta com `deletedAt != null` não entra em nenhuma chave.
- [ ] CA-02: Na atribuição automática, árbitro com `deletedAt != null` não recebe chave.
- [ ] CA-03: Ao atribuir árbitro manualmente a chave, se o árbitro estiver soft-deleted, o handler lança erro e não atribui.
- [ ] CA-04: Ao salvar/atualizar área com `arbitroIds`, se algum ID referenciar árbitro soft-deleted, o handler lança erro e não persiste.
- [ ] CA-05: Atletas/árbitros restaurados (deletedAt = null) voltam a ser elegíveis automaticamente.

---

## 10. Plano de Implementacao (Passo a Passo)

```
Passo 1: Adicionar import de Arbitro em brackets.ts
  - O que fazer: adicionar import type { Arbitro } from '../src/types/referee'
  - Arquivo(s): electron/brackets.ts
  - Como validar: tsc sem erro

Passo 2: Filtrar atletas em gerarTodasChavesHandler (brackets.ts:714)
  - O que fazer: alterar torneio.atletas para (torneio.atletas ?? []).filter(a => a.deletedAt == null)
  - Arquivo(s): electron/brackets.ts
  - Como validar: revisão de código

Passo 3: Filtrar atletas em gerar-chave (brackets.ts:1572)
  - O que fazer: adicionar .filter(a => a.deletedAt == null) antes do filtro de categoria
  - Arquivo(s): electron/brackets.ts
  - Como validar: revisão de código

Passo 4: Filtrar árbitros em autoAtribuirArbitros (brackets.ts:644)
  - O que fazer: alterar torneio.arbitros para (torneio.arbitros ?? []).filter(r => r.deletedAt == null)
  - Arquivo(s): electron/brackets.ts
  - Como validar: revisão de código

Passo 5: Validar deletedAt em atribuirArbitroHandler (brackets.ts:878-879)
  - O que fazer: adicionar if (newArbitro.deletedAt != null) throw new Error(...)
  - Arquivo(s): electron/brackets.ts
  - Como validar: revisão de código

Passo 6: Validar árbitros ativos em checkRefereeNotInUse (areas.ts:57-72)
  - O que fazer: carregar árbitros ativos do torneio e validar que todos os arbitroIds existem nessa lista
  - Arquivo(s): electron/areas.ts
  - Como validar: revisão de código

Passo 7: Rodar lint + typecheck
  - npm run lint && npx tsc --noEmit
  - Como validar: ambos retornam 0

Passo 8: Atualizar doc/spec.md e doc/requisitos.md
  - Mover feature concluída para Histórico de Correções ou manter como implementada
  - Adicionar regra em requisitos.md
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto, sem feature flag (validação adicional no backend, sem quebra de compatibilidade).
- **Como monitorar:** logs de erro dos handlers IPC.
- **Plano de rollback:** reverter commit.

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os 6 pontos de validação implementados.
- [ ] `npm run lint` e `npx tsc --noEmit` sem erros.
- [ ] `doc/spec.md` atualizado (feature concluída registrada).
- [ ] `doc/requisitos.md` atualizado com a nova regra de negócio.
