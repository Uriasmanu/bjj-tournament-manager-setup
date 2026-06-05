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
### [resolvido] Botao cadastrar atleta no formulario esta feio
### [resolvido] peso e genero deveriam estar lado a lado e não um a baixo do outro no formulario
### [resolvido] Deletar atleta, arbitro,area,deve ser soft delete
### [resolvido] Nas listas de atleta, arbitro,area tera um botao de exibir apenas os deletados, e no nome tera o botao de desfazer ou apagar, esse apagar é permanente, aparece uma mensagem no centro da tela perguntando se tem certeza (ao habilitar o botão os atltas deletados a lista de atleta normal troca para a lista de apagados, só que meio apagados)
### [resolvido] import de torneio, deveria fazer merge nas informações caso o id do torneio seja o mesmo, exemplo, eu adicionei um atleta 10h50 e ele não existe nos outros JSON, então quando juntar tudo em uma maquina, esse atleta tem que permanecer, a data da ultima atualização vai ser importante, pois caso em um arquivo ele tenha sido adicionado as 10h50 e em outro arquivo ele foi deletado as 10h51, a informação de delete deve ser a que manda.
---


## Histórico de Correções
<!-- ZONA DA IA: a IA preenche após cada ciclo. -->

- **2026-06-05 — Importação de Torneio com Merge por `updatedAt` (last-write-wins)**
  - **Problema:** o handler `import-tournament` apenas criava torneio novo; quando o `id` já existia no disco, o sistema abria modal "Sobrescrever Torneio" e `import-tournament-overwrite` reescrevia o JSON do zero — **destrutivo**, perdendo silenciosamente qualquer mudança local (atletas cadastrados em uma máquina que não estavam no JSON importado da outra). Também perdia `createdAt`/`updatedAt`/`deletedAt` reais ao sempre setar `new Date().toISOString()` na normalização. Cenário descrito: atleta adicionado às 10h50 em uma máquina e deletado às 10h51 em outra — a informação do delete deveria prevalecer, mas o overwrite descartava a versão deletada mais recente.
  - **Solução:** refatorado `import-tournament` em `electron/tournament.ts` para fazer **merge por sub-array** quando o `id` do torneio já existe: `atletas`/`arbitros`/`areas` mesclados por item via regra last-write-wins em `updatedAt`; `chaves`/`lutasCasadas` mesclados pelo `updatedAt` do torneio pai (não têm `updatedAt` próprio). Itens com mesmo `id` em ambos os lados: vence o `updatedAt` mais recente — como `delete*`/`restore*` setam `updatedAt = now` simultaneamente a `deletedAt`, o delete recente naturalmente vence sobre a versão ativa mais antiga. Itens presentes em um único lado são preservados. Top-level: `nome`/`data` seguem o lado mais recente, `updatedAt` do torneio = `max(existing.updatedAt, incoming.updatedAt)`, `createdAt` preservado, `startedAt` preservado do existing (evento único). Identidade preservada: `id`/`createdAt`/`updatedAt`/`deletedAt`/`emChave` e demais campos dos sub-itens não são regenerados — apenas `nome`/`equipe` de atletas/árbitros são normalizados (`trim().toLowerCase()`). `id` ausente recebe `crypto.randomUUID()`; `createdAt`/`updatedAt` ausentes recebem `now` (auto-fix retroativo).
  - **Remoção do caminho destrutivo:** o handler IPC `import-tournament-overwrite`, o método `importTournamentOverwrite` em `electron/preload.ts` e a tipagem em `src/types/electron.d.ts` foram removidos. O modal "Sobrescrever Torneio" em `src/pages/ImportarTorneio.tsx` foi removido. Para descartar o torneio local e reimportar do zero, o usuário usa `delete-tournament` e depois importa o JSON novamente.
  - **Novo retorno de `import-tournament`:** `{ success: true; merged: boolean; created: number; updated: number; kept: number; removed: number }` (somatório dos 5 sub-arrays). Notificações no renderer: torneio novo → `"Torneio importado com sucesso!"` (verde); merge → `"Torneio mesclado: X adicionado(s), Y atualizado(s), Z mantido(s)."` (verde); se `removed > 0` → segunda notificação amarela `"W item(ns) marcados como deletados (delete recente prevaleceu)."`
  - **Backend (novo helper `mergeById`):** função genérica em `electron/tournament.ts` que recebe `existing[]` e `incoming[]` de `T extends { id: string; updatedAt: string; deletedAt?: string | null | undefined }` e retorna `{ merged, counters }`. Para `chaves`/`lutasCasadas` (sem `updatedAt` próprio), usado `mergeByIdForceWinner` que decide pelo `incomingIsMoreRecent` do torneio pai. Funções `normalizeAtleta`/`normalizeArbitro`/`normalizeArea` adicionadas para preservar identidade dos sub-itens (apenas normaliza `nome`/`equipe`; preenche `id`/`createdAt`/`updatedAt` ausentes; `deletedAt` preservado). `dedupById` usado para o caminho de torneio novo.
  - **Tipagem/preload:** `importTournament` em `electron/preload.ts` e `src/types/electron.d.ts` tipado com o novo retorno. `importTournamentOverwrite` removido de ambos.
  - **UI — comportamento detalhado:**
    - `ImportarTorneio.tsx` agora é um único passo: usuário seleciona JSON → botão "Importar" chama `importTournament` → sistema exibe notificação apropriada (sucesso novo, merge com contadores, ou merge com aviso de deletes) → navega para `/admin/listar-torneios`.
    - Modal de overwrite, estado `overwriteData` e `useDisclosure` foram removidos.
    - Validação de estrutura (`!data.id || !data.data`) preservada com notificação vermelha `"Arquivo inválido. Estrutura de torneio não reconhecida."`.
  - **Spec da feature:** `spec/import-torneio-merge.md`.
  - **Critérios de aceite:** CA-01 a CA-10 verificados — last-write-wins por `updatedAt`; delete recente vence; merge preserva itens únicos de cada lado; torneio novo não conflita com existente; JSON inválido bloqueado; handler overwrite removido; UI sem modal destrutivo; retorno tipado com contadores; `tsc --noEmit` sem novos erros; `doc/spec.md` e `doc/requisitos.md` atualizados.
  - **Impacto:** mudança não-destrutiva para usuários que sincronizam JSON entre máquinas. Comportamento existente de `loadTorneio`/`saveTorneio` e dos handlers `load-athletes`/`load-deleted-athletes`/etc. preservado. A UI passa a refletir o estado real do merge em vez de uma decisão binária sobrescrever/não-sobrescrever.
  - **Compatibilidade:** JSONs legados sem `deletedAt` continuam funcionando (auto-fix dos handlers `load*` preenche `null`). O `mergeById` trata `deletedAt` ausente como `null` na comparação. Nenhuma migração de dados necessária.
  - **Observação de design:** para `chaves` e `lutasCasadas` (que não têm `updatedAt` por item), o vencedor é decidido pelo `updatedAt` do torneio pai. Isso significa que se um torneio A é importado em uma máquina que já tem o mesmo id de torneio A com `updatedAt` mais recente, as chaves locais são preservadas. Se o `updatedAt` do incoming é mais recente, as chaves incoming vencem por completo (não há merge fino por chave individual). Decisão justificada pela ausência de timestamp por chave e pelo fato de as chaves serem fortemente acopladas ao torneio como um todo.

