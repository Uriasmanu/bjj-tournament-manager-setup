# Cadastro de Árbitros

## 1. Visão Geral

O módulo de **Árbitros** é responsável pelo cadastro e gerenciamento dos árbitros do torneio. Cada árbitro possui nome, faixa e uma lista de chaves de luta que irá arbitrar.

**Todo o dados de árbitros são salvos no JSON do torneio** (campo `arbitros`), dentro do diretório `{userData}/data/torneios/{id}.json`. Não há banco de dados externo — a persistência é 100% em arquivo JSON, assim como os atletas e chaves.

O funcionamento é análogo ao módulo de Atletas, porém com campos simplificados:
- **Nome** — obrigatório
- **Faixa** — obrigatório (apenas faixas a partir de **roxa**: `roxa`, `marrom`, `preta`)
- **Chaves** — array de IDs das chaves atribuídas, iniciando vazio (`[]`)

O módulo conta com **importação e exportação** de árbitros em formato JSON, seguindo o mesmo padrão da importação/exportação de atletas.

---

## 2. Status da Implementação

| Funcionalidade | Status |
|---|---|---|
| Cadastro de árbitro (formulário modal) | ❌ Pendente |
| Listagem de árbitros (tabela CRUD) | ❌ Pendente |
| Edição de árbitro | ❌ Pendente |
| Exclusão de árbitro | ❌ Pendente |
| Importação de árbitros (JSON) | ❌ Pendente |
| Exportação de árbitros (JSON) | ❌ Pendente |
| Atribuição de árbitro a chave de luta | ❌ Pendente |

---

## 3. Regras de Negócio

### 3.1. Pré-requisitos

- Deve haver um **torneio ativo** para cadastrar, editar, excluir ou listar árbitros.
- Os árbitros são armazenados dentro do JSON do torneio (campo `arbitros: Arbitro[]`).

### 3.2. Campos do Árbitro

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `nome` | string | Sim | Mínimo 2 caracteres. Armazenado em lowercase (trim). |
| `faixa` | Faixa | Sim | Apenas faixas a partir de roxa: `roxa`, `marrom`, `preta` |
| `chaveIds` | string[] | Não | Inicia como `[]`. Preenchido ao atribuir chaves ao árbitro. |

### 3.3. Duplicata

Um árbitro é considerado duplicata quando possui o mesmo **nome** (case-insensitive, trimmed). A verificação ocorre no renderer antes do IPC, tanto para cadastro quanto para edição (ignorando o próprio `id`).

### 3.4. Exclusão

- Ao excluir um árbitro, as chaves que ele estava arbitrando ficam sem árbitro (`arbitroId = null`).
- Exibe modal de confirmação antes de excluir.

### 3.5. Atribuição de Chaves

- A atribuição de chaves a um árbitro é feita na tela de **Gerenciamento de Chaves** (não no cadastro do árbitro).
- Um árbitro pode arbitrar múltiplas chaves.
- Uma chave pode ter no máximo **1 árbitro**.
- A lista `chaveIds` no árbitro é atualizada automaticamente quando uma chave é atribuída/desatribuída.

---

## 4. Modelo de Dados

### 4.1. Tipo Árbitro

```typescript
// src/types/referee.ts

import type { Faixa } from './athlete';

export interface Arbitro {
  id: string;
  nome: string;
  faixa: Faixa;
  chaveIds: string[];         // IDs das chaves que este árbitro vai arbitrar
  createdAt: string;
  updatedAt: string;
}
```

### 4.2. Tipo Árbitro no Torneio

O campo `arbitros` deve ser adicionado ao JSON do torneio:

```typescript
// src/types/tournament.ts

export interface Torneio {
  id: string;
  nome: string;
  data: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  atletas?: Atleta[];
  arbitros?: Arbitro[];          // NOVO
  categorias?: Categoria[];
  chaves?: Chave[];
}
```

### 4.3. JSON do Torneio (exemplo)

```json
{
  "id": "uuid-v4",
  "nome": "Nome do Torneio",
  "data": "2026-12-25",
  "atletas": [ ... ],
  "arbitros": [
    {
      "id": "uuid-arbitro",
      "nome": "carlos silva",
      "faixa": "preta",
      "chaveIds": ["uuid-chave-1", "uuid-chave-2"],
      "createdAt": "2026-05-31T10:00:00.000Z",
      "updatedAt": "2026-05-31T10:00:00.000Z"
    }
  ],
  "chaves": [ ... ]
}
```

---

## 5. Comunicação Main <> Renderer (IPC)

