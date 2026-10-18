# Sincronização multi-PC (JSON local + Firestore) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer com que atletas, árbitros, áreas, categorias, chaves/lutas e lutas casadas, hoje gravados num único arquivo JSON por torneio, passem a ser gravados **um arquivo por registro** localmente (mantendo o funcionamento 100% offline de hoje) e, em paralelo, espelhados no Cloud Firestore, para que 2+ PCs rodando o mesmo torneio vejam as mudanças um do outro em tempo real sempre que houver algum caminho de rede.

**Architecture:** O processo Electron (main) ganha um módulo de armazenamento compartilhado que lê/escreve um arquivo por registro (substituindo o blob único `torneios/{id}.json` e a duplicação de `loadTorneio`/`saveTorneio` espalhada em 6 arquivos). O renderer (React) ganha uma camada de sincronização que, para cada operação, chama o IPC local (grava já, sem depender de rede) e, em paralelo, escreve no Firestore com persistência offline ativada; o renderer também escuta o Firestore por mudanças de outras máquinas e as aplica de volta no arquivo local via IPC, usando `updatedAt` para decidir quem ganha num conflito. Autenticação é por torneio (custom token com claim `torneioId`), emitido por uma Firebase Cloud Function.

**Tech Stack:** Electron (main/renderer), TypeScript, Firebase JS SDK (Firestore modular, v9+), Firebase Cloud Functions (Node), Vitest (novo — projeto não tinha testes).

**Spec:** `docs/superpowers/specs/2026-10-18-firebase-firestore-migration-design.md`

## Global Constraints

- O arquivo local é sempre gravado primeiro e nunca espera rede — nenhuma operação pode ficar bloqueada ou falhar por falta de internet (anti-goal do spec).
- Todo registro, em toda escrita, atualiza `updatedAt` (ISO 8601) no momento exato da gravação — é o único critério de resolução de conflito usado em todo o sistema.
- `torneio-ativo.json` (torneio ativo + modo `admin`/`area` por máquina) continua sendo estado local por dispositivo, nunca sincronizado.
- As regras de negócio já implementadas (`electron/brackets.ts`, `electron/pdf.ts`) não mudam — esta migração troca onde/como os dados são lidos e escritos, não as regras do IBJJF.
- Toda sessão (Electron) se autentica no Firestore com um custom token com claim `torneioId`; as regras do Firestore exigem `request.auth != null && request.auth.token.torneioId == <torneioId do caminho>`.
- Config do Firebase do projeto `bjj-tournament-manager-setup` fica em variáveis de ambiente `VITE_FIREBASE_*` (`.env.local`, fora do git), nunca hardcoded.
- A janela do telão continua recebendo dados via IPC local (`enviar-dados-placar-telao`), sem envolver o Firebase.

## Review Focus

- Dois PCs offline editam o mesmo registro (ex.: mesmo atleta) e sincronizam depois — o mais recente por `updatedAt` deve vencer, sem perder o outro silenciosamente sem log. _(Task 4)_
- Falha ou ausência de rede durante uma escrita no Firestore não pode impedir, atrasar perceptivelmente, nem reverter a gravação local já feita. _(Task 6)_
- Torneio já existente no formato antigo (`torneios/{id}.json` único) precisa continuar abrindo e funcionando sem perda de dado depois que o código passa a esperar o novo formato arquivo-por-registro. _(Task 2)_
- Duas lutas diferentes da mesma chave sendo atualizadas quase ao mesmo tempo (por duas máquinas) não podem se sobrescrever uma à outra. _(Task 10, decorre de `lutas` virar subcoleção de documentos individuais)_
- Registro antigo sem `updatedAt` (dado legado pré-migração) não pode quebrar a comparação de conflito — precisa de um resultado previsível (tratado como o mais antigo possível). _(Task 4)_

---

## File Structure

**Novos arquivos:**
- `electron/storage/torneioStorage.ts` — módulo único de leitura/escrita arquivo-por-registro + migração do formato antigo. Substitui as implementações duplicadas de `loadTorneio`/`saveTorneio`/`getTorneioPath` hoje presentes em `electron/tournament.ts`, `athletes.ts`, `referees.ts`, `areas.ts`, `categorias.ts`, `lutasCasadas.ts`, `brackets.ts`.
- `electron/storage/torneioStorage.test.ts`
- `src/services/sync/resolveConflict.ts` — função pura de resolução de conflito por `updatedAt`.
- `src/services/sync/resolveConflict.test.ts`
- `src/services/firestore/firebaseApp.ts` — inicialização do app Firebase + Firestore com cache offline.
- `src/services/firestore/auth.ts` — obtenção do custom token junto da Cloud Function e login no Firestore.
- `src/services/sync/atletasSync.ts` — escrita dupla + escuta remota para atletas (slice de referência).
- `src/services/sync/atletasSync.test.ts`
- `src/services/sync/arbitrosSync.ts`, `areasSync.ts`, `categoriasSync.ts`, `chavesSync.ts`, `lutasCasadasSync.ts` — mesmo padrão aplicado às demais entidades.
- `functions/package.json`, `functions/src/index.ts` — Firebase Cloud Function `mintTournamentToken`.
- `functions/src/index.test.ts`
- `firestore.rules` — regras de segurança do projeto Firebase.
- `.env.example` — variáveis `VITE_FIREBASE_*` documentadas (sem valores reais).
- `vitest.config.ts` — configuração do test runner (novo no projeto).

