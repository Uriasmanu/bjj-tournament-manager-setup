# spec/formulario-adicionar-atleta.md

> Feature: novo layout visual do formulário de cadastro/edição de atleta.
> Regra do solicitante: **usar apenas o layout proposto, sem remover a lógica atual** (validações, normalização `trim().toLowerCase()`, filtragem IBJJF por idade/gênero/faixa, persistência, duplicatas, IPC).

---

## 1. Contexto e Objetivo

- **O que é:** repaginar visualmente o componente `AthleteForm.tsx` (modal de cadastro e edição de atleta) adotando a paleta e o estilo do protótipo HTML/Tailwind fornecido em `doc/spec.md` (cores `c1–c5`, card com `border-t-8`, inputs com `border-2 border-c2/30`, foco `ring-c2`, botão `bg-c4 hover:bg-c1`).
- **Por que existe:** o sistema hoje usa Mantine com tema padrão (azul/cinza) e o protótipo de referência apresenta identidade visual própria (azul-petróleo + verde-sálvia) que deve ser adotada.
- **Quem usa:** organizador do torneio, ao abrir o modal de cadastro de atleta (`/admin/atletas` → cartão "Cadastrar Atleta") ou de edição (botão de lápis em `/admin/atletas/lista`).
- **Escopo:**
  - **Dentro:** aparência dos campos (TextInput, NumberInput, Select), do botão "Salvar" e do cartão do modal.
  - **Fora:** regras de validação, layout do menu de Atletas, tabela, IPC, persistência, fluxo de duplicata, classificação IBJJF.

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): confirma seções preenchidas neste documento.
- **Documento de requisitos** (`doc/requisitos.md`): seção **3.8. Atletas (Implementado)** descreve o formulário atual como modal controlado por `@mantine/form` com `mode: 'controlled'`, validações e filtragem IBJJF dinâmica.
- **Documentação técnica existente:** `spec/{nome-da-feature}.md` é a primeira especificação desta feature (este próprio arquivo).
- **Código-fonte relevante:**
  - `src/components/AthleteForm.tsx` (componente alvo da mudança).
  - `src/types/athlete.ts` (interface `Atleta`).
  - `src/types/category.ts` (`CATEGORIAS_IBJJF`).
  - `src/pages/AthleteMenu.tsx` e `src/pages/AdminAthletes.tsx` (consumidores do modal).
  - `src/styles/global.css` (estilos globais) e `src/styles/theme.ts` (tema Mantine).

> ⚠️ Nenhuma suposição sobre comportamento de arquivo não lido. As informações acima foram obtidas por leitura direta.

---

## 3. História de Usuário

```
Como organizador de torneio,
quero visualizar o formulário de cadastro de atleta com a identidade visual do protótipo (azul-petróleo + verde-sálvia),
para que a experiência seja coerente com o design aprovado e mantenha todas as validações que já evitam cadastros inválidos.
```

**Cenários alternativos:**

- O usuário abre o modal para edição — todos os campos devem aparecer preenchidos com o layout novo aplicado.
- O usuário tenta salvar com campo obrigatório vazio — a validação existente deve exibir a mensagem de erro logo abaixo do campo afetado.
- A categoria fica indisponível (sem idade/gênero/faixa definidos) — o `Select` de categoria continua `disabled`, conforme lógica atual.
- A janela é pequena — o modal permanece `centered` e responsivo.

---

## 4. Requisitos Funcionais

- [ ] RF-01: o modal exibe o título centralizado "Novo Atleta" (ou "Editar Atleta") em cor `c1` (`#092b5a`) e peso `bold`.
- [ ] RF-02: o conteúdo do modal é envolvido por um cartão branco com `border-top: 8px solid c1`, `border-radius: 16px` e sombra, replicando o `border-t-8 border-c1` do protótipo.
- [ ] RF-03: cada rótulo de campo é renderizado em fonte `semibold`, cor `c1`, com `margin-bottom: 4px` em relação ao input.
- [ ] RF-04: os inputs (`TextInput`, `NumberInput`, `Select`) adotam `border: 2px solid` na cor `c2` com opacidade 30% (`rgba(9, 115, 138, 0.3)`), `border-radius: 8px`, e ao receber foco mostram `box-shadow: 0 0 0 2px c2` e `border-color: c2`.
- [ ] RF-05: o botão de submit exibe label "Cadastrar Atleta" (criação) ou "Salvar Alterações" (edição) — `a confirmar` (decisão abaixo), `background-color: c4` (`#78a890`), `color: #fff`, fonte `bold`, `border-radius: 8px`, com hover `background-color: c1` e leve `transform: scale(0.98)` no `:active`.
- [ ] RF-06: o botão "Cancelar" permanece à esquerda do submit, com variante `outline` neutra (não destrutiva) — `a confirmar` manter o estilo atual Mantine ou alinhar à paleta.
- [ ] RF-07: o grid 2-colunas para Gênero e Peso do protótipo é **descartado** nesta entrega — `a confirmar` (justificado abaixo), mantendo o layout em pilha vertical (`Stack`) que o `AthleteForm.tsx` já usa.
- [ ] RF-08: as validações de campo (nome ≥ 2, equipe ≥ 2, peso 1–300, ano 1920–atual, gênero/categoria/faixa obrigatórios) permanecem intactas, com mensagens renderizadas pelo Mantine logo abaixo do input.
- [ ] RF-09: ao salvar com sucesso, o modal é fechado e a notificação verde do consumidor (`AthletesMenu`/`AdminAthletes`) continua sendo exibida — sem mudança nessa integração.

