# Análise: Chaves Geradas com 0 Atletas

## Problema Reportado

O sistema gera chaves com 0 lutadores, quando deveria usar a lista de atletas
cadastrados para popular as chaves.

---

## Causa Raiz

### 1. Atletas importados sem `id`

**Arquivo:** `electron/athletes.ts:86-105` — função `importAthletesFromFile`

```typescript
for (const a of incoming) {
    const nomeLower = a.nome.trim().toLowerCase();
    const equipeLower = a.equipe.trim().toLowerCase();
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
```

O `spread` de `a` inclui todos os campos originais do atleta. Se o JSON
importado **não** tiver o campo `id` (comum em exportações de terceiros), o
atleta é salvo **sem `id`**. O valor `undefined` de `a.id` é propagado para
`current.push({ ...a, ... })` e, como `JSON.stringify` omite campos
`undefined`, o arquivo JSON do torneio fica com atletas sem o campo `id`.

### 2. Geração de chaves com IDs `null`

**Arquivo:** `electron/brackets.ts:157` — função `gerarChave`

```typescript
posicoesAtletas: posicoes.map(a => a.id),
```

Se `a.id` é `undefined` (atleta importado sem ID), o array `posicoesAtletas`
contém `[undefined, undefined, ...]`. Durante a serialização com
`JSON.stringify`, `undefined` em array é convertido para `null`, resultando
no JSON:

```json
"posicoesAtletas": [null, null, null]
```

### 3. UI não consegue resolver os IDs

**Arquivo:** `src/pages/GerenciarChaves.tsx:36-38` — função `getChaveTitle`

```typescript
const chaveAtletas = chave.posicoesAtletas
    .map(id => athletes.find(a => a.id === id))
    .filter((a): a is Atleta => a !== undefined);
```

O `id` do `posicoesAtletas` é `null`, mas os atletas carregados têm
`a.id === undefined` (ou um UUID string válido). A busca
`athletes.find(a => a.id === null)` nunca encontra correspondência. O
resultado `chaveAtletas` é um array vazio, e o card exibe apenas o nome
da categoria (sem a contagem de atletas).

---

## Fluxo do Bug

```
Usuário importa JSON de atletas
  → atletas salvos sem campo `id`
  → JSON do torneio: "atletas": [{"nome":"joão", ...}]  // sem "id"

Usuário clica "Gerar Chaves"
  → gerarChave() cria posicoesAtletas: [undefined, undefined, ...]
  → JSON.stringify converte undefined → null no array
  → JSON do torneio: "posicoesAtletas": [null, null, null]

Frontend carrega chaves
  → getChaveTitle busca athletes.find(a => a.id === null)
  → Nenhum atleta encontrado (atleta.id é undefined, não null)
  → chaveAtletas = []
  → Card exibe título sem "N atleta(s)"
```

---

## Arquivos Afetados

| Arquivo | O que precisa mudar |
|---|---|
| `electron/athletes.ts:97` | Gerar `crypto.randomUUID()` para atletas importados sem `id`: `current.push({ ...a, id: a.id \|\| crypto.randomUUID(), ... })` |
| `electron/brackets.ts:157` | Opcional: validar que `a.id` não é `undefined` antes de incluir em `posicoesAtletas` |

## Cenário Alternativo (Atletas Criados Manualmente)

Atletas cadastrados manualmente via `AthleteForm.tsx` geram `id` via
`crypto.randomUUID()` (linha 158) e NÃO são afetados por este bug.
Apenas atletas **importados** (via `importAthletesFromFile`) estão
sujeitos à falta de `id`.
