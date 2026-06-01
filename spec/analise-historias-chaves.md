# Análise — História de Usuário: Geração e Edição de Chaves

## História de Usuário

> Ao clicar em gerar chaves, eu quero que ele olhe para **todos os atletas** e gere as chaves de **no máximo 5 atletas** por chave.
> Não é para gerar chaves vazias (ex: tudo "Bye").
>
> **Editar Chave** deve mostrar:
> - Árbitro da Chave: `nome (faixa) — equipe`
> - Botão "Embaralhar" que reordena todos os atletas aleatoriamente e regenera os cruzamentos
> - Lutas da 1ª Rodada (sem "Bye" nos nomes)
> - Ordem dos Atletas (sem "Bye")
> - Aviso: "atletas da mesma equipe estão no mesmo lado da chave"
>
> **Não terá** edição manual com setas (subir/descer). A única forma de alterar a ordem é "Embaralhar".

> **Observação:** A funcionalidade de gerar chaves é **apenas organizacional** — criar os cruzamentos (quem luta contra quem). Não faz parte do escopo: controle de vencedor/perdedor, avanço de rounds, resultados, placar. Tudo que não é "organização da chave" deve ser removido.

---

## Problemas Encontrados

---

### 0. `Luta` e `Chave` carregam campos que não são de organização

**Arquivo:** `src/types/bracket.ts`

A interface `Luta` atual mistura dados organizacionais com dados de resultado/avanço:

```typescript
// ATUAL (indesejado)
export interface Luta {
  id: string;
  categoriaId: string;         // ← desnecessário (já está em Chave)
  rodada: number;               // ← desnecessário (só 1ª rodada)
  rodadaNome: RodadaNome;       // ← desnecessário
  ordem: number;
  posicaoA: number | null;      // ← desnecessário
  posicaoB: number | null;      // ← desnecessário
  atletaAId: string | null;
  atletaBId: string | null;
  vencedorId: string | null;    // ← FORA DO ESCOPO
  status: StatusLuta;           // ← FORA DO ESCOPO
  lutaAnteriorAId: string | null; // ← FORA DO ESCOPO
  lutaAnteriorBId: string | null; // ← FORA DO ESCOPO
  createdAt: string;            // ← desnecessário
  updatedAt: string;            // ← desnecessário
}
```

`Chave` também tem campos desnecessários para organização pura:

```typescript
// ATUAL
export interface Chave {
  id: string;
  categoriaId: string;
  lutas: Luta[];
  posicoesAtletas: string[];
  arbitroId: string | null;
  totalAtletas: number;
  totalRodadas: number;     // ← sempre 1
  totalLutas: number;
  status: 'gerada' | 'em_andamento' | 'finalizada';  // ← só 'gerada' importa
  createdAt: string;        // ← desnecessário
  updatedAt: string;        // ← desnecessário
}
```

**O que precisa ser corrigido (`src/types/bracket.ts`):**
- Remover `categoriaId` de `Luta` (já está em `Chave`)
- Remover `rodada`, `rodadaNome`, `posicaoA`, `posicaoB`
- Remover `vencedorId`, `status` (inteiro), `lutaAnteriorAId`, `lutaAnteriorBId`
- Remover `createdAt`, `updatedAt`
- Mudar `atletaAId` e `atletaBId` de `string | null` para `string`; bye vira o valor literal `"bye"`
- Remover tipos auxiliares: `StatusLuta`, `RodadaNome`
- Em `Chave`: remover `totalRodadas`, simplificar `status` para `'gerada'`
- Em `Chave`: remover `createdAt`, `updatedAt`
- Interface final:

```typescript
export interface Luta {
  id: string;
  ordem: number;
  atletaAId: string;   // ID do atleta ou "bye"
  atletaBId: string;   // ID do atleta ou "bye"
}

export interface Chave {
  id: string;
  categoriaId: string;
  lutas: Luta[];
  posicoesAtletas: string[];
  arbitroId: string | null;
  totalAtletas: number;
  totalLutas: number;
  status: 'gerada';
}
```

