# Cadastro de Atletas

## 1. Objetivo

CRUD completo para cadastro individual de atletas, contemplando dados pessoais e de categorização necessários para inscrição em chaves e divisões por peso, faixa etária e graduação.

---

## 2. Stack Tecnológico

- **Framework:** React 18 + TypeScript 5
- **Componentes:** Mantine UI v7 (`TextInput`, `NumberInput`, `Select`, `Button`, `Table`, `Modal`, `Notifications`)
- **Ícones:** Tabler Icons 3
- **Formulário:** `@mantine/form` com validação em tempo real
- **Persistência:** Arquivo JSON local gerenciado via Electron IPC (`fs`)
- **Geração de ID:** `crypto.randomUUID()`

---

## 3. Dados do Atleta

### 3.1. Campos

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| **Nome** | `string` | Sim | Nome completo do atleta (armazenado em minúsculo) |
| **Equipe** | `string` | Sim | Nome da equipe / academia (armazenado em minúsculo) |
| **Peso (kg)** | `number` | Sim | Peso em quilogramas (ex.: 72.5) |
| **Faixa** | `Faixa` (enum) | Sim | Graduação no Jiu-Jitsu (vide seção 3.2) |
| **Ano de nascimento** | `number` | Sim | Ano de nascimento (ex.: 1998) |

> Todos os campos de texto (`nome`, `equipe`) são convertidos para **minúsculo** antes de persistir no JSON. Isso uniformiza os dados e facilita buscas, comparações e detecção de duplicatas.

### 3.2. Faixas (Graduações)

| Categoria | Faixas |
|---|---|
| **Infantil (4–15 anos)** | Branca, Cinza, Amarela, Laranja, Verde |
| **Adulto (16+ anos)** | Branca, Azul, Roxa, Marrom, Preta |

As faixas são exibidas no `Select` agrupadas por categoria e com labels capitalizadas (Branca, Azul, etc.). O valor armazenado é o nome em minúsculo (`branca`, `azul`, etc.).

### 3.3. Interface TypeScript (`src/types/athlete.ts`)

```typescript
export type Faixa =
  | 'branca' | 'cinza' | 'amarela' | 'laranja' | 'verde'
  | 'azul' | 'roxa' | 'marrom' | 'preta';

export interface Atleta {
  id: string;            // UUID v4
  nome: string;
  equipe: string;
  pesoKg: number;
  faixa: Faixa;
  anoNascimento: number;
  createdAt: string;     // ISO 8601
  updatedAt: string;     // ISO 8601
}
```

