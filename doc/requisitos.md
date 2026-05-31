# BJJ Tournament Manager

## 1. Visão Geral

O **BJJ Tournament Manager** é um software desktop desenvolvido para gerenciamento completo de campeonatos de Jiu-Jitsu.

O sistema será responsável por controlar todas as etapas do evento, desde o cadastro dos participantes até a definição dos campeões de cada categoria, incluindo gerenciamento de chaves, acompanhamento de lutas em tempo real, placares, árbitros, áreas de luta e resultados.

O objetivo é fornecer uma solução centralizada para organizadores, árbitros e equipes, reduzindo erros operacionais e agilizando a condução dos campeonatos.

---

## 2. Status da Implementação

### 2.1. Implementado (MVP)

| Módulo | Status | Observação |
|---|---|---|
| Menu Inicial | ✅ Completo | Tela com 3 cartões (Criar, Importar, Listar) + teclas 1/2/3 |
| Criar Torneio | ✅ Completo | Formulário com nome (opcional), data (futura), validação, IPC |
| Importar Torneio | ✅ Completo | Upload JSON, validação de estrutura, modal de sobrescrita |
| Listar Torneios | ⚡ Parcial | Tabela com Iniciar/Exportar implementados; faltam Editar e Excluir |
| Gerenciamento de Torneios (IPC) | ✅ Completo | CRUD completo no main process (electron/tournament.ts) |
| Tema Mantine UI | ✅ Completo | Tema azul royal, fonte Inter |

### 2.2. Não Implementado (Planejado)

| Módulo | Status | Observação |
|---|---|---|
| Editar Torneio (navegar para Dashboard) | ❌ Pendente | Botão de editar na listagem |
| Excluir Torneio | ❌ Pendente | Botão de excluir com modal de confirmação na listagem |
| Cadastro de Atletas | ❌ Pendente | Spec existente em spec/cadastro-atletas.md |
| Cadastro de Equipes | ❌ Pendente | Apenas mencionado |
| Cadastro de Categorias | ❌ Pendente | Apenas mencionado |
| Controle de Inscrições | ❌ Pendente | Apenas mencionado |
| Controle de Pesagem | ❌ Pendente | Apenas mencionado |
| Geração de Chaves | ❌ Pendente | Apenas mencionado |
| Áreas de Luta | ❌ Pendente | Apenas mencionado |
| Árbitros | ❌ Pendente | Apenas mencionado |
| Chamadas / Placar / Resultados | ❌ Pendente | Apenas mencionado |
| Ranking / Medalhistas | ❌ Pendente | Apenas mencionado |
| Relatórios | ❌ Pendente | Apenas mencionado |
| Exportação/Importação de dados completos | ❌ Pendente | Apenas exportação do JSON do torneio |
| Dashboard Administrativo | ❌ Pendente | Rota `/admin/dashboard` existe mas sem tela |
| Tela de Login/Ativação | ❌ Pendente | Spec em spec/validacao-credential.md; Login.tsx não integrado |

---

## 3. Regras de Negócio

### 3.1. Torneio

- **Entidade raiz do sistema:** Para acessar qualquer funcionalidade administrativa (atletas, chaves, categorias), é necessário primeiro **iniciar um torneio** (defini-lo como ativo).
- **Múltiplos torneios:** O sistema suporta múltiplos torneios simultaneamente, cada um armazenado em arquivo JSON individual.
- **Torneio ativo:** Apenas um torneio pode estar ativo por vez. O ID do torneio ativo é armazenado em `torneio-ativo.json`.
- **Título do torneio:** Se o campo `nome` for preenchido, o título exibido é o nome informado. Caso contrário, o título é "Torneio {data}" no formato `dd/MM/yyyy`.
- **Data futura:** A data do torneio deve ser posterior ao dia atual (dia atual e passados são rejeitados).
- **ID único:** Cada torneio recebe um UUID v4 gerado no momento da criação.
- **Persistência imediata:** O arquivo JSON do torneio é criado no momento da confirmação do formulário ou da importação.

### 3.2. Criação de Torneio

- Campo `nome` é opcional (string vazia se não informado).
- Campo `data` é obrigatório e deve ser uma data futura.
- Data é armazenada em ISO (`YYYY-MM-DD`) e exibida no formato brasileiro (`DD/MM/YYYY`).
- Após criar, o usuário é redirecionado para a listagem de torneios.

