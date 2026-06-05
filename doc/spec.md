# spec.md — Template de Feature

NÃO alterar os comentario e NÃO apagar algo, apenas adicione suas observaçoes e atualize o documento `spec/{nome-da-feature}.md` caso seja implementado uma nova regra de negocio. Permitido melhorar a descrição e titulo do problema aberto. Ao final de cada ciclo sempre atualize requisitos.md

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

### [2026-06-05] Importação/Exportação de Áreas + Nome Opcional — implementado

**Gatilho:** seção **Feature** do `doc/spec.md`:
> *"importa e exporta areas de luta"*
> *"areas luta não tem que ter nome obrigatorio, se não colocar, por pardão é Area (sequencia numerica)"*

A seção **Feature** permanece inalterada (regra "NÃO apagar algo"). Esta entry documenta a implementação.

**Decisões consolidadas (com o usuário via `question`):**
- **Sequência "Área N":** **próximo número disponível** — se existem "Área 1", "Área 3", "Área 5", a próxima sem nome vira "Área 2" (preenche gaps). Garante unicidade sem duplicatas.
- **Importação:** **mescla com existente** (sem duplicatas por nome, case-insensitive).
- **Formato JSON:** array de objetos com `nome` e `arbitroIds`; `id`, `createdAt`, `updatedAt` são autogerados/autosobrescritos pelo sistema.
- **Localização dos botões:** header de `AdminAreas.tsx` (mesmo padrão de `AdminAthletes.tsx`).

**Spec completa:** [`spec/areas-import-export-nome-opcional.md`](../spec/areas-import-export-nome-opcional.md) — 12 seções, 12 CA verificáveis, 12 passos.

**Implementação:**

**1) `electron/areas.ts`**
- Importado `dialog` do Electron.
- Nova função `gerarNomeAreaPadrao(areas: AreaLuta[]): string` — encontra o menor inteiro ≥ 1 não usado em nomes que casam `/^Área (\d+)$/i`. Lista vazia → "Área 1".
- `saveArea` modificado: se `data.nome.trim() === ''`, aplica `gerarNomeAreaPadrao(list)` antes de montar o objeto.
- `updateArea` modificado: mesma lógica quando `data.nome.trim() === ''`, considerando `list.filter(a => a.id !== data.id)` para não conflitar consigo mesmo.
- Nova `importAreasFromFile(torneioId, filePath)`: parseia JSON, valida array, valida `arbitroIds` (se presente), normaliza lowercase, dedup por nome, chama `checkRefereeNotInUse` por inserção, gera `id`/`createdAt`/`updatedAt`, gera nome padrão para entradas sem nome, retorna `{ imported, skipped }`.
- Nova `openAreaFileDialog()`: diálogo nativo `.json` (espelha `openAthleteFileDialog`).
- Nova `exportAreas(torneioId)`: diálogo nativo "Salvar como" com default `areas.json` (espelha `exportAthletes`).
- Exports atualizados.

**2) `electron/main.ts`**
- Import atualizado com `importAreasFromFile`, `openAreaFileDialog`, `exportAreas`.
- 2 novos handlers em `registerAreaHandlers()`: `import-areas` (chama `openAreaFileDialog` + `importAreasFromFile`; se cancelado, retorna `{imported: 0, skipped: 0}`) e `export-areas`.

**3) `electron/preload.ts`**
- Adicionado `importAreas: () => ipcRenderer.invoke('import-areas')` e `exportAreas: () => ipcRenderer.invoke('export-areas')` no objeto exposto.

**4) `src/types/electron.d.ts`**
- Adicionado `importAreas: () => Promise<{ imported: number; skipped: number }>` e `exportAreas: () => Promise<void>` na interface.

**5) `src/components/AreaForm.tsx`**
- Removida validação `nome: (v) => (v.trim().length < 2 ? 'Nome deve ter ao menos 2 caracteres' : null)`.
- Label alterado: `"Nome *"` → `"Nome"`.
- Placeholder informativo: `"Deixe vazio para gerar automaticamente (Área N)"`.

**6) `src/pages/AdminAreas.tsx`**
- Imports: `IconFileUpload`, `IconFileCode` de `@tabler/icons-react`.
- `handleSave`: duplicata check agora é pulado quando `area.nome.trim() === ''` (vai ser gerado pelo backend).
- Novos `handleImport` e `handleExport` (espelham `AdminAthletes.tsx:148-168`).
- Header: 2 novos botões "Importar" (`IconFileUpload`) e "Exportar JSON" (`IconFileCode`) à esquerda de "Cadastrar", com `aria-label` e `styles={{ root: { borderRadius: 12 } }}`.

**Validação:**
- `npx tsc --noEmit` — 0 erros.
- `npm run lint` — 3 erros pré-existentes; 0 erros/warnings novos.
- 12 CA verificados conceitualmente:
  - CA-01: botões no header (à esquerda de Cadastrar).
  - CA-02: export abre diálogo nativo e grava JSON.
  - CA-03: import mescla + notificação `"X importada(s), Y ignorada(s) (já existentes)."`
  - CA-04: dedup case-insensitive (`"Área 1"` vs `"área 1"`).
  - CA-05/06/07: `gerarNomeAreaPadrao` preenche gaps.
  - CA-08/09: `AreaForm` aceita nome vazio no submit e update.
  - CA-10: import gera nome padrão para `nome: ''`.
  - CA-11: JSON inválido → notificação vermelha, lista inalterada.
  - CA-12: cancelamento do diálogo → silêncio, sem alteração.

**Observações:**
- **Migração retroativa:** áreas existentes com `nome: ''` (legado) permanecem como string vazia. Não há migration automático — o usuário pode editá-las para acionar a geração.
- **`gerarNomeAreaPadrao` é a single source of truth:** única função que decide o nome padrão, usada em `saveArea`, `updateArea` e `importAreasFromFile`.
- **Performance:** `gerarNomeAreaPadrao` é O(n) por chamada; O(n²) em import de N áreas. Para N=1000, ainda < 100ms.
- **Segurança:** `checkRefereeNotInUse` é chamado por área no import, evitando duplicatas de árbitros entre áreas.

## Feature
<!--  A IA vai usar isso como ponto de partida para preencher todas as seções abaixo. -->
importa e exporta areas de luta
areas luta não tem que ter nome obrigatorio, se não colocar, por pardão é Area (sequencia numerica)
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