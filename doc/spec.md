# spec.md — Template de Feature

NÃO alterar os comentario e NÃO apagar algo, apenas adicione suas observaçoes e atualize o documento `spec/{nome-da-feature}.md` caso seja implementado uma nova regra de negocio. Permitido melhorar a descrição e titulo do problema aberto, ao final do ciclo atualize requisitos.md

---

## Problemas Encontrados
<!-- Ao iniciar qualquer ciclo, a IA deve: ler todos os itens [aberto], corrigir, mover para Histórico de Correções e atualizar os RF/CA/Passos afetados. -->

<!--
### [aberto] Título curto do problema
**Comportamento atual:** o que está acontecendo de errado.
**Comportamento esperado:** o que deveria acontecer.
**Escopo:** onde no código isso precisa ser resolvido (geração, exibição, ambos...).
-->
### [aberto] demora muito tempo para abrir o acord em chave dentro de resultados
## Histórico de Correções
### [aberto] Encontre algum lugar em chave e visao geral dentro de resultados, para colocar qual area de luta é a chave
### [aberto] quando for a opção area, quando clicar em voltar da tela de selecionar area, não pode voltar para dashbord e sim para central de torneio. Administrador continua normal

### [2026-06-08] Corrigido: Modal de seleção Admin/Área ao iniciar torneio com navegação restrita
**Problema:** Ao clicar em "Iniciar" em um torneio, o sistema iniciava direto no modo administrador, sem opção de modo área. Operadores de área de luta podiam acessar funções administrativas (atletas, árbitros, chaves, etc.), arriscando alterar configurações do torneio.

**Correção aplicada:**
- `electron/tournament.ts`: `start-tournament` agora aceita `{ id, mode }` com `'admin' | 'area'`; adicionado IPC `get-tournament-mode` que lê o modo do `torneio-ativo.json`
- `electron/preload.ts`: `startTournament(id, mode)` e `getTournamentMode()` expostos
- `src/types/electron.d.ts`: tipagens atualizadas
- `src/pages/ListarTorneios.tsx`: `handleStart` substituído por modal com duas opções (Administrador / Área de Luta); Admin → Dashboard, Área → PlacarMenu
- `src/utils/TournamentModeContext.tsx`: novo contexto React que carrega o modo via IPC
- `src/components/AreaGuard.tsx`: novo componente que redireciona rotas admin restritas para `/admin/placar` no modo área
- `src/App.tsx`: rotas administrativas envolvidas em `<AreaGuard>`; rotas públicas (MenuInicial, Dashboard, Placar, Resultados) permanecem acessíveis
- `src/pages/Dashboard.tsx`: sidebar e cards filtrados — no modo área exibe apenas Resultados e Placar

**RF/CA/Passos afetados:** Nenhum (comportamento admin inalterado).

### [2026-06-08] Corrigido: Fluxo multi-área (export/import distribuído) já suportado pelo sistema
**Problema:** O sistema precisava estar preparado para o workflow onde o torneio é configurado na máquina mestre, distribuído para máquinas de cada área via export/import, cada área opera o Placar independentemente, e ao final todos os exports são consolidados em uma única máquina via import com merge.

**Comportamento esperado:** O sistema já suporta este fluxo desde que o merge por `updatedAt` individual seja aplicado a todos os sub-arrays (inclusive chaves e lutasCasadas), o que foi garantido pela correção anterior (`mergeById` em vez de `mergeByIdForceWinner`). Nenhuma alteração de código adicional foi necessária.

**Verificação:** Documentado em `spec/workflow-multi-area.md`. O `loadChavesPorArea` já filtra chaves por área, e o merge por `updatedAt` individual garante que apenas os itens efetivamente modificados em cada máquina sejam atualizados na consolidação.

**RF/CA/Passos afetados:** RF 3.3 (merge), RF 3.19 (Placar por área).

### [2026-06-08] Corrigido: Ordenação de chaves em Resultados não priorizava "EM ANDAMENTO" abaixo de "ENCERRADO"
**Problema:** Em `src/pages/Resultados.tsx`, a ordenação das chaves na aba "Chaves" apenas separava "ENCERRADO" do resto, sem distinguir "EM ANDAMENTO" de "PENDENTE". O esperado é: encerradas no topo, seguidas por em andamento, e pendentes por último.

