# Categorias — Configuração e Gerenciamento

## 1. Visão Geral

O módulo de **Categorias** é responsável por definir as divisões competitivas do torneio com base nos atletas cadastrados. Em um campeonato de Jiu-Jitsu, cada atleta compete dentro de uma categoria que agrupa participantes com características similares: faixa (graduação), peso, idade e sexo.

O sistema deve permitir:
- **Configuração de faixas de peso** por faixa etária e graduação
- **Classificação automática** de atletas nas categorias correspondentes
- **Visualização** de atletas por categoria
- **Ajustes manuais** (realocação de atletas entre categorias)

---

## 2. Status da Implementação

| Funcionalidade | Status |
|---|---|
| Definição de regras de categorias | ❌ Pendente |
| Classificação automática de atletas | ❌ Pendente |
| Visualização de atletas por categoria | ❌ Pendente |
| Ajuste manual de categoria | ❌ Pendente |
| Geração de chaves por categoria | ❌ Pendente (dependente) |

---

## 3. Regras de Negócio

### 3.1. Critérios de Classificação

Cada categoria é definida pela combinação de **4 critérios**:

| Critério | Tipo | Descrição |
|---|---|---|
| **Sexo** | `'masculino' \| 'feminino'` | Gênero do atleta |
| **Faixa** | Grupo de faixas | Conjunto de graduações agrupadas (ex.: "Branca/Cinza/Amarela") |
| **Peso** | Intervalo em kg | Mínimo e máximo (ex.: 0–57 kg, 57–64 kg) |
| **Idade** | Intervalo de anos | Mínimo e máximo (calculado a partir do ano de nascimento) |

### 3.2. Importância da Ordem

A resolução da categoria para um atleta segue a ordem de precedência:

1. **Sexo** — separa masculino e feminino (categorias nunca mistas)
2. **Faixa** — agrupa graduações por nível de habilidade
3. **Peso** — divisão por peso corporal
4. **Idade** — divisão por faixa etária (infantil, adulto, master, sênior)

### 3.3. Cálculo de Idade (Ano Calendário)

A IBJJF não considera o mês de nascimento, apenas o ano. A idade do atleta é calculada subtraindo o ano de nascimento do ano corrente: `idade = anoAtual - anoNascimento`.

### 3.4. Faixas Etárias (Regra IBJJF)

As faixas etárias seguem a divisão oficial da IBJJF:

| Faixa Etária | Idade | Faixas Permitidas |
|---|---|---|
| **Juvenil** | 16–17 anos | Branca, Cinza, Amarela, Laranja, Verde |
| **Adulto** | 18–29 anos | Branca, Azul, Roxa, Marrom, Preta |
| **Master 1** | 30–35 anos | Branca, Azul, Roxa, Marrom, Preta |
| **Master 2** | 36–40 anos | Branca, Azul, Roxa, Marrom, Preta |
| **Master 3** | 41–45 anos | Branca, Azul, Roxa, Marrom, Preta |
| **Master 4** | 46–50 anos | Branca, Azul, Roxa, Marrom, Preta |
| **Master 5** | 51–55 anos | Branca, Azul, Roxa, Marrom, Preta |
| **Master 6** | 56–60 anos | Branca, Azul, Roxa, Marrom, Preta |
| **Master 7** | 61+ anos | Branca, Azul, Roxa, Marrom, Preta |

> O sistema deve suportar a configuração de divisões de 5 anos para Master (Master 1 a 7), mas permitir personalização pelo organizador.

### 3.5. Categoria Absoluto (Open Weight)

A IBJJF oferece a categoria **Absoluto** (sem limite de peso), disponível a partir da faixa azul (Adulto e Masters).

- A categoria Absoluto é opcional e configurável.
- Pode ser restrita a atletas que ficaram em 1º, 2º ou 3º lugar em suas categorias de peso.
- O sistema deve permitir habilitar/desabilitar o Absoluto na configuração de categorias.
- O Absoluto é gerado como uma categoria separada com `pesoMin: null` e `pesoMax: null`, agregando todas as faixas de uma mesma graduação e faixa etária.

### 3.6. Classificação Automática

- Ao salvar ou importar um atleta, o sistema deve classificá-lo automaticamente na categoria correspondente.
- A classificação verifica todas as categorias configuradas e associa o atleta à primeira que satisfizer todos os 4 critérios.
- Se nenhuma categoria corresponder, o atleta é marcado como **"Sem categoria"** e listado separadamente para revisão manual.
- A classificação automática é executada:
  - Ao cadastrar/editar um atleta individualmente
  - Ao importar atletas em massa
  - Ao alterar as regras de categorias (reatribuição em lote)

