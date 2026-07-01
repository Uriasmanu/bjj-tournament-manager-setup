# spec.md — Template de Feature

**Antes de começar, melhore a descrição da feature ou Problemas Encontrados nesse documento spec.md, depois siga o restante das orientações.**
NÃO alterar os comentario e NÃO apagar algo, apenas adicione suas observaçoes e atualize o documento `implementado/{nome-da-feature}.md` caso seja implementado uma nova regra de negocio. Permitido melhorar a descrição e titulo do problema aberto, ao final do ciclo atualize requisitos.md

---

## Problemas Encontrados

<!-- Ao iniciar qualquer ciclo, a IA deve: ler todos os itens [aberto], corrigir, mover para Histórico de Correções e atualizar os RF/CA/Passos afetados. -->

<!--
### [aberto] Título curto do problema
**Comportamento atual:** o que está acontecendo de errado.
**Comportamento esperado:** o que deveria acontecer.
**Escopo:** onde no código isso precisa ser resolvido (geração, exibição, ambos...).
-->

---

## Histórico de Correções

### [corrigido] Ajuste do tamanho do placar Atleta A/B — informações maiores e melhor distribuição
**Data:** 2026-06-30
**Comportamento atual:** Os painéis Atleta A e Atleta B tinham informações muito compactas e com muito espaçamento entre elas. Fontes pequenas (Total, pontuações, vantagens, nome) e botões de ação diminutos (30px pontos, 26px vant/pun) tornavam a leitura difícil.
**Comportamento esperado:** Painéis com informações maiores e melhor distribuídos. Fontes maiores para Total, contadores, vantagens/punições e nome do atleta. Botões de ação maiores para facilitar uso. Padding generoso mas sem desperdiçar espaço.
**Escopo:** `src/pages/PlacarLuta.tsx`, `src/pages/PlacarLutaCasada.tsx`
**Ação:** (1) Fontes aumentadas: `FONT_TOTAL` de `clamp(40px, 3vw, 72px)` para `clamp(52px, 4vw, 90px)`, `FONT_COUNTER` de `clamp(24px, 1.6vw, 40px)` para `clamp(28px, 2vw, 48px)`, `FONT_VANT_PUN` de `clamp(16px, 1.4vw, 24px)` para `clamp(20px, 1.8vw, 32px)`, `FONT_NOME` de `clamp(18px, 1.6vw, 28px)` para `clamp(22px, 2vw, 36px)`. (2) Paper padding de `xs` para `sm`. (3) ActionIcons de pontos aumentados de 30×30 para 36×36px (`size="md"`). (4) ActionIcons de vant/pun aumentados de 26×26 para 32×32px (`size="md"`). (5) Texto label "pts" restaurado para `+{pontos} pts` (era `+{pontos}`). (6) Labels de nome/faixa/equipe aumentados de `size="xs"` para `size="sm"`. (7) Gap interno do Stack aumentado de `4` para `6`. (8) Alert de desclassificação com `IconAlertTriangle size={16}` (era 14).

### [corrigido] placar 100% altura sem scroll + botão voltar ao lado do título + sem botão duplicado + Ctrl+Z
**Data:** 2026-06-30
**Comportamento atual:** (1) O placar gerava scroll porque o `PageLayout` tinha padding excessivo e o botão voltar ficava acima do Paper, desperdiçando espaço vertical. (2) Existiam dois botões de iniciar o tempo: um dedicado no barra de controles e o cronômetro clicável — redundância confusa. (3) Vantagens e punições ficavam ocultas por falta de espaço. (4) Não havia atalho para zerar placar e restaurar tempo.
**Comportamento esperado:** Todo o conteúdo do placar cabe em 100% da viewport sem scroll. Botão voltar ao lado esquerdo do título dentro do Paper. Apenas uma forma de iniciar/pausar o tempo (cronômetro clicável + barra de controles compacta com Zerar/Iniciar pequenos). Ctrl+Z zera placar e restaura tempo cheio. Vantagens e punições sempre visíveis.
**Escopo:** `src/components/PageLayout.tsx`, `src/pages/PlacarLuta.tsx`, `src/pages/PlacarLutaCasada.tsx`
**Ação:** (1) `PageLayout`: botão voltar movido para dentro do Paper ao lado do título (`Group gap="xs" wrap="nowrap"`), padding reduzido de `clamp(12px, 2vw, 24px)` para `clamp(8px, 1.5vw, 16px)`, Container padding reduzido. (2) `PlacarLuta`/`PlacarLutaCasada`: barra de controles compacta com botões `size="xs"`, cronômetro com `p="xs"`, fonte "TEMPO ESGOTADO" reduzida para `clamp(28px, 4vw, 60px)`. (3) `AtletaPanel`: padding `p="md"` → `p="xs"`, gaps reduzidos (`gap="sm"` → `gap={4}`), ActionIcons de 36→30px (pontos) e 28→26px (vant/pun), fonte labels reduzida. (4) Footer buttons `size="md"` → `size="xs"`, texto encurtado ("Finalizar", "Voltar", "Telão"). (5) Hook `useCtrlZReset` adicionado para Ctrl+Z zerar placar e restaurar tempo. (6) `Stack gap="sm"` → `gap="xs"` no container principal.

