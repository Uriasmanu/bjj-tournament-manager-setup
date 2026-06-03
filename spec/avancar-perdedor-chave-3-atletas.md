# Feature: Avanço do Perdedor em Chaves de 3 Atletas

> Documento de especificação seguindo o guia em `doc/spec.md`.

---

## Problema (origem)

**Regra exclusiva para chaves com o total de 3 atletas:** quando acabar a primeira luta, deve ser gerada a luta seguinte que é **atleta perdedor** × **atleta que estava na chave com bye**.

Atualmente o sistema sempre avança o **vencedor** para a próxima rodada via `advanceWinnerInChave`, o que está incorreto para chaves de 3 atletas. O perdedor da primeira luta deve ocupar a vaga `tbd` na segunda luta contra o atleta que teve bye.

---

## 1. Contexto e Objetivo

- **O que é:** Correção da lógica de avanço de lutas em chaves com exatamente 3 atletas. O perdedor da primeira luta (rodada 1) avança para enfrentar o atleta que estava com bye na segunda luta (rodada 2), em vez do vencedor.
- **Por que existe:** Regra de negócio específica do BJJ para chaves de 3 atletas. O vencedor da primeira luta é considerado campeão da chave (ou aguarda), enquanto o perdedor ganha uma segunda chance contra o atleta de bye para definir 2º e 3º lugar.
- **Quem usa:** Árbitros e operadores do placar que registram resultados em chaves de 3 atletas.
- **Escopo:**
  - **Dentro:**
    - Alterar `registrarResultadoHandler` em `electron/brackets.ts` para que em chaves de 3 atletas, ao finalizar a luta de rodada 1, o **perdedor** avance para a luta de rodada 2 (slot `tbd`) contra o atleta de bye.
    - Garantir que a função `clearWinnerFromLaterRounds` também funcione corretamente ao re-registrar resultados em chaves de 3 atletas.
  - **Fora:**
    - Nenhuma alteração no frontend (`PlacarLuta.tsx`, `PlacarBracket.tsx`, `BracketTree.tsx`).
    - Nenhuma alteração na geração de chaves (`gerarLutasTres` permanece igual — já cria os slots corretamente).
    - Nenhuma alteração em chaves de 2, 4 ou 5 atletas.
    - Sem mudança de contrato IPC ou tipos.

---

## 2. Análise dos Documentos de Referência

- `doc/spec.md` — guia de spec seguido.
- `doc/requisitos.md:451-470` — seção 3.18 descreve fluxo de placar; menciona que o vencedor é propagado via `advanceWinnerInChave`, mas não especifica a exceção para 3 atletas.
- `electron/brackets.ts:525-569` — handler `registrarResultadoHandler` que persiste resultado e chama `advanceWinnerInChave`.
- `electron/brackets.ts:494-523` — função `advanceWinnerInChave` que sempre avança o vencedor.
- `electron/brackets.ts:476-493` — função `clearWinnerFromLaterRounds` que limpa vencedor anterior de rodadas seguintes.
- `electron/brackets.ts:77-82` — função `gerarLutasTres` que cria Luta 1 (seed1 vs seed2) e Luta 2 (tbd vs seed3).

---

## 3. História de Usuário

```
Como operador do placar,
quando registro o resultado da primeira luta em uma chave de 3 atletas,
quero que o perdedor avance para enfrentar o atleta que estava com bye na luta seguinte,
para que a chave siga o formato correto de competição de BJJ com 3 atletas.
```

Cenário alternativo:
- Chave com 2, 4 ou 5 atletas: comportamento inalterado (vencedor avança normalmente).
- Re-registro de resultado (trocar vencedor): `clearWinnerFromLaterRounds` limpa o slot, e a lógica de 3 atletas aplica o novo perdedor corretamente.

---

## 4. Requisitos Funcionais

- [ ] **RF-01:** Em chaves com `totalAtletas === 3`, ao registrar resultado de uma luta de `rodada === 1`, o **perdedor** (atleta oposto ao vencedor) deve ser inserido no slot `tbd` da luta de `rodada === 2`.
- [ ] **RF-02:** Em chaves com `totalAtletas !== 3`, o comportamento permanece inalterado — o vencedor avança via `advanceWinnerInChave`.
- [ ] **RF-03:** Ao re-registrar um resultado (trocar vencedor) em chave de 3 atletas, `clearWinnerFromLaterRounds` limpa o slot corretamente, e o novo perdedor é avançado.
- [ ] **RF-04:** Nenhuma alteração na função `advanceWinnerInChave` — ela continua sendo chamada para todos os casos, mas para chaves de 3 atletas o efeito é sobrescrito pela lógica de avanço do perdedor.

---

## 5. Requisitos Não-Funcionais

- **Performance:** Sem impacto mensurável — apenas uma condicional adicional no handler IPC.
- **Segurança:** Sem alteração de autorização ou validação.
- **Observabilidade:** Erros continuam logados via `console.error` no frontend. O backend propaga exceções normalmente.

---

## 6. Análise da Aplicação

