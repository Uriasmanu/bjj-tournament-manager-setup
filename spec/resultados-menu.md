# Spec: Resultados — Tela com Tudo do Torneio

## 1. Contexto e Objetivo

- **O que é:** Nova rota `/admin/resultados` que exibe uma visão consolidada de **todos os dados do torneio ativo** carregados de `torneio.json`. O card "Resultados" do Dashboard (atualmente `status: 'planned'`) passa a `status: 'implemented'` com a rota.
- **Por que existe:** Centralizar a visualização de resultados/classificação/medalhistas em uma única tela, sem precisar navegar entre Placar, Equipes e Chaves.
- **Quem usa:** Admin/organizador do torneio, ao final da competição para conferência e premiação.
- **Escopo:**
  - Dentro: Tela com abas/seções de Classificação por Chave, Medalhistas, Lutas Casadas, Equipes e Árbitros.
  - Fora: Exportação PDF/Excel, ranking ponderado por tipo de vitória, filtros por área.

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): todas as 12 seções preenchidas.
- **Documento de requisitos** (`doc/requisitos.md`):
  - Seção 3.19 (Placar): fluxo de resultados.
  - Seção 3.22 (Luta Casada): tipo `LutaCasada` a ser exibido.
  - Seção 3.11/3.20 (Geração de Chaves): estrutura `Chave`, `Luta` com `vencedorId`.
- **Código-fonte relevante:**
  - `src/pages/Dashboard.tsx:24` — card "Resultados" com `status: 'planned'`, sem `route`.
  - `src/pages/ListarTorneios.tsx` — referência de listagem com Table, search e Modal.
  - `src/pages/Equipes.tsx` — referência de resumo agregado por chave.
  - `src/pages/PlacarChaves.tsx` — referência de listagem mista com badges de status.
  - `src/types/tournament.ts` — `Torneio` com `atletas`, `arbitros`, `chaves`, `areas`, `lutasCasadas`.
  - `electron.d.ts:21` — `getActiveTournament(): Promise<Torneio | null>` já existe.

## 3. História de Usuário

```
Como admin/organizador do torneio,
quero acessar uma tela "Resultados" no menu (Dashboard) que mostra tudo o que está salvo no torneio.json,
para consultar de forma centralizada a classificação por chave, medalhistas (1º/2º/3º), lutas casadas, equipes e árbitros, sem ter que navegar entre várias telas.
```

**Cenários alternativos:**
- Nenhum torneio ativo: tela exibe estado vazio com mensagem e link para criar torneio.
- Chave sem vencedor final: exibida como "Em andamento", sem medalhista.
- Atletas com 2 BYEs (sem luta): não devem aparecer como medalhistas.

## 4. Requisitos Funcionais

- [ ] RF-01: No `Dashboard.tsx`, alterar o card "Resultados" para `status: 'implemented'` e `route: '/admin/resultados'`.
- [ ] RF-02: Criar a página `src/pages/Resultados.tsx` que carrega o torneio via `window.electronAPI.getActiveTournament()`.
- [ ] RF-03: A página exibe Tabs (Mantine) com: `Visão Geral`, `Chaves`, `Lutas Casadas`, `Equipes`, `Árbitros`, `Atletas`.
- [ ] RF-04: **Visão Geral**: cards com contadores (atletas, chaves, lutas casadas finalizadas, áreas, árbitros) e medalhistas (1º/2º/3º) por chave encerrada.
- [ ] RF-05: **Chaves**: tabela com colunas `Categoria`, `Atletas`, `Status` (EM ANDAMENTO / ENCERRADO / PENDENTE), `Vencedor`.
- [ ] RF-06: **Lutas Casadas**: lista de todas as lutas casadas da área (ou todas as áreas) com nomes, status, vencedor.
- [ ] RF-07: **Equipes**: tabela agrupada por equipe com contagem de atletas e medalhas (1º/2º/3º) agregadas.
- [ ] RF-08: **Árbitros**: tabela com nome, faixa, equipe e total de lutas (chave + casada) que atuou.
- [ ] RF-09: **Atletas**: tabela paginada com nome, equipe, faixa, peso, categoria, chave (se houver) e status na chave.
- [ ] RF-10: Adicionar rota `/admin/resultados` em `src/App.tsx`.
- [ ] RF-11: Empty state quando não houver torneio ativo ou o torneio estiver vazio.

