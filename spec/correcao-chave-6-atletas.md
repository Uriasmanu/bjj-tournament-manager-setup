## Problema

A geração de chaves com 6 atletas apresenta 3 problemas:

1. **`separarEquipes()`** está hardcoded para n=4 e n=5. Para n=6, usa fallback `[0,1]` vs `[2,3,4]` que é incorreto (o lado B tem 3 índices mas n=6 deveria ter 3+3).
2. **`getTeamConflicts()`** em `GerenciarChaves.tsx` só define `ladoA`/`ladoB` para n=16, n=5 e n=4. Para n=6, cai no fallback `[0]` vs `[1,2]`, que é errado.
3. **`advanceWinner6()`** estava referenciando `ordem 6` (não existe — a final é `ordem 5`) e propagava o vencedor da Luta 3 para a semifinal em vez de para a final. Para 6 atletas, `gerarLutasGeral` gera **5 lutas** (não 6):
   - Luta 1-3 (R1), Luta 4 (R2/Semifinal), Luta 5 (R3/Final)
   - A Luta 3 tem carry-over direto para a final (Luta 5)

## Feature

Corrigir os 3 problemas acima para que chaves de 6 atletas funcionem corretamente: separação de equipes, detecção de conflitos e propagação de vencedores.

Estrutura da chave de 6 atletas (3 rodadas, 5 lutas):

```
RODADA 1 (3 lutas):
  Luta 1: seed[0] vs seed[1]
  Luta 2: seed[2] vs seed[3]
  Luta 3: seed[4] vs seed[5]

RODADA 2 (1 luta + carry-over):
  Luta 4: vencedor(L1) vs vencedor(L2)
  carry-over: vencedor(L3) avança direto para a final

RODADA 3 (1 luta - Final):
  Luta 5: vencedor(L4) vs vencedor(L3)
```

---

## 1. Contexto e Objetivo

- **O que é:** Correção de bugs na geração, visualização e propagação de chaves de 6 atletas.
- **Por que existe:** A chave de 6 atletas cai no caminho genérico (`gerarLutasGeral`) mas as funções auxiliares (`separarEquipes`, `getTeamConflicts`, `advanceWinnerInChave`) não foram adaptadas para esse tamanho.
- **Quem usa:** Organizadores de torneios que geram chaves com 6 atletas na mesma categoria.
- **Escopo:** Apenas chaves com exatamente 6 atletas. Não afeta chaves de outros tamanhos.

---

## 2. Análise dos Documentos de Referência

- **doc/requisitos.md (seção 3.11):** Documenta tamanhos suportados incluindo 6-15 (geral).
- **electron/brackets.ts:** Contém `gerarLutasGeral()` (correta para 6), `separarEquipes()` (hardcoded para 4/5), `advanceWinnerInChave()` (genérica, falha com carry-overs).
- **src/pages/GerenciarChaves.tsx:** `getTeamConflicts()` com sides hardcoded para 16/5/4.
- **src/components/BracketTree.tsx:** Layout genérico (funciona para 6 via `byRodada`).

---

## 3. História de Usuário

```
Como organizador de torneio,
quero gerar chaves com 6 atletas na mesma categoria,
para que o bracket seja visualizado corretamente,
a separação de equipes funcione
e a propagação de vencedores occurra sem erros.
```

Cenários alternativos:
- 6 atletas de mesma equipe → separarEquipes deve distribuir entre lados opostos.
- 6 atletas com equipes mistas → getTeamConflicts deve detectar conflitos corretamente.
- Resultado registrado em Luta 1 → vencedor deve avançar para Luta 4 (não Luta 5).

---

## 4. Requisitos Funcionais

- [x] RF-01: `separarEquipes()` deve dividir 6 atletas em sideA=[0,1,2] e sideB=[3,4,5]
- [x] RF-02: `getTeamConflicts()` deve definir ladoA=[0,1,2] e ladoB=[3,4,5] para n=6
- [x] RF-03: `advanceWinner6()` deve propagar Luta 3 vencedor para Luta 5 (slot atletaBId, carry-over)
- [x] RF-04: Luta 1 vencedor → Luta 4 (slot atletaAId) via advanceWinnerInChave genérica
- [x] RF-05: Luta 2 vencedor → Luta 4 (slot atletaBId) via advanceWinnerInChave genérica
- [x] RF-06: Luta 4 vencedor → Luta 5 (slot atletaAId) via advanceWinnerInChave genérica

---

## 5. Requisitos Não-Funcionais

- **Compatibilidade:** Mudanças em funções internas; contratos IPC e tipos preservados.
- **Performance:** Sem impacto (6 atletas é número pequeno).
- **Observabilidade:** Notificações existentes continuam funcionando.

---

## 6. Análise da Aplicação

### Arquitetura geral
- Electron + React: backend IPC em `electron/` e frontend React em `src/`.
- Dados persistidos em JSON do torneio ativo.

### Fluxo de dados para geração de chaves
1. Frontend chama IPC `gerar-todas-chaves` com `maxPorChave`
2. Backend: `gerarTodasChavesHandler()` → `splitGrupo()` → `gerarChave()` → `gerarLutas()` → `gerarLutasGeral()`
3. `separarEquipes()` é chamada durante randomização (não na geração inicial — `aplicarSeedSorting` é usado)
4. `advanceWinnerInChave()` é chamada ao registrar resultado de luta

