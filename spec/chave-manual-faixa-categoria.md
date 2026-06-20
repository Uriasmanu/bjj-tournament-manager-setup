# spec/chave-manual-faixa-categoria.md — Criar Chave Manual: Qualquer Faixa/Categoria

## 1. Contexto e Objetivo

- **O que é:** A criação manual de chaves permite selecionar qualquer atleta independentemente de faixa ou categoria.
- **Por que existe:** O organizador precisa de flexibilidade para criar chaves especiais (ex: "super luta", "copa abrita") com atletas de diferentes categorias e faixas.
- **Quem usa:** Administrador do torneio.
- **Escopo:** Modal `ModalCriarChaveManual` na tela "Gerenciar Chaves".

## 2. Analise dos Documentos de Referência

- **Guia de spec** (este documento): confirmado.
- **Documento de requisitos** requisitos.md: seção 3.11.2 (Geração Manual de Chaves).
- **Documentação técnica existente:** `spec/geracao-manual-chaves.md`.
- **Código-fonte relevante:** `src/components/ModalCriarChaveManual.tsx`.

## 3. Historia de Usuario

```
Como administrador do torneio,
quero criar chaves manuais com qualquer atleta, independente de faixa ou categoria,
para que eu possa montar lutas especiais e personalizadas.
```

Cenários alternativos:
- Atleta já está em outra chave → não aparece na lista de disponíveis.
- Menos de 2 atletos selecionados → botão "Criar Chave" desabilitado.

## 4. Requisitos Funcionais

- [x] RF-01: O seletor de atletas no modal de criação manual lista todos os atletas que não estão em outra chave (`emChave = false`) e que ainda não foram selecionados.
- [x] RF-02: Não há filtro de faixa ou categoria — qualquer atleta pode ser adicionado independente da faixa ou categoria.
- [x] RF-03: O seletor exibe o nome, faixa, peso e categoria de cada atleta para facilitar a identificação.
- [x] RF-04: A validação de criação exige mínimo de 2 atletas.
- [x] RF-05: Ao criar a chave com `categoriaId: 'manual'`, os atletas recebem `emChave = true` automaticamente.
- [x] RF-06: É possível selecionar uma "Área de Luta" (opcional) que atribui automaticamente o primeiro árbitro da área à chave.

## 5. Requisitos Nao-Funcionais

- **Performance:** O seletor deve listar atletas em < 500ms.
- **Acessibilidade:** Seletor com aria-label descritivo.

## 6. Analise da Aplicação

- **Arquitetura:** Frontend React + Backend Electron (IPC `gerar-chave` e `atribuir-arbitro-chave`).
- **Padrões existentes:** O modal já existia com seletor pesquisável e lista de atletas selecionados.
- **Fluxo de dados:** Atletas vêm de props. Criação via IPC `gerar-chave` com `atletaIds`.

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/components/ModalCriarChaveManual.tsx` | Existente (sem alteração necessária) | Já implementa seleção sem filtro de faixa/categoria |

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Nenhum. A funcionalidade já estava implementada corretamente.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma.

### 8.3 Riscos
- Nenhum.

## 9. Criterios de Aceite

- [x] CA-01: dado que existem atletas de diferentes faixas e categorias, quando o usuário abre o modal de criação manual, então todos os atletas disponíveis são listados sem filtro de faixa/categoria.
- [x] CA-02: dado que um atleta já está em outra chave, quando o usuário abre o modal, então esse atleta não aparece na lista de disponíveis.
- [x] CA-03: dado que o usuário seleciona 2 atletas de categorias diferentes, quando clica em "Criar Chave", então a chave é criada com sucesso.

## 10. Plano de Implementacao

```
Nenhum — a funcionalidade já estava implementada no código existente.

Verificação:
  - src/components/ModalCriarChaveManual.tsx:62 — filtro `!a.emChave && !selectedIds.includes(a.id)` não filtra por faixa/categoria.
  - src/components/ModalCriarChaveManual.tsx:98-101 — criação via `gerarChave` com `categoriaId: 'manual'` e `atletaIds`.
  - electron/brackets.ts:1653-1658 — handler `gerar-chave` seta `emChave = true` para todos os atletas quando `isManual`.
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Nenhuma alteração necessária.
- **Como monitorar:** Verificar que o modal lista atletas de qualquer faixa/categoria.
- **Plano de rollback:** N/A.

## 12. Definição de Pronto

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado
- [x] Sem warnings ou erros não tratados introduzidos
