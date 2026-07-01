# Implementado: Placar Layout Compacto + Ctrl+Z + Ajuste Tamanho AtletaPanel

**Data:** 2026-06-30

## Problemas Resolvidos

1. **Placar não cabia em 100% da altura da tela** — gerava scroll vertical.
2. **Botão Voltar ficava acima do Paper** — desperdiçava espaço vertical.
3. **Dois botões de iniciar tempo** — botão dedicado + cronômetro clicável causavam confusão.
4. **Vantagens e punições ficavam ocultas** — falta de espaço empurrava para fora da viewport.
5. **Sem atalho para zerar placar** — operador precisava clicar em "Zerar" manualmente.
6. **AtletaPanel com informações pequenas** — fontes, botões e labels muito compactos, difíceis de ler.

## Soluções Implementadas

### 1. PageLayout — Botão Voltar ao Lado do Título

- Botão `IconArrowLeft` movido de acima do Paper para dentro dele, ao lado esquerdo do título.
- `Group wrap="nowrap" gap="xs"` garante que título e botão fiquem na mesma linha.
- Padding reduzido: `clamp(8px, 1.5vw, 16px)` (era `clamp(12px, 2vw, 24px)`).
- Container padding: `clamp(4px, 0.8vw, 8px)` (era `clamp(12px, 2vw, 24px)`).
- Título com `Title order={4}` (era `order={3}`) e `whiteSpace: nowrap`.

### 2. PlacarLuta e PlacarLutaCasada — Layout Compacto

- **Stack gap:** `sm` → `xs` no container principal.
- **Barra de controles:**
  - Botões "Zerar" e "Iniciar/Pausar" em `size="xs"`.
  - "Iniciar/Pausar" com `variant="light"` (menos peso visual).
  - Badge IBJJF reduzido: `size="xs"`, texto "IBJJF · Xmin".
  - Tempo editável: `size="xs"`, `w={80}`.
- **Cronômetro:**
  - Padding: `p="xs"` (era `p="sm"`).
  - Fonte "TEMPO ESGOTADO": `clamp(28px, 4vw, 60px)` (era `clamp(40px, 6vw, 80px)`).
  - Texto hint: `size="xs"` (era `size="md"`).
- **AtletaPanel — Ajuste de Tamanho:**
  - Padding: `p="sm"` (era `p="xs"`, retornou de `p="md"` original).
  - Stack gap: `6` (era `4`).
  - ActionIcons pontos: 36×36px com `size="md"` (era 30×30px `size="sm"`).
  - ActionIcons vant/pun: 32×32px com `size="md"` (era 26×26px `size="sm"`).
  - Labels nome/faixa/equipe: `size="sm"` (era `size="xs"`).
  - Fontes aumentadas: Total `clamp(52px, 4vw, 90px)`, Counter `clamp(28px, 2vw, 48px)`, Vant/Pun `clamp(20px, 1.8vw, 32px)`, Nome `clamp(22px, 2vw, 36px)`.
  - Texto label "pts" restaurado: `+{pontos} pts`.
- **Footer buttons:**
  - `size="xs"` (era `size="md"`).
  - Texto encurtado: "Finalizar", "Voltar", "Telão".
  - `leftSection` icons: `size={14}` (era `size={16}`).

### 3. Hook useCtrlZReset

- Hook customizado que adiciona listener de `keydown` para `Ctrl+Z` / `Cmd+Z`.
- Chama `handleZerar()` que:
  - Pausa o cronômetro (`setRodando(false)`).
  - Restaura o tempo: `setTempoRestante(tempoInicial)`.
- Implementado via `useRef` para evitar stale closures.
- Registrado em ambas as telas (`PlacarLuta` e `PlacarLutaCasada`).

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/components/PageLayout.tsx` | Botão voltar ao lado do título, padding reduzido |
| `src/pages/PlacarLuta.tsx` | Layout compacto, hook Ctrl+Z, sem botão duplicado, painéis maiores |
| `src/pages/PlacarLutaCasada.tsx` | Layout compacto, hook Ctrl+Z, sem botão duplicado, painéis maiores |

## RF

- RF1: Placar cabe em 100% da altura da tela sem scroll em qualquer lugar.
- RF2: Botão voltar posicionado ao lado esquerdo do título do placar.
- RF3: Apenas uma forma de iniciar/pausar o tempo (cronômetro clicável + barra compacta).
- RF4: Ctrl+Z zera placar e restaura tempo cheio.
- RF5: Vantagens e punições sempre visíveis na tela.
- RF6: Painéis Atleta A/B com informações maiores e melhor distribuídas.

## CA

- CA1: `PageLayout` renderiza botão voltar dentro do Paper ao lado do título.
- CA2: Stack principal usa `overflow: hidden` e `gap="xs"`.
- CA3: AtletaPanel cabe no espaço disponível com `flex: 1` e `minHeight: 0`.
- CA4: Hook `useCtrlZReset` registra e limpa listener de `keydown`.
- CA5: ActionIcons de pontos usam `size="md"` (36×36px) e vant/pun `size="md"` (32×32px).
- CA6: Fontes do AtletaPanel usam `clamp()` com valores maiores que o anterior.
