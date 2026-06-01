# Atletas no JSON do Torneio

## 1. Objetivo

Os atletas cadastrados passam a ser **exclusivos por torneio** e armazenados dentro do próprio JSON do torneio, em vez de uma lista global compartilhada. Toda operação de CRUD ou importação de atletas deve atualizar diretamente o JSON do torneio ativo. O arquivo exportado conterá naturalmente os atletas.

---

## 2. Situação Atual

### 2.1. Lista global única

Atualmente todos os atletas são armazenados em um arquivo global `{userData}/data/atletas.json`, compartilhado entre **todos os torneios**. As operações CRUD de atletas (`loadAthletes`, `saveAthlete`, `updateAthlete`, `deleteAthlete`, `importAthletesFromFile`) leem e escrevem exclusivamente nesse arquivo global.

### 2.2. JSON do Torneio: não contém atletas

```typescript
export interface Torneio {
  id: string;
  nome: string;
  data: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
}
```

### 2.3. Exportação: apenas cópia do JSON

O handler `export-tournament` (`electron/tournament.ts:70-87`) copia o arquivo JSON do torneio via `fs.copyFileSync`. Sem atletas no JSON, a exportação não os inclui.

### 2.4. Problemas do modelo atual

- Atletas são misturados entre torneios diferentes
- Exportar um torneio não leva os atletas junto
- Não há como ter listas de atletas diferentes por torneio

---

## 3. Comportamento Desejado

### 3.1. Atletas dentro do JSON do torneio

Cada torneio possui seu próprio array `atletas` dentro do JSON:

```json
{
  "id": "uuid-v4",
  "nome": "Meu Torneio",
  "data": "2026-12-25",
  "createdAt": "2026-05-31T10:00:00.000Z",
  "updatedAt": "2026-05-31T10:00:00.000Z",
  "startedAt": "2026-06-01T08:00:00.000Z",
  "atletas": [
    {
      "id": "uuid-atleta-1",
      "nome": "joão silva",
      "equipe": "gracie barra",
      "pesoKg": 76.5,
      "faixa": "azul",
      "anoNascimento": 1998,
      "createdAt": "2026-05-01T10:00:00.000Z",
      "updatedAt": "2026-05-01T10:00:00.000Z"
    }
  ]
}
```

### 3.2. Sincronia em tempo real

Toda operação sobre atletas (cadastro, edição, exclusão, importação) deve **ler e escrever diretamente no JSON do torneio ativo**. Não há snapshot — os atletas no JSON do torneio refletem o estado atual.

| Operação | Alvo atual (global) | Novo alvo |
|---|---|---|
| `loadAthletes` | `atletas.json` | `torneios/{id}.json` → campo `atletas` |
| `saveAthlete` | `atletas.json` | `torneios/{id}.json` → campo `atletas` |
| `updateAthlete` | `atletas.json` | `torneios/{id}.json` → campo `atletas` |
| `deleteAthlete` | `atletas.json` | `torneios/{id}.json` → campo `atletas` |
| `importAthletesFromFile` | `atletas.json` | `torneios/{id}.json` → campo `atletas` |

### 3.3. Determinação do torneio ativo

As funções em `electron/athletes.ts` precisam saber **qual torneio** está ativo para ler/escrever no JSON correto. Isso pode ser resolvido de duas formas:

**Opção A — Receber o ID do handler IPC:**
Cada handler em `main.ts` já tem acesso ao torneio ativo. O `main.ts` passa o `id` do torneio ativo como parâmetro para as funções em `athletes.ts`.

**Opção B — As funções em `athletes.ts` leem o arquivo `torneio-ativo.json`:**
Centralizam a descoberta do torneio ativo internamente.

**Recomendação: Opção A** — os handlers em `main.ts` carregam o ID do torneio ativo e passam para as funções em `athletes.ts`.

### 3.4. Exportações — duas modalidades distintas

O sistema passa a ter **dois exports diferentes**:

