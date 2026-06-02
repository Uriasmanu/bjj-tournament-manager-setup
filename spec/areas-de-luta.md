# Spec: Áreas de Luta

## 1. Contexto e Objetivo

- **O que é:** CRUD completo de áreas de luta (tablados/rings) para organizar as competições físicas dentro do torneio.
- **Por que existe:** O torneio pode ter múltiplas áreas de luta simultâneas, cada uma podendo ter um ou mais árbitros responsáveis. É necessário cadastrar e gerenciar essas áreas para organizar a distribuição das lutas.
- **Quem usa:** Administradores do torneio que precisam definir quantas áreas de luta existem e quais árbitros estão responsáveis por cada uma.
- **Escopo:** Cadastro, listagem, edição e exclusão de áreas de luta. Salvos no JSON do torneio, seguindo o mesmo padrão das demais entidades (atletas, árbitros). Sem importação/exportação nesta entrega. Um árbitro não pode estar em duas áreas diferentes simultaneamente.

## 2. Documentos de Referência

- `doc/spec.md` — Guia de especificação
- `src/pages/AdminArbitros.tsx` — Padrão de CRUD com tabela + form modal + busca
- `src/pages/ArbitrosMenu.tsx` — Padrão de menu (Cadastrar / Listar)
- `src/components/ArbitroForm.tsx` — Padrão de form modal com Mantine `useForm`
- `src/types/referee.ts` — Padrão de tipo de entidade
- `src/types/tournament.ts` — Interface `Torneio` (adicionar campo `areas`)
- `electron/referees.ts` — Padrão de persistência JSON
- `electron/preload.ts` — Ponte IPC
- `electron/main.ts` — Registro de handlers IPC
- `src/App.tsx` — Rotas
- `src/pages/Dashboard.tsx` — Card "Áreas de Luta" (atualmente `planned`)

## 3. História de Usuário

Como administrador do torneio,
quero cadastrar e gerenciar as áreas de luta disponíveis,
para que eu possa organizar quais áreas serão usadas e qual árbitro responsável em cada uma.

## 4. Requisitos Funcionais

- [x] RF-01: O sistema deve permitir cadastrar uma área de luta com nome e um ou mais árbitros responsáveis
- [x] RF-02: O sistema deve listar todas as áreas de luta cadastradas
- [x] RF-03: O sistema deve permitir editar o nome e os árbitros responsáveis de uma área
- [x] RF-04: O sistema deve permitir excluir uma área de luta
- [x] RF-05: O sistema deve permitir excluir múltiplas áreas selecionadas
- [x] RF-06: O sistema deve permitir buscar áreas por nome
- [x] RF-07: O sistema deve exibir o(s) nome(s) do(s) árbitro(s) responsável(is) na listagem (não apenas o ID)
- [x] RF-08: O sistema deve impedir que um mesmo árbitro seja atribuído a duas áreas diferentes
- [x] RF-09: O sistema deve migrar automaticamente dados legados (áreas salvas com `arbitroId` singular) para o formato novo (`arbitroIds` array) ao carregar

## 5. Requisitos Não-Funcionais

- **Persistência:** Dados salvos no JSON do torneio (array `areas` dentro do `Torneio`)
- **Stack:** React + Mantine + TypeScript + Electron IPC (mesma stack existente)
- **Performance:** Filtro client-side (volume esperado é pequeno, < 100 áreas)

## 6. Análise da Aplicação

### Arquitetura

```
Frontend (React + Mantine)
  └─ src/pages/AreasMenu.tsx       — Menu com cards (Cadastrar / Listar)
  └─ src/pages/AdminAreas.tsx      — CRUD completo com tabela + form modal
   └─ src/components/AreaForm.tsx    — Formulário modal (nome + multi-select árbitros)
  └─ src/types/area.ts             — Interface AreaLuta

IPC Bridge
  └─ electron/preload.ts           — expõe métodos load/save/update/deleteAreas
  └─ electron/main.ts              — registra handlers IPC

Backend (Electron main process)
  └─ electron/areas.ts             — CRUD no JSON do torneio
```

### Fluxo de dados

1. Usuário interage com a UI (AreasMenu ou AdminAreas)
2. Componente chama `window.electronAPI.loadAreas()` / `saveArea()` etc.
3. Preload faz `ipcRenderer.invoke('load-areas', ...)`
4. Main process handler em `main.ts` chama função em `electron/areas.ts`
5. `areas.ts` lê o JSON do torneio, modifica o array `areas`, salva e retorna

### Estrutura do JSON

