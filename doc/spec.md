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

### 2026-06-04 — Novo layout dos menus (AthletesMenu, ArbitrosMenu, AreasMenu)
**Tipo:** ajuste visual
**O que mudou:** AthletesMenu, ArbitrosMenu e AreasMenu redesenhados com welcome banner + quick stats (cards com ícone + número), cards de menu com borda esquerda #1b325f, hover troca para #f26c4f, translateY(-6px), botão "Acessar" azul marinho no rodapé, hover #ffbc11. Cores: #1b325f, #3a89c9, #e9f2f9, #f26c4f, #ffbc11.

### 2026-06-04 — Correção: stats exibindo 0 nos menus
**Tipo:** bug
**O que mudou:** Adicionado `useEffect(() => { loadAthletes(); }, [])` (e equivalentes para arbitros/areas) nos 3 menus para carregar dados reais na montagem. Antes o total sempre aparecia como 0.

### 2026-06-04 — Remoção do header gradient e reposicionamento do botão voltar
**Tipo:** ajuste visual
**O que mudou:** Header gradient azul (#1565C0 → #0d47a1) removido do PageLayout. Botão "Voltar" reposicionado para o canto superior esquerdo do Paper (absolute, top:8, left:8, cor gray). Título da página e headerExtras não são mais renderizados. PlacarLutaCasada movido badge "LUTA CASADA" para dentro do conteúdo.
**Tipo:** ajuste visual
**O que mudou:** Substituídos os 2 cards (Cadastrados/Ativos) por 1 card centralizado mostrando apenas o total de atletas com label "Total".

### 2026-06-04 — Redesign da listagem de atletas (AdminAthletes)
**Tipo:** ajuste visual
**O que mudou:** AdminAthletes redesenhado com tema Oceano & Coral (#1b325f, #e9f2f9, #9cc4e4). Layout com header de ações (Importar, Exportar JSON, Cadastrar), stats (card inscritos + grid de faixas), busca + filtro por faixa, tabela com colunas Nome, Equipe, Faixa, Categoria, Idade, Ações. Importação volta a ser via arquivo .json (IPC file picker). Removido: ID da tabela, botão limpar filtros, modal de import inline JSON, filtro de gênero, categorias ativas, export CSV, seleção em lote, componente AthleteTable.

### 2026-06-04 — Implementação do novo Dashboard
**Tipo:** ajuste visual
**O que mudou:** Dashboard.tsx reescrito com sidebar de navegação (marinho #1b325f), header stats (Atletas/Equipes), hero banner sólido #1b325f, cards enriquecidos com ícones coloridos (#3a89c9 / #f26c4f), badge "Ao Vivo" no Placar, link "Acessar →". Layout sem gradient no hero (sólido).
**Arquivo de detalhe:** `spec/dashboard-modelo.md`

### 2026-06-04 — Aplicação do tema visual (cores dos requisitos)
**Tipo:** ajuste visual
**O que mudou:** Cores hardcoded (`#1565C0`, `#6c757d`, `#f8f9fa`) em MenuInicial, CriarTorneio e ImportarTorneio foram substituídas por referências ao tema Mantine (`c="blue"`, `c="dimmed"`, `var(--mantine-color-gray-0)`).
**Itens atualizados:** RF-01 a RF-05, CA-01 a CA-04
**Arquivo de detalhe:** `spec/aparencia-moderna.md`

### 2026-06-04 — Fundo com gradiente criativo (não branco puro)
**Tipo:** ajuste visual
**O que mudou:** body background de `#f5f7fa` (sólido) → `linear-gradient(135deg, #f8f9fa, #e3f2fd)` (gradiente suave usando Gray 0 + Blue 0).
**Arquivo de detalhe:** `spec/aparencia-moderna.md`

### 2026-06-04 — Modelo de Dashboard (sidebar, hero, header stats)
**Tipo:** ajuste visual
**O que mudou:** Criada spec `spec/dashboard-modelo.md` descrevendo o novo layout do Dashboard com sidebar de navegação, hero banner gradient, header stats (Atletas/Equipes) e cards enriquecidos com badges e link "Acessar →". Labels "Atletas Confirmados"/"Equipes Ativas" renomeados para "Atletas"/"Equipes".
**Arquivo de detalhe:** `spec/dashboard-modelo.md`

### 2026-06-04 — Refactor completo do layout (todas as páginas)
**Tipo:** ajuste visual
**O que mudou:** PageLayout com header gradient azul fixo; novo componente MenuCard reutilizável; theme.ts com defaultProps globais; todas as 19 páginas simplificadas (hover effects removidos para MenuCard, loading/error states simplificados, imports não usados removidos); cores hex restantes substituídas por tokens do tema.
**Arquivo de detalhe:** `spec/refactor-layout.md`

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
Quero que a aplicação tenha uma aparencia moderna e use as cores que estão determinadas em requisitos
**observação:** Implementado em 2026-06-04. Cores hardcoded substituídas por tokens do tema Mantine em MenuInicial, CriarTorneio e ImportarTorneio. Ver `spec/aparencia-moderna.md`.
**observação:** Refatoração completa do layout em 2026-06-04: PageLayout com header gradient, MenuCard, theme.ts com defaultProps, todas as páginas simplificadas. Ver `spec/refactor-layout.md`.
**observação:** Novo modelo de Dashboard criado em 2026-06-04: sidebar de navegação, hero banner sólido, header com stats de Atletas e Equipes, cards enriquecidos com badges e link "Acessar →". Implementado em Dashboard.tsx. Ver `spec/dashboard-modelo.md`.

cores
.color1 { #ccb24c };.color2 { #f7d683 };.color3 { #fffdc0 };.color4 { #fffffd };.color5 { #457d97 };



.color1 { #1b325f };

.color2 { #9cc4e4 };

.color3 { #e9f2f9 };

.color4 { #3a89c9 };

.color5 { #f26c4f }; 

.color1 { #fc354c };
.color2 { #29221f };
.color3 { #13747d };
.color4 { #0abfbc };
.color5 { #fcf7c5 };

.color1 { #1c31a5 };
.color2 { #101f78 };
.color3 { #020f59 };
.color4 { #010937 };
.color5 { #000524 };

.color1 { #092b5a };
.color2 { #09738a };
.color3 { #78a890 };
.color4 { #9ed1b7 };
.color5 { #e7d9b4 };

codigo de exemplo

 
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