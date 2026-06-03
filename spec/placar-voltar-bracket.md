# Spec: Placar - Correção do Botão Voltar (Bug Navegação para Tela em Branco)

## 1. Contexto e Objetivo

- **O que é:** Correção do botão "Voltar sem finalizar" (e do botão de back-arrow do `PageLayout`) na tela `PlacarLuta` que hoje navega para uma URL inválida e exibe uma tela em branco. A URL gerada não casa com nenhuma rota definida em `App.tsx`, então o React Router não consegue resolver a navegação.
- **Por que existe:** Bug introduzido quando a rota `PlacarBracket` foi definida como `/admin/placar/chave/:areaId/:chaveId` (dois parâmetros, singular "chave"). As navegações disparadas de dentro de `PlacarLuta` continuam montando a URL antiga com um único parâmetro (`/admin/placar/chave/${chaveId}`), que não casa com nenhuma rota e leva a tela em branco.
- **Quem usa:** Árbitros e administradores que iniciam uma luta em `PlacarBracket`, decidem não finalizar e precisam voltar ao bracket.
- **Escopo:** Corrigir as três navegações saindo de `PlacarLuta` para que voltem para `PlacarBracket` (`/admin/placar/chave/:areaId/:chaveId`) com ambos os parâmetros corretos. Fora de escopo: refatorar `PageLayout` para receber `backRoute` calculado, alterar rotas existentes, ou criar novo destino de "voltar".

## 2. Documentos de Referência

- `doc/spec.md` — Guia de especificação (este documento segue seu template)
- `spec/placar-jiu-jitsu.md` — Spec do placar funcional (seção 7 "Arquivos Envolvidos" lista `src/pages/PlacarLuta.tsx`)
- `spec/placar.md` — Spec do fluxo Placar (lista `PlacarLuta`, `PlacarBracket`, `PlacarChaves`)
- `src/App.tsx` — Definição das rotas (linha 49: `/admin/placar/chave/:areaId/:chaveId`)
- `src/pages/PlacarLuta.tsx` — Componente afetado (linhas 420, 451, 590)
- `src/pages/PlacarBracket.tsx` — Destino correto do "voltar" (usa `useParams<{ areaId, chaveId }>`)
- `src/components/PageLayout.tsx` — Componente que consome a prop `backRoute`

## 3. História de Usuário

Como árbitro de uma área de luta,
quero clicar em "Voltar sem finalizar" (ou no botão de back-arrow) durante uma luta em andamento e ser levado de volta ao bracket da chave,
para que eu possa consultar o estado das lutas da chave sem perder a navegação.

**Cenário principal:** Árbitro abriu `PlacarLuta`, percebeu que iniciou a luta errada ou que precisa conferir outra luta antes, clica em "Voltar sem finalizar" → sistema navega para o `PlacarBracket` da mesma chave e área, com a árvore de lutas visível.

**Cenários alternativos:**
- Após finalizar uma luta com sucesso (`handleConfirmarFinalizar`): o sistema deve voltar para o `PlacarBracket` para mostrar a chave atualizada com o vencedor já propagado. Hoje também vai para tela em branco.
- Back-arrow do `PageLayout` (canto superior esquerdo): mesmo comportamento esperado — voltar para o bracket.

## 4. Requisitos Funcionais

- [x] RF-01: O componente `PlacarLuta` deve extrair `areaId` da URL via `useParams` (hoje só extrai `chaveId` e `lutaId`).
- [x] RF-02: O `backRoute` do `PageLayout` em `PlacarLuta` deve apontar para `/admin/placar/chave/:areaId/:chaveId` (rota válida do `PlacarBracket`).
- [x] RF-03: O botão "Voltar sem finalizar" em `PlacarLuta` deve navegar para `/admin/placar/chave/:areaId/:chaveId` ao ser clicado.
- [x] RF-04: Após confirmar a finalização de uma luta (`handleConfirmarFinalizar`), o sistema deve navegar para `/admin/placar/chave/:areaId/:chaveId` (rota válida).
- [x] RF-05: As três navegações (RF-02, RF-03, RF-04) devem produzir URLs idênticas quando o componente é renderizado no mesmo `areaId`/`chaveId` (consistência).