### 3.3. Importação de Torneio

- Apenas arquivos com extensão `.json` são aceitos.
- O arquivo deve conter os campos obrigatórios: `id`, `data`, `nome`.
- Se o `id` do torneio importado já existir no diretório, o sistema pergunta se deseja sobrescrever.
- Após importar, o usuário é redirecionado para a listagem de torneios.

### 3.4. Exportação de Torneio

- Abre diálogo nativo "Salvar como" para o usuário escolher o destino.
- Gera uma cópia exata do arquivo JSON do torneio.
- Nome padrão sugerido: `{nome}_Torneio_{data}.json` (caracteres especiais substituídos por `_`).

### 3.5. Inicialização de Torneio (Iniciar)

- Define o torneio como ativo escrevendo seu `id` em `torneio-ativo.json`.
- Após iniciar, redireciona para o Dashboard Administrativo (`/admin/dashboard`).
- Apenas um torneio pode estar ativo por vez (iniciar um novo substitui o anterior).

### 3.6. Edição de Torneio

- Cada torneio na listagem exibe um botão "Editar" (ícone de lápis).
- Ao clicar em "Editar", o torneio é definido como ativo (mesmo comportamento de "Iniciar") e redireciona para o Dashboard Administrativo (`/admin/dashboard`).
- O Dashboard é a tela onde o usuário poderá gerenciar todas as configurações do torneio (nome, data, categorias, atletas, etc.).
- **OBSERVAÇÃO:** "Editar" **não** é uma operação de update/rename do torneio na listagem. É uma navegação para o Dashboard com o torneio ativo. A implementação atual em `ListarTorneios.tsx:54` faz `startTournament(id)` + `navigate('/admin/dashboard')` — está correta. Não deve ser confundida com o canal IPC `update-tournament` (reservado para salvamento de configurações no Dashboard).

### 3.7. Exclusão de Torneio

- Cada torneio na listagem exibe um botão "Excluir" (ícone de lixeira).
- Ao clicar em "Excluir", abre um modal de confirmação: "Deseja realmente excluir este torneio? Esta ação não pode ser desfeita."
- Se confirmado, o arquivo JSON do torneio é removido do diretório `{userData}/data/torneios/`.
- Se o torneio excluído for o torneio ativo, o arquivo `torneio-ativo.json` também deve ser removido.
- Notificação de sucesso é exibida e a listagem é atualizada.
- Se houver erro, notificação de erro é exibida.

### 3.8. Atletas (a implementar)

- Nome e equipe são obrigatórios (mínimo 2 caracteres).
- Peso deve estar entre 1 e 300 kg.
- Faixa segue enum: infantil (branca, cinza, amarela, laranja, verde) e adulto (branca, azul, roxa, marrom, preta).
- Ano de nascimento entre 1920 e ano atual.
- Idade é calculada dinamicamente (`ano atual - ano nascimento`), não persistida.

### 3.7. Ativação do Software (a implementar)

- Na primeira execução, exige senha de ativação fornecida pelo desenvolvedor.
- Senha validada por hash SHA-256 (nunca armazenada em texto puro).
- Após ativação bem-sucedida, gera token HMAC vinculado ao hardware (UUID da máquina).
- Token salvo em `userData`; execuções subsequentes verificam o token automaticamente.

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

- React 18
- TypeScript 5
- Vite 5
- Mantine UI 7
- Tabler Icons 3
- React Router 6
- dayjs

### Formulários

- `@mantine/form` com validação

### Build

- electron-builder
- vite-plugin-electron

---

## 6. Persistência de Dados

O sistema utiliza exclusivamente arquivos JSON para armazenamento local.

Não há dependência de banco de dados externo.

Toda a operação deve funcionar offline.

### 6.1. Geração dos Arquivos JSON

Cada entidade do sistema é persistida em um ou mais arquivos JSON. Os torneios são armazenados em arquivos individuais dentro do diretório `{userData}/data/torneios/`. O arquivo JSON de cada torneio é gerado **no momento da criação** (ao preencher Nome + Data e confirmar) ou no momento da **importação** (ao selecionar um JSON válido). Antes dessas ações o arquivo não existe em disco.

O torneio ativo é definido por um arquivo separado (`torneio-ativo.json`) que armazena o `id` do torneio em uso.

### 6.2. Estrutura de Diretórios