---

### 0.1. Código gera bracket completo com rounds futuros e tracking de resultado

**Arquivo:** `electron/brackets.ts` — funções `gerarLutasDois`, `gerarLutasTres`, `gerarLutasQuatro`, `gerarLutasCinco`, `gerarLutas`, `getTotalRodadas`

Atualmente geram bracket completo com semi-finais, finais e vínculos entre lutas via `lutaAnteriorAId`/`lutaAnteriorBId`.

**Comportamento desejado (apenas 1ª rodada, sem vínculos):**

| Atletas | Gera hoje | Deveria gerar |
|---|---|---|
| 2 | 1 luta com vínculos | 1 luta: pos1 vs pos2 |
| 3 | 2 lutas (semi + final) | 1 luta: pos2 vs pos3; pos1 bye |
| 4 | 3 lutas (2 semis + final) | 2 lutas: pos1 vs pos4, pos2 vs pos3 |
| 5 | 4 lutas (QF + 2 SF + final) | 1 luta: pos4 vs pos5; pos1,2,3 bye |

**O que precisa ser corrigido (`electron/brackets.ts`):**
- `gerarLutasDois` — retorna 1 luta (pos1 vs pos2), sem `lutaAnteriorAId`/`lutaAnteriorBId`
- `gerarLutasTres` — retorna 1 luta (pos2 vs pos3 apenas)
- `gerarLutasQuatro` — retorna 2 lutas (pos1 vs pos4, pos2 vs pos3)
- `gerarLutasCinco` — retorna 1 luta (pos4 vs pos5 apenas)
- `gerarLutas` — switch simplificado chamando as funções acima
- `getTotalRodadas` — remover (não existe mais no tipo)
- `criarLuta` — remover parâmetros `categoriaId`, `rodada`, `rodadaNome`, `posicaoA`, `posicaoB`, `lutaAnteriorAId`, `lutaAnteriorBId`; sempre criar `status` fixo (não usar mais `StatusLuta`)
- `gerarChave` — não chamar `getTotalRodadas`; não usar `createdAt`/`updatedAt`

---

### 0.2. Handler `gerarTodasChaves` não divide categorias grandes e sobrescreve sem confirmação

**Arquivo:** `electron/brackets.ts` — `gerarTodasChavesHandler`

Dois problemas no mesmo handler:
1. Categorias >5 atletas são ignoradas (sem split)
2. Substitui todas as chaves existentes sem confirmação

**O que precisa ser corrigido:**
- Adicionar lógica de split: se `grupo.length > 5`, dividir em sub-grupos de no máximo 5
- Cada sub-grupo vira uma `Chave` separada (com mesmo `categoriaId` mas IDs diferentes)
- Não sobrescrever chaves existentes se alguma já estiver com status diferente de `'gerada'`; comparar e avisar
- Retornar metadados sobre quantas chaves foram geradas, quantos atletas em cada

---

### 0.3. Handler `editar-chave` deve ser substituído por `randomizar-chave`

**Arquivo:** `electron/brackets.ts` — `editarChaveHandler`

A edição manual com setas (subir/descer) será removida. O único mecanismo de reordenação será "Embaralhar", que:
1. Recebe `chaveId`
2. Embaralha `posicoesAtletas` aleatoriamente
3. Re-aplica `aplicarSeedSorting` para separar equipes em lados opostos
4. Regenera as `lutas` com base na nova ordem

**O que precisa ser corrigido:**
- Remover `editarChaveHandler` e seu registro IPC (`ipcMain.handle('editar-chave', ...)`)
- Criar `randomizarChaveHandler` com a lógica de shuffle + seed sorting + regeneração

---

### 0.4. Handler `regenerar-chave` deve ser removido

**Arquivo:** `electron/brackets.ts` — handler `regenerar-chave` (linhas 445-468)

Só fazia sentido com tracking de resultado (verificava `status !== 'gerada'` para impedir regeneração). Sem resultado, não há o que proteger.