**Arquivos modificados:**
- `electron/tournament.ts`, `athletes.ts`, `referees.ts`, `areas.ts`, `categorias.ts`, `lutasCasadas.ts`, `brackets.ts` — trocam a leitura/escrita direta do blob pelo `torneioStorage.ts`.
- `package.json` — adiciona `firebase`, `vitest` e script `test`.
- `src/pages/AdminAthletes.tsx` (e equivalentes de árbitros/áreas/categorias/chaves/lutas casadas) — chamam a função de sync da entidade correspondente ao lado da chamada IPC já existente.

---

### Task 1: Test runner (Vitest)

O projeto não tem nenhum teste hoje; esta migração depende de testar lógica pura (storage, resolução de conflito) antes de qualquer coisa que toque Electron ou Firebase de verdade.

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (adicionar `"test": "vitest run"` em `scripts`, `vitest` em `devDependencies`)

- [ ] **Step 1: Instalar Vitest**

Run: `npm install -D vitest`

- [ ] **Step 2: Criar `vitest.config.ts`**

Configuração mínima: `test.environment = 'node'` (os módulos testados nesta migração são lógica pura/fs, não precisam de DOM), `test.include = ['electron/**/*.test.ts', 'src/**/*.test.ts', 'functions/**/*.test.ts']`.

- [ ] **Step 3: Adicionar script `"test": "vitest run"` em `package.json`**

- [ ] **Step 4: Verificar que o runner sobe sem nenhum teste**

