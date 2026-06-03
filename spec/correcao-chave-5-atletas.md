## Problema

A geracao de chaves com 5 atletas foi corrigida para usar 6 lutas com resolucao automatica de byes.

### Formato Implementado (Atual)

```
PRIMEIRA RODADA (Rodada 1)
seed1 vs seed2 (Luta 1)
seed3 vs seed4 (Luta 2)
seed5 vs BYE (Luta 3) -> auto-resolvido, seed5 vence

SEGUNDA RODADA (Rodada 2)
vencedor L2 vs seed5 (Luta 4) -> seed5 pre-preenchido na geracao
vencedor L1 vs BYE (Luta 5) -> auto-resolvido quando L1 completa

TERCEIRA RODADA (Rodada 3 - Final)
vencedor L4 vs vencedor L5 (Luta 6) -> Campeao
```

### Fluxo de Propagacao

- Luta 1 completa: vencedor vai para Luta 5 (atletaAId) e Luta 6 (atletaBId)
- Luta 2 completa: vencedor vai para Luta 4 (atletaAId)
- Luta 3: auto-resolvida na geracao (seed5 x BYE, status='wo')
- Luta 4 completa: vencedor vai para Luta 6 (atletaAId)
- Luta 5: auto-resoluida quando Luta 1 completa (vencedor L1 x BYE, status='wo')
- Luta 6 completa: campeao definido

---

## 1. Contexto e Objetivo

- **O que e:** Geracao de chaves de 5 atletas com 6 lutas e resolucao automatica de byes.
- **Por que existe:** Formato com 6 lutas permite visualizacao clara de todas as rodadas no bracket e propagacao direta de vencedores.
- **Quem usa:** Organizadores de torneios que utilizam o sistema de chaves para categorias com exatamente 5 atletas.
- **Escopo:** Apenas a estrutura de chaves de 5 atletas. Nao afeta chaves de 2, 3, 4 ou 16 atletas.

---

## 2. Analise dos Documentos de Referencia

- **doc/requisitos.md (secao 3.11):** Documenta as estruturas por quantidade de atletas. Inclui descricao da chave de 5 atletas com 6 lutas.
- **electron/brackets.ts:** Contem `gerarLutasCinco()` que gera 6 lutas e `advanceWinner5()` que propaga vencedores.
- **src/components/BracketTree.tsx:** Layout customizado `isFiveLayout` com 3 colunas para exibicao visual do bracket.

---

## 3. Historia de Usuario

```
Como organizador de torneio,
quero que chaves com 5 atletas gerem 6 lutas com byes auto-resolvidos,
para que o bracket exiba todas as rodadas e a propagacao de vencedores seja clara.
```

---

## 4. Requisitos Funcionais

- [x] RF-01: O sistema deve gerar chaves de 5 atletas com 6 lutas distribuidas em 3 rodadas
- [x] RF-02: A primeira rodada deve conter 3 lutas: seed1 vs seed2, seed3 vs seed4, seed5 vs BYE
- [x] RF-03: A Luta 3 (seed5 vs BYE) deve ser auto-resolvida com status='wo' na geracao
- [x] RF-04: A segunda rodada deve conter 2 lutas: vencedor(L2) vs seed5, vencedor(L1) vs BYE
- [x] RF-05: A Luta 5 (vencedor(L1) vs BYE) deve ser auto-resolvida quando a Luta 1 completa
- [x] RF-06: A terceira rodada (Final) deve conter 1 luta entre os vencedores das semifinais
- [x] RF-07: A propagacao de vencedores deve funcionar corretamente via advanceWinner5()

---

## 5. Requisitos Nao-Funcionais

- **Compatibilidade:** A mudanca e apenas no algoritmo de geracao; contratos IPC e tipos permanecem inalterados.
- **Performance:** Sem impacto mensuravel (numero de atletas e muito pequeno).
- **Observabilidade:** Notificacoes de geracao de chaves ja existentes continuam funcionando.

---

## 6. Analise da Aplicacao

### Arquitetura geral
- Electron + React: backend IPC em `electron/` e frontend React em `src/`.
- Dados persistidos em JSON do torneio ativo.