**O que precisa ser corrigido:**
- Remover `ipcMain.handle('regenerar-chave', ...)` e função associada

---

### 0.5. Handler `atualizar-luta` deve ser removido

**Arquivo:** `electron/brackets.ts` — `atualizarLutaHandler` e seu registro IPC (linhas 226-283 e 470-474)

Tracking de vencedor e status de luta — completamente fora do escopo de organização.

**O que precisa ser corrigido:**
- Remover `atualizarLutaHandler` e `ipcMain.handle('atualizar-luta', ...)`

---

### 0.6. `aplicarSeedSorting` deve ser mantido e reutilizado em `randomizar-chave`

**Arquivo:** `electron/brackets.ts` — `aplicarSeedSorting` (linhas 27-63)

Esta função já faz a separação de equipes em lados opostos. Deve ser mantida e também usada pelo novo handler `randomizar-chave`.

**O que precisa ser corrigido:**
- Nenhuma correção — função já correta
- Apenas garantir que `randomizar-chave` também a use

---

### 1. Categorias com mais de 5 atletas são ignoradas silenciosamente

**Arquivo:** `electron/brackets.ts:200-224`

Já coberto no item 0.2. O split é obrigatório.

---

### 2. Categorias com 1 atleta são ignoradas

**Arquivo:** `electron/brackets.ts:213`

**O que precisa ser corrigido:**
- Tratar `grupo.length === 1` gerando chave com única luta: `atletaAId = atleta.id`, `atletaBId = "bye"`

---

### 3. Ausência de `categoriaId` no atleta pode gerar chave inválida

**Arquivo:** `electron/brackets.ts:204-209`

**O que precisa ser corrigido:**
- Validar que todos os atletas tenham `categoria` preenchida antes de agrupar
- Ignorar atletas com categoria vazia/inválida e notificar o usuário via retorno do handler

---

### 4. Componentes `BracketTree`, `BracketCard`, `RegistrarResultadoModal` — fora do escopo

**Arquivos:**
- `src/components/BracketTree.tsx`
- `src/components/BracketCard.tsx`
- `src/components/RegistrarResultadoModal.tsx`

Esses componentes dependem de `StatusLuta`, `vencedorId`, `lutaAnteriorAId/BId`, `rodada`, `rodadaNome` — todos removidos do tipo `Luta`.

**O que precisa ser corrigido:**
- Os arquivos podem ser mantidos no repositório para uso futuro em outra feature, mas seus imports e dependências com o tipo `Luta` atual vão quebrar
- Nenhuma correção necessária agora — apenas não usar nesta feature
- **Remover** `BracketTree` do componente `GerenciarChaves` (se estiver sendo importado/ usado)

---

### 5. `EditarChaveModal` — deve ser removido

**Arquivo:** `src/components/EditarChaveModal.tsx`

Continha:
- Reordenação manual com setas (up/down) — removido
- `getFirstRoundFights` com display de "Bye:" confuso — não mais necessário
- `teamConflicts` com parsing frágil — não mais necessário
- Botão "Salvar Edição" — removido (shuffle agora é ação direta no backend)

**O que precisa ser corrigido:**
- **Remover** o arquivo `src/components/EditarChaveModal.tsx`
- **Remover** o import e uso de `EditarChaveModal` em `src/pages/GerenciarChaves.tsx`

---

### 6. `GerenciarChaves.tsx` — precisa de reformulação completa

**Arquivo:** `src/pages/GerenciarChaves.tsx`

Depende atualmente de:
- `EditarChaveModal` (removido)
- `Chave.totalRodadas`, `Chave.status` (com 3 estados) — tipos vão mudar
- `getAtletaNome` com `id: string | null` — tipo muda para `string`
- Botão "Editar Chave" que abre o modal — substituir por botão "Embaralhar"
- `handleEditarSalvar` — substituir por `handleRandomizar`