### 3.7. Ajustes Manuais

- O administrador pode realocar manualmente um atleta de uma categoria para outra.
- A realocação manual só é permitida entre categorias que compartilhem o mesmo **sexo** e **faixa** do atleta.
- A realocação manual sobrescreve a classificação automática.
- Atletas realocados manualmente exibem um indicador visual (badge "Manual").

### 3.8. Validação de Integridade

- Um atleta não pode estar em mais de uma categoria simultaneamente.
- Ao remover ou alterar uma categoria configurada, atletas previamente classificados nela são reclassificados automaticamente.
- Se a reclassificação falhar (nenhuma categoria disponível), o atleta vai para "Sem categoria" e uma notificação é exibida.

---

## 4. Modelo de Dados

### 4.1. Extensão do Tipo Atleta (obrigatório)

O campo `sexo` deve ser **adicionado** ao modelo `Atleta`:

```typescript
// src/types/athlete.ts

export type Sexo = 'masculino' | 'feminino';

export type Faixa =
  | 'branca' | 'cinza' | 'amarela' | 'laranja' | 'verde'
  | 'azul' | 'roxa' | 'marrom' | 'preta';

export interface Atleta {
  id: string;
  nome: string;
  sexo: Sexo;                // NOVO — obrigatório
  equipe: string;
  pesoKg: number;
  faixa: Faixa;
  anoNascimento: number;
  categoriaId?: string;       // NOVO — opcional, UUID da categoria
  classificacaoManual?: boolean; // NOVO — true se realocado manualmente
  createdAt: string;
  updatedAt: string;
}
```

### 4.2. Tipo Categoria

```typescript
// src/types/category.ts

export interface Categoria {
  id: string;
  nome: string;
  sexo: Sexo;
  faixas: Faixa[];            // Lista de faixas incluídas (ex.: ['branca', 'cinza', 'amarela'])
  pesoMin: number;             // kg, inclusive
  pesoMax: number;             // kg, exclusive (categoria aberta: null)
  idadeMin: number;            // anos, inclusive
  idadeMax: number;            // anos, inclusive (categoria aberta: null)
  atletasIds: string[];        // IDs dos atletas classificados
  ordem: number;               // Ordem de exibição
  createdAt: string;
  updatedAt: string;
}
```

### 4.3. Configuração de Categorias (Regras Base)

```typescript
// src/types/category.ts

export interface ConfiguracaoCategorias {
  // Tabela de faixas de peso padrão por faixa etária e graduação
  // Pode ser personalizada pelo organizador
  categorias: Categoria[];
  // Versão para controle de alterações
  versao: number;
}
```

### 4.4. Extensão do Tipo Torneio

O campo `categorias` deve ser adicionado ao JSON do torneio:

```typescript
// src/types/tournament.ts

export interface Torneio {
  id: string;
  nome: string;
  data: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  atletas?: Atleta[];
  categorias?: Categoria[];          // NOVO
  configuracaoCategorias?: ConfiguracaoCategorias; // NOVO
}
```

### 4.5. JSON do Torneio (após implementação)

```json
{
  "id": "uuid-v4",
  "nome": "Nome do Torneio",
  "data": "2026-12-25",
  "createdAt": "2026-05-31T10:00:00.000Z",
  "updatedAt": "2026-05-31T10:00:00.000Z",
  "startedAt": "2026-06-01T08:00:00.000Z",
  "atletas": [
    {
      "id": "uuid-v4",
      "nome": "joão silva",
      "sexo": "masculino",
      "equipe": "gracie barra",
      "pesoKg": 76.5,
      "faixa": "azul",
      "anoNascimento": 1998,
      "categoriaId": "uuid-categoria",
      "classificacaoManual": false,
      "createdAt": "2026-05-31T10:00:00.000Z",
      "updatedAt": "2026-05-31T10:00:00.000Z"
    }
  ],
  "categorias": [
    {
      "id": "uuid-categoria",
      "nome": "Masculino Adulto Leve",
      "sexo": "masculino",
      "faixas": ["azul"],
      "pesoMin": 70,
      "pesoMax": 76,
      "idadeMin": 16,
      "idadeMax": 29,
      "atletasIds": ["uuid-v4"],
      "ordem": 1,
      "createdAt": "2026-05-31T10:00:00.000Z",
      "updatedAt": "2026-05-31T10:00:00.000Z"
    }
  ]
}
```

