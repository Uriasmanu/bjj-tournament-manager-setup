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
### [aberto] em nenhum lugar do sistema a categoria customisada deve aparecer como custom-3f6e8e0e-580d-44f8-8c80-e4250352dbaa
### [aberto] O gerar chave automaticas tem que levar em consideração, categoria e cor de faixa
### [aberto] no pdf das chaves, os retangulos devem ter bordas desenhadas em todos os lados
## Historico de correçoes
<!-- Passe para cá os itens corrigidos que estavam em aberto-->

## Feature

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

---

## Histórico de Correções

### [resolvido] PDF lutas casadas exibia ID do árbitro em vez do nome
- **Data:** 2026-06-18
- **Problema:** O PDF de lutas casadas exibia o `arbitroId` diretamente, sem resolver para o nome do árbitro.
- **Solução:** Adicionado parâmetro `arbitros` na função `gerarPdfLutasCasadas` e criada função `getNomeArbitro` para resolver o nome. Atualizadas chamadas em `AdminLutasCasadas.tsx` e `Resultados.tsx`.
- **Arquivos alterados:** `src/utils/pdfGenerator.ts`, `src/pages/AdminLutasCasadas.tsx`, `src/pages/Resultados.tsx`
- **Spec:** `spec/pdf-lutas-casadas-chaves.md`

### [resolvido] PDF chaves não exibia formato de bracket
- **Data:** 2026-06-18
- **Problema:** O PDF de chaves exibia as lutas em formato de tabela simples, sem mostrar a estrutura visual do bracket.
- **Solução:** Reescrita a função `gerarPdfChaves` para exibir bracket vertical com rodadas sequenciais. Adicionadas funções auxiliares `createBracketRow` e `getRoundLabel`. Vencedores são destacados em negrito.
- **Arquivos alterados:** `src/utils/pdfGenerator.ts`
- **Spec:** `spec/pdf-lutas-casadas-chaves.md`

### [resolvido] Seleção de árbitro ao criar luta casada
- **Data:** 2026-06-16
- **Problema:** Ao criar uma luta casada, o sistema sempre atribuía o primeiro árbitro da área (`area.arbitroIds[0]`), sem permitir escolha.
- **Solução (atualizada):** Substituído o badge estático por um componente `Select` que lista **todos** os árbitros cadastrados no torneio, permitindo busca livre. O árbitro da área é pré-selecionado, mas o usuário pode trocar para qualquer um.
- **Arquivos alterados:** `src/components/ModalCriarLutaCasada.tsx`

### [resolvido] Permitir mesmo árbitro em múltiplas áreas com aviso
- **Data:** 2026-06-16
- **Problema:** O sistema bloqueava a atribuição de um árbitro a mais de uma área, impedindo o uso compartilhado de árbitros entre áreas.
- **Solução:** Removida a validação de exclusão mútua no backend (`checkRefereeNotInUse` → `checkRefereesExist`). No frontend (`AreaForm`), removido o filtro que ocultava árbitros já usados e adicionado alerta visual quando um árbitro selecionado já está atribuído a outra área, exibindo o nome da área conflitante.
- **Arquivos alterados:** `electron/areas.ts`, `src/components/AreaForm.tsx`

### [resolvido] Escolher categoria livremente ao editar atleta
- **Data:** 2026-06-17
- **Problema:** Ao editar um atleta, o Select de categoria filtrava por gênero + idade + faixa, impedindo o administrador de atribuir manualmente uma categoria diferente.
- **Solução:** Criada função `categoriasPorGenero()` que filtra apenas por gênero. No modo edição (`athlete` presente), usa-se `categoriasPorGenero` em vez de `categoriasFiltradas`, permitindo escolha livre entre todas as categorias do gênero. Modo criação mantém o filtro completo.
- **Arquivos alterados:** `src/components/AthleteForm.tsx`
- **Spec:** `spec/escolher-categoria-livre.md`

