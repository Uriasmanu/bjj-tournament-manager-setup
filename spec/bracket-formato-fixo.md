# Spec: Formato Fixo do Bracket (Pirâmide Deitada 3-2-1)

## 1. Contexto e Objetivo

- **O que é:** Correção no componente BracketTree.tsx para que o bracket SEMPRE exiba o formato fixo de pirâmide deitada (3 cards na primeira coluna, 2 na segunda, 1 na terceira), independentemente dos dados reais de lutas.
- **Por que existe:** Atualmente apenas a Rodada 1 (primeira coluna) tem o número de cards forçado para 3. As rodadas 2 e 3 usam os dados como estão, podendo exibir um número incorreto de cards (ex: 1 card na rodada 2 quando deveriam ser 2), quebrando a consistência visual do bracket.
- **Quem usa:** Administradores do torneio visualizando o bracket de chaves.
- **Escopo:** Apenas a correção visual do número de cards por coluna no BracketTree. Não afeta dados de chaves/lutas, lógica de geração de bracket, ou outras telas.

## 2. Documentos de Referência

- `doc/spec.md` — Guia de especificação (seção ## Problema)
- `spec/placar.md` — Spec do fluxo de placar (já implementado)
- `src/components/BracketTree.tsx` — Componente a ser corrigido

## 3. História de Usuário

Como administrador do torneio,
quero que o bracket exiba sempre o formato de pirâmide deitada (3, 2, 1),
para que a visualização da chave seja consistente e profissional independentemente dos dados.

## 4. Requisitos Funcionais

- [ ] RF-01: O sistema deve exibir exatamente 3 cards na primeira coluna (Rodada 1) do bracket
- [ ] RF-02: O sistema deve exibir exatamente 2 cards na segunda coluna (Rodada 2) do bracket
- [ ] RF-03: O sistema deve exibir exatamente 1 card na terceira coluna (Rodada 3/Final) do bracket
- [ ] RF-04: Se houver mais lutas que o número fixo, o sistema deve truncar (slice) para o número esperado
- [ ] RF-05: Se houver menos lutas que o número fixo, o sistema deve preencher com placeholders ("A definir") até atingir o número esperado

## 5. Requisitos Não-Funcionais

- **Performance:** Alteração puramente visual, sem impacto mensurável (operações em arrays pequenos)
- **Compatibilidade:** Mesma stack (React + Mantine + TypeScript), sem novas dependências
- **Manutenibilidade:** Lógica genérica por índice da coluna, não hardcoded por número de rodada

## 6. Análise da Aplicação

### Arquitetura

A correção é isolada ao componente `BracketTree.tsx` (camada de apresentação). Nenhuma outra camada é afetada.

### Fluxo de dados

1. `PlacarBracket` carrega `Chave` com `lutas[]`
2. `BracketTree` recebe `chave` via props
3. `groupByRound()` agrupa lutas por rodada → `allRounds[][]`
4. Se `allRounds` tiver mais de 3 colunas, faz `slice(-3)` → `rounds[][]` (apenas as 3 últimas rodadas)
5. `rounds.map()` renderiza cada round como uma coluna flex com número fixo de cards (3, 2, 1)
6. Coluna "Campeão" lê o vencedor de `allRounds[allRounds.length - 1]` (rodada real final, não a truncada)

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/components/BracketTree.tsx` | Modificar | Generalizar lógica de padding/truncamento para TODAS as rodadas (não apenas rodada 1) |
| `spec/bracket-formato-fixo.md` | Criar | Documentar a correção conforme guia de spec |

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- Nenhum. A alteração é localizada e não afeta outros componentes.

### 8.2 Ambiguidades nos Requisitos

- Nenhuma. O formato 3-2-1 está explicitamente definido no `## Problema` do `doc/spec.md`.

### 8.3 Riscos

- Nenhum. A correção não altera dados, apenas a apresentação visual.

## 9. Critérios de Aceite

- [ ] CA-01: Dado um bracket com 4+ lutas na Rodada 1, quando renderizado, exibe exatamente 3 cards na primeira coluna
- [ ] CA-02: Dado um bracket com 3+ lutas na Rodada 2, quando renderizado, exibe exatamente 2 cards na segunda coluna
- [ ] CA-03: Dado um bracket com 2+ lutas na Rodada 3, quando renderizado, exibe exatamente 1 card na terceira coluna
- [ ] CA-04: Dado um bracket com menos de 3 lutas na Rodada 1, quando renderizado, preenche com placeholders até ter 3 cards
- [ ] CA-05: Dado um bracket com menos de 2 lutas na Rodada 2, quando renderizado, preenche com placeholders até ter 2 cards
- [ ] CA-06: Dado um bracket com 0 lutas na Rodada 3, quando renderizado, exibe 1 card placeholder

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Limitar colunas a no máximo 3 (slice das últimas 3)
  - O que fazer: Renomear `rounds` para `allRounds` e criar `rounds = allRounds.length > 3 ? allRounds.slice(-3) : allRounds`.
    A coluna Campeão usa `allRounds[allRounds.length - 1]` para ler o vencedor real.
  - Arquivo(s): src/components/BracketTree.tsx
  - Como validar: Brackets com 4+ rodadas exibem no máximo 3 colunas de luta

Passo 2: Generalizar lógica de padding/truncamento para todas as colunas
  - O que fazer: Substituir o bloco `if (roundNum === 1)` por uma lógica genérica usando
    `expectedCounts[roundIndex]` com fallback, aplicando a todas as rodadas.
  - Arquivo(s): src/components/BracketTree.tsx
  - Como validar: Cada coluna exibe exatamente 3, 2, 1 cards respectivamente
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto. Alteração puramente visual e isolada.
- **Como monitorar:** Inspeção visual do bracket em qualquer chave com 3 rodadas.
- **Plano de rollback:** Reverter o commit.

## 12. Definição de Pronto (DoD)

- [ ] Código compila sem erros de TypeScript
- [ ] Bracket exibe sempre 3-2-1 cards
- [ ] Placeholders funcionam para todos os rounds (não apenas rodada 1)
- [ ] Truncamento funciona para todos os rounds (não apenas rodada 1)
