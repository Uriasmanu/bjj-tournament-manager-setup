# Tela Inicial - Menu de Seleção

## Descrição

A primeira tela do sistema exibe um menu com duas opções principais que dão acesso aos dois módulos fundamentais do BJJ Tournament Manager:

1. **Dashboard Administrativo** — Acesso ao painel de gerenciamento do torneio (cadastro de atletas, chaves, categorias, confrontos, árbitros, áreas de luta, resultados, relatórios, etc.).
2. **Placar** — Exibição do placar ao vivo para a arena/público.

## Stack Tecnológico

- **Framework:** React + TypeScript
- **Componentes:** Mantine UI
- **Ícones:** Tabler Icons
- **Navegação:** React Router

## Identidade Visual

A tela deve seguir a identidade visual definida no documento de requisitos:

| Elemento | Cor | Uso |
|---|---|---|
| **Fundo** | Branco (`#FFFFFF`) | Fundo principal da tela |
| **Título principal** | Preto | "BJJ TOURNAMENT MANAGER" |
| **Subtítulo/Slogan** | Azul Royal (`#1565C0` ou similar) | Texto secundário |
| **Botão Dashboard** | Azul Royal (`#1565C0`) | Fundo do botão primário |
| **Botão Placar** | Azul com opacidade reduzida ou outline | Botão secundário |
| **Texto dos botões** | Branco | Rótulo das opções |
| **Hover/Focus** | Azul escuro (`#0D47A1`) | Feedback visual nos botões |
| **Divisores/Bordas** | Cinza claro (`#E0E0E0`) | Separar elementos |
| **Indicador de seleção** | Verde (`#2E7D32`) | Confirmação de seleção via teclado |

### Tipografia

- **Título:** Fonte sans-serif, peso bold (700), tamanho 28px–36px dependendo da resolução.
- **Opções do menu:** Fonte sans-serif, peso semibold (600), tamanho 18px–22px.
- **Texto auxiliar (instruções):** Fonte sans-serif, peso regular (400), tamanho 14px.

## Layout

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

### Descrição dos elementos

1. **Logotipo / Título:** Centralizado no topo. Pode conter um pequeno ícone ou símbolo (ex.: kimono / faixa) antes do texto.
2. **Cartões de opção:** Cada opção é um cartão (Card do Mantine) com:
   - Ícone representativo (32px–40px) na cor Azul Royal.
   - Título da opção em negrito.
   - Descrição curta do que a opção oferece, em cinza (#666).
   - Sombra suave (box-shadow) para elevação.
   - Borda arredondada (`border-radius: 8px–12px`).
3. **Instrução de navegação:** Texto centralizado na parte inferior indicando que o usuário pode pressionar as teclas `1` ou `2`.

## Comportamento

### Abertura do sistema
- Ao iniciar o Electron, esta tela é carregada imediatamente como rota padrão (`/`).
- O sistema deve verificar se há arquivos de dados (JSON) existentes; caso não haja nenhum campeonato criado, o menu ainda deve ser exibido normalmente — o Dashboard Administrativo levará à criação de um novo torneio.

### Seleção de opção
O usuário pode selecionar uma opção de três formas:
- **Clique/Touch:** Clica ou toca no cartão desejado.
- **Teclado numérico:** Pressiona `1` para Dashboard, `2` para Placar.
- **Tab + Enter:** Navega entre os cartões com Tab e confirma com Enter.

### Feedback visual
- **Hover:** Cartão eleva-se ligeiramente (sombra mais pronunciada), borda sutíl com Azul Royal.
- **Focus (teclado):** Anel de foco visível (outline Azul Royal) ao redor do cartão.
- **Active/Pressionado:** Efeito de clique (escala 0.98, sombra reduzida).
- **Transição:** Animações suaves de 200ms–300ms para hover, focus e active.

### Navegação pós-seleção

| Opção | Ação |
|---|---|
| **Dashboard Administrativo** | Redireciona para `/admin/login` (tela de autenticação) ou `/admin/dashboard` (se autenticação for opcional — a definir). |
| **Placar** | Redireciona para `/placar` (tela de placar ao vivo). |

## Responsividade

A tela deve se adaptar aos seguintes dispositivos (conforme requisitos):

| Dispositivo | Largura típica | Comportamento |
|---|---|---|
| **Desktop / Notebook** | ≥ 1024px | Layout centralizado com cartões lado a lado (se houver mais opções) ou empilhados com largura máxima de 480px. |
| **Tablet** | 768px – 1023px | Cartões empilhados verticalmente, fonte ajustada. Toque como input principal. |
| **TV (monitor grande)** | ≥ 1920px | Escala proporcional: título maior (40px+), cartões com mais padding. |
| **Resoluções muito baixas** | < 768px | Rolar verticalmente se necessário; fonte reduzida proporcionalmente. |

## Acessibilidade

- Todos os cartões devem ser elementos `<button>` ou `<a>` semânticos, ou utilizar o componente `Card` do Mantine com `role="button"`, `tabIndex={0}` e `onKeyDown`.
- Atributos `aria-label` nos cartões: "Dashboard Administrativo" e "Placar".
- Suporte a `prefers-reduced-motion`: desabilitar animações de transição se o usuário optar por redução de movimento.
- Contraste de cores deve atender WCAG AA (taxa de contraste mínima de 4.5:1 para texto normal).

## Conexão com Requisitos Não Funcionais

| Requisito | Como a tela atende |
|---|---|
| **Funcionar offline** | Tela estática, sem dependência de rede. Dados carregados de arquivos JSON locais. |
| **Carregamento rápido** | Tela sem chamadas assíncronas pesadas; renderização instantânea com React. |
| **Responsiva** | Layout adaptável conforme tabela de responsividade acima. |
| **Simples de instalar** | Tela faz parte do bundle Electron, nenhuma configuração extra necessária. |
| **TypeScript + SOLID** | Componente implementado com tipos definidos, responsabilidade única de apresentação, injeção de dependência para navegação. |

## Estados da Tela

| Estado | Descrição |
|---|---|
| **Normal** | Tela exibida com as duas opções prontas para seleção. |
| **Carregamento** | (Raro) Se houver verificação de dados na inicialização, exibir um `Loader` (spinner) do Mantine centralizado antes de renderizar o menu. |
| **Fallback / Erro** | Se ocorrer um erro grave ao carregar configurações, exibir uma mensagem amigável com botão "Tentar novamente". |

## Observações

- O menu deve ser de fácil leitura em dispositivos usados na arena (tablets, TVs, notebooks).
- As opções podem ser acionadas por toque, mouse ou teclado numérico.
- A tela não deve exigir autenticação para ser acessada — é o ponto de entrada público do sistema.
- Considerar adicionar um rodapé opcional com versão do software e ano.
