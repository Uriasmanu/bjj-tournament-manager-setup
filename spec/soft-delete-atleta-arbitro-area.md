# Soft Delete para Atleta, Árbitro e Área de Luta

> Spec para o item `[aberto]` de `doc/spec.md`:
> *"Deletar atleta, arbitro,area,deve ser soft delete"*

> ⚠️ Esta spec cobre **apenas o backend + tipos** do soft delete. A UI para visualizar/restaurar/deletar permanentemente registros soft-deletados é o próximo item `[aberto]` em `doc/spec.md` e será tratada em ciclo separado.

---

## 1. Contexto e Objetivo

- **O que é:** converter as 3 operações de exclusão (`deleteAthlete`, `deleteArbitro`, `deleteArea` e suas variantes em lote) de **hard delete** (remoção física do JSON) para **soft delete** (marcar o registro com `deletedAt = ISO timestamp`). Adicionar operações de **restore** que limpam o `deletedAt`.
- **Por que existe:** exclusão física é irreversível e propensa a erros do usuário (clique acidental). Soft delete permite auditoria, recuperação de erros e futura UI de "lixeira" — que é exatamente o próximo item `[aberto]`.
- **Quem usa:** o backend (handlers IPC) e, no próximo ciclo, a UI de gerenciamento.
- **Escopo:**
  - **Dentro:** `src/types/athlete.ts`, `src/types/referee.ts`, `src/types/area.ts` (campo `deletedAt`); `electron/athletes.ts`, `electron/referees.ts`, `electron/areas.ts` (soft delete + restore + load filtrado); `electron/main.ts` (novos handlers IPC); `electron/preload.ts` e `src/types/electron.d.ts` (expor novos métodos); `doc/requisitos.md`.
  - **Fora:** UI de "lixeira" com botão de exibir/restaurar/excluir permanentemente (próximo ciclo); migração retroativa de JSONs antigos (itens sem `deletedAt` são tratados como `null`); `deleteArbitro` continua limpando `chave.arbitroId` (efeito colateral preservado).

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): 12 seções padrão.
- **Documento de requisitos** (`doc/requisitos.md`): seções 3.8 (Atletas), 3.18 (Áreas), 3.17 (Árbitros) — todas descrevem exclusão física. Esta spec substitui essa semântica.
- **Documentação técnica existente:** `spec/athlete-form-botao-cadastrar-visual.md`, `spec/athlete-form-peso-genero-lado-a-lado.md`, `spec/areas-import-export-nome-opcional.md` — referência de formato.
- **Código-fonte relevante lido:**
  - `src/types/athlete.ts:12-24`, `src/types/referee.ts:3-11`, `src/types/area.ts:1-7` — tipos atuais sem `deletedAt`.
  - `electron/athletes.ts:79-98` — `deleteAthlete` e `deleteAthletes` removem fisicamente.
  - `electron/referees.ts:67-98` — `deleteArbitro`/`deleteArbitros` removem e limpam `chave.arbitroId`.
  - `electron/areas.ts:114-127` — `deleteArea`/`deleteAreas` removem fisicamente.
  - `electron/main.ts:79-215` — handlers IPC de delete (4 handlers, 1 por entidade + lote).
  - `electron/preload.ts:34-37, 46-49, 78-81` — exposição das APIs.
  - `src/types/electron.d.ts:36-37, 42-43, 58-59` — typings das APIs.

---

## 3. História de Usuário

```
Como organizador,
quero que, ao "excluir" um atleta/árbitro/área, o registro apenas seja marcado como deletado,
para que eu possa recuperá-lo depois caso tenha sido um engano.
```

Cenários alternativos:
- Item em chave/bracket: a exclusão continua propagando os efeitos colaterais (limpar `chave.arbitroId`) — apenas a remoção física não acontece.
- Item duplicado: se um atleta for soft-deletado e o usuário tentar cadastrar outro com o mesmo `nome + anoNascimento`, o item deletado é detectado como duplicata (ver §10, Passo 1).
- Importação em massa: itens importados nunca vêm com `deletedAt` setado (são sempre `null`).
- Torneio ativo ausente: erro `"Nenhum torneio ativo"` (preservado).

---

## 4. Requisitos Funcionais

### Tipo de dados
- [ ] RF-01: as 3 entidades (`Atleta`, `Arbitro`, `AreaLuta`) passam a ter o campo opcional `deletedAt: string | null`. Quando ausente ou `null`, o item está ativo.

### Soft delete
- [ ] RF-02: `deleteAthlete(id)` deve setar `deletedAt = new Date().toISOString()` no item correspondente, em vez de removê-lo do array. `updatedAt` do torneio é atualizado.
- [ ] RF-03: `deleteAthletes(ids)` aplica o mesmo comportamento a múltiplos ids.
- [ ] RF-04: `deleteArbitro(id)` faz o mesmo e **continua** limpando `chave.arbitroId` para `null` em todas as chaves afetadas (efeito colateral legado preservado).
- [ ] RF-05: `deleteArbitros(ids)` aplica o mesmo a múltiplos ids.
- [ ] RF-06: `deleteArea(id)` faz o mesmo (sem efeitos colaterais em outras entidades).
- [ ] RF-07: `deleteAreas(ids)` aplica o mesmo a múltiplos ids.