### 3.4. Estrutura do JSON (`{userData}/data/atletas.json`)

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nome": "joão silva",
    "equipe": "gracie barra",
    "pesoKg": 76.5,
    "faixa": "azul",
    "anoNascimento": 1998,
    "createdAt": "2026-05-31T10:00:00.000Z",
    "updatedAt": "2026-05-31T10:00:00.000Z"
  }
]
```

---

## 4. Layout

A tela de atletas (`/admin/atletas`) é uma **tela unificada** que reúne as 3 operações principais em um só lugar, acessível pelo card "Atletas" no Dashboard.

| Operação | Elemento | Descrição |
|---|---|---|
| **Cadastrar** | Botão "Cadastrar" no topo | Abre modal com formulário vazio para novo atleta |
| **Importar** | Botão "Importar" no topo | Abre diálogo nativo para selecionar arquivo `.json` |
| **Listar** | Tabela de atletas | Exibe todos os atletas cadastrados com ações por linha |

### 4.1. Tela Principal (AdminAthletes.tsx)

```
+----------------------------------------------------------+
|  ← Voltar                                                 |
|  Atletas                          [Importar] [Cadastrar]  |
|                                                            |
|  ┌────────────────────────────────────────────────────┐   |
|  │ Nome            Equipe      Faixa   Idade   Ações  │   |
|  ├────────────────────────────────────────────────────┤   |
|  │ João Silva      Gracie Barra  Azul   28     [✏️][🗑]│   |
|  │ Maria Santos    Alliance     Branca 25     [✏️][🗑]│   |
|  │ ...                                                │   |
|  └────────────────────────────────────────────────────┘   |
+----------------------------------------------------------+
```

- O layout utiliza o componente `PageLayout`, que fornece container responsivo, Paper com borda/sombra, título e botão de voltar.
- O botão "Voltar" retorna ao Dashboard do torneio ativo (`/admin/dashboard`).
- O header sempre exibe os botões **[Importar]** e **[Cadastrar]**, independentemente de haver atletas ou não.
- Quando a lista está vazia, o empty state substitui a tabela (seção 5.2).

### 4.2. Modal de Cadastro / Edição (AthleteForm.tsx)

```
┌──────────────────────────────────────────┐
│  {Novo Atleta / Editar Atleta}           │
├──────────────────────────────────────────┤
│                                          │
│  Nome *                                  │
│  [____________________________________]  │
│                                          │
│  Equipe *                                │
│  [____________________________________]  │
│                                          │
│  Peso (kg) *                             │
│  [____________________________________]  │
│                                          │
│  Faixa *                                 │
│  [Branca  ▼]                             │
│  ├─ Infantil (4–15 anos) ──────────────  │
│  │  Branca, Cinza, Amarela, Laranja,...  │
│  ├─ Adulto (16+ anos) ─────────────────  │
│  │  Branca, Azul, Roxa, Marrom, Preta   │
│                                          │
│  Ano de Nascimento *                     │
│  [____________________________________]  │
│                                          │
│              [Cancelar]  [Salvar]        │
└──────────────────────────────────────────┘
```

---

## 5. Comportamento

### 5.1. Carregamento Inicial

- Ao montar o componente `AdminAthletes`, dispara `loadAthletes()` via IPC.
- Enquanto carrega, exibe `<Loader />` centralizado.
- Em caso de erro no carregamento, exibe mensagem "Erro ao carregar atletas" + botão "Tentar novamente".

### 5.2. Empty State

Quando a lista de atletas está vazia:
- O header permanece com os botões **[Importar]** e **[Cadastrar]**.
- Abaixo, exibe mensagem "Nenhum atleta cadastrado" centralizada.
- Botão "Cadastrar Atleta" centralizado, que executa a mesma ação do botão "Cadastrar" no header (abre modal em modo criação).

### 5.3. Cadastro (Create)

1. Clique em **"Cadastrar"** no header → abre modal com título "Novo Atleta", campos vazios.
2. Preenche campos com validação em tempo real.
3. Ao "Salvar":
   - Gera `id` via `crypto.randomUUID()`.
   - Define `createdAt` e `updatedAt` como `new Date().toISOString()`.
   - Envia ao main process via IPC `save-athlete`.
   - Main process (`electron/athletes.ts`): lê o JSON atual, adiciona o novo registro, salva.
   - Notificação verde: "Atleta cadastrado com sucesso!".
   - Fecha modal e recarrega a listagem.

### 5.4. Edição (Update)

1. Clique no ícone de lápis (✏️) na linha do atleta → abre modal com título "Editar Atleta", campos preenchidos com os dados existentes.
2. Altera os campos desejados.
3. Ao "Salvar":
   - Normaliza `nome` e `equipe` para minúsculo (`.toLowerCase()`) no renderer.
   - Verifica duplicata na lista local ignorando o próprio `id`: se existir outro atleta com mesmo `nome` + `anoNascimento`, exibe notificação de erro e interrompe.
   - Mantém o `id` e `createdAt` originais.
   - Atualiza `updatedAt` para `new Date().toISOString()`.
   - Envia ao main process via IPC `update-athlete`.
   - Main process: encontra o atleta pelo `id`, substitui no array, salva.
   - Notificação verde: "Atleta atualizado com sucesso!".
   - Fecha modal e recarrega a listagem.

### 5.5. Exclusão (Delete)

1. Clique no ícone de lixeira (🗑) na linha do atleta → abre modal de confirmação.
2. Mensagem: "Deseja realmente excluir o atleta **{nome}**? Esta ação não pode ser desfeita."
3. Botões: [Cancelar] [Excluir] (vermelho).
4. Ao confirmar:
   - Envia ao main process via IPC `delete-athlete` com o `id`.
   - Main process: filtra o atleta pelo `id`, remove do array, salva.
   - Notificação verde: "Atleta excluído com sucesso!".
   - Fecha modal e recarrega a listagem.

### 5.6. Importação em Massa (Import JSON)

1. Clique em "Importar" (ícone de upload) → abre diálogo nativo do sistema para selecionar arquivo `.json`.
2. O arquivo deve conter um array de objetos `Atleta` com os campos `id`, `nome`, `equipe`, `faixa`, `anoNascimento`, `pesoKg`.
3. A validação ocorre no main process:
   - O conteúdo deve ser um array.
   - Cada atleta deve ter os campos obrigatórios: `id`, `nome`, `equipe`, `faixa`, `anoNascimento`, `pesoKg`.
4. Após validar, os atletas são mesclados com a lista existente:
   - Atletas com `id` novo são adicionados.
   - Atletas com `id` já existente são ignorados (pulados).
5. Notificação verde com resumo: "{X} atleta(s) importado(s), {Y} ignorado(s) (já existentes)."
6. Se o usuário cancelar o diálogo, nenhuma ação é executada.
7. Em caso de erro (arquivo inválido, campos ausentes), notificação vermelha "Erro ao importar atletas."

### 5.7. Cálculo da Idade

```typescript
function calcularIdade(anoNascimento: number): number {
  return new Date().getFullYear() - anoNascimento;
}
```

A idade é exibida na coluna "Idade" da tabela, calculada dinamicamente a partir do ano de nascimento. Não é persistida no JSON.

---

## 6. Regras de Duplicidade

### 6.1. Critério de Duplicidade

Um atleta é considerado **duplicata** de outro quando ambos possuem o mesmo **nome** (ignorando diferenças de maiúsculas/minúsculas e espaços extras) **e** mesmo **ano de nascimento**.

| Campo | Critério de comparação |
|---|---|
| **Nome** | Case-insensitive, whitespace-trimmed |
| **Ano de nascimento** | Igualdade exata (`===`) |
| **Equipe** | Não entra no critério (um atleta pode trocar de equipe) |

> **Exemplo:** "João Silva" (1998) e "joão silva" (1998) são considerados a mesma pessoa, mesmo que a equipe seja diferente.

### 6.2. Onde a Verificação Ocorre

| Operação | Local da Verificação | Comportamento |
|---|---|---|
| **Cadastro individual** (`save-athlete`) | Renderer (`AdminAthletes.tsx:handleSave`) | Antes de chamar o IPC, percorre a lista local de atletas. Se encontrar match por nome + anoNascimento, exibe notificação de erro "Já existe um atleta cadastrado com este nome e ano de nascimento." e não salva. |
| **Importação em massa** (`import-athletes`) | Main process (`electron/athletes.ts:importAthletesFromFile`) | Durante a mesclagem, além de verificar `id` duplicado, também verifica nome + anoNascimento. Atletas duplicados por este critério são **ignorados** e contabilizados em `skipped`. |
| **Edição** (`update-athlete`) | Renderer (`AdminAthletes.tsx:handleSave`) | A verificação ignora o próprio atleta sendo editado (comparação por `id`). Permite salvar sem alterar nome ou ano, mas bloqueia se houver outro atleta com mesmo nome + ano. |

### 6.3. Fluxo de Bloqueio (Cadastro Individual)

```
Usuário preenche formulário → clica "Salvar"
  → handleSave() no renderer
    → Verifica duplicata na lista local (athletes)
      → Se duplicata encontrada (excluindo o próprio id):
        → Notificação vermelha: "Já existe um atleta cadastrado com este nome e ano de nascimento."
        → Modal permanece aberto
        → NÃO chama IPC save-athlete
      → Se não há duplicata:
        → Chama IPC save-athlete / update-athlete normalmente