## 5. Requisitos Não-Funcionais

- **Compatibilidade:** A mudança é puramente client-side (construção de string de URL). Não há mudança de rota, IPC, tipos ou backend.
- **Segurança:** Nenhuma — nenhuma rota protegida é afetada.
- **Observabilidade:** Erro de rota não resolvida deixa de acontecer; o `ErrorBoundary` deixa de capturar `Cannot read properties of undefined` em componentes que dependem de params obrigatórios.
- **Performance:** Sem impacto. A `useParams` do `react-router-dom` é um hook já importado.

## 6. Análise da Aplicação

### Arquitetura

```
Frontend (React + Mantine + react-router-dom HashRouter)
  └─ src/App.tsx                  — Definição das rotas
  └─ src/pages/PlacarLuta.tsx     — Componente afetado (3 navegações quebradas)
  └─ src/pages/PlacarBracket.tsx  — Destino correto (já lê areaId e chaveId da URL)
  └─ src/components/PageLayout.tsx — Renderiza o back-arrow via prop backRoute
```

### Rotas relevantes (de `src/App.tsx`)

| Linha | Path | Componente | Params |
|-------|------|------------|--------|
| 47 | `/admin/placar` | `PlacarMenu` | — |
| 48 | `/admin/placar/chaves/:areaId` | `PlacarChaves` | `areaId` (plural "chaves") |
| 49 | `/admin/placar/chave/:areaId/:chaveId` | `PlacarBracket` | `areaId`, `chaveId` (singular "chave") |
| 50 | `/admin/placar/luta/:chaveId/:lutaId` | `PlacarLuta` | `chaveId`, `lutaId` |

> ⚠️ **Inferência:** a rota de `PlacarLuta` (linha 50) recebe `chaveId` mas não `areaId`. A página precisa pedir `areaId` adicionalmente para construir URLs de volta ao `PlacarBracket`. Não há alternativa: o `PlacarLuta` é montado a partir do `PlacarBracket`, que conhece ambos os IDs.

### Fluxo de dados (navegação)

```
PlacarBracket (/admin/placar/chave/:areaId/:chaveId)
    │  handleIniciar(luta)  →  navigate(/admin/placar/luta/:chaveId/:lutaId)
    ▼
PlacarLuta (/admin/placar/luta/:chaveId/:lutaId)
    │  estado: useParams<{ chaveId, lutaId }>()  ← falta areaId
    │  back arrow   →  navigate(/admin/placar/chave/${chaveId})   ← ROTA INVÁLIDA
    │  "Voltar sem" →  navigate(/admin/placar/chave/${chaveId})   ← ROTA INVÁLIDA
    │  "Finalizar"  →  navigate(/admin/placar/chave/${chaveId})   ← ROTA INVÁLIDA
    ▼
(tela em branco — React Router não casa com nenhuma rota)
```

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `spec/placar-voltar-bracket.md` | Criar | Este documento (spec da feature) |
| `src/pages/PlacarLuta.tsx` | Modificar | Adicionar `areaId` ao `useParams`; corrigir 3 navegações (linhas 420, 451, 590) para incluir `${areaId}` |