Run: `npm test`
Expected: executa e reporta "no test files found" (ou similar) sem erro de configuração.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest test runner"
```

---

### Task 2: Módulo de armazenamento local arquivo-por-registro

**Files:**
- Create: `electron/storage/torneioStorage.ts`
- Create: `electron/storage/torneioStorage.test.ts`

**Interfaces:**
- Produces (usado por todas as tasks seguintes em `electron/*.ts`):
  ```ts
  interface StampedRecord { id: string; updatedAt: string; deletedAt?: string | null }

  function getTorneioDir(torneioId: string): string
  function readTorneioMeta(torneioId: string): Torneio // campos de topo: id, nome, data, createdAt, updatedAt, startedAt?, categoriasDesabilitadas?, categoriasCustomizadas?
  function writeTorneioMeta(meta: Torneio): void
  function listRecords<T extends StampedRecord>(torneioId: string, collection: string, parentPath?: string): T[] // ignora registros com deletedAt != null
  function listAllRecords<T extends StampedRecord>(torneioId: string, collection: string, parentPath?: string): T[] // inclui deletados (para telas de "lixeira")
  function readRecord<T extends StampedRecord>(torneioId: string, collection: string, id: string, parentPath?: string): T | null
  function writeRecord<T extends StampedRecord>(torneioId: string, collection: string, record: T, parentPath?: string): T // sempre sobrescreve `updatedAt` com `new Date().toISOString()` antes de gravar
  function deleteRecordFile(torneioId: string, collection: string, id: string, parentPath?: string): void // remoção física do arquivo (usado só por "permanently delete"; soft-delete é um `writeRecord` normal com `deletedAt` setado)
  function migrateLegacyTorneioIfNeeded(torneioId: string): void // detecta `torneios/{id}.json` (formato antigo) e converte para a pasta `torneios/{id}/...` arquivo-por-registro; move o arquivo antigo para `torneios/{id}.json.migrated`
  function listTournamentIds(): string[] // lista torneios existentes (pastas novas + arquivos antigos ainda não migrados), para a tela de listagem
  ```
- `collection` é um destes literais: `'atletas' | 'arbitros' | 'areas' | 'chaves' | 'lutasCasadas'`. `parentPath` é usado só para `chaves/{chaveId}/lutas` (ver Task 10): `listRecords(torneioId, 'lutas', \`chaves/${chaveId}\`)`.
- Layout em disco: `userData/data/torneios/{torneioId}/_torneio.json`, `.../atletas/{id}.json`, `.../chaves/{chaveId}/_chave.json`, `.../chaves/{chaveId}/lutas/{lutaId}.json`, etc. (espelha a estrutura de coleções do Firestore do spec).
- Toda escrita de arquivo usa o padrão "escrever em `.tmp` + rename" (escrita atômica), para não corromper o arquivo se o processo cair no meio da gravação.

- [ ] **Step 1: Escrever os testes de `writeRecord`/`readRecord`/`listRecords` com um diretório temporário**

```ts
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('torneioStorage', () => {
  let dataDir: string

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), 'bjj-storage-'))
    vi.stubEnv('BJJ_DATA_DIR_OVERRIDE', dataDir)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    rmSync(dataDir, { recursive: true, force: true })
  })

  it('writeRecord grava um arquivo por registro e atualiza updatedAt', () => {
    const { writeRecord, readRecord } = require('./torneioStorage')
    const saved = writeRecord('t1', 'atletas', { id: 'a1', nome: 'joao', updatedAt: '2000-01-01T00:00:00.000Z' })
    expect(saved.updatedAt).not.toBe('2000-01-01T00:00:00.000Z')
    expect(readRecord('t1', 'atletas', 'a1')).toEqual(saved)
  })

  it('listRecords ignora registros com deletedAt preenchido', () => {
    const { writeRecord, listRecords } = require('./torneioStorage')
    writeRecord('t1', 'atletas', { id: 'a1', updatedAt: '', deletedAt: null })
    writeRecord('t1', 'atletas', { id: 'a2', updatedAt: '', deletedAt: new Date().toISOString() })
    expect(listRecords('t1', 'atletas').map((r: any) => r.id)).toEqual(['a1'])
  })

  it('listAllRecords inclui registros deletados', () => {
    const { writeRecord, listAllRecords } = require('./torneioStorage')
    writeRecord('t1', 'atletas', { id: 'a1', updatedAt: '', deletedAt: new Date().toISOString() })
    expect(listAllRecords('t1', 'atletas').map((r: any) => r.id)).toEqual(['a1'])
  })

  it('deleteRecordFile remove o arquivo do disco', () => {
    const { writeRecord, deleteRecordFile, readRecord } = require('./torneioStorage')
    writeRecord('t1', 'atletas', { id: 'a1', updatedAt: '' })
    deleteRecordFile('t1', 'atletas', 'a1')
    expect(readRecord('t1', 'atletas', 'a1')).toBeNull()
  })

  it('listRecords com parentPath lê lutas aninhadas em uma chave', () => {
    const { writeRecord, listRecords } = require('./torneioStorage')
    writeRecord('t1', 'lutas', { id: 'l1', updatedAt: '' }, 'chaves/c1')
    expect(listRecords('t1', 'lutas', 'chaves/c1').map((r: any) => r.id)).toEqual(['l1'])
  })
})
```

Nota: o módulo deve ler o diretório base de dados a partir de `process.env.BJJ_DATA_DIR_OVERRIDE ?? path.join(app.getPath('userData'), 'data')`, para ser testável fora do Electron sem mockar o módulo `electron` inteiro.

- [ ] **Step 2: Rodar os testes e confirmar que falham (módulo ainda não existe)**

Run: `npx vitest run electron/storage/torneioStorage.test.ts`
Expected: FAIL com "Cannot find module './torneioStorage'"

- [ ] **Step 3: Implementar `torneioStorage.ts` com as funções da seção Interfaces**

Escrita atômica: gravar em `${caminho}.tmp` com `fs.writeFileSync`, depois `fs.renameSync(tmp, caminho)`. Diretórios criados sob demanda com `fs.mkdirSync(dir, { recursive: true })`.

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `npx vitest run electron/storage/torneioStorage.test.ts`
Expected: PASS (6 testes)

- [ ] **Step 5: Escrever o teste de `migrateLegacyTorneioIfNeeded`**

```ts
it('migra um torneio no formato antigo (arquivo único) para o novo formato', () => {
  const { migrateLegacyTorneioIfNeeded, readTorneioMeta, listRecords } = require('./torneioStorage')
  const legacyDir = path.join(dataDir, 'torneios')
  mkdirSync(legacyDir, { recursive: true })
  writeFileSync(path.join(legacyDir, 't1.json'), JSON.stringify({
    id: 't1', nome: 'Copa X', data: '2026-01-01', createdAt: '', updatedAt: '',
    atletas: [{ id: 'a1', nome: 'joao', updatedAt: '2020-01-01T00:00:00.000Z' }],
  }))

  migrateLegacyTorneioIfNeeded('t1')

  expect(readTorneioMeta('t1').nome).toBe('Copa X')
  expect(listRecords('t1', 'atletas').map((r: any) => r.id)).toEqual(['a1'])
  expect(existsSync(path.join(legacyDir, 't1.json.migrated'))).toBe(true)
  expect(existsSync(path.join(legacyDir, 't1.json'))).toBe(false)
})

it('migrateLegacyTorneioIfNeeded não faz nada se já está no formato novo', () => {
  const { writeRecord, migrateLegacyTorneioIfNeeded, listRecords } = require('./torneioStorage')
  writeRecord('t2', 'atletas', { id: 'a1', updatedAt: '' })
  migrateLegacyTorneioIfNeeded('t2') // não deve lançar nem apagar nada
  expect(listRecords('t2', 'atletas').map((r: any) => r.id)).toEqual(['a1'])
})
```

- [ ] **Step 6: Rodar e confirmar falha, depois implementar `migrateLegacyTorneioIfNeeded` e `listTournamentIds`, depois confirmar passam**

Run: `npx vitest run electron/storage/torneioStorage.test.ts`
Expected: PASS (8 testes)

- [ ] **Step 7: Commit**

```bash
git add electron/storage
git commit -m "feat: add file-per-record local storage module with legacy migration"
```

---

### Task 3: Migrar `electron/athletes.ts` e `electron/tournament.ts` para o novo armazenamento

Prova o padrão do Task 2 no primeiro par de arquivos reais, mantendo o comportamento observável de hoje (mesmos handlers IPC, mesmos retornos).

**Files:**
- Modify: `electron/athletes.ts` (todas as funções, hoje baseadas em `loadTorneio`/`saveTorneio`, passam a usar `torneioStorage`)
- Modify: `electron/tournament.ts` (`getActiveTournamentId` continua igual — não sincroniza; `create-tournament`, `list-tournaments`, `start-tournament`, `delete-tournament` passam a usar `writeTorneioMeta`/`readTorneioMeta`/`listTournamentIds`; chamar `migrateLegacyTorneioIfNeeded(id)` no início de todo handler que recebe um `torneioId`)
- Test: `electron/athletes.test.ts`

**Interfaces:**
- Consome `torneioStorage.ts` (Task 2) inteiro.
- Produz: a mesma assinatura pública já existente e usada pelo `preload.ts` (`loadAthletes(torneioId)`, `saveAthlete(torneioId, athlete)`, etc.) — sem mudança de contrato para o renderer.

- [ ] **Step 1: Escrever teste cobrindo o fluxo completo de `saveAthlete`/`loadAthletes`/`deleteAthlete` com o novo armazenamento**

```ts
it('saveAthlete grava um arquivo por atleta e loadAthletes lê de volta', () => {
  const { saveAthlete, loadAthletes } = require('./athletes')
  saveAthlete('t1', { id: '', nome: 'Maria', equipe: 'X', genero: 'feminino', categoria: 'adulto-feminino-leve', pesoKg: 60, faixa: 'azul', anoNascimento: 1995, createdAt: '', updatedAt: '' } as any)
  const list = loadAthletes('t1')
  expect(list).toHaveLength(1)
  expect(list[0].nome).toBe('maria') // normalização já existente
})

it('deleteAthlete marca deletedAt e some de loadAthletes', () => {
  const { saveAthlete, deleteAthlete, loadAthletes } = require('./athletes')
  const [a] = saveAthlete('t1', { id: '', nome: 'Pedro', equipe: 'X', genero: 'masculino', categoria: 'adulto-masculino-leve', pesoKg: 70, faixa: 'azul', anoNascimento: 1990, createdAt: '', updatedAt: '' } as any)
  deleteAthlete('t1', a.id)
  expect(loadAthletes('t1').find((x: any) => x.id === a.id)).toBeUndefined()
})
```

(reaproveitar o `beforeEach`/`afterEach` de diretório temporário do Task 2, via `vi.stubEnv('BJJ_DATA_DIR_OVERRIDE', ...)`)

- [ ] **Step 2: Rodar e confirmar falha** (comportamento pode já "passar por acaso" se a reescrita não tiver sido feita — então rodar antes de tocar no arquivo, como checagem de que o teste é válido contra o código atual, e depois confirmar que ele força a reescrita)

Run: `npx vitest run electron/athletes.test.ts`

- [ ] **Step 3: Reescrever `electron/athletes.ts` usando `torneioStorage`**

Cada função troca `loadTorneio`/`torneio.atletas` por `listRecords<Atleta>(torneioId, 'atletas')` / `readRecord` / `writeRecord`; `removeAthleteFromChaves` passa a iterar `listRecords<Chave>(torneioId, 'chaves')` e regravar cada chave afetada com `writeRecord`. Remover `getTorneioPath`/`loadTorneio`/`saveTorneio` locais deste arquivo.

- [ ] **Step 4: Reescrever as partes de `electron/tournament.ts` que leem/escrevem o blob** (criação, listagem, ativação, exclusão de torneio), chamando `migrateLegacyTorneioIfNeeded` logo no início de `start-tournament` e de qualquer handler que receba um `torneioId` existente.

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `npx vitest run electron/athletes.test.ts`
Expected: PASS

- [ ] **Step 6: Rodar `npm run lint` e `tsc --noEmit` para garantir que nada mais em `electron/*.ts` ficou referenciando as funções removidas**

Run: `npx tsc --noEmit && npm run lint`
Expected: sem erros

- [ ] **Step 7: Commit**

```bash
git add electron/athletes.ts electron/tournament.ts electron/athletes.test.ts
git commit -m "refactor: migrate athletes and tournament handlers to file-per-record storage"
```

---

### Task 4: Função pura de resolução de conflito

**Files:**
- Create: `src/services/sync/resolveConflict.ts`
- Create: `src/services/sync/resolveConflict.test.ts`

**Interfaces:**
- Produces (usado por todas as tasks de sincronização seguintes):
  ```ts
  type Stamped = { updatedAt?: string | null }
  function resolveConflict<T extends Stamped>(local: T | null, remote: T | null): T | null
  // regras: se um dos dois é null, vence o outro; se ambos existem, vence o `updatedAt` lexicograficamente maior (ISO 8601 ordena cronologicamente como string); updatedAt ausente/inválido conta como a data mais antiga possível ('').
  ```

- [ ] **Step 1: Escrever os testes**

```ts
import { describe, it, expect } from 'vitest'
import { resolveConflict } from './resolveConflict'

describe('resolveConflict', () => {
  it('escolhe o updatedAt mais recente', () => {
    const local = { id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' }
    const remote = { id: 'a', updatedAt: '2026-01-02T00:00:00.000Z' }
    expect(resolveConflict(local, remote)).toBe(remote)
  })

  it('mantém o local se for mais recente que o remoto', () => {
    const local = { id: 'a', updatedAt: '2026-01-02T00:00:00.000Z' }
    const remote = { id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' }
    expect(resolveConflict(local, remote)).toBe(local)
  })

  it('usa o que existe quando o outro é null', () => {
    const local = { id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' }
    expect(resolveConflict(local, null)).toBe(local)
    expect(resolveConflict(null, local)).toBe(local)
  })

  it('retorna null se os dois são null', () => {
    expect(resolveConflict(null, null)).toBeNull()
  })

  it('trata updatedAt ausente ou inválido como a data mais antiga possível', () => {
    const semData = { id: 'a' }
    const comData = { id: 'a', updatedAt: '2026-01-01T00:00:00.000Z' }
    expect(resolveConflict(semData, comData)).toBe(comData)
    expect(resolveConflict(comData, semData)).toBe(comData)
  })
})
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run src/services/sync/resolveConflict.test.ts`
Expected: FAIL com "Cannot find module"

- [ ] **Step 3: Implementar `resolveConflict`**

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run src/services/sync/resolveConflict.test.ts`
Expected: PASS (5 testes)

- [ ] **Step 5: Commit**

```bash
git add src/services/sync/resolveConflict.ts src/services/sync/resolveConflict.test.ts
git commit -m "feat: add pure updatedAt-based conflict resolution"
```

---

### Task 5: Infraestrutura Firebase (SDK, auth por torneio, regras, Cloud Function)

**Files:**
- Create: `src/services/firestore/firebaseApp.ts`
- Create: `src/services/firestore/auth.ts`
- Create: `functions/package.json`
- Create: `functions/src/index.ts`
- Create: `functions/src/index.test.ts`
- Create: `firestore.rules`
- Create: `.env.example`
- Modify: `package.json` (adicionar dependência `firebase`)

**Interfaces:**
- Produces (usado pelas tasks de sincronização seguintes):
  ```ts
  // src/services/firestore/firebaseApp.ts
  function getDb(): Firestore // Firestore inicializado com initializeFirestore + persistentLocalCache; lê config de import.meta.env.VITE_FIREBASE_*

  // src/services/firestore/auth.ts
  async function signInForTournament(torneioId: string): Promise<void>
  // chama a Cloud Function `mintTournamentToken({ torneioId })`, recebe um custom token
  // e autentica com signInWithCustomToken(getAuth(), token).

  // functions/src/index.ts
  export const mintTournamentToken: CallableFunction // valida { torneioId: string }, confere que o documento torneios/{torneioId} existe (via Admin SDK), emite customToken com claim { torneioId }
  ```

- [ ] **Step 1: Instalar a dependência `firebase` no app e inicializar o projeto de functions**

Run: `npm install firebase` (app principal) e `cd functions && npm init -y && npm install firebase-functions firebase-admin && npm install -D typescript vitest`

- [ ] **Step 2: Criar `.env.example` com as chaves (sem valores) e `src/services/firestore/firebaseApp.ts` lendo `import.meta.env.VITE_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._STORAGE_BUCKET`, `..._MESSAGING_SENDER_ID`, `..._APP_ID`**

`getDb()` usa `initializeFirestore(app, { localCache: persistentLocalCache() })` — chamado uma única vez (lazy singleton).

- [ ] **Step 3: Escrever o teste de validação de entrada de `mintTournamentToken` (parte pura, sem precisar do Admin SDK real)**

```ts
import { describe, it, expect } from 'vitest'
import { validateMintTokenInput } from './index'

describe('validateMintTokenInput', () => {
  it('aceita um torneioId de string não vazia', () => {
    expect(() => validateMintTokenInput({ torneioId: 't1' })).not.toThrow()
  })
  it('rejeita entrada sem torneioId', () => {
    expect(() => validateMintTokenInput({})).toThrow()
  })
  it('rejeita torneioId vazio', () => {
    expect(() => validateMintTokenInput({ torneioId: '' })).toThrow()
  })
})
```

- [ ] **Step 4: Rodar e confirmar falha, depois implementar `validateMintTokenInput` e a função `mintTournamentToken` (usa Admin SDK: busca `torneios/{torneioId}`, se não existir lança erro `not-found`; se existir, `getAuth().createCustomToken(torneioId, { torneioId })`), depois confirmar que passa**

Run (dentro de `functions/`): `npx vitest run src/index.test.ts`
Expected: PASS (3 testes)

- [ ] **Step 5: Implementar `signInForTournament` em `src/services/firestore/auth.ts`, chamando a Cloud Function via `httpsCallable(getFunctions(getFirebaseApp()), 'mintTournamentToken')` e depois `signInWithCustomToken`**

- [ ] **Step 6: Escrever `firestore.rules` com a regra base**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /torneios/{torneioId} {
      allow read, write: if request.auth != null && request.auth.token.torneioId == torneioId;
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.token.torneioId == torneioId;
      }
    }
  }
}
```

- [ ] **Step 7: Deploy manual (checklist, não automatizável nesta tarefa)**

- [ ] Rodar `firebase deploy --only firestore:rules,functions` com a CLI do Firebase autenticada no projeto `bjj-tournament-manager-setup`.
- [ ] Confirmar no console do Firebase que a function `mintTournamentToken` está publicada e que as regras foram aplicadas.

- [ ] **Step 8: Commit**

```bash
git add src/services/firestore functions firestore.rules .env.example package.json package-lock.json
git commit -m "feat: add Firebase SDK, per-tournament auth, and token-minting Cloud Function"
```

---

### Task 6: Sincronização de Atletas (slice de referência)

Primeiro par escrita-dupla + escuta-remota completo, de ponta a ponta — estabelece o padrão que as Tasks 7-11 repetem.

**Files:**
- Create: `src/services/sync/atletasSync.ts`
- Create: `src/services/sync/atletasSync.test.ts`
- Modify: `src/pages/AdminAthletes.tsx` (chamadas de criar/editar/excluir/restaurar atleta passam a chamar também a função de sync correspondente, ao lado da chamada IPC já existente)

**Interfaces:**
- Consome: `getDb()` (Task 5), `signInForTournament` (Task 5, chamado uma vez ao entrar no torneio — ponto de chamada: `TournamentModeContext` ou equivalente, fora do escopo desta task se já houver um lugar natural; senão, chamar no mount de `AdminAthletes`), `resolveConflict` (Task 4), `window.electronAPI.updateAthlete` (já existe em `preload.ts`).
- Produces:
  ```ts
  function pushAthleteToFirestore(torneioId: string, atleta: Atleta): Promise<void>
  // grava em doc(getDb(), 'torneios', torneioId, 'atletas', atleta.id) via setDoc — best-effort,
  // não lança se falhar por falta de rede (apenas loga); nunca bloqueia quem chamou.

  function subscribeAthletesFromFirestore(
    torneioId: string,
    onRemoteChange: (atleta: Atleta) => void
  ): Unsubscribe
  // onSnapshot na coleção 'atletas' do torneio; para cada mudança remota, chama onRemoteChange
  ```
- `onRemoteChange` é fornecido pelo chamador (Task 6 usa um que lê o atleta local via `window.electronAPI` equivalente, aplica `resolveConflict`, e se o remoto vencer chama `window.electronAPI.updateAthlete(resultado)`).

- [ ] **Step 1: Escrever o teste de `pushAthleteToFirestore` com um fake do Firestore (sem bater no Firestore real)**

```ts
import { describe, it, expect, vi } from 'vitest'
vi.mock('../firestore/firebaseApp', () => ({ getDb: () => ({}) }))
const setDocMock = vi.fn().mockResolvedValue(undefined)
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), setDoc: setDocMock, collection: vi.fn(), onSnapshot: vi.fn() }))

import { pushAthleteToFirestore } from './atletasSync'

it('pushAthleteToFirestore chama setDoc e não lança se a escrita falhar', async () => {
  setDocMock.mockRejectedValueOnce(new Error('offline'))
  await expect(pushAthleteToFirestore('t1', { id: 'a1' } as any)).resolves.toBeUndefined()
  expect(setDocMock).toHaveBeenCalled()
})
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run src/services/sync/atletasSync.test.ts`

- [ ] **Step 3: Implementar `pushAthleteToFirestore` e `subscribeAthletesFromFirestore`**

`pushAthleteToFirestore` envolve o `setDoc` em `try/catch`, só loga em caso de erro. `subscribeAthletesFromFirestore` usa `onSnapshot(collection(getDb(), 'torneios', torneioId, 'atletas'), snapshot => snapshot.docChanges().forEach(...))`.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run src/services/sync/atletasSync.test.ts`
Expected: PASS

- [ ] **Step 5: Ligar `AdminAthletes.tsx` ao novo módulo**

Nos pontos onde hoje chama `window.electronAPI.saveAthlete(...)`/`updateAthlete(...)`, adicionar logo depois (sem bloquear a UI, sem `await` no caminho principal) `pushAthleteToFirestore(torneioId, resultado)`. No mount do componente, chamar `subscribeAthletesFromFirestore(torneioId, onRemoteChange)` e capturar o `Unsubscribe` retornado no cleanup do `useEffect`.

- [ ] **Step 6: Rodar `tsc --noEmit`**

Run: `npx tsc --noEmit`
Expected: sem erros

- [ ] **Step 7: Commit**

```bash
git add src/services/sync/atletasSync.ts src/services/sync/atletasSync.test.ts src/pages/AdminAthletes.tsx
git commit -m "feat: sync athletes to Firestore with offline-safe dual write"
```

---

### Task 7: Sincronização de Árbitros

Mesmo padrão da Task 6, aplicado a `Arbitro`.

**Files:**
- Create: `src/services/sync/arbitrosSync.ts`, `src/services/sync/arbitrosSync.test.ts`
- Modify: `src/pages/AdminArbitros.tsx`

**Interfaces:**
- Mesma forma de `pushAthleteToFirestore`/`subscribeAthletesFromFirestore` (Task 6), trocando `'atletas'` por `'arbitros'` e `Atleta` por `Arbitro`: `pushArbitroToFirestore(torneioId, arbitro)`, `subscribeArbitrosFromFirestore(torneioId, onRemoteChange)`.

- [ ] **Step 1-4: Repetir os Steps 1-4 da Task 6 trocando a entidade** (teste com fake do Firestore, confirmar falha, implementar, confirmar passa).
- [ ] **Step 5: Ligar em `AdminArbitros.tsx`, igual ao Step 5 da Task 6.**
- [ ] **Step 6: `npx tsc --noEmit`.**
- [ ] **Step 7: Commit** (`feat: sync referees to Firestore`).

---

### Task 8: Sincronização de Áreas

Mesmo padrão, para `AreaLuta`.

**Files:**
- Create: `src/services/sync/areasSync.ts`, `src/services/sync/areasSync.test.ts`
- Modify: `src/pages/AdminAreas.tsx`

**Interfaces:**
- `pushAreaToFirestore(torneioId, area)`, `subscribeAreasFromFirestore(torneioId, onRemoteChange)` — coleção `'areas'`.

- [ ] **Steps 1-7:** mesma sequência da Task 7, para `Area` (teste → falha → implementação → passa → ligação na página → `tsc` → commit `feat: sync fight areas to Firestore`).

---

### Task 9: Sincronização de Categorias (metadados do torneio)

Diferente das anteriores: `categoriasDesabilitadas` e `categoriasCustomizadas` vivem no **documento do torneio**, não numa subcoleção própria.

**Files:**
- Create: `src/services/sync/categoriasSync.ts`, `src/services/sync/categoriasSync.test.ts`
- Modify: `src/pages/AdminCategorias.tsx`

**Interfaces:**
```ts
function pushTorneioMetaToFirestore(torneio: Pick<Torneio, 'id' | 'nome' | 'data' | 'categoriasDesabilitadas' | 'categoriasCustomizadas' | 'updatedAt'>): Promise<void>
// setDoc em doc(getDb(), 'torneios', torneio.id) — best-effort, igual ao padrão da Task 6
function subscribeTorneioMetaFromFirestore(torneioId: string, onRemoteChange: (meta: Torneio) => void): Unsubscribe
```

- [ ] **Steps 1-7:** mesma sequência (teste com fake do Firestore cobrindo `pushTorneioMetaToFirestore` não lançar em erro de rede → falha → implementação → passa → ligação em `AdminCategorias.tsx` nos pontos de `toggleCategoria`/`saveCategoriaCustomizada`/`updateCategoriaCustomizada`/`deleteCategoriaCustomizada` → `tsc` → commit `feat: sync tournament category settings to Firestore`).

---

### Task 10: Sincronização de Chaves e Lutas (subcoleção aninhada)

Mais sensível: cada luta precisa ser seu próprio documento (`torneios/{id}/chaves/{chaveId}/lutas/{lutaId}`), não um array dentro do documento da chave — é a decisão do spec que evita duas máquinas offline se sobrescreverem ao registrar resultados diferentes na mesma chave.

**Files:**
- Create: `src/services/sync/chavesSync.ts`, `src/services/sync/chavesSync.test.ts`
- Modify: `src/pages/PlacarLuta.tsx`, `src/pages/GerenciarChaves.tsx` (chamadas após `registrarResultado`, `gerarTodasChaves`, `gerarChave`, `atribuirArbitroChave`, `randomizarChave`, `deleteChave`)

**Interfaces:**
```ts
function pushChaveMetaToFirestore(torneioId: string, chave: Omit<Chave, 'lutas'>): Promise<void>
// doc(getDb(), 'torneios', torneioId, 'chaves', chave.id) — sem o array `lutas`
function pushLutaToFirestore(torneioId: string, chaveId: string, luta: Luta): Promise<void>
// doc(getDb(), 'torneios', torneioId, 'chaves', chaveId, 'lutas', luta.id)
function subscribeChavesFromFirestore(torneioId: string, onRemoteChange: (chave: Omit<Chave, 'lutas'>) => void): Unsubscribe
function subscribeLutasFromFirestore(torneioId: string, chaveId: string, onRemoteChange: (luta: Luta) => void): Unsubscribe
```

- [ ] **Step 1: Escrever os testes de `pushChaveMetaToFirestore` e `pushLutaToFirestore` (fakes do Firestore, mesmo padrão da Task 6), confirmando que cada um grava no caminho de documento correto e não lança em erro de rede.**
- [ ] **Step 2: Rodar e confirmar falha.**
- [ ] **Step 3: Implementar as quatro funções da seção Interfaces.**
- [ ] **Step 4: Rodar e confirmar que passam.**
- [ ] **Step 5: Ligar em `GerenciarChaves.tsx`** — após `gerarTodasChaves`/`gerarChave`/`atribuirArbitroChave`/`randomizarChave`, chamar `pushChaveMetaToFirestore` para cada chave afetada e `pushLutaToFirestore` para cada luta dela; assinar `subscribeChavesFromFirestore` no mount.
- [ ] **Step 6: Ligar em `PlacarLuta.tsx`** — após `registrarResultado`, chamar `pushLutaToFirestore` com a luta atualizada (e, se o resultado disparou avanço de vencedor noutras lutas via `clearWinnerFromLaterRounds`/`advanceWinnerX`, também publicar essas lutas afetadas); assinar `subscribeLutasFromFirestore` da chave aberta na tela.
- [ ] **Step 7: `npx tsc --noEmit`.**
- [ ] **Step 8: Commit** (`feat: sync brackets and individual fights to Firestore`).

---

### Task 11: Sincronização de Lutas Casadas

Mesmo padrão da Task 6, para `LutaCasada` (já inclui o snapshot congelado dos atletas — não muda com a sincronização).

**Files:**
- Create: `src/services/sync/lutasCasadasSync.ts`, `src/services/sync/lutasCasadasSync.test.ts`
- Modify: `src/pages/AdminLutasCasadas.tsx`, `src/pages/PlacarLutaCasada.tsx`

**Interfaces:**
- `pushLutaCasadaToFirestore(torneioId, lutaCasada)`, `subscribeLutasCasadasFromFirestore(torneioId, onRemoteChange)` — coleção `'lutasCasadas'`.

- [ ] **Steps 1-8:** mesma sequência da Task 10 adaptada (sem subcoleção aninhada — é uma coleção simples como a Task 6/7/8) → commit `feat: sync ad-hoc matches to Firestore`.

---

### Task 12: Indicador de status de sincronização

Item explicitamente deixado para o plano decidir no spec: hoje não existe nenhum feedback visual de "sincronizado" / "sem conexão" — sem isso, um operador não sabe se uma mudança feita offline já chegou aos outros PCs.

**Files:**
- Create: `src/services/sync/syncStatus.ts`
- Create: `src/services/sync/syncStatus.test.ts`
- Modify: `src/components/PageLayout.tsx` (ou componente de layout comum equivalente — exibir um indicador discreto, ex.: ponto verde "sincronizado" / cinza "sem conexão")

**Interfaces:**
```ts
type SyncStatus = 'online' | 'offline'
function subscribeSyncStatus(onChange: (status: SyncStatus) => void): Unsubscribe
// combina navigator.onLine com o estado de conexão do Firestore (onSnapshotsInSync / eventos 'online'/'offline' do window)
```

- [ ] **Step 1: Escrever o teste simulando `window` disparando `online`/`offline` e confirmando que `onChange` é chamado com o status correspondente.**
- [ ] **Step 2: Rodar e confirmar falha.**
- [ ] **Step 3: Implementar `subscribeSyncStatus` registrando listeners de `window.addEventListener('online'/'offline', ...)`.**
- [ ] **Step 4: Rodar e confirmar que passa.**
- [ ] **Step 5: Adicionar o indicador visual em `PageLayout.tsx`, assinando `subscribeSyncStatus` no mount e limpando no unmount.**
- [ ] **Step 6: `npx tsc --noEmit`.**
- [ ] **Step 7: Commit** (`feat: add sync status indicator`).

---

### Task 13: Ferramenta de migração "Enviar torneios locais para a nuvem"

Para torneios já existentes em disco (no formato novo, pós Task 3) que nunca sincronizaram.

**Files:**
- Create: `src/services/sync/enviarTorneioParaNuvem.ts`
- Create: `src/services/sync/enviarTorneioParaNuvem.test.ts`
- Modify: `src/pages/ListarTorneios.tsx` (botão "Enviar para a nuvem" por torneio)

**Interfaces:**
```ts
async function enviarTorneioParaNuvem(torneioId: string): Promise<{ enviados: number }>
// autentica (signInForTournament), lê tudo localmente via window.electronAPI (loadAthletes, loadArbitros, loadAreas, loadChaves, loadLutasCasadas, loadCategorias)
// e chama o push* de cada entidade (Tasks 6-11) para cada registro — usado uma vez, idempotente
// (reenviar não duplica, porque cada push usa o id do registro como id do documento)
```

- [ ] **Step 1: Escrever o teste com fakes de todas as funções `push*` (contam quantas vezes foram chamadas) e fakes de `window.electronAPI` retornando listas fixas, confirmando que `enviarTorneioParaNuvem` chama um push por registro e soma o total em `enviados`.**
- [ ] **Step 2: Rodar e confirmar falha.**
- [ ] **Step 3: Implementar `enviarTorneioParaNuvem`.**
- [ ] **Step 4: Rodar e confirmar que passa.**
- [ ] **Step 5: Adicionar o botão em `ListarTorneios.tsx`, mostrando o resultado (`X enviados`) numa notificação Mantine já usada em outras telas do projeto.**
- [ ] **Step 6: `npx tsc --noEmit`.**
- [ ] **Step 7: Commit** (`feat: add one-time local-to-cloud tournament upload`).

---

### Task 14: Verificação manual de conectividade (checklist, não automatizável)

Cobre os cenários de offline/reconexão que só fazem sentido com duas máquinas (ou dois perfis de navegador) reais.

**Files:**
- Create: `docs/superpowers/plans/2026-10-18-firebase-firestore-sync-verificacao-manual.md`

- [ ] **Step 1: Escrever o checklist com os cenários abaixo, cada um com o resultado esperado:**
  - Cadastrar atleta no PC A sem internet nenhuma → aparece salvo localmente, sem erro; ao reconectar, aparece no PC B.
  - Dois PCs offline ao mesmo tempo editando o mesmo atleta com nomes diferentes → ao reconectar os dois, vence o que editou por último (conferir pelo relógio de cada ação).
  - Registrar resultado de duas lutas diferentes da mesma chave, uma em cada PC, ambos offline → ao reconectar, as duas lutas aparecem atualizadas (nenhuma sobrescreve a outra).
  - Abrir um torneio salvo no formato antigo (pré-migração) → abre normalmente e os dados aparecem no novo formato arquivo-por-registro em disco.
  - Usar "Enviar para a nuvem" duas vezes seguidas no mesmo torneio → não duplica nada no Firestore.
- [ ] **Step 2: Executar o checklist com dois PCs (ou duas instâncias do app com `userData` apontando para pastas diferentes) e registrar o resultado de cada item.**
- [ ] **Step 3: Commit do checklist preenchido.**

```bash
git add docs/superpowers/plans/2026-10-18-firebase-firestore-sync-verificacao-manual.md
git commit -m "docs: record manual connectivity verification results"
```