```

### 6.4. Fluxo de Importação

```
Arquivo JSON selecionado
  → importAthletesFromFile()
    → Para cada atleta do arquivo:
      → Verifica se id já existe na lista atual → se sim, skipped++
      → Verifica se nome (case-insensitive) + anoNascimento já existe → se sim, skipped++
      → Se passou nas duas verificações → imported++
    → Salva arquivo atualizado
    → Retorna { imported, skipped }
```

### 6.5. Mensagens para o Usuário

| Contexto | Mensagem |
|---|---|
| Cadastro individual com duplicata | "Já existe um atleta cadastrado com este nome e ano de nascimento." |
| Importação com duplicatas ignoradas | "{X} atleta(s) importado(s), {Y} ignorado(s) (já existentes)." |

---

## 7. Validações

| Campo | Regra | Mensagem de erro |
|---|---|---|
| **Nome** | Mínimo 2 caracteres | "Nome deve ter ao menos 2 caracteres" |
| **Equipe** | Mínimo 2 caracteres | "Equipe deve ter ao menos 2 caracteres" |
| **Peso** | Número entre 1 e 300 | "Peso deve estar entre 1 e 300 kg" |
| **Faixa** | Deve ser uma faixa válida do enum | "Selecione uma faixa válida" |
| **Ano de nascimento** | Inteiro entre 1920 e ano atual | "Ano deve estar entre 1920 e {anoAtual}" |

A validação ocorre:
- **Em tempo real** ao digitar, com erro exibido abaixo do campo.
- **No submit** (`form.onSubmit`): se houver erro, o formulário não é enviado.

O formulário utiliza `@mantine/form` com `mode: 'uncontrolled'`.

---

## 8. Estados da Tela

| Estado | Descrição |
|---|---|
| **Carregamento** | `<Loader />` centralizado enquanto carrega a lista via IPC |
| **Vazia** | "Nenhum atleta cadastrado" + botão "Cadastrar Atleta" centralizado (header mantém [Importar] [Cadastrar]) |
| **Normal** | Tabela com atletas listados e ações (editar/excluir) |
| **Modal criação** | Modal aberto com título "Novo Atleta" e formulário vazio |
| **Modal edição** | Modal aberto com título "Editar Atleta" e dados preenchidos |
| **Erro ao carregar** | Mensagem "Erro ao carregar atletas" + botão "Tentar novamente" |
| **Erro ao salvar** | Notificação vermelha "Erro ao salvar o atleta." |
| **Erro ao excluir** | Notificação vermelha "Erro ao excluir o atleta." |

---

## 9. Comunicação Main <> Renderer (IPC)

### 9.1. Canais

| Canal | Direção | Descrição |
|---|---|---|
| `load-athletes` | Renderer → Main → Renderer | Retorna array de atletas do JSON |
| `save-athlete` | Renderer → Main | Adiciona novo atleta ao JSON |
| `update-athlete` | Renderer → Main | Substitui atleta existente (match por `id`) |
| `delete-athlete` | Renderer → Main | Remove atleta do JSON pelo `id` |
| `import-athletes` | Renderer → Main → Renderer | Abre diálogo nativo, lê arquivo JSON, mescla com lista existente, retorna `{ imported, skipped }` |

### 9.2. Preload (`electron/preload.ts`)

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  loadAthletes: () => ipcRenderer.invoke('load-athletes'),
  saveAthlete: (athlete: Atleta) => ipcRenderer.invoke('save-athlete', athlete),
  updateAthlete: (athlete: Atleta) => ipcRenderer.invoke('update-athlete', athlete),
  deleteAthlete: (id: string) => ipcRenderer.invoke('delete-athlete', id),
})
```