**O que precisa ser corrigido:**
- Remover import de `EditarChaveModal`
- Remover estado `editingChave`, `editModalOpen`
- Substituir `handleEditarSalvar` por `handleRandomizar(chaveId)` que chama `window.electronAPI.randomizarChave({ chaveId })`
- Substituir botão "Editar Chave" por botão "Embaralhar" que chama `handleRandomizar`
- `getAtletaNome` — parâmetro muda de `string | null` para `string`; tratar `"bye"` como caso especial (ex: retornar `""` ou `"(bye)"`)
- `getChaveTitle` — adaptar para novo tipo `Chave` (sem `totalRodadas`)
- Remover badge de `totalRodadas` no card
- Simplificar badge de status (só `'gerada'`)
- `handleGerarTodas` — adaptar ao novo retorno (pode incluir metadados de split)
- `handleGerarNovamente` — adicionar confirmação (`notifications.show` com `confirm` ou similar)

---

### 7. `electron/preload.ts` — IPC exposto precisa ser atualizado

**Arquivo:** `electron/preload.ts`

**IPC a remover:**
- `atualizarLuta` (linha 59-60)
- `regenerarChave` (linha 57-58)
- `editarChave` (linha 61-62)

**IPC a adicionar:**
- `randomizarChave: (data: { chaveId: string }) => ipcRenderer.invoke('randomizar-chave', data)`

---

### 8. `src/types/electron.d.ts` — tipos expostos no `Window.electronAPI`

**Arquivo:** `src/types/electron.d.ts`

**O que precisa ser corrigido:**
- Remover import de `StatusLuta` (linha 4) — tipo será removido
- Remover `regenerarChave` (linha 40)
- Remover `atualizarLuta` (linha 41)
- Remover `editarChave` (linha 42)
- Adicionar `randomizarChave: (data: { chaveId: string }) => Promise<Chave>`

---

### 9. `src/types/tournament.ts` — sem alterações diretas, mas verificar compatibilidade

**Arquivo:** `src/types/tournament.ts`

`Torneio.chaves` é `Chave[]`. Como `Chave` muda, o `Torneio` automaticamente referenciará o novo tipo. Nenhuma alteração manual necessária, mas é importante garantir que o JSON do torneio salvo anteriormente ainda seja legível (migração de dados).

---

### 10. `electron/main.ts` — `registerBracketHandlers` continua sendo chamado

**Arquivo:** `electron/main.ts`

Nenhuma alteração necessária aqui. `registerBracketHandlers()` continua sendo chamado — as mudanças são internas a `electron/brackets.ts`.

---

### 11. `AdminArbitros.tsx` e `ArbitroForm.tsx` — campo `chaveIds`

**Arquivos:**
- `src/pages/AdminArbitros.tsx`
- `src/components/ArbitroForm.tsx`
- `src/pages/ArbitrosMenu.tsx`

Esses arquivos usam `arbitro.chaveIds` que é atualizado pelo handler `atribuir-arbitro-chave`. Como `atribuir-arbitro-chave` permanece, esses arquivos continuam funcionando. Nenhuma alteração necessária.

---

### 12. `autoAtribuirArbitros` — deve permanecer

**Arquivo:** `electron/brackets.ts` — `autoAtribuirArbitros`

A atribuição automática de árbitros com base na faixa continua válida. Deve permanecer.

---

## Novo Formato Proposto para o JSON

### Interface `bracket.ts` final

```typescript
export interface Luta {
  id: string;
  ordem: number;
  atletaAId: string;   // ID do atleta ou "bye"
  atletaBId: string;   // ID do atleta ou "bye"
}

export interface Chave {
  id: string;
  categoriaId: string;
  lutas: Luta[];
  posicoesAtletas: string[];
  arbitroId: string | null;
  totalAtletas: number;
  totalLutas: number;
  status: 'gerada';
}
```

### Exemplos por quantidade de atletas

**2 atletas:**
```json
{
  "id": "uuid",
  "categoriaId": "adulto-masculino-pena",
  "lutas": [
    { "id": "luta1", "ordem": 1, "atletaAId": "id-atleta-1", "atletaBId": "id-atleta-2" }
  ],
  "posicoesAtletas": ["id-atleta-1", "id-atleta-2"],
  "arbitroId": null,
  "totalAtletas": 2,
  "totalLutas": 1,
  "status": "gerada"
}
```