- **2026-06-05 — UI de Lixeira para Atleta, Árbitro e Área de Luta**
  - **Problema:** após o ciclo de soft delete, a UI de listagem (atletas/árbitros/áreas) não oferecia nenhuma forma de visualizar, restaurar ou excluir permanentemente os itens que foram soft-deletados. O usuário ficava sem回收 (回收) para itens deletados acidentalmente, e a ação de soft delete era efetivamente uma "exclusão definitiva" do ponto de vista do usuário.
  - **Solução:** adicionada a view "Lixeira" em `AdminAthletes.tsx`, `AdminArbitros.tsx` e `AdminAreas.tsx` acionada por um `Switch` "Mostrar apenas os deletados" no header de cada listagem. Quando o toggle é ligado, a página chama `loadDeleted*` (novo IPC) e exibe apenas os itens com `deletedAt != null`. A view de deletados oferece duas ações por linha: restaurar (`IconRestore` verde) e excluir permanentemente (`IconTrash` vermelho + modal centralizado de confirmação com aviso "Esta ação é IRREVERSÍVEL."). A view também suporta exclusão permanente em lote via checkboxes. O texto do modal de soft delete (visível na view ativos) foi atualizado para informar que o item "será movido para os deletados. Você poderá restaurá-lo na aba 'Mostrar apenas os deletados'.".
  - **Backend (novos handlers IPC):** 9 novos handlers em `electron/main.ts` — `load-deleted-athletes`/`restore-athlete` (já existente) + `permanently-delete-athlete`/`permanently-delete-athletes`; idem para árbitros e áreas. Funções correspondentes adicionadas em `electron/athletes.ts`, `electron/referees.ts` e `electron/areas.ts`. As funções `permanentlyDelete*` aplicam `splice` físico no array (não soft delete) e atualizam `updatedAt` do torneio. `loadDeleted*` reusa o auto-fix de `normalize*` para preencher `deletedAt` em itens legados.
  - **Tipagem/preload:** 9 novos métodos expostos em `electron/preload.ts` e tipados em `src/types/electron.d.ts` (já com `loadDeleted*`, `permanentlyDelete*(s)`).
  - **UI — comportamento detalhado:**
    - **Switch "Mostrar apenas os deletados":** `Switch` Mantine (label fontWeight 600, color="red") no header. Ao alternar, dispara `useEffect` que recarrega a lista (`loadAthletes` ou `loadDeletedAthletes`). Título da página muda dinamicamente (`"Atletas Deletados"` / `"Atletas"`).
    - **View ativos:** botões `Importar` / `Exportar` / `Cadastrar` visíveis; dashboard de estatísticas (Inscritos + Graduações) visível apenas em `AdminAthletes` na view ativos; coluna "Deletado em" oculta.
    - **View deletados:** botões `Importar` / `Exportar` / `Cadastrar` ocultos; dashboard de estatísticas oculto; coluna extra "Deletado em" exibida; ações mudam para `[restaurar, excluir permanente]`. Bulk delete muda para bulk permanent delete.
    - **Modal de exclusão permanente:** `Modal centered` com aviso "Esta ação é IRREVERSÍVEL." em vermelho + texto dinâmico (nome do item) + botões "Cancelar" (outline) e "Excluir Permanentemente" (vermelho). Não usa padding/custom visual além do padrão Mantine.
    - **Modal de soft delete — texto atualizado:** alterado de "Esta ação não pode ser desfeita" para "será movido para os deletados. Você poderá restaurá-lo na aba 'Mostrar apenas os deletados'." — aplicado aos 3 modais de soft delete (atleta, árbitro com/sem chaves vinculadas, área) e aos 3 modais de soft delete em lote.
  - **Spec da feature:** `spec/lixeira-soft-delete-ui.md`.
  - **Critérios de aceite:** CA-01 a CA-08 verificados — toggle, view condicional, restore individual, permanent delete individual + modal, bulk permanent delete, atualização do modal de soft delete, título dinâmico, formatação de `deletedAt`.
  - **Impacto:** mudança puramente de UI. Backend (soft delete + restore) já estava pronto do ciclo anterior. A view de lixeira completa o ciclo de soft delete.
  - **Compatibilidade:** nenhuma migração necessária. `deletedAt` já existe em todos os tipos. JSONs legados continuam funcionando.
  - **Observação de design:** a confirmação de exclusão permanente SEMPRE exige modal (não há "skip confirmation" no fluxo). O texto "Esta ação é IRREVERSÍVEL." é fixo (não parametrizado) para garantir consistência entre atleta/árbitro/área e entre individual/lote.