### 9.3. Main Process (`electron/athletes.ts`)

```typescript
const DATA_DIR = path.join(app.getPath('userData'), 'data')
const FILE = path.join(DATA_DIR, 'atletas.json')

function loadAthletes(): Atleta[] {
  ensureDataDir()
  if (!fs.existsSync(FILE)) return []
  return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
}

function saveAthlete(athlete: Atleta): Atleta[] {
  const list = loadAthletes()
  list.push(athlete)
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), 'utf-8')
  return list
}

function updateAthlete(updated: Atleta): Atleta[] {
  const list = loadAthletes()
  const index = list.findIndex(a => a.id === updated.id)
  if (index === -1) throw new Error('Atleta não encontrado')
  list[index] = updated
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), 'utf-8')
  return list
}

function deleteAthlete(id: string): Atleta[] {
  let list = loadAthletes()
  list = list.filter(a => a.id !== id)
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), 'utf-8')
  return list
}

function importAthletesFromFile(filePath: string): { imported: number; skipped: number } {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const incoming: Atleta[] = JSON.parse(raw)

  if (!Array.isArray(incoming)) {
    throw new Error('Arquivo inválido: o conteúdo deve ser um array de atletas.')
  }

  for (const a of incoming) {
    if (!a.id || !a.nome || !a.equipe || !a.faixa || !a.anoNascimento || !a.pesoKg) {
      throw new Error(`Atleta inválido no arquivo: "${a.nome || 'sem nome'}" — campos obrigatórios ausentes.`)
    }
  }

  const current = loadAthletes()
  let imported = 0
  let skipped = 0

  for (const a of incoming) {
    const nomeLower = a.nome.trim().toLowerCase()
    const equipeLower = a.equipe.trim().toLowerCase()
    const exists = current.some(ex =>
      ex.id === a.id ||
      (ex.nome.trim().toLowerCase() === nomeLower && ex.anoNascimento === a.anoNascimento)
    )
    if (!exists) {
      a.nome = nomeLower
      a.equipe = equipeLower
      current.push({
        ...a,
        createdAt: a.createdAt || new Date().toISOString(),
        updatedAt: a.updatedAt || new Date().toISOString(),
      })
      imported++
    } else {
      skipped++
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(current, null, 2), 'utf-8')
  return { imported, skipped }
}

async function openAthleteFileDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
}
```

