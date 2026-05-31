# BJJ Tournament Manager

## 1. Visão Geral

O **BJJ Tournament Manager** é um software desktop desenvolvido para gerenciamento completo de campeonatos de Jiu-Jitsu.

O sistema será responsável por controlar todas as etapas do evento, desde o cadastro dos participantes até a definição dos campeões de cada categoria, incluindo gerenciamento de chaves, acompanhamento de lutas em tempo real, placares, árbitros, áreas de luta e resultados.

O objetivo é fornecer uma solução centralizada para organizadores, árbitros e equipes, reduzindo erros operacionais e agilizando a condução dos campeonatos.

---

## 2. Objetivos do Sistema

O sistema deverá permitir:

* Cadastro de atletas.
* Cadastro de equipes.
* Cadastro de campeonatos.
* Cadastro de categorias.
* Controle de inscrições.
* Controle de pesagem.
* Geração automática de chaves.
* Gerenciamento de áreas de luta.
* Gerenciamento de árbitros.
* Controle de chamadas para as lutas.
* Controle de placares.
* Registro de resultados.
* Definição automática dos vencedores das chaves.
* Exibição de rankings e medalhistas.
* Emissão de relatórios.
* Exportação e importação de dados.
* Operação totalmente offline.

---

## 3. Plataforma

A aplicação será desenvolvida para:

* Windows 10
* Windows 11

O sistema será distribuído como software desktop utilizando Electron.

---

## 4. Stack Tecnológica

### Desktop

* Electron

### Interface

* React
* TypeScript

### Componentes Visuais

* Mantine UI
* Tabler Icons

### Navegação

* React Router

---

## 5. Persistência de Dados

O sistema utilizará exclusivamente arquivos JSON para armazenamento local.

Não haverá dependência de banco de dados externo.

Toda a operação deverá funcionar offline.

---

## 6. Identidade Visual

### 6.1 Tema Principal

A identidade visual do sistema será inspirada em aplicações administrativas modernas, utilizando cores que transmitam organização, confiança e profissionalismo.

#### 6.1.1 Paleta de Cores

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

#### 6.1.2 Tipografia

| Elemento | Fonte | Peso | Tamanho |
|---|---|---|---|
| **Título principal** | Sans-serif | Bold (700) | 28px–36px |
| **Opções do menu** | Sans-serif | Semibold (600) | 18px–22px |
| **Texto auxiliar** | Sans-serif | Regular (400) | 14px |

---

## 7. Tela Inicial — Menu de Seleção

### 7.1 Descrição

A primeira tela do sistema exibe um menu com duas opções principais que dão acesso aos dois módulos fundamentais do sistema:

1. **Dashboard Administrativo** — Acesso ao painel de gerenciamento do torneio.
2. **Placar** — Exibição do placar ao vivo para a arena/público.

### 7.2 Layout

```
+--------------------------------------------------+
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │           BJJ TOURNAMENT MANAGER          │    |
|   │         Gerencie seu campeonato           │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │   [Ícone de engrenagem]                  │    |
|   │   Dashboard Administrativo               │    |
|   │   Gerencie atletas, chaves e resultados  │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
|   ┌──────────────────────────────────────────┐    |
|   │   [Ícone de tela/exibição]              │    |
|   │   Placar                                 │    |
|   │   Exibição ao vivo para a arena          │    |
|   └──────────────────────────────────────────┘    |
|                                                    |
|   Pressione 1 ou 2 para selecionar                |
|                                                    |
+--------------------------------------------------+
```

### 7.3 Componentes da Tela

1. **Logotipo / Título:** Centralizado no topo. Pode conter um ícone ou símbolo (kimono/faixa) antes do texto.
2. **Cartões de opção:** Cada opção é um cartão (Card do Mantine) com:
   - Ícone representativo (32px–40px) na cor Azul Royal.
   - Título da opção em negrito.
   - Descrição curta em cinza (`#666`).
   - Sombra suave (box-shadow) para elevação.
   - Borda arredondada (`border-radius: 8px–12px`).
3. **Instrução de navegação:** Texto centralizado na parte inferior indicando as teclas `1` ou `2`.

### 7.4 Comportamento

#### Abertura do sistema
- Ao iniciar o Electron, esta tela é carregada imediatamente como rota padrão (`/`).
- Caso não haja nenhum campeonato criado, o menu ainda deve ser exibido normalmente — o Dashboard levará à criação de um novo torneio.

#### Seleção de opção
O usuário pode selecionar uma opção de três formas:
- **Clique/Touch:** Clica ou toca no cartão desejado.
- **Teclado numérico:** Pressiona `1` para Dashboard, `2` para Placar.
- **Tab + Enter:** Navega entre os cartões com Tab e confirma com Enter.

#### Feedback visual
- **Hover:** Cartão eleva-se ligeiramente (sombra mais pronunciada), borda sutil com Azul Royal.
- **Focus (teclado):** Anel de foco visível (outline Azul Royal) ao redor do cartão.
- **Active/Pressionado:** Efeito de clique (escala 0.98, sombra reduzida).
- **Transição:** Animações suaves de 200ms–300ms para hover, focus e active.

#### Navegação pós-seleção

| Opção | Ação |
|---|---|
| **Dashboard Administrativo** | Redireciona para `/admin/chave-seguranca` (tela de inserção da chave de segurança). |
| **Placar** | Redireciona para `/placar` (tela de placar ao vivo). |

### 7.5 Estados da Tela

| Estado | Descrição |
|---|---|
| **Normal** | Tela exibida com as duas opções prontas para seleção. |
| **Carregamento** | Se houver verificação de dados na inicialização, exibir um `Loader` (spinner) do Mantine centralizado. |
| **Fallback / Erro** | Se ocorrer um erro grave ao carregar configurações, exibir mensagem amigável com botão "Tentar novamente". |

### 7.6 Acessibilidade

- Cartões devem ser elementos `<button>` ou `<a>` semânticos, ou utilizar `Card` do Mantine com `role="button"`, `tabIndex={0}` e `onKeyDown`.
- Atributos `aria-label` nos cartões: "Dashboard Administrativo" e "Placar".
- Suporte a `prefers-reduced-motion`: desabilitar animações se o usuário optar por redução de movimento.
- Contraste de cores deve atender WCAG AA (taxa de contraste mínima de 4.5:1 para texto normal).

---

## 8. Requisitos Não Funcionais

### 8.1 Requisitos Gerais

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

### 8.2 Responsividade

| Dispositivo | Largura típica | Comportamento |
|---|---|---|
| **Desktop / Notebook** | ≥ 1024px | Layout centralizado, cartões com largura máxima de 480px. |
| **Tablet** | 768px – 1023px | Cartões empilhados verticalmente, fonte ajustada. |
| **TV (monitor grande)** | ≥ 1920px | Escala proporcional: título maior (40px+), cartões com mais padding. |
| **Resoluções muito baixas** | < 768px | Rolagem vertical se necessário; fonte reduzida proporcionalmente. |

### 8.3 Acessibilidade

- Contraste de cores deve atender WCAG AA (taxa mínima de 4.5:1 para texto normal).
- Suporte a `prefers-reduced-motion`.
- Navegação por teclado (Tab, Enter, teclas numéricas).
- Atributos `aria-label` em todos os elementos interativos.