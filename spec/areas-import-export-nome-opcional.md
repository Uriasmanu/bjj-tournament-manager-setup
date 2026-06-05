# Importação/Exportação de Áreas de Luta + Nome Opcional

> Spec para a feature declarada em `doc/spec.md` seção **Feature**:
> *"importa e exporta areas de luta"*
> *"areas luta não tem que ter nome obrigatorio, se não colocar, por pardão é Area (sequencia numerica)"*

---

## 1. Contexto e Objetivo

- **O que é:** (a) adicionar botões de **Importar** e **Exportar** áreas de luta no padrão dos atletas; (b) tornar o **nome** das áreas **opcional** — quando vazio, o sistema gera automaticamente `"Área N"` usando o próximo número disponível.
- **Por que existe:** (a) padronizar a portabilidade de configuração entre torneios; (b) acelerar o cadastro — muitos eventos têm áreas numeradas ("Área 1", "Área 2") que não justificam digitar manualmente; o sistema gera sozinho.
- **Quem usa:** organizadores que querem replicar configuração entre eventos ou reiniciar um torneio rapidamente.
- **Escopo:**
  - **Dentro:** `electron/areas.ts` (handlers `importAreasFromFile`/`exportAreas` + função `gerarNomeAreaPadrao`); `electron/preload.ts` e `src/types/electron.d.ts` (expor `importAreas`/`exportAreas`); `src/pages/AdminAreas.tsx` (botões no header); `src/components/AreaForm.tsx` (tornar nome opcional); `electron/areas.ts:saveArea` e `updateArea` (aplicar nome padrão quando vazio).
  - **Fora:** tela dedicada no menu intermediário (`AreasMenu`); migração retroativa de áreas sem nome (áreas já gravadas com nome vazio permanecem com string vazia — sem alteração retroativa).

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): 12 seções padrão.
- **Documento de requisitos** (`doc/requisitos.md`): seção 3.18 (Áreas de Luta) documenta CRUD existente. Esta feature estende a importação/exportação seguindo o padrão já estabelecido em 3.10 (Atletas) e 3.17 (Árbitros).
- **Documentação técnica existente:** `spec/credencial-dashboard-expiracao.md`, `spec/timestamp-inicio-fim-lutas.md`, `spec/resultados-chaves-acordeao.md` — padrões de spec dos ciclos anteriores.
- **Código-fonte relevante lido:**
  - `electron/areas.ts:25-37` `normalizeArea` — confirma que `nome: (area.nome as string) ?? ''` (vazio aceito pelo normalizador legado, mas UI impede).
  - `electron/areas.ts:61-79` `saveArea` — recebe `nome.trim()` e armazena sem validação de comprimento mínimo.
  - `electron/athletes.ts:100-151` `importAthletesFromFile` — padrão de referência: valida estrutura, valida campos obrigatórios, normaliza lowercase, dedup por id/nome+ano, retorna `{ imported, skipped }`.
  - `electron/athletes.ts:161-171` `exportAthletes` — abre `dialog.showSaveDialog`, escreve JSON formatado.
  - `electron/main.ts:110-122` — handlers `import-athletes` e `export-athletes` (referência).
  - `src/pages/AdminAthletes.tsx:148-168` — handlers `handleExport` e `handleImport` no frontend (referência).
  - `src/components/AreaForm.tsx:27,74` — validação `length < 2` e label `Nome *` (a ser removido nesta feature).

> ⚠️ **Inferência sinalizada:** o doc `doc/requisitos.md:39` menciona "CRUD com nome + múltiplos árbitros por área" mas não menciona a possibilidade de nome vazio. Esta feature formaliza o nome opcional.

---

## 3. História de Usuário

```
Como organizador,
quero poder importar e exportar a lista de áreas de luta em JSON
e poder cadastrar áreas sem digitar um nome (sistema gera "Área N" automaticamente),
para que eu replique rapidamente a configuração entre torneios e evite digitação repetitiva.
```

**Cenários alternativos:**

- *Usuário clica em "Importar" mas cancela o diálogo de arquivo:* nada acontece, sem notificação.
- *JSON malformado ou não-array:* erro vermelho, sem alteração na lista.
- *Área importada com mesmo nome (case-insensitive) de uma existente:* ignorada, conta como `skipped`.
- *Área importada com nome vazio:* recebe nome "Área N" gerado na hora da importação.
- *Área cadastrada manualmente sem nome:* recebe "Área N" no momento do `saveArea` (frontend envia string vazia, backend gera).
- *Área editada com nome esvaziado:* recebe novo "Área N" (que pode ser igual ao anterior se for o próximo livre; em geral será diferente).
- *Existem "Área 1", "Área 3", "Área 5" e cadastro sem nome:* próxima vira "Área 2" (preenche gap).

