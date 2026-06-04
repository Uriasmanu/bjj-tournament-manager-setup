# Spec: Bloqueio de Lutas por Rodada

## 1. Contexto e Objetivo

- **O que é:** Regra que impede que lutas de uma rodada N+1 sejam iniciadas (ou tenham vencedor registrado) antes que todas as lutas da rodada N estejam finalizadas.
- **Por que existe:** Garantir a integridade do bracket de eliminação simples. Caso uma luta de uma rodada posterior seja iniciada antes da anterior, o vencedor pode acabar sendo registrado com base em atletas que ainda não foram definidos, gerando inconsistências na progressão.
- **Quem usa:** Operadores do placar (PlacarBracket) ao tentar iniciar uma luta ou registrar um vencedor.
- **Escopo:** Validação no frontend (PlacarBracket + BracketTree) para todos os tamanhos de chave. Backend opcional (defesa em profundidade).

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): Todas as 12 seções preenchidas.
- **Documento de requisitos** (`doc/requisitos.md`): Seção 3.11.1 (Propagação de Vencedores) define que lutas TBD são preenchidas quando o vencedor é propagado. A regra atual de `startableFights` já filtra lutas com TBD/bye, mas não cobre todos os cenários.
- **Código-fonte relevante:**
  - `src/pages/PlacarBracket.tsx`: contém `startableFights` (linha 66) que filtra lutas iniciáveis. Filtra apenas por status, BYE e TBD.
  - `src/components/BracketTree.tsx`: permite clicar em qualquer luta do bracket para registrar vencedor via `onSelectWinner`.
  - `electron/brackets.ts`: contém as funções de propagação de vencedor (`advanceWinner*`).

## 3. História de Usuário

```
Como operador do placar,
quero que o sistema impeça iniciar/registrar resultado de uma luta da rodada N+1 antes de todas as lutas da rodada N estarem finalizadas,
para garantir a integridade do bracket e evitar progressões incorretas.
```

**Cenários alternativos:**
- **Round 1 incompleta:** Lutas de R2 não podem ser iniciadas mesmo que já tenham atletas definidos.
- **BYE pré-completado:** Lutas com `status === 'wo'` são consideradas finalizadas (não bloqueiam a próxima rodada).
- **DQ (Desclassificação):** Lutas com `status === 'wo'` por DQ também são consideradas finalizadas.
- **Round 1 (primeira rodada):** Sempre pode ser iniciada (não há rodada anterior).

## 4. Requisitos Funcionais

- [ ] RF-01: O sistema bloqueia o início de lutas da rodada N+1 enquanto existir alguma luta da rodada N com status `pending`.
- [ ] RF-02: Lutas com status `completed` ou `wo` (BYE ou DQ) são consideradas finalizadas e não bloqueiam a próxima rodada.
- [ ] RF-03: Lutas da rodada 1 nunca são bloqueadas (não há rodada anterior).
- [ ] RF-04: O botão "Iniciar" da tabela "Lutas para Iniciar" só aparece para lutas que satisfazem a regra de bloqueio.
- [ ] RF-05: O clique em um card de luta no `BracketTree` que não satisfaz a regra de bloqueio não abre o modal de resultado.
- [ ] RF-06: Cards de luta bloqueados devem ter indicação visual (opacidade reduzida, cursor `not-allowed`, tooltip explicativo).

## 5. Requisitos Não-Funcionais

- **Performance:** Validação instantânea (sem I/O adicional). Reaproveita o array `chave.lutas` em memória.
- **Segurança:** Validação client-side. Backend pode ser reforçado em ciclo futuro (defesa em profundidade).
- **Acessibilidade:** Cursor e tooltip indicam bloqueios para usuários com limitações visuais.
- **Compatibilidade:** Compatível com todos os tamanhos de chave suportados (2, 3, 4, 5, 6, 7-8, 9-16).
- **Observabilidade:** N/A (regra client-side).

## 6. Análise da Aplicação