```
{userData}/
  data/
    torneios/
      {id}.json           # Arquivo individual de cada torneio
    torneio-ativo.json    # { "id": "uuid-do-torneio-ativo" }
```

---

## 7. Comunicação Main <> Renderer (IPC)

| Canal | Direção | Status | Descrição |
|---|---|---|---|
| `create-tournament` | Renderer → Main | ✅ | Cria novo torneio e salva no diretório |
| `list-tournaments` | Renderer → Main → Renderer | ✅ | Retorna array com todos os torneios |
| `start-tournament` | Renderer → Main | ✅ | Define torneio como ativo |
| `get-active-tournament` | Renderer → Main → Renderer | ✅ | Retorna torneio ativo ou null |
| `export-tournament` | Renderer → Main | ✅ | Abre diálogo para exportar JSON |
| `import-tournament` | Renderer → Main | ✅ | Importa JSON para diretório de torneios |
| `import-tournament-overwrite` | Renderer → Main | ✅ | Sobrescreve torneio existente |
| `read-file` | Renderer → Main → Renderer | ✅ | Lê conteúdo de arquivo do disco |
| `update-tournament` | Renderer → Main | ❌ | Pendente — atualizar dados do torneio |
| `delete-tournament` | Renderer → Main | ❌ | Pendente — remover arquivo JSON do torneio |
| `load-athletes` | Renderer → Main → Renderer | ❌ | Pendente — carregar atletas |
| `save-athlete` | Renderer → Main | ❌ | Pendente — salvar atleta |
| `update-athlete` | Renderer → Main | ❌ | Pendente — atualizar atleta |
| `delete-athlete` | Renderer → Main | ❌ | Pendente — remover atleta |

---

## 8. Rotas da Aplicação

| Rota | Componente | Status | Descrição |
|---|---|---|---|
| `/` | MenuInicial | ✅ | Menu principal com 3 opções |
| `/admin/criar-torneio` | CriarTorneio | ✅ | Formulário de criação |
| `/admin/importar-torneio` | ImportarTorneio | ✅ | Tela de importação |
| `/admin/listar-torneios` | ListarTorneios | ✅ | Lista com Iniciar / Exportar / Editar / Excluir |
| `/admin/dashboard` | — | ❌ | Pendente — Dashboard Administrativo |

### Fluxo de Navegação

```
[Menu Inicial]
  ├── Criar Torneio      → /admin/criar-torneio
  │                        └── (após criar) → /admin/listar-torneios
  │
  ├── Importar Torneio   → /admin/importar-torneio
  │                        └── (após importar) → /admin/listar-torneios
  │
   └── Listar Torneios    → /admin/listar-torneios
                           ├── [Iniciar] → /admin/dashboard
                           ├── [Editar] → /admin/dashboard (define como ativo)
                           ├── [Exportar] → diálogo "Salvar como"
                           └── [Excluir] → modal de confirmação → remove arquivo
```

---

## 9. Identidade Visual

### 9.1 Tema Principal

A identidade visual do sistema será inspirada em aplicações administrativas modernas, utilizando cores que transmitam organização, confiança e profissionalismo.

#### 9.1.1 Paleta de Cores

| Elemento | Cor | Uso |
|---|---|---|
| **Fundo principal** | Branco (`#FFFFFF`) | Fundo da interface |
| **Título principal** | Preto | Títulos e logotipo |
| **Botões / Destaques** | Azul Royal (`#1565C0`) | Botões primários, barra superior, menus ativos, indicadores, links |
| **Hover/Focus** | Azul escuro (`#0D47A1`) | Feedback visual em interações |
| **Texto secundário** | Cinza (`#666`) | Descrições e textos auxiliares |
| **Divisores/Bordas** | Cinza claro (`#E0E0E0`) | Separar elementos |
| **Confirmação** | Verde (`#2E7D32`) | Resultados positivos, status concluídos, aprovações |
| **Alerta** | Amarelo Royal | Alertas, avisos, destaques temporários, indicadores de atenção |

#### 9.1.2 Tipografia

| Elemento | Fonte | Peso | Tamanho |
|---|---|---|---|
| **Título principal** | Inter, sans-serif | Bold (700) | 28px–36px (clamp) |
| **Opções do menu** | Inter, sans-serif | Semibold (600) | 18px–22px |
| **Texto auxiliar** | Inter, sans-serif | Regular (400) | 14px |