**3 atletas:**
```json
{
  "id": "uuid",
  "categoriaId": "adulto-masculino-pena",
  "lutas": [
    { "id": "luta1", "ordem": 1, "atletaAId": "id-atleta-2", "atletaBId": "id-atleta-3" }
  ],
  "posicoesAtletas": ["id-atleta-1", "id-atleta-2", "id-atleta-3"],
  "arbitroId": null,
  "totalAtletas": 3,
  "totalLutas": 1,
  "status": "gerada"
}
```
> Atleta pos1 fica com bye (não aparece em luta alguma).

**4 atletas:**
```json
{
  "id": "uuid",
  "categoriaId": "adulto-masculino-pena",
  "lutas": [
    { "id": "luta1", "ordem": 1, "atletaAId": "id-atleta-1", "atletaBId": "id-atleta-4" },
    { "id": "luta2", "ordem": 2, "atletaAId": "id-atleta-2", "atletaBId": "id-atleta-3" }
  ],
  "posicoesAtletas": ["id-atleta-1", "id-atleta-2", "id-atleta-3", "id-atleta-4"],
  "arbitroId": null,
  "totalAtletas": 4,
  "totalLutas": 2,
  "status": "gerada"
}
```

**5 atletas:**
```json
{
  "id": "uuid",
  "categoriaId": "adulto-masculino-pena",
  "lutas": [
    { "id": "luta1", "ordem": 1, "atletaAId": "id-atleta-4", "atletaBId": "id-atleta-5" }
  ],
  "posicoesAtletas": ["id-atleta-1", "id-atleta-2", "id-atleta-3", "id-atleta-4", "id-atleta-5"],
  "arbitroId": null,
  "totalAtletas": 5,
  "totalLutas": 1,
  "status": "gerada"
}
```
> Atletas pos1, pos2, pos3 ficam com bye.

---

## Handlers IPC — estado final

### Removidos
| Handler | Arquivo | Motivo |
|---|---|---|
| `atualizar-luta` | `electron/brackets.ts` | Tracking de resultado |
| `regenerar-chave` | `electron/brackets.ts` | Dependia de tracking de status |
| `editar-chave` | `electron/brackets.ts` | Substituído por `randomizar-chave` |

### Mantidos
| Handler | Arquivo | Função |
|---|---|---|
| `gerar-todas-chaves` | `electron/brackets.ts` | Geração única de todas as chaves (agora com split) |
| `gerar-chave` | `electron/brackets.ts` | Geração individual por categoria |
| `load-chaves` | `electron/brackets.ts` | Listar chaves do torneio |
| `load-chave-por-categoria` | `electron/brackets.ts` | Buscar chave de categoria específica |
| `atribuir-arbitro-chave` | `electron/brackets.ts` | Atribuir/remover árbitro |
| `import-chaves` | `electron/brackets.ts` | Importar JSON de chaves |
| `export-chaves` | `electron/brackets.ts` | Exportar JSON de chaves |

### Adicionados
| Handler | Arquivo | Função |
|---|---|---|
| `randomizar-chave` | `electron/brackets.ts` | Embaralhar posições e regenerar lutas |

---

## Componentes — estado final

| Componente | Ação | Motivo |
|---|---|---|
| `EditarChaveModal` | **Remover** | Edição manual substituída por randomizar |
| `GerenciarChaves` | **Reformular** | Remover referências ao modal; adicionar "Embaralhar"; adaptar aos novos tipos |
| `BracketTree` | **Manter (fora de uso)** | Fora do escopo — não é usado nesta feature |
| `BracketCard` | **Manter (fora de uso)** | Fora do escopo — não é usado nesta feature |
| `RegistrarResultadoModal` | **Manter (fora de uso)** | Fora do escopo — não é usado nesta feature |

---

## Checklist completo de arquivos e mudanças