---

## 5. Fluxo de Configuração de Categorias

### 5.1. Tela de Configuração

Nova rota: `/admin/categorias/configurar`

A tela deve conter:

1. **Seletor de modelo base** — "Gerar categorias a partir de modelo padrão" com opções:
   - IBJJF (International Brazilian Jiu-Jitsu Federation)
   - Customizado (regras livres)

2. **Parâmetros de geração automática**:
   - Faixas etárias a incluir (Juvenil, Adulto, Master 1–7)
   - Divisões de peso por faixa etária (ex.: Adulto masculino: Galo 57,5kg, Pluma 64kg, Pena 70kg, Leve 76kg, Médio 82,3kg, Meio-Pesado 88,3kg, Pesado 94,3kg, Super Pesado 97,5kg, Pesadíssimo)
   - Separar por sexo (sempre ativo, categorias nunca mistas)
   - Incluir Absoluto (Open Weight) — opcional, disponível a partir da faixa azul

3. **Tabela de categorias geradas**:
   - Lista todas as categorias com colunas: Nome, Sexo, Faixas, Peso (min-max), Idade (min-max), Atletas
   - Ações por linha: Editar regra, Excluir, Visualizar atletas
   - Botão "Adicionar categoria manualmente"

4. **Botões de ação**:
   - "Salvar Configuração" — persiste as regras e reclassifica atletas
   - "Cancelar" — volta ao Dashboard

### 5.2. Geração Automática de Categorias

O algoritmo de geração deve:

1. Identificar todas as faixas etárias presentes (baseado no `anoNascimento` dos atletas)
2. Para cada faixa etária, determinar as faixas (graduações) permitidas
3. Para cada combinação sexo × faixa × faixa etária, criar divisões de peso
4. Nomear cada categoria automaticamente no formato IBJJF: `"{Sexo} {FaixaEtária} {NomeDivisão}"` (ex.: "Masculino Adulto Leve", "Feminino Adulto Galo"). Para Absoluto: `"{Sexo} {FaixaEtária} Absoluto"`.

**Tabela de Peso Padrão (IBJJF — Adulto Masculino com Kimono):**

| Categoria | Limite (kg) |
|---|---|
| **Galo** | Até 57,50 |
| **Pluma** | Até 64,00 |
| **Pena** | Até 70,00 |
| **Leve** | Até 76,00 |
| **Médio** | Até 82,30 |
| **Meio-Pesado** | Até 88,30 |
| **Pesado** | Até 94,30 |
| **Super Pesado** | Até 97,50 |
| **Pesadíssimo** | Sem limite máximo |

> ⚠️ O peso limite já inclui o peso total do kimono. Não há tolerância de gramas na balança oficial.

**Tabela de Peso Padrão (IBJJF — Adulto Feminino com Kimono):**

| Categoria | Limite (kg) |
|---|---|
| **Galo** | Até 48,50 |
| **Pluma** | Até 53,50 |
| **Pena** | Até 58,50 |
| **Leve** | Até 64,00 |
| **Médio** | Até 69,00 |
| **Meio-Pesado** | Até 74,00 |
| **Pesado** | Até 79,30 |
| **Super Pesado** | Sem limite máximo |

**Tabela de Peso Juvenil (16–17 anos, ambos os sexos):**

> A IBJJF não define tabela de peso específica para Juvenil no documento de referência. O sistema deve permitir configuração personalizada ou replicar as divisões de peso adulto com limites inferiores.

**Geração da Categoria Absoluto:**

Além das divisões de peso, o modelo IBJJF gera uma categoria **Absoluto** (Open Weight) para cada combinação de sexo × faixa etária × faixa (a partir da azul), com `pesoMin: null` e `pesoMax: null`, agregando todos os pesos em uma única categoria.

### 5.3. Fluxo de Classificação Automática