---

## 5. Requisitos Não-Funcionais

- **Performance:** sem regressão; a renderização do modal segue usando `useMemo` para `catOptions` e `catGrouped`.
- **Segurança:** nenhuma mudança no fluxo de validação; nenhuma entrada nova do usuário.
- **Acessibilidade:** rótulos permanecem associados aos inputs via `label` prop do Mantine; cores `c1`/`c2` sobre fundo branco atingem contraste ≥ 4.5:1 (verificar com ferramenta — `a confirmar` com olhos, parece OK).
- **Compatibilidade:** Electron + React 18 + Mantine 7; nenhum browser-only API novo.
- **Observabilidade:** nenhuma métrica/log novo.

---

## 6. Análise da Aplicação

- **Arquitetura:** frontend React (renderer) consumindo IPC do main process para `saveAthlete`/`updateAthlete` (lógica fora do escopo).
- **Padrões em uso:**
  - `@mantine/form` com `mode: 'controlled'`.
  - `useDisclosure` para abrir/fechar o modal.
  - Props do `AthleteForm`: `opened`, `onClose`, `onSave`, `athlete`.
  - Estilização via `styles={{ root: { ... } }}` em componentes Mantine, ou `style={{ ... }}` em `Box`.
- **Fluxo de dados:** o modal coleta dados → `handleSubmit` normaliza (`trim().toLowerCase()` em `nome`/`equipe`, `branca-adulto → branca` em `faixa`) → `onSave(data)` → IPC grava no JSON do torneio.
- **Contratos de API:** inalterados (`electronAPI.saveAthlete`, `electronAPI.updateAthlete`).

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---|---|---|
| `src/components/AthleteForm.tsx` | Modificar | Aplicar paleta `c1–c5` e estilo do protótipo nos inputs, botão submit e wrapper do modal. |
| `spec/formulario-adicionar-atleta.md` | Criar | Esta especificação. |
| `doc/spec.md` | Modificar | Adicionar entrada no **Histórico de Correções** referenciando esta feature. |

> ⚠️ Nenhum outro arquivo precisa ser tocado para a mudança visual. As funções utilitárias (`categoriasFiltradas`, `agruparCategorias`, `calcularIdade`, constantes `faixas`, `anoAtual`) permanecem exportadas internamente ao componente.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- **Sem Tailwind no projeto:** o protótipo usa classes Tailwind (`bg-c1`, `border-c2/30`). É necessário traduzir para `style` inline ou um objeto `styles` do Mantine, usando os mesmos valores hex/rgba.
- **Tema Mantine em uso:** os componentes `TextInput`, `NumberInput`, `Select` e `Button` aceitam `styles` por slot, o que evita precisar criar CSS custom.
- **Compatibilidade com edição:** o `useEffect` de inicialização depende de `opened`/`athlete`; não deve ser tocado.

### 8.2 Ambiguidades nos Requisitos

- **Rótulo do botão submit:** o protótipo usa "Cadastrar Atleta" tanto para novo quanto para submit genérico. Decisão proposta: usar "Cadastrar Atleta" no modo criação e "Salvar Alterações" no modo edição (consistente com o resto do app).
- **Layout 2-colunas (Gênero + Peso):** o protótipo agrupa em grid, mas o formulário atual usa pilha. Para minimizar risco de regressão visual em telas estreitas, **manter pilha vertical** e só introduzir o grid em uma entrega futura caso solicitado.
- **Botão Cancelar:** o protótipo não tem botão "Cancelar" (é um form HTML que reseta). O `AthleteForm` é um modal e precisa de cancelamento. Decisão proposta: manter o `Button variant="outline"` à esquerda, com cor neutra Mantine, sem aplicar a paleta `c1–c5` (para preservar contraste com o submit verde-sálvia).
- **Mensagens de sucesso/erro dentro do modal:** o protótipo esconde o form e exibe um banner verde. **Não aplicar** — o app atual exibe `notifications` globais, e isso já é feedback suficiente. Manter form sempre visível.