| Canal | Direção | Descrição |
|---|---|---|
| `save-arbitro` | Renderer → Main | Adiciona novo árbitro ao torneio ativo |
| `update-arbitro` | Renderer → Main | Atualiza árbitro existente (match por `id`) |
| `delete-arbitro` | Renderer → Main | Remove árbitro do torneio ativo pelo `id` |
| `load-arbitros` | Renderer → Main → Renderer | Carrega todos os árbitros do torneio ativo |
| `import-arbitros` | Renderer → Main → Renderer | Abre diálogo nativo, lê JSON, mescla com lista do torneio ativo |
| `export-arbitros` | Renderer → Main | Abre diálogo "Salvar como" e exporta JSON dos árbitros |

### 5.1. Handler `save-arbitro`

```typescript
ipcMain.handle('save-arbitro', (_event, data: Omit<Arbitro, 'id' | 'createdAt' | 'updatedAt'>): Arbitro => {
  // 1. Carrega torneio ativo
  // 2. Gera UUID e timestamps
  // 3. Adiciona ao array arbitros[]
  // 4. Salva JSON
  // 5. Retorna novo árbitro
});
```

### 5.2. Handler `update-arbitro`

```typescript
ipcMain.handle('update-arbitro', (_event, data: Arbitro): Arbitro => {
  // 1. Carrega torneio ativo
  // 2. Encontra árbitro por data.id
  // 3. Atualiza campos
  // 4. Atualiza chaveIds se fornecido
  // 5. Salva JSON
  // 6. Retorna árbitro atualizado
});
```

### 5.3. Handler `delete-arbitro`

```typescript
ipcMain.handle('delete-arbitro', (_event, arbitroId: string): void => {
  // 1. Carrega torneio ativo
  // 2. Remove árbitro do array arbitros[]
  // 3. Para cada chave em chaves[] com arbitroId === arbitroId:
  //    - Remove a referência (chave.arbitroId = null)
  //    - Remove este chaveId do array chaveIds do árbitro (se ainda estiver na lista)
  // 4. Salva JSON
});
```

### 5.4. Handler `load-arbitros`

```typescript
ipcMain.handle('load-arbitros', (): Arbitro[] => {
  // 1. Carrega torneio ativo
  // 2. Retorna torneio.arbitros ?? []
});
```

### 5.5. Handler `import-arbitros`

```typescript
ipcMain.handle('import-arbitros', (): { imported: number; skipped: number } => {
  // 1. Abre diálogo nativo showOpenDialog (filtro *.json)
  // 2. Se cancelado, retorna { imported: 0, skipped: 0 }
  // 3. Lê e parseia o JSON do arquivo
  // 4. Valida: o JSON raiz deve ser um array
  // 5. Valida cada árbitro: campos nome e faixa obrigatórios
  // 6. Deduplica por nome (case-insensitive, trimmed)
  // 7. Gera id, createdAt, updatedAt para novos
  // 8. Atualiza torneio.arbitros no JSON do torneio
  // 9. Retorna { imported, skipped }
});
```

### 5.6. Handler `export-arbitros`

```typescript
ipcMain.handle('export-arbitros', (): void => {
  // 1. Carrega torneio ativo
  // 2. Abre diálogo nativo showSaveDialog (filtro *.json)
  // 3. Nome padrão: "{nome_torneio}_arbitros.json"
  // 4. Escreve torneio.arbitros como JSON formatado no arquivo selecionado
});
```

---

## 6. Preload (Novos Métodos)

```typescript
// electron/preload.ts — adicionar ao electronAPI

contextBridge.exposeInMainWorld('electronAPI', {
  // ... métodos existentes ...

  // NOVOS — Árbitros
  saveArbitro: (data: Omit<Arbitro, 'id' | 'createdAt' | 'updatedAt'>) =>
    ipcRenderer.invoke('save-arbitro', data),
  updateArbitro: (data: Arbitro) =>
    ipcRenderer.invoke('update-arbitro', data),
  deleteArbitro: (arbitroId: string) =>
    ipcRenderer.invoke('delete-arbitro', arbitroId),
  loadArbitros: () =>
    ipcRenderer.invoke('load-arbitros'),
  importArbitros: () =>
    ipcRenderer.invoke('import-arbitros'),
  exportArbitros: () =>
    ipcRenderer.invoke('export-arbitros'),
});
```

---

## 7. Tipos (Novos)

### 7.1. `src/types/referee.ts`

```typescript
import type { Faixa } from './athlete';

export interface Arbitro {
  id: string;
  nome: string;
  faixa: Faixa;
  chaveIds: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 7.2. `src/types/electron.d.ts` (atualização)

```typescript
interface ElectronAPI {
  // ... métodos existentes ...

