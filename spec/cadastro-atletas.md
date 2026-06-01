# Cadastro de Atletas

## 1. Objetivo

CRUD completo para cadastro individual de atletas, contemplando dados pessoais e de categoriza├º├úo necess├írios para inscri├º├úo em chaves e divis├Áes por peso, faixa et├íria e gradua├º├úo.

---

## 2. Stack Tecnol├│gico

- **Framework:** React 18 + TypeScript 5
- **Componentes:** Mantine UI v7 (`TextInput`, `NumberInput`, `Select`, `Button`, `Table`, `Modal`, `Notifications`)
- **├ìcones:** Tabler Icons 3
- **Formul├írio:** `@mantine/form` com valida├º├úo em tempo real
- **Persist├¬ncia:** Arquivo JSON local gerenciado via Electron IPC (`fs`)
- **Gera├º├úo de ID:** `crypto.randomUUID()`

---

## 3. Dados do Atleta

### 3.1. Campos

| Campo | Tipo | Obrigat├│rio | Descri├º├úo |
|---|---|---|---|
| **Nome** | `string` | Sim | Nome completo do atleta (armazenado em min├║sculo) |
| **Equipe** | `string` | Sim | Nome da equipe / academia (armazenado em min├║sculo) |
| **Peso (kg)** | `number` | Sim | Peso em quilogramas (ex.: 72.5) |
| **Faixa** | `Faixa` (enum) | Sim | Gradua├º├úo no Jiu-Jitsu (vide se├º├úo 3.2) |
| **Ano de nascimento** | `number` | Sim | Ano de nascimento (ex.: 1998) |

> Todos os campos de texto (`nome`, `equipe`) s├úo convertidos para **min├║sculo** antes de persistir no JSON. Isso uniformiza os dados e facilita buscas, compara├º├Áes e detec├º├úo de duplicatas.

### 3.2. Faixas (Gradua├º├Áes)

| Categoria | Faixas |
|---|---|
| **Infantil (4ÔÇô15 anos)** | Branca, Cinza, Amarela, Laranja, Verde |
| **Adulto (16+ anos)** | Branca, Azul, Roxa, Marrom, Preta |

As faixas s├úo exibidas no `Select` agrupadas por categoria e com labels capitalizadas (Branca, Azul, etc.). O valor armazenado ├® o nome em min├║sculo (`branca`, `azul`, etc.).

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
    "nome": "jo├úo silva",
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

A tela de atletas (`/admin/atletas`) ├® uma **tela unificada** que re├║ne as 3 opera├º├Áes principais em um s├│ lugar, acess├¡vel pelo card "Atletas" no Dashboard.

| Opera├º├úo | Elemento | Descri├º├úo |
|---|---|---|
| **Cadastrar** | Bot├úo "Cadastrar" no topo | Abre modal com formul├írio vazio para novo atleta |
| **Importar** | Bot├úo "Importar" no topo | Abre di├ílogo nativo para selecionar arquivo `.json` |
| **Listar** | Tabela de atletas | Exibe todos os atletas cadastrados com a├º├Áes por linha |

### 4.1. Tela Principal (AdminAthletes.tsx)

```
+----------------------------------------------------------+
|  ÔåÉ Voltar                                                 |
|  Atletas                          [Importar] [Cadastrar]  |
|                                                            |
|  ÔöîÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÉ   |
|  Ôöé Nome            Equipe      Faixa   Idade   A├º├Áes  Ôöé   |
|  Ôö£ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöñ   |
|  Ôöé Jo├úo Silva      Gracie Barra  Azul   28     [Ô£Å´©Å][­ƒùæ]Ôöé   |
|  Ôöé Maria Santos    Alliance     Branca 25     [Ô£Å´©Å][­ƒùæ]Ôöé   |
|  Ôöé ...                                                Ôöé   |
|  ÔööÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÿ   |
+----------------------------------------------------------+
```