---

## 10. Tela Inicial — Menu de Seleção

### 10.1 User Story

O usuário principal, após fechar as inscrições em seu sistema externo, abre o BJJ Tournament Manager para organizar o torneio que acontecerá no futuro. Ele então escolhe entre **criar um novo torneio** ou **importar um torneio** previamente exportado. Também pode **listar os torneios** já cadastrados para iniciar ou exportar um deles.

### 10.2 Descrição

A primeira tela do sistema exibe um menu com três opções principais:

1. **Criar Torneio** — Abertura do formulário de cadastro de um novo torneio.
2. **Importar Torneio** — Importação de um torneio a partir de um arquivo JSON.
3. **Listar Torneios** — Visualização de todos os torneios cadastrados, com ações de iniciar, editar, exportar ou excluir cada um.

> **Fluxo:** Criar e importar geram o arquivo JSON do torneio no disco. Para acessar o Dashboard Administrativo é necessário primeiro **iniciar** ou **editar** um torneio pela lista.

### 10.3 Layout

```
+--------------------------------------------------+
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │           BJJ TOURNAMENT MANAGER          │    |
|   │         Gerencie seu campeonato           │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │   [Ícone de troféu / plus]               │    |
|   │   Criar Torneio                          │    |
|   │   Cadastre um novo torneio               │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │   [Ícone de pasta / upload]              │    |
|   │   Importar Torneio                       │    |
|   │   Importe torneio de arquivo JSON        │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │   [Ícone de lista]                       │    |
|   │   Listar Torneios                        │    |
|   │   Veja todos os torneios cadastrados     │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
|   Pressione 1, 2 ou 3 para selecionar             |
|                                                    |
+--------------------------------------------------+
```

### 10.4 Componentes da Tela

1. **Logotipo / Título:** Centralizado no topo.
2. **Cartões de opção:** Cada opção é um cartão (Card do Mantine) com:
   - Ícone representativo (36px) na cor Azul Royal.
   - Título da opção em negrito.
   - Descrição curta em cinza (`#666`).
   - Sombra suave (box-shadow) para elevação.
   - Borda arredondada (`border-radius: md`).
3. **Instrução de navegação:** Texto centralizado na parte inferior indicando as teclas `1`, `2` ou `3`.

### 10.5 Comportamento

#### Abertura do sistema
- Ao iniciar o Electron, esta tela é carregada imediatamente como rota padrão (`/`).
- O menu é exibido sempre com as mesmas três opções, independentemente de haver torneios cadastrados ou não.

#### Seleção de opção
O usuário pode selecionar uma opção de três formas:
- **Clique/Touch:** Clica ou toca no cartão desejado.
- **Teclado numérico:** Pressiona `1` para Criar, `2` para Importar, `3` para Listar.
- **Tab + Enter:** Navega entre os cartões com Tab e confirma com Enter.

#### Feedback visual
- **Hover:** Cartão eleva-se ligeiramente (sombra mais pronunciada, translateY(-2px)).
- **Focus (teclado):** Anel de foco visível (outline Azul Royal) ao redor do cartão.
- **Active/Pressionado:** Efeito de clique (escala 0.98, sombra reduzida).
- **Transição:** Animações suaves de 200ms para hover, focus e active.

#### Navegação pós-seleção

| Opção | Ação |
|---|---|
| **Criar Torneio** | Redireciona para `/admin/criar-torneio`. |
| **Importar Torneio** | Redireciona para `/admin/importar-torneio`. |
| **Listar Torneios** | Redireciona para `/admin/listar-torneios`. |

### 10.6 Estados da Tela

| Estado | Descrição |
|---|---|
| **Normal** | Tela exibida com as três opções prontas para seleção. |

### 10.7 Acessibilidade

- Cartões utilizam `role="button"`, `tabIndex={0}` e `onKeyDown`.
- Atributos `aria-label` nos cartões.
- Suporte a navegação por teclado (Tab, Enter, teclas numéricas).

---

## 11. Requisitos Não Funcionais

### 11.1 Requisitos Gerais

O sistema deverá:

- Funcionar sem conexão com a internet.
- Possuir carregamento rápido.
- Ser capaz de armazenar milhares de atletas.
- Permitir backup manual dos arquivos JSON.
- Possuir interface responsiva para diferentes resoluções.
- Ser simples de instalar.
- Possuir estrutura de código organizada e escalável.
- Utilizar TypeScript em todo o projeto.
- Seguir os princípios **SOLID** em toda a arquitetura do código.
- Seguir as **boas práticas de programação** (código limpo, legível, testável e de fácil manutenção).

