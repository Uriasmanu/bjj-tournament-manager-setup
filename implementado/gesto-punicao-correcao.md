# Correção do Gestos de Punição

## 1. Contexto e Objetivo

- **O que é:** Corrigir a detecção do gesto de punição no sistema de pontuação por gestos via webcam. O gesto de punição segundo a IBJJF é o árbitro elevando o braço à altura do ombro com o punho fechado, e não o braço apontando para baixo.
- **Por que existe:** A implementação atual detecta punição como "braço estendido para baixo" (`isArmPointingDown`), o que está incorreto segundo as regras da IBJJF. Isso causa falsos positivos e não reconhece o gesto correto de punição.
- **Quem usa:** Árbitros que utilizam o sistema de pontuação por gestos via webcam em campeonatos de BJJ.
- **Escopo:** Correção da lógica de detecção de gesto de punição em `gestureDetection.ts`, atualização da documentação de implementação e dos tipos de gesto.

---

## 2. Analise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): confirmado
- **Documento de requisitos** `doc/requisitos.md`: regras de pontuação por gestos
- **Documentação técnica existente** `implementado/gesto-punicao-correcao.md`: este documento
- **Código-fonte relevante:**
  - `src/services/gestureDetection.ts` — função `isArmPointingDown()` incorreta
  - `src/types/gesture.ts` — tipo `GestureType` com `'penalty'`
  - `doc/implementacao-gestos-webcam.md` — descrição incorreta do gesto de punição

---

## 3. Historia de Usuario

```
Como árbitro de campeonato de BJJ,
quero que o gesto de punição seja detectado corretamente quando eu elevo o braço à altura do ombro com o punho fechado,
para que a punição seja registrada no placar de forma precisa e confiável.
```

**Cenários alternativos:**
- Usuário sem permissão de árbitro: gestos de pontuação não devem ser processados (já coberto pelo `bloqueado` check)
- Gesto ambíguo (braço levantado mas dedos abertos): não deve ser classificado como punição, deve ser ignorado ou classificado como outro gesto
- Mão sem braçadeira detectada: o sistema não deve atribuir o gesto a nenhum lado

---

## 4. Requisitos Funcionais

- [ ] RF-01: O sistema deve detectar o gesto de punição quando o braço estiver elevado à altura do ombro com o punho fechado.
- [ ] RF-02: O sistema deve NÃO classificar como punição o gesto de braço apontando para baixo (que não corresponde a nenhuma regra da IBJJF para punição).
- [ ] RF-03: O gesto de punição deve exigir dwell time de 3 segundos antes de ser confirmado.
- [ ] RF-04: Ao confirmar a punição, o sistema deve exibir notificação vermelha "Punição → Atleta X" e incrementar o contador de punições no placar (máximo 4).
- [ ] RF-05: O gesto de punição deve ser detectado apenas na mão que está com a braçadeira (lado do atleta).

---

## 5. Requisitos Nao-Funcionais

- **Performance:** A detecção de punição não deve adicionar latência perceptível ao pipeline de classificação de gestos.
- **Segurança:** O gesto de punição só deve ser processado quando o operador tem permissão de árbitro (bloqueado check já existente).
- **Observabilidade:** Log no console quando punição é detectada, incluindo confiança e lado.

### 5.1 UI/UX Responsivo

- A notificação de punição deve ser legível em todos os breakpoints (mobile, tablet, notebook, desktop).
- O toast de notificação deve ter área mínima de 44x44px em mobile.

---

## 6. Analise da Aplicação

- **Arquitetura geral:** React 18 + TypeScript frontend, Electron desktop, MediaPipe para visão computacional.
- **Padrões em uso:** Hook customizado (`useGestureScoring`), serviço de detecção de gestos (`gestureDetection.ts`), tipos compartilhados (`gesture.ts`).
- **Fluxo de dados:** Câmera → MediaPipe detecta mãos → `classifyGesture()` classifica → `GestureResult` emitido → `useGestureScoring` aplica dwell timer → callback atualiza placar.
- **Contratos de API:** N/A — tudo local, sem backend remoto para detecção de gestos.

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
| --- | --- | --- |
| `src/services/gestureDetection.ts` | Modificar | Substituir `isArmPointingDown()` por `isArmRaisedToShoulderWithFist()` |
| `src/types/gesture.ts` | Manter | Tipo `penalty` já existe, nenhuma mudança necessária |
| `doc/implementacao-gestos-webcam.md` | Modificar | Corrigir descrição do gesto de punição |
| `src/hooks/useGestureScoring.ts` | Manter | Lógica de dwell timer e callback já funciona para qualquer `GestureType` |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos

