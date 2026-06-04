# Spec: Luta Casada (Placar Area)

## 1. Contexto e Objetivo

- **O que é:** Modal/botão "Luta Casada" na tela `PlacarChaves` (Placar Area) que permite criar uma luta de exibição entre dois atletas cadastrados no torneio, sem vínculo com a chave de eliminação oficial. A luta herda automaticamente o árbitro da área, é marcada com tag "Luta Casada" e armazena internamente os dados completos de cada atleta (faixa, peso, equipe, categoria inscrita).
- **Por que existe:** Permitir que o operador do placar registre lutas de exibição/absurdo (open weight, super fights, demonstrações) sem precisar gerar chave oficial, mantendo o registro e o histórico dessas lutas no torneio.
- **Quem usa:** Operador do placar (admin) na tela `PlacarChaves`.
- **Escopo:**
  - Dentro: criar, listar, executar (timer/placar) e finalizar Luta Casada; persistir em JSON por torneio.
  - Fora: classificação automática de categoria, geração de chave, integração com bracket oficial, exportação para PDF, ranking.

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): todas as 12 seções preenchidas.
- **Documento de requisitos** (`doc/requisitos.md`):
  - Seção 3.19 (Placar/Scoreboard): base do cronômetro, painéis A/B e modal de finalização.
  - Seção 3.20 (Geração de Chaves — 16 Atletas): define `Chave`, `Luta`, `PlacarLuta` reusados parcialmente.
- **Código-fonte relevante:**
  - `src/pages/PlacarChaves.tsx`: tela alvo (header + grid de chaves + área para nova feature).
  - `src/pages/PlacarLuta.tsx`: scoreboard completo (timer, painéis, modal de finalização, salvamento) — alvo de reuso/parametrização.
  - `src/types/bracket.ts`: tipos `Luta`, `Chave`, `PlacarLuta` (base para novo tipo `LutaCasada`).
  - `src/types/athlete.ts`: `Atleta` (possui `faixa`, `equipe`, `categoria`, `pesoKg`).
  - `src/types/area.ts`: `AreaLuta` (possui `arbitroIds: string[]`).
  - `electron/areas.ts`, `electron/athletes.ts`, `electron/referees.ts`: padrão de persistência (JSON por torneio em `data/<torneioId>/`).
  - `electron/main.ts`: registra handlers IPC; cada domínio (`registerXHandlers`).

## 3. História de Usuário

```
Como operador do placar,
quero criar uma "Luta Casada" diretamente na tela de Placar Area,
selecionando dois atletas cadastrados no torneio e tendo o árbitro da área atribuído automaticamente,
para registrar lutas de exibição (super fight, absoluto, demonstração) sem precisar gerar chave oficial,
mantendo a persistência completa de informações de cada atleta (faixa, peso, equipe, categoria inscrita) com uma tag identificadora de "Luta Casada".
```

**Cenários alternativos:**
- Nenhum atleta cadastrado: modal exibe estado vazio e desabilita o botão de criar.
- Mesmo atleta selecionado nos dois lados: validação impede criar a luta.
- Área sem árbitro cadastrado: exibir alerta no modal e bloquear criação.
- Lista de Lutas Casadas: pode ser filtrada por status (pendente / finalizada).

## 4. Requisitos Funcionais

- [ ] RF-01: Na tela `PlacarChaves`, exibir uma seção/botão "Luta Casada" acima (ou ao lado) da grid de chaves, com ícone consistente e label claro.
- [ ] RF-02: Ao clicar, abrir um modal `ModalCriarLutaCasada` com:
  - Select pesquisável para Atleta A (combobox com `loadAthletes`)
  - Select pesquisável para Atleta B (idem)
  - Validação que impede A === B
  - Exibição automática, ao selecionar cada atleta, de: faixa, peso (kg), equipe, categoria inscrita (somente leitura)
  - Botão "Criar Luta Casada" desabilitado até ambos selecionados e válidos
- [ ] RF-03: Ao criar, o sistema persiste um registro `LutaCasada` com:
  - `id` (uuid), `areaId`, `arbitroId` (primeiro árbitro da área, ou `null` se vazio)
  - `atletaAId`, `atletaBId` (refs ao `Atleta`)
  - Snapshot interno: `atletaASnapshot`, `atletaBSnapshot` (nome, faixa, pesoKg, equipe, categoria)
  - `tag: 'luta-casada'`
  - `status: 'pending'`
  - `placarA?`, `placarB?`, `vencedorId?`, `dataFinalizacao?`
  - `createdAt`, `updatedAt`
- [ ] RF-04: Após criar, navegar para a tela de Placar `PlacarLutaCasada` (ou reutilizar `PlacarLuta` com flag) e permitir rodar a luta (timer, painéis A/B, finalizar).
- [ ] RF-05: A `PlacarLutaCasada` exibe no header um Badge "LUTA CASADA" em destaque (cor de contraste, e.g. `grape`).
- [ ] RF-06: Persistir o resultado da Luta Casada (vencedor, placar, status) via IPC `registrar-resultado-luta-casada`.
- [ ] RF-07: Em `PlacarChaves`, listar as Lutas Casadas da área (ordenadas por data de criação desc) com:
  - Card com nomes dos dois atletas, badge de status, botão "Abrir" que navega para a tela de placar.
  - Card permite reabrir uma luta finalizada para visualização (read-only).