### [corrigido] placar tem que caber em 100% de altura da tela sem scroll, ajuste das alturas
**Data:** 2026-06-30
**Comportamento atual:** O placar ainda gerava scroll porque o `Stack` usava `overflow: 'auto'`, os `AtletaPanel` não flexionavam, as fontes eram grandes demais e os botões/controles tinham tamanhos fixos excessivos.
**Comportamento esperado:** Todo o conteúdo do placar cabe em 100% da viewport sem scroll em nenhum lugar.
**Escopo:** `src/pages/PlacarLuta.tsx`, `src/pages/PlacarLutaCasada.tsx`
**Ação:** (1) `overflow: 'auto'` → `overflow: 'hidden'` no Stack principal. (2) Group dos AtletaPanels com `flex: 1, minHeight: 0`. (3) Paper do AtletaPanel com `flex: 1, minHeight: 0, overflow: 'hidden'`. (4) Fontes reduzidas: TOTAL `clamp(40px, 3vw, 72px)`, COUNTER `clamp(24px, 1.6vw, 40px)`, VANT/PUN `clamp(16px, 1.4vw, 24px)`, NOME `clamp(18px, 1.6vw, 28px)`, CRONOMETRO `clamp(48px, 4vw, 100px)`. (5) ActionIcons de 44→36 (pontos) e 32→28 (vant/pun). (6) Botões de `lg`→`md`. (7) Padding reduzido (`xl`→`md` no Paper, `sm`→`xs` nos controles). (8) Todos os elementos de controle com `flexShrink: 0`.

### [corrigido] placar tem que caber em 100% de altura da tela sem scroll
**Data:** 2026-06-30
**Comportamento atual:** As telas PlacarLuta e PlacarLutaCasada geravam scroll vertical porque `AtletaPanel` tinha `minHeight: 540`, o cronômetro `minHeight: 140` e o `PageLayout` usava `minHeight: 100vh` sem restrição de overflow.
**Comportamento esperado:** Todo o conteúdo do placar deve caber em 100% da altura da viewport sem scroll.
**Escopo:** `src/pages/PlacarLuta.tsx`, `src/pages/PlacarLutaCasada.tsx`, `src/components/PageLayout.tsx`
**Ação:** (1) Removido `minHeight: 540` do `AtletaPanel`. (2) Reduzido `minHeight` do cronômetro de 140 para 100. (3) Adicionada prop `fullHeight` ao `PageLayout` que usa `height: 100vh` + `overflow: hidden` em vez de `minHeight`. (4) `Stack` principal com `overflow: auto` para permitir scroll interno se necessário. (5) Aplicado `fullHeight` em PlacarLuta e PlacarLutaCasada.

### [corrigido] telão, tempo na cor branca, vantagem na cor verde, punição na cor vermelha
**Data:** 2026-06-30
**Comportamento atual:** O cronômetro do telão mudava de cor dinamicamente (verde=rodando, vermelho=esgotado, branco=pausado). Vantagens e punições usavam a mesma cor do tema (branco/preto).
**Comportamento esperado:** Cronômetro sempre em branco. Vantagens em verde (`#22c55e`). Punições em vermelho (`#fa5252`).
**Escopo:** `src/pages/PlacarExibicao.tsx`
**Ação:** `corCronometro` fixada como `'#ffffff'`. Componente `ColunaPlacar` usa cores dedicadas: `VERDE` para label "Vant" e `VERMELHO` para label "Pun", tanto no label quanto no valor.

