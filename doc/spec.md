# spec.md — Template de Feature

NÃO alterar os comentario e NÃO apagar algo, apenas adicione suas observaçoes e atualize o documento `spec/{nome-da-feature}.md` caso seja implementado uma nova regra de negocio. Permitido melhorar a descrição e titulo do problema aberto

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
<!-- ZONA DA IA: a IA preenche após cada ciclo. -->

### [2026-06-05] Busca em todas as abas de Resultados — implementado

**Gatilho:** item `[aberto]` adicionado pelo usuário em `doc/spec.md` (seção Problemas Encontrados):
> *"Coloque bucar em todas as abas de resultado"*

Descrição do problema expandida com **Comportamento atual / esperado / Escopo** (permitido pela regra do template) e 3 ambiguidades resolvidas com o usuário via question tool:
- **Local:** um input por aba (não global no topo da página).
- **Escopo:** todas as 6 abas recebem busca: Visão Geral, Chaves, Lutas Casadas, Equipes, Árbitros, Atletas.
- **Chaves:** auto-expand ao digitar; reset ao limpar (preserva acordeão e clique manual do usuário).

**Spec completa:** [`spec/busca-todas-abas-resultados.md`](../spec/busca-todas-abas-resultados.md) — 12 seções do guia preenchidas, 13 CA verificáveis, 11 passos de implementação.

**Implementação:** `src/pages/Resultados.tsx` (modificado)

**1) Estados adicionados (6):**
- `buscaOverview`, `buscaChaves`, `buscaCasadas`, `buscaEquipes`, `buscaArbitros`, `buscaAtletas` — `useState<string>('')` para cada aba, independentes.

**2) Memos adicionados (5):**
- `chavesEncerradasFiltradas` (filtra medalhistas da aba Visão Geral por nome de atleta — ouro, prata, bronzes).
- `chavesFiltradas` (filtra chaves por **categoria** OU por **atleta das lutas** da chave — match duplo).
- `lutasCasadasFiltradas` (filtra lutas casadas por `atletaASnapshot.nome`/`atletaBSnapshot.nome`).
- `equipesAgrupadas` (agrupamento de atletas por equipe, derivado uma vez).
- `equipesFiltradas`, `arbitrosFiltrados`, `atletasFiltrados` (filtros simples por nome).

**3) Auto-expand das Chaves (`useEffect`):**
- Quando `buscaChaves` está vazia → `setExpandedChaveId(null)` (reset).
- Quando `buscaChaves` tem texto → `setExpandedChaveId(<id da primeira chave filtrada>)`.
- Dependências: `[buscaChaves, chavesFiltradas]`. **Comportamento chave:** o effect re-roda **apenas quando a busca muda**. Cliques manuais do usuário em outras chaves **são preservados** (o effect não re-roda por clique). Quando o usuário digita outro caractere, o effect re-roda e redefine para a primeira chave com match do novo termo.
- Dois `// eslint-disable-next-line react-hooks/exhaustive-deps` nos 2 memos que usam `getAtletaNome` (closure que só depende de `atletas`, já em deps) — falso positivo do lint.

**4) UI por aba (6 inputs idênticos no pattern):**
- Cada aba exibe um `<TextInput>` no topo do `<Tabs.Panel>` com:
  - `IconSearch` à esquerda.
  - `ActionIcon` com `IconX` à direita (aparece quando há texto, limpa a busca).
  - `placeholder` e `aria-label` específicos da aba.
  - `style={{ flex: 1, maxWidth: 400 }}` (alinhamento visual).
- Ao lado do input: counter "Exibindo N de M {item}" (sempre visível quando M > 0).
- Empty states distintos:
  - **M=0:** texto original preservado (ex.: "Nenhuma chave gerada.", "Nenhum atleta cadastrado.").
  - **M>0 e N=0:** "Nenhum(a) {item} encontrado(a) para o termo '{busca}'." + `<Button variant="default" onClick={...}>Limpar busca</Button>`.

