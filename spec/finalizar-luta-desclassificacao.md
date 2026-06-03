# Feature: Finalização de Luta — Habilitar Opções e Segunda Confirmação

> Atualizado em 2026-06-02 (iteração 2) para refletir a ampliação do escopo descrita em `doc/spec.md` (## Problema): todas as opções de finalização devem estar habilitadas, todas devem pedir segunda confirmação, e o modal não deve mostrar qual flag será salva no JSON.

---

## Problema (origem)

Em `PlacarLuta.tsx` o modal "Finalizar Luta" apresenta quatro tipos de resultado (Pontos, Finalização, DQ, Desempate), mas:

1. A opção **DQ** está desabilitada quando nenhum atleta atinge 4 punições, impedindo DQ manual (por exemplo, por **golpe proibido**).
2. Não há uma etapa explícita de **confirmação** antes de persistir o resultado.
3. O modal exibe a frase "O vencedor será marcado com a flag **X** no JSON" — informação de implementação que polui a UI.
4. Não há suporte a uma DQ por **golpe proibido** (motivo previsto pelas regras), embora isso seja semanticamente idêntico à DQ atual.

Regras de negócio que ficam explícitas:
- **Sem dupla desclassificação:** o sistema não trata o caso "ambos DQ". O operador sempre declara um vencedor.
- **DQ pode ser por golpe proibido:** o sistema não distingue o motivo da DQ — qualquer DQ é registrada com `desclassificacao: true` e `status: 'wo'`.

Comportamento esperado:
1. **Todas** as opções de resultado (Pontos, Finalização, DQ, Desempate) devem estar **habilitadas** em qualquer estado da luta.
2. Ao clicar em "Confirmar" no modal "Finalizar Luta", o resultado **não é persistido**; um **modal centralizado de segunda confirmação** aparece.
3. O modal de "Finalizar Luta" **não exibe** qual flag será salva no JSON.
4. Somente após a segunda confirmação o resultado é persistido.

---

## 1. Contexto e Objetivo

- **O que é:** Habilita todas as opções de finalização da luta no modal "Finalizar Luta" e adiciona uma segunda confirmação obrigatória (centralizada) antes de persistir o resultado. Remove do modal a informação de qual flag será salva no JSON.
- **Por que existe:** O operador (árbitro/mesário) precisa poder finalizar uma luta por qualquer motivo previsto nas regras (pontos, finalização, desempate, DQ por punições acumuladas, DQ por golpe proibido, etc.) sem que a UI restrinja opções, e com uma rede de segurança contra cliques acidentais.
- **Quem usa:** Árbitros e operadores do sistema de placar (`PlacarLuta`).
- **Escopo:**
  - **Dentro:**
    - Remover `disabled` de **todos** os radios do Radio.Group "Tipo de resultado" (Pontos, Finalização, DQ, Desempate).
    - Remover os `Alert` que exibem "O vencedor será marcado com a flag X no JSON" no modal "Finalizar Luta".
    - Adicionar um **modal centralizado genérico de segunda confirmação** que aparece ao clicar em "Confirmar" no modal "Finalizar Luta", aplicável a **qualquer** tipo de resultado.
    - O modal de segunda confirmação exibe: tipo de resultado, vencedor, e (somente para DQ) o atleta desclassificado.
  - **Fora:**
    - Não alterar regras de pontuação/punições (4 punições continua exibindo alerta visual "Atleta X Desclassificado" e limite de incremento; continua sendo uma dica visual, não pré-requisito).
    - Não alterar persistência do JSON do torneio (mesmo contrato IPC `registrarResultado`).
    - Não criar nova rota/tela.
    - **Sem regra de dupla desclassificação** — o operador sempre escolhe um vencedor; não há lógica automática de "ambos DQ".

---

## 2. Análise dos Documentos de Referência

- `doc/spec.md` — guia de spec seguido. Iteração 2 amplia o escopo original (apenas DQ) para todas as opções de finalização.
- `doc/requisitos.md:451-470` — seção 3.18 (Placar/Scoreboard) descreve o fluxo "Finalizar Luta" sem impor regras de habilitação por estado.
- `doc/IBJJF.md:255` — cita dupla desclassificação como regra, mas o usuário opta por **não** usá-la.
- `doc/IBJJF.md` (regra geral de golpes proibidos) — DQ por golpe proibido é prevista; semanticamente tratada como uma DQ comum no sistema.
- `src/pages/PlacarLuta.tsx:389-447` — fluxo atual de "Finalizar Luta" (abertura, bifurcação, `persistirResultado`).
- `src/pages/PlacarLuta.tsx:612-654` — Radio.Group do tipo de resultado (alvo das alterações de habilitação).
- `src/pages/PlacarLuta.tsx:668-682` — Alerts de flag no JSON (a serem removidos).
- `src/pages/PlacarLuta.tsx:700-735` — modal de confirmação atual (específico de DQ; será tornado genérico).
- `electron/brackets.ts:525-569` — handler `registrarResultadoHandler` que persiste flags e propaga vencedor.
- `src/types/bracket.ts:10-23` — tipo `Luta` com flags `finalizacao`, `desclassificacao`, `desempateArbitro`.

> Inferência: as regras de `disabled` atuais nos radios (`pontos` desabilitado em empate; `desempate` desabilitado em placares divergentes) foram decisões de implementação e não refletem requisito de negócio. A spec do usuário pede remoção de **todas** essas condições.

---

## 3. História de Usuário

```
Como árbitro/operador do placar,
quero poder escolher qualquer tipo de resultado da luta (Pontos, Finalização, DQ, Desempate) a qualquer momento, sem que a UI restrinja minhas opções, e quero confirmar a escolha em uma segunda etapa centralizada antes de salvar,
para que eu registre o resultado correto da luta por qualquer motivo previsto nas regras (incluindo DQ por golpe proibido), com segurança contra persistência acidental, e sem ver na tela detalhes de implementação (flags do JSON).
```

Cenários alternativos:
- Placar zerado e empate: o operador pode escolher qualquer um dos quatro tipos (regra atual bloqueava "Pontos" em empate — removida).
- Placar divergente: o operador pode escolher "Desempate" mesmo assim (regra atual bloqueava — removida).
- DQ por golpe proibido: o operador escolhe DQ + vencedor, confirma na segunda etapa, e o sistema registra `desclassificacao: true`, `status: 'wo'`.
- Cancelar a segunda confirmação: o modal centralizado é fechado, o resultado **não** é persistido, e o modal "Finalizar Luta" volta acessível com as seleções anteriores.
- Luta inválida (`tbd`/`bye`) ou já finalizada: comportamento existente — controles desabilitados (mantido).

---

## 4. Requisitos Funcionais

- [ ] **RF-01:** Todos os radios do Radio.Group "Tipo de resultado" no modal "Finalizar Luta" devem estar **habilitados em qualquer estado da luta** — Pontos, Finalização, DQ e Desempate perdem qualquer `disabled` condicional.
- [ ] **RF-02:** O modal "Finalizar Luta" **não exibe** os `Alert` que informam "O vencedor será marcado com a flag X no JSON" para nenhum tipo de resultado.
- [ ] **RF-03:** Ao clicar em "Confirmar" no modal "Finalizar Luta" com qualquer tipo de resultado selecionado e um vencedor escolhido, o resultado **não é persistido imediatamente**.
- [ ] **RF-04:** Um **modal centralizado de segunda confirmação** é exibido, contendo:
  - Título: "Confirmar resultado".
  - Texto dinâmico por tipo:
    - `pontos`: "Confirmar vitória por pontos do atleta **[Vencedor]**?"
    - `finalizacao`: "Confirmar vitória por finalização do atleta **[Vencedor]**?"
    - `desclassificacao`: "Confirmar desclassificação do atleta **[Desclassificado]**? Vencedor: **[Vencedor]**."
    - `desempate`: "Confirmar decisão dos árbitros a favor do atleta **[Vencedor]**?"
  - Dois botões: "Cancelar" e "Confirmar" (rótulo do botão "Confirmar" é dinâmico: "Confirmar resultado" para a maioria, "Confirmar desclassificação" para DQ).
- [ ] **RF-05:** O modal de segunda confirmação tem `centered`, `withCloseButton={false}`, `closeOnClickOutside={false}`, `closeOnEscape={false}` — exige decisão explícita.
- [ ] **RF-06:** Botão "Cancelar" no modal de segunda confirmação: fecha o modal, **não** persiste, e reabra o modal "Finalizar Luta" com as seleções anteriores.
- [ ] **RF-07:** Botão "Confirmar" no modal de segunda confirmação: persiste o resultado via `window.electronAPI.registrarResultado` (mesmo contrato) e navega para `/admin/placar/chave/:areaId/:chaveId`.
- [ ] **RF-08:** O sistema **não implementa** regra de dupla desclassificação: se o operador escolher um vencedor, esse é o vencedor; não há lógica de "ambos DQ".
- [ ] **RF-09:** A regra de 4 punições (alerta visual "Atleta X Desclassificado" e limite de incremento) **permanece inalterada** — é dica visual, não pré-requisito.

---

## 5. Requisitos Não-Funcionais

- **Performance:** Nenhuma degradação perceptível — apenas reorganização de estado React local.
- **Segurança:** Confirmação explícita antes de mutar JSON de torneio (evita persistência acidental em todos os tipos de resultado).
- **Acessibilidade:** Modal centralizado com `centered`, foco gerenciado pelo Mantine; texto em português; botão "Cancelar" é o `default` (não destrutivo); botão "Confirmar" é o destrutivo/positivo.
- **Compatibilidade:** Mantine 7 + React 18 (já em uso). Sem novos requisitos de browser/SO.
- **Observabilidade:** Erros no IPC `registrar-resultado` continuam logados via `console.error` (mantido).

---

## 6. Análise da Aplicação

- **Arquitetura:** SPA React 18 + Vite, com Electron como shell desktop. IPC via `window.electronAPI`. Persistência em JSON por torneio.
- **Padrões em uso:**
  - Componentes funcionais com hooks (`useState`, `useDisclosure`, `useEffect`).
  - Modais via `@mantine/core` `Modal` com `centered`.
  - Tema e cores em `src/styles/theme.ts`; aqui usamos cores já existentes (`#fa5252` vermelho, `#1e3a8a` azul anil, `red`/`orange`/`grape` do Mantine).
  - Naming: páginas em `src/pages/*`, componentes em `src/components/*`, tipos em `src/types/*`.
- **Fluxo de dados:**
  - `PlacarLuta` carrega chave/luta via `loadChaves` + `loadAthletes`.
  - Estado local: `placarA`, `placarB`, `resultadoTipo`, `vencedorFinal`, flags de modal.
  - Persistência: `registrarResultado` no `electron/brackets.ts` salva `Luta` com flags e propaga vencedor via `advanceWinnerInChave`.
- **Contrato de API:** Já existente — `registrarResultado` recebe `{ chaveId, lutaId, vencedorId, status, placarA, placarB, finalizacao, desclassificacao, desempateArbitro }` e retorna a `Chave` atualizada. **Sem mudança de contrato.**

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `spec/finalizar-luta-desclassificacao.md` | Atualizar | Este documento: refletir iteração 2 (todas as opções habilitadas, segunda confirmação genérica, sem alerts de flag). |
| `src/pages/PlacarLuta.tsx` | Modificar | (a) Remover `disabled` dos radios `pontos`, `desclassificacao` e `desempate` no Radio.Group "Tipo de resultado". (b) Remover os três blocos `Alert` que mostram a flag que será salva. (c) Tornar o modal de segunda confirmação **genérico** (aplicável a todos os tipos) com texto dinâmico; renomear o disclosure de `confirmarDq` para `confirmarResultado`. (d) Ajustar `handleConfirmarFinalizar` para sempre abrir o modal de segunda confirmação (não só para DQ). |

> Nada mais precisa ser alterado. O backend (`electron/brackets.ts`) e os tipos (`src/types/bracket.ts`) já dão suporte a todas as flags.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- Nenhum bloqueante. Mudança é isolada ao componente `PlacarLuta` e usa primitivos já disponíveis (`Modal`, `centered`, `useDisclosure`).
- O estado `handleAbrirFinalizar` define `resultadoTipo` automaticamente para `desempate` em empate e `pontos` em não-empate. Mantido: o operador pode mudar manualmente.

### 8.2 Ambiguidades nos Requisitos
- **Texto exato do modal de segunda confirmação por tipo:** Definido em RF-04. Ajustável em iteração futura.
- **Rótulo do botão "Confirmar" no modal de segunda confirmação:** Decidido: genérico "Confirmar resultado" exceto para DQ ("Confirmar desclassificação"). Ajustável.
- **Quem é o "atleta desclassificado":** Oposto do vencedor escolhido (semântica atual mantida).

### 8.3 Riscos
- Mudança apenas no frontend. Sem migração de dados, sem mudança de contrato IPC, sem regressão em outros módulos.
- Habilitar `pontos` em empate pode levar a registros "estranhos" (vencedor declarado em empate). Decisão de negócio: confiar no operador; a segunda confirmação reduz cliques acidentais.
- Habilitar `desempate` em placar divergente pode ser usado legitimamente (ex.: lesão durante a luta, decisão arbitral). Decisão de negócio: confiar no operador.

> Nenhum impedimento bloqueante.

---

## 9. Critérios de Aceite

- [ ] **CA-01:** Dado uma luta em qualquer estado (pending/in_progress, com ou sem punições, empate ou não), quando o operador abre o modal "Finalizar Luta", então **todos** os quatro radios (Pontos, Finalização, DQ, Desempate) estão **habilitados** (não há `disabled`).
- [ ] **CA-02:** Dado o modal "Finalizar Luta" aberto, o operador **não vê** nenhum `Alert` do tipo "O vencedor será marcado com a flag X no JSON" para nenhum tipo de resultado.
- [ ] **CA-03:** Dado o modal "Finalizar Luta" aberto com qualquer `resultadoTipo` e um vencedor selecionado, quando o operador clica em "Confirmar", então o resultado **não é persistido** e um **modal centralizado de segunda confirmação** aparece.
- [ ] **CA-04:** O modal de segunda confirmação exibe texto coerente com o tipo de resultado (conforme RF-04) e tem dois botões: "Cancelar" e "Confirmar" (rótulo "Confirmar desclassificação" para DQ).
- [ ] **CA-05:** Dado o modal de segunda confirmação aberto, quando o operador clica em "Cancelar", então o modal é fechado, o resultado **não é persistido** e o modal "Finalizar Luta" continua acessível com as seleções anteriores preservadas.
- [ ] **CA-06:** Dado o modal de segunda confirmação aberto, quando o operador clica em "Confirmar", então o resultado é persistido via `registrarResultado` (com a flag correta por tipo) e a navegação segue para `/admin/placar/chave/:areaId/:chaveId`.
- [ ] **CA-07:** O sistema **não** contém lógica de dupla desclassificação (não há branch que declare empate/DQ mútuo automaticamente).
- [ ] **CA-08:** A regra visual de "Atleta X Desclassificado" ao atingir 4 punições **continua** exibida (não foi removida).

---

## 10. Plano de Implementação (Passo a Passo)

Ordem base → topo. Mudança puramente de UI em um único componente.

```
Passo 1: Atualizar documento de spec
  - O que fazer: Reescrever spec/finalizar-luta-desclassificacao.md com o novo escopo (iteração 2).
  - Arquivo(s): spec/finalizar-luta-desclassificacao.md
  - Como validar: Seções 1–13 coerentes; RF e CA refletem o escopo ampliado; Registro de Correções tem iteração 2.

Passo 2: Habilitar todos os radios de tipo de resultado
  - O que fazer: Em src/pages/PlacarLuta.tsx, remover o atributo `disabled` dos radios com value="pontos", value="desclassificacao" e value="desempate" no Radio.Group "Tipo de resultado".
  - Arquivo(s): src/pages/PlacarLuta.tsx
  - Como validar: Inspecionar visualmente que os 4 radios ficam clicáveis em qualquer estado.

Passo 3: Remover os Alerts de flag
  - O que fazer: Em src/pages/PlacarLuta.tsx, remover os três blocos <Alert> condicionais (desempate, desclassificacao, finalizacao) que exibem "O vencedor será marcado com a flag X no JSON".
  - Arquivo(s): src/pages/PlacarLuta.tsx
  - Como validar: Selecionar cada tipo de resultado no modal — nenhum Alert de flag aparece.

Passo 4: Tornar o modal de segunda confirmação genérico
  - O que fazer: Em src/pages/PlacarLuta.tsx:
    (a) Renomear o disclosure de `confirmarDq` para `confirmarResultado`.
    (b) Tornar o `handleConfirmarFinalizar` sempre abrir o modal de segunda confirmação (não só para DQ).
    (c) Tornar o texto e o rótulo do botão "Confirmar" do modal dinâmicos por tipo (conforme RF-04).
  - Arquivo(s): src/pages/PlacarLuta.tsx
  - Como validar: Para cada tipo de resultado, o modal de segunda confirmação exibe o texto e o rótulo corretos.

Passo 5: Validar com lint e typecheck
  - O que fazer: Rodar npm run lint e npx tsc --noEmit.
  - Arquivo(s): (nenhum — apenas validação)
  - Como validar: Ambos retornam 0.
```

---

## 12. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (mudança interna de UI, sem migração). Sem feature flag.
- **Como monitorar:**
  - Erros em `registrar-resultado` (mantidos em `console.error`).
  - Comportamento do usuário: cancelar vs. confirmar a segunda etapa — observável manualmente.
- **Plano de rollback:** Reverter a alteração em `PlacarLuta.tsx` (volta ao estado anterior, com `disabled` nos radios, alerts de flag e persistência direta).

---

## 13. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite (CA-01 a CA-08) verificados manualmente.
- [ ] Lint (`npm run lint`) passa sem warnings/erros novos.
- [ ] Typecheck (`npx tsc --noEmit`) passa sem erros.
- [ ] Documento de spec (`spec/finalizar-luta-desclassificacao.md`) atualizado e coerente.
- [ ] Nenhuma alteração de contrato no backend ou nos tipos.
- [ ] Regra visual de 4 punições preservada.
- [ ] Nenhuma lógica de dupla desclassificação introduzida.

---

## Registro de Correções (Problema)

> Atualizado conforme os itens em `## Problema` (doc/spec.md).

| Data | Iteração | Correção aplicada |
|------|----------|-------------------|
| 2026-06-02 | 1 | Habilitado o radio de desclassificação em qualquer estado da luta. Adicionado modal centralizado de confirmação específico para DQ exibindo o nome do atleta desclassificado (oposto do vencedor escolhido). |
| 2026-06-02 | 2 | **Ampliação de escopo (conforme atualização de `doc/spec.md`):** removido `disabled` de **todos** os radios de tipo de resultado (Pontos, Finalização, DQ, Desempate). Removidos os `Alert` que exibiam qual flag seria salva no JSON. Modal de segunda confirmação tornado **genérico** (aplicável a todos os tipos), com texto e rótulo do botão "Confirmar" dinâmicos por tipo. Documentada a regra de "sem dupla desclassificação" (o sistema sempre registra um vencedor; não há lógica automática de "ambos DQ"). DQ por golpe proibido passa a ser semanticamente equivalente a qualquer outra DQ (mesma flag `desclassificacao: true`, `status: 'wo'`). |