### [corrigido] telão, nome da equipe em baixo do nome, cor de faixa em baixo
**Data:** 2026-06-30
**Comportamento atual:** O telão exibia apenas o nome do atleta, sem equipe nem faixa.
**Comportamento esperado:** Equipe exibida abaixo do nome (texto menor, cor secundária). Faixa exibida abaixo da equipe como `Badge` colorido com a cor correspondente.
**Escopo:** `src/pages/PlacarExibicao.tsx`
**Ação:** Adicionadas props `equipe` e `faixa` ao componente `LadoAtleta`. Equipe renderizada com `textTransform: capitalize` e cor secundária. Faixa renderizada como `Badge` com cor de `FAIXA_COLORS` (mesmo mapeamento de `AdminAthletes.tsx`). Dados `equipeA/equipeB` e `faixaA/faixaB` já eram enviados pelo PlacarLuta/PlacarLutaCasada — apenas adicionado ao `LadoAtleta`.

### [corrigido] pontuação total esta muito grande
**Data:** 2026-06-30
**Comportamento atual:** A fonte do placar total no telão (`PlacarExibicao.tsx`) usava `clamp(52px, 7vw, 110px)`, proporcionalmente grande demais para um banner de 10% da altura da tela.
**Comportamento esperado:** Fonte do total em tamanho adequado para o banner, com label "Total" acima do valor. Utilizado `clamp(28px, 3.5vw, 64px)` com label.
**Escopo:** `src/pages/PlacarExibicao.tsx`
**Ação:** Reduzida fonte do total e adicionado label "Total" acima do valor, seguindo o padrão label-acima/valor-abixo da spec.

### [corrigido] vantagem e punição tem que renderizar de forma condicional
**Data:** 2026-06-30
**Comportamento atual:** O telão (`PlacarExibicao.tsx`) exibia apenas Nome + Total para cada atleta, sem mostrar vantagens nem punições.
**Comportamento esperado:** Colunas [Total, Vantagem, Punição] com label acima e valor abaixo. V e P condicionais — só aparecem quando > 0.
**Escopo:** `src/pages/PlacarExibicao.tsx`
**Ação:** Adicionada componente `ColunaPlacar` reutilizável. Colunas de Vantagem e Punição renderizadas condicionalmente (`{placar.vantagens > 0 && ...}`). Fonte do nome reduzida para `clamp(14px, 1.4vw, 24px)`.



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
- **Documento de requisitos** `doc/requisitos.md`
- **Documentação técnica existente** `implementado/{nome-da-feature}.md`: identifique padrões e convenções já estabelecidos
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

### 5.1 UI/UX Responsivo — Obrigatório para qualquer tela ou componente visual

> ⚠️ Toda implementação com interface visual deve considerar os breakpoints abaixo. Não é aceitável desenvolver apenas para um tamanho de tela.

**Breakpoints de referência:**

| Contexto       | Largura aproximada | Exemplos de dispositivo              |
| -------------- | ------------------ | ------------------------------------ |
| Mobile pequeno | até 375px          | iPhone SE, Android compacto          |
| Mobile padrão  | 376px – 430px      | iPhone 14/15, Pixel                  |
| Tablet         | 431px – 768px      | iPad mini, tablets Android           |
| Notebook       | 769px – 1280px     | Laptops 13"–15"                      |
| Desktop        | acima de 1280px    | Monitores externos, telas widescreen |

**Regras obrigatórias ao implementar UI:**

- [ ] Layout não quebra em nenhum dos breakpoints listados acima
- [ ] Elementos de toque (botões, inputs) têm área mínima de 44x44px em mobile
- [ ] Textos permanecem legíveis sem zoom em telas pequenas (mínimo 14px corpo, 12px secundário)
- [ ] Navegação e menus adaptam-se ao espaço disponível (ex: menu hamburguer em mobile, sidebar em desktop)
- [ ] Imagens e ícones escalam corretamente sem distorção
- [ ] Espaçamentos internos (padding/margin) são proporcionais ao tamanho da tela
- [ ] Nenhum conteúdo principal fica cortado ou inacessível sem scroll horizontal indesejado
- [ ] Formulários e listas têm comportamento adequado em teclado virtual (mobile) — sem sobreposição de elementos