> Nenhum outro arquivo precisa ser alterado. `PlacarBracket` já lê `areaId` da URL corretamente (linha 20), e as rotas em `App.tsx` estão corretas.

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- **Ausência de `areaId` no `useParams` de `PlacarLuta`:** a rota `/admin/placar/luta/:chaveId/:lutaId` não entrega `areaId`. Duas alternativas:
  - **(A) Alterar a rota** para `/admin/placar/luta/:areaId/:chaveId/:lutaId` — *não recomendado* porque quebraria o link de navegação existente em `PlacarBracket.handleIniciar` (linha 72 de `PlacarBracket.tsx`) e exigiria migração de URLs salvas.
  - **(B) Buscar o `areaId` indiretamente** a partir do `chaveId` carregado — *não recomendado* porque a chave pode (em tese) estar alocada em mais de uma área, criando ambiguidade.
  - **(C) Passar `areaId` via prop ou location state** — *possível* mas exige mudar a navegação em `PlacarBracket.handleIniciar` e todos os pontos de entrada.
  - **(D) Adicionar `areaId` como parâmetro da rota** — solução mínima, sem impacto em outros arquivos além de `PlacarLuta.tsx`.
  - **Escolha: (D)** — alterar a rota para `/admin/placar/luta/:areaId/:chaveId/:lutaId` e ajustar a navegação em `PlacarBracket.handleIniciar` (linha 72).
  
  > ⚠️ **Atenção:** isso afeta 1 chamada de `navigate` em `PlacarBracket.tsx:72` e a definição da rota em `App.tsx:50`. O custo é baixo (3 mudanças pequenas e bem localizadas) e a URL passa a ser auto-suficiente (qualquer página pode derivar o caminho de volta sem precisar carregar dados).

- **URL `chave` (singular) vs `chaves` (plural):** rota do `PlacarBracket` é singular e exige dois params; rota do `PlacarChaves` é plural e exige um param. A diferença está na URL e não é ambígua para o React Router, mas é fonte fácil de bugs manuais. Sinalizado em comentários inline (opcional).

### 8.2 Ambiguidades nos Requisitos

- **"Voltar para a área":** o usuário descreveu o destino como "a área". Confirmado com o usuário: destino é `PlacarBracket` (a tela de lutas da chave), não `PlacarChaves` (lista de chaves) nem `PlacarMenu` (seleção de área). **Resolvido.**

### 8.3 Riscos

- **Quebrar navegação de entrada:** alterar a rota `/admin/placar/luta/:chaveId/:lutaId` para `:areaId/:chaveId/:lutaId` exige atualizar o `navigate` em `PlacarBracket.handleIniciar`. Mitigação: alterar a rota e a chamada no mesmo commit.
- **URLs antigas em bookmarks/links externos:** o app é desktop (Electron) e usa `HashRouter`. Não há cenário realista de bookmark externo para essas URLs. Mitigação: aceitável.
- **Regressão no `PageLayout`:** o `backRoute` é genérico; se a prop for construída errada em outra tela, o mesmo bug pode existir. Fora do escopo deste fix; documento o padrão para evitar recorrência.

## 9. Critérios de Aceite

- [ ] CA-01: Dado que o usuário clicou "Iniciar" em uma luta no `PlacarBracket` e está em `/admin/placar/luta/:areaId/:chaveId/:lutaId`, ao clicar no back-arrow do `PageLayout`, o sistema deve navegar para `/admin/placar/chave/:areaId/:chaveId` (rota do `PlacarBracket`) e renderizar a árvore de lutas.
- [ ] CA-02: Na mesma condição de CA-01, ao clicar em "Voltar sem finalizar", o sistema deve navegar para `/admin/placar/chave/:areaId/:chaveId` e renderizar a árvore de lutas.
- [ ] CA-03: Na mesma condição de CA-01, ao clicar em "Finalizar Luta", confirmar o vencedor no modal e confirmar a gravação, o sistema deve navegar para `/admin/placar/chave/:areaId/:chaveId` e renderizar a chave atualizada com o vencedor propagado.
- [ ] CA-04: Nenhuma das três navegações deve produzir URL que não case com rota definida em `App.tsx` (sem tela em branco).
- [ ] CA-05: O componente `PlacarLuta` deve continuar exibindo a luta normalmente (cronômetro, placar, atletas) com a inclusão do `areaId` no `useParams`.

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Adicionar areaId à rota de PlacarLuta
  - O que fazer: Alterar a linha 50 de src/App.tsx de
    /admin/placar/luta/:chaveId/:lutaId
    para
    /admin/placar/luta/:areaId/:chaveId/:lutaId
  - Arquivo(s): src/App.tsx
  - Como validar: tsc --noEmit (deve passar)