**Correção aplicada em `src/pages/Resultados.tsx`:**
- `chavesFiltradas` (useMemo): sort alterado de comparação binária (encerrado vs não-encerrado) para ordenação por prioridade numérica: ENCERRADO=0, EM ANDAMENTO=1, PENDENTE=2.

**RF/CA/Passos afetados:** Nenhum (correção de exibição, não quebra contrato).

### [2026-06-08] Corrigido: Import de torneio ignorava updatedAt individual de chaves e lutasCasadas
**Problema:** O handler `import-tournament` usava `mergeByIdForceWinner` para `chaves` e `lutasCasadas`, que decidia o vencedor da mesclagem pelo `updatedAt` do torneio pai (incoming wins ou existing wins, todos os itens de uma vez), em vez do `updatedAt` individual de cada item. Isso contradizia a regra de last-write-wins por item que já era aplicada a `atletas`, `arbitros` e `areas`.

**Correção aplicada em `electron/tournament.ts`:**
- `mergeByIdForceWinner<Chave>` alterado para `mergeById<Chave>` (linha 291)
- `mergeByIdForceWinner<LutaCasada>` alterado para `mergeById<LutaCasada>` (linha 292)
- Ambos os sub-arrays agora respeitam o `updatedAt` individual de cada item (last-write-wins por item), consistente com os demais sub-arrays.

**RF/CA/Passos afetados:** RF 3.3 — sub-array chaves e lutasCasadas atualizados para usar `updatedAt` individual (texto do requisito.md ajustado).
<!-- ZONA DA IA: a IA preenche após cada ciclo. -->

### [2026-06-08] Corrigido: updatedAt de Luta e Chave não era populado no fluxo do placar
**Problema:** Os campos `updatedAt` das interfaces `Luta` e `Chave` eram declarados como obrigatórios nos tipos TypeScript, mas nunca eram populados em nenhum ponto do código — nem na criação (`criarLuta`, `gerarChave`), nem na normalização retroativa (`normalizeLuta`, `normalizeChave`), nem durante o registro de resultados (`registrarResultadoHandler`), randomização (`randomizarChaveHandler`), atribuição de árbitro (`atribuirArbitroHandler`), limpeza de rodadas futuras (`clearWinnerFromLaterRounds`) ou importação (`importChavesFromFile`).

**Correção aplicada em `electron/brackets.ts`:**
- `criarLuta()`: adicionado `updatedAt: new Date().toISOString()` no objeto retornado
- `gerarChave()`: adicionado `updatedAt: new Date().toISOString()` no objeto retornado
- `normalizeLuta()`: adicionado `updatedAt: (luta.updatedAt as string) ?? new Date().toISOString()`
- `normalizeChave()`: adicionado `updatedAt: (chave.updatedAt as string) ?? new Date().toISOString()`
- `registrarResultadoHandler()`: adicionado `luta.updatedAt` + loop em todas as lutas da chave + `chave.updatedAt` após modificações
- `clearWinnerFromLaterRounds()`: adicionado `l.updatedAt` em cada luta modificada
- `randomizarChaveHandler()`: adicionado `chave.updatedAt`
- `atribuirArbitroHandler()`: adicionado `chave.updatedAt`
- `importChavesFromFile()`: adicionado `updatedAt` em chaves e lutas importadas

**RF/CA/Passos afetados:** Nenhum (correção de bug, não nova feature).

### [2026-06-08] Corrigido: Chaves encerradas devem continuar acessiveis apesar de opacas
**Problema:** No `PlacarChaves.tsx`, chaves com status "encerrado" (última rodada com vencedor) tinham `onClick={undefined}`, `tabIndex={-1}` e `cursor: 'default'`, impedindo o usuário de navegar para ver o bracket e resultados da chave encerrada.

**Comportamento esperado:** Chaves encerradas devem permanecer visualmente opacas (`opacity: 0.5`) mas ainda clicáveis, permitindo navegar para a tela do bracket e visualizar resultados finais.

**Correção aplicada em `src/pages/PlacarChaves.tsx`:**
- `tabIndex` sempre `0` (removido condicional `isEncerrado ? -1 : 0`)
- `cursor` sempre `'pointer'` (removido condicional `isEncerrado ? 'default' : 'pointer'`)
- `onClick` sempre presente (removido condicional `isEncerrado ? undefined : ...`)
- `opacity: 0.5` mantido para chaves encerradas (comportamento visual "opaco")

**RF/CA/Passos afetados:** Nenhum (correção de bug, não nova feature).


