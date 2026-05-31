# Cadastro de Atletas

## 1. Objetivo

Permitir o cadastro individual de atletas no torneio, contemplando os dados pessoais e de categorização necessários para inscrição em chaves e divisões por peso, faixa etária e graduação.

---

## 2. Stack Tecnológico

- **Framework:** React + TypeScript
- **Componentes:** Mantine UI (`TextInput`, `Select`, `NumberInput`, `Button`, `Card`, `Table`, `Modal`, `Notifications`)
- **Ícones:** Tabler Icons
- **Formulário:** `@mantine/form` com validação
- **Persistência:** Arquivo JSON local gerenciado via Electron IPC (`fs`)

---

## 3. Dados do Atleta

### 3.1. Campos

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| **Nome** | `string` | Sim | Nome completo do atleta |
| **Equipe** | `string` | Sim | Nome da equipe / academia |
| **Peso (kg)** | `number` | Sim | Peso em quilogramas (ex.: 72.5) |
| **Faixa** | `enum` | Sim | Graduação no Jiu-Jitsu (vide seção 3.2) |
| **Ano de nascimento** | `number` | Sim | Ano de nascimento (ex.: 1998) |

### 3.2. Faixas (Graduações)

As faixas seguem o sistema de graduação infantil ao adulto:

| Categoria | Faixas |
|---|---|
| **Infantil (4–15 anos)** | Branca, Cinza, Amarela, Laranja, Verde |
| **Adulto (16+ anos)** | Branca, Azul, Roxa, Marrom, Preta |

### 3.3. Estrutura do JSON (`atletas.json`)

```typescript
// Electron (main process) gerencia o arquivo em app.getPath('userData')
// Caminho: {userData}/data/atletas.json

interface Atleta {
  id: string;            // UUID v4 único
  nome: string;
  equipe: string;
  pesoKg: number;
  faixa: Faixa;
  anoNascimento: number;
  createdAt: string;     // ISO 8601
  updatedAt: string;     // ISO 8601
}

type Faixa =
  // Infantil
  | 'branca'
  | 'cinza'
  | 'amarela'
  | 'laranja'
  | 'verde'
  // Adulto
  | 'azul'
  | 'roxa'
  | 'marrom'
  | 'preta';
```

Exemplo do arquivo:

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nome": "João Silva",
    "equipe": "Gracie Barra",
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

```
+----------------------------------------------------+
|  ← Voltar                          + Novo Atleta  |
|                                                    |
|  ┌────────────────────────────────────────────┐   |
|  │  Cadastro de Atletas                       │   |
|  └────────────────────────────────────────────┘   |
|                                                    |
|  ┌────────────────────────────────────────────┐   |
|  │  Lista de Atletas                          │   |
|  │                                            │   |
|  │  Nome          Equipe      Faixa   Idade   │   |
|  │  ────────────────────────────────────────  │   |
|  │  João Silva    Gracie Barra  Azul   28     │   |
|  │  Maria Santos  Alliance     Branca 25      │   |
|  │  ...                                       │   |
|  └────────────────────────────────────────────┘   |
+----------------------------------------------------+
```

### 4.1. Componentes da Tela

1. **Top bar:** Botão "Voltar" à esquerda, botão "+ Novo Atleta" à direita.
2. **Título da seção:** "Cadastro de Atletas".
3. **Tabela de atletas:** Lista com colunas Nome, Equipe, Faixa, Idade calculada, e ações (editar / excluir).
4. **Modal de cadastro/edição:** Formulário com os campos descritos na seção 3.

### 4.2. Modal de Cadastro / Edição

```
┌──────────────────────────────────┐
│  {Novo Atleta / Editar Atleta}   │
├──────────────────────────────────┤
│                                  │
│  Nome *                          │
│  [____________________________]  │
│                                  │
│  Equipe *                        │
│  [____________________________]  │
│                                  │
│  Peso (kg) *                     │
│  [____________________________]  │
│                                  │
│  Faixa *                         │
│  [Branca  ▼]                     │
│                                  │
│  Ano de Nascimento *             │
│  [____________________________]  │
│                                  │
│        [Cancelar]  [Salvar]      │
└──────────────────────────────────┘
```

---

## 5. Comportamento

### 5.1. Listagem

- Ao entrar na tela, carregar a lista de atletas do arquivo JSON via IPC (`load-athletes`).
- Exibir idade calculada com base no ano de nascimento (`new Date().getFullYear() - anoNascimento`).
- Se não houver atletas, exibir *empty state* com mensagem "Nenhum atleta cadastrado" e botão para criar o primeiro.