---

## 10. Estrutura de Arquivos

```
electron/
  main.ts              ← Registro dos handlers IPC (load/save/update/delete/import-athletes)
  preload.ts           ← Exposição dos canais via contextBridge
  athletes.ts          ← Lógica CRUD + importAthletesFromFile + openAthleteFileDialog

src/
  pages/
    AdminAthletes.tsx  ← Tela de gerenciamento (PageLayout + estado + modais)
  components/
    AthleteForm.tsx    ← Modal de cadastro/edição com validação
    AthleteTable.tsx   ← Tabela de listagem com ações
  types/
    athlete.ts         ← Interfaces Atleta e Faixa
```

---

## 11. Observações

- A idade não é armazenada no JSON, apenas o ano de nascimento, para evitar dados obsoletos.
- As faixas são exibidas no `Select` agrupadas por categoria (Infantil / Adulto) com separação visual.
- O campo "Equipe" é texto livre; poderá futuramente se tornar um `Select` com equipes pré-cadastradas.
- Toda operação é offline, sem dependência de API externa.
- O arquivo `atletas.json` é global (compartilhado entre todos os torneios), não vinculado a um torneio específico.
- A listagem é recarregada via `loadAthletes()` após cada operação de create, update ou delete.
- O token de hardware `crypto.randomUUID()` é utilizado para gerar IDs únicos no renderer.
- **Todos os campos de texto** (`nome`, `equipe`) são convertidos para **minúsculo** no momento do submit (tanto no cadastro individual via `AthleteForm.tsx` quanto na importação em massa via `athletes.ts`). Isso garante uniformidade e facilita comparações (busca, duplicidade, ordenação). A exibição na interface reflete o valor armazenado (minúsculo).

---

## 12. Problemas

### 12.1. Tela de Atletas não exibe o menu solicitado

**Problema:**  
Ao clicar no card "Atletas" no Dashboard (`/admin/dashboard`), a navegação leva diretamente para `/admin/atletas`, que renderiza a tela unificada de CRUD (tabela + botões Importar/Cadastrar). O layout solicitado na documentação previa uma página intermediária com um **menu de opções** (cartões de "Cadastrar Atleta", "Listar Atletas", "Importar Atletas") antes de exibir qualquer listagem ou formulário.

**Hierarquia de navegação atual do sistema:**

