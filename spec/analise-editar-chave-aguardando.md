# Análise: "Aguardando..." ao Editar Chave

## Problema Reportado

Ao clicar em "Editar Chave", o modal exibe "Aguardando..." em vez de mostrar as
lutas no formato esperado, como:

```
atleta1 x atleta2
atleta3 x bye
```

---

## Causas Raiz

### 1. Modal não exibe as lutas (`lutas`)

O componente `EditarChaveModal` (`src/components/EditarChaveModal.tsx`) exibe
apenas a **lista ordenável de posições dos atletas** (campo `posicoesAtletas`).
Ele ignora completamente o campo `lutas` presente no objeto `Chave`.

| O que mostra | O que deveria mostrar |
|---|---|
| Lista plana: `1. Atleta1 [↑][↓]`, `2. Atleta2 [↑][↓]`, ... | Lutas da 1ª rodada: `Atleta1 x Atleta4`, `Atleta2 x Atleta3` |

O modal foi construído apenas como ferramenta de **reordenação de posições**,
sem nenhuma visualização das lutas da primeira rodada. O usuário não consegue
ver quem enfrenta quem.

### 2. `getAtletaNome(null)` retorna "Aguardando..."

A função `getAtletaNome` em `src/pages/GerenciarChaves.tsx:86`:

```typescript
const getAtletaNome = (id: string | null): string => {
    if (!id) return 'Aguardando...';
```

Chamadas com `null` retornam literalmente `"Aguardando..."`. Isso ocorre nos
slots de luta que representam **byes** (posições vazias na chave). Por exemplo,
numa chave de 3 atletas, a `Luta 2` (Final) tem `atletaBId = null` porque o
atleta da posição 1 avança direto da semifinal com bye.

O componente `BracketCard` (`src/components/BracketCard.tsx:42,46`) também
possui a mesma lógica: `{atletaBNome || 'Aguardando...'}`.

### 3. `useMemo` com side effect causa estado inconsistente

Em `EditarChaveModal.tsx:33-37`:

```typescript
useMemo(() => {
    if (chave) {
      setPosicoes([...chave.posicoesAtletas]);
    }
}, [chave]);
```

`useMemo` é usado para **executar um side effect** (chamar `setPosicoes`), o que
é uma prática contra as recomendações do React. Consequências:

- Na primeira renderização ao abrir o modal, `posicoes` ainda está com o valor
  anterior (array vazio `[]` ou dados da chave anterior).
- A chamada `setPosicoes` agenda um novo re-render, mas o render atual exibe
  dados incorretos ou nada.
- A troca entre chaves diferentes pode mostrar atletas da chave anterior por um
  frame antes de atualizar.

Isso é uma **race condition visual** que pode contribuir para o usuário ver
"Aguardando..." (se o array `posicoes` estiver vazio e nada for renderizado, ou
se estiver parcialmente populado com atletas que não pertencem à chave atual).

### 4. Dados de luta (`lutas`) ignorados no modal

O objeto `Chave` contém:

```typescript
export interface Chave {
  id: string;
  categoriaId: string;
  lutas: Luta[];           // ← contém as lutas com atletaAId, atletaBId, rodada, etc.
  posicoesAtletas: string[];  // ← apenas IDs dos atletas em ordem
  arbitroId: string | null;
  totalAtletas: number;
  totalRodadas: number;
  totalLutas: number;
  status: 'gerada' | 'em_andamento' | 'finalizada';
  createdAt: string;
  updatedAt: string;
}
```

O modal usa apenas `chave.posicoesAtletas` para exibir a lista de atletas. As
informações de **quem luta contra quem em cada rodada** (presentes em
`chave.lutas`) nunca são acessadas.

### 5. `BracketTree` e `BracketCard` criados mas não integrados

Os componentes `BracketTree` e `BracketCard` foram implementados com a
visualização de lutas por rodada (incluindo conexões entre lutas), porém:

- `BracketTree` não é importado nem renderizado em nenhum lugar.
- `BracketCard` não é usado em lugar nenhum.
- `RegistrarResultadoModal` também não está integrado ao fluxo.

Veja a seção 11 da spec (`spec/geracao-chaves.md`): estes componentes estão
marcados como "Criado, não integrado".

---

## Fluxo Atual vs. Esperado

### Fluxo Atual

```
Clique "Editar Chave"
  → handleOpenEdit(chave)
    → setEditingChave(chave)
    → setEditModalOpen(true)
      → EditarChaveModal renderiza
        → useMemo → setPosicoes([...chave.posicoesAtletas])
        → Renderiza lista de atletas (posições 1..N)
        → Cada atleta: getAtletaNome(atletaId)
        → Se atleta válido: "Nome (Equipe)"
        → Se atletaId null/undefined: "Aguardando..."
```

### Fluxo Esperado

```
Clique "Editar Chave"
  → Modal mostra apenas as lutas da **primeira rodada**
    → 2 atletas: `Atleta1 x Atleta2`
    → 3 atletas: `Atleta2 x Atleta3` (posição 1 com bye)
    → 4 atletas: `Atleta1 x Atleta4`, `Atleta2 x Atleta3`
    → 5 atletas: `Atleta4 x Atleta5` (posições 1, 2, 3 com bye)
  → Slots null (bye) exibidos como "Bye" ou "Livre"
  → Reordenação de posições atualiza as lutas da primeira rodada em tempo real
```