### Fluxo de dados para geracao de chaves
1. Frontend chama IPC `gerar-todas-chaves` ou `randomizar-chave`
2. Backend em `electron/brackets.ts` processa: `gerarChave()` → `gerarLutas()` → `gerarLutasCinco()`
3. Resultado salvo no JSON do torneio e retornado ao frontend

### Padroes em uso
- Funcoes puras para geracao de lutas (`gerarLutasCinco`, `gerarLutasTres`, etc.)
- Propagacao especifica via `advanceWinner5()` baseada na ordem da luta

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `electron/brackets.ts` | Modificado | Implementacao de `gerarLutasCinco()` com 6 lutas e `advanceWinner5()` |
| `src/components/BracketTree.tsx` | Modificado | Layout customizado `isFiveLayout` com 3 colunas |
| `doc/requisitos.md` | Modificado | Atualizado secao 3.11 com estrutura de 6 lutas |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Nenhum identificado.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma. O formato esta claramente definido e implementado.

### 8.3 Riscos
- Chaves de 5 atletas existentes (ja geradas) nao serao retroativamente modificadas. Apenas novas geracoes usarao o formato atual.

### 8.4 Layout Visual
- **Solucao implementada:** Layout customizado `isFiveLayout` com 3 colunas: Col1 (Luta1, Luta2, Luta3), Col2 (Luta4, Luta5), Col3 (Luta6 + Campeao). Conexoes visuais claras via `buildConnections()`.
- **Arquivo:** `src/components/BracketTree.tsx` — documentado em `spec/layout-chave-5-atletas.md`.

---

## 9. Criterios de Aceite

- [x] CA-01: Dado um torneio com 5 atletas na mesma categoria, quando gerar chaves, entao o sistema cria 6 lutas em 3 rodadas
- [x] CA-02: Dada uma chave de 5 atletas recem-gerada, quando inspecionar a primeira rodada, entao ela contem 3 lutas (seed1 vs seed2, seed3 vs seed4, seed5 vs BYE)
- [x] CA-03: A Luta 3 e auto-resolvida com status='wo' e vencedorId = seed5
- [x] CA-04: Dada uma chave de 5 atletas, quando registrar resultado da Luta 1, entao o vencedor e propagado para Luta 5 e Luta 6
- [x] CA-05: Dada uma chave de 5 atletas, quando registrar resultado da Luta 2, entao o vencedor e propagado para Luta 4
- [x] CA-06: Dada uma chave de 5 atletas, quando a Luta 4 completa, entao o vencedor e propagado para Luta 6
- [x] CA-07: Dado um bracket de 5 atletas, quando visualizar no BracketTree, entao as colunas sao: [L1,L2,L3] → [L4,L5] → [L6]

---

## 10. Plano de Implementacao (Concluido)

```
Passo 1: Implementar gerarLutasCinco() em electron/brackets.ts
  - Estrutura: 6 lutas com L3 auto-resolvida e L4 com seed5 pre-preenchido
  - Status: Concluido

Passo 2: Implementar advanceWinner5() em electron/brackets.ts
  - Propagacao: L1→L5+L6, L2→L4, L4→L6
  - Status: Concluido

Passo 3: Implementar layout isFiveLayout em BracketTree.tsx
  - 3 colunas com conexoes visuais
  - Status: Concluido

Passo 4: Atualizar doc/requisitos.md
  - Documentar estrutura de 6 lutas
  - Status: Concluido
```

---

## 11. Rollout e Observabilidade

- **Estrategia de entrega:** Deploy direto (nao ha feature flag para geracao de chaves).
- **Como monitorar:** Gerar chaves para uma categoria com 5 atletas e verificar a estrutura resultante.
- **Plano de rollback:** Reverter commits do `gerarLutasCinco` e `advanceWinner5`.

---

## 12. Definicao de Pronto (DoD)

- [x] CA-01 a CA-07 verificados
- [x] Codigo revisado
- [x] Sem warnings ou erros no build
- [x] Documento de requisitos atualizado
