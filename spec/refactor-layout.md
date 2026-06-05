# Spec: Refactor Completo do Layout (Aparência Moderna)

## 1. Contexto e Objetivo

- **O que é:** Substituir o layout visual de TODAS as páginas e componentes da aplicação BJJ Tournament Manager por um design moderno, consistente e profissional, mantendo **zero alterações na lógica de negócio, estado ou comportamento**.
- **Por que existe:** O layout atual usa estilos inline, cores hardcoded, padrões repetitivos de hover, e não aproveita os defaults do tema Mantine. A identidade visual não é consistente entre páginas.
- **Quem usa:** Todos os usuários finais (visual mais agradável) e desenvolvedores (manutenção facilitada com componentes reutilizáveis).
- **Escopo:**
  - **Dentro:** `theme.ts`, `global.css`, `PageLayout.tsx`, todas as 19 páginas, todos os 9 componentes compartilhados.
  - **Fora:** Lógica de negócio (`electron/`), tipos (`src/types/`), hooks IPC, rotas (`App.tsx`).

## 2. Análise dos Documentos de Referência

- **Requisitos** (`doc/requisitos.md`): §9.1.1 define paleta (Azul Royal `#1565C0`), §9.2 define tipografia Inter com `clamp()`, §9.3 define responsividade, §10 define layout do menu inicial.
- **Tema existente** (`src/styles/theme.ts`): Já define cores, falta `defaultProps` para Cards, Paper, Table, Modal.
- **Código-fonte:** 30+ arquivos com padrões repetitivos de hover/transform inline.

## 3. História de Usuário

```
Como usuário do BJJ Tournament Manager,
quero uma interface visual moderna, consistente e profissional,
para que eu me sinta confiante ao usar o software em eventos reais.
```

## 4. Requisitos Funcionais (Layout)

- [x] RF-01: PageLayout com header gradient azul royal (#1565C0 → #0d47a1) fixo no topo
- [x] RF-02: Componente MenuCard reutilizável (Card com hover/active padronizados)
- [x] RF-03: theme.ts com defaultProps globais para Card, Paper, Table, Button, Input, Modal
- [x] RF-04: Todas as páginas de menu (MenuInicial, AthletesMenu, ArbitrosMenu, AreasMenu) usam MenuCard
- [x] RF-05: Dashboard usa MenuCard e grid responsivo
- [x] RF-06: Tabelas (AdminAthletes, AdminArbitros, AdminAreas, ListarTorneios, Equipes) com Table striped + highlightOnHover via tema
- [x] RF-07: Toolbars padronizadas com Group justify="space-between" e botões consistentes
- [x] RF-08: Modals com inputs usando defaultProps do tema
- [x] RF-09: BracketTree com fundo e bordas consistentes com o tema
- [x] RF-10: Scoreboard (PlacarLuta/PlacarLutaCasada) mantém design azul anil/branco

## 5. Requisitos Não-Funcionais

- **Performance:** Sem impacto (apenas CSS e props, sem novas bibliotecas).
- **Acessibilidade:** Manter contraste WCAG AA, `role="button"`, `tabIndex`, `aria-label`.
- **Compatibilidade:** 100% igual, zero regressão de comportamento.

## 6. Análise da Aplicação

- **PageLayout** é o wrapper de todas as páginas — mudá-lo impacta tudo.
- **Theme.ts** controla defaults globais do Mantine — mudar defaultProps afeta todos os componentes.
- **MenuCard** extrai padrão repetitivo de 4 páginas.
- **19 páginas + 9 componentes** precisam de revisão visual.

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/styles/theme.ts` | Modificar | Adicionar defaultProps |
| `src/styles/global.css` | Modificar | Aprimorar background gradient |
| `src/components/PageLayout.tsx` | Reescrever | Header moderno com gradient |
| `src/components/MenuCard.tsx` | Criar | Componente reutilizável de card |
| `src/pages/*.tsx` (19) | Modificar | Usar MenuCard + remover estilos inline |
| `src/components/*.tsx` (9) | Modificar | Padronizar com tema |

## 8. Problemas e Impedimentos

Nenhum. Todas as mudanças são puramente visuais.

## 9. Critérios de Aceite

- [x] PageLayout renderiza header gradient azul com título + botão voltar
- [x] MenuCard funciona com hover/active/keyboard consistentes
- [x] Nenhum style inline de hover/transform em páginas que usam MenuCard
- [x] Tabelas têm striped + highlightOnHover
- [x] Botões e inputs têm tamanho md por padrão
- [x] Zero warnings/erros tsc
- [x] Todas as funcionalidades originais intactas

## 10. Plano de Implementação

```
Fase 1: Core — theme.ts, global.css, PageLayout.tsx, MenuCard.tsx
Fase 2: Páginas de menu — MenuInicial, Dashboard, AthletesMenu, ArbitrosMenu, AreasMenu
Fase 3: CRUD — CriarTorneio, ImportarTorneio, ListarTorneios
Fase 4: Admin — AdminAthletes, AdminArbitros, AdminAreas, Equipes
Fase 5: Placar — PlacarMenu, PlacarChaves, PlacarBracket
Fase 6: Secundárias — GerenciarChaves, Resultados
Fase 7: Modals — AthleteForm, ArbitroForm, AreaForm, ModalCriarLutaCasada
Fase 8: Verificação — tsc + revisão
```

## 11. Rollout e Observabilidade

Deploy direto. Verificar visualmente cada página.

## 12. Definição de Pronto (DoD)

- [x] Todos os critérios de aceite verificados
- [x] Código revisado
- [x] Documentação atualizada (spec + requisitos.md + spec.md)
- [x] tsc passou limpo
- [x] Histórico de Correções atualizado