### Padrões em uso
- Funções puras para geração de lutas
- Funções dedicadas de propagação para tamanhos especiais (3, 5, 16)

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Corrigir `separarEquipes()` para n=6; adicionar `advanceWinner6()` dedicada |
| `src/pages/GerenciarChaves.tsx` | Modificar | Corrigir `getTeamConflicts()` para n=6 |
| `src/components/BracketTree.tsx` | Verificar | Layout genérico já funciona para 6 — sem alteração necessária |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- **`separarEquipes()` hardcoded:** Linhas 394-395 de `electron/brackets.ts` só tratam n=4 e n=5. Fallback para n=6 usa `[0,1]` vs `[2,3,4]` que é o mapeamento de n=5.
- **`getTeamConflicts()` hardcoded:** Linhas 90-95 de `GerenciarChaves.tsx` só tratam n=16, n=5 e n=4. Fallback para n=6 usa `[0]` vs `[1,2]`.
- **`advanceWinnerInChave()` com carry-overs:** A fórmula `fightsPerNextMatch = currentRoundLutas.length / nextRoundLutas.length` assume que todas as entradas da rodada atual resultam em lutas. Quando há carry-over (rodada com número ímpar de entradas), a razão é incorreta.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma. O formato de 6 atletas é padrão eliminação simples com byes.

### 8.3 Riscos
- Chaves de 6 atletas existentes (já geradas) não são retroativamente modificadas. Apenas novas gerações e resultados futuros usarão a lógica corrigida.

---

## 9. Critérios de Aceite

- [ ] CA-01: Dado 6 atletas de mesma equipe, quando randomizar chave, então `separarEquipes()` distribui 3 para cada lado
- [ ] CA-02: Dado chave de 6 atletas, quando visualizar conflitos de equipe, então `getTeamConflicts()` detecta corretamente atletas da mesma equipe em lados opostos
- [ ] CA-03: Dado chave de 6 atletas, quando registrar resultado da Luta 1, então vencedor avança para Luta 4 (slot atletaAId)
- [ ] CA-04: Dado chave de 6 atletas, quando registrar resultado da Luta 2, então vencedor avança para Luta 4 (slot atletaBId)
- [ ] CA-05: Dado chave de 6 atletas, quando registrar resultado da Luta 3, então vencedor avança para Luta 5 (slot atletaBId, carry-over)
- [ ] CA-06: Dado chave de 6 atletas, quando registrar resultado da Luta 4 (Semifinal), então vencedor avança para Luta 5 (slot atletaAId, Final)
- [ ] CA-07: Dado chave de 6 atletas, quandoBracketTree renderiza, então exibe 3 colunas (R1: 3 lutas, R2: 1 luta, R3: 1 luta + campeão)

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Corrigir separarEquipes() para n=6
  - O que fazer: Adicionar caso n=6: sideA=[0,1,2], sideB=[3,4,5]
  - Arquivo(s): electron/brackets.ts (linhas 394-395)
  - Como validar: Chave de 6 atletas com mesma equipe distribui corretamente

Passo 2: Adicionar advanceWinner6() em electron/brackets.ts
  - O que fazer: Criar função dedicada que trata APENAS o carry-over da Luta 3 → Luta 5 (atletaBId). As demais propagações são tratadas pela advanceWinnerInChave genérica.
  - Arquivo(s): electron/brackets.ts
  - Como validar: registrarResultadoHandler usa advanceWinner6 para totalAtletas === 6

Passo 3: Integrar advanceWinner6 no registrarResultadoHandler
  - O que fazer: Adicionar caso `chave.totalAtletas === 6` que chama advanceWinner6 E advanceWinnerInChave (a dedicada trata carry-over, a genérica trata demais)
  - Arquivo(s): electron/brackets.ts (linha ~795)
  - Como validar: Resultado de luta em chave de 6 propaga corretamente

Passo 4: Corrigir getTeamConflicts() para n=6
  - O que fazer: Adicionar caso total === 6: ladoA=[0,1,2], ladoB=[3,4,5]
  - Arquivo(s): src/pages/GerenciarChaves.tsx (linhas 90-95)
  - Como validar: Conflitos de equipe detectados corretamente para chave de 6

Passo 5: Verificar layout BracketTree.tsx
  - O que fazer: Confirmar que layout genérico (byRodada) funciona para 6 atletas
  - Arquivo(s): src/components/BracketTree.tsx
  - Como validar: Bracket de 6 atletas renderiza com 3 colunas corretas

Passo 6: Atualizar doc/requisitos.md
  - O que fazer: Documentar correção na seção 3.11
  - Arquivo(s): doc/requisitos.md
  - Como validar: Documento reflete a correção
```

---

## 12. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto.
- **Como monitorar:** Gerar chave de 6 atletas e registrar resultados em sequência.
- **Plano de rollback:** Reverter commits das funções corrigidas.

---

## 13. Definição de Pronto (DoD)

- [ ] CA-01 a CA-08 verificados
- [ ] Código revisado
- [ ] Sem warnings ou erros no build
- [ ] Documento de requisitos atualizado
