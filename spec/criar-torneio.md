# Gerenciamento de Torneios

## 1. Objetivo

Gerenciar o ciclo de vida completo dos torneios: **criação**, **importação**, **listagem**, **inicialização** (iniciar) e **exportação**. O torneio é a entidade raiz do sistema — é necessário iniciar um torneio para acessar o Dashboard Administrativo (atletas, chaves, categorias, etc.).

---

## 2. Stack Tecnológico

- **Framework:** React + TypeScript
- **Componentes:** Mantine UI (`TextInput`, `DatePickerInput`, `Button`, `Paper`, `Stack`, `Title`, `Text`, `Table`, `Modal`, `Card`)
- **Ícones:** Tabler Icons
- **Formulário:** `@mantine/form` com validação
- **Persistência:** Múltiplos arquivos JSON no sistema de arquivos local via Electron IPC (`fs`)

---

## 3. Dados do Torneio

### 3.1. Campos

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| **Nome** | `string` | Não | Nome opcional do torneio |
| **Data** | `Date` | Sim | Data de realização do evento (apenas datas futuras) |

### 3.2. Regra de Título

- Se o **nome** for preenchido → o título exibido será o **nome informado**.
- Se o **nome** não for preenchido → o título será **"Torneio {data}"**, onde a data é formatada como `dd/MM/yyyy`.

### 3.3. Estrutura do JSON

Cada torneio é armazenado em um arquivo JSON individual dentro do diretório `{userData}/data/torneios/`.

```typescript
// Caminho: {userData}/data/torneios/{id}.json

interface Torneio {
  id: string;            // UUID v4 único
  nome: string;          // String vazia "" se não informado
  data: string;          // ISO date string (YYYY-MM-DD)
  createdAt: string;     // ISO 8601
  updatedAt: string;     // ISO 8601
}
```