- A função `isArmPointingDown()` atual detecta braço apontando para baixo, o que pode ter sido confundido com o gesto de punição. A nova função `isArmRaisedToShoulderWithFist()` precisa verificar três condições simultâneas: braço horizontal à altura do ombro, punho fechado e mão na posição correta.

### 8.2 Ambiguidades nos Requisitos

- A definição exata de "altura do ombro" pode variar dependendo da posição da câmera e do árbitro. Pode ser necessário um limiar de tolerância para a posição Y do ombro vs. pulso.

### 8.3 Riscos

- Regressão: a remoção de `isArmPointingDown()` pode afetar algum comportamento existente que dependia dele. Verificar se há testes ou usos desse método.
- Falsos positivos: o gesto de braço levantado com punho fechado pode se parecer com o gesto de "start_fight" em algumas posições. A ordem de verificação em `classifyGesture()` deve priorizar `start_fight` antes de `penalty`.

> ⚠️ Impedimento bloqueante: Nenhum. A correção é isolada e não depende de funcionalidade externa.

---

## 9. Criterios de Aceite

- [ ] CA-01: Dado o árbitro com o braço elevado à altura do ombro e punho fechado por 3 segundos, quando o gesto é detectado, então o tipo `penalty` é emitido com o lado correto.
- [ ] CA-02: Dado o árbitro com o braço apontando para baixo, quando o gesto é detectado, então NÃO é classificado como `penalty`.
- [ ] CA-03: Dado o árbitro com o braço elevado mas dedos abertos, quando o gesto é detectado, então NÃO é classificado como `penalty` (apenas punho fechado conta).
- [ ] CA-04: Dado o gesto de punição confirmado, quando o callback é disparado, então o placar incrementa o contador de punições do atleta correspondente e exibe notificação vermelha.
- [ ] CA-05: Dado o gesto de punição e o gesto de iniciar luta simultaneamente possíveis, quando ambos são detectados, então `start_fight` tem prioridade sobre `penalty` (start_fight é verificado primeiro).

---

## 10. Plano de Implementacao

```
Passo 1: Substituir isArmPointingDown() por isArmRaisedToShoulderWithFist() em src/services/gestureDetection.ts
  - O que fazer: Implementar nova função que verifica: (1) braço horizontal à altura do ombro, (2) punho fechado, (3) confiança adequada.
  - Arquivo(s): src/services/gestureDetection.ts
  - Como validar: Console log da classificação de gestos com árbitro fazendo o gesto correto de punição.

Passo 2: Atetar a ordem de verificação em classifyGesture() para manter start_fight com prioridade sobre penalty.
  - O que fazer: Garantir que isArmRaisedToShoulderWithFist() só é chamada após a verificação de start_fight.
  - Arquivo(s): src/services/gestureDetection.ts
  - Como validar: Verificar que start_fight não é confundido com penalty.

Passo 3: Atualizar doc/implementacao-gestos-webcam.md com a descrição correta do gesto de punição.
  - O que fazer: Corrigir a tabela de gestos e os algoritmos de detecção.
  - Arquivo(s): doc/implementacao-gestos-webcam.md
  - Como validar: Documentação reflete corretamente a regra da IBJJF.

Passo 4: Testar a integração completa.
  - O que fazer: Verificar que o gesto de punição é detectado, confirmado após 3s e atualiza o placar corretamente.
  - Arquivo(s): Todos os envolvidos
  - Como validar: Árbitro faz gesto de punição → 3s → notificação vermelha + punição incrementada no placar.
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto.
- **Como monitorar:** Logs do console `[Gesture]` mostram tipo de gesto detectado e confiança. Verificar que punições são registradas corretamente no placar.
- **Plano de rollback:** Reverter as mudanças em `gestureDetection.ts` e `implementacao-gestos-webcam.md` para a versão anterior.

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite foram verificados
- [ ] Código revisado (lint sem novos erros)
- [ ] Documentação atualizada (`implementacao-gestos-webcam.md`)
- [ ] Sem warnings ou erros não tratados introduzidos
- [ ] Seção Histórico de Correções atualizada em `doc/spec.md` e `doc/fase1-implementacao-correçoes.md`
- [ ] Teste manual confirmado: gesto de punição detectado corretamente