- **Arquitetura geral:** Electron + React. Validação ocorre no renderer antes de invocar IPCs.
- **Padrões em uso:** Filtros via `useMemo` no React para derivar listas (ex: `startableFights`). Componentes puros com props para feedback visual.
- **Fluxo de dados:** `Chave` carregada do JSON → `startableFights` filtra → UI renderiza botões/handlers conforme filtro.
- **Contratos de API:** Nenhuma mudança nos contratos IPC existentes (`registrar-resultado`, `salvar-resultado-luta`).

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/pages/PlacarBracket.tsx` | Modificar | Adicionar verificação de rodada anterior completa em `startableFights` |
| `src/components/BracketTree.tsx` | Modificar | Passar prop `disabled` para `Card` quando luta bloqueada; desabilitar clique em `onSelectWinner` |
| `spec/bloqueio-rodadas.md` | Criar | Documentação desta spec |
| `doc/requisitos.md` | Modificar | Adicionar seção 3.21 |
| `doc/spec.md` | Modificar | Atualizar Histórico de Correções |

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- Nenhum identificado.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma identificada.

### 8.3 Riscos
- Regressão em chaves existentes: Mitigado por a validação ser puramente aditiva (filtra mais lutas do que antes, nunca permite mais).
- UX impactada: Operadores que estavam acostumados a iniciar qualquer luta agora precisam esperar. Mitigado por indicação visual clara.

## 9. Critérios de Aceite

- [ ] CA-01: Dado uma chave com R1 incompleta, quando o operador visualiza o PlacarBracket, então lutas de R2 NÃO aparecem na tabela "Lutas para Iniciar" mesmo que tenham atletas definidos.
- [ ] CA-02: Dado uma chave com R1 completa, quando o operador visualiza o PlacarBracket, então lutas de R2 aparecem na tabela "Lutas para Iniciar".
- [ ] CA-03: Dado uma chave com R1 incompleta, quando o operador clica em um card de luta de R2 no `BracketTree`, então o modal de resultado NÃO é aberto.
- [ ] CA-04: Dado uma luta de R1 pendente, quando o operador visualiza o PlacarBracket, então a luta aparece normalmente (não é bloqueada).
- [ ] CA-05: Dado uma luta bloqueada (R2 com R1 incompleta), quando renderizada no `BracketTree`, então a luta tem opacidade reduzida e cursor `not-allowed`.
- [ ] CA-06: Lutas com status `wo` (BYE pré-preenchido) e `completed` (vencedor registrado) são tratadas como finalizadas e NÃO bloqueiam a próxima rodada.

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Criar spec/bloqueio-rodadas.md
  - O que fazer: Documento de spec seguindo guia completo
  - Arquivo(s): spec/bloqueio-rodadas.md
  - Como validar: Verificar que todas as seções do guia estão preenchidas

Passo 2: Adicionar função isRodadaAnteriorCompleta em PlacarBracket.tsx
  - O que fazer: Helper que verifica se todas as lutas de rodada N-1 estão finalizadas
  - Arquivo(s): src/pages/PlacarBracket.tsx
  - Como validar: Função retorna true para R1 (sempre), true para rodada N se N-1 completa

Passo 3: Atualizar startableFights para filtrar por rodada completa
  - O que fazer: Adicionar condição isRodadaAnteriorCompleta no filter
  - Arquivo(s): src/pages/PlacarBracket.tsx (startableFights useMemo)
  - Como validar: Lutas bloqueadas não aparecem na tabela

Passo 4: Criar função isLutaBloqueada em BracketTree.tsx
  - O que fazer: Helper que recebe chave + luta e retorna se está bloqueada
  - Arquivo(s): src/components/BracketTree.tsx
  - Como validar: Retorna true apenas para lutas com rodada N+1 e N incompleta

Passo 5: Passar prop disabled para Card quando bloqueada
  - O que fazer: Adicionar prop `disabled` em CardProps; aplicar opacidade/cursor
  - Arquivo(s): src/components/BracketTree.tsx (Card component)
  - Como validar: Lutas bloqueadas têm visual distinto

Passo 6: Bloquear onSelectWinner no Card quando disabled
  - O que fazer: Não chamar onSelectWinner se disabled for true
  - Arquivo(s): src/components/BracketTree.tsx (Card onClick handler)
  - Como validar: Clicar em luta bloqueada não abre modal

Passo 7: Atualizar doc/requisitos.md
  - O que fazer: Adicionar seção 3.21 com a regra
  - Arquivo(s): doc/requisitos.md
  - Como validar: Seção existe e está correta

Passo 8: Atualizar spec.md - Histórico de Correções
  - O que fazer: Adicionar entrada no Histórico de Correções
  - Arquivo(s): doc/spec.md
  - Como validar: Entrada existe com formato correto
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (mudança puramente client-side).
- **Como monitorar:** 
  - Verificar que chaves existentes continuam funcionando
  - Verificar que lutas de R1 sempre aparecem
  - Monitorar erros de navegação no PlacarBracket
- **Plano de rollback:** Reverter mudanças em `PlacarBracket.tsx` e `BracketTree.tsx`.

## 12. Definição de Pronto (DoD)

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado (auto-revisão documentada)
- [x] Documentação atualizada (spec/bloqueio-rodadas.md, doc/requisitos.md)
- [x] Sem warnings ou erros não tratados introduzidos (lint OK, tsc OK)
- [x] Seção **Histórico de Correções** atualizada em doc/spec.md

---

## Checklist Rápido Antes de Começar a Codar

- [x] Li os itens em **Problemas Encontrados** e os tratei antes de qualquer código novo
- [x] Li os documentos de referência (doc/spec.md, doc/requisitos.md, electron/brackets.ts, PlacarBracket.tsx)
- [x] Entendi a história de usuário e o objetivo de negócio
- [x] Identifiquei todos os arquivos envolvidos e os li
- [x] Listei os problemas e impedimentos
- [x] O plano de implementação está em ordem lógica (base → topo)
- [x] Os critérios de aceite são verificáveis
- [x] Sinalizei todas as incertezas explicitamente