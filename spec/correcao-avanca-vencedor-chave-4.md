# Correcao: Vencedor da 2 Luta nao Avanca para Proxima Rodada em Chaves de 4 Atletas

## 1. Contexto e Objetivo

- **O que e:** Correcao na funcao `advanceWinnerInChave` que propaga o vencedor de uma luta para a rodada seguinte em chaves de 4 e 5 atletas. Atualmente, em chaves de 4 atletas, o vencedor da 2 luta (ordem 2, rodada 1) nao e colocado na luta das quartas de final (rodada 2), impedindo que a luta seja iniciada.

- **Por que existe:** A formula de calculo do indice da proxima luta (`pairsPerMatch`) usa `Math.pow(2, targetRodada - luta.rodada - 1)` que resulta em 1 para R1→R2. Com isso, `nextMatchIndex = Math.floor(1 / 1) = 1` para a segunda luta, mas a rodada 2 tem apenas 1 luta (indice 0), entao `nextMatchIndex >= nextRoundLutas.length` retorna true e a funcao aborta sem colocar o vencedor.

- **Quem usa:** Operadores do placar registrando resultados de lutas em chaves de 4 ou 5 atletas.

- **Escopo:** Dentro: correcao da funcao `advanceWinnerInChave` em `electron/brackets.ts`. Fora: chaves de 2, 3 e 16 atletas (possuem handlers especificos separados).

---

## 2. Analise dos Documentos de Referencia

- **Guia de spec** (`doc/spec.md`): este documento segue todas as secoes.
- **Documento de requisitos:** Task descrevendo o problema "em chaves com 4 atletas o vencedor da 2 luta nao esta indo para o card das quartas de final".
- **Codigo-fonte relevante:**
  - `electron/brackets.ts` — funcao `advanceWinnerInChave` linhas 555-584
  - `electron/brackets.ts` — funcao `gerarLutasQuatro` (geracao de chaves de 4 atletas)
  - `electron/brackets.ts` — `registrarResultadoHandler` (ponto de entrada que chama `advanceWinnerInChave`)

---

## 3. Historia de Usuario

```
Como operador do placar do torneio,
quero que ao registrar o resultado da 2 luta da chave de 4 atletas,
o vencedor seja automaticamente colocado na luta das quartas de final,
para que a luta seguinte possa ser iniciada e o bracket reflita o estado real.
```

Cenarios:
- Chave de 4 atletas com 2 lutas na rodada 1: ao finalizar a 1 luta, vencedor vai para atletaA da R2. Ao finalizar a 2 luta, vencedor vai para atletaB da R2.
- Chave de 5 atletas: mesmo handler e logica, deve continuar funcionando (comportamento existente mantido).
- Chave de 3 ou 16 atletas: nao sao afetadas (handlers separados).

---

## 4. Requisitos Funcionais

- [ ] RF-01: Ao registrar resultado da 1 luta (ordem 1, rodada 1) em chave de 4 atletas, o vencedor deve ser colocado em `atletaAId` da luta de rodada 2.
- [ ] RF-02: Ao registrar resultado da 2 luta (ordem 2, rodada 1) em chave de 4 atletas, o vencedor deve ser colocado em `atletaBId` da luta de rodada 2.
- [ ] RF-03: A luta de rodada 2 deve ficar com status `pending` e ambos os slots preenchidos, permitindo ser iniciada.
- [ ] RF-04: Comportamento para chaves de 5 atletas deve ser mantido (sem regressao).

---

## 5. Requisitos Nao-Funcionais

- **Performance:** impacto insignificante — apenas correcao de calculo aritmetico.
- **Seguranca:** nenhuma alteracao.
- **Compatibilidade:** total — a funcao ja e usada apenas para chaves de 4 e 5 atletas.

---

## 6. Analise da Aplicacao

### Arquitetura geral
- **Frontend:** React + Mantine UI, renderer process do Electron
- **Backend:** Electron main process com handlers IPC
- **Persistencia:** JSON em disco

