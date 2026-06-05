# `AthleteForm` — Peso e Gênero lado a lado

> Spec para o item `[aberto]` de `doc/spec.md`:
> *"peso e genero deveriam estar lado a lado e não um a baixo do outro no formulario"*

---

## 1. Contexto e Objetivo

- **O que é:** reorganizar o layout do modal `AthleteForm` para que os campos `Gênero` e `Peso (kg)` sejam renderizados lado a lado (em uma única linha), em vez de empilhados verticalmente.
- **Por que existe:** o formulário tem 7 campos (Nome, Equipe, Gênero, Peso, Faixa, Categoria, Ano de Nascimento) e o modal fica visualmente longo. Empilhar Gênero e Peso desperdiça espaço horizontal — os dois campos têm largura curta e cabem em um `Group` de 2 colunas.
- **Quem usa:** organizadores que cadastram ou editam atletas.
- **Escopo:**
  - **Dentro:** `src/components/AthleteForm.tsx` — agrupar `Gênero` e `Peso (kg)` em um `<Group grow gap="md">` dentro do `<Stack>` existente.
  - **Fora:** demais pares de campos (Faixa/Categoria, etc.) permanecem empilhados; `ArbitroForm`, `AreaForm` (escopo é apenas o `AthleteForm`).

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): 12 seções padrão.
- **Documento de requisitos** (`doc/requisitos.md`): seção 3.8 (Atletas) e 11.2 (regras de validação) — sem regra de layout específica, é decisão de UI.
- **Documentação técnica existente:** `spec/athlete-form-botao-cadastrar-visual.md` — referência de formato de spec e padrões de estilo.
- **Código-fonte relevante lido:**
  - `src/components/AthleteForm.tsx:245-318` — `<Stack gap="md">` contém todos os campos; campos atuais na ordem: Nome, Equipe, Gênero (linha 263), Peso (linha 275), Faixa (286), Categoria (298), Ano de Nascimento (309).
  - `src/components/ArbitroForm.tsx:73-97` — referência de `<Group>` para botões (não usa para inputs lado a lado, mas confirma que `Group` do Mantine é o padrão).
  - `src/styles/theme.ts` — `defaultRadius: 'md'`, `primaryColor: 'blue'`.

---

## 3. História de Usuário

```
Como organizador,
quero ver os campos "Gênero" e "Peso" lado a lado no formulário de atleta,
para que o modal seja mais compacto e eu preencha mais rápido.
```

Cenários alternativos:
- Em telas estreitas (mobile): os campos devem voltar a empilhar (responsivo).
- Formulário de edição: layout idêntico ao de cadastro.

---

## 4. Requisitos Funcionais

- [ ] RF-01: os campos `Gênero` (`Select`) e `Peso (kg)` (`NumberInput`) devem ser renderizados na mesma linha horizontal dentro do modal.
- [ ] RF-02: os dois campos devem ocupar larguras equivalentes (cada um ~50% da linha) usando `grow` no `Group`.
- [ ] RF-03: o restante dos campos (Nome, Equipe, Faixa, Categoria, Ano de Nascimento) permanece em uma coluna única.
- [ ] RF-04: a validação e o comportamento de submit permanecem inalterados.
- [ ] RF-05: a ordem visual do formulário, da esquerda para a direita, deve ser: Gênero → Peso (Gênero primeiro para alinhar com a ordem atual de leitura dos campos).

---

## 5. Requisitos Não-Funcionais

- **Performance:** sem impacto (apenas reorganização de JSX).
- **Acessibilidade:** cada campo mantém seu `<label>` próprio; a relação label-input não muda.
- **Compatibilidade:** Mantine 7 (já usado) — `Group` aceita `grow` e `gap` como props.
- **Observabilidade:** não aplicável.

---

## 6. Análise da Aplicação

- **Arquitetura geral:** frontend React + Mantine. Sem impacto em backend/Electron.
- **Padrões em uso:** `<Group>` do Mantine é usado em `ArbitroForm.tsx:93` (botões) e em `AthleteForm.tsx:321` (botões do rodapé). `grow` é o prop padrão para distribuir filhos em larguras iguais.
- **Fluxo de dados:** inalterado.
- **Contratos de API:** inalterado.

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/components/AthleteForm.tsx` | Modificar | Envolver `Gênero` e `Peso (kg)` em um `<Group grow gap="md">` |

> Sem novos imports: `Group` já está importado (linha 1).

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- Nenhum esperado. Reorganização de JSX em escopo isolado.

### 8.2 Ambiguidades nos Requisitos
- Ordem dos campos na linha: `[Gênero, Peso]` (decisão tomada — Gênero antes, conforme RF-05). Caso o usuário prefira `[Peso, Gênero]`, é trivial inverter.

### 8.3 Riscos
- Nenhum risco de regressão funcional; apenas layout.

---

## 9. Critérios de Aceite

- [ ] CA-01: dado o modal `AthleteForm` aberto, quando renderizado em desktop, então `Gênero` e `Peso (kg)` aparecem lado a lado na mesma linha.
- [ ] CA-02: dado o modal aberto, então `Nome`, `Equipe`, `Faixa`, `Categoria` e `Ano de Nascimento` permanecem em linhas separadas (empilhados).
- [ ] CA-03: dado o modal aberto, então as validações de `Gênero` e `Peso` continuam funcionando e exibem mensagens de erro no local correto (abaixo de cada input).
- [ ] CA-04: dado o modal aberto em modo edição, então o layout é idêntico ao de cadastro e os valores pré-preenchidos aparecem nos campos corretos.

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Envolver os campos Gênero e Peso em um Group
  - O que fazer: substituir os dois componentes Select (Gênero) e NumberInput (Peso) por um único <Group grow gap="md"> que contém os dois, na ordem Genero → Peso.
  - Arquivo(s): src/components/AthleteForm.tsx (linhas 263-284)
  - Como validar: inspecionar o modal no app; rodar `npx tsc --noEmit`.
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto (mudança puramente de layout, sem impacto funcional).
- **Como monitorar:** feedback visual do usuário.
- **Plano de rollback:** reverter o commit (1 arquivo, 1 bloco JSX).

---

## 12. Definição de Pronto (DoD)

- [x] Critérios CA-01 a CA-04 verificados visualmente.
- [x] Lint não introduz novos erros.
- [x] `doc/spec.md` atualizado: item movido para Histórico de Correções.
- [x] `doc/requisitos.md` atualizado com nota sobre o layout.