**Para projetos React Native (ct-imperio-app):**

- Usar `Dimensions`, `useWindowDimensions` ou `flexbox` para layouts fluidos
- Nunca usar valores fixos de largura em px para containers principais
- Testar em emulador com telas pequenas (ex: Pixel 4a) e grandes (ex: Pixel 9 Pro XL)
- Considerar Safe Area (`useSafeAreaInsets`) em todos os layouts de tela cheia

**Para projetos Web (ct-imperio-web, Sigma):**

- Usar unidades relativas (`rem`, `%`, `vw`, `vh`) em vez de `px` fixo onde possível
- Mobile-first: estilizar para telas pequenas e sobrescrever para maiores com `min-width`
- Garantir que a experiência em notebook (769px–1280px) não seja um "desktop encolhido" — revisar grids e proporções
- Testar com DevTools em pelo menos: 375px (mobile), 768px (tablet), 1024px (notebook), 1440px (desktop)

---

## 6. Analise da Aplicação

- **Arquitetura geral:** camadas envolvidas (frontend, backend, banco, integrações)
- **Padrões em uso:** naming conventions, estrutura de pastas, padrões de componentes ou repositórios
- **Fluxo de dados:** de onde os dados vêm, como trafegam, onde são persistidos
- **Contratos de API:** endpoints existentes, formato de request/response, status codes

---

## 7. Arquivos Envolvidos

| Arquivo                               | Acao      | Razao                                   |
| ------------------------------------- | --------- | --------------------------------------- |
| `src/components/MeuComponente.vue`    | Modificar | Adicionar nova prop e emissão de evento |
| `src/services/MeuService.ts`          | Criar     | Encapsular chamada ao novo endpoint     |
| `Controllers/MeuController.cs`        | Modificar | Adicionar novo endpoint POST            |
| `Repositories/MeuRepositorio.cs`      | Modificar | Adicionar query para novo filtro        |
| `migrations/2025_xx_xx_descricao.sql` | Criar     | Adicionar nova coluna na tabela         |

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
- [ ] Se houver interface visual: revisei os requisitos de UI/UX responsivo da seção 5.1 e planejo implementar para todos os breakpoints relevantes

> ⚠️ Se qualquer item do checklist estiver pendente, resolva antes de escrever código.

---

## Instrucoes para a IA

**Ao iniciar qualquer tarefa com este documento:**

1. Leia a seção **Problemas Encontrados**. Se houver itens `[aberto]`, trate-os PRIMEIRO antes de qualquer nova feature.
2. Para cada item `[aberto]` resolvido: mova-o para **Histórico de Correções** com o formato estabelecido e atualize os RF, CA e Passos afetados.
3. Crie o arquivo `implementado/{nome-da-feature}.md` seguindo todas as seções deste guia antes de escrever qualquer código.
4. Após criar o `.md`, revise-o para verificar coerência. Só então implemente.
5. Ao finalizar qualquer ciclo (feature nova ou correção), registre no **Histórico de Correções** em spec.md NÃO alterar os comentario e NÃO apagar algo, apenas adicione suas observaçoes e atualize o documento `implementado/{nome-da-feature}.md` caso seja implementado uma nova regra de negocio. Permitido melhorar a descrição e titulo do problema aberto
6. **Para qualquer tarefa com interface visual:** aplique obrigatoriamente os requisitos da seção **5.1 UI/UX Responsivo**. Isso inclui: planejar o layout para mobile, notebook e desktop antes de codificar; nunca assumir que o layout funciona em todos os tamanhos sem validação explícita; e registrar nos critérios de aceite (seção 9) ao menos um CA de responsividade por tela ou componente novo.

## Antes de atualizar a doc de requisitos.md garanta que esta seguindo os principios a baixo

# Pontos Principais para um Bom Documento de Requisitos

> Consolidado a partir das referências clássicas: Sommerville, Wiegers, Davis, IEEE 830 e IREB.

---

## 1. Clareza e Não Ambiguidade

Todo requisito deve ter uma única interpretação possível. Linguagem vaga como "o sistema deve ser rápido" ou "fácil de usar" é recorrentemente apontada como a principal fonte de falhas em projetos.

