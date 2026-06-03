# Feature: PlacarMenu — Botão Voltar para Dashboard

> Documento de especificação seguindo o guia em `doc/spec.md`.

---

## Problema (origem)

A tela de seleção de área (`PlacarMenu.tsx`) não possui um botão para retornar ao Dashboard. Diferente das demais telas que usam `PageLayout` (que fornece o botão "Voltar" via `backRoute`), o `PlacarMenu` usa layout manual sem `PageLayout`, impedindo o usuário de navegar de volta ao Dashboard sem usar o browser.

---

## 1. Contexto e Objetivo

- **O que é:** Adicionar botão "Voltar" no `PlacarMenu` que navegue para `/admin/dashboard`.
- **Por que existe:** O usuário que acessa a tela de seleção de área (Placar) não consegue retornar ao Dashboard, pois o componente não usa `PageLayout` e não possui nenhum botão de navegação de retorno.
- **Quem usa:** Operadores que acessam o Placar para selecionar uma área de luta.
- **Escopo:**
  - **Dentro:**
    - Adicionar `PageLayout` ao `PlacarMenu` com `backRoute="/admin/dashboard"`.
    - Ajustar o layout interno para funcionar com `PageLayout`.
  - **Fora:**
    - Nenhuma alteração em `PlacarChaves`, `PlacarBracket` ou `PlacarLuta`.
    - Nenhuma alteração no backend.

---

## 2. Análise dos Documentos de Referência

- `doc/spec.md` — guia de spec seguido.
- `doc/requisitos.md:453-455` — seção 3.18 define fluxo "Dashboard → Placar → PlacarMenu (seleção de área)".
- `doc/requisitos.md:353-386` — seção 3.14 define que todas as páginas devem usar `PageLayout`.
- `src/pages/PlacarMenu.tsx` — tela atual sem botão de voltar.
- `src/components/PageLayout.tsx` — layout padrão com botão "Voltar" via `backRoute`.

---

## 3. História de Usuário

```
Como operador do placar,
quero um botão para voltar ao Dashboard na tela de seleção de área,
para que eu possa retornar facilmente sem precisar usar atalhos do navegador.
```

---

## 4. Requisitos Funcionais

- [ ] **RF-01:** O `PlacarMenu` deve usar `PageLayout` com `backRoute="/admin/dashboard"`.
- [ ] **RF-02:** O botão "Voltar" (ícone de seta) deve estar visível no topo da página.
- [ ] **RF-03:** Ao clicar no botão "Voltar", o usuário é redirecionado para `/admin/dashboard`.
- [ ] **RF-04:** O layout deve ocupar 95% da largura e 90% da altura (padrão do `PageLayout`).

---

## 5. Requisitos Não-Funcionais

- **Performance:** Sem impacto.
- **Acessibilidade:** Botão com `aria-label="Voltar"` fornecido pelo `PageLayout`.

---

## 6. Análise da Aplicação

- **Arquitetura:** React 18 + Mantine UI 7 + Vite. Roteamento via `HashRouter`.
- **Padrões em uso:** `PageLayout` é o layout padrão para todas as páginas administrativas, conforme requisito 3.14.
- **Fluxo de dados:** Navegação via `useNavigate` do React Router.
- **Rotas:** `/admin/placar` → `PlacarMenu`.

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/pages/PlacarMenu.tsx` | Modificar | Envolver conteúdo em `PageLayout` com `backRoute="/admin/dashboard"`. |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- Nenhum. O `PlacarMenu` atualmente usa layout manual (Container + Paper). Basta substituir por `PageLayout`.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma.

### 8.3 Riscos
- Baixo. Mudança isolada a um componente de página.

---

## 9. Critérios de Aceite

- [ ] **CA-01:** Dado o `PlacarMenu` renderizado, quando o usuário visualiza a página, então um botão "Voltar" (ícone de seta) está presente no topo.
- [ ] **CA-02:** Dado o `PlacarMenu` com o botão "Voltar" visível, quando o usuário clica no botão, então a navegação segue para `/admin/dashboard`.
- [ ] **CA-03:** O layout ocupa a largura e altura adequadas (padrão `PageLayout`).

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Criar documento de spec
  - O que fazer: Escrever spec/placar-menu-voltar-dashboard.md
  - Arquivo(s): spec/placar-menu-voltar-dashboard.md
  - Como validar: Documento completo com todas as seções.

Passo 2: Implementar PageLayout no PlacarMenu
  - O que fazer: Em src/pages/PlacarMenu.tsx:
    (a) Substituir Container + Paper externo por PageLayout com backRoute="/admin/dashboard".
    (b) Manter o conteúdo interno (Select, Button) dentro do PageLayout.
    (c) Remover o estilo manual de altura/largura, pois PageLayout já provê.
  - Arquivo(s): src/pages/PlacarMenu.tsx
  - Como validar: Visualizar tela com botão Voltar no topo, layout responsivo.

Passo 3: Validar com lint e typecheck
  - O que fazer: Rodar npm run lint e npx tsc --noEmit.
  - Como validar: Ambos retornam 0.
```

---

## 12. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto. Sem feature flag.
- **Plano de rollback:** Reverter a alteração em `PlacarMenu.tsx`.

---

## 13. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite (CA-01 a CA-03) verificados.
- [ ] Lint (`npm run lint`) passa sem warnings/erros novos.
- [ ] Typecheck (`npx tsc --noEmit`) passa sem erros.
- [ ] Documento de spec (`spec/placar-menu-voltar-dashboard.md`) criado e coerente.

---

## Registro de Correções (Problema)

| Data | Iteração | Correção aplicada |
|------|----------|-------------------|
| 2026-06-03 | 1 | Implementação inicial: PlacarMenu agora usa PageLayout com botão Voltar para Dashboard. |
