# Importação em Massa de Atletas (Import JSON)

## 1. Objetivo

Permitir que o usuário importe múltiplos atletas de uma só vez a partir de um arquivo JSON, com validação de estrutura, deduplicação por ID e por nome + ano de nascimento, e mesclagem com a lista global de atletas.

---

## 2. Fluxo Principal

```
Usuário clica "Importar"
  → Renderer chama window.electronAPI.importAthletes()
    → IPC invoke 'import-athletes'
      → Main process: abre diálogo nativo de seleção de arquivo
        → Usuário seleciona arquivo .json → importAthletesFromFile(filePath)
        → Usuário cancela → retorna { imported: 0, skipped: 0 } (no-op)
      → Renderer recebe resultado
        → Notificação de sucesso com contagem
        → Recarrega listagem de atletas
```

---

## 3. Gatilhos de Importação

A importação pode ser disparada de dois lugares na interface:

| Local | Arquivo | Fluxo |
|---|---|---|
| Menu de Atletas (`/admin/atletas`) | `src/pages/AthletesMenu.tsx` | Cartão "Importar Atletas" → `handleImport()` (linhas 55-65) |
| Lista de Atletas (`/admin/atletas/lista`) | `src/pages/AdminAthletes.tsx` | Botão "Importar" no header → `handleImport()` (linhas 105-115) |

Ambos chamam a mesma API `window.electronAPI.importAthletes()` e exibem o mesmo tratamento de resultado.

---

## 4. Canais IPC

| Canal | Direção | Descrição |
|---|---|---|
| `import-athletes` | Renderer → Main → Renderer | Abre diálogo nativo, lê JSON, valida, mescla com lista existente, retorna `{ imported: number; skipped: number }` |

### Preload (`electron/preload.ts:32-33`)

```typescript
importAthletes: () => ipcRenderer.invoke('import-athletes'),
```

### Handler (`electron/main.ts:88-92`)

```typescript
ipcMain.handle('import-athletes', async (): Promise<{ imported: number; skipped: number }> => {
  const filePath = await openAthleteFileDialog()
  if (!filePath) return { imported: 0, skipped: 0 }
  return importAthletesFromFile(filePath)
})
```

### TypeScript (`src/types/electron.d.ts:26`)

```typescript
importAthletes: () => Promise<{ imported: number; skipped: number }>;
```

---

## 5. Diálogo de Arquivo

### `openAthleteFileDialog()` (`electron/athletes.ts:86-92`)

- Abre diálogo nativo do sistema operacional via `dialog.showOpenDialog`.
- Filtro de extensão: **apenas `.json`**.
- Propriedade: `openFile` (seleção de arquivo único).
- Se o usuário cancelar ou fechar o diálogo sem selecionar → retorna `null`.
- Se selecionar um arquivo → retorna o `filePath` (string).

### Comportamento no cancelamento

O handler `import-athletes` no `main.ts` trata o retorno `null`:
- Se `null` → retorna `{ imported: 0, skipped: 0 }` imediatamente, **sem lançar erro**.
- O renderer (tanto `AthletesMenu.tsx` quanto `AdminAthletes.tsx`) verifica:
  ```typescript
  if (result.imported === 0 && result.skipped === 0) return;
  ```
  Isso faz com que **nenhuma notificação seja exibida** quando o usuário apenas cancela o diálogo.

---

## 6. Processamento do Arquivo

### `importAthletesFromFile(filePath)` (`electron/athletes.ts:42-84`)

#### 6.1. Leitura e Parse

- Lê o arquivo do disco com `fs.readFileSync(filePath, 'utf-8')`.
- Faz parse com `JSON.parse(raw)`.
- **Se o arquivo não for JSON válido** → exceção `SyntaxError` propagada para o renderer → notificação vermelha "Erro ao importar atletas."

#### 6.2. Validação de Estrutura

##### 6.2.1. Deve ser um array