- O layout utiliza o componente `PageLayout`, que fornece container responsivo, Paper com borda/sombra, t├¡tulo e bot├úo de voltar.
- O bot├úo "Voltar" retorna ao Dashboard do torneio ativo (`/admin/dashboard`).
- O header sempre exibe os bot├Áes **[Importar]** e **[Cadastrar]**, independentemente de haver atletas ou n├úo.
- Quando a lista est├í vazia, o empty state substitui a tabela (se├º├úo 5.2).

### 4.2. Modal de Cadastro / Edi├º├úo (AthleteForm.tsx)

```
ÔöîÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÉ
Ôöé  {Novo Atleta / Editar Atleta}           Ôöé
Ôö£ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöñ
Ôöé                                          Ôöé
Ôöé  Nome *                                  Ôöé
Ôöé  [____________________________________]  Ôöé
Ôöé                                          Ôöé
Ôöé  Equipe *                                Ôöé
Ôöé  [____________________________________]  Ôöé
Ôöé                                          Ôöé
Ôöé  Peso (kg) *                             Ôöé
Ôöé  [____________________________________]  Ôöé
Ôöé                                          Ôöé
Ôöé  Faixa *                                 Ôöé
Ôöé  [Branca  Ôû╝]                             Ôöé
Ôöé  Ôö£ÔöÇ Infantil (4ÔÇô15 anos) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ  Ôöé
Ôöé  Ôöé  Branca, Cinza, Amarela, Laranja,...  Ôöé
Ôöé  Ôö£ÔöÇ Adulto (16+ anos) ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ  Ôöé
Ôöé  Ôöé  Branca, Azul, Roxa, Marrom, Preta   Ôöé
Ôöé                                          Ôöé
Ôöé  Ano de Nascimento *                     Ôöé
Ôöé  [____________________________________]  Ôöé
Ôöé                                          Ôöé
Ôöé              [Cancelar]  [Salvar]        Ôöé
ÔööÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÿ
```

---

## 5. Comportamento

### 5.1. Carregamento Inicial

- Ao montar o componente `AdminAthletes`, dispara `loadAthletes()` via IPC.
- Enquanto carrega, exibe `<Loader />` centralizado.
- Em caso de erro no carregamento, exibe mensagem "Erro ao carregar atletas" + bot├úo "Tentar novamente".

### 5.2. Empty State

Quando a lista de atletas est├í vazia:
- O header permanece com os bot├Áes **[Importar]** e **[Cadastrar]**.
- Abaixo, exibe mensagem "Nenhum atleta cadastrado" centralizada.
- Bot├úo "Cadastrar Atleta" centralizado, que executa a mesma a├º├úo do bot├úo "Cadastrar" no header (abre modal em modo cria├º├úo).

### 5.3. Cadastro (Create)

1. Clique em **"Cadastrar"** no header ÔåÆ abre modal com t├¡tulo "Novo Atleta", campos vazios.
2. Preenche campos com valida├º├úo em tempo real.
3. Ao "Salvar":
   - Gera `id` via `crypto.randomUUID()`.
   - Define `createdAt` e `updatedAt` como `new Date().toISOString()`.
   - Envia ao main process via IPC `save-athlete`.
   - Main process (`electron/athletes.ts`): l├¬ o JSON atual, adiciona o novo registro, salva.
   - Notifica├º├úo verde: "Atleta cadastrado com sucesso!".
   - Fecha modal e recarrega a listagem.

### 5.4. Edi├º├úo (Update)

1. Clique no ├¡cone de l├ípis (Ô£Å´©Å) na linha do atleta ÔåÆ abre modal com t├¡tulo "Editar Atleta", campos preenchidos com os dados existentes.
2. Altera os campos desejados.
3. Ao "Salvar":
   - Normaliza `nome` e `equipe` para min├║sculo (`.toLowerCase()`) no renderer.
   - Verifica duplicata na lista local ignorando o pr├│prio `id`: se existir outro atleta com mesmo `nome` + `anoNascimento`, exibe notifica├º├úo de erro e interrompe.
   - Mant├®m o `id` e `createdAt` originais.
   - Atualiza `updatedAt` para `new Date().toISOString()`.
   - Envia ao main process via IPC `update-athlete`.
   - Main process: encontra o atleta pelo `id`, substitui no array, salva.
   - Notifica├º├úo verde: "Atleta atualizado com sucesso!".
   - Fecha modal e recarrega a listagem.