Exemplo do arquivo:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "nome": "Campeonato Estadual 2026",
  "data": "2026-12-15",
  "createdAt": "2026-05-31T10:00:00.000Z",
  "updatedAt": "2026-05-31T10:00:00.000Z"
}
```

### 3.4. Múltiplos Torneios

Diferentemente do modelo anterior (singleton), o sistema agora suporta **múltiplos torneios** simultaneamente. Cada torneio é um arquivo independente. Um torneio ativo é definido por um arquivo à parte (`torneio-ativo.json`) que armazena o `id` do torneio em uso.

### 3.5. Geração do JSON

O arquivo JSON do torneio é gerado **no momento da criação** (ao preencher o formulário e clicar em "Criar Torneio") ou no momento da **importação** (ao selecionar um arquivo JSON válido). Antes dessas ações o arquivo não existe em disco.

---

## 4. Criar Torneio

### 4.1. Layout

```
+--------------------------------------------------+
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │           BJJ TOURNAMENT MANAGER          │    |
|   │         Cadastre um novo torneio          │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │                                          │    |
|   │   Nome do Torneio (opcional)             │    |
|   │   [________________________________]     │    |
|   │                                          │    |
|   │   Data do Evento *                       │    |
|   │   [__/__/____]  [Ícone calendário]      │    |
|   │                                          │    |
|   │         [Voltar]  [Criar Torneio]        │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
+--------------------------------------------------+
```

### 4.2. Comportamento

#### Preenchimento da Data
- **Digitação manual:** no formato `dd/mm/aaaa`.
- **Calendário:** clique no ícone para seleção visual.

#### Validação da Data (Futura)
Apenas datas posteriores ao dia atual são aceitas:
- Data igual ou anterior → erro: "A data do torneio deve ser futura".
- Calendário desabilita dias passados e o dia atual.

#### Submissão
1. Validar todos os campos.
2. Gerar `id` (UUID v4).
3. Definir `createdAt` e `updatedAt`.
4. Se nome vazio → armazenar `""`.
5. Enviar ao main process via IPC (`create-tournament`).
6. Main process escreve `{id}.json` em `{userData}/data/torneios/`.
7. Notificação de sucesso: "Torneio criado com sucesso!".
8. Redirecionar para a listagem de torneios (`/admin/listar-torneios`).

---

## 5. Importar Torneio

### 5.1. Objetivo

Permitir que o usuário importe um torneio previamente exportado (arquivo JSON), restaurando-o no sistema.

### 5.2. Layout

```
+--------------------------------------------------+
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │           BJJ TOURNAMENT MANAGER          │    |
|   │         Importar Torneio                  │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │                                          │    |
|   │   Arraste o arquivo JSON aqui ou         │    |
|   │   clique para selecionar                 │    |
|   │   ┌────────────────────────────────┐     │    |
|   │   │    [Ícone de upload]           │     │    |
|   │   │    Selecione o arquivo         │     │    |
|   │   └────────────────────────────────┘     │    |
|   │                                          │    |
|   │   [Voltar]                               │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
+--------------------------------------------------+
```

### 5.3. Comportamento

1. Usuário clica em "Importar Torneio" no menu inicial.
2. Abre uma tela com um `FileInput` ou área de drop do Mantine.
3. Usuário seleciona um arquivo JSON (válido, com a estrutura `Torneio`).
4. Ao selecionar:
   - **Validação:** verificar se o arquivo contém os campos obrigatórios (`id`, `data`, `nome`, `createdAt`).
   - Se inválido → notificação de erro: "Arquivo inválido. Selecione um arquivo de torneio válido."
   - Se válido → copiar o arquivo para `{userData}/data/torneios/{id}.json`.
   - Se o `id` já existir no diretório → perguntar se deseja sobrescrever (modal de confirmação).
5. Notificação de sucesso: "Torneio importado com sucesso!".
6. Redirecionar para a listagem de torneios (`/admin/listar-torneios`).

---

## 6. Listar Torneios

### 6.1. Objetivo

Exibir todos os torneios cadastrados no sistema, permitindo **iniciar** (selecionar como ativo) ou **exportar** (salvar o JSON em outro local) cada um.

### 6.2. Layout

```
+--------------------------------------------------+
|  ← Voltar                                         |
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │  Torneios Cadastrados                    │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │                                          │    |
|   │  Torneio        Data           Ações     │    |
|   │  ─────────────────────────────────────  │    |
|   │  Campeonato     15/12/2026   [▶] [↓]   │    |
|   │  Estadual 2026                          │    |
|   │  ─────────────────────────────────────  │    |
|   │  Torneio        20/11/2026   [▶] [↓]   │    |
|   │  20/11/2026                             │    |
|   │  ─────────────────────────────────────  │    |
|   │  ...                                    │    |
|   |                                          |
|   |  [Nenhum torneio cadastrado]            |
|   |  [Criar primeiro torneio]              |
|   └──────────────────────────────────────────┘    |
|                                                    |
+--------------------------------------------------+
```

### 6.3. Comportamento

#### Abertura
- Ao entrar na tela, carregar a lista de torneios do diretório via IPC (`list-tournaments`).
- Exibir nome/data de cada torneio.

#### Ações por Torneio

| Ação | Ícone | Descrição |
|---|---|---|
| **Iniciar** | `▶` (play) | Define o torneio como ativo e redireciona ao Dashboard Administrativo (`/admin/dashboard`). |
| **Exportar** | `↓` (download) | Abre diálogo nativo "Salvar como" para o usuário escolher onde salvar o JSON do torneio. |

#### Iniciar
1. Usuário clica em "▶" (Iniciar) ao lado do torneio desejado.
2. Main process escreve `torneio-ativo.json` em `{userData}/data/` com o `id` do torneio selecionado.
3. Notificação: "Torneio '{nome}' iniciado com sucesso!".
4. Redireciona para `/admin/dashboard`.

#### Exportar
1. Usuário clica em "↓" (Exportar) ao lado do torneio desejado.
2. Main process lê o arquivo `{id}.json` do diretório de torneios.
3. Abre diálogo nativo "Salvar como" (`dialog.showSaveDialog`) para o usuário escolher destino.
4. Copia o arquivo para o local escolhido.
5. Notificação: "Torneio exportado com sucesso!".

#### Estado Vazio
- Se não houver nenhum torneio cadastrado, exibir mensagem "Nenhum torneio cadastrado" e botão "Criar primeiro torneio" que redireciona para `/admin/criar-torneio`.

---

## 7. Validações

### 7.1. Criação

| Campo | Regra | Mensagem de erro |
|---|---|---|
| **Data** | Deve ser uma data futura (após hoje) | "A data do torneio deve ser futura" |
| **Data** | Deve ser uma data válida | "Informe uma data válida" |

### 7.2. Importação

| Verificação | Regra | Mensagem de erro |
|---|---|---|
| **Extensão** | Arquivo deve ter extensão `.json` | "Selecione um arquivo JSON" |
| **Estrutura** | Arquivo deve conter `id`, `data`, `nome` | "Arquivo inválido. Estrutura de torneio não reconhecida." |

---

## 8. Comunicação Main <> Renderer (IPC)

| Canal | Direção | Descrição |
|---|---|---|
| `create-tournament` | Renderer → Main | Cria um novo torneio e salva no diretório |
| `list-tournaments` | Renderer → Main → Renderer | Retorna array com todos os torneios cadastrados |
| `start-tournament` | Renderer → Main | Define um torneio como ativo (`torneio-ativo.json`) |
| `export-tournament` | Renderer → Main | Abre diálogo para exportar o JSON do torneio |
| `import-tournament` | Renderer → Main | Importa um arquivo JSON para o diretório de torneios |
| `get-active-tournament` | Renderer → Main → Renderer | Retorna o torneio ativo ou `null` |

### Fluxo de Persistência (Main Process)

```typescript
// electron/tournament.ts (rascunho conceitual)
const DATA_DIR = path.join(app.getPath('userData'), 'data')
const TORNEIOS_DIR = path.join(DATA_DIR, 'torneios')
const ATIVO_FILE = path.join(DATA_DIR, 'torneio-ativo.json')

