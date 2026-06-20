# spec/trocar-area-chave.md — Trocar Área de Luta na Chave

## 1. Contexto e Objetivo

- **O que é:** Funcionalidade de permitir ao administrador ver e trocar a área de luta de uma chave diretamente na tela "Gerenciar Chaves", com ícone de editar para acesso rápido.
- **Por que existe:** A relação chave-área é indireta (através do árbitro). O administrador não conseguia ver nem trocar a área de uma chave sem conhecer quais árbitros pertencem a quais áreas.
- **Quem usa:** Administrador do torneio.
- **Escopo:** UI de gerenciamento de chaves (tela "Gerenciar Chaves", cards de chave e modal de visualização).

## 2. Analise dos Documentos de Referência

- **Guia de spec** (este documento): confirmado.
- **Documento de requisitos** requisitos.md: seção 3.11 (Geração de Chaves), seção 3.18 (Áreas de Luta).
- **Documentação técnica existente:** `spec/trocar-area-chave.md` (versão anterior).
- **Código-fonte relevante:** `src/pages/GerenciarChaves.tsx`, `electron/brackets.ts` (handlers `atribuirArbitroHandler`), `src/types/bracket.ts`.

## 3. Historia de Usuario

```
Como administrador do torneio,
quero ver a área de luta de cada chave e trocar rapidamente,
para que eu possa realocar chaves entre áreas sem precisar alterar o árbitro manualmente.
```

Cenários alternativos:
- Área destino não tem árbitro → chave fica sem árbitro (aceitável, administrador pode atribuir depois).
- Chave já tem árbitro → ao trocar de área, o sistema atribui automaticamente o primeiro árbitro da nova área.

## 4. Requisitos Funcionais

- [x] RF-01: Na tela "Gerenciar Chaves", cada card de chave exibe o nome da área (se atribuída) ao lado do nome do árbitro.
- [x] RF-02: No modal de visualização de chave, há um seletor de "Área de Luta" (Select pesquisável, clearable) que lista todas as áreas cadastradas.
- [x] RF-03: Ao selecionar uma nova área no seletor, o sistema atribui automaticamente o primeiro árbitro da área selecionada à chave.
- [x] RF-04: Ao limpar o seletor (clearable), o sistema remove o árbitro da chave (`arbitroId = null`).
- [x] RF-05: O nome da área exibido no card é obtido percorrendo as áreas e verificando se o `arbitroId` da chave está no `arbitroIds` da área.
- [x] RF-06: Se a chave não tem árbitro, exibe "Sem área" no card.
- [x] RF-07: O card de cada chave possui um botão "Editar" (ícone `IconPencil`, cor azul) ao lado do botão "Excluir".
- [x] RF-08: O botão "Editar" abre o modal de visualização da chave (mesmo que "Visualizar"), permitindo editar árbitro, área e embaralhar.

## 5. Requisitos Nao-Funcionais

- **Performance:** A mudança de área deve completar em < 1 segundo.
- **Acessibilidade:** Seletor de área com aria-label descritivo. Botão "Editar" com aria-label.

## 6. Analise da Aplicação

- **Arquitetura:** Frontend React + Backend Electron (IPC existente `atribuir-arbitro-chave`).
- **Padrões existentes:** O modal de visualização já tem um seletor de árbitro (`Select`). A área é derivada do árbitro.
- **Fluxo de dados:** Áreas vêm de IPC `load-areas`. Atribuição usa IPC `atribuir-arbitro-chave` (já existe).

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/pages/GerenciarChaves.tsx` | Modificar | Adicionar área nos cards, botão Editar, seletor de área no modal |

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Não há IPC direto para "trocar área de chave". A solução usa o IPC existente `atribuir-arbitro-chave` (atribui o primeiro árbitro da área selecionada).

### 8.2 Ambiguidades nos Requisitos
- **Área sem árbitros:** Se a área selecionada não tem árbitros, a chave fica sem árbitro (`arbitroId = null`). Aceitável — o administrador pode atribuir um árbitro manualmente depois.

### 8.3 Riscos
- Nenhum significativo. A mudança é apenas na UI e reutiliza IPC existente.

## 9. Criterios de Aceite

- [x] CA-01: dado que uma chave tem árbitro "João" que pertence à Área 1, quando o usuário abre o modal de visualização, então o seletor mostra "Área 1" selecionada.
- [x] CA-02: dado que o usuário seleciona "Área 2" no seletor, quando a operação é concluída, então o árbitro da chave é o primeiro árbitro da Área 2.
- [x] CA-03: dado que o usuário limpa o seletor de área, quando a operação é concluída, então o árbitro da chave é removido (`arbitroId = null`).
- [x] CA-04: dado que uma chave não tem árbitro, quando o usuário visualiza o card, então exibe "Sem área".
- [x] CA-05: dado que o card de chave tem um botão "Editar", quando o usuário clica, então o modal de visualização é aberto.

## 10. Plano de Implementacao

```
Passo 1: Adicionar lógica de resolução de área no card
  - O que fazer: Criar função getAreaDaChave que percorre as áreas e retorna o nome da área cujo arbitroIds inclui o arbitroId da chave.
  - Arquivo(s): src/pages/GerenciarChaves.tsx
  - Como validar: Verificar que cards de chaves com árbitro exibem o nome da área.

Passo 2: Adicionar botão "Editar" no card
  - O que fazer: Adicionar ActionIcon com IconPencil (cor azul) ao lado do botão "Excluir". O botão chama handleViewChave para abrir o modal de visualização.
  - Arquivo(s): src/pages/GerenciarChaves.tsx
  - Como validar: Verificar que o botão "Editar" aparece e abre o modal ao clicar.

Passo 3: Adicionar seletor de área no modal de visualização
  - O que fazer: Adicionar Select de "Área de Luta" no modal, populado com as áreas carregadas. Ao selecionar, chamar handleTrocarArea com o primeiro árbitro da área. Ao limpar, chamar handleTrocarArea com null.
  - Arquivo(s): src/pages/GerenciarChaves.tsx
  - Como validar: Abrir modal, trocar área, verificar que o árbitro mudou.
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto.
- **Como monitorar:** Verificar que o seletor de área aparece no modal, que a mudança reflete no card, e que o botão "Editar" funciona.
- **Plano de rollback:** Remover seletor, botão e função.

## 12. Definição de Pronto

- [x] Todos os critérios de aceite foram verificados
- [x] Código revisado
- [x] Sem warnings ou erros não tratados introduzidos