### [feature] Menu de Categorias no Dashboard
- **Data:** 2026-06-17
- **Descrição:** Implementado menu "Categorias" no Dashboard para gerenciar categorias do torneio.
- **Funcionalidades:**
  - Habilitar/desabilitar categorias IBJJF do sistema (toggle switch)
  - Criar, editar e excluir categorias personalizadas
  - Campos: nome, faixa etária, gênero, peso mínimo/máximo, cor da faixa, tempo de luta
  - Integração com formulário de atletas (filtra desabilitadas, inclui customizadas)
- **Arquivos criados:** `electron/categorias.ts`, `src/components/CategoriaForm.tsx`, `src/pages/CategoriasMenu.tsx`, `src/pages/AdminCategorias.tsx`, `spec/categorias-menu.md`
- **Arquivos alterados:** `src/types/category.ts`, `src/types/tournament.ts`, `src/types/electron.d.ts`, `electron/main.ts`, `electron/preload.ts`, `src/components/AthleteForm.tsx`, `src/App.tsx`, `src/pages/Dashboard.tsx`

### [resolvido] Menu categorias seguindo padrão dos outros menus
- **Data:** 2026-06-17
- **Problema:** O menu de categorias não seguia o padrão visual dos outros menus (ex: Atletas). Cards com border-left, hover effects, botão "Acessar" dourado.
- **Solução:** Reescrito `CategoriasMenu.tsx` seguindo exatamente o padrão de `AthletesMenu.tsx`: welcome banner com stats (Grid 8/4), 3 cards (Categorias IBJJF, Nova Categoria Customizada, Listar Categorias Customizadas) com ícone, título, descrição e botão "Acessar". Adicionado `useDisclosure` para abrir modal de criação inline.
- **Arquivos alterados:** `src/pages/CategoriasMenu.tsx`

### [resolvido] Atualizar nome do atleta cria novo atleta
- **Data:** 2026-06-18
- **Problema:** Ao tentar atualizar o nome de um atleta, o sistema tentava criar um novo atleta. O backend `saveAthlete` não tinha proteção contra duplicatas — sempre fazia `push` na lista.
- **Solução:** Adicionado guard no backend `saveAthlete` que verifica se o ID já existe na lista. Se existir, atualiza em vez de criar duplicata. Também atualizado `AthletesMenu.tsx` para usar `updateAthlete` quando o atleta já existe.
- **Arquivos alterados:** `electron/athletes.ts`, `src/pages/AthletesMenu.tsx`

### [resolvido] Listas não atualizam visualmente ao adicionar itens
- **Data:** 2026-06-18
- **Problema:** As listas (Dashboard, Árbitros, Áreas, Categorias, Equipes, Placar, Resultados) carregavam dados apenas no mount do componente e nunca atualizavam. O usuário precisava sair e entrar novamente para ver novos itens.
- **Solução:** Adicionado `window.addEventListener('focus', ...)` em todas as páginas afetadas para re-buscar dados quando o usuário retorna à janela. Isso garante que as listas estejam sempre atualizadas sem necessidade de navegação extra.
- **Arquivos alterados:** `src/pages/Dashboard.tsx`, `src/pages/ArbitrosMenu.tsx`, `src/pages/AreasMenu.tsx`, `src/pages/CategoriasMenu.tsx`, `src/pages/Equipes.tsx`, `src/pages/PlacarMenu.tsx`, `src/pages/Resultados.tsx`

### [resolvido] Categorias devem exibir tempo de luta
- **Data:** 2026-06-18
- **Problema:** A lista de categorias IBJJF no menu mostrava apenas o nome e a faixa de peso, sem informar o tempo de luta.
- **Solução:** Adicionado badge azul com o tempo de luta (ex: "5-10 min") ao lado de cada categoria IBJJF, calculado com base na faixa etária. Categorias customizadas já exibiam o tempo na tabela.
- **Arquivos alterados:** `src/pages/CategoriasMenu.tsx`

