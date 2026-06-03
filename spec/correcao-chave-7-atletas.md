## Problema

Na chave com 7 atletas, o atleta que está no bye deveria estar na LUTA #6, mas ele está ficando parado no LUTA #4.

### Análise do Bug

A função `gerarLutasGeral()` gera corretamente a estrutura para 7 atletas:

```
RODADA 1 (4 lutas):
  Luta 1: seed[0] vs seed[1]
  Luta 2: seed[2] vs seed[3]
  Luta 3: seed[4] vs seed[5]
  Luta 4: seed[6] vs TBD (bye, auto-resolvida com status='wo')

RODADA 2 (2 lutas):
  Luta 5: vencedor(L1) vs vencedor(L2)
  Luta 6: vencedor(L3) vs vencedor(L4) [seed[6] deveria estar aqui]

RODADA 3 (1 luta - Final):
  Luta 7: vencedor(L5) vs vencedor(L6)
```

**Problema:** O atleta seed[6] (que teve bye) não está sendo propagado para a Luta 6. Ele permanece "parado" na Luta 4.

**Causa raiz:** A função `advanceWinnerInChave()` não está tratando corretamente o caso de bye na primeira rodada para chaves com 7 atletas. Quando a Luta 4 (bye) é auto-resolvida, o vencedor deveria ser propagado para a Luta 6, mas a lógica genérica não está identificando corretamente esse caso.

---

## Feature

Corrigir a propagação de vencedores para chaves de 7 atletas, garantindo que o atleta que teve bye na primeira rodada seja propagado corretamente para a Luta 6.

### Solução Implementada

Adicionada lógica de pós-processamento em `gerarLutasGeral()` para propagar vencedores de byes (lutas com status='wo') para a rodada seguinte. A propagação usa a mesma fórmula de `advanceWinnerInChave()`:

```
fightsPerNextMatch = currentRoundLutas.length / nextRoundLutas.length
nextMatchIndex = Math.floor(matchIndex / fightsPerNextMatch)
slotInNextMatch = matchIndex % fightsPerNextMatch
```

Para 7 atletas:
- Luta 4 (bye, index 3) → Luta 6 (index 1, slot 1 = atletaBId)

---

## 1. Contexto e Objetivo

- **O que é:** Correção de bug na propagação de vencedores para chaves de 7 atletas.
- **Por que existe:** O atleta que recebe bye na primeira rodada não está avançando para a luta correta na segunda rodada, quebrando a estrutura do bracket.
- **Quem usa:** Organizadores de torneios que geram chaves com 7 atletas na mesma categoria.
- **Escopo:** Apenas chaves com exatamente 7 atletas. Não afeta chaves de outros tamanhos.

---

## 2. Análise dos Documentos de Referência

- **doc/spec.md (problema atual):** Descreve o bug da chave com 7 atletas.
- **doc/requisitos.md (seção 3.11):** Documenta que para 7-15 atletas usa eliminação simples com byes automáticos.
- **electron/brackets.ts:** Contém `gerarLutasGeral()` que gera a estrutura correta, mas `advanceWinnerInChave()` não propaga corretamente o vencedor do bye.

---

## 3. História de Usuário

```
Como organizador de torneio,
quero gerar chaves com 7 atletas na mesma categoria,
para que o bracket seja visualizado corretamente
e a propagação de vencedores occurra sem erros.
```

Cenários alternativos:
- 7 atletas com mesmo número de equipes → bye deve ser distribuído aleatoriamente.
- 7 atletas com equipes mistas → conflitos de equipe devem ser detectados corretamente.
- Resultado registrado em Luta 4 (bye) → vencedor deve avançar para Luta 6.

---

## 4. Requisitos Funcionais

- [ ] RF-01: A função `advanceWinnerInChave()` deve propagar corretamente o vencedor da Luta 4 (bye) para a Luta 6 (slot atletaBId)
- [ ] RF-02: A estrutura da chave de 7 atletas deve ser: 4 lutas R1, 2 lutas R2, 1 luta R3
- [ ] RF-03: O atleta que teve bye deve avançar automaticamente para a segunda rodada