```
[Atleta salvo/importado]
    │
    ▼
Calcular idade: anoAtual - anoNascimento  (ano calendário, ignora mês)
    │
    ▼
Determinar faixa etária:
  - 16 a 17 → Juvenil
  - 18 a 29 → Adulto
  - 30 a 35 → Master 1
  - 36 a 40 → Master 2
  - 41 a 45 → Master 3
  - 46 a 50 → Master 4
  - 51 a 55 → Master 5
  - 56 a 60 → Master 6
  - 61+     → Master 7
    │
    ▼
Verificar se faixa do atleta é permitida na faixa etária
  └── Se não: marcar "Sem categoria" + notificação
    │
    ▼
Percorrer categorias configuradas filtrando:
  1. sexo === atleta.sexo
  2. atleta.faixa ∈ categoria.faixas
  3. pesoMin <= atleta.pesoKg < pesoMax
  4. idadeMin <= idadeCalculada <= idadeMax
    │
    ├── Encontrada → atribuir categoriaId
    │
    └── Não encontrada:
         ├── Se existe Absoluto (pesoMax: null) compatível → atribuir Absoluto
         └── Se não → marcar "Sem categoria"
```

### 5.4. Reclassificação em Lote

- Disparada manualmente pelo botão "Reclassificar Atletas"
- Executada automaticamente ao salvar alterações nas regras de categorias
- Percorre todos os atletas e reaplica a classificação automática
- Atletas com `classificacaoManual: true` NÃO são reclassificados (preservam ajuste manual)

---

## 6. Comunicação Main <> Renderer (IPC)

Novos canais IPC necessários:

| Canal | Direção | Descrição |
|---|---|---|
| `save-categorias` | Renderer → Main | Salva configuração de categorias no torneio ativo |
| `load-categorias` | Renderer → Main → Renderer | Carrega categorias do torneio ativo |
| `reclassificar-atletas` | Renderer → Main → Renderer | Reclassifica todos os atletas e retorna resultado |
| `realocar-atleta` | Renderer → Main → Renderer | Move atleta para outra categoria (manual) |

### 6.1. Handler `save-categorias`

```typescript
ipcMain.handle('save-categorias', (_event, data: { categorias: Categoria[] }): Torneio => {
  // 1. Carrega torneio ativo
  // 2. Substitui torneio.categorias
  // 3. Salva JSON
  // 4. Dispara reclassificação automática
  // 5. Retorna torneio atualizado
});
```

### 6.2. Handler `load-categorias`

```typescript
ipcMain.handle('load-categorias', (): Categoria[] => {
  // 1. Carrega torneio ativo
  // 2. Retorna torneio.categorias ?? []
});
```

### 6.3. Handler `reclassificar-atletas`

```typescript
ipcMain.handle('reclassificar-atletas', (): {
  classificados: number;
  semCategoria: number;
  ignorados: number; // manuais preservados
} => {
  // 1. Carrega torneio ativo
  // 2. Para cada atleta sem classificacaoManual:
  //    - Aplica algoritmo de classificação
  //    - Atualiza categoriaId
  // 3. Salva JSON
  // 4. Retorna contagem
});
```

### 6.4. Handler `realocar-atleta`

```typescript
ipcMain.handle('realocar-atleta', (_event, data: {
  atletaId: string;
  categoriaId: string | null;
}): Torneio => {
  // 1. Carrega torneio ativo
  // 2. Valida: novo categoriaId existe nas categorias configuradas
  // 3. Valida: sexo e faixa do atleta são compatíveis com a categoria destino
  // 4. Remove atleta da categoria anterior (se houver)
  // 5. Adiciona atleta na nova categoria
  // 6. Marca classificacaoManual = true
  // 7. Salva JSON
  // 8. Retorna torneio atualizado
});
```

---

## 7. Preload (Novos Métodos)

```typescript
// electron/preload.ts — adicionar ao electronAPI

contextBridge.exposeInMainWorld('electronAPI', {
  // ... métodos existentes ...

  // NOVOS
  saveCategorias: (data: { categorias: Categoria[] }) =>
    ipcRenderer.invoke('save-categorias', data),
  loadCategorias: () =>
    ipcRenderer.invoke('load-categorias'),
  reclassificarAtletas: () =>
    ipcRenderer.invoke('reclassificar-atletas'),
  realocarAtleta: (data: { atletaId: string; categoriaId: string | null }) =>
    ipcRenderer.invoke('realocar-atleta', data),
});
```

---

## 8. Rotas (Novas)

| Rota | Componente | Descrição |
|---|---|---|
| `/admin/categorias/configurar` | `ConfigurarCategorias` | Configuração de regras de categorias |
| `/admin/categorias` | `CategoriasMenu` | Menu com cards (Configurar, Visualizar) |
| `/admin/categorias/visualizar` | `VisualizarCategorias` | Lista de categorias com atletas agrupados |