- **2026-06-05 — Soft delete para Atleta, Árbitro e Área de Luta**
  - **Problema:** exclusão de atletas/árbitros/áreas era hard delete (remoção física do JSON), sem possibilidade de recuperação após clique acidental.
  - **Solução:** adicionado campo `deletedAt: string | null` em `Atleta`, `Arbitro`, `AreaLuta`; handlers `delete*` agora setam `deletedAt = new Date().toISOString()` em vez de remover; `load*` filtra itens com `deletedAt != null`; novos handlers `restoreAthlete`/`restoreArbitro`/`restoreArea` (IPC `restore-athlete`/`restore-arbitro`/`restore-area`) limpam `deletedAt`. `deleteArbitro` mantém o efeito colateral de limpar `chave.arbitroId`. Importação (de atletas/árbitros/áreas e de torneio) força `deletedAt: null` nos itens importados.
  - **Spec da feature:** `spec/soft-delete-atleta-arbitro-area.md`.
  - **Critérios de aceite:** CA-01 a CA-07 verificados — soft delete, restore, cascade em chave, preservação de `deletedAt` em update, import sem `deletedAt`, load filtrado, APIs expostas.
  - **Impacto:** mudança de comportamento transparente para o frontend atual (item continua sumindo da lista após delete). UI de lixeira (visualizar/restaurar/excluir permanentemente) é o próximo item `[aberto]` em `doc/spec.md` e será tratada em ciclo separado.
  - **Compatibilidade:** JSONs antigos sem `deletedAt` continuam funcionando — auto-fix ao carregar preenche `deletedAt: null`. Nenhuma migração necessária.