---

## Pontos de Correção Necessários

### A. `EditarChaveModal.tsx`

1. **Substituir `useMemo` por `useEffect`** para inicializar o estado `posicoes`
   sempre que `chave` mudar.

2. **Adicionar visualização das lutas da primeira rodada** no modal. Pode ser:
   - Integrar `BracketTree` configurado para filtrar `rodada === 1`.
   - Ou exibir as lutas em formato simplificado (lista de `atletaA x atletaB`).

3. **Mapear `lutas` para exibição**: filtrar `lutas` onde `rodada === 1` e
   mostrar cada luta como `atletaAId x atletaBId` com nomes resolvidos via
   `getAtletaNome`.

### B. `GerenciarChaves.tsx` — `getAtletaNome`

A função `getAtletaNome` trata `null` com `"Aguardando..."`, mas esse texto
não é semântico para o contexto de lutas:

| Contexto | Sugestão |
|---|---|
| Atleta não definido (bye) | `"Bye"` ou `"Livre"` |
| Atleta removido do torneio | `"Atleta removido"` (já implementado) |
| Aguardando resultado de luta anterior | `"Aguardando..."` (válido apenas para o slot que depende de luta anterior) |

Sugere-se separar a lógica:

```typescript
function getAtletaNome(id: string | null): string {
    if (!id) return 'Bye';
    const atleta = athletes.find(a => a.id === id);
    if (!atleta) return 'Atleta removido';
    // ...
}
```

### C. Integrar componentes existentes

- `BracketTree` + `BracketCard` + `RegistrarResultadoModal` já estão prontos.
- Faltam ser integrados ao `GerenciarChaves` ou ao `EditarChaveModal`.

---

## Cenários de "Aguardando..." no Código

| Local | Linha | Condição | Texto exibido |
|---|---|---|---|
| `getAtletaNome` | `GerenciarChaves.tsx:86` | `id === null` | `"Aguardando..."` |
| `BracketCard` | `BracketCard.tsx:42` | `atletaANome` é falsy | `"Aguardando..."` |
| `BracketCard` | `BracketCard.tsx:46` | `atletaBNome` é falsy | `"Aguardando..."` |

Os casos do `BracketCard` não afetam o bug atual (não está integrado), mas
devem ser corrigidos preventivamente.

---

## Arquivos Afetados para Correção

### Modificações Obrigatórias

| Arquivo | O que precisa mudar |
|---|---|
| `src/components/EditarChaveModal.tsx` | **(1)** Substituir `useMemo` com `setPosicoes` por `useEffect`. **(2)** Adicionar exibição das **lutas apenas da primeira rodada** (filtrar `lutas` onde `rodada === 1`). **(3)** Exibir cada luta no formato `atletaA x atletaB`, resolvendo nomes via `getAtletaNome`. **(4)** Slots `null` (byes) devem mostrar "Bye" ou "Livre", não "Aguardando...". |
| `src/pages/GerenciarChaves.tsx` | **(1)** Alterar `getAtletaNome` para retornar `"Bye"` em vez de `"Aguardando..."` quando `id === null`. |
| `src/components/BracketCard.tsx` | **(1)** Alterar fallbacks `'Aguardando...'` para `'Bye'` nas linhas 42 e 46. **(2)** Se integrado ao fluxo de edição, adicionar `onClick` compatível com o modal de resultado. |
| `src/components/BracketTree.tsx` | **(1)** Se utilizado, deve ser configurado para exibir **apenas a primeira rodada** (`roundLabels` e filtragem). **(2)** Ajustar `onLutaClick` para funcionar dentro do modal. |

### Modificações Opcionais (dependem da estratégia de correção)

| Arquivo | Quando modificar |
|---|---|
| `src/components/RegistrarResultadoModal.tsx` | Se a visualização de lutas no modal de edição incluir registro de resultado. |
| `spec/geracao-chaves.md` | Se a UI do modal de edição for alterada significativamente, a seção 10.1.3 deve ser atualizada. |
| `src/types/electron.d.ts` | Se novos métodos IPC forem necessários (ex: buscar lutas atualizadas em tempo real). |

### Nenhuma Alteração Necessária

| Arquivo | Motivo |
|---|---|
| `electron/brackets.ts` | Handlers IPC já retornam `Chave` completa com `lutas` e `posicoesAtletas` — o backend não precisa de mudanças. |
| `src/types/bracket.ts` | Tipos `Chave` e `Luta` já contêm todos os campos necessários. |
| `src/App.tsx` | Rota já está registrada. |
| `electron/main.ts` | Handlers já registrados. |
| `electron/preload.ts` | Métodos IPC já expostos. |

---

## Conclusão

A causa raiz é que o `EditarChaveModal` foi construído apenas para reordenação
de posições e **não exibe as lutas**. O usuário espera ver as lutas no formato
`atletaA x atletaB` (incluindo byes como "Livre"), mas o modal mostra apenas
uma lista plana de atletas. O texto "Aguardando..." aparece onde há slots
`null` (byes) ou devido ao uso incorreto de `useMemo` para side effects, que
pode deixar o estado `posicoes` vazio ou inconsistente durante a transição
entre chaves.
