# spec.md — Template de Feature

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

<!--
### AAAA-MM-DD — Título curto
**Tipo:** bug | ajuste visual | lógica incompleta
**O que mudou:** comportamento anterior → comportamento atual.
**Itens atualizados:** RF-XX, CA-XX, Passo X
**Arquivo de detalhe:** `spec/nome-da-correcao.md`
-->

---

## Feature
<!--  A IA vai usar isso como ponto de partida para preencher todas as seções abaixo. -->

chave com o total de 6
Rodada 1 (Quartas de Final / Ajuste)
Atleta A X Atleta B -> G

Atleta C X BYE -> H (C avança direto)

Atleta D X Atleta E -> I

Atleta F X BYE -> J (F avança direto)

Rodada 2 (Semifinais)
G X H -> Vencedor_Finalista1

I X J -> Vencedor_Finalista2

Rodada 3 (Final — a linha que faltou)
Vencedor_Finalista1 X Vencedor_Finalista2 -> Campeão
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
- **Documento de requisitos** (PRD, task do Azure DevOps, issue, ou briefing): extraia os requisitos funcionais e não-funcionais
- **Documentação técnica existente** (wikis, ADRs, READMEs): identifique padrões e convenções já estabelecidos
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
5. Ao finalizar qualquer ciclo (feature nova ou correção), registre no **Histórico de Correções** em spec.md.