- **2026-06-05 — `AthleteForm`: Gênero e Peso lado a lado**
  - **Problema:** no modal `AthleteForm`, os campos `Gênero` (`Select`) e `Peso (kg)` (`NumberInput`) eram renderizados um abaixo do outro, deixando o formulário desnecessariamente longo.
  - **Solução:** os dois campos foram agrupados em um `<Group grow gap="md">` (Mantine), fazendo com que dividam a mesma linha com larguras iguais. Demais campos (Nome, Equipe, Faixa, Categoria, Ano de Nascimento) permanecem empilhados.
  - **Spec da correção:** `spec/athlete-form-peso-genero-lado-a-lado.md`.
  - **Critérios de aceite:** CA-01, CA-02, CA-03 e CA-04 verificados — Gênero e Peso ficam lado a lado; validações e prefill de edição continuam funcionando; o restante dos campos segue empilhado.
  - **Impacto:** puramente de layout, sem alteração de validação ou regra de negócio.
  - **Observação de design:** a ordem na linha é `[Gênero, Peso]` (esquerda → direita) para alinhar com a leitura natural dos campos. Caso o usuário prefira inverter, basta trocar a ordem dos filhos do `Group`.

- **2026-06-05 — Botão "Cadastrar Atleta" do `AthleteForm` padronizado**
  - **Problema:** o botão de submit do modal `AthleteForm` usava cor verde (`#78a890`), `borderRadius: 8` e `padding: 16px`, destoando do design system do app (azul `#1b325f`, `borderRadius: 12`, sem padding custom).
  - **Solução:** ajustadas as `styles` do `<Button type="submit">` em `src/components/AthleteForm.tsx` para `backgroundColor: '#1b325f'`, `borderRadius: 12`, hover `#3a89c9`; adicionado `leftSection={<IconUserPlus size={16} />}`; removido `padding: 16px` e o `&:active` que não existe em nenhum outro botão.
  - **Spec da correção:** `spec/athlete-form-botao-cadastrar-visual.md`.
  - **Critérios de aceite:** CA-01, CA-02 e CA-03 verificados — botão agora é visualmente consistente com `AdminAthletes.tsx:220-232` (header da listagem) e `AthletesMenu.tsx:203-231` (cards do menu).
  - **Impacto:** puramente visual, sem alteração de comportamento/validação.

## Feature
<!--  A IA vai usar isso como ponto de partida para preencher todas as seções abaixo. -->

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