### Load filtrado
- [ ] RF-08: `loadAthletes(torneioId)` deve retornar **apenas itens com `deletedAt == null`** (ou ausente). Itens soft-deletados ficam ocultos.
- [ ] RF-09: `loadArbitros(torneioId)` e `loadAreas(torneioId)` seguem o mesmo comportamento.
- [ ] RF-10: consumidores existentes (frontend) continuam recebendo apenas itens ativos, sem mudança de contrato. **Não** incluir `deletedAt` em deletes acidentais: o frontend não deve tomar decisões com base nesse campo nesta spec (apenas a UI de "lixeira" no próximo ciclo o usará).

### Restore
- [ ] RF-11: nova função `restoreAthlete(torneioId, id)`: seta `deletedAt = null` no item, atualiza `updatedAt` do torneio.
- [ ] RF-12: nova função `restoreArbitro(torneioId, id)`: idem, **sem reaplicar** o árbitro nas chaves (o árbitro volta a estar disponível para atribuição futura).
- [ ] RF-13: nova função `restoreArea(torneioId, id)`: idem.
- [ ] RF-14: o restore é exposto via IPC (`restore-athlete`, `restore-arbitro`, `restore-area`) e via `window.electronAPI`.

### Importação
- [ ] RF-15: ao importar atletas/árbitros/áreas de arquivo, os itens importados **nunca** recebem `deletedAt` setado — recebem `null` (ou ausência) para garantir que apareçam nas listagens.

### Atualização
- [ ] RF-16: ao atualizar um item (existente), o `deletedAt` atual é **preservado** (atualizar não restaura um item deletado). A UI é responsável por oferecer "desfazer" explicitamente via `restore*`.

---

## 5. Requisitos Não-Funcionais

- **Performance:** filtragem é feita em memória após `loadTorneio`; para o volume esperado (< 1000 atletas), é negligível.
- **Segurança:** nenhuma exposição de dados sensíveis — `deletedAt` é apenas timestamp.
- **Compatibilidade:** JSONs antigos sem o campo `deletedAt` continuam funcionando (ausência = `null` = ativo). Migração não é necessária.
- **Observabilidade:** logs do Electron não mudam.

---

## 6. Análise da Aplicação