```typescript
if (!Array.isArray(incoming)) {
  throw new Error('Arquivo inválido: o conteúdo deve ser um array de atletas.')
}
```

- Se o JSON raiz não for um array (ex.: objeto, string, número) → erro lançado → notificação vermelha.
- Array vazio (`[]`) é válido: `imported = 0, skipped = 0`, arquivo `atletas.json` é reescrito (inalterado).

##### 6.2.2. Estrutura mínima aceita

O JSON de entrada deve conter **apenas** os campos obrigatórios. `id`, `createdAt` e `updatedAt` são opcionais — se ausentes, são gerados automaticamente durante a importação.

```json
[
  {
    "nome": "manu",
    "equipe": "imperio",
    "pesoKg": 63,
    "faixa": "branca",
    "anoNascimento": 2001
  }
]
```

Campos extras (ex.: `telefone`, `email`) são permitidos e preservados, mas não afetam o processo.

##### 6.2.3. Campos obrigatórios por atleta

Para **cada** atleta no array:

| Campo | Obrigatório | Verificação |
|---|---|---|
| `id` | Não | Se ausente, gerado automaticamente via `crypto.randomUUID()` |
| `nome` | Sim | `!a.nome` — truthy check |
| `equipe` | Sim | `!a.equipe` — truthy check |
| `faixa` | Sim | `!a.faixa` — truthy check |
| `anoNascimento` | Sim | `!a.anoNascimento` — truthy check (**cuidado:** `0` é falsy; ano 0 é inválido) |
| `pesoKg` | Sim | `!a.pesoKg` — truthy check (**cuidado:** `0` é falsy; peso 0 é inválido) |
| `createdAt` | Não | Se ausente, gerado como `new Date().toISOString()` |
| `updatedAt` | Não | Se ausente, gerado como `new Date().toISOString()` |

```typescript
if (!a.nome || !a.equipe || !a.faixa || !a.anoNascimento || !a.pesoKg) {
  throw new Error(`Atleta inválido no arquivo: "${a.nome || 'sem nome'}" — campos obrigatórios ausentes.`)
}
```

- A validação é **falha rápido** (fail-fast): ao primeiro atleta inválido, **todo o processo é abortado** e o erro é propagado. Nenhum atleta é importado.
- Mensagem de erro inclui o nome do atleta problemático (ou "sem nome" se `nome` estiver ausente).
- **Não há validação de tipos** (ex.: `pesoKg` poderia ser string, `anoNascimento` poderia ser string) — apenas verificação de truthy.

##### 6.2.4. Campos NÃO validados (gerados automaticamente se ausentes)

- `id` — se ausente, gerado via `crypto.randomUUID()` durante a importação.
- `createdAt` — se ausente, gerado como ISO atual.
- `updatedAt` — se ausente, gerado como ISO atual.
- Outros campos extras no objeto são ignorados (mantidos se presentes via spread `...a`).

#### 6.3. Carregamento da Lista Atual

- Lê o arquivo `{userData}/data/atletas.json`.
- Se o arquivo não existir → lista vazia `[]`.
- Se o arquivo existir e for um array → carrega conteúdo.
- **Se o arquivo existir com JSON inválido** → `JSON.parse` lança exceção → propagada como erro.

#### 6.4. Mesclagem e Deduplicação

Para cada atleta `a` do arquivo de entrada:

##### 6.4.1. Normalização

```typescript
const nomeLower = a.nome.trim().toLowerCase()
const equipeLower = a.equipe.trim().toLowerCase()
```

- `nome` é convertido para minúsculo com trim.
- `equipe` é convertido para minúsculo com trim.
- A normalização é aplicada **antes** da verificação de duplicidade e **antes** de adicionar à lista.

##### 6.4.2. Critérios de duplicidade

Um atleta é considerado **já existente** (e portanto ignorado) se **QUALQUER** condição abaixo for verdadeira:

| Critério | Código | Descrição |
|---|---|---|
| **ID duplicado** | `a.id && ex.id === a.id` | O `id` do atleta de entrada já existe na lista atual (só verifica se `id` foi fornecido) |
| **Nome + Ano duplicado** | `ex.nome.trim().toLowerCase() === nomeLower && ex.anoNascimento === a.anoNascimento` | Outro atleta na lista atual possui o mesmo **nome** (case-insensitive, trimmed) **e** mesmo **ano de nascimento** |

```typescript
const exists = current.some(
  ex =>
    (a.id && ex.id === a.id) ||
    (ex.nome.trim().toLowerCase() === nomeLower && ex.anoNascimento === a.anoNascimento)
)
```

##### 6.4.3. O que NÃO é verificado para duplicidade

- **Equipe** — não entra no critério. Dois atletas podem ter mesmo nome e ano mas equipes diferentes → ainda assim são considerados duplicata.
- **Peso, faixa** — não entram no critério.
- **Caso invertido** — se o atleta da lista atual tem nome em minúsculo (já normalizado) e o de entrada tem maiúsculo, a comparação é case-insensitive → detecta duplicata.

##### 6.4.4. Atleta não duplicado → importado

```typescript
a.nome = nomeLower
a.equipe = equipeLower
current.push({
  ...a,
  id: a.id || crypto.randomUUID(),
  createdAt: a.createdAt || new Date().toISOString(),
  updatedAt: a.updatedAt || new Date().toISOString(),
})
imported++
```

- Os valores normalizados (`nomeLower`, `equipeLower`) sobrescrevem os originais.
- `id`: preserva o valor original do arquivo se presente; caso contrário, gera novo UUID via `crypto.randomUUID()`.
- `createdAt`: preserva o valor original do arquivo se presente; caso contrário, gera ISO atual.
- `updatedAt`: preserva o valor original do arquivo se presente; caso contrário, gera ISO atual.

##### 6.4.5. Atleta duplicado → ignorado

```typescript
skipped++
```

- O atleta não é adicionado.
- Não há notificação individual por atleta ignorado — apenas o contador agregado.

#### 6.5. Persistência

```typescript
fs.writeFileSync(FILE, JSON.stringify(current, null, 2), 'utf-8')
```

- O arquivo `{userData}/data/atletas.json` é reescrito por completo com o array mesclado.
- Formatação: indentação de 2 espaços, UTF-8.
- Em caso de erro de escrita → exceção propagada → notificação vermelha no renderer.

#### 6.6. Retorno

```typescript
return { imported, skipped }
```

- `imported`: total de novos atletas adicionados.
- `skipped`: total de atletas ignorados (por ID duplicado — se `id` foi fornecido — ou nome + ano duplicado).

---

## 7. Tratamento no Renderer

### 7.1. AthletesMenu (`src/pages/AthletesMenu.tsx:55-65`)

```typescript
const handleImport = async () => {
  try {
    const result = await window.electronAPI.importAthletes()
    // Se o usuário cancelou o diálogo: imported=0, skipped=0 → early return sem notificação
    if (result.imported === 0 && result.skipped === 0) return
    const msg = `${result.imported} atleta(s) importado(s)${
      result.skipped > 0 ? `, ${result.skipped} ignorado(s) (já existentes)` : ''
    }.`
    notifications.show({ title: 'Sucesso', message: msg, color: 'green' })
    await loadAthletes()
  } catch {
    notifications.show({ title: 'Erro', message: 'Erro ao importar atletas.', color: 'red' })
  }
}
```

### 7.2. AdminAthletes (`src/pages/AdminAthletes.tsx:105-115`)

- Idêntico ao AthletesMenu.
- Após importar, recarrega a listagem com `loadAthletes()`.

### 7.3. Mensagens ao usuário