| Exportação | Canal IPC | Conteúdo | Finalidade |
|---|---|---|---|
| **Exportar Torneio** (completo) | `export-tournament` | JSON completo do torneio **incluindo** `atletas` | Backup completo do torneio para importação futura |
| **Exportar Lista de Atletas** (específico) | `export-athletes` | Apenas o array de atletas (`Atleta[]`) em JSON puro | Compartilhar/processar a lista de atletas fora do sistema |

#### 3.4.1. Nome do arquivo na Exportação do Torneio

O nome sugerido no diálogo "Salvar como" segue a regra:

| Situação | Nome do arquivo | Exemplo |
|---|---|---|
| Torneio **com** nome definido | `{nome_do_torneio}.json` | "Meu Campeonato" → `Meu_Campeonato.json` |
| Torneio **sem** nome definido | `Torneio_{data}.json` | data `2026-12-25` → `Torneio_2026-12-25.json` |

Caracteres especiais (espaços, acentos, pontuação) são substituídos por `_` via regex `/[^a-zA-Z0-9]/g`.

#### 3.4.2. Nome do arquivo na Exportação da Lista de Atletas

O nome sugerido padrão é `atletas.json`, independentemente do nome do torneio ou da data.

**Exportar Torneio** (`export-tournament`):
- Mantém `fs.copyFileSync` — o JSON do torneio já contém `atletas`
- Nome do arquivo: nome do torneio OU "Torneio_{data}" (regra 3.4.1)
- Salva o torneio completo para backup ou importação em outro sistema

**Exportar Lista de Atletas** (`export-athletes`):
- Abre diálogo "Salvar como" com nome padrão `atletas.json`
- Gera um JSON contendo **apenas** o array de atletas do torneio ativo (sem os metadados do torneio)
- Útil para o usuário extrair a lista de participantes independentemente do torneio

### 3.5. Importação de torneio

O handler `import-tournament` persiste o JSON recebido (incluindo `atletas` se presente). Torneios importados de versões antigas (sem `atletas`) terão o campo como `undefined` — tratado como lista vazia.

---

## 4. Regras de Negócio

1. **Exclusividade:** Atletas são exclusivos do torneio em que foram cadastrados. Não há compartilhamento entre torneios.
2. **Sincronia imediata:** Qualquer operação CRUD ou importação de atletas altera diretamente o JSON do torneio ativo.
3. **Atleta sem torneio ativo:** Se não houver um torneio ativo, as operações de CRUD de atletas devem ser bloqueadas (notificação "Nenhum torneio ativo").
4. **Exportação inclusiva:** O JSON exportado contém todos os atletas do torneio.
5. **Importação de torneio:** O JSON importado pode conter ou não o campo `atletas`. Se ausente, o torneio começa com lista vazia.
6. **Compatibilidade:** A interface `Torneio` trata `atletas` como opcional (`atletas?: Atleta[]`) para compatibilidade com torneios antigos.

---

## 5. Arquivos Afetados

| # | Arquivo | Tipo | Descrição |
|---|---|---|---|---|
| 1 | `src/types/tournament.ts` | **Modificar** | Adicionar `atletas?: Atleta[]` na interface `Torneio` |
| 2 | `electron/athletes.ts` | **Modificar** | Todas as funções passam a receber `torneioId: string` e operam sobre `torneios/{torneioId}.json` em vez de `atletas.json` |
| 3 | `electron/tournament.ts` | **Modificar** | `create-tournament` deve inicializar `atletas: []`; exportar `getActiveTournamentId()` ou função similar para reuso em `main.ts` |
| 4 | `electron/main.ts` | **Modificar** | Handlers de atleta passam a importar `getActiveTournamentId()` de `tournament.ts` e injetar o `torneioId` nas funções de `athletes.ts`. Bloquear operações se não houver torneio ativo. |
| 5 | `electron/preload.ts` | **Modificar** | O canal `importTournament` deve propagar o campo `atletas` (se presente) ao passar dados para o handler IPC. Demais canais de atleta permanecem inalterados (resolução do torneio ativo fica no main). |
| 6 | `src/types/electron.d.ts` | **Nenhuma** | Assinaturas públicas permanecem idênticas — resolução do torneio ativo é interna ao main process |
| 7 | `src/pages/AdminAthletes.tsx` | **Possível alteração** | Pode precisar exibir o nome do torneio ativo; verificar se há torneio ativo antes de operar |
| 8 | `src/pages/AthletesMenu.tsx` | **Possível alteração** | Mesma verificação de torneio ativo |
| 9 | `src/pages/ListarTorneios.tsx` | **Nenhuma** | Continua consumindo apenas `id`, `nome`, `data` |
| 10 | `src/pages/Dashboard.tsx` | **Nenhuma** | Continua consumindo apenas dados do torneio |
| 11 | `spec/spec-torneio-atletas.md` | **Novo** | Este documento |
| 12 | `doc/requisitos.md` | **Modificar** | Atualizar regras de negócio de atletas e torneio |