Passo 2: Atualizar a navegação de entrada em PlacarBracket.handleIniciar
  - O que fazer: Alterar a linha 72 de src/pages/PlacarBracket.tsx de
    navigate(`/admin/placar/luta/${chaveId}/${luta.id}`)
    para
    navigate(`/admin/placar/luta/${areaId}/${chaveId}/${luta.id}`)
  - Arquivo(s): src/pages/PlacarBracket.tsx
  - Como validar: clicar "Iniciar" no PlacarBracket deve abrir o PlacarLuta sem erro 404 / tela em branco

Passo 3: Ler areaId no PlacarLuta
  - O que fazer: Alterar a linha 276 de src/pages/PlacarLuta.tsx de
    const { chaveId, lutaId } = useParams<{ chaveId: string; lutaId: string }>();
    para
    const { areaId, chaveId, lutaId } = useParams<{ areaId: string; chaveId: string; lutaId: string }>();
  - Arquivo(s): src/pages/PlacarLuta.tsx
  - Como validar: tsc --noEmit (deve passar)

Passo 4: Corrigir as 3 navegações em PlacarLuta
  - O que fazer: Substituir `/admin/placar/chave/${chaveId}` por `/admin/placar/chave/${areaId}/${chaveId}` em:
    - linha 420 (navigate após handleConfirmarFinalizar)
    - linha 451 (backRoute do PageLayout)
    - linha 590 (onClick do botão "Voltar sem finalizar")
  - Arquivo(s): src/pages/PlacarLuta.tsx
  - Como validar: as três ações (back-arrow, voltar sem finalizar, finalizar) devem levar ao PlacarBracket

Passo 5: Verificar lint e typecheck
  - O que fazer: Rodar npm run lint e tsc --noEmit
  - Arquivo(s): -
  - Como validar: sem erros
```

> ⚠️ **Ordem importa:** Passo 1 (rota) → Passo 2 (entrada) → Passo 3 (leitura) → Passo 4 (uso). Manter a ordem evita mismatch entre a URL gerada e a URL esperada.

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto. Mudança isolada a `PlacarLuta`, `PlacarBracket` e `App.tsx`. Sem migração de dados ou IPC.
- **Como monitorar:** Teste manual: `Dashboard → Placar → Área → Chave → Iniciar Luta → back-arrow / "Voltar sem finalizar" / "Finalizar Luta"`. Todos os três devem abrir o `PlacarBracket` com a árvore visível.
- **Plano de rollback:** Reverter commit. A rota antiga (`/admin/placar/luta/:chaveId/:lutaId`) deixa de funcionar, mas como o app é local, basta rebuild e reinstalar.

## 12. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite (CA-01 a CA-05) verificados manualmente
- [ ] `npm run lint` passa sem erros
- [ ] `tsc --noEmit` passa sem erros
- [ ] Rota `/admin/placar/luta/:areaId/:chaveId/:lutaId` documentada em `App.tsx`
- [ ] Nenhuma outra navegação no projeto usa `/admin/placar/chave/${chaveId}` (singular, 1 param) — grep de sanidade

## 13. Problema Original (de `doc/spec.md`)

> ## Problema
> O botão de voltar sem finalizar em placar, tem que voltar paara a area, ele esta indo para uma tela em branco

Causa raiz: a URL construída nas três navegações de `PlacarLuta` (`/admin/placar/chave/${chaveId}`) não casa com a rota `/admin/placar/chave/:areaId/:chaveId` definida em `App.tsx:49` — falta o `areaId`. O React Router não casa a URL, renderiza rota nula e o usuário vê tela em branco.

Correção: incluir `areaId` na URL, propagando-o da rota de entrada (`PlacarLuta`) para a URL de saída (voltar para `PlacarBracket`).

---

## Histórico de Alterações

| Data | Autor | Mudança |
|------|-------|---------|
| 02/06/2026 | opencode | Spec inicial criada a partir do problema descrito em `doc/spec.md` |