### [resolvido] Criar Chave Manual deve mostrar apenas atletas sem chave
- **Data:** 2026-06-17
- **Problema:** O modal `ModalCriarChaveManual` listava todos os atletas disponíveis, incluindo os que já estavam em chaves geradas (`emChave: true`). Isso permitia adicionar atletas que já tinham chave a uma nova chave manual.
- **Solução:** Adicionado filtro `!a.emChave` no `atletasData` do modal, tornando invisíveis os atletas que já possuem chave. Ao deletar uma chave, o backend já limpa `emChave` dos atletas (via `removeAthleteFromChaves` + `delete-chave`), então eles voltam a aparecer no modal automaticamente.
- **Arquivos alterados:** `src/components/ModalCriarChaveManual.tsx`

### [resolvido] Import de atleta deve reconhecer categorias customizadas
- **Data:** 2026-06-17
- **Problema:** O handler `import-athletes` (`electron/athletes.ts:importAthletesFromFile`) validava o campo `categoria` apenas contra `CATEGORIAS_IBJJF`. Atletas com categorias customizadas (`custom-<uuid>`) eram rejeitados com erro "categoria não reconhecida".
- **Solução:** Movido `loadTorneio` antes da validação de categorias e adicionados os IDs de `torneio.categoriasCustomizadas` ao `Set` de categorias válidas. Agora tanto categorias IBJJF quanto customizadas são aceitas na importação.
- **Arquivos alterados:** `electron/athletes.ts`

### [feature] Geração Manual de Chaves
- **Data:** 2026-06-17
- **Descrição:** Implementada opção de criar chaves manualmente, selecionando atletas livremente (sem seguir separação automática por faixa/categoria). Similar ao fluxo de luta casada, mas com N atletas (2-16).
- **Funcionalidades:**
  - Botão "Criar Chave Manual" na tela Gerenciar Chaves (acessível antes e depois da geração automática)
  - Modal com campo de nome (opcional, geração automática se vazio), MultiSelect de atletas, cards de preview com faixa/peso/equipe/categoria
  - Validação: mínimo 2 atletas, máximo 16, sem duplicatas, sem atletas já em outra chave
  - Chave criada com `categoriaId: 'manual'` e nome personalizado
  - Badge "Manual" na listagem (via `getChaveTitle` usando `chave.nome`)
  - Chave manual pode ser embaralhada, visualizada e ter árbitro atribuído
- **Arquivos criados:** `src/components/ModalCriarChaveManual.tsx`, `spec/geracao-manual-chaves.md`
- **Arquivos alterados:** `electron/brackets.ts`, `electron/preload.ts`, `src/types/electron.d.ts`, `src/types/bracket.ts`, `src/pages/GerenciarChaves.tsx`

### [resolvido] Filtros UI removidos — geração por faixa/categoria é regra interna
- **Data:** 2026-06-17
- **Problema:** Os `MultiSelect` de filtro de faixa e categoria adicionados ao modal "Configurar Geração de Chaves" não são necessários. A separação por categoria e cor de faixa é uma regra interna do sistema que sempre deve ser aplicada automaticamente, sem necessidade de filtros manuais no UI.
- **Solução:** Removidos os dois `MultiSelect` ("Filtrar por faixa" e "Filtrar por categoria"), o state `filterFaixas`/`filterCategorias` e a passagem de parâmetros de filtro nos handlers `handleGerarTodas`/`handleGerarNovamente`. Mantidas as correções no backend (`gerar-chave` filtra por faixa, `gerarTodasChavesHandler` aceita filtros opcionais para compatibilidade). UI volta ao formato original com apenas "Máximo de atletas por chave".
- **Arquivos alterados:** `src/pages/GerenciarChaves.tsx`

### [resolvido] Geração de chaves deve filtrar por cor de faixa e categoria
- **Data:** 2026-06-17
- **Problema:** O handler `gerar-chave` (geração individual) misturava atletas de todas as faixas dentro de uma categoria, ignorando a separação por cor de faixa. A UI de geração de chaves não permitia filtrar por faixa ou categoria antes de gerar.
- **Solução:** No backend (`electron/brackets.ts`), o handler `gerar-chave` agora aceita `faixa?` e filtra atletas por ela. O handler `gerar-todas-chaves` aceita arrays opcionais `faixas?` e `categorias?` para filtrar antes do agrupamento. No frontend (`GerenciarChaves.tsx`), adicionados dois `MultiSelect` no modal de configuração: "Filtrar por faixa" e "Filtrar por categoria", com busca e clearable. Atualizados `preload.ts` e `electron.d.ts` com as novas assinaturas.
- **Arquivos alterados:** `electron/brackets.ts`, `electron/preload.ts`, `src/types/electron.d.ts`, `src/pages/GerenciarChaves.tsx`
- **Spec:** `spec/filtrar-chave-por-faixa-categoria.md`