| Cenário | Tipo | Mensagem |
|---|---|---|
| Usuário cancela o diálogo | Nenhuma | (silêncio — nenhuma notificação) |
| Importação parcial (alguns ignorados) | Sucesso (verde) | `"X atleta(s) importado(s), Y ignorado(s) (já existentes)."` |
| Importação total (todos importados) | Sucesso (verde) | `"X atleta(s) importado(s)."` |
| Arquivo inválido (não é array) | Erro (vermelho) | `"Erro ao importar atletas."` |
| Campos obrigatórios ausentes | Erro (vermelho) | `"Erro ao importar atletas."` |
| JSON malformado (syntax error) | Erro (vermelho) | `"Erro ao importar atletas."` |
| Erro de leitura/escrita do arquivo | Erro (vermelho) | `"Erro ao importar atletas."` |

---

## 8. Regras de Validação — Resumo

| Etapa | Regra | Consequência |
|---|---|---|
| Tipo do JSON raiz | Deve ser `Array` | Erro → aborta tudo |
| Campos obrigatórios | `nome`, `equipe`, `faixa`, `anoNascimento`, `pesoKg` (truthy); `id`, `createdAt`, `updatedAt` são opcionais e auto-gerados | Erro → aborta tudo |
| Duplicidade por `id` | `id` igual a um já existente (só se `id` foi fornecido) | Atleta ignorado (skipped++) |
| Duplicidade por nome + ano | Mesmo `nome` (case-insensitive) + `anoNascimento` | Atleta ignorado (skipped++) |
| Normalização | `nome` e `equipe` → `trim().toLowerCase()` | Aplicado a todos os importados |
| Timestamps | `createdAt` / `updatedAt` preservados se presentes, senão gerados | Garantia de rastreabilidade |

---

## 9. Limitações Atuais

### 9.1. Formato exclusivo JSON

A importação aceita **apenas** arquivos `.json`. O filtro nativo do diálogo restringe a seleção a esta extensão. Não há suporte a CSV, Excel, XML ou outros formatos.

### 9.2. Ausência de validação de tipo

Campos como `pesoKg` e `anoNascimento` são verificados apenas por truthy, não por tipo. Um `pesoKg` passado como string (`"76.5"`) seria aceito. Um `anoNascimento` passado como string (`"1998"`) seria aceito.

### 9.3. Validação de faixa

O campo `faixa` não é validado contra o enum `Faixa`. Qualquer string truthy é aceita, mesmo que não corresponda a uma faixa válida (`branca`, `cinza`, `amarela`, `laranja`, `verde`, `azul`, `roxa`, `marrom`, `preta`).

### 9.4. Falha rápido (fail-fast)

Se **qualquer** atleta no arquivo estiver com campos obrigatórios ausentes, **todo** o lote é rejeitado. Não há importação parcial — ou todos passam na validação ou nenhum é importado.

### 9.5. Sem rollback

Se o arquivo `atletas.json` for reescrito com sucesso parcial (ex.: erro ocorre durante escrita), o arquivo pode ficar em estado inconsistente. Não há mecanismo de backup ou rollback.

### 9.6. Sem feedback por atleta ignorado

Não há indicação visual de **quais** atletas foram ignorados nem o motivo (se foi por `id` duplicado ou por `nome + ano` duplicado). O usuário vê apenas o contador agregado.

---

## 10. Casos de Borda

### 10.1. Arquivo vazio (`[]`)

- `imported = 0`, `skipped = 0`.
- Arquivo `atletas.json` é reescrito (inalterado).
- Notificação **não** é exibida (condição `imported === 0 && skipped === 0` → early return).

### 10.2. Arquivo com um único atleta já existente

- `imported = 0`, `skipped = 1`.
- Notificação: `"0 atleta(s) importado(s), 1 ignorado(s) (já existentes)."`

### 10.3. Todos os atletas já existentes

- `skipped = N`, `imported = 0`.
- Notificação é exibida com contagem de ignorados.

### 10.4. Duplicata no próprio arquivo de importação