### 5.5. Exclus├úo (Delete)

1. Clique no ├¡cone de lixeira (­ƒùæ) na linha do atleta ÔåÆ abre modal de confirma├º├úo.
2. Mensagem: "Deseja realmente excluir o atleta **{nome}**? Esta a├º├úo n├úo pode ser desfeita."
3. Bot├Áes: [Cancelar] [Excluir] (vermelho).
4. Ao confirmar:
   - Envia ao main process via IPC `delete-athlete` com o `id`.
   - Main process: filtra o atleta pelo `id`, remove do array, salva.
   - Notifica├º├úo verde: "Atleta exclu├¡do com sucesso!".
   - Fecha modal e recarrega a listagem.

### 5.6. Importa├º├úo em Massa (Import JSON)

1. Clique em "Importar" (├¡cone de upload) ÔåÆ abre di├ílogo nativo do sistema para selecionar arquivo `.json`.
2. O arquivo deve conter um array de objetos `Atleta` com os campos `id`, `nome`, `equipe`, `faixa`, `anoNascimento`, `pesoKg`.
3. A valida├º├úo ocorre no main process:
   - O conte├║do deve ser um array.
   - Cada atleta deve ter os campos obrigat├│rios: `id`, `nome`, `equipe`, `faixa`, `anoNascimento`, `pesoKg`.
4. Ap├│s validar, os atletas s├úo mesclados com a lista existente:
   - Atletas com `id` novo s├úo adicionados.
   - Atletas com `id` j├í existente s├úo ignorados (pulados).
5. Notifica├º├úo verde com resumo: "{X} atleta(s) importado(s), {Y} ignorado(s) (j├í existentes)."
6. Se o usu├írio cancelar o di├ílogo, nenhuma a├º├úo ├® executada.
7. Em caso de erro (arquivo inv├ílido, campos ausentes), notifica├º├úo vermelha "Erro ao importar atletas."

### 5.7. C├ílculo da Idade

```typescript
function calcularIdade(anoNascimento: number): number {
  return new Date().getFullYear() - anoNascimento;
}
```

A idade ├® exibida na coluna "Idade" da tabela, calculada dinamicamente a partir do ano de nascimento. N├úo ├® persistida no JSON.

---

## 6. Regras de Duplicidade

### 6.1. Crit├®rio de Duplicidade

Um atleta ├® considerado **duplicata** de outro quando ambos possuem o mesmo **nome** (ignorando diferen├ºas de mai├║sculas/min├║sculas e espa├ºos extras) **e** mesmo **ano de nascimento**.

| Campo | Crit├®rio de compara├º├úo |
|---|---|
| **Nome** | Case-insensitive, whitespace-trimmed |
| **Ano de nascimento** | Igualdade exata (`===`) |
| **Equipe** | N├úo entra no crit├®rio (um atleta pode trocar de equipe) |

> **Exemplo:** "Jo├úo Silva" (1998) e "jo├úo silva" (1998) s├úo considerados a mesma pessoa, mesmo que a equipe seja diferente.

### 6.2. Onde a Verifica├º├úo Ocorre