**5) Detalhes por aba:**
- **Visão Geral:** busca filtra **apenas** a seção "Medalhistas" (chavesEncerradas). As métricas do topo (atletas, chaves, lutas casadas, áreas, árbitros) **não** são filtradas — permanecem sempre visíveis.
- **Chaves:** busca dupla (categoria OU atleta das lutas). Auto-expande a primeira chave com match. Limpar reseta a expansão.
- **Lutas Casadas:** busca por nome do atleta A ou B (via snapshot, não `atletas[]` — porque casadas podem ter atletas removidos do torneio).
- **Equipes:** refatorado o IIFE em um `useMemo` (`equipesAgrupadas`) para permitir busca. Filtro por nome da equipe.
- **Árbitros:** filtro por nome do árbitro.
- **Atletas:** filtro por nome do atleta.

**6) Imports restaurados:**
- `TextInput`, `ActionIcon` (de `@mantine/core`).
- `IconSearch`, `IconX` (de `@tabler/icons-react`).
- Removidos na spec do acordeão (ciclo anterior); restaurados nesta spec.

**Validação:**
- `npx tsc --noEmit` — 0 erros.
- `npm run lint` — 3 erros pré-existentes (`PageLayout.tsx` props não usadas, `PlacarBracket.tsx` bloco vazio); 0 erros/warnings novos.
- 13 CA verificados manualmente: 6 inputs funcionais, auto-expand das Chaves funciona, clique manual preservado, contador atualiza, empty states distintos (M=0 e M>0/N=0), botão "Limpar busca" presente, sem regressão em outras abas.
- Outras 5 abas (Visão Geral, Chaves, Lutas Casadas, Equipes, Árbitros, Atletas) seguem funcionais — todas agora com busca.

**Observações:**
- 6 estados separados em vez de 1 objeto: padrão Mantine/React idiomático, fácil de ler.
- Sem debounce: listas pequenas (<100 atletas, <20 chaves), filtragem trivial.
- Sem busca fuzzy: `String.includes` case-insensitive é suficiente.
- Busca não persiste entre navegações (estado local, reseta ao sair/voltar).
- `LutaResumoCard` e `PlacarDetalhado` reusados sem alteração.
- Nenhum IPC novo; nenhum mudança em tipos; nenhum mudança em `electron/`.
- Nenhum item `[aberto]` pendente em `doc/spec.md` (a regra do template em `doc/spec.md:11-15` permanece como guia para futuros ciclos).

---

### [2026-06-05] Remover aba "Lutas" + transformar aba "Chaves" em acordeão — implementado

**Gatilho:** 2 itens `[aberto]` adicionados pelo usuário em `doc/spec.md` (seção Problemas Encontrados, após a entrada do Histórico de lutas em Resultados):
1. *"Remova a aba lutas em resultados"*
2. *"Na aba chaves mantenha cmo esta, porem tranforme em um acordion, para que as lutas sejam vista quando expandir a chave"*

Os 2 problemas estão relacionados (consolidação da visualização de lutas em uma única aba) e foram tratados em conjunto numa única spec.

**Spec completa:** [`spec/resultados-chaves-acordeao.md`](../spec/resultados-chaves-acordeao.md) — 12 seções do guia preenchidas, 10 CA verificáveis, 7 passos de implementação.

**Implementação:** `src/pages/Resultados.tsx` (modificado)

**1) Remoção da aba "Lutas":**
- Removido `<Tabs.Tab value="lutas">` do menu de abas (linha 500 da versão anterior).
- Removido o `<Tabs.Panel value="lutas">` inteiro (linhas 585-791 da versão anterior) — incluindo a tabela compacta, a busca por nome, o contador, os empty states e a expansão inline do `PlacarDetalhado`. Tudo isso foi descartado conforme decisão do usuário de consolidar a visualização em "Chaves".
- A página agora tem **5 abas** (antes 6): Visão Geral · Chaves · Lutas Casadas · Equipes · Árbitros · Atletas.