  // Árbitros
  saveArbitro: (data: Omit<Arbitro, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Arbitro>;
  updateArbitro: (data: Arbitro) => Promise<Arbitro>;
  deleteArbitro: (arbitroId: string) => Promise<void>;
  loadArbitros: () => Promise<Arbitro[]>;
  importArbitros: () => Promise<{ imported: number; skipped: number }>;
  exportArbitros: () => Promise<void>;
}
```

---

## 8. Rotas

| Rota | Componente | Descrição |
|---|---|---|
| `/admin/arbitros` | `ArbitrosMenu` | Menu intermediário de árbitros |
| `/admin/arbitros/lista` | `AdminArbitros` | Tabela CRUD de árbitros |

### Fluxo de Navegação

```
[Dashboard /admin/dashboard]
    └── Árbitros → /admin/arbitros (ArbitrosMenu)
         ├── Cadastrar Árbitro → modal ArbitroForm (mesma página)
         ├── Listar Árbitros   → /admin/arbitros/lista (AdminArbitros, tabela CRUD)
```

---

## 9. Telas (UI)

### 9.1. ArbitrosMenu (`/admin/arbitros`)

- Usa `PageLayout` com título "Árbitros"
- Três cartões no mesmo padrão do `AthletesMenu`:
  1. **Cadastrar Árbitro** — abre modal `ArbitroForm` diretamente na mesma página
  2. **Listar Árbitros** — navega para `/admin/arbitros/lista`
- Botão "Voltar" retorna ao Dashboard

### 9.2. ArbitroForm (Modal)

- Modal de cadastro/edição similar ao `AthleteForm`, porém simplificado
- Campos:
  - **Nome** (`TextInput`, obrigatório, min 2 caracteres)
  - **Faixa** (`Select`, obrigatório, apenas opções a partir de roxa: `Roxa`, `Marrom`, `Preta`)
- Botões "Salvar" e "Cancelar"
- Validação em tempo real (modo controlled com `@mantine/form`)
- Verificação de duplicata por nome antes de salvar

### 9.3. AdminArbitros (`/admin/arbitros/lista`)

- Botões "Cadastrar", "Importar" e "Exportar" no topo
- Tabela com colunas: Nome, Faixa, Chaves Atribuídas, Ações
  - **Chaves Atribuídas:** badge/count com número de chaves que o árbitro está vinculado
- Ações por linha: lápis (editar), lixeira (excluir)
- Modal de confirmação ao excluir
- Empty state: "Nenhum árbitro cadastrado"
- Botão "Voltar" para `/admin/arbitros`

### 9.4. Importação de Árbitros

- **Gatilhos:** Botão "Importar" em `AdminArbitros` e cartão "Importar Árbitros" em `ArbitrosMenu`
- **Formato:** Arquivo `.json` com array de objetos `{ "nome": "...", "faixa": "..." }` — apenas `nome` e `faixa` são exigidos
- **Diálogo nativo:** `dialog.showOpenDialog` do Electron com filtro `*.json`
- **Validação:** Cada objeto deve ter `nome` (string, min 2 chars) e `faixa` (string: `roxa`, `marrom` ou `preta`). Array vazio é válido.
- **Deduplicação:** Ignorado se mesmo `nome` (case-insensitive, trimmed) já existe na lista.
- **Notificações:** Sucesso verde com contagem, erro vermelho se JSON inválido.

### 9.5. Exportação de Árbitros

- **Gatilhos:** Botão "Exportar" em `AdminArbitros`
- **Diálogo nativo:** `dialog.showSaveDialog` com nome sugerido `"{torneio}_arbitros.json"`
- **Conteúdo:** Array completo de árbitros (campos `nome`, `faixa`, `id`, `chaveIds`, `createdAt`, `updatedAt`)

---

## 10. Componentes (Novos)

| Componente | Descrição | Local |
|---|---|---|
| `ArbitrosMenu.tsx` | Menu intermediário com cartões | `src/pages/` |
| `AdminArbitros.tsx` | Tabela CRUD de árbitros | `src/pages/` |
| `ArbitroForm.tsx` | Modal de cadastro/edição de árbitro | `src/components/` |

---

## 11. Estrutura de Diretórios (Atualizada)

```
bjj-tournament-manager-setup/
├── electron/
│   ├── main.ts               ← + registro de handlers de árbitros
│   ├── preload.ts            ← + exposição de métodos de árbitros
│   ├── tournament.ts         ← (inalterado)
│   ├── athletes.ts           ← (inalterado)
│   ├── activation.ts         ← (inalterado)
│   ├── categories.ts         ← (inalterado)
│   ├── brackets.ts           ← Handlers IPC de chaves + atribuição de árbitro
│   └── referees.ts           ← NOVO — handlers IPC de árbitros
│
├── src/
│   ├── main.tsx              ← (inalterado)
│   ├── App.tsx               ← + rotas de árbitros
│   ├── types/
│   │   ├── tournament.ts     ← + campo arbitros
│   │   ├── athlete.ts        ← (inalterado)
│   │   ├── category.ts       ← (inalterado)
│   │   ├── bracket.ts        ← + arbitroId em Chave
│   │   ├── referee.ts        ← NOVO — interface Arbitro
│   │   └── electron.d.ts     ← + métodos de árbitros
│   ├── pages/
│   │   ├── ... (existentes)
│   │   ├── ArbitrosMenu.tsx       ← NOVO
│   │   ├── AdminArbitros.tsx      ← NOVO
│   │   └── GerenciarChaves.tsx    ← + seletor de árbitro por chave
│   └── components/
│       ├── ... (existentes)
│       ├── ArbitroForm.tsx         ← NOVO
│       └── ... (componentes de chaves)
│
├── spec/
│   ├── geracao-chaves.md
│   └── cadastro-arbitro.md        ← este documento
```

---

## 12. Arquivos Afetados (Modificações)

### Modificações Diretas

| Arquivo | Tipo de Alteração |
|---|---|
| `src/types/tournament.ts` | + campo `arbitros: Arbitro[]` |
| `src/types/bracket.ts` | + campo `arbitroId: string | null` em `Chave` |
| `src/types/electron.d.ts` | + métodos de árbitros |
| `src/pages/GerenciarChaves.tsx` | + seletor de árbitro por chave |
| `src/App.tsx` | + rotas `/admin/arbitros` e `/admin/arbitros/lista` |
| `electron/main.ts` | + import e registro de `registerRefereeHandlers()` |
| `electron/preload.ts` | + exposição dos métodos de árbitros |

### Arquivos Novos

| Arquivo | Descrição |
|---|---|
| `src/types/referee.ts` | Interface `Arbitro` |
| `electron/referees.ts` | Handlers IPC: `save-arbitro`, `update-arbitro`, `delete-arbitro`, `load-arbitros` |
| `src/pages/ArbitrosMenu.tsx` | Menu intermediário de árbitros |
| `src/pages/AdminArbitros.tsx` | Tabela CRUD de árbitros |
| `src/components/ArbitroForm.tsx` | Modal de cadastro/edição de árbitro |

---

## 13. Plano de Implementação (Ordem Sugerida)

| Fase | Tarefa | Dependências |
|---|---|---|
| **1** | Criar `src/types/referee.ts` | Nenhuma |
| **2** | Criar `electron/referees.ts` (handlers IPC) | Fase 1 |
| **3** | Estender `electron/main.ts` (registrar handlers) | Fase 2 |
| **4** | Estender `electron/preload.ts` (expor métodos) | Fase 2 |
| **5** | Estender `src/types/electron.d.ts` (tipos) | Fase 1 |
| **6** | Estender `src/types/tournament.ts` (+ campo arbitros) | Fase 1 |
| **7** | Criar `src/components/ArbitroForm.tsx` | Fase 5 |
| **8** | Criar `src/pages/ArbitrosMenu.tsx` | Fase 5 |
| **9** | Criar `src/pages/AdminArbitros.tsx` | Fase 7 |
| **10** | Atualizar `src/App.tsx` (+ rotas) | Fase 8 |
| **11** | Atualizar `src/types/bracket.ts` (+ arbitroId) | Módulo Chaves implementado |
| **12** | Atualizar `GerenciarChaves.tsx` (+ seletor de árbitro) | Fase 11, Módulo Chaves |

> **Nota:** O cadastro de árbitros (fases 1–10) é independente do módulo de Chaves. A atribuição de árbitros a chaves (fases 11–12) depende do módulo de Chaves estar implementado.

---

## 14. Regras de Validação

| Regra | Mensagem |
|---|---|
| Nome obrigatório (mín. 2 caracteres) | "Nome deve ter ao menos 2 caracteres" |
| Faixa obrigatória | "Selecione uma faixa" |
| Faixa inválida (menor que roxa) | "Árbitro deve ter faixa mínima Roxa" |
| Nome duplicado (case-insensitive) | "Já existe um árbitro com este nome" |
| Exclusão com chaves atribuídas | "Este árbitro está vinculado a {N} chave(s). As chaves ficarão sem árbitro." |
| Máximo 1 árbitro por chave | "Esta chave já possui um árbitro attribuído." |