### Fluxo de dados do registro de resultado
1. Renderer (PlacarBracket) → IPC `registrar-resultado` → Main handler (`registrarResultadoHandler`) → `advanceWinnerInChave` → salva JSON → retorna Chave
2. `advanceWinnerInChave` recebe a chave e a luta finalizada, calcula para qual luta da rodada seguinte o vencedor deve ir

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `electron/brackets.ts` | Modificar | Corrigir `advanceWinnerInChave` — formula de calculo do indice da proxima luta e slot |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- A funcao `advanceWinnerInChave` usa formulas baseadas em `Math.pow(2, ...)` que funcionam apenas para brackets com numero de lutas por rodada que dobram/halvam perfeitamente. Para brackets nao-power-of-2 (4, 5 atletas), as formulas precisam usar a razao real entre numero de lutas das rodadas.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma. O comportamento esperado e claro: ambos os vencedores da rodada 1 devem ir para a rodada 2.

### 8.3 Riscos
- Baixo. A funcao so e chamada para chaves de 4 e 5 atletas. Mudanca localizada.

---

## 9. Criterios de Aceite

- [ ] CA-01: Dada uma chave de 4 atletas com 2 lutas na rodada 1, quando a 1 luta tem resultado registrado, entao o vencedor aparece em `atletaAId` da luta de rodada 2.
- [ ] CA-02: Dada uma chave de 4 atletas com 2 lutas na rodada 1, quando a 2 luta tem resultado registrado, entao o vencedor aparece em `atletaBId` da luta de rodada 2.
- [ ] CA-03: Dada uma chave de 4 atletas com ambos os resultados registrados, entao a luta de rodada 2 tem status `pending`, `atletaAId` e `atletaBId` preenchidos com os vencedores.
- [ ] CA-04: Chaves de 3 e 16 atletas continuam funcionando sem alteracao.

---

## 10. Plano de Implementacao (Passo a Passo)

```
Passo 1: Corrigir advanceWinnerInChave em electron/brackets.ts
  - O que fazer: Substituir a logica atual que usa Math.pow(2, ...) por calculo baseado na razao entre numero de lutas da rodada atual e da rodada alvo.
    - Calcular `fightsPerNextMatch` como `currentRoundLutas.length / nextRoundLutas.length`
    - `nextMatchIndex = Math.floor(matchIndex / fightsPerNextMatch)`
    - `slotInNextMatch = matchIndex % fightsPerNextMatch`
    - slotInNextMatch === 0 → atletaAId, slotInNextMatch === 1 → atletaBId
  - Arquivo(s): `electron/brackets.ts`
  - Como validar: Testar registro de resultado em chave de 4 atletas — ambos vencedores devem aparecer na R2

Passo 2: Rodar lint e build para verificar consistencia
  - O que fazer: Executar `npm run build`
  - Como validar: Sem erros nem warnings
```

---

## 11. Rollout e Observabilidade

- **Estrategia de entrega:** Deploy direto.
- **Como monitorar:** N/A — funcionalidade local.
- **Plano de rollback:** Reverter commits.

---

## 12. Definicao de Pronto (DoD)

- [ ] Todos os criterios de aceite foram verificados manualmente
- [ ] Codigo revisado (auto-revisao documentada)
- [ ] Documentacao atualizada (este documento)
- [ ] Sem warnings ou erros no build (`npm run build`)

---

## Checklist Rapido Antes de Comecar a Codar

- [x] Li os documentos de referencia (`doc/spec.md`, `electron/brackets.ts`)
- [x] Entendi a historia de usuario e o objetivo de negocio
- [x] Identifiquei todos os arquivos envolvidos e os li
- [x] Liste os problemas e impedimentos
- [x] O plano de implementacao esta em ordem logica
- [x] Os criterios de aceite sao verificaaveis
- [x] Sinalizei todas as incertezas explicitamente