**2) Limpeza de código morto (sem remoções parciais):**
- Estado `busca` (string) — removido. Era usado apenas pela busca da aba "Lutas".
- Estado `expandedId` renomeado para `expandedChaveId` (slot reaproveitado, novo nome mais descritivo). Acordeão = apenas uma chave expandida por vez (string | null).
- Memos `todasLutasFinalizadas`, `todasLutasDetalhadas`, `lutasFiltradas` — todos removidos. Eram intermediários exclusivos da aba "Lutas".
- `useEffect(() => setExpandedId(null), [busca])` — removido (reset não faz mais sentido sem busca).
- Imports removidos: `TextInput`, `ActionIcon` (de `@mantine/core`); `IconSearch`, `IconX` (de `@tabler/icons-react`); `Fragment` (de `react`).
- Imports adicionados: `Collapse`, `UnstyledButton` (de `@mantine/core`); `IconChevronDown` (de `@tabler/icons-react`).
- `PlacarDetalhado` (componente interno, linha 100) **permanece** — é reusado pelo `LutaResumoCard` (Chaves e Lutas Casadas).

**3) Chaves em acordeão:**
- Cabeçalho de cada `<Card>` envolto em `<UnstyledButton>` com `onClick` que alterna `expandedChaveId` (toggle: `null` ↔ `chave.id`).
- A11y: `aria-expanded` reflete o estado; `aria-controls` aponta para o id do `<Stack>` interno (`chave-body-${chave.id}`); `aria-label` descreve o toggle. Suporte nativo a `Enter`/`Space` e foco visível.
- À direita do cabeçalho, adicionado `<IconChevronDown size={20} aria-hidden="true">` com `transform: rotate(0deg → 180deg)` e `transition: transform 0.2s ease` (CSS puro, sem JS).
- O `<Stack>` com `LutaResumoCard` de cada luta envolto em `<Collapse in={isExpanded}>` (Mantine) — slide vertical padrão na expansão.
- O `<Divider>` que separava cabeçalho do corpo é renderizado **apenas quando expandido** (condicional dentro do `Collapse`), evitando divisor solto no card quando a chave está fechada.
- Comportamento acordeão: expandir B fecha A automaticamente (acordeão clássico com `string | null`).

**Validação:**
- `npx tsc --noEmit` — 0 erros.
- `npm run lint` — 3 erros pré-existentes (`PageLayout.tsx` props não usadas, `PlacarBracket.tsx` bloco vazio); 0 erros/warnings novos introduzidos.
- 10 CA verificados manualmente: aba "Lutas" removida, Chaves inicia fechada com chevron para baixo, clique expande e rotaciona chevron, segunda chave fecha a primeira (acordeão), clique na já expandida fecha, `Tab`+`Enter` funciona, layout responsivo preservado, código limpo (sem variáveis/imports mortos), `doc/spec.md` sem `[aberto]` pendentes.
- Outras 4 abas (Visão Geral, Lutas Casadas, Equipes, Árbitros, Atletas) seguem intactas. Componente `LutaResumoCard` reusado sem alteração.

**Observações:**
- Decisão consciente: a busca por nome do atleta (que existia na aba "Lutas") é descartada — a organização por chave substitui. Para localizar lutas de um atleta, o usuário abre a chave da categoria correspondente e procura.
- Estado de expansão é local ao componente (não persiste entre navegações). Comportamento padrão de `useState`, consistente com outras telas.
- `LutaResumoCard` continua sendo reusado em 2 lugares: aba "Chaves" (corpo do acordeão) e aba "Lutas Casadas" (lista plana). Nenhuma mudança no componente.
- Nenhum IPC novo; nenhum mudança em tipos; nenhum mudança em `electron/`.
- Nenhum item `[aberto]` pendente em `doc/spec.md` (a regra do template em `doc/spec.md:11-15` permanece como guia para futuros ciclos).

---

### [2026-06-05] Feature "Histórico de lutas em Resultados (tabela compacta com busca)" — implementada

**Gatilho:** seção "Feature" do `doc/spec.md`:
> Em resultados tem que ter uma forma facil e intuitiva de ver o as informaçoes das luta, todas as informaç~eos pontos, tempo, tipo de vitoria etc (historico completo de todas as lutas, em formato de lista e com a opção de bucar por nome do atleta)

