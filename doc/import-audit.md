# Auditoria de Importação — Geração Automática de ID e Timestamps

## Regra de Negócio

Ao importar dados, os campos `id`, `createdAt` e `updatedAt` devem ser **opcionais** no arquivo de origem. A função de import deve **preenchê-los automaticamente** seguindo as regras:

| Campo | Regra no import |
|-------|----------------|
| `id` | `a.id \|\| crypto.randomUUID()` — preservar o valor informado se presente, gerar UUID se ausente |
| `createdAt` | **Sempre** `new Date().toISOString()` — deve refletir o momento da importação |
| `updatedAt` | **Sempre** `new Date().toISOString()` — deve refletir o momento da importação |

> **Nota:** `createdAt` e `updatedAt` em operações de import **não** preservam valores do arquivo de origem. O momento da importação é o que define estes timestamps.

---

## 1. `importAthletesFromFile` — `electron/athletes.ts:81`

```typescript
current.push({
  ...a,
  id: a.id || crypto.randomUUID(),                  // preserva se informado
  createdAt: a.createdAt || new Date().toISOString(), // ❌ preserva se informado
  updatedAt: a.updatedAt || new Date().toISOString(), // ❌ preserva se informado
})
```

| Campo | Comportamento atual | Correto? |
|-------|-------------------|----------|
| `id` | ✅ `a.id \|\| crypto.randomUUID()` | ✅ Correto |
| `createdAt` | ❌ Preserva `a.createdAt` se presente | ❌ **Deveria ser sempre `new Date().toISOString()`** |
| `updatedAt` | ❌ Preserva `a.updatedAt` se presente | ❌ **Deveria ser sempre `new Date().toISOString()`** |

**Veredito: BUG.** `createdAt` e `updatedAt` devem ser sempre o momento da importação, nunca preservados do arquivo.

---

## 2. `saveAthlete` — `electron/athletes.ts:43`

```typescript
const data: Atleta = {
  ...athlete,
  id: athlete.id || crypto.randomUUID(),
  createdAt: athlete.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
```

| Campo | Comportamento atual | Correto? |
|-------|-------------------|----------|
| `id` | ✅ Preserva se informado | ✅ |
| `createdAt` | ✅ Preserva se informado (via formulário) | ✅ (não é função de import) |
| `updatedAt` | ✅ Sempre `now` | ✅ |

**Veredito: CORRETO.** Não é função de import; é criação/edição manual. Quando o formulário envia um atleta novo (`athlete = null`), `athlete?.createdAt` é `undefined` e o timestamp atual é usado corretamente.

---

## 3. `loadAthletes` (migração na leitura) — `electron/athletes.ts:26`

```typescript
for (const a of list) {
  if (!a.id) {
    a.id = crypto.randomUUID()
    modified = true
  }
}
```

| Campo | Comportamento atual | Correto? |
|-------|-------------------|----------|
| `id` | ✅ Gera UUID se ausente | ✅ Safety net útil |
| `createdAt` | ❌ Nunca verifica | ⚠️ Poderia preencher se ausente |
| `updatedAt` | ❌ Nunca verifica | ⚠️ Poderia preencher se ausente |

**Observação:** Safety net parcial. Corrige `id` mas ignora timestamps faltantes. Recomendado estender para também preencher `createdAt`/`updatedAt` se ausentes.

---

## 4. `importArbitrosFromFile` — `electron/referees.ts:91`

```typescript
current.push({
  id: crypto.randomUUID(),      // ❌ ignora a.id do arquivo
  nome: nomeLower,
  equipe: equipeLower || '',
  faixa: a.faixa as Arbitro['faixa'],
  chaveIds: [],
  createdAt: now,                // ✅ sempre now (correto para import)
  updatedAt: now,                // ✅ sempre now (correto para import)
})
```

| Campo | Comportamento atual | Correto? |
|-------|-------------------|----------|
| `id` | ❌ **Sempre gera novo UUID** — ignora `a.id` do arquivo | ❌ **Deveria preservar se informado** (`a.id \|\| crypto.randomUUID()`) |
| `createdAt` | ✅ Sempre `now` | ✅ Correto |
| `updatedAt` | ✅ Sempre `now` | ✅ Correto |

**BUG:** O `id` do arquivo de origem é completamente ignorado. Isso quebra a integridade de referências (ex.: re-importar árbitros exportados gera novos UUIDs, perdendo vínculos com chaves). Deveria usar o mesmo padrão de `importAthletesFromFile`:

```typescript
current.push({
  ...a,
  id: (a as Arbitro).id || crypto.randomUUID(),
  nome: nomeLower,
  equipe: equipeLower || '',
  faixa: a.faixa as Arbitro['faixa'],
  chaveIds: (a as Arbitro).chaveIds ?? [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})
```

---

## 5. `saveArbitro` — `electron/referees.ts:30`

| Campo | Comportamento atual | Correto? |
|-------|-------------------|----------|
| `id` | ✅ Sempre novo UUID | ✅ (assinatura `Omit` não permite informar) |
| `createdAt` | ✅ Sempre `now` | ✅ |
| `updatedAt` | ✅ Sempre `now` | ✅ |

