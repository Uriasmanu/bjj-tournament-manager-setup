# Feature: BracketTree — Seguir Tema Mantine

> Documento de especificação seguindo o guia em `doc/spec.md`.

---

## Problema (origem)

O componente `BracketTree.tsx` atualmente utiliza cores escuras hardcoded (`#020617`, `#0f172a`, `#1e293b`, `#064e3b`) que não seguem o tema Mantine da aplicação (azul royal `#1565C0`). O componente deve usar tokens do tema Mantine para manter consistência visual com o resto do sistema.

---

## 1. Contexto e Objetivo

- **O que é:** Atualizar o componente `BracketTree` para utilizar cores e estilos do tema Mantine em vez de valores hardcoded escuros.
- **Por que existe:** O sistema usa Mantine UI 7 com tema azul royal (`#1565C0`) e fundo claro. O `BracketTree` com fundo escuro destoa completamente do resto da aplicação, violando a consistência de tema definida nos requisitos.
- **Quem usa:** Árbitros e operadores que visualizam a árvore de chaves na tela `PlacarBracket`.
- **Escopo:**
  - **Dentro:**
    - Substituir cores hardcoded no `BracketTree.tsx` por tokens do tema Mantine (`theme.colors`, `theme.white`, `theme.black`, etc.).
    - Ajustar `Card` interno para usar fundo claro, bordas e cores de texto do tema.
    - Usar `useMantineTheme()` ou `useMantineColorScheme()` para obter as cores corretas.
  - **Fora:**
    - Nenhuma alteração na lógica de conexões/linhas do bracket.
    - Nenhuma alteração em outros componentes.
    - Nenhuma alteração no `PlacarBracket.tsx`.

---

## 2. Análise dos Documentos de Referência

- `doc/spec.md` — guia de spec seguido.
- `doc/requisitos.md` — seção 2.1 define tema "azul royal (#1565C0), fonte Inter". Seção 3.14 define uso de `PageLayout` e padrões de layout.
- `src/components/BracketTree.tsx` — componente com cores dark hardcoded.
- `src/pages/PlacarBracket.tsx` — página que consome `BracketTree` com `Paper` de fundo branco (`#FFF`).

---

## 3. História de Usuário

```
Como operador do placar,
quero que a árvore de chaves (bracket tree) siga o tema visual do resto do sistema,
para que a interface seja consistente e profissional.
```

---

## 4. Requisitos Funcionais

- [ ] **RF-01:** O fundo do container do `BracketTree` deve usar `theme.colors.gray[0]` (fundo claro) ou similar do tema Mantine, não `#020617`.
- [ ] **RF-02:** Os cards de luta devem usar `theme.white` como fundo e `theme.colors.gray[3]` como borda.
- [ ] **RF-03:** O texto dos cards deve usar `theme.black` ou `theme.colors.gray[9]`.
- [ ] **RF-04:** O slot vencedor deve usar cor de destaque do tema (ex: `theme.colors.green[1]` ou `theme.colors.blue[1]`) em vez de `#064e3b`.
- [ ] **RF-05:** As linhas de conexão entre lutas devem usar `theme.colors.gray[4]`.
- [ ] **RF-06:** O label "LUTA #N" deve usar `theme.colors.gray[5]`.

---

## 5. Requisitos Não-Funcionais

- **Performance:** Sem impacto — apenas troca de cores estáticas por tokens do tema.
- **Acessibilidade:** Contrastes mantidos ou melhorados com as cores do tema.
- **Manutenibilidade:** Uso de tokens do tema em vez de cores mágicas facilita manutenção futura.

---

## 6. Análise da Aplicação

- **Arquitetura:** React 18 + Mantine UI 7 + Vite. Tema definido em `src/styles/theme.ts`.
- **Padrões em uso:** Componentes funcionais com hooks. Tema Mantine injetado via `MantineProvider`.
- **Fluxo de dados:** `PlacarBracket` carrega `Chave` e passa para `BracketTree` via props. `BracketTree` é puramente visual.
- **Contratos de API:** Nenhum — mudança puramente de estilo no componente.

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/components/BracketTree.tsx` | Modificar | Substituir cores hardcoded por tokens do tema Mantine. |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- Nenhum. Mudança puramente estilística, sem lógica.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma.

### 8.3 Riscos
- Baixo. Mudança isolada ao componente `BracketTree`. Aparência pode diferir levemente, mas visualmente mais consistente com o resto do sistema.

---

## 9. Critérios de Aceite

- [ ] **CA-01:** O fundo do `BracketTree` é claro (usa cor do tema Mantine, não preto/azul escuro).
- [ ] **CA-02:** Os cards de luta têm fundo branco com borda cinza clara.
- [ ] **CA-03:** O texto dos cards está em cor escura legível (preto/cinza escuro).
- [ ] **CA-04:** O vencedor destacado usa uma cor de destaque do tema (verde ou azul claro).
- [ ] **CA-05:** As linhas de conexão estão em cinza claro (#dee2e6 ou similar).
- [ ] **CA-06:** Nenhuma regressão visual no `PlacarBracket` ou em outros componentes.

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Criar documento de spec
  - O que fazer: Escrever spec/bracket-tree-tema-mantine.md
  - Arquivo(s): spec/bracket-tree-tema-mantine.md
  - Como validar: Documento completo com todas as seções.

Passo 2: Implementar tema Mantine no BracketTree
  - O que fazer: Em src/components/BracketTree.tsx:
    (a) Importar useMantineTheme de @mantine/core.
    (b) Chamar useMantineTheme() no componente BracketTree.
    (c) Substituir cores hardcoded por tokens do tema.
    (d) Passar theme como props para Card ou usar useContext.
  - Arquivo(s): src/components/BracketTree.tsx
  - Como validar: Visualmente o bracket tree deve estar em fundo claro.

Passo 3: Validar com lint e typecheck
  - O que fazer: Rodar npm run lint e npx tsc --noEmit.
  - Como validar: Ambos retornam 0.
```

---

## 12. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (mudança de estilo, sem migração). Sem feature flag.
- **Como monitorar:** Inspeção visual da tela de bracket.
- **Plano de rollback:** Reverter a alteração em `BracketTree.tsx`.

---

## 13. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite (CA-01 a CA-06) verificados visualmente.
- [ ] Lint (`npm run lint`) passa sem warnings/erros novos.
- [ ] Typecheck (`npx tsc --noEmit`) passa sem erros.
- [ ] Documento de spec (`spec/bracket-tree-tema-mantine.md`) criado e coerente.

---

## Registro de Correções (Problema)

| Data | Iteração | Correção aplicada |
|------|----------|-------------------|
| 2026-06-03 | 1 | Implementação inicial: substituição de cores dark hardcoded por tokens do tema Mantine. |