- **Arquitetura:** Electron + React 18 + Vite. Backend IPC em `electron/brackets.ts`. Persistência em JSON de torneio.
- **Padrões em uso:** Handlers IPC registrados em `registerBracketHandlers`. Dados de torneio carregados/salvos via `loadTorneio`/`saveTorneio`.
- **Fluxo de dados:**
  1. Frontend chama `window.electronAPI.registrarResultado` com dados da luta.
  2. Backend `registrarResultadoHandler` carrega torneio, encontra chave/luta.
  3. Se havia vencedor anterior diferente, chama `clearWinnerFromLaterRounds`.
  4. Persiste resultado na luta.
  5. Chama `advanceWinnerInChave` (avança vencedor para rodada seguinte).
  6. **NOVO:** Se `chave.totalAtletas === 3 && luta.rodada === 1`, sobrescreve: avança **perdedor** no lugar do vencedor.
  7. Salva torneio e retorna chave atualizada.
- **Contrato de API:** `registrarResultado` — sem mudanças.

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Adicionar lógica de avanço do perdedor em chaves de 3 atletas dentro de `registrarResultadoHandler`. |
| `spec/avancar-perdedor-chave-3-atletas.md` | Criar | Este documento de spec. |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- Nenhum bloqueante. A mudança é localizada em `registrarResultadoHandler`.
- `advanceWinnerInChave` é chamada primeiro e depois sobrescrita — isso é intencional para manter o fluxo padrão e adicionar a exceção sem modificar a função existente.

### 8.2 Ambiguidades nos Requisitos

- **Comportamento quando a luta de rodada 1 é WO:** Aplica-se a mesma regra — o perdedor (atleta que levou WO) avança contra o bye. Confirmado: WO tem vencedor definido, então o oposto é o perdedor.

### 8.3 Riscos

- Baixo. Mudança isolada a uma condicional em um handler IPC.
- Nenhuma regressão esperada em chaves de 2, 4 ou 5 atletas (a condicional verifica `totalAtletas === 3`).
- Nenhuma mudança de UI, contrato IPC ou tipos.

---

## 9. Critérios de Aceite

- [ ] **CA-01:** Dada uma chave com 3 atletas, quando a luta 1 (rodada 1) é finalizada com vencedor `atletaA`, então a luta 2 (rodada 2) deve ter `atletaAId = atletaB` (perdedor) e `atletaBId = posicoes[2]` (bye).
- [ ] **CA-02:** Dada uma chave com 3 atletas, quando a luta 1 é finalizada com vencedor `atletaB`, então a luta 2 deve ter `atletaAId = atletaA` (perdedor) e `atletaBId = posicoes[2]` (bye).
- [ ] **CA-03:** Dada uma chave com 2, 4 ou 5 atletas, quando qualquer luta é finalizada, o vencedor avança normalmente (comportamento inalterado).
- [ ] **CA-04:** Dada uma chave de 3 atletas com resultado já registrado, quando o operador re-registra trocando o vencedor, então o novo perdedor é avançado para a luta 2 (o slot é limpo e preenchido corretamente).
- [ ] **CA-05:** O contrato IPC `registrarResultado` permanece idêntico (request e response sem mudanças).

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Criar documento de spec
  - O que fazer: Escrever spec/avancar-perdedor-chave-3-atletas.md
  - Arquivo(s): spec/avancar-perdedor-chave-3-atletas.md
  - Como validar: Documento completo com todas as seções do guia doc/spec.md.

Passo 2: Implementar lógica de avanço do perdedor em registrarResultadoHandler
  - O que fazer: Em electron/brackets.ts, dentro de registrarResultadoHandler, após advanceWinnerInChave,
    adicionar condicional: se chave.totalAtletas === 3 && luta.rodada === 1,
    então encontrar a luta da rodada 2, remover o vencedor que foi avançado,
    e inserir o perdedor no slot tbd.
  - Arquivo(s): electron/brackets.ts
  - Como validar: Testar fluxo completo — registrar resultado em chave de 3 atletas
    e verificar que o perdedor aparece na luta seguinte.

Passo 3: Validar com lint e typecheck
  - O que fazer: Rodar npm run lint.
  - Arquivo(s): (nenhum — apenas validação)
  - Como validar: Lint retorna 0.
```

---

## 12. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (mudança localizada no backend, sem migração de dados). Sem feature flag.
- **Como monitorar:** Verificar visualmente no bracket que o perdedor avança corretamente em chaves de 3 atletas.
- **Plano de rollback:** Reverter a alteração em `electron/brackets.ts`.

---

## 13. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite (CA-01 a CA-05) verificados.
- [ ] Lint (`npm run lint`) passa sem warnings/erros novos.
- [ ] Typecheck (`npx tsc --noEmit`) passa sem erros.
- [ ] Documento de spec (`spec/avancar-perdedor-chave-3-atletas.md`) criado e coerente.
- [ ] Nenhuma alteração de contrato IPC ou tipos.
- [ ] Comportamento de chaves de 2, 4 e 5 atletas inalterado.

---

## Registro de Correções (Problema)

| Data | Iteração | Correção aplicada |
|------|----------|-------------------|
| 2026-06-03 | 1 | Implementação inicial: lógica de avanço do perdedor em chaves de 3 atletas em `registrarResultadoHandler`. |