- Se o arquivo de entrada contém dois atletas com mesmo `id` (e `id` foi fornecido) → o primeiro é processado, o segundo é ignorado (`skipped++`) porque o `id` já está na lista (foi adicionado pelo primeiro).
- Se o arquivo contém dois atletas com mesmo `nome + anoNascimento` mas `id` diferentes (ou sem `id`) → o primeiro é adicionado, o segundo é ignorado (`skipped++`) pela regra de nome + ano.

### 10.5. Nome com espaços extras

- A normalização `trim().toLowerCase()` remove espaços no início/fim, mas espaços internos são preservados.
- `"João  Silva"` (dois espaços) → `"joão  silva"`.
- Na comparação, o nome do atleta existente é `"joão silva"` (um espaço) → **não** detectado como duplicata devido aos espaços internos.

### 10.6. Case-sensitivity

- Nomes em maiúsculo `"JOÃO SILVA"` são normalizados para `"joão silva"`.
- A comparação usa ambos os lados com `toLowerCase()`, portanto detecta duplicatas corretamente.

### 10.7. Campos extras no JSON

- Objetos com campos adicionais além dos da interface `Atleta` são aceitos.
- Os campos extras são preservados via spread `...a`.

### 10.8. Ano de nascimento zero

- `!a.anoNascimento` → `0` é falsy → atleta com `anoNascimento: 0` é rejeitado como "campos obrigatórios ausentes".

---

## 11. Estados e Respostas

| Estado | Retorno | Notificação |
|---|---|---|
| Usuário cancela diálogo | `{ imported: 0, skipped: 0 }` | Nenhuma |
| Arquivo inválido (não array) | Exceção | "Erro ao importar atletas." |
| Campos obrigatórios ausentes | Exceção | "Erro ao importar atletas." |
| JSON malformado | Exceção | "Erro ao importar atletas." |
| Zero atletas importados, zero ignorados | `{ imported: 0, skipped: 0 }` | Nenhuma |
| Zero importados, um+ ignorados | `{ imported: 0, skipped: N }` | "0 atleta(s) importado(s), N ignorado(s) (já existentes)." |
| Um+ importados, zero ignorados | `{ imported: N, skipped: 0 }` | "N atleta(s) importado(s)." |
| Um+ importados, um+ ignorados | `{ imported: N, skipped: M }` | "N atleta(s) importado(s), M ignorado(s) (já existentes)." |
| Erro de escrita no disco | Exceção | "Erro ao importar atletas." |

---

## 12. Arquivos Envolvidos

### Código Fonte

| Arquivo | Função |
|---|---|
| `electron/athletes.ts` | `importAthletesFromFile()` (core), `openAthleteFileDialog()` (diálogo) |
| `electron/main.ts` | Registro do handler IPC `import-athletes` (linha 88) |
| `electron/preload.ts` | Exposição do canal `importAthletes` via contextBridge (linha 32) |
| `src/pages/AthletesMenu.tsx` | Gatilho de importação no menu de atletas (linhas 55-65) |
| `src/pages/AdminAthletes.tsx` | Gatilho de importação na listagem (linhas 105-115) |
| `src/types/electron.d.ts` | TypeScript declaration para `importAthletes()` (linha 26) |
| `src/types/athlete.ts` | Interface `Atleta` e tipo `Faixa` |

### Dados

| Arquivo | Descrição |
|---|---|
| `{userData}/data/atletas.json` | Lista global de atletas (alvo da importação) |

---

## 13. Melhorias Futuras (Não Implementado)

- [ ] Suporte a importação CSV/Excel.
- [ ] Validação de tipo para campos numéricos (`pesoKg`, `anoNascimento`).
- [ ] Validação de `faixa` contra o enum `Faixa`.
- [ ] Importação parcial: pular atletas inválidos e continuar com os válidos.
- [ ] Feedback detalhado por atleta ignorado (quais e por quê).
- [ ] Backup automático do `atletas.json` antes de reescrever.
- [ ] Preview dos dados antes de confirmar a importação.
- [ ] Mapeamento de campos (caso o arquivo tenha nomes de coluna diferentes).