---

## 4. Requisitos Funcionais

- [ ] **RF-01:** A tela de listagem de áreas (`AdminAreas.tsx`) deve exibir botões **"Importar"** e **"Exportar JSON"** no header, à esquerda, com ícones `IconFileUpload` e `IconFileCode` (mesmo padrão de `AdminAthletes.tsx:203-219`).
- [ ] **RF-02:** O botão "Importar" deve abrir diálogo nativo de seleção de arquivo JSON, validar o conteúdo, mesclar com a lista existente (sem duplicatas por nome) e notificar `"X área(s) importada(s), Y ignorada(s) (já existentes)."` ou silenciar quando `imported=0 && skipped=0`.
- [ ] **RF-03:** O botão "Exportar JSON" deve abrir diálogo nativo "Salvar como" e gravar a lista atual de áreas em JSON formatado (indentação 2 espaços), com nome padrão sugerido `areas.json`.
- [ ] **RF-04:** O JSON de importação deve ser um **array de objetos** com `nome` e `arbitroIds` (campos opcionais: `id`, `createdAt`, `updatedAt` — gerados/sobrescritos pelo sistema). Estruturas diferentes (objeto, string, número) são rejeitadas com erro.
- [ ] **RF-05:** Na importação, áreas com mesmo `nome` (case-insensitive, trimmed) já existente na lista devem ser ignoradas (não geram duplicata) e contadas como `skipped`.
- [ ] **RF-06:** Na importação, áreas com `nome` vazio ou ausente devem receber nome gerado `"Área N"` no momento da inserção, onde N é o próximo número disponível.
- [ ] **RF-07:** No cadastro manual (`AreaForm.tsx`), o campo "Nome" deve deixar de ser obrigatório: o `*` no label é removido, a validação `length < 2` é removida, e a regra de duplicata é atualizada para ignorar áreas com nome vazio.
- [ ] **RF-08:** No cadastro/edição manual via `AreaForm.tsx`, se o usuário submeter com nome vazio, o sistema deve gerar `"Área N"` no momento do `saveArea`/`updateArea`.
- [ ] **RF-09:** A função `gerarNomeAreaPadrao(areasExistentes)` deve retornar `"Área N"` onde N é o **menor inteiro ≥ 1** que ainda não está em uso na lista de nomes que casam `/^Área (\d+)$/` (case-insensitive). Se a lista está vazia, retorna `"Área 1"`.
- [ ] **RF-10:** A função `gerarNomeAreaPadrao` deve ser reutilizada em `saveArea`, `updateArea` e `importAreasFromFile` para garantir consistência.

---

## 5. Requisitos Não-Funcionais

- **Performance:** O(n) sobre a lista de áreas para gerar nome padrão (≤ 100 áreas na prática; desprezível).
- **Segurança:** o JSON é parseado no main process; nenhum input do usuário é executado. Validação de tipo de arquivo (extensão `.json`) é feita pelo diálogo nativo.
- **Acessibilidade:** botões devem ter `aria-label` (ex.: "Importar áreas de luta", "Exportar áreas de luta em JSON"). Texto do botão é legível por leitor de tela.
- **Compatibilidade:** nenhum impacto. JSONs exportados hoje (sem o feature) continuam sendo legíveis — `nome` é o único campo relevante; `id` e timestamps são regenerados.
- **Observabilidade:** notificações de sucesso (`X importadas, Y ignoradas`) e erro (vermelho com mensagem).
- **Atomicidade:** cada inserção de área é um único `saveTorneio` (atualiza `areas` e `updatedAt` do torneio).

---

## 6. Análise da Aplicação

- **Arquitetura:** renderer (`AdminAreas.tsx`) → IPC (`import-areas` / `export-areas`) → main process (`areas.ts`) → `saveTorneio`.
- **Padrões em uso:**
  - IPC handler com `getActiveTournamentId()` antes de qualquer operação (`electron/main.ts:172-176`).
  - Diálogo nativo via `dialog.showOpenDialog` / `dialog.showSaveDialog` do Electron.
  - Normalização de string (lowercase + trim) em imports (padrão de atletas).
  - `crypto.randomUUID()` para gerar `id` quando ausente.