---

## 6. Detalhamento das Alterações

### 6.1. `src/types/tournament.ts`

```typescript
import type { Atleta } from './athlete';

export interface Torneio {
  id: string;
  nome: string;
  data: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  atletas?: Atleta[];  // ← NOVO
}
```

### 6.1b. `electron/tournament.ts`

O handler `create-tournament` deve inicializar `atletas: []` no novo torneio. A função `getActiveTournamentId()` (leitura do arquivo `torneio-ativo.json`) deve ser **exportada** para reuso em `main.ts`, evitando duplicação de lógica:

```typescript
import type { Atleta } from '../src/types/athlete';  // ← NOVO

// handler create-tournament:
ipcMain.handle('create-tournament', (_event, data: { nome: string; data: string }): Torneio => {
  ensureDirs();
  const torneio: Torneio = {
    id: crypto.randomUUID(),
    nome: data.nome,
    data: data.data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    atletas: [],       // ← NOVO
  };
  fs.writeFileSync(getTorneioPath(torneio.id), JSON.stringify(torneio, null, 2), 'utf-8');
  return torneio;
});

// Exportar função de leitura do torneio ativo para reuso em main.ts:
export function getActiveTournamentId(): string | null {
  const ativoPath = ATIVO_FILE;  // já definido no módulo
  if (!fs.existsSync(ativoPath)) return null;
  try {
    const { id } = JSON.parse(fs.readFileSync(ativoPath, 'utf-8'))
    return id
  } catch {
    return null
  }
}
```

### 6.2. `electron/athletes.ts`

Todas as funções mudam de `atletas.json` (global) para `torneios/{torneioId}.json`.