### Fluxo de Navegação

```
[Dashboard /admin/dashboard]
    ├── ... (cards existentes)
    │
    └── Categorias (AGORA IMPLEMENTADO)
         └── /admin/categorias (CategoriasMenu)
              ├── Configurar Categorias → /admin/categorias/configurar
              │    └── (após salvar) → /admin/categorias/visualizar
              │
              └── Visualizar Categorias → /admin/categorias/visualizar
                   ├── Tabela de categorias com contagem de atletas
                   ├── Clique na categoria → modal com lista de atletas
                   └── Botão "Reclassificar Atletas"
```

---

## 9. Atualização do Dashboard

O card "Categorias" no Dashboard deve passar de `status: 'planned'` para `status: 'implemented'` e receber a rota `/admin/categorias`:

```typescript
// src/pages/Dashboard.tsx
{ label: 'Categorias', description: 'Configuração de categorias e divisões', icon: IconCategory, route: '/admin/categorias', status: 'implemented' },
```

---

## 10. Telas (UI)

### 10.1. CategoriasMenu (`/admin/categorias`)

Menu intermediário (padrão adotado no sistema) com 3 cards:

| Card | Descrição | Rota |
|---|---|---|
| **Configurar Categorias** | Definir regras, pesos, faixas etárias | `/admin/categorias/configurar` |
| **Visualizar Categorias** | Ver atletas agrupados por categoria | `/admin/categorias/visualizar` |
| **Reclassificar Atletas** | Reaplica classificação automática em todos | Ação inline (IPC + notificação) |

### 10.2. ConfigurarCategorias (`/admin/categorias/configurar`)

- Usa `PageLayout` com título "Configurar Categorias"
- Formulário dividido em seções:
1. **Modelo Base** — Radio: IBJJF / Customizado
2. **Faixas Etárias** — Checkboxes: Juvenil, Adulto, Master 1, Master 2, Master 3, Master 4, Master 5, Master 6, Master 7
  3. **Divisões de Peso** — Tabela editável com botão "Adicionar divisão"
  4. **Pré-visualização** — Tabela com categorias que serão geradas
- Botão "Salvar Configuração" no final
- Ao salvar: IPC `save-categorias` + reclassificação automática
- Notificação verde: "Categorias configuradas com sucesso. X atleta(s) classificado(s)."

### 10.3. VisualizarCategorias (`/admin/categorias/visualizar`)

- Usa `PageLayout` com título "Categorias"
- Loading state com `Loader` (enquanto carrega categorias)
- Empty state: "Nenhuma categoria configurada" + botão "Configurar agora" → `/admin/categorias/configurar`
- Lista/accordion de categorias agrupadas por **Faixa Etária**:
  - Cada grupo expansível com nome da faixa etária
  - Dentro, categorias com: Nome, Sexo, Peso, Qtd Atletas
- Clique em uma categoria → modal com tabela de atletas daquela categoria
- Modal da categoria:
  - Título: nome da categoria
  - Tabela: Nome, Equipe, Peso, Idade
  - Badge "Manual" ao lado de atletas com `classificacaoManual`
  - Botão "Realocar" em cada linha → abre seletor de categorias compatíveis
  - Botão "Fechar"
- Botão "Reclassificar Atletas" no topo:
  - Confirmação: "Reclassificar todos os atletas? Atletas com ajuste manual não serão alterados."
  - Após confirmação: IPC `reclassificar-atletas` + notificação

---

## 11. Componentes (Novos)

| Componente | Descrição | Local |
|---|---|---|
| `CategoriasMenu.tsx` | Menu intermediário (3 cards) | `src/pages/` |
| `ConfigurarCategorias.tsx` | Formulário de configuração | `src/pages/` |
| `VisualizarCategorias.tsx` | Lista/visualização de categorias | `src/pages/` |
| `CategoriaCard.tsx` | Card de exibição de categoria | `src/components/` |
| `CategoriaForm.tsx` | Modal de edição de regra de categoria | `src/components/` |
| `AtletasPorCategoriaModal.tsx` | Modal com tabela de atletas da categoria | `src/components/` |
| `RealocarAtletaModal.tsx` | Modal de realocação manual | `src/components/` |

---

## 12. Estrutura de Diretórios (Atualizada)