## 5. Requisitos Não-Funcionais

- **Performance:** Carregamento inicial < 200ms (dados já estão em memória após `getActiveTournament`). Listas com paginação para > 100 atletas.
- **Segurança:** Apenas leitura — sem mutações. Nenhuma escrita em disco.
- **Acessibilidade:** Tabs navegáveis por teclado; badges com `aria-label` quando relevante.
- **Compatibilidade:** Mesmo target atual (Electron + React + Mantine 7).
- **Observabilidade:** N/A (somente leitura).

## 6. Análise da Aplicação

- **Arquitetura geral:** Renderer (React + Mantine) → IPC `getActiveTournament` → retorna `Torneio` completo.
- **Padrões em uso:** `useEffect` + `useState` para carregar; `useMemo` para agregações; `PageLayout` com header padrão; tabelas com `Table striped highlightOnHover`; busca com `TextInput` + `IconSearch`.
- **Fluxo de dados:** `getActiveTournament()` → render direto sem transformação adicional (o JSON já vem pronto).
- **Contratos de API:** Nenhum novo contrato. Reuso de `getActiveTournament`.

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/pages/Resultados.tsx` | Criar | Nova página com Tabs e visualização de todos os dados |
| `src/pages/Dashboard.tsx` | Modificar | Card "Resultados" passa a implemented + route |
| `src/App.tsx` | Modificar | Adicionar rota `/admin/resultados` |
| `spec/resultados-menu.md` | Criar | Este documento |
| `doc/requisitos.md` | Modificar | Adicionar seção 3.23 |
| `doc/spec.md` | Modificar | Adicionar entrada no Histórico de Correções |

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- Paginação de atletas: usar `Table` com scroll interno ou `Pagination` do Mantine. Decisão: usar `Table` com `maxHeight` + scroll para manter simples; atletas são tipicamente < 500 por torneio.

### 8.2 Ambiguidades nos Requisitos
- "Tudo do torneio.json": interpretado como todos os campos do tipo `Torneio` (atletas, chaves, lutas casadas, areas, arbitros). A spec inclui também abas de equipes (resumo) e classificação (medalhistas).
- "Medalhistas": para chaves com N ≥ 4 atletas: 1º (vencedor final), 2º (perdedor da final), 3ºs (perdedores das semifinais, em caso de chave com 2 perdedores na semifinal). Para chaves com 2-3 atletas: apenas 1º e 2º.
- "Classificação por chave": lista todas as chaves com vencedor ou "em andamento".

### 8.3 Riscos
- Performance ao renderizar muitas tabelas: mitigado por Tabs (apenas a aba ativa é renderizada via lazy).
- Regressão visual no Dashboard: mínimo, apenas uma string de mudança.

## 9. Critérios de Aceite

- [ ] CA-01: No Dashboard, o card "Resultados" está clicável e navega para `/admin/resultados`.
- [ ] CA-02: A página `/admin/resultados` carrega o torneio ativo e exibe as abas.
- [ ] CA-03: Aba "Visão Geral" mostra contadores e medalhistas (1º/2º/3º quando aplicável).
- [ ] CA-04: Aba "Chaves" lista todas as chaves com status e vencedor.
- [ ] CA-05: Aba "Lutas Casadas" lista todas as lutas casadas com vencedor quando finalizadas.
- [ ] CA-06: Aba "Equipes" lista equipes com totais e medalhas agregadas.
- [ ] CA-07: Aba "Árbitros" lista árbitros com total de lutas (chave + casada).
- [ ] CA-08: Aba "Atletas" lista todos os atletas com chave e status.
- [ ] CA-09: Quando não há torneio ativo, a página exibe estado vazio com mensagem e link para criar torneio.

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Habilitar card no Dashboard
  - O que fazer: src/pages/Dashboard.tsx — alterar entry de "Resultados" para status: 'implemented' e adicionar route
  - Arquivo(s): src/pages/Dashboard.tsx
  - Como validar: card clicável navega para /admin/resultados

Passo 2: Adicionar rota
  - O que fazer: src/App.tsx — adicionar import e rota
  - Arquivo(s): src/App.tsx
  - Como validar: rota funciona

Passo 3: Criar página Resultados com abas
  - O que fazer: src/pages/Resultados.tsx com Tabs (Visão Geral, Chaves, Lutas Casadas, Equipes, Árbitros, Atletas)
  - Arquivo(s): src/pages/Resultados.tsx
  - Como validar: navega e exibe dados

Passo 4: Implementar Visão Geral
  - O que fazer: contadores + lista de medalhistas por chave encerrada
  - Arquivo(s): src/pages/Resultados.tsx
  - Como validar: contadores corretos e medalhistas aparecem

Passo 5: Implementar Chaves
  - O que fazer: tabela com categoria, atletas, status, vencedor
  - Arquivo(s): src/pages/Resultados.tsx
  - Como validar: todas chaves listadas

Passo 6: Implementar Lutas Casadas
  - O que fazer: lista com nomes, status, vencedor
  - Arquivo(s): src/pages/Resultados.tsx
  - Como validar: lista exibida

Passo 7: Implementar Equipes
  - O que fazer: agregado por equipe com atletas e medalhas
  - Arquivo(s): src/pages/Resultados.tsx
  - Como validar: totais corretos

Passo 8: Implementar Árbitros
  - O que fazer: lista com contagem de lutas (chave + casada)
  - Arquivo(s): src/pages/Resultados.tsx
  - Como validar: contagem correta

Passo 9: Implementar Atletas
  - O que fazer: tabela com nome, equipe, faixa, peso, categoria, chave
  - Arquivo(s): src/pages/Resultados.tsx
  - Como validar: todos atletas listados

Passo 10: Atualizar documentação
  - O que fazer: adicionar seção 3.23 em requisitos.md e entrada no Histórico de spec.md
  - Arquivo(s): doc/requisitos.md, doc/spec.md
  - Como validar: seções existem
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (mudança aditiva, sem breaking changes).
- **Como monitorar:** Verificar que `/admin/resultados` carrega em < 1s; verificar contagens e medalhistas estão corretos.
- **Plano de rollback:** Reverter `src/pages/Resultados.tsx`, `src/pages/Dashboard.tsx` e `src/App.tsx`.

## 12. Definição de Pronto (DoD)

- [x] Todos os critérios de aceite verificados
- [x] Código revisado (auto-revisão documentada)
- [x] Documentação atualizada (spec/resultados-menu.md, doc/requisitos.md, doc/spec.md)
- [x] Sem warnings ou erros não tratados introduzidos (lint OK, tsc OK)
- [x] Seção **Histórico de Correções** atualizada em doc/spec.md

---

## Checklist Rápido Antes de Começar a Codar

- [x] Li os itens em **Problemas Encontrados** e os tratei antes de qualquer código novo
- [x] Li os documentos de referência (doc/spec.md, doc/requisitos.md, Dashboard.tsx, ListarTorneios.tsx, Equipes.tsx, PlacarChaves.tsx)
- [x] Entendi a história de usuário e o objetivo de negócio
- [x] Identifiquei todos os arquivos envolvidos e os li
- [x] Listei os problemas e impedimentos
- [x] O plano de implementação está em ordem lógica (base → topo)
- [x] Os critérios de aceite são verificáveis
- [x] Sinalizei todas as incertezas explicitamente
