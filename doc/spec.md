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
### [aberto] Chaves escerradas ficam opacas, apenas o encerrado na cor normal. Continuam sendo clicaveis
### [aberto] No plcar da luta Tem que mostra a cor da faixa dos atletas que estão lutando
### [aberto] Quando o modal de finalizar luta é aberto o tempo tem que parar, caso não tenha sido pausado
### [aberto] em Selecione a área de luta, sempre fica selecionada a ultima area que teve atualização
### [aberto] Troque a visualização dos cards da chave, tanto em placar, quanto na lista de chave, para um a baixo do outro, ao inves de um ao lado do outro
### [aberto] Em placar, na parte de selecionar a chave, a que tem a atualização mais recente aparece no topo da lista, e as encerradas ao final
### [aberto] em resultados, as chaves encerradas vão para o topo da lista
### [corrigido] Em resultados, lutas com BYE estão sendo consideradas em andamento, olhe para a logica em placar e corrija resultados
**Comportamento atual:** `getChaveStatus` em Resultados.tsx considerava `l.status === 'wo'` como "EM ANDAMENTO", mas BYE lutas também têm `status: 'wo'` (auto-resolvidas na geração), fazendo chaves sem nenhuma luta real iniciada aparecerem como "EM ANDAMENTO".
**Comportamento esperado:** Apenas lutas com `status === 'completed'` (lutas reais finalizadas) devem marcar a chave como "EM ANDAMENTO". BYE lutas não contam — mesma lógica de `PlacarChaves.tsx`.
**Correção:** removido `|| l.status === 'wo'` da condição `isEmAndamento` em `Resultados.tsx:59`.

### [corrigido] em lutas casadas tem que ter a opção de selecionar varios e toda a logica de soft delete que tem em atleta
**Comportamento atual:** AdminLutasCasadas.tsx não possuía checkboxes, seleção múltipla ou soft delete — apenas exclusão individual e permanente. LutaCasada type não tinha campo `deletedAt`.
**Comportamento esperado:** Checkboxes (selecionar todos + por linha), soft delete em lote com toggle "Mostrar apenas os deletados", restore, exclusão permanente individual e em lote — mesmo padrão de AdminAthletes.
**Correção:**
- Adicionado `deletedAt` ao type `LutaCasada`
- `electron/lutasCasadas.ts`: `loadLutasCasadas` filtra `deletedAt == null`; novas funções `loadDeletedLutasCasadas`, `deleteLutasCasadas` (bulk soft), `permanentlyDeleteLutaCasada`, `permanentlyDeleteLutasCasadas`, `restoreLutaCasada`, `restoreLutasCasadas`
- IPC handlers registrados em `electron/main.ts` para todos os novos canais
- IPC exposto em `electron/preload.ts` e tipado em `src/types/electron.d.ts`
- `AdminLutasCasadas.tsx` reescrito com: toggle showDeleted, checkboxes, bulk soft-delete no topo, bulk permanent-delete no topo, restore por linha, exclusão permanente por linha, modais de confirmação

### [corrigido] Troque a posicao de resultado — ele deve ser o primeiro no dashboard
**Comportamento atual:** Resultados era o último card no dashboard (após Placar).
**Comportamento esperado:** Resultados deve ser o primeiro card, mantendo o mesmo formato visual.
**Correção:** movido "Resultados" para a primeira posição em `dashboardCards` e `navItems` em `src/pages/Dashboard.tsx`.
**Arquivos:** `src/pages/Dashboard.tsx`.
**Data:** jun/2026.
### [corrigido] Lutas casadas precisa de um menu no dashboard com listagem e exclusao
**Comportamento atual:** não havia entrada no dashboard nem página dedicada para listar/excluir lutas casadas.
**Comportamento esperado:** card no dashboard, item na sidebar e página com listagem de todas as lutas casadas com opção de excluir.
**Correção:**
- Adicionado IPC `load-lutas-casadas` (retorna todas, sem filtro de área)
- Criada página `src/pages/AdminLutasCasadas.tsx` com tabela e modal de exclusão
- Rota `/admin/lutas-casadas` registrada em `App.tsx`
- Card "Lutas Casadas" e navItem adicionados ao Dashboard
**Arquivos:** `electron/lutasCasadas.ts`, `electron/main.ts`, `electron/preload.ts`, `src/types/electron.d.ts`, `src/pages/AdminLutasCasadas.tsx`, `src/App.tsx`, `src/pages/Dashboard.tsx`.
**Data:** jun/2026.

### [corrigido] Arbitros que ja estao em areas devem ficar ocultos no select de arbitro para area
**Comportamento atual:** o MultiSelect de árbitros no formulário de área exibia todos os árbitros ativos, inclusive os já alocados em outras áreas.
**Comportamento esperado:** árbitros já atribuídos a outras áreas devem ficar ocultos no seletor, exceto o da área sendo editada.
**Correção:** adicionado prop `areas` ao `AreaForm` para identificar árbitros já em uso; `arbitroOptions` agora filtra (`usedArbitroIds`) antes de exibir.
**Arquivos:** `src/components/AreaForm.tsx`, `src/pages/AdminAreas.tsx`, `src/pages/AreasMenu.tsx`.
**Data:** jun/2026.