```
bjj-tournament-manager-setup/
├── electron/
│   ├── main.ts               ← + registro de handlers de categorias
│   ├── preload.ts            ← + exposição de métodos de categorias
│   ├── tournament.ts         ← (inalterado)
│   ├── athletes.ts           ← (inalterado)
│   ├── activation.ts         ← (inalterado)
│   └── categories.ts         ← NOVO — handlers IPC de categorias
│
├── src/
│   ├── main.tsx              ← (inalterado)
│   ├── App.tsx               ← + rotas de categorias
│   ├── types/
│   │   ├── tournament.ts     ← + campo categorias
│   │   ├── athlete.ts        ← + campo sexo, categoriaId, classificacaoManual
│   │   ├── category.ts       ← NOVO — interfaces Categoria, ConfiguracaoCategorias
│   │   └── electron.d.ts     ← + métodos de categorias no ElectronAPI
│   ├── pages/
│   │   ├── ... (existentes, inalterados)
│   │   ├── CategoriasMenu.tsx      ← NOVO
│   │   ├── ConfigurarCategorias.tsx ← NOVO
│   │   └── VisualizarCategorias.tsx ← NOVO
│   └── components/
│       ├── ... (existentes, inalterados)
│       ├── CategoriaCard.tsx              ← NOVO
│       ├── CategoriaForm.tsx              ← NOVO
│       ├── AtletasPorCategoriaModal.tsx   ← NOVO
│       └── RealocarAtletaModal.tsx        ← NOVO
│
├── doc/
│   ├── requisitos.md         ← atualizado
│   └── categorias-configuracao.md ← este documento
```

---

## 13. Arquivos Afetados (Modificações em Arquivos Existentes)

| Arquivo | Tipo de Alteração |
|---|---|
| `src/types/athlete.ts` | + campos `sexo`, `categoriaId`, `classificacaoManual` |
| `src/types/tournament.ts` | + campos `categorias`, `configuracaoCategorias` |
| `src/types/electron.d.ts` | + métodos `saveCategorias`, `loadCategorias`, `reclassificarAtletas`, `realocarAtleta` |
| `src/types/category.ts` | **NOVO** |
| `src/pages/Dashboard.tsx` | Card "Categorias": `status: 'implemented'`, `route: '/admin/categorias'` |
| `src/App.tsx` | + rotas `/admin/categorias`, `/admin/categorias/configurar`, `/admin/categorias/visualizar` |
| `electron/main.ts` | + import e registro de `registerCategoryHandlers()` |
| `electron/preload.ts` | + exposição dos 4 novos métodos IPC |
| `doc/requisitos.md` | Atualizar status de Categorias para Implementado |

---

## 14. Arquivos Novos

| Arquivo | Descrição |
|---|---|
| `electron/categories.ts` | Handlers IPC: `save-categorias`, `load-categorias`, `reclassificar-atletas`, `realocar-atleta` |
| `src/types/category.ts` | Interfaces `Categoria`, `ConfiguracaoCategorias` |
| `src/pages/CategoriasMenu.tsx` | Menu intermediário com 3 cards |
| `src/pages/ConfigurarCategorias.tsx` | Formulário de configuração de regras |
| `src/pages/VisualizarCategorias.tsx` | Visualização de categorias com atletas |
| `src/components/CategoriaCard.tsx` | Card individual de categoria |
| `src/components/CategoriaForm.tsx` | Modal de edição de regra |
| `src/components/AtletasPorCategoriaModal.tsx` | Modal de listagem de atletas por categoria |
| `src/components/RealocarAtletaModal.tsx` | Modal de realocação manual |

---

## 15. Plano de Implementação (Ordem Sugerida)