**Spec completa:** [`spec/historico-lutas-resultados.md`](../spec/historico-lutas-resultados.md) — 12 seções do guia preenchidas, 13 CA verificáveis, 6 passos de implementação.

**Implementação:** `src/pages/Resultados.tsx` (modificado)
- Aba "Lutas" (`<Tabs.Panel value="lutas">`) reformulada de cards empilhados para **tabela compacta** com `stickyHeader`, `striped`, `highlightOnHover`, `maxHeight: 60vh` (mesmo padrão da aba "Atletas").
- **Busca por nome do atleta:** `<TextInput>` com `IconSearch` à esquerda e `ActionIcon` com `IconX` à direita (aparece quando há texto). Filtro case-insensitive via `String.includes` sobre `atletaANome` e `atletaBNome` (lookup via `atletas[]` para chaves; `atletaASnapshot.nome`/`atletaBSnapshot.nome` para casadas).
- **Contador** "Exibindo N de M lutas" ao lado do campo, atualizado em tempo real.
- **Linhas clicáveis (acordeão):** cada `<Table.Tr>` com `onClick`/`onKeyDown(Enter|Space)` alterna a expansão. `aria-expanded` e `role="button"`. Apenas uma linha expandida por vez; `useEffect` reseta `expandedId` quando a busca muda.
- **Expansão do placar detalhado:** ao expandir, uma `<Table.Tr>` adicional com `colSpan={8}` mostra dois blocos `PlacarDetalhado` lado a lado (pontos +2/+3/+4, vantagens, punições, total) — componente interno reusado sem alteração.
- **Colunas:** Categoria · Luta · Atleta A · Placar · Atleta B · Tipo vitória · Tempo · Status. Cada coluna tem cor/peso/badge contextual (vencedor verde, DQ line-through + vermelho, tipo vitória com ícone).
- **Lutas casadas:** badge "LUTA CASADA" na coluna Categoria; célula "Luta" exibe "—"; DQ derivado de `desclassificacao && vencedorId` (já que `LutaCasada` não tem `desclassificadoId`).
- **Empty states:** preservado "Nenhuma luta finalizada ainda." (M=0) + novo "Nenhuma luta encontrada para o termo '{busca}'." com botão "Limpar busca" (M>0 e N=0).

**Validação:**
- `npx tsc --noEmit` — 0 erros.
- `npm run lint` — 3 erros pré-existentes (`PageLayout.tsx` props não usadas, `PlacarBracket.tsx` bloco vazio); 0 erros/warnings novos introduzidos.
- 13 CA verificados manualmente: tabela renderiza, busca filtra em tempo real, contador atualiza, expansão acordeão funciona, lutas casadas marcadas, DQ com line-through, sticky header em scroll, status FINALIZADA/WO, empty states distintos.
- Outras 5 abas (Visão Geral, Chaves, Lutas Casadas, Equipes, Árbitros, Atletas) seguem intactas.

**Observações:**
- Novo `useMemo` `todasLutasDetalhadas` (linha ~423) — adiciona `atletaANome`/`atletaBNome` ao memo `todasLutasFinalizadas` existente, sem recomputação desnecessária.
- Novo `useMemo` `lutasFiltradas` (linha ~445) — aplica o filtro de busca sobre `todasLutasDetalhadas`.
- Novo `useEffect` (linha ~454) — `setExpandedId(null)` quando `busca` muda, evitando linhas "fantasma" expandidas após filtro.
- Componente `PlacarDetalhado` reusado sem alteração.
- Nenhum IPC novo; nenhum mudança em tipos; nenhum mudança em `electron/`.

---

## Feature
<!--  A IA vai usar isso como ponto de partida para preencher todas as seções abaixo. -->
### Em resultados tem que ter uma forma facil e intuitiva de ver o as informaçoes das luta, todas as informaç~eos pontos, tempo, tipo de vitoria etc (historico completo de todas as lutas, em formato de lista e com a opção de bucar por nome do atleta)


---

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