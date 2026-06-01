# BJJ Tournament Manager

## 1. Visão Geral

O **BJJ Tournament Manager** é um software desktop desenvolvido para gerenciamento completo de campeonatos de Jiu-Jitsu.

O sistema é responsável por controlar todas as etapas do evento, desde o cadastro dos participantes até a definição dos campeões de cada categoria, incluindo gerenciamento de chaves, acompanhamento de lutas em tempo real, placares, árbitros, áreas de luta e resultados.

O objetivo é fornecer uma solução centralizada para organizadores, árbitros e equipes, reduzindo erros operacionais e agilizando a condução dos campeonatos.

---

## 2. Status da Implementação

### 2.1. Implementado (MVP)

| Módulo | Status | Observação |
|---|---|---|
| Menu Inicial | ✅ Completo | Tela com 3 cartões (Criar, Importar, Listar) + teclas 1/2/3 |
| Criar Torneio | ✅ Completo | Formulário com nome (opcional), data (futura), validação, IPC |
| Importar Torneio | ✅ Completo | Upload JSON, validação de estrutura, modal de sobrescrita |
| Listar Torneios | ✅ Completo | Tabela com Iniciar/Exportar/Excluir; registro de startedAt no Play |
| Gerenciamento de Torneios (IPC) | ✅ Completo | CRUD completo no main process (`electron/tournament.ts`) |
| Tema Mantine UI | ✅ Completo | Tema azul royal (#1565C0), fonte Inter, componentes responsivos com `clamp()` |
| Cadastro de Atletas | ✅ Completo | Menu com 3 cartões (Cadastrar, Listar, Importar); CRUD com modal controlado, validação em tempo real, tabela, duplicata, normalização de texto, IPC. Atletas armazenados por torneio (dentro do JSON do torneio). |
| Importação em Massa de Atletas | ✅ Completo | Diálogo nativo, validação fail-fast, deduplicação por ID e nome+ano, mesclagem com lista existente |
| Dashboard Administrativo | ✅ Completo | Tela com cards em grid (1-4 colunas responsivas), funcionalidades implementadas × planejadas |
| Tela de Ativação | ✅ Completo | Componente que bloqueia o acesso até ativação; senha SHA-256, token HMAC por hardware |
| Error Boundary | ✅ Completo | Componente classe que captura erros de renderização e exibe fallback com "Tentar novamente" |
| PageLayout | ✅ Completo | Layout padrão com Container, Paper, título e botão de voltar |

### 2.2. Não Implementado (Planejado)

| Módulo | Status |
|---|---|
| Cadastro de Equipes | ❌ Pendente |
| Cadastro de Categorias | ❌ Pendente |
| Controle de Inscrições | ❌ Pendente |
| Controle de Pesagem | ❌ Pendente |
| Geração de Chaves | ❌ Pendente |
| Áreas de Luta | ❌ Pendente |
| Árbitros | ❌ Pendente |
| Chamadas / Placar / Resultados | ❌ Pendente |
| Ranking / Medalhistas | ❌ Pendente |
| Relatórios | ❌ Pendente |

---

## 3. Regras de Negócio

### 3.1. Torneio

- **Entidade raiz do sistema:** Para acessar qualquer funcionalidade administrativa (atletas, chaves, categorias), é necessário primeiro **iniciar um torneio** (defini-lo como ativo).
- **Múltiplos torneios:** O sistema suporta múltiplos torneios simultaneamente, cada um armazenado em arquivo JSON individual no diretório `{userData}/data/torneios/`.
- **Torneio ativo:** Apenas um torneio pode estar ativo por vez. O ID do torneio ativo é armazenado em `{userData}/data/torneio-ativo.json`.
- **Título do torneio:** Se o campo `nome` for preenchido, o título exibido é o nome informado. Caso contrário, o título é "Torneio {data}" no formato `dd/MM/yyyy`.
- **Data futura:** A data do torneio deve ser posterior ao dia atual (dia atual e passados são rejeitados).
- **ID único:** Cada torneio recebe um UUID v4 gerado no momento da criação (`crypto.randomUUID()` no main process).
- **Persistência imediata:** O arquivo JSON do torneio é criado no momento da confirmação do formulário ou da importação.

### 3.2. Criação de Torneio

- Campo `nome` é opcional (string vazia se não informado).
- Campo `data` é obrigatório e deve ser uma data futura (rejeita dia atual e passados).
- Data é armazenada em ISO (`YYYY-MM-DD`) e exibida no formato brasileiro (`DD/MM/YYYY`).
- Utiliza `dayjs` para comparação de datas e formatação.
- Após criar com sucesso, o usuário é redirecionado para a listagem de torneios (`/admin/listar-torneios`).
- O formulário (`CriarTorneio.tsx`) usa `@mantine/form` com `mode: 'uncontrolled'`.

### 3.3. Importação de Torneio

- Apenas arquivos com extensão `.json` são aceitos (filtro nativo do diálogo).
- O arquivo deve conter os campos obrigatórios: `id`, `data`, `nome` (validação no import).
- Se o `id` do torneio importado já existir no diretório, o sistema pergunta se deseja sobrescrever via modal de confirmação.
- Após importar com sucesso, o usuário é redirecionado para a listagem de torneios.
- A importação é feita via upload de arquivo (não diálogo nativo), com leitura do conteúdo via `FileReader` e envio ao IPC.

### 3.4. Exportação de Torneio

- Abre diálogo nativo "Salvar como" para o usuário escolher o destino.
- Gera uma cópia exata do arquivo JSON do torneio via `fs.copyFileSync`.
- Nome padrão sugerido: `{nome}_Torneio_{data}.json` com caracteres especiais substituídos por `_`.

### 3.5. Inicialização de Torneio (Iniciar)

- Define o torneio como ativo escrevendo seu `id` em `{userData}/data/torneio-ativo.json`.
- Após iniciar, redireciona para o Dashboard Administrativo (`/admin/dashboard`).
- Apenas um torneio pode estar ativo por vez (iniciar um novo substitui o anterior no arquivo).
- Registra o timestamp `startedAt` no JSON do torneio no momento do Play (`new Date().toISOString()`).
- O badge "Iniciado {data}" é exibido no Dashboard para torneios com `startedAt` preenchido.

### 3.6. Dashboard Administrativo

- O Dashboard é a tela central de administração do torneio ativo, acessível via `/admin/dashboard`.
- Ao carregar, obtém o torneio ativo via IPC `get-active-tournament`.
- Exibe o nome e data do torneio ativo, além de um badge verde "Iniciado {data}" se `startedAt` existir.
- Contém cards em layout **Grid** (1 coluna <700px, 2 colunas <1400px, 3 colunas <1800px, 4 colunas ≥1800px).
- Cards de funcionalidades implementadas: clicáveis com hover elevado (translateY(-2px)), opacidade 1.
- Cards de funcionalidades não implementadas: opacidade 0.5, cursor `not-allowed`, badge "Em breve".
- Atalho: card "Atletas" navega para `/admin/atletas` (menu intermediário).
- Botão "Voltar": ícone de seta que retorna ao Menu Inicial (`/`).

### 3.7. Exclusão de Torneio

- Cada torneio na listagem exibe botão "Excluir" (ícone de lixeira) com `ActionIcon` vermelho.
- Ao clicar, abre modal de confirmação: "Deseja realmente excluir o torneio **{nome}**? Esta ação não pode ser desfeita."
- Se confirmado, o arquivo JSON é removido do diretório `{userData}/data/torneios/` via `fs.unlinkSync`.
- Se o torneio excluído for o torneio ativo, o arquivo `torneio-ativo.json` também é removido.
- Notificação verde de sucesso e listagem recarregada.
- Modal usa `useDisclosure` para controle de abertura.

### 3.8. Atletas (Implementado)

- **Menu intermediário:** Ao clicar no card "Atletas" no Dashboard, navega para `/admin/atletas` que renderiza `AthletesMenu` — um menu com 3 cartões:
  - **Cadastrar Atleta** — Abre o modal `AthleteForm` diretamente na mesma página para criar um novo atleta.
  - **Listar Atletas** — Navega para `/admin/atletas/lista` (tela `AdminAthletes` com tabela CRUD).
  - **Importar Atletas** — Dispara o diálogo nativo de seleção de arquivo JSON via IPC `import-athletes`.
- **Tela de listagem (`/admin/atletas/lista`):** Exibe `AdminAthletes` com:
  - Botões "Importar" e "Cadastrar" no topo.
  - Tabela com colunas: Nome, Equipe, Faixa, Idade, Ações (editar/excluir).
  - Empty state com "Nenhum atleta cadastrado" + botão "Cadastrar primeiro atleta".
  - Ações por linha: lápis (editar) e lixeira (excluir).
  - Botão "Voltar" retorna para `/admin/atletas` (menu), não para o Dashboard.
- **Modal de formulário:** `AthleteForm.tsx` usa `@mantine/form` com **modo controlado** (`mode: 'controlled'`). Cada campo recebe os props diretamente de `form.getInputProps(path)`. O `useEffect` de inicialização do formulário depende apenas de `opened` e `athlete` (não de `form`) para evitar loop de re-renderização.
- Nome e equipe são obrigatórios (mínimo 2 caracteres) e armazenados em minúsculo (`.trim().toLowerCase()` no submit).
- Peso deve estar entre 1 e 300 kg.
- Faixa segue enum: infantil (branca, cinza, amarela, laranja, verde) e adulto (branca-adulto, azul, roxa, marrom, preta). O valor `branca-adulto` é mapeado para `branca` na persistência.
- Ano de nascimento entre 1920 e ano atual.
- Idade é calculada dinamicamente (`ano atual - anoNascimento`), não persistida.
- **Duplicata:** Um atleta é considerado duplicata quando possui o mesmo **nome** (case-insensitive, trimmed) **e** mesmo **ano de nascimento**. A verificação ocorre:
  - No renderer (`AdminAthletes.tsx:handleSave`) antes do IPC, tanto para cadastro quanto para edição (ignorando o próprio `id`).
  - No main process (`athletes.ts:importAthletesFromFile`) durante importação em massa.
- **Armazenamento por torneio:** Atletas são armazenados dentro do JSON do torneio (campo `atletas: Atleta[]`), não mais em arquivo global. Cada torneio possui sua própria lista exclusiva.
- **Torneio ativo obrigatório:** Para cadastrar, editar, excluir ou importar atletas, é necessário que haja um torneio ativo. Caso contrário, o handler IPC lança erro `"Nenhum torneio ativo"` exibido como notificação vermelha.
- **Sincronia imediata:** Qualquer operação CRUD sobre atletas lê e escreve diretamente no arquivo JSON do torneio ativo (`torneios/{id}.json`), atualizando o timestamp `updatedAt` do torneio.
### 3.9. Importação em Massa de Atletas

- **Gatilhos:** A importação pode ser disparada de dois lugares:
  - Menu de Atletas (`/admin/atletas`): cartão "Importar Atletas" no `AthletesMenu.tsx`.
  - Lista de Atletas (`/admin/atletas/lista`): botão "Importar" no header do `AdminAthletes.tsx`.
- **Formato:** Apenas arquivos `.json` são aceitos (filtro nativo do diálogo de arquivo).
- **Diálogo nativo:** Abre `dialog.showOpenDialog` do Electron com filtro `*.json`. Se o usuário cancelar, retorna `{ imported: 0, skipped: 0 }` sem notificação.
- **Validação de estrutura:**
  - O JSON raiz deve ser um **array**. Objeto, string ou número são rejeitados com erro.
  - Array vazio (`[]`) é válido — importa 0 e ignora 0.
- **Campos obrigatórios por atleta:** `nome`, `equipe`, `faixa`, `anoNascimento`, `pesoKg`. Todos verificados por truthy.
- **Campos opcionais:** `id`, `createdAt`, `updatedAt` — gerados automaticamente se ausentes.
- **Campos extras** no JSON são preservados (via `...a` spread), mas ignorados no processo.
- **Validação é fail-fast:** ao primeiro atleta com campos obrigatórios ausentes, todo o lote é rejeitado. Nenhum atleta é importado parcialmente.
- **Normalização:** `nome` e `equipe` são convertidos para `trim().toLowerCase()` antes da inserção e antes da verificação de duplicidade.
- **Deduplicação:** Um atleta é ignorado se:
  1. Seu `id` (se fornecido no arquivo) já existe na lista atual.
  2. Seu `nome` (case-insensitive, trimmed) **e** `anoNascimento` já existem combinados em algum atleta da lista.
- **Persistência:** A lista mesclada é reescrita no JSON do torneio ativo (`torneios/{id}.json` → campo `atletas`) com indentação de 2 espaços.
- **Retorno:** `{ imported: number; skipped: number }` — contagem de novos vs. ignorados.
- **Notificações no renderer:**
  - Cancelamento ou `imported=0, skipped=0`: silêncio (sem notificação).
  - Sucesso: `"X atleta(s) importado(s)."` (verde).
  - Sucesso parcial: `"X atleta(s) importado(s), Y ignorado(s) (já existentes)."` (verde).
  - Erro (arquivo inválido, JSON malformado, campos ausentes, erro de I/O): `"Erro ao importar atletas."` (vermelho).
- **Casos de borda:**
  - Duplicata no próprio arquivo de importação: o primeiro é processado, o segundo é ignorado (já existe na lista após o primeiro ser adicionado).
  - Ano de nascimento `0`: rejeitado por truthy check (`!a.anoNascimento` com `0` é falsy).
  - Nomes com espaços extras internos não são normalizados (ex.: `"joão  silva"` vs `"joão silva"` não são considerados duplicatas).

### 3.10. Ativação do Software (Implementado)

- Na primeira execução, exige senha de ativação fornecida pelo desenvolvedor.
- Senha validada por hash SHA-256 (nunca armazenada em texto puro).
- Após ativação bem-sucedida, gera token HMAC-SHA256 vinculado ao hardware da máquina (UUID obtido via `wmic csproduct get uuid`).
- Token salvo em `{userData}/activation.json`; execuções subsequentes verificam o token automaticamente.
- Senha mestra padrão: `Bjj@2025!Secure` (hash SHA-256: `57a8d2d84be94e9bdae407ad8352065346269c6997b0be31ff32101fc51e7c3e`).
- Fallback para `crypto.randomUUID()` se o comando `wmic` falhar (Linux/macOS ou restrição de segurança).
- O `App.tsx` faz 3 estados: `null` (carregando), `false` (tela de ativação), `true` (app principal). O `.catch(() => setActivated(false))` trata falhas de IPC.

### 3.11. Error Boundary

- Um componente `ErrorBoundary` (classe React) envolve as `<Routes>` no `HashRouter`.
- Captura erros de renderização em qualquer página filha.
- Exibe tela de fallback com: título "Erro inesperado", descrição, mensagem do erro (primeiras 4 linhas do stack) e botão "Tentar novamente".
- O botão "Tentar novamente" reseta o estado de erro (`setState({ hasError: false })`) e re-renderiza os children.

---

## 4. Plataforma

A aplicação será desenvolvida para:

- Windows 10
- Windows 11

O sistema será distribuído como software desktop utilizando Electron.

---

## 5. Stack Tecnológica

### Desktop
- Electron 30

### Interface
- React 18 + TypeScript 5
- Vite 5 (bundler)
- Mantine UI 7 (componentes)
- Tabler Icons 3
- React Router 6 (`HashRouter`)
- dayjs (datas)

### Formulários
- `@mantine/form` com `@mantine/core` (TextInput, NumberInput, Select, DatePickerInput)

### Validação
- `@mantine/form` com regras `validate`

### Notificações
- `@mantine/notifications`

### Persistência
- `fs` (Electron main process)

### Build
- electron-builder
- vite-plugin-electron

---

## 6. Persistência de Dados

O sistema utiliza exclusivamente arquivos JSON para armazenamento local, sem dependência de banco de dados externo. Toda operação funciona offline.

### 6.1. Geração dos Arquivos JSON

Cada entidade é persistida em um ou mais arquivos JSON. Os torneios são armazenados em arquivos individuais dentro de `{userData}/data/torneios/`. O arquivo de cada torneio é gerado no momento da criação ou importação.

O torneio ativo é definido por `{userData}/data/torneio-ativo.json` que armazena o `id` do torneio em uso.

### 6.2. Estrutura de Diretórios

```
{userData}/
  data/
    torneios/
      {id}.json           # JSON do torneio com campo "atletas"
    torneio-ativo.json    # { "id": "uuid-do-torneio-ativo" }
    atletas.json          # Exportação da lista de atletas (via export-athletes)
    activation.json       # { "token": "hmac-token", "activatedAt": "ISO" }
```

### 6.3. Estrutura do JSON de Torneio (`{userData}/data/torneios/{id}.json`)

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
      "equipe": "gracie barra",
      "pesoKg": 76.5,
      "faixa": "azul",
      "anoNascimento": 1998,
      "createdAt": "2026-05-31T10:00:00.000Z",
      "updatedAt": "2026-05-31T10:00:00.000Z"
    }
  ]
}
```

### 6.4. Estrutura do JSON de Atleta (formato do array dentro do campo `atletas` do torneio)
```json
[
  {
    "id": "uuid-v4",
    "nome": "joão silva",
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

## 7. Comunicação Main <> Renderer (IPC)

| Canal | Direção | Descrição |
|---|---|---|
| `create-tournament` | Renderer → Main | Cria novo torneio e salva no diretório |
| `list-tournaments` | Renderer → Main → Renderer | Retorna array com todos os torneios |
| `start-tournament` | Renderer → Main | Define torneio como ativo e registra `startedAt` |
| `get-active-tournament` | Renderer → Main → Renderer | Retorna torneio ativo ou `null` |
| `export-tournament` | Renderer → Main | Abre diálogo "Salvar como" e copia JSON |
| `import-tournament` | Renderer → Main | Importa JSON verificando duplicidade de ID |
| `import-tournament-overwrite` | Renderer → Main | Sobrescreve torneio existente (mesmo ID) |
| `read-file` | Renderer → Main → Renderer | Lê conteúdo de arquivo do disco |
| `update-tournament` | Renderer → Main | Atualiza dados do torneio |
| `delete-tournament` | Renderer → Main | Remove arquivo JSON do torneio (+ `torneio-ativo.json` se for o ativo) |
| `load-athletes` | Renderer → Main → Renderer | Carrega atletas do torneio ativo (`torneios/{id}.json` → campo `atletas`) |
| `save-athlete` | Renderer → Main | Adiciona novo atleta ao torneio ativo (lança erro se não houver torneio ativo) |
| `update-athlete` | Renderer → Main | Atualiza atleta existente no torneio ativo (match por `id`) |
| `delete-athlete` | Renderer → Main | Remove atleta do torneio ativo pelo `id` |
| `import-athletes` | Renderer → Main → Renderer | Abre diálogo nativo, lê JSON, mescla com lista do torneio ativo, retorna `{imported, skipped}` |
| `check-activation` | Renderer → Main → Renderer | Verifica se o software está ativado |
| `validate-password` | Renderer → Main → Renderer | Valida senha de ativação (hash SHA-256) |
| `activate-license` | Renderer → Main → Renderer | Gera e salva token HMAC de ativação |

---

## 8. Rotas da Aplicação

| Rota | Componente | Descrição |
|---|---|---|
| `/` | `MenuInicial` | Menu principal com 3 opções (Criar, Importar, Listar) |
| `/admin/criar-torneio` | `CriarTorneio` | Formulário de criação de torneio |
| `/admin/importar-torneio` | `ImportarTorneio` | Tela de importação com upload e validação |
| `/admin/listar-torneios` | `ListarTorneios` | Lista com ações Iniciar / Exportar / Excluir |
| `/admin/dashboard` | `Dashboard` | Dashboard Administrativo do torneio ativo |
| `/admin/atletas` | `AthletesMenu` | Menu de atletas com 3 cartões (Cadastrar, Listar, Importar) |
| `/admin/atletas/lista` | `AdminAthletes` | Gerenciamento de atletas (tabela CRUD + botões) |

> O roteamento utiliza `HashRouter` (não `BrowserRouter`) para compatibilidade com o protocolo `file://` no Electron em produção.

### Fluxo de Navegação

```
[Menu Inicial (/)]
  ├── Criar Torneio      → /admin/criar-torneio
  │                        └── (após criar) → /admin/listar-torneios
  │
  ├── Importar Torneio   → /admin/importar-torneio
  │                        └── (após importar) → /admin/listar-torneios
  │
   └── Listar Torneios    → /admin/listar-torneios
                             ├── [Iniciar] → /admin/dashboard (registra startedAt)
                             ├── [Exportar] → diálogo "Salvar como"
                             └── [Excluir] → modal de confirmação → remove arquivo
```

### Fluxo Dashboard → Funcionalidades

```
[Dashboard /admin/dashboard]
    ├── Atletas     → /admin/atletas (AthletesMenu)
    │                 ├── Cadastrar Atleta → modal AthleteForm inline + IPC save
    │                 ├── Listar Atletas   → /admin/atletas/lista (AdminAthletes, tabela CRUD)
    │                 └── Importar Atletas → diálogo nativo de arquivo JSON via IPC
    ├── Equipes     → (Em breve)
    ├── Categorias  → (Em breve)
    ├── Inscrições  → (Em breve)
    ├── Pesagem     → (Em breve)
    ├── Chaves      → (Em breve)
    ├── Áreas       → (Em breve)
    ├── Árbitros    → (Em breve)
    ├── Placar      → (Em breve)
    ├── Resultados  → (Em breve)
    └── Relatórios  → (Em breve)
```

### Fluxo AthletesMenu

```
[AthletesMenu /admin/atletas]
    ├── Cadastrar Atleta → abre modal AthleteForm (mesma página, useDisclosure)
    │                      ├── Salvar → IPC save-athlete + recarrega lista via loadAthletes()
    │                      └── Fechar → modal close
    │
    ├── Listar Atletas   → /admin/atletas/lista (AdminAthletes)
    │                      ├── Importar → IPC import-athletes (diálogo nativo)
    │                      ├── Cadastrar → abre modal AthleteForm
    │                      ├── Tabela com ações (editar, excluir)
    │                      ├── Editar → abre modal AthleteForm preenchido
    │                      ├── Excluir → modal confirmação → IPC delete-athlete
    │                      └── Voltar → /admin/atletas (menu)
    │
    └── Importar Atletas → IPC import-athletes (diálogo nativo, mesma página)
```

---

## 9. Identidade Visual

### 9.1 Tema Principal

A identidade visual utiliza cores que transmitam organização, confiança e profissionalismo.

#### 9.1.1 Paleta de Cores

| Elemento | Cor | Uso |
|---|---|---|
| **Fundo principal** | `#f8f9fa` (Gray 0) | Fundo da interface |
| **Título principal** | `#212529` (Gray 9) | Títulos e logotipo |
| **Botões / Destaques** | Azul Royal (`#1565C0`) | Botões primários, indicadores, links |
| **Hover/Focus** | Azul escuro (`#0d47a1`) | Feedback visual em interações |
| **Texto secundário** | `#6c757d` (Gray 6) | Descrições e textos auxiliares |
| **Divisores/Bordas** | `#e9ecef` (Gray 2) | Separar elementos |
| **Confirmação** | Verde (`#2E7D32`) | Resultados positivos, status concluídos |
| **Alerta** | Vermelho | Erros, exclusões |

### 9.2 Tipografia

| Elemento | Fonte | Peso | Tamanho |
|---|---|---|---|
| **Título principal** | Inter, sans-serif | Bold (700) | `clamp(28px, 2vw, 36px)` |
| **Opções do menu** | Inter, sans-serif | Semibold (600) | `clamp(18px, 1.5vw, 22px)` |
| **Texto auxiliar** | Inter, sans-serif | Regular (400) | `clamp(14px, 1vw, 16px)` |

### 9.3 Responsividade

O tema define tamanhos de fonte usando `clamp()` para garantir proporcionalidade à janela. Componentes Mantine são configurados com `defaultRadius: 'md'` e tamanhos `md` para botões e inputs.

---

## 10. Tela Inicial — Menu de Seleção

### 10.1 User Story

O usuário principal, após fechar as inscrições em seu sistema externo, abre o BJJ Tournament Manager para organizar o torneio. Ele escolhe entre criar um novo torneio, importar um torneio previamente exportado, ou listar os torneios já cadastrados.

### 10.2 Descrição

A primeira tela exibe um menu com três opções principais:

1. **Criar Torneio** — Abertura do formulário de cadastro de um novo torneio (`/admin/criar-torneio`).
2. **Importar Torneio** — Importação de um torneio a partir de um arquivo JSON (`/admin/importar-torneio`).
3. **Listar Torneios** — Visualização de todos os torneios cadastrados (`/admin/listar-torneios`).

### 10.3 Layout

```
+--------------------------------------------------+
|   ┌──────────────────────────────────────────┐    |
|   │           BJJ TOURNAMENT MANAGER          │    |
|   │         Gerencie seu campeonato           │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │   [IconPlus]  Criar Torneio              │    |
|   │   Cadastre um novo torneio               │    |
|   └──────────────────────────────────────────┘    |
|   ┌──────────────────────────────────────────┐    |
|   │   [IconFileUpload]  Importar Torneio     │    |
|   │   Importe torneio de arquivo JSON        │    |
|   └──────────────────────────────────────────┘    |
|   ┌──────────────────────────────────────────┐    |
|   │   [IconList]  Listar Torneios            │    |
|   │   Veja todos os torneios cadastrados     │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
|   Pressione 1, 2 ou 3 para selecionar             |
+--------------------------------------------------+
```

### 10.4 Comportamento

- Ao iniciar o Electron, a rota `/` é carregada imediatamente.
- O menu é exibido independentemente de haver torneios cadastrados.
- Seleção: clique/touch, teclado numérico (1/2/3) ou Tab + Enter.
- Feedback visual: hover (translateY(-2px), sombra), active (scale 0.98), foco (outline).
- Teclas 1/2/3 registradas via `window.addEventListener('keydown')` no `useEffect`.

---

## 11. Regras de Validação

### 11.1. Torneio (CriarTorneio)

| Campo | Regra | Mensagem |
|---|---|---|
| **Data** | Obrigatório, deve ser futura (após hoje) | "A data do torneio deve ser futura" |

### 11.2. Atleta (AthleteForm)

| Campo | Regra | Mensagem |
|---|---|---|
| **Nome** | Mínimo 2 caracteres | "Nome deve ter ao menos 2 caracteres" |
| **Equipe** | Mínimo 2 caracteres | "Equipe deve ter ao menos 2 caracteres" |
| **Peso** | Número entre 1 e 300 | "Peso deve estar entre 1 e 300 kg" |
| **Faixa** | Deve ser uma faixa válida do enum | "Selecione uma faixa válida" |
| **Ano Nascimento** | Inteiro entre 1920 e ano atual | "Ano deve estar entre 1920 e {anoAtual}" |

A validação ocorre:
- **Em tempo real** ao digitar (modo controlado), com erro exibido abaixo do campo.
- **No submit** (`form.onSubmit`): se houver erro, o formulário não é enviado.

### 11.3. Importação de Atletas (main process)

- O conteúdo do arquivo deve ser um array.
- Cada atleta deve ter os campos obrigatórios: `nome`, `equipe`, `faixa`, `anoNascimento`, `pesoKg`.
- `id`, `createdAt` e `updatedAt` são opcionais — gerados automaticamente se ausentes.
- Atletas com `id` já existente na lista são ignorados (skipped) — somente se `id` foi fornecido no arquivo.
- Atletas com mesmo `nome` (case-insensitive, trimmed) + `anoNascimento` são ignorados (skipped).

---

## 12. Regras de Duplicidade

### 12.1. Atletas

Um atleta é considerado **duplicata** quando possui o mesmo **nome** (case-insensitive, trimmed) **e** mesmo **ano de nascimento**.

| Operação | Local da Verificação | Comportamento |
|---|---|---|
| **Cadastro individual** | Renderer (`AdminAthletes.tsx:handleSave`) | Antes de chamar o IPC, percorre a lista local. Se duplicata (excluindo próprio `id`), exibe notificação vermelha e não salva. |
| **Edição** | Renderer (`AdminAthletes.tsx:handleSave`) | Mesma verificação, ignorando o atleta sendo editado pelo `id`. |
| **Importação em massa** | Main process (`athletes.ts:importAthletesFromFile`) | Durante mesclagem, verifica: (1) `id` duplicado — somente se o atleta de entrada possui `id`; (2) nome (case-insensitive, trimmed) + anoNascimento. Duplicatas são ignoradas e contabilizadas em `skipped`. |

---

## 13. Requisitos Não Funcionais

### 13.1. Requisitos Gerais

- Funcionar sem conexão com a internet.
- Carregamento rápido.
- Capaz de armazenar milhares de atletas.
- Permitir backup manual dos arquivos JSON.
- Interface responsiva para diferentes resoluções.
- TypeScript em todo o projeto.

### 13.2. UI Responsiva

| Dispositivo | Largura | Comportamento |
|---|---|---|
| Desktop / Notebook | ≥ 1024px | Layout centralizado |
| Tablet | 768px – 1023px | Cartões empilhados, fonte ajustada |
| TV / Monitor grande | ≥ 1920px | Escala proporcional |
| Resoluções baixas | < 768px | Rolagem vertical se necessário |

Uso de `clamp()` para tamanhos, unidades relativas (`rem`, `vw`), scroll horizontal em tabelas.

### 13.3. Acessibilidade

- Contraste WCAG AA (taxa mínima 4.5:1).
- Suporte a `prefers-reduced-motion` (desativa animações).
- Navegação por teclado (Tab, Enter, teclas numéricas).
- Atributos `aria-label` em elementos interativos.
- Cartões com `role="button"` e `tabIndex`.

---

## 14. Documentação Relacionada

| Arquivo | Conteúdo |
|---|---|
| `doc/requisitos.md` | Este documento — regras de negócio e especificação geral |
| `spec/cadastro-atletas.md` | Especificação detalhada do CRUD de atletas |
| `spec/spec-import-atleta.md` | Especificação detalhada da importação em massa de atletas |
| `spec/spec-torneio-atletas.md` | Especificação da migração de atletas para armazenamento por torneio |
| `spec/validacao-credential.md` | Especificação da ativação do software |
| `spec.md` | Diagnóstico histórico do formulário de atletas (modo uncontrolled) |
| `spec-correção.md` | Análise da correção do formulário (modo controlled + dependência form removida) |

---

## 15. Estrutura de Arquivos (Implementada)

```
bjj-tournament-manager-setup/
├── electron/
│   ├── main.ts              ← Registro dos handlers IPC, criação da janela
│   ├── preload.ts           ← Exposição dos canais IPC (contextBridge)
│   ├── tournament.ts        ← CRUD de torneios no sistema de arquivos
│   ├── athletes.ts          ← CRUD de atletas + importação em massa
│   └── activation.ts        ← Ativação do software (SHA-256, HMAC)
│
├── src/
│   ├── main.tsx             ← Entry point React
│   ├── App.tsx              ← Rotas (HashRouter), providers, ativação gate
│   ├── pages/
│   │   ├── MenuInicial.tsx      ← Menu principal (Criar / Importar / Listar)
│   │   ├── CriarTorneio.tsx     ← Formulário de criação de torneio
│   │   ├── ImportarTorneio.tsx  ← Tela de importação com upload e validação
│   │   ├── ListarTorneios.tsx   ← Lista com ações Iniciar / Exportar / Excluir
│   │   ├── Dashboard.tsx        ← Dashboard Administrativo do torneio ativo
│   │   ├── AthletesMenu.tsx     ← Menu intermediário de atletas (3 cartões)
│   │   └── AdminAthletes.tsx    ← Gerenciamento de atletas (tabela CRUD)
│   ├── components/
│   │   ├── AthleteForm.tsx      ← Modal de cadastro/edição de atleta (modo controlled)
│   │   ├── AthleteTable.tsx     ← Tabela de listagem de atletas
│   │   ├── PageLayout.tsx       ← Layout padrão (Container, Paper, título, voltar)
│   │   ├── ActivationScreen.tsx ← Tela de ativação do software
│   │   └── ErrorBoundary.tsx    ← Captura de erros de renderização
│   ├── types/
│   │   ├── tournament.ts        ← Interfaces Torneio, CreateTorneioInput
│   │   ├── athlete.ts           ← Interface Atleta e tipo Faixa (union)
│   │   └── electron.d.ts        ← Tipos globais Window.electronAPI + Window.activation
│   └── styles/
│       ├── theme.ts             ← Tema Mantine UI (cores, fontes, componentes)
│       └── global.css           ← Reset CSS, body, prefers-reduced-motion
│
├── doc/requisitos.md        ← Regras de negócio (este documento)
├── spec/
│   ├── cadastro-atletas.md  ← Spec detalhado do CRUD de atletas
│   ├── spec-import-atleta.md  ← Spec detalhado da importação em massa de atletas
│   └── validacao-credential.md ← Spec da ativação do software
├── spec.md                  ← Diagnóstico histórico (bug uncontrolled → controlled)
└── spec-correção.md         ← Análise da correção (form em deps do useEffect)
```