```typescript
import { app, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import type { Atleta } from '../src/types/athlete'
import type { Torneio } from '../src/types/tournament'

const DATA_DIR = path.join(app.getPath('userData'), 'data')
const TORNEIOS_DIR = path.join(DATA_DIR, 'torneios')

function getTorneioPath(torneioId: string): string {
  return path.join(TORNEIOS_DIR, `${torneioId}.json`)
}

function loadTorneio(torneioId: string): Torneio {
  const filePath = getTorneioPath(torneioId)
  if (!fs.existsSync(filePath)) throw new Error('Torneio não encontrado')
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function saveTorneio(torneio: Torneio): void {
  fs.writeFileSync(getTorneioPath(torneio.id), JSON.stringify(torneio, null, 2), 'utf-8')
}

function loadAthletes(torneioId: string): Atleta[] {
  const torneio = loadTorneio(torneioId)
  return torneio.atletas ?? []
}

function saveAthlete(torneioId: string, athlete: Atleta): Atleta[] {
  const torneio = loadTorneio(torneioId)
  const list = torneio.atletas ?? []
  list.push(athlete)
  torneio.atletas = list
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
  return list
}

function updateAthlete(torneioId: string, updated: Atleta): Atleta[] {
  const torneio = loadTorneio(torneioId)
  const list = torneio.atletas ?? []
  const index = list.findIndex(a => a.id === updated.id)
  if (index === -1) throw new Error('Atleta não encontrado')
  list[index] = updated
  torneio.atletas = list
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
  return list
}

function deleteAthlete(torneioId: string, id: string): Atleta[] {
  const torneio = loadTorneio(torneioId)
  let list = torneio.atletas ?? []
  list = list.filter(a => a.id !== id)
  torneio.atletas = list
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
  return list
}

function importAthletesFromFile(torneioId: string, filePath: string): { imported: number; skipped: number } {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const incoming: Atleta[] = JSON.parse(raw)

  if (!Array.isArray(incoming)) {
    throw new Error('Arquivo inválido: o conteúdo deve ser um array de atletas.')
  }

  for (const a of incoming) {
    if (!a.nome || !a.equipe || !a.faixa || !a.anoNascimento || !a.pesoKg) {
      throw new Error(`Atleta inválido no arquivo: "${a.nome || 'sem nome'}" — campos obrigatórios ausentes.`)
    }
  }

  const torneio = loadTorneio(torneioId)
  const current = torneio.atletas ?? []
  let imported = 0
  let skipped = 0

  for (const a of incoming) {
    const nomeLower = a.nome.trim().toLowerCase()
    const equipeLower = a.equipe.trim().toLowerCase()
    const exists = current.some(
      ex =>
        (a.id && ex.id === a.id) ||
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

  torneio.atletas = current
  torneio.updatedAt = new Date().toISOString()
  saveTorneio(torneio)
  return { imported, skipped }
}

async function openAthleteFileDialog(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
}

async function exportAthletes(torneioId: string): Promise<void> {
  const list = loadAthletes(torneioId)
  const result = await dialog.showSaveDialog({
    title: 'Exportar Atletas',
    defaultPath: 'atletas.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(list, null, 2), 'utf-8')
  }
}

export { loadAthletes, saveAthlete, updateAthlete, deleteAthlete, importAthletesFromFile, openAthleteFileDialog, exportAthletes }
```

### 6.3. `electron/main.ts`

Os handlers de atleta precisam:
1. Obter o ID do torneio ativo (importando `getActiveTournamentId` de `electron/tournament.ts`)
2. Passar esse ID para as funções em `athletes.ts`
3. Lançar erro se não houver torneio ativo

```typescript
import { getActiveTournamentId } from './tournament'

app.whenReady().then(() => {
  registerTournamentHandlers()
  registerAthleteHandlers()
  registerActivationHandlers()
  createWindow()
})

function registerAthleteHandlers(): void {
  ipcMain.handle('load-athletes', (): Atleta[] => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return loadAthletes(torneioId)
  })

  ipcMain.handle('save-athlete', (_event, athlete: Atleta): Atleta[] => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return saveAthlete(torneioId, athlete)
  })

  ipcMain.handle('update-athlete', (_event, athlete: Atleta): Atleta[] => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return updateAthlete(torneioId, athlete)
  })

  ipcMain.handle('delete-athlete', (_event, id: string): Atleta[] => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return deleteAthlete(torneioId, id)
  })

  ipcMain.handle('import-athletes', async (): Promise<{ imported: number; skipped: number }> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    const filePath = await openAthleteFileDialog()
    if (!filePath) return { imported: 0, skipped: 0 }
    return importAthletesFromFile(torneioId, filePath)
  })

  ipcMain.handle('export-athletes', async (): Promise<void> => {
    const torneioId = getActiveTournamentId()
    if (!torneioId) throw new Error('Nenhum torneio ativo')
    return exportAthletes(torneioId)
  })
}
```

### 6.4. `electron/preload.ts`

**Canais de atleta:** Nenhuma alteração na assinatura. O resolvedor do torneio ativo fica no `main.ts`, não no renderer. Os canais `load-athletes`, `save-athlete`, `update-athlete`, `delete-athlete`, `import-athletes` e `export-athletes` continuam com os mesmos nomes e parâmetros.