```json
{
  "id": "uuid",
  "nome": "Torneio",
  "areas": [
    {
      "id": "uuid",
      "nome": "Área 1",
      "arbitroIds": ["uuid-do-arbitro-1", "uuid-do-arbitro-2"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "atletas": [...],
  "arbitros": [...],
  "chaves": [...]
}
```

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/types/area.ts` | Criar | Definir interface `AreaLuta` |
| `src/types/tournament.ts` | Modificar | Adicionar campo `areas?: AreaLuta[]` |
| `electron/areas.ts` | Criar | Implementar CRUD no JSON do torneio |
| `electron/preload.ts` | Modificar | Adicionar métodos `loadAreas`, `saveArea`, `updateArea`, `deleteArea`, `deleteAreas` |
| `electron/main.ts` | Modificar | Importar e registrar `registerAreaHandlers()` |
| `src/components/AreaForm.tsx` | Criar | Formulário modal para criar/editar área |
| `src/pages/AreasMenu.tsx` | Criar | Menu com cards (Cadastrar / Listar) |
| `src/pages/AdminAreas.tsx` | Criar | CRUD completo com tabela, busca, exclusão em lote |
| `src/App.tsx` | Modificar | Adicionar rotas `/admin/areas` e `/admin/areas/lista` |
| `src/pages/Dashboard.tsx` | Modificar | Alterar card "Áreas de Luta" de `planned` para `implemented` |

## 8. Problemas e Impedimentos

Nenhum impedimento identificado. O padrão já está bem estabelecido por `arbitros` e `atletas`.

## 9. Critérios de Aceite

- [x] CA-01: Dado nenhuma área cadastrada, quando acesso a tela de listagem, deve exibir "Nenhuma área de luta cadastrada"
- [x] CA-02: Dado o formulário de cadastro, quando preencho nome e seleciono um ou mais árbitros, então a área é salva e exibida na lista
- [x] CA-03: Dado uma área existente, quando edito o nome ou os árbitros, então a lista reflete a alteração
- [x] CA-04: Dado uma área existente, quando excluo, então a área some da lista
- [x] CA-05: Dado múltiplas áreas selecionadas, quando clico "Excluir Selecionados", então todas são removidas
- [x] CA-06: Dado a busca textual, quando digito um nome, então a lista filtra apenas áreas correspondentes
- [x] CA-07: Dado a lista de áreas, quando visualizo, então os nomes dos árbitros responsáveis são exibidos (não os IDs)
- [x] CA-08: Dado um árbitro já atribuído a uma área, quando tento salvar outra área com o mesmo árbitro, o sistema exibe erro e impede o salvamento
- [x] CA-09: Dado áreas salvas com o formato antigo (`arbitroId`), quando carrego a listagem, o sistema exibe corretamente os árbitros sem lançar erro

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Criar tipo AreaLuta e adicionar ao Torneio
  - O que fazer: Criar `src/types/area.ts` com interface AreaLuta e adicionar campo `areas` em `src/types/tournament.ts`
  - Arquivo(s): src/types/area.ts, src/types/tournament.ts
  - Como validar: TypeScript compila sem erros

Passo 2: Implementar persistência JSON (electron/areas.ts)
  - O que fazer: Criar `electron/areas.ts` com loadAreas, saveArea, updateArea, deleteArea, deleteAreas
  - Arquivo(s): electron/areas.ts
  - Como validar: Importação no main.ts sem erros

Passo 3: Registrar IPC handlers e preload bridge
  - O que fazer: Adicionar métodos no preload.ts e handlers no main.ts
  - Arquivo(s): electron/preload.ts, electron/main.ts
  - Como validar: IPC channels registrados sem conflito

Passo 4: Criar formulário modal AreaForm
  - O que fazer: Criar componente AreaForm com campos nome + select de árbitro
  - Arquivo(s): src/components/AreaForm.tsx
  - Como validar: Modal abre e fecha, formulário valida campos

Passo 5: Criar página de menu AreasMenu
  - O que fazer: Criar página com cards Cadastrar e Listar (sem importar)
  - Arquivo(s): src/pages/AreasMenu.tsx
  - Como validar: Navegação para /admin/areas funciona

Passo 6: Criar página CRUD AdminAreas
  - O que fazer: Criar página com tabela, busca, form modal, exclusão individual e em lote
  - Arquivo(s): src/pages/AdminAreas.tsx
  - Como validar: CRUD completo funcional

Passo 7: Registrar rotas e atualizar Dashboard
  - O que fazer: Adicionar rotas em App.tsx, tornar card "Áreas de Luta" implementado no Dashboard
  - Arquivo(s): src/App.tsx, src/pages/Dashboard.tsx
  - Como validar: Navegação entre telas funciona, card clicável
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (sem feature flag). A feature é pequena e não afeta outros módulos.
- **Como monitorar:** Testar manualmente o CRUD completo.
- **Plano de rollback:** Reverter o commit da feature.

## 12. Definição de Pronto (DoD)

- [x] Todos os critérios de aceite verificados
- [x] Código compila sem erros de TypeScript
- [x] Navegação entre telas funcionando
- [x] CRUD completo operacional (criar, listar, editar, excluir, buscar)
- [x] Validação de unicidade de árbitro entre áreas (backend + frontend)
- [x] Migração retroativa de dados legados (`arbitroId` → `arbitroIds`) ao carregar

---

## Histórico de Alterações

| Data | Versão | Descrição |
|------|--------|-----------|
| 02/06/2026 | 1.0 | Criação inicial da spec |
| 02/06/2026 | 1.1 | `arbitroId` → `arbitroIds` (múltiplos árbitros por área). Adicionada validação de unicidade de árbitro entre áreas (RF-08, CA-08). Form alterado de Select para MultiSelect. |
| 02/06/2026 | 1.2 | Adicionada `normalizeArea()` no backend para migrar dados legados (`arbitroId` singular) para `arbitroIds` ao carregar. Corrigido `for...of` em `checkRefereeNotInUse` que quebrava com `undefined`. Fallback `?? []` em todos os acessos a `arbitroIds`. |
