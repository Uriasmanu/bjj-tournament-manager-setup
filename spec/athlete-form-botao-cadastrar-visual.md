# Botão "Cadastrar Atleta" do AthleteForm — Correção Visual

> Spec para o item `[aberto]` de `doc/spec.md`:
> *"Botao cadastrar atleta no formulario esta feio"*

---

## 1. Contexto e Objetivo

- **O que é:** corrigir o estilo do botão de submit `Cadastrar Atleta` / `Salvar Alterações` do modal `AthleteForm.tsx` para que fique visualmente coerente com o sistema de design do app.
- **Por que existe:** o botão atual usa uma paleta verde (`#78a890`) e dimensões (`padding: 16px`, `borderRadius: 8`) que destoam do restante do app, que adota o azul primário `#1b325f` e `borderRadius: 12`. O resultado é um botão "gordo" e com cor fora do tema, gerando inconsistência visual e reclamação do usuário.
- **Quem usa:** organizadores que cadastram ou editam atletas pelo modal.
- **Escopo:**
  - **Dentro:** `src/components/AthleteForm.tsx` — apenas as props `styles` do `<Button type="submit">` e inclusão de `leftSection` com `IconUserPlus` para indicar a ação.
  - **Fora:** demais botões do app (estão OK); tema global (`src/styles/theme.ts`); `ArbitroForm` e `AreaForm` (botão `Salvar` segue o padrão default do Mantine, fora do escopo desta correção).

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): 12 seções padrão.
- **Documento de requisitos** (`doc/requisitos.md`): seção 3.10 (Atletas) e 11.2 (regras de validação do `AthleteForm`) — sem regra visual específica sobre o botão, que é tratado como decisão de UI.
- **Documentação técnica existente:** `spec/areas-import-export-nome-opcional.md`, `spec/tempo-luta-padrao-ibjjf.md` — referência de formato.
- **Código-fonte relevante lido:**
  - `src/components/AthleteForm.tsx:322-338` — bloco do botão submit atual.
  - `src/pages/AdminAthletes.tsx:220-232` — botão "Cadastrar Atleta" do header da listagem (referência de estilo: `backgroundColor: '#1b325f'`, `borderRadius: 12`, `leftSection: <IconPlus/>`, hover `#3a89c9`).
  - `src/pages/AthletesMenu.tsx:203-231` — bloco "Acessar" dos cards do menu (confirma padrão `borderRadius: 12`).
  - `src/styles/theme.ts` — confirma `defaultRadius: 'md'` e `primaryColor: 'blue'` no Mantine.

---

## 3. História de Usuário

```
Como organizador,
quero que o botão "Cadastrar Atleta" do formulário tenha a mesma aparência dos demais botões do app,
para que a interface pareça coerente e profissional.
```

Cenários alternativos:
- Editando atleta existente: o botão muda o texto para "Salvar Alterações", mas o estilo deve permanecer o mesmo.
- Hover: botão deve escurecer/clarear de forma consistente com o resto do app.

---

## 4. Requisitos Funcionais

- [ ] RF-01: o botão de submit do `AthleteForm` deve usar a cor primária `#1b325f` como fundo e texto branco.
- [ ] RF-02: o botão deve ter `borderRadius: 12` (mesmo padrão do header de `AdminAthletes`).
- [ ] RF-03: o botão deve ter `padding` padrão do Mantine (sem override para `16px`).
- [ ] RF-04: o botão deve exibir um ícone à esquerda (`IconUserPlus` do `@tabler/icons-react`) para indicar a ação de cadastro de pessoa.
- [ ] RF-05: no estado hover, o botão deve usar a cor de hover `#3a89c9` (consistente com `AdminAthletes`).
- [ ] RF-06: o botão deve usar a fonte do tema (`Inter`, peso 700) sem ajustes manuais que comprometam acessibilidade.

---

## 5. Requisitos Não-Funcionais

- **Performance:** sem impacto (apenas CSS inline via prop `styles`).
- **Acessibilidade:** contraste de cor deve atender WCAG AA (branco sobre `#1b325f` = ~10:1, OK).
- **Compatibilidade:** Electron 30 + React 18 + Mantine 7 (já usados no app).
- **Observabilidade:** não aplicável (apenas UI).

---

## 6. Análise da Aplicação

- **Arquitetura geral:** frontend React + Mantine. Sem impacto em backend/Electron.
- **Padrões em uso:** botões de ação primária usam `backgroundColor: '#1b325f'`, `borderRadius: 12`, `leftSection` com ícone, hover `#3a89c9`. Exemplos: `AdminAthletes.tsx:220`, `AdminAreas.tsx`, `AdminArbitros.tsx`.
- **Fluxo de dados:** inalterado.
- **Contratos de API:** inalterado.

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/components/AthleteForm.tsx` | Modificar | Ajustar `styles` do `<Button type="submit">` e importar `IconUserPlus` |

> Confirmação: o arquivo já importa `Button` do `@mantine/core`; precisa adicionar `IconUserPlus` de `@tabler/icons-react`.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- Nenhum esperado. Mudança isolada em um único componente.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma. O item `[aberto]` é puramente visual e o design system já está bem definido.

### 8.3 Riscos
- Nenhum risco de regressão: o botão continua sendo um submit do formulário; só mudam cores/dimensões.

---

## 9. Critérios de Aceite

- [ ] CA-01: dado o modal `AthleteForm` aberto em modo "Novo Atleta", quando renderizado, então o botão "Cadastrar Atleta" exibe fundo `#1b325f`, texto branco, `borderRadius: 12` e ícone de pessoa à esquerda.
- [ ] CA-02: dado o mesmo modal aberto em modo "Editar Atleta", quando renderizado, então o botão "Salvar Alterações" mantém o mesmo estilo visual de CA-01.
- [ ] CA-03: dado o botão em estado normal, quando o usuário passa o mouse, então a cor de fundo muda para `#3a89c9` (hover consistente com `AdminAthletes`).

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Importar o ícone IconUserPlus
  - O que fazer: adicionar `IconUserPlus` à lista de imports de `@tabler/icons-react` em `AthleteForm.tsx`
  - Arquivo(s): src/components/AthleteForm.tsx
  - Como validar: inspecionar import; build sem erro de TS.

Passo 2: Reescrever as styles do botão de submit
  - O que fazer: substituir o bloco `styles={{ root: { ... } }}` atual por:
      backgroundColor: '#1b325f',
      borderRadius: 12,
      '&:hover': { backgroundColor: '#3a89c9' },
    e adicionar `leftSection={<IconUserPlus size={16} />}`.
  - Arquivo(s): src/components/AthleteForm.tsx (linhas 322-338)
  - Como validar: abrir o modal e inspecionar o botão no devtools; rodar `npm run lint`.
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto (mudança puramente visual, sem impacto funcional).
- **Como monitorar:** feedback visual do usuário.
- **Plano de rollback:** reverter o commit (1 arquivo, 1 botão).

---

## 12. Definição de Pronto (DoD)

- [x] Critérios CA-01, CA-02 e CA-03 verificados visualmente.
- [x] Lint passa sem warnings.
- [x] `doc/spec.md` atualizado: item movido para Histórico de Correções.
- [x] `doc/requisitos.md` atualizado com nota sobre o estilo padronizado do botão.
