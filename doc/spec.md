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

implementa regra para chave com 11 atletas

Rodada 1 (Oitavas de Final / Ajuste)
Colocamos 6 atletas para lutar e 5 ficam esperando.

A X B -> L

C X D -> M

E X F -> N

G X BYE -> O

H X BYE -> P

I X BYE -> Q

J X BYE -> R

K X BYE -> S

(A partir daqui, restam exatamente 8 atletas ativos na chave: L, M, N, O, P, Q, R, S).

Rodada 2 (Quartas de Final - Chave Perfeita)
L X M -> T

N X O -> U

P X Q -> V

R X S -> W

(Ninguém ganha BYE aqui. Todos jogam e restam 4 atletas).

Rodada 3 (Semifinais)
T X U -> X

V X W -> Y

Rodada 4 (Final)
X X Y -> Campeão


Veja como fica a estrutura ideal para 12 atletas:

Rodada 1 (Oitavas de Final / Ajuste)
Colocamos 8 atletas para lutar e 4 ficam esperando.

A X B -> I

C X D -> J

E X F -> K

G X H -> L

M X BYE -> N (Atleta M avança direto)

O X BYE -> P (Atleta O avança direto)

Q X BYE -> R (Atleta Q avança direto)

S X BYE -> T (Atleta S avança direto)

(Pronto, os BYEs sumiram. Restam exatamente 8 atletas ativos na chave: I, J, K, L, N, P, R, T).

Rodada 2 (Quartas de Final - Chave Perfeita)
I X J -> U

K X L -> V

N X P -> W

R X T -> X

(Mata-mata limpo, sem nenhuma folga. Restam 4 atletas).

Rodada 3 (Semifinais)
U X V -> Y

W X X -> Z

Rodada 4 (Final)
Y X Z -> Campeão

chave com 13

Rodada 1 (Oitavas de Final / Ajuste)
A X B -> K

C X D -> L

E X F -> M

G X H -> N

I X J -> O

P X BYE -> Q (Atleta P avança direto)

R X BYE -> S (Atleta R avança direto)

T X BYE -> U (Atleta T avança direto)

(BYEs eliminados. Restam exatamente 8 atletas ativos para a próxima rodada: K, L, M, N, O, Q, S, U).

Rodada 2 (Quartas de Final)
K X L -> V

M X N -> W

O X Q -> X

S X U -> Y

(Mata-mata perfeito. Restam 4 atletas para as semifinais).

Rodada 3 (Semifinais)
V X W -> Z

X X Y -> AA

Rodada 4 (Final)
Z X AA -> Campeão

chave com 14

Rodada 1 (Oitavas de Final / Ajuste)
A X B -> M

C X D -> N

E X F -> O

G X H -> P

I X J -> Q

K X L -> R

S X BYE -> T (Atleta S avança direto)

U X BYE -> V (Atleta U avança direto)

(BYEs eliminados da competição. Restam exatamente 8 atletas ativos para a próxima rodada: M, N, O, P, Q, R, T, V).

Rodada 2 (Quartas de Final)
M X N -> W

O X P -> X

Q X R -> Y

T X V -> Z (Os dois que avançaram por BYE se enfrentam aqui)

Rodada 3 (Semifinais)
W X X -> AA

Y X Z -> AB

Rodada 4 (Final)
AA X AB -> Campeão

chave com 15

Rodada 1 (Oitavas de Final / Ajuste)
A X B -> O

C X D -> P

E X F -> Q

G X H -> R

I X J -> S

K X L -> T

M X N -> U

V X BYE -> W (O atleta V descansa na primeira rodada e vira W)

(BYEs totalmente eliminados. Restam exatamente 8 atletas ativos para as quartas de final: O, P, Q, R, S, T, U, W).

Rodada 2 (Quartas de Final)
O X P -> X

Q X R -> Y

S X T -> Z

U X W -> AA (O vencedor U enfrenta o atleta V que estava descansado)

Rodada 3 (Semifinais)
X X Y -> AB

Z X AA -> AC

Rodada 4 (Final)
AB X AC -> Campeão

chave com 16

Para 16 atletas, você atingiu o cenário dos sonhos de qualquer organizador de torneio: a potência de 2 perfeita.

Aqui a matemática é exata. Não existe nenhum BYE e ninguém descansa. Todos os 16 atletas lutam logo no primeiro minuto do campeonato, divididos em duas chaves perfeitamente simétricas de 8 de cada lado.

O desenho exato usando as suas letras fica assim:

Rodada 1 (Oitavas de Final)
A X B -> Q

C X D -> R

E X F -> S

G X H -> T

I X J -> U

K X L -> V

M X N -> W

O X P -> X

(Os 16 começam lutando. Sobram exatamente 8 atletas ativos para a próxima fase: Q, R, S, T, U, V, W, X).

Rodada 2 (Quartas de Final)
Q X R -> Y

S X T -> Z

U X V -> AA

W X X -> AB

(Mata-mata limpo. Restam 4 atletas para as semifinais).

Rodada 3 (Semifinais)
Y X Z -> AC

AA X AB -> AD

Rodada 4 (Final)
AC X AD -> Campeão
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
5. Ao finalizar qualquer ciclo (feature nova ou correção), registre no **Histórico de Correções** em spec.md NÃO alterar os comentario e NÃO apagar algo, apenas adicione suas observaçoes e atualize o documento `spec/{nome-da-feature}.md` caso seja implementado uma nova regra de negocio. Permitido melhorar a descrição e titulo do problema aberto