```
Menu Inicial (/)
  └── Cards com 3 opções (Criar / Importar / Listar Torneio)
       └── Páginas-filho (CriarTorneio, ImportarTorneio, ListarTorneios)
            └── Dashboard (/admin/dashboard)
                 └── Grid de cards administrativos
                      └── Atletas → /admin/atletas → AdminAthletes.tsx (CRUD direto, SEM menu)
                      └── Demais cards → "Em breve"
```

**Hierarquia esperada (com base no padrão do MenuInicial e Dashboard):**

```
Dashboard (/admin/dashboard)
  └── Atletas card → /admin/atletas → AthletesMenu.tsx (MENU intermediário)
       ├── Cadastrar Atleta → abre modal de cadastro (AthleteForm)
       ├── Listar Atletas → /admin/atletas/lista → AdminAthletes.tsx (tabela CRUD)
       └── Importar Atletas → dispara diálogo nativo de importação
```

**Causa raiz:**  
A rota `/admin/atletas` foi implementada como *tela única* no componente `AdminAthletes.tsx`, que combina **listagem + cadastro + edição + importação** tudo no mesmo lugar, sem uma camada de menu intermediária. Isso quebra o padrão de navegação do sistema, onde:

- `MenuInicial.tsx` — usa cartões empilhados verticalmente com ícone, label e descrição
- `Dashboard.tsx` — usa grid de cartões responsivo com status (implementado/planejado)
- `AdminAthletes.tsx` — pula direto para a tabela, sem cartão de opções

O conteúdo de `AdminAthletes.tsx` (tabela, filtros, botões, modais, empty state) está correto e alinhado com a Seção 4 deste documento. O erro é que esse conteúdo deveria estar em uma **sub-rota** (`/admin/atletas/lista`), não na raiz `/admin/atletas`.

**Como corrigir:**

1. **Criar** `src/pages/AthletesMenu.tsx` — página intermediária seguindo o padrão de `MenuInicial.tsx`:
   - Wrapped em `<PageLayout title="Atletas" backRoute="/admin/dashboard">`
   - Conter uma `Stack` vertical ou `Grid` de cartões clicáveis (`Card` do Mantine)
   - Cada cartão com: ícone (Tabler Icon), label em negrito, descrição curta
   - Três cartões:
     - **Cadastrar Atleta** (`IconPlus`) — abre o modal `AthleteForm` diretamente (ou navega para `/admin/atletas/cadastrar`)
     - **Listar Atletas** (`IconList`) — navega para `/admin/atletas/lista`
     - **Importar Atletas** (`IconFileUpload`) — dispara `window.electronAPI.importAthletes()` diretamente
   - Opcional: suporte a teclas de atalho (1, 2, 3) como no `MenuInicial`

2. **Modificar** `src/App.tsx`:
   - Alterar a rota `/admin/atletas` para importar e renderizar `AthletesMenu`
   - Adicionar nova rota `/admin/atletas/lista` para renderizar `AdminAthletes`
   - Adicionar `import AthletesMenu from './pages/AthletesMenu'`

3. **Modificar** `src/pages/AdminAthletes.tsx`:
   - Alterar `backRoute` de `"/admin/dashboard"` para `"/admin/atletas"` (voltar para o menu, não para o Dashboard)

4. **Dashboard.tsx** — nenhuma alteração necessária, o card já aponta para `/admin/atletas`

**Arquivos afetados:**

| Arquivo | Ação | Detalhe |
|---|---|---|
| `src/pages/AthletesMenu.tsx` | **Criar** | Página com cartões de menu (Cadastrar, Listar, Importar) |
| `src/App.tsx` | **Modificar** | Re-ro tear `/admin/atletas` → `AthletesMenu`; adicionar `/admin/atletas/lista` → `AdminAthletes` |
| `src/pages/AdminAthletes.tsx` | **Modificar** | Alterar `backRoute` de `/admin/dashboard` para `/admin/atletas` |
| `src/pages/Dashboard.tsx` | **Nenhuma** | Card já aponta para `/admin/atletas` (agora será o menu) |