### [resolvido] Categorias IBJJF devem mostrar faixa de peso na frente
- **Data:** 2026-06-17
- **Problema:** A lista de categorias IBJJF no menu mostrava apenas o nome, sem a faixa de peso.
- **Solução:** Adicionado badge com a faixa de peso (ex: "até 76,0 kg") ao lado do nome de cada categoria IBJJF na lista de toggles.
- **Arquivos alterados:** `src/pages/CategoriasMenu.tsx`

### [resolvido] Gerar PDF das lutas casadas e das chaves de luta
- **Data:** 2026-06-18
- **Problema:** Não existia funcionalidade de gerar PDF para lutas casadas nem para chaves de luta.
- **Solução:** Criado `src/utils/pdfGenerator.ts` com funções `gerarPdfLutasCasadas` e `gerarPdfChaves` (usando pdfmake). Adicionados botões "Gerar PDF" nas abas "Chaves" e "Lutas Casadas" da tela de Resultados, no cabeçalho da tela de Gerenciar Chaves, e no menu de Lutas Casadas (`AdminLutasCasadas.tsx`). O PDF das chaves mostra bracket vertical com rodadas da esquerda para a direita.
- **Arquivos alterados:** `src/utils/pdfGenerator.ts` (criado), `src/pages/Resultados.tsx`, `src/pages/GerenciarChaves.tsx`, `src/pages/AdminLutasCasadas.tsx`

### [resolvido] Editar e criar luta casada no menu de lutas casadas
- **Data:** 2026-06-18
- **Problema:** O menu de lutas casadas (`AdminLutasCasadas`) apenas listava e permitia excluir/restaurar. Não era possível criar novas lutas casadas nem editar/acompanhar as existentes.
- **Solução:** Adicionado botão "Nova Luta Casada" que abre modal com seletor de área e reutiliza `ModalCriarLutaCasada`. Adicionado botão "Editar" (ícone de lápis) por linha que navega para o placar da luta casada correspondente.
- **Arquivos alterados:** `src/pages/AdminLutasCasadas.tsx`

### [resolvido] Categorias padrão - remover separação por faixa na geração de chaves
- **Data:** 2026-06-18
- **Problema:** A geração de chaves em massa (`gerarTodasChavesHandler`) agrupava atletas por `${categoria}__${faixa}`, criando chaves separadas para cada cor de faixa dentro da mesma categoria. O usuário quer que atletas da mesma categoria (idade + peso + gênero) compartilhem a mesma chave, sem separação por cor de faixa.
- **Solução:** Alterada a chave de agrupamento de `${a.categoria}__${a.faixa}` para apenas `a.categoria` em `electron/brackets.ts`. Agora todos os atletas da mesma categoria são agrupados em uma única chave.
- **Arquivos alterados:** `electron/brackets.ts`

### [feature] Export em pdf de resultados
- **Data:** 2026-06-20
- **Problema:** Não existia funcionalidade de gerar PDF com os resultados consolidados do torneio (medalhistas, ranking de equipes, árbitros, atletas). Apenas PDFs de chaves e lutas casadas eram suportados.
- **Solução:** Criada função `gerarPdfResultados` em `src/utils/pdfGenerator.ts` que gera um PDF consolidado com 4 seções: Medalhistas (🥇/🥈/🥉 por chave encerrada), Ranking de Equipes (tabela ordenada por medalhas), Árbitros (com total de lutas) e Atletas (tabela completa). Adicionado botão "Gerar PDF Resultados" na aba "Visão Geral" da tela de Resultados.
- **Arquivos alterados:** `src/utils/pdfGenerator.ts`, `src/pages/Resultados.tsx`
- **Spec:** `spec/pdf-resultados.md`