function ensureDirs(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(TORNEIOS_DIR)) fs.mkdirSync(TORNEIOS_DIR, { recursive: true })
}

function listTournaments(): Torneio[] {
  ensureDirs()
  const files = fs.readdirSync(TORNEIOS_DIR).filter(f => f.endsWith('.json'))
  return files.map(f => {
    const data = fs.readFileSync(path.join(TORNEIOS_DIR, f), 'utf-8')
    return JSON.parse(data)
  })
}

function createTournament(data: Omit<Torneio, 'createdAt' | 'updatedAt'>): Torneio {
  ensureDirs()
  const torneio: Torneio = { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  fs.writeFileSync(path.join(TORNEIOS_DIR, `${torneio.id}.json`), JSON.stringify(torneio, null, 2), 'utf-8')
  return torneio
}

function startTournament(id: string): void {
  ensureDirs()
  fs.writeFileSync(ATIVO_FILE, JSON.stringify({ id }), 'utf-8')
}

function getActiveTournament(): Torneio | null {
  ensureDirs()
  if (!fs.existsSync(ATIVO_FILE)) return null
  const { id } = JSON.parse(fs.readFileSync(ATIVO_FILE, 'utf-8'))
  const filePath = path.join(TORNEIOS_DIR, `${id}.json`)
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function importTournament(sourcePath: string): Torneio {
  ensureDirs()
  const data = fs.readFileSync(sourcePath, 'utf-8')
  const torneio: Torneio = JSON.parse(data)
  if (!torneio.id || !torneio.data) throw new Error('Estrutura inválida')
  const dest = path.join(TORNEIOS_DIR, `${torneio.id}.json`)
  fs.copyFileSync(sourcePath, dest)
  return torneio
}

function exportTournament(id: string, destPath: string): void {
  const source = path.join(TORNEIOS_DIR, `${id}.json`)
  fs.copyFileSync(source, destPath)
}
```

---

## 9. Estrutura de Arquivos (Implementação)

```
electron/
  main.ts              ← Registro dos handlers IPC
  preload.ts           ← Exposição dos canais IPC
  tournament.ts        ← Lógica CRUD de torneios

src/
  pages/
    MenuInicial.tsx         ← Tela inicial (Criar / Importar / Listar)
    CriarTorneio.tsx        ← Formulário de criação
    ImportarTorneio.tsx     ← Tela de importação
    ListarTorneios.tsx      ← Lista com Iniciar / Exportar
  types/
    tournament.ts           ← Interface Torneio
```

---

## 10. Estados das Telas

### Criar Torneio

| Estado | Descrição |
|---|---|
| **Normal** | Formulário exibido com campos vazios |
| **Data inválida** | Erro abaixo do campo data (passada ou mal formatada) |
| **Submissão** | Botão desabilitado com loader |
| **Erro ao salvar** | Notificação de erro |
| **Sucesso** | Notificação verde + redirecionamento à listagem |

### Importar Torneio

| Estado | Descrição |
|---|---|
| **Normal** | Área de upload vazia |
| **Arquivo selecionado** | Exibe nome do arquivo e botão "Importar" |
| **Erro de validação** | Notificação de erro (estrutura inválida) |
| **Sucesso** | Notificação verde + redirecionamento à listagem |

### Listar Torneios

| Estado | Descrição |
|---|---|
| **Carregamento** | Spinner enquanto carrega a lista |
| **Vazio** | "Nenhum torneio cadastrado" + botão "Criar primeiro torneio" |
| **Normal** | Tabela com torneios e ações ▶ ↓ |
| **Erro ao carregar** | Mensagem de erro + botão "Tentar novamente" |

---

## 11. Fluxo de Navegação

```
[Menu Inicial]
  ├── Criar Torneio      → /admin/criar-torneio
  │                        └── (após criar) → /admin/listar-torneios
  │
  ├── Importar Torneio   → /admin/importar-torneio
  │                        └── (após importar) → /admin/listar-torneios
  │
  └── Listar Torneios    → /admin/listar-torneios
                           ├── [Iniciar] → /admin/dashboard
                           └── [Exportar] → diálogo "Salvar como"
```

---

## 12. Observações

- Ao contrário da versão anterior, o sistema agora suporta múltiplos torneios armazenados em arquivos individuais.
- O torneio ativo é definido pelo arquivo `torneio-ativo.json`. Apenas um torneio pode estar ativo por vez.
- A importação valida a estrutura do JSON para evitar que arquivos corrompidos ou de outros sistemas sejam importados.
- A exportação gera uma cópia exata do arquivo JSON do torneio, permitindo backup ou transferência para outra máquina.
- A data continua armazenada em ISO (`YYYY-MM-DD`) e exibida no formato brasileiro (`dd/MM/yyyy`).