### 8.3 Riscos

- Baixo. Mudança é puramente visual. Risco de regressão mínimo, mas testar:
  - Abertura do modal em criação e em edição.
  - Foco visível nos inputs.
  - Validações ainda aparecem corretamente.
  - Submit e Cancel continuam fechando o modal (sucesso e cancelamento).

> ⚠️ Nenhum impedimento bloqueante.

---

## 9. Critérios de Aceite

- [ ] CA-01: dado que o usuário clica em "Cadastrar Atleta" no menu de Atletas, quando o modal abre, então o título "Novo Atleta" aparece centralizado em `#092b5a` (c1) em negrito.
- [ ] CA-02: dado o modal aberto, quando o usuário foca em qualquer input, então a borda do input fica `#09738a` (c2) sólida e o input exibe `box-shadow: 0 0 0 2px rgba(9,115,138,0.4)`.
- [ ] CA-03: dado o modal aberto, quando o usuário clica em "Cadastrar Atleta" (submit), então o botão fica `#092b5a` (c1) durante o hover e a cor original `#78a890` (c4) no estado normal.
- [ ] CA-04: dado um atleta existente, quando o usuário clica no ícone de lápis na tabela, então o modal abre com todos os campos preenchidos e a mesma aparência visual do modo criação.
- [ ] CA-05: dado qualquer campo obrigatório vazio, quando o usuário tenta submeter, então a mensagem de erro do Mantine aparece logo abaixo do campo, em vermelho, sem quebrar o layout do card.
- [ ] CA-06: dado um submit bem-sucedido, quando `onSave` retorna `true`, então o modal fecha e a notificação verde do consumidor é exibida (comportamento atual preservado).

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Definir objeto de estilos compartilhado
  - O que fazer: criar constante STYLE (ou objeto de cores exportado) no topo do arquivo com c1, c2, c3, c4, c5 e helpers de input/button.
  - Arquivo: src/components/AthleteForm.tsx
  - Como validar: revisar visualmente no código que os hex batem com o protótipo.

Passo 2: Aplicar estilo do card (wrapper do conteúdo)
  - O que fazer: envolver o conteúdo do Modal em um <Box> com style={{ borderTop: '8px solid #092b5a', borderRadius: 16, background: '#fff' }}.
  - Arquivo: src/components/AthleteForm.tsx
  - Como validar: abrir o modal e ver a faixa azul no topo.

Passo 3: Estilizar rótulos e inputs
  - O que fazer: em cada TextInput/NumberInput/Select, passar labelProps e styles={{ input: { border: '2px solid rgba(9,115,138,0.3)', borderRadius: 8 }, ... }}. Rótulos com labelProps={{ style: { color: '#092b5a', fontWeight: 600, marginBottom: 4 } }}.
  - Arquivo: src/components/AthleteForm.tsx
  - Como validar: focar em cada campo e ver borda + sombra c2.

Passo 4: Estilizar botão submit
  - O que fazer: trocar variant padrão por styles={{ root: { backgroundColor: '#78a890', color: '#fff', fontWeight: 700, borderRadius: 8, '&:hover': { backgroundColor: '#092b5a' } } }}.
  - Arquivo: src/components/AthleteForm.tsx
  - Como validar: hover muda de c4 para c1; clique dispara submit.

Passo 5: Validar que nenhuma lógica foi removida
  - O que fazer: rodar `npm run lint` e `npm run build` (tsc) e revisar o diff: nenhuma função utilitária removida, useEffect intacto, onSave intacto.
  - Arquivo: src/components/AthleteForm.tsx
  - Como validar: lint e tsc passam.
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto (mudança isolada em renderer).
- **Como monitorar:** visualmente no build de dev (`npm run dev`); sem métrica automatizada.
- **Plano de rollback:** `git revert` do commit desta feature.

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os CA verificados manualmente em dev.
- [ ] `npm run lint` e `npm run build` (que executa `tsc`) passam sem warning.
- [ ] Diff revisado: nenhuma função removida, nenhuma validação removida.
- [ ] `doc/spec.md` (Histórico de Correções) atualizado com referência a esta feature.

---

## Checklist Rápido

- [x] Itens em "Problemas Encontrados" lidos (nenhum `[aberto]`).
- [x] Documentos de referência lidos (`doc/requisitos.md`, código-fonte).
- [x] História de usuário e objetivo claros.
- [x] Arquivos envolvidos identificados e lidos.
- [x] Problemas e impedimentos listados.
- [x] Plano de implementação em ordem lógica.
- [x] Critérios de aceite verificáveis.
- [x] Incertezas sinalizadas explicitamente (`a confirmar`).