### [feature] Trocar área de luta na chave de gerenciamento
- **Data:** 2026-06-20
- **Problema:** Na tela "Gerenciar Chaves", não era possível visualizar nem trocar a área de luta de uma chave. A relação chave-área era indireta (através do árbitro) e a UI não fornecia nenhum seletor de área, obrigando o administrador a conhecer quais árbitros pertencem a quais áreas.
- **Solução:** Adicionada resolução de área nos cards de chave (exibe nome da área ao lado do árbitro). Adicionado seletor de "Área de Luta" (Select pesquisável, clearable) no modal de visualização de chave. Ao selecionar uma nova área, o sistema atribui automaticamente o primeiro árbitro da área à chave. Ao limpar, remove o árbitro.
- **Arquivos alterados:** `src/pages/GerenciarChaves.tsx`
- **Spec:** `spec/trocar-area-chave.md`

### [resolvido] Chaves manuais já recebem emChave (item obsoleto)
- **Data:** 2026-06-20
- **Problema:** O item "[aberto] Craves criada manualmente, tem que receber o emChave tambem" estava desatualizado.
- **Solução:** O código já implementa corretamente o `emChave = true` para atletas em chaves manuais, tanto no backend (`electron/brackets.ts:1653-1658`) quanto no frontend (`GerenciarChaves.tsx:329-331`). Item removido da lista de problemas abertos.
- **Arquivos:** `electron/brackets.ts`, `src/pages/GerenciarChaves.tsx`

### [feature] Ícone de editar ao lado de excluir em chaves
- **Data:** 2026-06-20
- **Problema:** Na tela "Gerenciar Chaves", o card de cada chave só exibia botão "Excluir". Não havia ícone de editar para acessar rapidamente a visualização da chave.
- **Solução:** Adicionado botão "Editar" (ícone `IconPencil`, cor azul) ao lado do botão "Excluir" no card de cada chave. O botão abre o modal de visualização da chave (mesmo que "Visualizar"), permitindo editar árbitro, área e embaralhar.
- **Arquivos alterados:** `src/pages/GerenciarChaves.tsx`

### [feature] Área de luta editável em lutas casadas
- **Data:** 2026-06-20
- **Problema:** Na edição de luta casada (`ModalEditarLutaCasada`), não era possível alterar a área de luta. A tabela de listagem (`AdminLutasCasadas`) também não exibia a área.
- **Solução:** Adicionado seletor de "Área de Luta" (Select pesquisável, clearable) no modal de edição. Ao trocar de área, o árbitro é automaticamente atualizado para o primeiro árbitro da nova área. Adicionada coluna "Área" na tabela de listagem. Passado array `areas` como prop para o modal.
- **Arquivos alterados:** `src/components/ModalEditarLutaCasada.tsx`, `src/pages/AdminLutasCasadas.tsx`

### [feature] PDF de resultados com formato tabela e páginas separadas
- **Data:** 2026-06-20
- **Problema:** O PDF de resultados era muito simples, sem formato de tabela adequado e todas as seções numa única página.
- **Solução:** Reescrita a função `gerarPdfResultados` com: Medalhistas em tabela (Categoria, Atletas, Ouro, Prata, Bronze), Ranking de Equipes com coluna #, Árbitros com coluna #, Atletas com coluna #. Cada seção (Medalhistas, Ranking, Árbitros, Atletas) inicia em página separada via `pageBreak: 'before'`.
- **Arquivos alterados:** `src/utils/pdfGenerator.ts`

### [resolvido] Criar chave manual com qualquer faixa/categoria (item obsoleto)
- **Data:** 2026-06-20
- **Problema:** O item "[aberto] em criação de chave manual eu posso colocar quem eu quiser, independente de faixa, categoria" descrevia uma funcionalidade que já existia.
- **Solução:** O código em `ModalCriarChaveManual.tsx:62` filtra atletas apenas por `!a.emChave && !selectedIds.includes(a.id)` — não há filtro de faixa ou categoria. Item removido da lista de problemas abertos.
- **Arquivos:** `src/components/ModalCriarChaveManual.tsx`