**Veredito: CORRETO.** Criação manual via formulário — timestamps sempre são o momento atual.

---

## 6. `import-tournament` — `electron/tournament.ts:96`

```typescript
if (!data.id || !data.data) throw new Error('...')
fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf-8')
```

| Campo | Comportamento atual | Correto? |
|-------|-------------------|----------|
| `id` | ❌ **Requerido** — lança erro se ausente | ❌ **Deveria gerar UUID se ausente** |
| `createdAt` | ❌ Salvo as-is do JSON | ❌ **Deveria ser sempre `now`** |
| `updatedAt` | ❌ Salvo as-is do JSON | ❌ **Deveria ser sempre `now`** |

**BUG:** Nenhum auto-preenchimento. O JSON é escrito diretamente no disco sem normalização. O frontend (`ImportarTorneio.tsx:46`) valida `id` e `data`, mas não timestamps. Deveria normalizar:

```typescript
const torneio: Torneio = {
  ...data,
  id: data.id || crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
fs.writeFileSync(dest, JSON.stringify(torneio, null, 2), 'utf-8');
```

---

## 7. `import-tournament-overwrite` — `electron/tournament.ts:109`

```typescript
fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf-8');
// onde dest = getTorneioPath(data.id)
```

| Campo | Comportamento atual | Correto? |
|-------|-------------------|----------|
| `id` | ❌ **Usado como nome de arquivo** — se vazio, salva como `undefined.json` | ❌ **CRÍTICO: sem validação, corrompe armazenamento** |
| `createdAt` | ❌ Salvo as-is | ❌ **Deveria ser sempre `now`** |
| `updatedAt` | ❌ Salvo as-is | ❌ **Deveria ser sempre `now`** |

**BUG CRÍTICO:** Nenhuma validação ou normalização. Se `data.id` for `undefined`, o arquivo é salvo como `undefined.json`. Deveria ter a mesma normalização que `import-tournament`.

---

## 8. `importChavesFromFile` — `electron/brackets.ts:295`

```typescript
if (!c.id || !c.categoriaId || !Array.isArray(c.lutas)) {
  throw new Error('...')
}
torneio.chaves = incoming as Chave[];
```

| Campo | Comportamento atual | Correto? |
|-------|-------------------|----------|
| `id` | ❌ **Requerido** — lança erro se `!c.id` | ❌ **Deveria gerar UUID se ausente** |
| Demais campos | ❌ Type cast bruto (`as Chave[]`), sem validação | ❌ Risco de dados inconsistentes |

**BUG:** `id` é obrigatório no arquivo em vez de auto-gerado quando ausente. Tipo `Chave` não possui campos de timestamp, mas o cast direto sem validação dos demais campos é frágil.

---

## Resumo

| Função | Arquivo:Linha | `id` | `createdAt` | `updatedAt` | Status |
|--------|---------------|------|-------------|-------------|--------|
| `importAthletesFromFile` | `athletes.ts:81` | ✅ Preserva | ❌ Preserva (devia ser `now`) | ❌ Preserva (devia ser `now`) | **BUG** |
| `saveAthlete` | `athletes.ts:43` | ✅ Preserva | ✅ Preserva (não é import) | ✅ Sempre `now` | ✅ Correto |
| `loadAthletes` (safety net) | `athletes.ts:26` | ✅ Gera | ❌ Não verifica | ❌ Não verifica | ⚠️ Parcial |
| `importArbitrosFromFile` | `referees.ts:91` | ❌ Ignora input | ✅ Sempre `now` | ✅ Sempre `now` | **BUG** (id) |
| `saveArbitro` | `referees.ts:30` | ✅ Sempre novo | ✅ Sempre `now` | ✅ Sempre `now` | ✅ Correto |
| `import-tournament` | `tournament.ts:96` | ❌ Requerido | ❌ As-is | ❌ As-is | **BUG** |
| `import-tournament-overwrite` | `tournament.ts:109` | ❌ Sem validação | ❌ As-is | ❌ As-is | **BUG CRÍTICO** |
| `importChavesFromFile` | `brackets.ts:295` | ❌ Requerido | N/A | N/A | **BUG** |

### Ações necessárias

1. **`importAthletesFromFile`** — `createdAt` e `updatedAt` devem ser sempre `new Date().toISOString()`, não preservar do arquivo.
2. **`importArbitrosFromFile`** — Aplicar spread pattern com `id: a.id || crypto.randomUUID()`. `createdAt`/`updatedAt` já estão corretos (sempre `now`).
3. **`import-tournament`** — Normalizar dados antes de salvar: gerar UUID se `id` ausente, `createdAt`/`updatedAt` sempre `now`.
4. **`import-tournament-overwrite`** — Mesma normalização do `import-tournament`. Validar `data.id` antes de usar como nome de arquivo.
5. **`importChavesFromFile`** — Gerar UUID para chaves sem `id` em vez de lançar erro.
6. **`loadAthletes`** — (Opcional) Estender safety net para preencher `createdAt`/`updatedAt` se ausentes.