## Feature
<!-- Dedicado a informações do que é esperado da feature -->

# Guia de Spec para Implementação de Features

> Este documento define o padrão de especificação que deve ser seguido antes de implementar qualquer feature. Ao iniciar uma tarefa, analise este guia e aplique cada seção ao contexto da feature solicitada. Sempre siga a regra do SOLID.

---

## Como usar este guia

Antes de escrever qualquer linha de código, leia este documento inteiro e produza uma spec completa seguindo todas as seções abaixo. Só inicie a implementação após a spec estar escrita e validada.

> ⚠️ Se houver itens em **Problemas Encontrados** com status `[aberto]`, trate-os ANTES de qualquer nova implementação. Após corrigir, mova o item para **Histórico de Correções** e atualize os RF, CA e Passos afetados.

---

## 1. Contexto e Objetivo

- **O que é:** descrição funcional em uma ou duas frases
- **Por que existe:** problema de negócio ou necessidade do usuário
- **Quem usa:** perfil do usuário ou sistema que vai interagir com ela
- **Escopo:** o que está dentro e o que está fora desta entrega

---

## 2. Analise os Documentos de Referência

- **Guia de spec** (este documento): confirme que todas as seções serão preenchidas
- **Documento de requisitos** requisitos.md
- **Documentação técnica existente** `spec/{nome-da-feature}.md`: identifique padrões e convenções já estabelecidos
- **Código-fonte relevante**: leia os arquivos relacionados antes de propor qualquer mudança

> ⚠️ Nunca assuma o comportamento de um arquivo sem tê-lo lido. Sinalize explicitamente quando uma informação é uma inferência e não uma certeza.

---

## 3. Historia de Usuario

```
Como [tipo de usuário],
quero [ação ou capacidade],
para que [benefício ou objetivo].
```

Inclua também os cenários alternativos relevantes (ex: usuário sem permissão, dado inválido, estado vazio).

---

## 4. Requisitos Funcionais

Liste o comportamento esperado de forma objetiva e verificável. Cada item deve ser testável.

- [ ] RF-01: descrição do comportamento esperado
- [ ] RF-02: ...

Use linguagem de comportamento observável: "o sistema exibe", "o endpoint retorna", "o componente emite". Evite linguagem de implementação: "o método chama", "a variável recebe".

---

## 5. Requisitos Nao-Funcionais

- **Performance:** tempo de resposta esperado, limites de payload, paginação
- **Segurança:** autenticação, autorização, validação de entrada
- **Acessibilidade:** padrões de UI relevantes
- **Compatibilidade:** versões de browser, SO, plataforma
- **Observabilidade:** logs esperados, métricas, rastreamento de erros

---

## 6. Analise da Aplicação

- **Arquitetura geral:** camadas envolvidas (frontend, backend, banco, integrações)
- **Padrões em uso:** naming conventions, estrutura de pastas, padrões de componentes ou repositórios
- **Fluxo de dados:** de onde os dados vêm, como trafegam, onde são persistidos
- **Contratos de API:** endpoints existentes, formato de request/response, status codes

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/components/MeuComponente.vue` | Modificar | Adicionar nova prop e emissão de evento |
| `src/services/MeuService.ts` | Criar | Encapsular chamada ao novo endpoint |
| `Controllers/MeuController.cs` | Modificar | Adicionar novo endpoint POST |
| `Repositories/MeuRepositorio.cs` | Modificar | Adicionar query para novo filtro |
| `migrations/2025_xx_xx_descricao.sql` | Criar | Adicionar nova coluna na tabela |

> ⚠️ Se não tiver certeza sobre um arquivo, sinalize como "a confirmar" em vez de assumir.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos

- Dependências circulares ou acoplamento forte
- Ausência de abstração necessária
- Comportamento legado que pode quebrar com a mudança
- Inconsistência entre o contrato da API e o uso atual no frontend

### 8.2 Ambiguidades nos Requisitos

- Requisitos que precisam de decisão antes da implementação
- Comportamentos não especificados
- Conflito entre comportamentos esperados

### 8.3 Riscos

- Mudanças com potencial de regressão em outros módulos
- Operações que afetam dados em produção
- Dependência de terceiros ou serviços externos

> ⚠️ Sinalize impedimentos bloqueantes explicitamente antes de iniciar qualquer código.

---

## 9. Criterios de Aceite

- [ ] CA-01: dado [contexto], quando [ação], então [resultado esperado]
- [ ] CA-02: dado [contexto], quando [ação], então [resultado esperado]
- [ ] CA-03: caso de erro — dado [contexto inválido], quando [ação], então [mensagem/status esperado]

---

## 10. Plano de Implementacao (Passo a Passo)

Ordene da base para o topo: banco → backend → frontend.

```
Passo 1: [descrição clara da ação]
  - O que fazer: ...
  - Arquivo(s): ...
  - Como validar: ...