### 11.2 UI Responsiva — Tamanhos Proporcionais à Tela

Todos os elementos da interface (fontes, padding, margens, ícones, cartões, tabelas, modais, botões, inputs) devem ser proporcionais ao tamanho da janela, respeitando os princípios de UI e UX.

| Dispositivo | Largura típica | Comportamento |
|---|---|---|
| **Desktop / Notebook** | ≥ 1024px | Layout centralizado, cartões com largura máxima. |
| **Tablet** | 768px – 1023px | Cartões empilhados verticalmente, fonte ajustada. |
| **TV (monitor grande)** | ≥ 1920px | Escala proporcional. |
| **Resoluções muito baixas** | < 768px | Rolagem vertical se necessário; fonte reduzida. |

**Diretrizes de implementação:**

- **Viewport:** Usar `clamp()` para tamanhos de fonte e dimensões de componentes (ex.: `font-size: clamp(14px, 2vw, 18px)`).
- **Unidades relativas:** Preferir `rem`, `em`, `%` e `vw` sobre `px` fixos sempre que possível.
- **Espaçamentos:** `padding` e `margin` dos componentes Mantine devem usar valores relativos ou tokens de tema (`theme.spacing`), não `px` fixos.
- **Tabelas:** Em resoluções baixas, considerar scroll horizontal ou colunas responsivas (esconder colunas menos importantes).
- **Modais:** Largura do modal deve ser relativa à viewport (ex.: `90vw` em mobile, `40vw` em desktop).
- **Cartões do menu inicial:** Largura deve ser relativa ao container, não fixa.
- **Quebra de layout:** Testar em 1024px, 1280px, 1440px, 1920px e viewports menores que 768px.
- **Zoom do sistema:** A interface não deve quebrar com zoom de 100% a 150%.

### 11.3 Acessibilidade

- Contraste de cores deve atender WCAG AA (taxa mínima de 4.5:1 para texto normal).
- Suporte a `prefers-reduced-motion`.
- Navegação por teclado (Tab, Enter, teclas numéricas).
- Atributos `aria-label` em todos os elementos interativos.

---

## 12. Estrutura de Arquivos (Implementada)

```
bjj-tournament-manager-setup/
├── electron/
│   ├── main.ts              ← Registro dos handlers IPC, criação da janela
│   ├── preload.ts           ← Exposição dos canais IPC (contextBridge)
│   ├── tournament.ts        ← Lógica CRUD de torneios no sistema de arquivos
│   └── electron-env.d.ts    ← Tipos de ambiente Electron
│
├── src/
│   ├── main.tsx             ← Entry point React
│   ├── App.tsx              ← Rotas e providers (Mantine, Notifications, Router)
│   ├── vite-env.d.ts
│   ├── pages/
│   │   ├── MenuInicial.tsx      ← Tela inicial (Criar / Importar / Listar)
│   │   ├── CriarTorneio.tsx     ← Formulário de criação de torneio
│   │   ├── ImportarTorneio.tsx  ← Tela de importação com upload e validação
│   │   ├── ListarTorneios.tsx   ← Lista com ações Iniciar / Editar / Exportar / Excluir
│   │   └── Login.tsx            ← Tela de login (não integrada ao App)
│   ├── types/
│   │   ├── tournament.ts        ← Interfaces Torneio, CreateTorneioInput
│   │   └── electron.d.ts        ← Tipos globais do Window.electronAPI
│   ├── styles/
│   │   ├── theme.ts             ← Tema Mantine UI (cores, fontes, componentes)
│   │   └── global.css           ← Reset e estilos globais
│   └── assets/                  ← (vazio)
│
├── spec/
│   ├── tela-inicial-menu.md     ← Spec da tela inicial
│   ├── criar-torneio.md         ← Spec do gerenciamento de torneios
│   ├── cadastro-atletas.md      ← Spec do cadastro de atletas (não implementado)
│   └── validacao-credential.md  ← Spec da ativação do software (não implementado)
│
├── doc/
│   └── requisitos.md            ← Este documento
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── electron-builder.json5
├── .eslintrc.cjs
└── .gitignore
```
