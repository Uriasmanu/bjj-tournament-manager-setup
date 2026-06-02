# Spec: Busca em Chaves, Atletas, Árbitros e Equipes + Correção de Acúmulo de chaveIds

## 1. Contexto e Objetivo

- **O que é:** Adição de campo de busca textual nas telas de Chaves, Atletas, Árbitros, Equipes e Torneios, permitindo filtrar os registros exibidos por nome/texto. Correção do bug que acumula `chaveIds` nos árbitros ao regenerar chaves.
- **Por que existe:** (1) Não há nenhuma forma de buscar/filtrar dados nas telas, obrigando o usuário a percorrer listas manualmente. (2) Ao clicar em "Gerar Novamente", as chaves são substituídas mas os `chaveIds` dos árbitros não são limpos, causando discrepância entre o número real de chaves (158) e o exibido por árbitro (196, 202 etc).
- **Quem usa:** Administradores do torneio que gerenciam chaves, atletas, árbitros, equipes e torneios.
- **Escopo:** Adição de `TextInput` com `search` do Mantine nas 5 telas + correção do acúmulo de `chaveIds` em `autoAtribuirArbitros`.

## 2. Documentos de Referência

- `doc/spec.md` — Guia de especificação
- `src/pages/AdminArbitros.tsx` — Tela de árbitros
- `src/pages/AdminAthletes.tsx` — Tela de atletas (usa `AthleteTable`)
- `src/components/AthleteTable.tsx` — Tabela de atletas
- `src/pages/Equipes.tsx` — Tela de equipes
- `src/pages/GerenciarChaves.tsx` — Tela de chaves
- `src/pages/ListarTorneios.tsx` — Tela de torneios
- `electron/brackets.ts` — Lógica de geração de chaves e atribuição de árbitros

## 3. História de Usuário

Como administrador do torneio,
quero buscar por nome/texto em todas as listas principais (chaves, atletas, árbitros, equipes)
e quero que o número de chaves atribuídas aos árbitros seja sempre preciso,
para que eu encontre rapidamente o que preciso e confie nas informações exibidas.

## 4. Requisitos Funcionais

### Busca

- [x] RF-01: A tela de árbitros deve ter um campo de busca que filtre por nome, equipe e faixa
- [x] RF-02: A tela de atletas deve ter um campo de busca que filtre por nome, equipe e categoria
- [x] RF-03: A tela de equipes deve ter um campo de busca que filtre por nome da equipe
- [x] RF-04: A tela de chaves deve ter um campo de busca que filtre por título da chave (faixa, peso, atletas)
- [x] RF-05: A tela de torneios deve ter um campo de busca que filtre por nome do torneio e data

### Correção

- [x] RF-06: Ao regenerar chaves, os `chaveIds` de todos os árbitros devem ser limpos antes da reatribuição automática
- [x] RF-07: A atribuição manual de árbitro (`atribuirArbitroHandler`) deve continuar funcionando corretamente

## 5. Requisitos Não-Funcionais

- **Performance:** Filtro client-side O(n) — não há necessidade de paginação para o volume esperado
- **Usabilidade:** Campo de busca com ícone de lupa, preferencialmente usando `TextInput` do Mantine com `search` type
- **Compatibilidade:** Mesma stack existente (React + Mantine + TypeScript)

## 6. Análise da Aplicação

### Bug do Acúmulo de chaveIds

**Causa raiz:** `autoAtribuirArbitros()` em `electron/brackets.ts` (linhas 133-163):

1. `gerarTodasChavesHandler()` cria novas chaves com novos UUIDs e sobrescreve `torneio.chaves`
2. Chama `autoAtribuirArbitros(torneio)` que itera sobre as chaves e árbitros
3. A função cria `usage` map para balanceamento mas **nunca limpa** `arbitro.chaveIds`
4. Como as novas chaves têm IDs diferentes, `if (!best.chaveIds.includes(chave.id))` é sempre true
5. Os IDs velhos permanecem e os novos são adicionados — acúmulo infinito

