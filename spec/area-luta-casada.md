# spec/area-luta-casada.md — Área de Luta Editável em Lutas Casadas

## 1. Contexto e Objetivo

- **O que é:** Funcionalidade de permitir ao administrador visualizar e trocar a área de luta de uma luta casada, tanto na listagem quanto no modal de edição.
- **Por que existe:** Na edição de luta casada, não era possível alterar a área de luta. A tabela de listagem também não exibia a área, dificultando o gerenciamento.
- **Quem usa:** Administrador do torneio.
- **Escopo:** Tela de Administração de Lutas Casadas (`AdminLutasCasadas`) e modal de edição (`ModalEditarLutaCasada`).

## 2. Analise dos Documentos de Referência

- **Guia de spec** (este documento): confirmado.
- **Documento de requisitos** requisitos.md: seção 3.21 (Lutas Casadas).
- **Documentação técnica existente:** Nenhuma spec específica.
- **Código-fonte relevante:** `src/pages/AdminLutasCasadas.tsx`, `src/components/ModalEditarLutaCasada.tsx`, `src/types/lutaCasada.ts`.

## 3. Historia de Usuario

```
Como administrador do torneio,
quero ver e trocar a área de luta de uma luta casada,
para que eu possa realocar lutas entre áreas sem precisar recriar a luta.
```

Cenários alternativos:
- Luta casada não tem área → exibe "—" na coluna.
- Área destino não tem árbitro → luta fica sem árbitro (aceitável).

## 4. Requisitos Funcionais

- [x] RF-01: Na tabela de listagem de lutas casadas, há uma coluna "Área" que exibe o nome da área da luta.
- [x] RF-02: Se a luta casada não tem área, a coluna exibe "—".
- [x] RF-03: No modal de edição de luta casada, há um seletor de "Área de Luta" (Select pesquisável, clearable).
- [x] RF-04: O seletor é populado com todas as áreas ativas cadastradas.
- [x] RF-05: Ao selecionar uma nova área, o árbitro é automaticamente atualizado para o primeiro árbitro da área selecionada.
- [x] RF-06: Ao limpar o seletor, o árbitro da luta casada é removido.
- [x] RF-07: A área atual é exibida corretamente ao abrir o modal de edição (se a luta já tem área atribuída).

## 5. Requisitos Nao-Funcionais

- **Performance:** A mudança de área deve completar em < 1 segundo.
- **Acessibilidade:** Seletor de área com aria-label descritivo.

## 6. Analise da Aplicação

- **Arquitetura:** Frontend React + Backend Electron (IPC `update-luta-casada` já existe).
- **Padrões existentes:** `ModalEditarLutaCasada` já recebia props `areas` mas não as utilizava para seletor de área.
- **Fluxo de dados:** Áreas vêm de IPC `load-areas`. Atribuição de árbitro usa a mesma lógica das chaves.

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/components/ModalEditarLutaCasada.tsx` | Modificar | Adicionar seletor de "Área de Luta" e handler de troca |
| `src/pages/AdminLutasCasadas.tsx` | Modificar | Adicionar coluna "Área" na tabela e passar `areas` ao modal |

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Não há IPC direto para "trocar área de luta casada". A solução reutiliza o IPC `update-luta-casada` passando `arbitroId` atualizado.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma. O comportamento espelha o que já existe para chaves.

### 8.3 Riscos
- Nenhum significativo.

## 9. Criterios de Aceite

- [x] CA-01: dado que uma luta casada pertence à Área 1, quando o usuário abre a listagem, então a coluna "Área" exibe "Área 1".
- [x] CA-02: dado que o usuário seleciona "Área 2" no modal de edição, quando salva, então o árbitro da luta é o primeiro árbitro da Área 2.
- [x] CA-03: dado que o usuário limpa o seletor de área, quando salva, então o árbitro da luta é removido.

## 10. Plano de Implementacao

```
Passo 1: Adicionar coluna "Área" na tabela de listagem
  - O que fazer: Adicionar coluna "Área" na tabela AdminLutasCasadas. Resolver o nome da área percorrendo as áreas e verificando se o arbitroId da luta está no arbitroIds da área.
  - Arquivo(s): src/pages/AdminLutasCasadas.tsx
  - Como validar: Verificar que a coluna "Área" aparece na tabela com os valores corretos.

Passo 2: Adicionar seletor de área no modal de edição
  - O que fazer: Adicionar Select de "Área de Luta" no ModalEditarLutaCasada. Criar handler handleAreaChange que atualiza o arbitroId ao trocar de área. Inicializar o valor do seletor com a área atual da luta.
  - Arquivo(s): src/components/ModalEditarLutaCasada.tsx
  - Como validar: Abrir modal, trocar área, salvar, verificar que o árbitro mudou.

Passo 3: Passar array de áreas ao modal
  - O que fazer: Passar a prop `areas` do componente pai (AdminLutasCasadas) para o ModalEditarLutaCasada.
  - Arquivo(s): src/pages/AdminLutasCasadas.tsx, src/components/ModalEditarLutaCasada.tsx
  - Como validar: Abrir modal e verificar que o seletor de áreas é populado.
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto.
- **Como monitorar:** Verificar que a coluna "Área" aparece na tabela e que o seletor funciona no modal.
- **Plano de rollback:** Remover coluna e seletor.

## 12. Definição de Pronto

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado
- [x] Sem warnings ou erros não tratados introduzidos