- **Fluxo de dados:**
  - **Exportar:** `AdminAreas.tsx:handleExport` → `window.electronAPI.exportAreas()` → IPC `export-areas` → `exportAreas(torneioId)` em `areas.ts` → `dialog.showSaveDialog` → `fs.writeFileSync(..., JSON.stringify(areas, null, 2))`.
  - **Importar:** `AdminAreas.tsx:handleImport` → `window.electronAPI.importAreas()` → IPC `import-areas` → `openAreaFileDialog()` + `importAreasFromFile(torneioId, filePath)` em `areas.ts` → valida + dedup + insere com nome padrão se vazio.
  - **Cadastrar/editar sem nome:** `AreaForm.tsx` envia `nome: ''` → `AdminAreas.tsx:handleSave` → IPC `save-area`/`update-area` → `saveArea`/`updateArea` em `areas.ts` aplica `gerarNomeAreaPadrao()` quando `nome.trim() === ''`.
- **Contratos de API (novos):**
  - `importAreas(): Promise<{ imported: number; skipped: number }>` (preload + IPC `import-areas`).
  - `exportAreas(): Promise<void>` (preload + IPC `export-areas`).

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---|---|---|
| `electron/areas.ts` | Modificar | Adicionar `gerarNomeAreaPadrao`, `importAreasFromFile`, `exportAreas`, `openAreaFileDialog`; modificar `saveArea` e `updateArea` para aplicar nome padrão quando vazio. |
| `electron/preload.ts` | Modificar | Expor `importAreas: ()` e `exportAreas: ()` no objeto exposto ao renderer. |
| `src/types/electron.d.ts` | Modificar | Adicionar tipos `importAreas` e `exportAreas` na interface `electronAPI`. |
| `electron/main.ts` | Modificar | Adicionar handlers IPC `import-areas` e `export-areas` em `registerAreaHandlers()`. |
| `src/components/AreaForm.tsx` | Modificar | Remover `*` do label "Nome"; remover validação `length < 2`; permitir submit com nome vazio. |
| `src/pages/AdminAreas.tsx` | Modificar | Adicionar `handleImport` e `handleExport`; adicionar botões "Importar" e "Exportar JSON" no header (à esquerda de "Cadastrar"); atualizar duplicata check para ignorar áreas com nome vazio. |
| `doc/spec.md` | Modificar | Adicionar entry no Histórico de Correções. |
| `doc/requisitos.md` | Modificar | Adicionar linha na tabela 2.1 e estender seção 3.18. |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- **Reuso da função `gerarNomeAreaPadrao`:** a função precisa rodar tanto no main process (`areas.ts`) quanto ser invocada quando o frontend envia `nome: ''`. Decisão: gerar no main process (single source of truth), o frontend apenas envia o que o usuário digitou (string vazia se nada).
- **Migração retroativa:** áreas existentes com `nome: ''` no JSON (legado) permanecem como `''` na UI. Esta spec não migra retroativamente — o usuário pode editá-las manualmente para gerar nomes "Área N". Documentar como limitação.

### 8.2 Ambiguidades nos Requisitos

- ❓ **Onde aplicar o nome padrão:** cadastrar/editar/importar — resolvido: em todos os 3 (RF-10).
- ❓ **Botões de Import/Export:** AdminAreas (igual a AdminAthletes) — resolvido.
- ❓ **Formato JSON:** sem id/timestamps (gerados pelo sistema) — resolvido.

### 8.3 Riscos

- **Edição removendo o nome:** se o usuário editar uma área e apagar o nome, ela receberá um novo "Área N" que pode coincidir com outra existente. Mitigação: `gerarNomeAreaPadrao` garante número único, mas o nome pode ficar diferente do anterior. Aceitável: o usuário optou por esvaziar.
- **Performance da geração em loop:** ao importar 1000 áreas, cada uma chama `gerarNomeAreaPadrao` sobre a lista crescente. O(n²) ≈ 500k operações, ainda desprezível (< 100ms).
- **Duplicata por nome case-insensitive:** `"Área 1"` e `"área 1"` são consideradas duplicatas (mesma regra de outras importações).

---

## 9. Critérios de Aceite