**Impacto:** Um árbitro que deveria ter ~8 chaves após 3 regenerações pode aparecer com 24+.

### Fluxo de busca

1. Usuário digita no campo de busca
2. Estado `searchQuery` é atualizado via `useState`
3. `useMemo` filtra a lista original mantendo a ordenação
4. Componente renderiza apenas os itens filtrados

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Limpar `chaveIds` dos árbitros antes de reatribuir em `autoAtribuirArbitros` |
| `src/pages/AdminArbitros.tsx` | Modificar | Adicionar campo de busca |
| `src/pages/AdminAthletes.tsx` | Modificar | Adicionar campo de busca |
| `src/pages/Equipes.tsx` | Modificar | Adicionar campo de busca |
| `src/pages/GerenciarChaves.tsx` | Modificar | Adicionar campo de busca |
| `src/pages/ListarTorneios.tsx` | Modificar | Adicionar campo de busca |

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

Nenhum. As mudanças são localizadas e aditivas.

### 8.2 Ambiguidades nos Requisitos

Nenhuma.

### 8.3 Riscos

- **Bug fix:** Risco baixo — a limpeza de `chaveIds` no início de `autoAtribuirArbitros` é segura pois os IDs das chaves atuais em `torneio.chaves` são os únicos válidos
- **Busca:** Risco mínimo — apenas filtra a exibição, não altera dados

## 9. Critérios de Aceite

- [x] CA-01: Dado 50 árbitros cadastrados, quando digitar "joão" no campo de busca, então devem aparecer apenas os árbitros com "joão" no nome, equipe ou faixa
- [x] CA-02: Dado 100 atletas cadastrados, quando digitar "gracie" no campo de busca, então devem aparecer apenas atletas com "gracie" no nome ou equipe
- [x] CA-03: Dado 20 equipes, quando digitar "team" no campo de busca, então devem aparecer apenas equipes com "team" no nome
- [x] CA-04: Dado 158 chaves geradas, quando digitar "preta" no campo de busca, então devem aparecer apenas chaves cujo título contenha "preta"
- [x] CA-05: Dado 20 torneios cadastrados, quando digitar "julho" no campo de busca, então devem aparecer apenas torneios com "julho" no nome ou data
- [x] CA-06: Dado um torneio com chaves geradas e árbitros atribuídos, quando clicar em "Gerar Novamente", então o `chaveIds` de cada árbitro deve conter apenas IDs de chaves que existem atualmente

## 10. Plano de Implementação

### Passo 1: Corrigir acúmulo de chaveIds (bug)

**O que fazer:** No início de `autoAtribuirArbitros()`, limpar `chaveIds` de todos os árbitros antes de reatribuir.

**Arquivo:** `electron/brackets.ts` — função `autoAtribuirArbitros`

**Como validar:** Após regenerar chaves, o número de `chaveIds` de cada árbitro deve ser igual ao número de chaves que ele arbitra atualmente.

### Passo 2: Adicionar busca em AdminArbitros.tsx

**O que fazer:** Adicionar `TextInput` de busca + `useMemo` para filtrar árbitros por nome/equipe/faixa.

### Passo 3: Adicionar busca em AdminAthletes.tsx

**O que fazer:** Adicionar `TextInput` de busca + `useMemo` para filtrar atletas por nome/equipe/categoria.

### Passo 4: Adicionar busca em Equipes.tsx

**O que fazer:** Adicionar `TextInput` de busca + `useMemo` para filtrar equipes por nome.

### Passo 5: Adicionar busca em GerenciarChaves.tsx

**O que fazer:** Adicionar `TextInput` de busca + `useMemo` para filtrar chaves por título.

**Arquivo:** `src/pages/GerenciarChaves.tsx`

### Passo 6: Adicionar busca em ListarTorneios.tsx

**O que fazer:** Adicionar `TextInput` de busca + `useMemo` para filtrar torneios por nome e data.

**Arquivo:** `src/pages/ListarTorneios.tsx`

## 11. Rollout e Observabilidade

- **Estratégia:** Deploy direto
- **Rollback:** Reverter arquivos modificados