### [corrigido] A ordem no dashboard deve ser atleta, equipe, arbitro, area, chave e placar
**Comportamento atual:** a ordem dos cards no dashboard era: Atletas, Equipes, Geração de Chaves, Áreas de Luta, Árbitros, Placar.
**Comportamento esperado:** ordem correta: Atletas, Equipes, Árbitros, Áreas de Luta, Geração de Chaves, Placar.
**Correção:** reordenados os arrays `dashboardCards` e `navItems` em `src/pages/Dashboard.tsx` para a sequência solicitada.
**Arquivos:** `src/pages/Dashboard.tsx`.
**Data:** jun/2026.

## Histórico de Correções
<!-- ZONA DA IA: a IA preenche após cada ciclo. -->

### [corrigido] Tem que ter a opção de selecionar varios atletas para soft deletar
**Comportamento atual:** checkboxes e seleção múltipla só existiam na view de deletados. Select de faixa sumia ao alternar para "Mostrar apenas os deletados". Botão de ação em lote ficava abaixo da tabela.
**Comportamento esperado:** checkboxes de seleção em ambos os modos, com "Excluir Selecionados" (soft-delete em lote) para ativos e "Excluir Permanentemente" para deletados. Botão no topo.
**Correção:**
- Checkboxes (cabeçalho + por linha) agora renderizados em ambos os modos
- Adicionado `handleBulkDelete` chamando IPC `delete-athletes` (soft-delete em lote)
- Botão de ação em lote movido para o topo (entre filtros e tabela): "Excluir Selecionados" na view normal, "Excluir Permanentemente" na view deletados
- Adicionado modal de confirmação para exclusão em lote (bulk soft-delete)
- Select de faixa agora sempre visível (removida condicional `{!showDeleted}`)
- Filtro de faixa funciona em ambos os modos (removida guarda `!showDeleted`)
**Arquivos:** `src/pages/AdminAthletes.tsx`.
**Data:** jun/2026.

### [corrigido] Seleção múltipla e soft-delete em lote para Lutas Casadas
**Comportamento atual:** AdminLutasCasadas.tsx não possuía checkboxes, seleção múltipla ou soft delete — apenas exclusão individual e permanente. LutaCasada type não tinha campo `deletedAt`.
**Comportamento esperado:** Checkboxes (selecionar todos + por linha), soft delete em lote com toggle "Mostrar apenas os deletados", restore, exclusão permanente individual e em lote — mesmo padrão de AdminAthletes.
**Correção:**
- Adicionado `deletedAt` ao type `LutaCasada`
- Adicionadas funções em `electron/lutasCasadas.ts`: `loadDeletedLutasCasadas`, `deleteLutasCasadas` (bulk soft), `permanentlyDeleteLutaCasada`, `permanentlyDeleteLutasCasadas`, `restoreLutaCasada`, `restoreLutasCasadas`
- IPC handlers registrados em `electron/main.ts` para todos os novos canais
- IPC exposto em `electron/preload.ts` e tipado em `src/types/electron.d.ts`
- AdminLutasCasadas.tsx reescrito com: toggle showDeleted, checkboxes (cabeçalho + por linha), bulk soft-delete no topo, bulk permanent-delete no topo, restore por linha, exclusão permanente por linha, modais de confirmação
**Arquivos:** `src/types/lutaCasada.ts`, `electron/lutasCasadas.ts`, `electron/main.ts`, `electron/preload.ts`, `src/types/electron.d.ts`, `src/pages/AdminLutasCasadas.tsx`.
**Data:** jun/2026.

### [corrigido] BYE lutas consideradas "em andamento" em Resultados
**Comportamento atual:** `getChaveStatus` em Resultados.tsx considerava `l.status === 'wo'` como "EM ANDAMENTO", mas BYE lutas também têm `status: 'wo'` (auto-resolvidas na geração), fazendo chaves sem nenhuma luta real iniciada aparecerem como "EM ANDAMENTO".
**Comportamento esperado:** Apenas lutas com `status === 'completed'` (lutas reais finalizadas) devem marcar a chave como "EM ANDAMENTO" — mesma lógica de `PlacarChaves.tsx`.
**Correção:** removido `|| l.status === 'wo'` da condição `isEmAndamento` em `Resultados.tsx:59`.
**Arquivos:** `src/pages/Resultados.tsx`.
**Data:** jun/2026.


## Feature
### [implementado] Bloqueio de atribuição de itens soft-deleted
**O que é:** atletas, árbitros e áreas com `deletedAt != null` não podem ser atribuídos: atletas não entram em chaves, árbitros não são atribuídos a chaves/áreas, áreas não recebem árbitros deletados.
**Onde foi implementado:** `electron/brackets.ts` (5 pontos de filtro/validação) e `electron/areas.ts` (`checkRefereeNotInUse` valida árbitros ativos).
**Spec detalhada:** `spec/bloqueio-atribuicao-soft-deleted.md`.
**Data:** jun/2026.

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