- [ ] RF-08: Bloquear criação se a área não tiver nenhum árbitro cadastrado (mostrar aviso no modal).
- [ ] RF-09: Apenas atletas com `emChave !== true` (ou que estejam cadastrados) podem ser selecionados; o filtro é implícito (lista vem de `loadAthletes`).

## 5. Requisitos Não-Funcionais

- **Performance:** Modal abre em < 100ms; selects com busca em lista de até 500 atletas sem lag perceptível.
- **Segurança:** Validação no IPC — backend rejeita `atletaAId === atletaBId` e `areaId` inexistente.
- **Acessibilidade:** Modal com `aria-label`; selects navegáveis por teclado; foco automático no primeiro campo.
- **Compatibilidade:** Mesmo target atual (Electron + React + Mantine).
- **Observabilidade:** Erros de IPC são logados no console do main process e expostos como `console.error` no renderer.

## 6. Análise da Aplicação

- **Arquitetura geral:** Renderer (React + Mantine) ↔ IPC (preload) ↔ Main (handlers em `electron/*.ts`) ↔ `data/<torneioId>/lutasCasadas.json`.
- **Padrões em uso:** JSON por torneio em `electron-store` ou `fs` direto (verificar padrão atual em `areas.ts`). Handlers em `registerXHandlers` no `main.ts`.
- **Fluxo de dados:** Renderer chama `loadAthletes` + `loadAreas` no mount; ao criar, chama `save-luta-casada` que persiste; ao reabrir, chama `load-lutas-casadas-por-area`.
- **Contratos de API (novos):**
  - `load-lutas-casadas-por-area` (areaId) → `LutaCasada[]`
  - `save-luta-casada` (LutaCasada) → `LutaCasada` (com id gerado)
  - `update-luta-casada` (LutaCasada) → `LutaCasada`
  - `delete-luta-casada` (id) → `void`

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/types/lutaCasada.ts` | Criar | Novo tipo `LutaCasada` |
| `src/types/electron.d.ts` | Modificar | Adicionar tipos dos novos IPCs |
| `electron/lutasCasadas.ts` | Criar | Persistência (load/save/update/delete) em JSON por torneio |
| `electron/main.ts` | Modificar | Registrar novos handlers IPC |
| `electron/preload.ts` | Modificar | Expor novos métodos `loadLutasCasadasPorArea`, `saveLutaCasada`, `updateLutaCasada`, `deleteLutaCasada` |
| `src/components/ModalCriarLutaCasada.tsx` | Criar | Modal de criação com 2 selects + snapshots |
| `src/pages/PlacarChaves.tsx` | Modificar | Adicionar seção "Lutas Casadas" + botão "Nova Luta Casada" + listagem |
| `src/pages/PlacarLutaCasada.tsx` | Criar | Reaproveita lógica de `PlacarLuta` com badge "LUTA CASADA" e sem chave |
| `src/App.tsx` | Modificar | Adicionar rota `/admin/placar/luta-casada/:areaId/:lutaCasadaId` |
| `doc/requisitos.md` | Modificar | Adicionar seção 3.22 |
| `doc/spec.md` | Modificar | Adicionar entrada no Histórico de Correções |
| `spec/luta-casada.md` | Criar | Este documento |

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- Reuso de `PlacarLuta`: a página atual depende de `chaveId` e `lutaId`; a Luta Casada não pertence a uma chave. Solução: extrair um componente `Scoreboard` reutilizável ou criar `PlacarLutaCasada` espelhada. **Decisão: criar `PlacarLutaCasada` espelhada para evitar refator grande de `PlacarLuta` neste ciclo.**

### 8.2 Ambiguidades nos Requisitos
- "Arbitro é o que esta na area": `AreaLuta.arbitroIds` é `string[]`. Decisão: usar `arbitroIds[0]` como "árbitro atual" da área. Se vazio, bloquear criação.
- "entre no registro de lutas da chave e do arbitro": interpretado como "registrado dentro do sistema de lutas e árbitros do torneio". Não muda a arquitetura.
- "so precisa do nome dos dois atletas": o usuário digita/seleciona apenas os nomes; os outros campos são auto-preenchidos via snapshot do cadastro.

### 8.3 Riscos
- Refator de `PlacarChaves`: pode introduzir regressão visual. Mitigado por mudanças isoladas (nova seção acima da grid, sem mexer na grid existente).
- Inconsistência de UI com outros modais. Mitigado por seguir o mesmo padrão do `ModalCriarChave` ou similar (verificar padrão existente).

## 9. Critérios de Aceite

- [ ] CA-01: Dado que estou em `PlacarChaves` de uma área com chaves, quando visualizo a tela, então vejo uma seção "Lutas Casadas" com botão "Nova Luta Casada" e a lista de lutas casadas existentes.
- [ ] CA-02: Quando clico em "Nova Luta Casada", o modal abre com dois campos de seleção de atleta.
- [ ] CA-03: Ao selecionar o atleta A, os campos de faixa, peso, equipe e categoria são preenchidos automaticamente (somente leitura).
- [ ] CA-04: O botão "Criar Luta Casada" fica desabilitado enquanto atleta A ou B não estiverem selecionados, ou se forem o mesmo atleta.
- [ ] CA-05: Ao criar a luta casada, sou redirecionado para a tela de placar, e o header exibe o badge "LUTA CASADA".
- [ ] CA-06: Ao finalizar a luta casada, ela volta para a lista em `PlacarChaves` com o status atualizado (e.g. "FINALIZADA") e o resultado registrado.
- [ ] CA-07: Se a área não tiver árbitro cadastrado, o modal exibe um aviso e o botão "Criar" fica desabilitado.
- [ ] CA-08: Lutas casadas persistem ao reiniciar a aplicação (verificar arquivo `data/<torneioId>/lutasCasadas.json`).
- [ ] CA-09: A nova Luta Casada não aparece no `PlacarBracket` da chave oficial (escopo separado).

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Criar tipo LutaCasada
  - O que fazer: definir interface com id, areaId, arbitroId, atletaAId, atletaBId, snapshots, tag, status, placares, vencedor
  - Arquivo(s): src/types/lutaCasada.ts
  - Como validar: compilar sem erros

Passo 2: Persistência backend
  - O que fazer: criar electron/lutasCasadas.ts com loadPorArea, save, update, delete (JSON em data/<torneioId>/lutasCasadas.json)
  - Arquivo(s): electron/lutasCasadas.ts
  - Como validar: funções unitariamente testáveis

Passo 3: Handlers IPC + preload
  - O que fazer: registrar handlers no main.ts e expor métodos no preload.ts; adicionar tipos em electron.d.ts
  - Arquivo(s): electron/main.ts, electron/preload.ts, src/types/electron.d.ts
  - Como validar: tsc compila; window.electronAPI tem os novos métodos

Passo 4: Componente ModalCriarLutaCasada
  - O que fazer: modal com 2 Selects de atletas + cards de snapshot (faixa/peso/equipe/categoria) + validações + alerta de árbitro ausente
  - Arquivo(s): src/components/ModalCriarLutaCasada.tsx
  - Como validar: renderiza; validações funcionam

Passo 5: Modificar PlacarChaves
  - O que fazer: adicionar seção "Lutas Casadas" acima da grid de chaves; carregar lutas casadas por área; botão "Nova Luta Casada" abre o modal
  - Arquivo(s): src/pages/PlacarChaves.tsx
  - Como validar: UI exibe a nova seção; clique no botão abre o modal

Passo 6: Tela PlacarLutaCasada
  - O que fazer: criar página espelhada de PlacarLuta, mas carrega LutaCasada; remove dependência de chave; adiciona Badge "LUTA CASADA" no header; chama updateLutaCasada ao finalizar
  - Arquivo(s): src/pages/PlacarLutaCasada.tsx
  - Como validar: fluxo de criar → placar → finalizar → voltar para PlacarChaves funciona

Passo 7: Roteamento
  - O que fazer: adicionar rota /admin/placar/luta-casada/:areaId/:lutaCasadaId
  - Arquivo(s): src/App.tsx
  - Como validar: navegação funciona

Passo 8: Atualizar documentação
  - O que fazer: adicionar seção 3.22 em requisitos.md e entrada no Histórico de Correções de spec.md
  - Arquivo(s): doc/requisitos.md, doc/spec.md
  - Como validar: seções existem e estão coerentes
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (mudança aditiva, sem breaking changes).
- **Como monitorar:** Verificar que `lutasCasadas.json` é criado; verificar que reabrir o app mantém as lutas casadas; verificar que modal abre/fecha sem erros no console.
- **Plano de rollback:** Remover entradas em `main.ts`/`preload.ts`/`App.tsx`; deletar `lutasCasadas.ts` e `PlacarLutaCasada.tsx` e `ModalCriarLutaCasada.tsx`.

## 12. Definição de Pronto (DoD)

- [x] Todos os critérios de aceite verificados
- [x] Código revisado (auto-revisão documentada)
- [x] Documentação atualizada (spec/luta-casada.md, doc/requisitos.md, doc/spec.md)
- [x] Sem warnings ou erros não tratados introduzidos (lint OK, tsc OK)
- [x] Seção **Histórico de Correções** atualizada em doc/spec.md

---

## Checklist Rápido Antes de Começar a Codar

- [x] Li os itens em **Problemas Encontrados** e os tratei antes de qualquer código novo
- [x] Li os documentos de referência (doc/spec.md, doc/requisitos.md, PlacarChaves, PlacarLuta, types)
- [x] Entendi a história de usuário e o objetivo de negócio
- [x] Identifiquei todos os arquivos envolvidos e os li
- [x] Listei os problemas e impedimentos
- [x] O plano de implementação está em ordem lógica (base → topo)
- [x] Os critérios de aceite são verificáveis
- [x] Sinalizei todas as incertezas explicitamente