| Opera├º├úo | Local da Verifica├º├úo | Comportamento |
|---|---|---|
| **Cadastro individual** (`save-athlete`) | Renderer (`AdminAthletes.tsx:handleSave`) | Antes de chamar o IPC, percorre a lista local de atletas. Se encontrar match por nome + anoNascimento, exibe notifica├º├úo de erro "J├í existe um atleta cadastrado com este nome e ano de nascimento." e n├úo salva. |
| **Importa├º├úo em massa** (`import-athletes`) | Main process (`electron/athletes.ts:importAthletesFromFile`) | Durante a mesclagem, al├®m de verificar `id` duplicado, tamb├®m verifica nome + anoNascimento. Atletas duplicados por este crit├®rio s├úo **ignorados** e contabilizados em `skipped`. |
| **Edi├º├úo** (`update-athlete`) | Renderer (`AdminAthletes.tsx:handleSave`) | A verifica├º├úo ignora o pr├│prio atleta sendo editado (compara├º├úo por `id`). Permite salvar sem alterar nome ou ano, mas bloqueia se houver outro atleta com mesmo nome + ano. |

### 6.3. Fluxo de Bloqueio (Cadastro Individual)

```
Usu├írio preenche formul├írio ÔåÆ clica "Salvar"
  ÔåÆ handleSave() no renderer
    ÔåÆ Verifica duplicata na lista local (athletes)
      ÔåÆ Se duplicata encontrada (excluindo o pr├│prio id):
        ÔåÆ Notifica├º├úo vermelha: "J├í existe um atleta cadastrado com este nome e ano de nascimento."
        ÔåÆ Modal permanece aberto
        ÔåÆ N├âO chama IPC save-athlete
      ÔåÆ Se n├úo h├í duplicata:
        ÔåÆ Chama IPC save-athlete / update-athlete normalmente
```

### 6.4. Fluxo de Importa├º├úo

```
Arquivo JSON selecionado
  ÔåÆ importAthletesFromFile()
    ÔåÆ Para cada atleta do arquivo:
      ÔåÆ Verifica se id j├í existe na lista atual ÔåÆ se sim, skipped++
      ÔåÆ Verifica se nome (case-insensitive) + anoNascimento j├í existe ÔåÆ se sim, skipped++
      ÔåÆ Se passou nas duas verifica├º├Áes ÔåÆ imported++
    ÔåÆ Salva arquivo atualizado
    ÔåÆ Retorna { imported, skipped }
```

### 6.5. Mensagens para o Usu├írio

| Contexto | Mensagem |
|---|---|
| Cadastro individual com duplicata | "J├í existe um atleta cadastrado com este nome e ano de nascimento." |
| Importa├º├úo com duplicatas ignoradas | "{X} atleta(s) importado(s), {Y} ignorado(s) (j├í existentes)." |

---

## 7. Valida├º├Áes

| Campo | Regra | Mensagem de erro |
|---|---|---|
| **Nome** | M├¡nimo 2 caracteres | "Nome deve ter ao menos 2 caracteres" |
| **Equipe** | M├¡nimo 2 caracteres | "Equipe deve ter ao menos 2 caracteres" |
| **Peso** | N├║mero entre 1 e 300 | "Peso deve estar entre 1 e 300 kg" |
| **Faixa** | Deve ser uma faixa v├ílida do enum | "Selecione uma faixa v├ílida" |
| **Ano de nascimento** | Inteiro entre 1920 e ano atual | "Ano deve estar entre 1920 e {anoAtual}" |

A valida├º├úo ocorre:
- **Em tempo real** ao digitar, com erro exibido abaixo do campo.
- **No submit** (`form.onSubmit`): se houver erro, o formul├írio n├úo ├® enviado.

O formul├írio utiliza `@mantine/form` com `mode: 'uncontrolled'`.

---

## 8. Estados da Tela

| Estado | Descri├º├úo |
|---|---|
| **Carregamento** | `<Loader />` centralizado enquanto carrega a lista via IPC |
| **Vazia** | "Nenhum atleta cadastrado" + bot├úo "Cadastrar Atleta" centralizado (header mant├®m [Importar] [Cadastrar]) |
| **Normal** | Tabela com atletas listados e a├º├Áes (editar/excluir) |
| **Modal cria├º├úo** | Modal aberto com t├¡tulo "Novo Atleta" e formul├írio vazio |
| **Modal edi├º├úo** | Modal aberto com t├¡tulo "Editar Atleta" e dados preenchidos |
| **Erro ao carregar** | Mensagem "Erro ao carregar atletas" + bot├úo "Tentar novamente" |
| **Erro ao salvar** | Notifica├º├úo vermelha "Erro ao salvar o atleta." |
| **Erro ao excluir** | Notifica├º├úo vermelha "Erro ao excluir o atleta." |