### 5.2. Cadastro

- Clique em "+ Novo Atleta" abre Modal em modo criação.
- Preenchimento dos campos com validação em tempo real.
- Ao "Salvar":
  - Gerar `id` (UUID v4).
  - Definir `createdAt` e `updatedAt` como ISO string do momento.
  - Enviar ao main process via IPC (`save-athlete`).
  - Main process lê o JSON atual, adiciona o novo registro, salva.
  - Notificação de sucesso (verde).
  - Fechar modal e atualizar a listagem.

### 5.3. Edição

- Clique no ícone de editar na tabela abre Modal preenchido com os dados do atleta.
- Ao "Salvar", atualizar `updatedAt` e persistir via IPC (`update-athlete`).

### 5.4. Exclusão

- Clique no ícone de excluir abre confirmação ("Deseja realmente excluir este atleta?").
- Confirmado, remove do JSON via IPC (`delete-athlete`).
- Notificação de sucesso e atualização da lista.

### 5.5. Cálculo da Idade

```typescript
function calcularIdade(anoNascimento: number): number {
  return new Date().getFullYear() - anoNascimento;
}
```

A idade é exibida na listagem mas não é persistida — é sempre calculada a partir do ano de nascimento.

---

## 6. Validações

| Campo | Regra | Mensagem de erro |
|---|---|---|
| **Nome** | Mínimo 2 caracteres | "Nome deve ter ao menos 2 caracteres" |
| **Equipe** | Mínimo 2 caracteres | "Equipe deve ter ao menos 2 caracteres" |
| **Peso** | Número positivo, máximo 300 kg | "Peso deve estar entre 1 e 300 kg" |
| **Faixa** | Deve ser uma faixa válida do enum | "Selecione uma faixa válida" |
| **Ano de nascimento** | Número inteiro entre 1920 e ano atual | "Ano deve estar entre 1920 e {anoAtual}" |

A validação ocorre:
- Em tempo real (ao digitar/perder o foco), exibindo erro abaixo do campo.
- No submit: se houver erro, foca o primeiro campo inválido.

---

## 7. Comunicação Main <> Renderer (IPC)

| Canal | Direção | Descrição |
|---|---|---|
| `load-athletes` | Renderer → Main → Renderer | Retorna array de atletas do JSON |
| `save-athlete` | Renderer → Main | Adiciona novo atleta ao JSON |
| `update-athlete` | Renderer → Main | Substitui atleta existente (match por `id`) |
| `delete-athlete` | Renderer → Main | Remove atleta do JSON pelo `id` |

### Fluxo de Persistência (Main Process)

```typescript
// electron/athletes.ts (rascunho conceitual)
const DATA_DIR = path.join(app.getPath('userData'), 'data')
const FILE = path.join(DATA_DIR, 'atletas.json')

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

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
  if (index === -1) throw new Error('Atleta não encontrado')
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
```

---

## 8. Estrutura de Arquivos (Implementação)

```
electron/
  main.ts              ← Registro dos handlers IPC
  preload.ts           ← Exposição dos canais IPC
  athletes.ts          ← Lógica CRUD do JSON

src/
  pages/
    AdminAthletes.tsx  ← Tela de gerenciamento de atletas
  components/
    AthleteForm.tsx    ← Modal de cadastro/edição
    AthleteTable.tsx   ← Tabela de listagem
  types/
    athlete.ts         ← Interfaces TypeScript (Atleta, Faixa)
```

---

## 9. Estados da Tela

| Estado | Descrição |
|---|---|
| **Carregamento** | Spinner centralizado enquanto carrega a lista via IPC |
| **Vazia** | "Nenhum atleta cadastrado" + botão "Cadastrar primeiro atleta" |
| **Normal** | Tabela com atletas listados |
| **Modal criação** | Modal aberto em modo inserção |
| **Modal edição** | Modal aberto com dados preenchidos |
| **Erro ao carregar** | Mensagem de erro + botão "Tentar novamente" |
| **Erro ao salvar** | Notificação de erro com descrição |

---

## 10. Observações

- A idade não é armazenada no JSON, apenas o ano de nascimento, para evitar dados obsoletos.
- As faixas infantis (cinza, amarela, laranja, verde) e adultas (azul, roxa, marrom, preta) são separadas visualmente no Select por categoria.
- O campo Equipe pode futuramente se tornar um Select com equipes pré-cadastradas; por enquanto é texto livre.
- Toda operação é offline, sem dependência de API externa.