Passo 2: [descrição clara da ação]
  - O que fazer: ...
  - Arquivo(s): ...
  - Como validar: ...
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** feature flag, deploy direto, migração gradual
- **Como monitorar:** logs, alertas, métricas que indicam que a feature está funcionando
- **Plano de rollback:** o que fazer se algo der errado após o deploy

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite foram verificados
- [ ] Código revisado (PR aprovado ou auto-revisão documentada)
- [ ] Documentação atualizada (wiki, task, comentários no código se necessário)
- [ ] Sem warnings ou erros não tratados introduzidos
- [ ] Migração de banco aplicada (se aplicável)
- [ ] Seção **Histórico de Correções** atualizada com todas as correções feitas neste ciclo

---

## Checklist Rapido Antes de Comecar a Codar

- [ ] Li os itens em **Problemas Encontrados** e os tratei antes de qualquer código novo
- [ ] Li os documentos de referência
- [ ] Entendi a historia de usuario e o objetivo de negócio
- [ ] Identifiquei todos os arquivos envolvidos e os li
- [ ] Listei os problemas e impedimentos
- [ ] O plano de implementação está em ordem lógica (base → topo)
- [ ] Os critérios de aceite são verificáveis
- [ ] Sinalizei todas as incertezas explicitamente

> ⚠️ Se qualquer item do checklist estiver pendente, resolva antes de escrever código.

---

## Instrucoes para a IA

**Ao iniciar qualquer tarefa com este documento:**

1. Leia a seção **Problemas Encontrados**. Se houver itens `[aberto]`, trate-os PRIMEIRO antes de qualquer nova feature.
2. Para cada item `[aberto]` resolvido: mova-o para **Histórico de Correções** com o formato estabelecido e atualize os RF, CA e Passos afetados.
3. Crie o arquivo `spec/{nome-da-feature}.md` seguindo todas as seções deste guia antes de escrever qualquer código.
4. Após criar o `.md`, revise-o para verificar coerência. Só então implemente.
5. Ao finalizar qualquer ciclo (feature nova ou correção), registre no **Histórico de Correções** em spec.md NÃO alterar os comentario e NÃO apagar algo, apenas adicione suas observaçoes e atualize o documento `spec/{nome-da-feature}.md` caso seja implementado uma nova regra de negocio. Permitido melhorar a descrição e titulo do problema aberto

## Antes de atualizar a doc de requisitos.md garanta que esta seguindo os principios a baixo

# Pontos Principais para um Bom Documento de Requisitos

> Consolidado a partir das referências clássicas: Sommerville, Wiegers, Davis, IEEE 830 e IREB.

---

## 1. Clareza e Não Ambiguidade

Todo requisito deve ter uma única interpretação possível. Linguagem vaga como "o sistema deve ser rápido" ou "fácil de usar" é recorrentemente apontada como a principal fonte de falhas em projetos.

- Evitar termos subjetivos: *eficiente*, *robusto*, *amigável*, *adequado*
- Preferir linguagem declarativa e objetiva
- Quando necessário, complementar texto com diagramas ou exemplos concretos

**Referências:** Sommerville & Kotonya (1998), IEEE 830, Wiegers

---

## 2. Completude

O documento deve cobrir todos os cenários relevantes: funcionamento normal, casos de borda, tratamento de erros e restrições do sistema.

- Nenhum requisito deve depender de informação implícita ou "conhecimento tácito"
- Requisitos não funcionais (desempenho, segurança, disponibilidade) devem estar presentes, não apenas os funcionais
- Lacunas identificadas devem ser marcadas explicitamente (ex.: `TBD - a definir`)

**Referências:** IEEE 830, Sommerville, SWEBOK

---

## 3. Consistência

Nenhum requisito pode contradizer outro. Inconsistências costumam surgir quando múltiplos stakeholders contribuem sem revisão cruzada.

- Usar terminologia uniforme em todo o documento (um glossário ajuda)
- Fazer rastreabilidade entre requisitos relacionados
- Revisões cruzadas entre autores são essenciais