- [ ] **CA-01:** dado que o usuário está em `/admin/areas/lista`, quando a página carrega, então os botões "Importar" e "Exportar JSON" aparecem no header à esquerda de "Cadastrar".
- [ ] **CA-02:** dado que o usuário clica em "Exportar JSON", quando escolhe o destino e confirma, então um arquivo JSON com a lista de áreas é gravado no disco.
- [ ] **CA-03:** dado que o usuário clica em "Importar" e seleciona um JSON válido, quando o conteúdo é um array de áreas, então as áreas novas são mescladas com a lista existente e a notificação exibe `"X área(s) importada(s), Y ignorada(s) (já existentes)."`
- [ ] **CA-04:** dado que o JSON importado contém área com nome `"Área 1"` e já existe `"área 1"` na lista, quando a importação processa, então a duplicata é ignorada (case-insensitive).
- [ ] **CA-05:** dado que a lista tem `["Área 1", "Área 3", "Área 5"]`, quando uma área sem nome é cadastrada, então o nome gerado é `"Área 2"` (preenche o gap).
- [ ] **CA-06:** dado que a lista tem `["Área 1", "Área 2"]` e uma área com nome vazio é cadastrada, então o nome gerado é `"Área 3"`.
- [ ] **CA-07:** dado que a lista está vazia, quando uma área sem nome é cadastrada, então o nome gerado é `"Área 1"`.
- [ ] **CA-08:** dado que o usuário abre o `AreaForm` para nova área, quando ele submete com nome vazio, então a área é salva com nome gerado (sem erro de validação).
- [ ] **CA-09:** dado que o usuário abre o `AreaForm` para editar uma área e apaga o nome, quando submete, então a área é atualizada com novo nome gerado.
- [ ] **CA-10:** dado que o JSON importado contém área com `nome: ''` ou `nome` ausente, quando a importação processa, então a área recebe um nome gerado.
- [ ] **CA-11:** dado um JSON inválido (não-array, JSON malformado, arquivo `.json` com erro de parsing), quando a importação tenta processar, então uma notificação vermelha é exibida e a lista permanece inalterada.
- [ ] **CA-12:** dado que o usuário clica em "Importar" e cancela o diálogo nativo, quando o diálogo é fechado, então nenhuma notificação é exibida e nada é alterado.

---

## 10. Plano de Implementação (Passo a Passo)

### Passo 1: Adicionar `gerarNomeAreaPadrao` em `electron/areas.ts`
- **O que fazer:** Função pura que recebe `AreaLuta[]` e retorna `"Área N"` com N = menor inteiro ≥ 1 não presente em nomes que casam `/^Área (\d+)$/i`.
- **Arquivo(s):** `electron/areas.ts`.
- **Como validar:** teste manual: lista vazia → "Área 1"; `["Área 1"]` → "Área 2"; `["Área 1", "Área 3"]` → "Área 2"; `["Área 10"]` → "Área 1".

### Passo 2: Modificar `saveArea` e `updateArea` para aplicar nome padrão
- **O que fazer:** Em `saveArea(torneioId, data)`, se `data.nome.trim() === ''`, calcular nome via `gerarNomeAreaPadrao(loadAreas(torneioId))` antes de montar o objeto. Mesma lógica em `updateArea` quando `data.nome.trim() === ''`.
- **Arquivo(s):** `electron/areas.ts:61-99`.
- **Como validar:** `npx tsc --noEmit` passa.

### Passo 3: Adicionar `importAreasFromFile` em `electron/areas.ts`
- **O que fazer:** Função que parseia o JSON, valida que é array, valida `nome` (se presente e não vazio) e `arbitroIds` (se presente deve ser array), normaliza lowercase, dedup por nome, gera nome padrão para entradas sem nome, gera `id`/`createdAt`/`updatedAt`, chama `checkRefereeNotInUse` por área inserida, retorna `{ imported, skipped }`.
- **Arquivo(s):** `electron/areas.ts`.
- **Como validar:** `npx tsc --noEmit` passa.

### Passo 4: Adicionar `exportAreas` e `openAreaFileDialog` em `electron/areas.ts`
- **O que fazer:** Espelhar `exportAthletes` e `openAthleteFileDialog` (`electron/athletes.ts:153-171`).
- **Arquivo(s):** `electron/areas.ts`.
- **Como validar:** `npx tsc --noEmit` passa.

### Passo 5: Adicionar handlers IPC em `electron/main.ts`
- **O que fazer:** Em `registerAreaHandlers()`, adicionar `ipcMain.handle('import-areas', ...)` e `ipcMain.handle('export-areas', ...)` (mesmo padrão de `registerAthleteHandlers` em `main.ts:110-122`).
- **Arquivo(s):** `electron/main.ts:171-201`.
- **Como validar:** `npx tsc --noEmit` passa.