- Evitar termos subjetivos: _eficiente_, _robusto_, _amigável_, _adequado_
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

**Referências:** Wiegers (_Software Requirements_), IREB

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

| Atributo        | Pergunta que deve ser respondida com "sim"     |
| --------------- | ---------------------------------------------- |
| Claro           | Qualquer leitor interpretaria da mesma forma?  |
| Completo        | Todos os cenários e restrições estão cobertos? |
| Consistente     | Nenhum requisito contradiz outro?              |
| Verificável     | É possível escrever um teste para isso?        |
| Rastreável      | Sei de onde veio e onde está implementado?     |
| Atômico         | Expressa uma única ideia?                      |
| Priorizado      | Sei o que é essencial vs. desejável?           |
| Bem estruturado | O documento tem seções claras e navegáveis?    |
| Validado        | Os stakeholders revisaram e aprovaram?         |
| Versionado      | Mudanças são registradas e controladas?        |

---

Para que um documento de requisitos (seja ele um _Software Requirements Specification_ - SRS, ou uma lista de _User Stories_) seja considerado de alta qualidade, a literatura consolidada — especialmente seguindo as diretrizes de autores como **Karl Wiegers** e **Ian Sommerville** — enfatiza que ele deve servir como uma ponte clara entre o problema de negócio e a solução técnica.

Aqui estão os pontos fundamentais que esses autores consideram cruciais para um documento de requisitos eficaz:

### 1. Clareza e Ambiguidade Zero

A característica mais crítica de um requisito é que ele deve ser interpretado da mesma forma por desenvolvedores, testadores e clientes.

- **O que evitar:** Termos vagos como "rápido", "fácil de usar" ou "eficiente".
- **O que buscar:** Descrições quantificáveis. Em vez de "o sistema deve ser rápido", use "o tempo de resposta para a consulta X deve ser inferior a 2 segundos em condições de carga normal".

### 2. Rastreabilidade

Um bom documento permite que você saiba a origem de cada requisito.

- **Por que importa:** Se um requisito for alterado ou excluído, você precisa saber qual funcionalidade ele afeta e qual regra de negócio ou _stakeholder_ o originou. A rastreabilidade conecta o requisito à sua fonte e ao seu teste correspondente.

### 3. Verificabilidade (Testabilidade)

Se um requisito não puder ser testado, ele não deve existir.

- **A regra de ouro:** Para cada requisito, deve ser possível definir um critério de aceitação claro. Se você não consegue escrever um caso de teste para verificar se o requisito foi atendido, ele está mal formulado.

### 4. Completude e Consistência

- **Completude:** O documento deve cobrir todos os cenários, incluindo as exceções. O que acontece se a internet cair? O que acontece se o usuário errar a senha três vezes? Um documento que só descreve o "caminho feliz" é insuficiente.
- **Consistência:** O documento não pode conter contradições internas. Um requisito de segurança não pode invalidar um requisito de usabilidade sem que haja uma priorização explícita.

### 5. Priorização

Nem tudo é urgente ou essencial para a versão inicial (_MVP_). Os autores recomendam classificar os requisitos, geralmente usando métodos como **MoSCoW** (_Must have, Should have, Could have, Won't have_). Isso é vital para gerenciar o escopo e evitar que projetos estourem prazos por falta de foco.

---

### Estrutura Sugerida para um Documento de Requisitos

Embora o formato varie (de documentos formais do IEEE 830 até _backlogs_ ágeis), estes são os blocos que não podem faltar:

| Seção                         | O que deve conter                                              |
| ----------------------------- | -------------------------------------------------------------- |
| **Visão Geral**               | O problema que está sendo resolvido e os objetivos do sistema. |
| **Requisitos Funcionais**     | O que o sistema deve fazer (o comportamento).                  |
| **Requisitos Não Funcionais** | Atributos de qualidade (desempenho, segurança, portabilidade). |
| **Regras de Negócio**         | Limitações e diretrizes que governam o processo.               |
| **Cenários/Casos de Uso**     | O fluxo de interação entre o usuário e o sistema.              |

---

⚠️ **Atenção:** Evite documentos excessivamente longos que ninguém lê. O segredo moderno não é a quantidade de páginas, mas a **precisão das informações**. Se o documento se torna obsoleto assim que o código começa a ser escrito, ele falhou em sua missão de comunicação.