---

## 9. Comunica├º├úo Main <> Renderer (IPC)

### 9.1. Canais

| Canal | Dire├º├úo | Descri├º├úo |
|---|---|---|
| `load-athletes` | Renderer ÔåÆ Main ÔåÆ Renderer | Retorna array de atletas do JSON |
| `save-athlete` | Renderer ÔåÆ Main | Adiciona novo atleta ao JSON |
| `update-athlete` | Renderer ÔåÆ Main | Substitui atleta existente (match por `id`) |
| `delete-athlete` | Renderer ÔåÆ Main | Remove atleta do JSON pelo `id` |
| `import-athletes` | Renderer ÔåÆ Main ÔåÆ Renderer | Abre di├ílogo nativo, l├¬ arquivo JSON, mescla com lista existente, retorna `{ imported, skipped }` |

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
  if (index === -1) throw new Error('Atleta n├úo encontrado')
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
    throw new Error('Arquivo inv├ílido: o conte├║do deve ser um array de atletas.')
  }

  for (const a of incoming) {
    if (!a.id || !a.nome || !a.equipe || !a.faixa || !a.anoNascimento || !a.pesoKg) {
      throw new Error(`Atleta inv├ílido no arquivo: "${a.nome || 'sem nome'}" ÔÇö campos obrigat├│rios ausentes.`)
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
  main.ts              ÔåÉ Registro dos handlers IPC (load/save/update/delete/import-athletes)
  preload.ts           ÔåÉ Exposi├º├úo dos canais via contextBridge
  athletes.ts          ÔåÉ L├│gica CRUD + importAthletesFromFile + openAthleteFileDialog

src/
  pages/
    AdminAthletes.tsx  ÔåÉ Tela de gerenciamento (PageLayout + estado + modais)
  components/
    AthleteForm.tsx    ÔåÉ Modal de cadastro/edi├º├úo com valida├º├úo
    AthleteTable.tsx   ÔåÉ Tabela de listagem com a├º├Áes
  types/
    athlete.ts         ÔåÉ Interfaces Atleta e Faixa
```

---

## 11. Observa├º├Áes

- A idade n├úo ├® armazenada no JSON, apenas o ano de nascimento, para evitar dados obsoletos.
- As faixas s├úo exibidas no `Select` agrupadas por categoria (Infantil / Adulto) com separa├º├úo visual.
- O campo "Equipe" ├® texto livre; poder├í futuramente se tornar um `Select` com equipes pr├®-cadastradas.
- Toda opera├º├úo ├® offline, sem depend├¬ncia de API externa.
- O arquivo `atletas.json` ├® global (compartilhado entre todos os torneios), n├úo vinculado a um torneio espec├¡fico.
- A listagem ├® recarregada via `loadAthletes()` ap├│s cada opera├º├úo de create, update ou delete.
- O token de hardware `crypto.randomUUID()` ├® utilizado para gerar IDs ├║nicos no renderer.
- **Todos os campos de texto** (`nome`, `equipe`) s├úo convertidos para **min├║sculo** no momento do submit (tanto no cadastro individual via `AthleteForm.tsx` quanto na importa├º├úo em massa via `athletes.ts`). Isso garante uniformidade e facilita compara├º├Áes (busca, duplicidade, ordena├º├úo). A exibi├º├úo na interface reflete o valor armazenado (min├║sculo).

---

## 12. Problemas

### 12.1. Tela de Atletas n├úo exibe o menu solicitado

**Problema:**  
Ao clicar no card "Atletas" no Dashboard (`/admin/dashboard`), a navega├º├úo leva diretamente para `/admin/atletas`, que renderiza a tela unificada de CRUD (tabela + bot├Áes Importar/Cadastrar). O layout solicitado na documenta├º├úo previa uma p├ígina intermedi├íria com um **menu de op├º├Áes** (cart├Áes de "Cadastrar Atleta", "Listar Atletas", "Importar Atletas") antes de exibir qualquer listagem ou formul├írio.

**Hierarquia de navega├º├úo atual do sistema:**

```
Menu Inicial (/)
  ÔööÔöÇÔöÇ Cards com 3 op├º├Áes (Criar / Importar / Listar Torneio)
       ÔööÔöÇÔöÇ P├íginas-filho (CriarTorneio, ImportarTorneio, ListarTorneios)
            ÔööÔöÇÔöÇ Dashboard (/admin/dashboard)
                 ÔööÔöÇÔöÇ Grid de cards administrativos
                      ÔööÔöÇÔöÇ Atletas ÔåÆ /admin/atletas ÔåÆ AdminAthletes.tsx (CRUD direto, SEM menu)
                      ÔööÔöÇÔöÇ Demais cards ÔåÆ "Em breve"
```

**Hierarquia esperada (com base no padr├úo do MenuInicial e Dashboard):**

```
Dashboard (/admin/dashboard)
  ÔööÔöÇÔöÇ Atletas card ÔåÆ /admin/atletas ÔåÆ AthletesMenu.tsx (MENU intermedi├írio)
       Ôö£ÔöÇÔöÇ Cadastrar Atleta ÔåÆ abre modal de cadastro (AthleteForm)
       Ôö£ÔöÇÔöÇ Listar Atletas ÔåÆ /admin/atletas/lista ÔåÆ AdminAthletes.tsx (tabela CRUD)
       ÔööÔöÇÔöÇ Importar Atletas ÔåÆ dispara di├ílogo nativo de importa├º├úo
```

**Causa raiz:**  
A rota `/admin/atletas` foi implementada como *tela ├║nica* no componente `AdminAthletes.tsx`, que combina **listagem + cadastro + edi├º├úo + importa├º├úo** tudo no mesmo lugar, sem uma camada de menu intermedi├íria. Isso quebra o padr├úo de navega├º├úo do sistema, onde:

- `MenuInicial.tsx` ÔÇö usa cart├Áes empilhados verticalmente com ├¡cone, label e descri├º├úo
- `Dashboard.tsx` ÔÇö usa grid de cart├Áes responsivo com status (implementado/planejado)
- `AdminAthletes.tsx` ÔÇö pula direto para a tabela, sem cart├úo de op├º├Áes

O conte├║do de `AdminAthletes.tsx` (tabela, filtros, bot├Áes, modais, empty state) est├í correto e alinhado com a Se├º├úo 4 deste documento. O erro ├® que esse conte├║do deveria estar em uma **sub-rota** (`/admin/atletas/lista`), n├úo na raiz `/admin/atletas`.

**Como corrigir:**

1. **Criar** `src/pages/AthletesMenu.tsx` ÔÇö p├ígina intermedi├íria seguindo o padr├úo de `MenuInicial.tsx`:
   - Wrapped em `<PageLayout title="Atletas" backRoute="/admin/dashboard">`
   - Conter uma `Stack` vertical ou `Grid` de cart├Áes clic├íveis (`Card` do Mantine)
   - Cada cart├úo com: ├¡cone (Tabler Icon), label em negrito, descri├º├úo curta
   - Tr├¬s cart├Áes:
     - **Cadastrar Atleta** (`IconPlus`) ÔÇö abre o modal `AthleteForm` diretamente (ou navega para `/admin/atletas/cadastrar`)
     - **Listar Atletas** (`IconList`) ÔÇö navega para `/admin/atletas/lista`
     - **Importar Atletas** (`IconFileUpload`) ÔÇö dispara `window.electronAPI.importAthletes()` diretamente
   - Opcional: suporte a teclas de atalho (1, 2, 3) como no `MenuInicial`

2. **Modificar** `src/App.tsx`:
   - Alterar a rota `/admin/atletas` para importar e renderizar `AthletesMenu`
   - Adicionar nova rota `/admin/atletas/lista` para renderizar `AdminAthletes`
   - Adicionar `import AthletesMenu from './pages/AthletesMenu'`

3. **Modificar** `src/pages/AdminAthletes.tsx`:
   - Alterar `backRoute` de `"/admin/dashboard"` para `"/admin/atletas"` (voltar para o menu, n├úo para o Dashboard)

4. **Dashboard.tsx** ÔÇö nenhuma altera├º├úo necess├íria, o card j├í aponta para `/admin/atletas`

**Arquivos afetados:**

| Arquivo | A├º├úo | Detalhe |
|---|---|---|
| `src/pages/AthletesMenu.tsx` | **Criar** | P├ígina com cart├Áes de menu (Cadastrar, Listar, Importar) |
| `src/App.tsx` | **Modificar** | Re-ro tear `/admin/atletas` ÔåÆ `AthletesMenu`; adicionar `/admin/atletas/lista` ÔåÆ `AdminAthletes` |
| `src/pages/AdminAthletes.tsx` | **Modificar** | Alterar `backRoute` de `/admin/dashboard` para `/admin/atletas` |
| `src/pages/Dashboard.tsx` | **Nenhuma** | Card j├í aponta para `/admin/atletas` (agora ser├í o menu) |

### 12.3. Formul├írio de cadastro abre em branco (modal invis├¡vel)

**Problema:**  
Ao clicar em "Cadastrar Atleta" no AthletesMenu ou no bot├úo "Cadastrar" no AdminAthletes, o modal ├® aberto mas exibe uma tela em branco. O conte├║do do formul├írio n├úo ├® renderizado, deixando o modal visualmente vazio.

**Causa raiz:**  
Concorr├¬ncia entre tr├¬s mecanismos no `AthleteForm.tsx`:

1. **`key={formKey.current}` no `<Modal>`** ÔÇö o `formKey` ├® um `useRef(0)` incrementado no `useEffect` quando `opened` muda para `true`.
2. **`form.reset()` no `useEffect`** ÔÇö chamado quando `opened` muda para `true` e n├úo h├í `athlete` (modo cria├º├úo). Esse `form.reset()` dispara um **re-render** do componente.
3. **Ciclo assassino:**  
   a. Usu├írio clica "Cadastrar" ÔåÆ `opened` muda de `false` para `true` ÔåÆ React inicia render.  
   b. `useEffect` roda ap├│s o primeiro render: `formKey.current` vai de 0 para 1, e `form.reset()` ├® chamado.  
   c. `form.reset()` dispara um **segundo render** com `formKey.current === 1`.  
   d. React detecta que a `key` do `<Modal>` mudou (0 ÔåÆ 1) e **desmonta o Modal inteiro** (que estava no meio da transi├º├úo de abertura) e **remonta** um novo Modal com `opened=true`.  
   e. O novo Modal ├® montado j├í com `opened=true`, pulando a transi├º├úo `fechado ÔåÆ aberto` que o Mantine Modal precisa para exibir o conte├║do.  
   f. Resultado: modal "aberto" mas com conte├║do invis├¡vel (branco).

**Como corrigir:**

1. **Remover** `key={formKey.current}` do `<Modal>`.
2. **Remover** `const formKey = useRef(0)` e o `useEffect` que incrementa `formKey.current`.
3. O `form.reset()` j├í ├® chamado no `useEffect` existente (linha 84) quando `opened` muda para `true` sem `athlete` ÔÇö isso ├® suficiente para limpar o formul├írio. N├úo precisa de `key` para for├çar remontagem.

**Arquivos afetados:**

| Arquivo | A├º├úo | Detalhe |
|---|---|---|
| `src/components/AthleteForm.tsx` | **Modificar** | Remover `key` prop do `<Modal>`, remover `formKey` ref, remover `useEffect` de incremento, remover `useRef` do import |