**Canal `importTournament`:** Deve propagar o campo `atletas` (se presente no JSON importado) para que o handler em `tournament.ts` persista os atletas junto com o torneio:

```typescript
// Antes (não propaga atletas):
importTournament: (data: { id: string; nome: string; data: string; createdAt: string; updatedAt: string }) =>
  ipcRenderer.invoke('import-tournament', data),

// Depois (propaga o Torneio completo, incluindo atletas):
importTournament: (data: { id: string; nome: string; data: string; createdAt: string; updatedAt: string; startedAt?: string; atletas?: Atleta[] }) =>
  ipcRenderer.invoke('import-tournament', data),
```

> **Nota:** O tipo `Torneio` já inclui `atletas?: Atleta[]` após a alteração em `src/types/tournament.ts`. O preload pode usar `import type { Torneio } from '../src/types/tournament'` e tipar o parâmetro como `Torneio` para simplicidade.

### 6.5. `src/types/electron.d.ts`

**Nenhuma alteração necessária.** As assinaturas públicas permanecem idênticas — `importTournament(data: Torneio)` já usa o tipo `Torneio` completo.

### 6.6. `src/pages/AdminAthletes.tsx` e `src/pages/AthletesMenu.tsx`

**Possível alteração:** Os componentes podem precisar verificar se há torneio ativo antes de permitir operações. Se o handler IPC lançar `"Nenhum torneio ativo"`, o bloco `catch` da notificação já exibe erro — a UI continua funcional sem alterações obrigatórias.

---

## 7. Fluxo de Dados

```
CADASTRO DE ATLETA:
  Usuário → save-athlete (Renderer)
    → main process: save-athlete handler
      → getActiveTournamentId() → "abc-123"
      → loadTorneio("abc-123") → Torneio { atletas: [...] }
      → adiciona atleta ao array atletas
      → atualiza torneio.updatedAt
      → saveTorneio(torneio) → escreve torneios/abc-123.json

IMPORTAÇÃO DE ATLETAS:
  Usuário → import-athletes (Renderer)
    → main process: import-athletes handler
      → getActiveTournamentId() → "abc-123"
      → openAthleteFileDialog() → seleciona arquivo
      → importAthletesFromFile("abc-123", filePath)
      → loadTorneio("abc-123") → mescla atletas
      → saveTorneio(torneio) → escreve torneios/abc-123.json

EXPORTAÇÃO DO TORNEIO (completo com atletas):
  Usuário → export-tournament (Renderer)
    → main process: export-tournament handler
      → fs.copyFileSync(torneios/abc-123.json, destino)  ← contém atletas

EXPORTAÇÃO DA LISTA DE ATLETAS (apenas atletas):
  Usuário → export-athletes (Renderer)
    → main process: export-athletes handler
      → getActiveTournamentId() → "abc-123"
      → loadAthletes("abc-123") → Atleta[]
      → diálogo "Salvar como"
      → fs.writeFileSync(destino, JSON.stringify(atletas))  ← apenas o array
```

---

## 8. Estrutura de Diretórios (pós-implementação)

```
{userData}/
  data/
    torneios/
      {id}.json           # JSON do torneio com campo "atletas"
    torneio-ativo.json    # { "id": "uuid-do-torneio-ativo" }
    activation.json       # { "token": "hmac-token", "activatedAt": "ISO" }
```

---

## 9. Casos de Borda

| Cenário | Comportamento |
|---|---|
| **Criar torneio** | `atletas` inicia como `[]` |
| **Iniciar torneio** | Atualiza `updatedAt` + `startedAt`; `atletas` permanece inalterado |
| **Cadastrar atleta sem torneio ativo** | Handler lança erro → notificação vermelha |
| **Exportar torneio sem atletas** | JSON exportado contém `"atletas": []` |
| **Importar torneio antigo (sem `atletas`)** | `atletas` fica `undefined` → tratado como `[]` |
| **Múltiplos torneios** | Cada um tem sua própria lista de atletas |
| **Excluir torneio** | Remove o arquivo JSON — atletas são perdidos junto (esperado) |