### Passo 6: Expor no preload
- **O que fazer:** Adicionar `importAreas: () => ipcRenderer.invoke('import-areas')` e `exportAreas: () => ipcRenderer.invoke('export-areas')` no objeto `electronAPI`.
- **Arquivo(s):** `electron/preload.ts:38-41` (espelhar).
- **Como validar:** `npx tsc --noEmit` passa.

### Passo 7: Adicionar tipos em `electron.d.ts`
- **O que fazer:** Adicionar `importAreas: () => Promise<{ imported: number; skipped: number }>` e `exportAreas: () => Promise<void>` na interface.
- **Arquivo(s):** `src/types/electron.d.ts:38-39` (espelhar).
- **Como validar:** `npx tsc --noEmit` passa.

### Passo 8: Modificar `AreaForm.tsx` (nome opcional)
- **O que fazer:** Remover `*` do label (linha 74: `label="Nome *"` → `label="Nome"`). Remover validação `length < 2` (linha 27: `validate: {}` ou remover o campo). O placeholder pode ganhar dica: `"Deixe vazio para gerar automaticamente (Área N)"`.
- **Arquivo(s):** `src/components/AreaForm.tsx`.
- **Como validar:** `npx tsc --noEmit` + submit com nome vazio não mostra erro.

### Passo 9: Modificar `AdminAreas.tsx` (botões + handlers)
- **O que fazer:**
  - Importar `IconFileUpload`, `IconFileCode` de `@tabler/icons-react`.
  - Adicionar `handleImport` e `handleExport` (espelhar `AdminAthletes.tsx:148-168`).
  - Adicionar botões no header (linha 173-193): à esquerda de "Cadastrar", botões "Importar" e "Exportar JSON" com `variant="default"` e `styles={{ root: { borderRadius: 12 } }}`.
  - Atualizar duplicata check (linha 77-81): ignorar áreas com `nome.trim() === ''` na comparação (já que serão renomeadas pelo backend).
- **Arquivo(s):** `src/pages/AdminAreas.tsx`.
- **Como validar:** `npx tsc --noEmit` + `npm run lint` passam.

### Passo 10: Validar lint + typecheck finais
- **O que fazer:** Rodar `npx tsc --noEmit` e `npm run lint`. Garantir 0 erros/warnings novos.
- **Como validar:** comandos retornam 0.

### Passo 11: Atualizar `doc/spec.md` e `doc/requisitos.md`
- **O que fazer:**
  - Adicionar entry consolidada no Histórico de Correções de `doc/spec.md`.
  - Adicionar linha "✅ Completo" na tabela 2.1 de `doc/requisitos.md`.
  - Estender seção 3.18 (Áreas de Luta) com regras de negócio de Import/Export e nome opcional.
- **Como validar:** diffs revisados.

### Passo 12: Teste manual end-to-end
- **O que fazer:** Criar 2 áreas com nomes "Tatame A" e "Tatame B". Cadastrar nova sem nome → deve virar "Área 1". Exportar JSON. Editar JSON trocando nome "Tatame A" para "" e adicionando duplicata de "Tatame B". Importar → "Tatame B" duplicata ignorada; a com nome vazio vira "Área 2" (próximo livre).
- **Como validar:** visual + notificação + JSON do torneio.

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto. Feature puramente aditiva (botões novos + handler novo). Mudança no `AreaForm` é relaxante (tira validação), não quebra nada.
- **Como monitorar:** em caso de erro, o catch no frontend exibe notificação vermelha. No main process, qualquer throw é propagado via IPC.
- **Plano de rollback:** nenhum migration aplicado. Reverter o commit remove os botões e o handler. Áreas já geradas com nome "Área N" permanecem válidas.

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os 12 CA verificados (CA-01 a CA-12).
- [ ] `npx tsc --noEmit` retorna 0.
- [ ] `npm run lint` retorna 0 erros/warnings novos (3 pré-existentes permanecem).
- [ ] `doc/spec.md` Histórico de Correções atualizado.
- [ ] `doc/requisitos.md` atualizado (seção 2.1 + extensão da 3.18).
- [ ] Teste manual end-to-end realizado com sucesso em cadastro, edição, import e export.

---

*Spec gerada seguindo `doc/spec.md` seções 1-12. Nenhuma seção do template foi pulada.*