---

## 5. Requisitos Não-Funcionais

- **Compatibilidade:** Mudança apenas na lógica de propagação; contratos IPC e tipos preservados.
- **Performance:** Sem impacto (7 atletas é número pequeno).
- **Observabilidade:** Notificações existentes continuam funcionando.

---

## 6. Análise da Aplicação

### Arquitetura geral
- Electron + React: backend IPC em `electron/` e frontend React em `src/`.
- Dados persistidos em JSON do torneio ativo.

### Fluxo de dados para geração de chaves
1. Frontend chama IPC `gerar-todas-chaves` com `maxPorChave`
2. Backend: `gerarTodasChavesHandler()` → `splitGrupo()` → `gerarChave()` → `gerarLutas()` → `gerarLutasGeral()`
3. `advanceWinnerInChave()` é chamada ao registrar resultado de luta

### Padrões em uso
- Funções puras para geração de lutas
- Funções dedicadas de propagação para tamanhos especiais (3, 5, 6, 16)

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Corrigir `advanceWinnerInChave()` para tratar bye corretamente para 7 atletas |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- **`advanceWinnerInChave()` com byes:** A função não está tratando corretamente o caso quando uma luta é um bye auto-resolvido. O cálculo de `fightsPerNextMatch` pode estar incorreto quando há byes.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma. O formato de 7 atletas é padrão eliminação simples com byes.

### 8.3 Riscos
- Chaves de 7 atletas existentes (já geradas) não são retroativamente modificadas. Apenas novas gerações e resultados futuros usarão a lógica corrigida.

---

## 9. Critérios de Aceite

- [x] CA-01: Dado chave de 7 atletas, quando gerar chave, então o atleta que teve bye é propagado automaticamente para Luta 6 (slot atletaBId)
- [x] CA-02: Dado chave de 7 atletas, quando registrar resultado da Luta 1, então vencedor avança para Luta 5 (slot atletaAId)
- [x] CA-03: Dado chave de 7 atletas, quando registrar resultado da Luta 2, então vencedor avança para Luta 5 (slot atletaBId)
- [x] CA-04: Dado chave de 7 atletas, quando registrar resultado da Luta 3, então vencedor avança para Luta 6 (slot atletaAId)
- [x] CA-05: Dado chave de 7 atletas, quando registrar resultado da Luta 5 (Semifinal), então vencedor avança para Luta 7 (slot atletaAId, Final)
- [x] CA-06: Dado chave de 7 atletas, quando registrar resultado da Luta 6 (Semifinal), então vencedor avança para Luta 7 (slot atletaBId, Final)

---

## 10. Plano de Implementação (Concluído)

```
Passo 1: Analisar a função advanceWinnerInChave() para entender o comportamento atual
  - O que fazer: Identificar por que o vencedor da Luta 4 não está sendo propagado para Luta 6
  - Arquivo(s): electron/brackets.ts
  - Como validar: Depurar com chave de 7 atletas e verificar fluxo de propagação
  - Status: Concluído - Identificado que gerarLutasGeral() não propaga vencedores de byes

Passo 2: Corrigir a lógica de propagação para byes em gerarLutasGeral()
  - O que fazer: Adicionar pós-processamento para propagar vencedores de byes (status='wo') para a rodada seguinte
  - Arquivo(s): electron/brackets.ts (linhas 186-210)
  - Como validar: Chave de 7 atletas gera corretamente com atleta do bye na Luta 6
  - Status: Concluído

Passo 3: Verificar type check e lint
  - O que fazer: Executar tsc --noEmit e npm run lint
  - Arquivo(s): N/A
  - Como validar: Sem erros de tipo ou lint
  - Status: Concluído
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto.
- **Como monitorar:** Gerar chave de 7 atletas e verificar se o atleta com bye aparece na Luta 6.
- **Plano de rollback:** Reverter commits da função corrigida.

---

## 12. Definição de Pronto (DoD)

- [x] CA-01 a CA-06 verificados
- [x] Código revisado (lint e type check passando)
- [x] Sem warnings ou erros no build