**Referências:** Sommerville, IEEE 830, IREB CPRE

---

## 4. Verificabilidade (Testabilidade)

Cada requisito deve ser verificável — deve ser possível escrever um teste ou critério de aceite que confirme se o requisito foi atendido ou não.

- Ruim: "O sistema deve responder rapidamente"
- Bom: "O sistema deve responder em no máximo 2 segundos para 95% das requisições sob carga de 100 usuários simultâneos"

**Referências:** IEEE 830, Wiegers, IREB

---

## 5. Rastreabilidade

Cada requisito deve poder ser rastreado em duas direções:

- **Para trás (backward):** de onde veio? Qual necessidade de negócio ou stakeholder originou este requisito?
- **Para frente (forward):** onde foi implementado? Em qual módulo, caso de uso ou teste está coberto?

Rastreabilidade é especialmente crítica em sistemas regulados (médico, industrial, aeroespacial) e é um pilar do INCOSE e do IREB.

**Referências:** INCOSE SE Handbook, IREB CPRE, IEEE 830

---

## 6. Atomicidade

Cada requisito deve expressar uma única ideia ou restrição. Requisitos compostos dificultam rastreabilidade, priorização e testes.

- Ruim: "O sistema deve autenticar o usuário e registrar o log de acesso"
- Bom: dois requisitos separados — um para autenticação, outro para log

**Referências:** Wiegers, IREB, Sommerville

---

## 7. Priorização

Os requisitos devem ser priorizados para orientar decisões de escopo, especialmente quando há restrições de prazo ou orçamento.

Modelos comuns:

- **MoSCoW:** Must have, Should have, Could have, Won't have
- **Kano:** Básico, de desempenho, de encantamento
- Numeração ou atributos de prioridade no próprio documento

**Referências:** Wiegers (*Software Requirements*), IREB

---

## 8. Estrutura e Organização

Um documento bem estruturado acelera a leitura, facilita revisões e reduz mal-entendidos.

Estrutura recomendada pelo **IEEE 830**:

1. Introdução (propósito, escopo, definições, visão geral)
2. Descrição geral (contexto, funções do sistema, características dos usuários, restrições)
3. Requisitos específicos (funcionais, não funcionais, interfaces)
4. Apêndices e índice

**Referências:** IEEE 830-1998, Wiegers

---

## 9. Envolvimento dos Stakeholders

A elicitação de requisitos não é uma atividade técnica isolada. Sommerville e Wiegers enfatizam que requisitos mal levantados são frequentemente causados por falha de comunicação, não por incompetência técnica.

- Técnicas recomendadas: entrevistas, workshops, observação, prototipação, análise de domínio
- Validar os requisitos com os stakeholders antes de considerar o documento fechado
- O Chaos Report (Standish Group) historicamente aponta "requisitos incompletos" e "falta de envolvimento do usuário" como as principais causas de fracasso em projetos

**Referências:** Sommerville, Wiegers, Standish Group Chaos Report

---

## 10. Gerenciamento de Mudanças

Requisitos mudam. Um bom documento prevê um processo para lidar com isso.

- Controle de versão do documento
- Histórico de alterações com data, autor e justificativa
- Processo formal de aprovação para mudanças após baseline
- Avaliar impacto de cada mudança nos requisitos relacionados

**Referências:** IREB CPRE, Wiegers, IEEE 12207

---

## Resumo Visual

| Atributo           | Pergunta que deve ser respondida com "sim"                        |
|--------------------|-------------------------------------------------------------------|
| Claro              | Qualquer leitor interpretaria da mesma forma?                     |
| Completo           | Todos os cenários e restrições estão cobertos?                    |
| Consistente        | Nenhum requisito contradiz outro?                                 |
| Verificável        | É possível escrever um teste para isso?                           |
| Rastreável         | Sei de onde veio e onde está implementado?                        |
| Atômico            | Expressa uma única ideia?                                         |
| Priorizado         | Sei o que é essencial vs. desejável?                              |
| Bem estruturado    | O documento tem seções claras e navegáveis?                       |
| Validado           | Os stakeholders revisaram e aprovaram?                            |
| Versionado         | Mudanças são registradas e controladas?                           |

---

*Fontes: Sommerville & Kotonya (1998); Wiegers (2003); IEEE 830-1998; SWEBOK v3; IREB CPRE Syllabus; INCOSE SE Handbook; Standish Group Chaos Report.*