- **Arquitetura geral:** Electron (main process) + React (renderer). Mudanças concentradas no main process + tipos + bridge.
- **Padrões em uso:** IPC handlers registrados em `electron/main.ts` via `ipcMain.handle`; funções de domínio em `electron/*.ts`; exposição tipada em `electron/preload.ts` + `src/types/electron.d.ts`.
- **Fluxo de dados:** renderer → `window.electronAPI.xxx` → IPC → função de domínio → `loadTorneio`/`saveTorneio` → JSON.
- **Contratos de API:** os contratos `load-athletes`/`load-arbitros`/`load-areas` mantêm a mesma assinatura; o conteúdo da resposta passa a filtrar soft-deletados (que estavam fisicamente removidos antes, então é semanticamente equivalente do ponto de vista do renderer).

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/types/athlete.ts` | Modificar | Adicionar `deletedAt?: string \| null` |
| `src/types/referee.ts` | Modificar | Adicionar `deletedAt?: string \| null` |
| `src/types/area.ts` | Modificar | Adicionar `deletedAt?: string \| null` |
| `electron/athletes.ts` | Modificar | Soft delete + restore + load filtrado + import sem `deletedAt` |
| `electron/referees.ts` | Modificar | Idem + preservar efeito colateral em `chave.arbitroId` |
| `electron/areas.ts` | Modificar | Soft delete + restore + load filtrado + import sem `deletedAt` |
| `electron/main.ts` | Modificar | Registrar handlers IPC `restore-*` (3) |
| `electron/preload.ts` | Modificar | Expor `restoreAthlete`/`restoreArbitro`/`restoreArea` |
| `src/types/electron.d.ts` | Modificar | Adicionar typings dos 3 métodos `restore*` |
| `doc/requisitos.md` | Modificar | Documentar soft delete em 3.8, 3.17, 3.18 |
| `doc/spec.md` | Modificar | Mover item para `[resolvido]`; entrada no Histórico de Correções |

> Não há mudança em `package.json`, dependências, ou arquivos do renderer nesta spec. O botão "Excluir" do frontend continua chamando `deleteAthlete` — a UI permanece visualmente idêntica (o item some da lista, como antes). A diferença é que agora ele pode ser restaurado via novo endpoint.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- A função `deleteArbitro` tem efeito colateral em `chave.arbitroId`. No soft delete, esse efeito permanece (a chave deixa de ter árbitro atribuído), o que está semanticamente correto: o árbitro não está mais ativo.
- O normalizador de áreas (`normalizeArea` em `areas.ts:36`) precisa propagar `deletedAt` se já existir.

### 8.2 Ambiguidades nos Requisitos
- **Restore de árbitro:** ao restaurar, o árbitro volta a estar disponível no `MultiSelect` de `AreaForm` (que carrega via `loadArbitros`). Mas o árbitro não é **reatribuído** automaticamente às chaves das quais foi removido. Decisão: reatribuição é responsabilidade da UI/usuário no ciclo da "lixeira".
- **Item restaurado que conflita com regra de unicidade:** o próximo ciclo (UI de lixeira) deve impedir reatribuição de nome/ano se já existir um atleta ativo igual — equivalente à checagem de duplicata atual.

### 8.3 Riscos
- Regressão em produção: se algum consumidor confiar em `loadAthletes` para contar **todos** os atletas (incluindo deletados), o número diminuirá após o deploy. Não encontrei nenhum consumidor desse tipo no código (consumidores: `Equipes`, `PlacarLuta*`, `PlacarBracket`, `PlacarChaves`, `GerenciarChaves`, `AthletesMenu`, `AdminAthletes` — todos querem apenas ativos). **Risco baixo.**

---

## 9. Critérios de Aceite

- [ ] CA-01: dado um atleta criado, quando o renderer chama `deleteAthlete(id)` e em seguida `loadAthletes()`, então o atleta **não** aparece na resposta e o JSON do torneio contém o atleta com `deletedAt` preenchido.
- [ ] CA-02: dado o mesmo cenário, quando o renderer chama `restoreAthlete(id)` e em seguida `loadAthletes()`, então o atleta volta a aparecer e `deletedAt` está `null` no JSON.
- [ ] CA-03: dado um árbitro atribuído a uma chave, quando `deleteArbitro(id)` é chamado, então o árbitro fica com `deletedAt` setado **e** a chave tem `arbitroId = null`.
- [ ] CA-04: dado um árbitro soft-deletado, quando `restoreArbitro(id)` é chamado, então o árbitro volta a aparecer em `loadArbitros()`, mas **não** é reatribuído a chaves.
- [ ] CA-05: dado um arquivo JSON de importação contendo atletas com `deletedAt` setado, quando importado, então os atletas importados ficam com `deletedAt: null` (campo sobrescrito).
- [ ] CA-06: dado um item com `deletedAt` setado, quando o renderer chama `updateAthlete(item)`, então o `deletedAt` **permanece** setado (atualização não restaura).
- [ ] CA-07: as 3 novas APIs `restoreAthlete`/`restoreArbitro`/`restoreArea` estão tipadas em `electron.d.ts` e expostas em `preload.ts`.

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Atualizar os 3 tipos (atleta, árbitro, área) com `deletedAt`
  - O que fazer: adicionar `deletedAt?: string | null` em Atleta, Arbitro, AreaLuta.
  - Arquivo(s): src/types/athlete.ts, src/types/referee.ts, src/types/area.ts
  - Como validar: npx tsc --noEmit

Passo 2: Refatorar electron/athletes.ts para soft delete + restore
  - O que fazer:
    - deleteAthlete / deleteAthletes → setar deletedAt em vez de remover
    - loadAthletes → filtrar deletedAt == null
    - saveAthlete / importAthletesFromFile → garantir deletedAt: null no novo item
    - updateAthlete → preservar deletedAt
    - nova função restoreAthlete(torneioId, id)
  - Arquivo(s): electron/athletes.ts
  - Como validar: tsc + inspeção manual

Passo 3: Refatorar electron/referees.ts (mesmo padrão, + chave.arbitroId)
  - O que fazer: análogo ao Passo 2, preservando o efeito colateral em chaves.
  - Arquivo(s): electron/referees.ts
  - Como validar: tsc

Passo 4: Refatorar electron/areas.ts (mesmo padrão, + normalizeArea)
  - O que fazer: análogo ao Passo 2; normalizeArea propaga deletedAt.
  - Arquivo(s): electron/areas.ts
  - Como validar: tsc

Passo 5: Registrar handlers IPC restore-*
  - O que fazer: adicionar ipcMain.handle para restore-athlete, restore-arbitro, restore-area.
  - Arquivo(s): electron/main.ts
  - Como validar: tsc

Passo 6: Expor APIs no preload e typings
  - O que fazer: adicionar restoreAthlete, restoreArbitro, restoreArea em preload.ts e electron.d.ts.
  - Arquivo(s): electron/preload.ts, src/types/electron.d.ts
  - Como validar: tsc
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto. Mudança de comportamento é compatível com a UI atual (item continua sumindo da lista após delete).
- **Como monitorar:** nenhuma métrica nova; feedback do usuário no próximo ciclo (UI de lixeira).
- **Plano de rollback:** reverter o commit. Dados soft-deletados anteriores ao rollback permanecem no JSON (sem perda) — basta refazer o ciclo.

---

## 12. Definição de Pronto (DoD)

- [x] Critérios CA-01 a CA-07 verificados.
- [x] `npx tsc --noEmit` sem novos erros.
- [x] `doc/spec.md` atualizado: item movido para `[resolvido]`; entrada no Histórico de Correções.
- [x] `doc/requisitos.md` atualizado com a nova semântica de soft delete + restore.