| # | Arquivo | Tipo de mudança | Descrição |
|---|---|---|---|
| 1 | `src/types/bracket.ts` | **Alterar** | Simplificar `Luta` (remover 10 campos, mudar tipo de `atletaAId`/`atletaBId` para `string` com `"bye"`); remover `StatusLuta`, `RodadaNome`; simplificar `Chave` (remover `totalRodadas`, `createdAt`, `updatedAt`, simplificar `status`) |
| 2 | `electron/brackets.ts` | **Alterar** | Reescrever `gerarLutasDois/Tres/Quatro/Cinco` para gerar só 1ª rodada sem vínculos; remover `getTotalRodadas`; simplificar `criarLuta`; adicionar split de categorias >5; tratar 1 atleta; remover handlers `editar-chave`, `regenerar-chave`, `atualizar-luta`; adicionar handler `randomizar-chave`; adicionar confirmação em `gerarTodasChaves`; validar `categoria` vazia |
| 3 | `src/components/EditarChaveModal.tsx` | **Remover** | Arquivo inteiro |
| 4 | `src/pages/GerenciarChaves.tsx` | **Alterar** | Remover import e uso de `EditarChaveModal`; remover `handleEditarSalvar`, `handleOpenEdit`; adicionar `handleRandomizar`; `getAtletaNome` tratar `string`+`"bye"`; adaptar `getChaveTitle` (sem `totalRodadas`); badge de status simplificado; botão "Editar Chave" → "Embaralhar"; adicionar confirmação em "Gerar Novamente" |
| 5 | `electron/preload.ts` | **Alterar** | Remover `atualizarLuta`, `regenerarChave`, `editarChave`; adicionar `randomizarChave` |
| 6 | `src/types/electron.d.ts` | **Alterar** | Remover import de `StatusLuta`; remover `regenerarChave`, `atualizarLuta`, `editarChave`; adicionar `randomizarChave` |
| 7 | `src/components/BracketTree.tsx` | **Nenhuma** | Fora do escopo — referências ao tipo `Luta` vão quebrar mas o arquivo não é usado na feature atual |
| 8 | `src/components/BracketCard.tsx` | **Nenhuma** | Fora do escopo — mesmo caso |
| 9 | `src/components/RegistrarResultadoModal.tsx` | **Nenhuma** | Fora do escopo — mesmo caso |
| 10 | `src/types/tournament.ts` | **Nenhuma** | Nenhuma alteração manual; `Chave` novo tipo é referenciado automaticamente |
| 11 | `electron/main.ts` | **Nenhuma** | `registerBracketHandlers()` permanece |
| 12 | `src/App.tsx` | **Nenhuma** | Rota `/admin/categorias/chaves` permanece |
| 13 | `src/pages/Dashboard.tsx` | **Nenhuma** | Card "Geração de Chaves" permanece |
| 14 | `src/pages/AdminArbitros.tsx` | **Nenhuma** | Uso de `chaveIds` permanece |
| 15 | `src/components/ArbitroForm.tsx` | **Nenhuma** | Uso de `chaveIds` permanece |
| 16 | `src/pages/ArbitrosMenu.tsx` | **Nenhuma** | Uso de `chaveIds` permanece |

---

## Resumo

A geração de chaves deve ser puramente **organizacional**:

1. **`Luta` simplificada** — `id`, `ordem`, `atletaAId`, `atletaBId`; bye = `"bye"` (string)
2. **`Chave` simplificada** — sem `totalRodadas`; `status` sempre `'gerada'`
3. **Apenas 1ª rodada** — sem rounds futuros, sem vínculos entre lutas, sem resultado
4. **Split de categorias >5** — cada chave com no máximo 5 atletas
5. **Randomizar** — único mecanismo de reordenação (substitui edição manual)
6. **Remoções**: `StatusLuta`, `RodadaNome`, `EditarChaveModal`, handlers `editar-chave`/`regenerar-chave`/`atualizar-luta`
7. **6 arquivos alterados**, **1 removido**, todo o resto permanece