### [resolvido] Luta encerrada sempre exibia tempo padrão (5 min) em vez do tempo real
- **Data:** 2026-06-20
- **Problema:** Ao entrar em uma luta que já foi encerrada, o sistema mostrava sempre o tempo sugerido IBJJF (ou 5 min fallback) em vez do tempo real que a luta durou. O campo `tempoRealSegundos` existia nas interfaces TypeScript mas nunca era calculado, salvo ou recuperado.
- **Solução:** Implementado ciclo completo de persistência de tempo real: (1) No frontend, calculado `tempoRealSegundos = tempoInicial - tempoRestante` ao finalizar luta em `PlacarLuta.tsx` e `PlacarLutaCasada.tsx`; (2) Enviado `tempoRealSegundos` na chamada `registrarResultado` (frontend → preload → backend); (3) No backend, salvo `tempoRealSegundos` na luta em `registrarResultadoHandler` (`electron/brackets.ts`); (4) Incluído `tempoRealSegundos` nas funções de normalização `normalizeLuta` e `normalizeLutaCasada`; (5) Ao abrir luta finalizada, recuperado `tempoRealSegundos` salvo e calculado `tempoRestante = tempoInicial - tempoRealSegundos`.
- **Arquivos alterados:** `src/pages/PlacarLuta.tsx`, `src/pages/PlacarLutaCasada.tsx`, `electron/brackets.ts`, `electron/lutasCasadas.ts`, `electron/preload.ts`, `src/types/electron.d.ts`

### [resolvido] Nome da área não aparecia no topo das telas de placar
- **Data:** 2026-06-20
- **Problema:** Ao acessar qualquer tela dentro de uma área selecionada (PlacarBracket, PlacarLuta, PlacarLutaCasada), o nome da área não era exibido no topo. O componente `PageLayout` aceitava as props `title` e `headerExtras` mas as descartava com prefixo de underscore, nunca renderizando-as.
- **Solução:** (1) Corrigido `PageLayout.tsx` para renderizar o título como `<Title order={3}>` e os `headerExtras` dentro de um `<Group>` no topo do Paper; (2) Atualizado `PlacarBracket.tsx`, `PlacarLuta.tsx` e `PlacarLutaCasada.tsx` para carregar os dados da área via `loadAreas()` e incluir `area.nome` no título do PageLayout.
- **Arquivos alterados:** `src/components/PageLayout.tsx`, `src/pages/PlacarBracket.tsx`, `src/pages/PlacarLuta.tsx`, `src/pages/PlacarLutaCasada.tsx`

### [resolvido] Lutas casadas não exibiam tipo de vitória
- **Data:** 2026-06-20
- **Problema:** As lutas casadas não exibiam o tipo de vitória (pontos, finalização, desclassificação, desempate) em nenhum dos pontos de exibição: PlacarChaves, AdminLutasCasadas, PlacarLutaCasada e PDF. Os campos `finalizacao`, `desclassificacao` e `desempateArbitro` já eram salvos corretamente mas nunca consultados para exibição.
- **Solução:** (1) Criada função `getTipoVitoria` em `src/utils/vitoria.ts` para reutilização em todos os pontos; (2) Atualizado `Resultados.tsx` para usar a função compartilhada; (3) Adicionado badge de tipo de vitória nos cards de lutas casadas em `PlacarChaves.tsx`; (4) Adicionada coluna "Tipo" na tabela de `AdminLutasCasadas.tsx`; (5) Incluído tipo de vitória no alert de finalização de `PlacarLutaCasada.tsx`.
- **Arquivos alterados:** `src/utils/vitoria.ts` (criado), `src/pages/Resultados.tsx`, `src/pages/PlacarChaves.tsx`, `src/pages/AdminLutasCasadas.tsx`, `src/pages/PlacarLutaCasada.tsx`