| Fase | Tarefa | Dependências |
|---|---|---|
| **1** | Criar `src/types/category.ts` | Nenhuma |
| **2** | Estender `src/types/athlete.ts` (adicionar `sexo`, `categoriaId`, `classificacaoManual`) | Nenhuma |
| **3** | Estender `src/types/tournament.ts` (adicionar `categorias`) | Fase 1 |
| **4** | Criar `electron/categories.ts` (handlers IPC) | Fases 1–3 |
| **5** | Estender `electron/main.ts` (registrar handlers) | Fase 4 |
| **6** | Estender `electron/preload.ts` (expor métodos) | Fase 4 |
| **7** | Estender `src/types/electron.d.ts` (tipos dos novos métodos) | Fase 4 |
| **8** | Criar `src/pages/CategoriasMenu.tsx` | Nenhuma |
| **9** | Criar `src/pages/ConfigurarCategorias.tsx` | Fases 1–3 |
| **10** | Criar `src/pages/VisualizarCategorias.tsx` | Fase 4 |
| **11** | Criar componentes: `CategoriaCard`, `CategoriaForm`, `AtletasPorCategoriaModal`, `RealocarAtletaModal` | Fases 1–3 |
| **12** | Atualizar `src/App.tsx` (rotas) | Fases 8–10 |
| **13** | Atualizar `src/pages/Dashboard.tsx` (card Categorias ativo) | Fase 12 |
| **14** | Atualizar formulário de atleta (`AthleteForm.tsx`) para incluir campo `sexo` | Fase 2 |
| **15** | Atualizar `doc/requisitos.md` | Fase 14 |

> **Nota:** A Fase 2 (adição do campo `sexo` ao `Atleta`) é crítica e afeta todo o módulo de categorias, pois a separação por sexo é o primeiro critério de classificação. O campo `sexo` deve ser obrigatório no cadastro do atleta.

---

## 16. Regras de Validação (Novas)

### 16.1. AthleteForm — Campo Sexo

| Campo | Regra | Mensagem |
|---|---|---|
| **Sexo** | Obrigatório, deve ser `masculino` ou `feminino` | "Selecione o sexo do atleta" |

### 16.2. ConfigurarCategorias

| Regra | Mensagem |
|---|---|
| Pelo menos uma faixa etária deve ser selecionada | "Selecione ao menos uma faixa etária" |
| Cada divisão de peso deve ter `pesoMin < pesoMax` (exceto Aberto/Absoluto) | "Peso mínimo deve ser menor que o máximo" |
| Divisões de peso não podem se sobrepor na mesma faixa etária/sexo | "Divisões de peso não podem se sobrepor" |
| `idadeMin <= idadeMax` | "Idade mínima deve ser menor ou igual à máxima" |
| Limites de peso devem usar uma casa decimal (ex.: 57,5) para compatibilidade IBJJF | "Use uma casa decimal para os limites de peso (ex.: 57,5)" |

---

## 17. Notificações

| Evento | Tipo | Mensagem |
|---|---|---|
| Categorias configuradas | Sucesso (verde) | "Categorias configuradas com sucesso. X atleta(s) classificado(s)." |
| Reclassificação concluída | Sucesso (verde) | "Reclassificação concluída: X classificado(s), Y sem categoria, Z ignorado(s)." |
| Atleta realocado | Sucesso (verde) | "Atleta realocado para {nome da categoria}." |
| Atleta sem categoria | Alerta (amarelo) | "Atleta {nome} não se enquadra em nenhuma categoria existente." |
| Erro ao salvar categorias | Erro (vermelho) | "Erro ao salvar configuração de categorias." |
| Erro ao reclassificar | Erro (vermelho) | "Erro ao reclassificar atletas." |

---

## 18. Casos de Borda

1. **Torneio sem atletas:** Configurar categorias com 0 atletas é válido. A classificação será aplicada quando atletas forem cadastrados.
2. **Torneio sem categorias configuradas:** Todos os atletas ficam como "Sem categoria". O card do Dashboard deve redirecionar para configuração.
3. **Atleta com peso acima do limite máximo de todas as categorias:** Vai para "Sem categoria" a menos que exista uma categoria "Absoluto" (pesoMax = null). O Absoluto é gerado automaticamente no modelo IBJJF a partir da faixa azul.
4. **Atleta muito jovem (abaixo de 16 anos):** Não é válido para competição IBJJF (categoria Juvenil inicia aos 16 anos). Marcar como "Sem categoria" e exibir alerta.
5. **Atleta sem sexo definido (dados legados):** Ao carregar atletas existentes sem o campo `sexo`, o sistema deve exibir notificação para complementar o cadastro.
6. **Categoria sem atletas:** Deve ser exibida normalmente na lista com contagem 0, para permitir que atletas sejam posteriormente classificados nela.
7. **Exclusão de categoria com atletas:** Atletas são reclassificados automaticamente. Se falharem, vão para "Sem categoria".
8. **Importação de atletas com sexo:** Se o JSON importado incluir `sexo`, o campo é preservado. Caso contrário, o atleta é importado mas fica como "Sem categoria" até que o sexo seja definido manualmente.
