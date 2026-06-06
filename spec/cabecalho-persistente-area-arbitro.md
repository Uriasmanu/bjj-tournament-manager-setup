# spec/cabecalho-persistente-area-arbitro.md

> Correção do problema aberto `Em area de luta e arbitro tem que manter o cabeçalho quando troca a visualização para os deletados` registrado em `doc/spec.md`.

---

## 1. Contexto e Objetivo

- **O que é:** Manter o cabeçalho (botões `Importar`, `Exportar JSON`, `Cadastrar` e a barra de busca) das telas `AdminAreas` e `AdminArbitros` visíveis em ambos os estados do toggle `Mostrar apenas os deletados`.
- **Por que existe:** A tela `AdminAthletes` (referência do padrão) já mantém o cabeçalho persistente ao alternar entre ativos e deletados, e o cabeçalho das outras duas telas diverge — os botões somem quando o toggle vai para `true`, prejudicando a consistência visual e a navegação.
- **Quem usa:** Organizador/árbitro do torneio ativo que está administrando áreas de luta e cadastro de árbitros.
- **Escopo:**
  - **Dentro:** `src/pages/AdminAreas.tsx` e `src/pages/AdminArbitros.tsx` (apenas o bloco de cabeçalho).
  - **Fora:** Lógica de carregamento, tabela, modais, IPC, tipos e a tela de atletas (já está correta).

---

## 2. Analise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): aplicado conforme template.
- **Documento de requisitos** (`doc/requisitos.md`):
  - Seção 3.8 (Atletas) define o padrão de toggle dinâmico e cabeçalho persistente — referência.
  - Seção 3.8 descreve que em atletas o título, subtítulo, botões e cards permanecem visíveis em ambos os estados do toggle.
  - Não há seção dedicada para `Áreas de Luta` ou `Árbitros` que descreva o toggle, embora ele exista na UI.
- **Documentação técnica existente** (`spec/{nome-da-feature}.md`): os arquivos `spec/toggle-dinamico-lista-atletas.md` e `spec/visualizacao-atletas-deletados.md` referenciados em `requisitos.md` não existem fisicamente — foram consolidados em `requisitos.md`. A nova spec deste ciclo segue o template de `doc/spec.md`.
- **Código-fonte relevante** (lido):
  - `src/pages/AdminAthletes.tsx` (linhas 277-440): cabeçalho persistente, sem `color="red"` no `Switch`.
  - `src/pages/AdminAreas.tsx` (linhas 249-303): botões envoltos em `{!showDeleted && (...)}`, `Switch` com `color="red"`.
  - `src/pages/AdminArbitros.tsx` (linhas 253-295): mesmo padrão de `AdminAreas`.

---

## 3. Historia de Usuario

```
Como organizador do torneio ativo,
quero que o cabeçalho das telas de Áreas de Luta e Árbitros (botões Importar, Exportar, Cadastrar e barra de busca) permaneça visível ao alternar a visualização entre Ativos e Deletados,
para que a navegação seja consistente com a tela de Atletas e eu não perca o acesso aos atalhos principais ao consultar a lixeira.
```

Cenários alternativos:
- Quando o toggle vai para `Deletados`, o cabeçalho permanece com os mesmos botões; apenas o conteúdo da tabela muda.
- Quando o usuário clica em `Importar` no estado `Deletados`, o handler atual continua funcionando (cria/importa áreas/árbitros ativos, sem interferir com a lista de deletados atualmente exibida).
- Quando a lista de deletados está vazia, o cabeçalho continua visível e o empty state apropriado é exibido.

---

## 4. Requisitos Funcionais

- [ ] RF-01: Em `AdminAreas`, ao alternar o `Switch` `Mostrar apenas os deletados`, os botões `Importar`, `Exportar JSON` e `Cadastrar` permanecem visíveis em ambos os estados.
- [ ] RF-02: Em `AdminArbitros`, ao alternar o `Switch` `Mostrar apenas os deletados`, os botões `Exportar`, `Importar` e `Cadastrar` permanecem visíveis em ambos os estados.
- [ ] RF-03: A barra de busca por nome permanece visível e funcional em ambos os estados nas duas telas.
- [ ] RF-04: O `Switch` `Mostrar apenas os deletados` em `AdminAreas` e `AdminArbitros` passa a usar a cor padrão do tema (azul), alinhando-se a `AdminAthletes`.

---

## 5. Requisitos Nao-Funcionais

- **Performance:** a alternância do toggle não deve disparar nova chamada IPC desnecessária (a lista de deletados já é carregada pelo efeito existente).
- **Acessibilidade:** botões permanecem acessíveis via teclado e leitor de tela em ambos os estados.
- **Compatibilidade:** nenhuma mudança em contrato de IPC, tipos ou persistência.
- **Observabilidade:** sem novos logs esperados.

---

## 6. Analise da Aplicação

- **Arquitetura geral:** frontend React + Mantine consumindo IPC do main process Electron. Nenhuma camada é alterada por este ciclo.
- **Padrões em uso:** `PageLayout` para título e voltar, `<Group>` para layout de cabeçalho, `Switch` para toggle, `TextInput` com `leftSection` para busca.
- **Fluxo de dados:** inalterado. `useEffect` em `[showDeleted]` continua disparando `loadData`/`loadList` para trocar a lista exibida.
- **Contratos de API:** inalterados.

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/pages/AdminAreas.tsx` | Modificar | Remover `{!showDeleted && ...}` em torno dos botões `Importar`/`Exportar JSON`/`Cadastrar`; remover `color="red"` do `Switch`. |
| `src/pages/AdminArbitros.tsx` | Modificar | Remover `{!showDeleted && ...}` em torno dos botões `Exportar`/`Importar`/`Cadastrar`; remover `color="red"` do `Switch`. |
| `doc/spec.md` | Modificar | Mover item aberto para Histórico de Correções. |
| `doc/requisitos.md` | Modificar | Adicionar bullet descrevendo o cabeçalho persistente em Áreas e Árbitros. |

> Nenhum arquivo de spec pré-existente cobre o toggle de Áreas/Árbitros — este documento (`spec/cabecalho-persistente-area-arbitro.md`) é criado neste ciclo.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos
- Nenhum. Mudança puramente de renderização condicional.

### 8.2 Ambiguidades nos Requisitos
- O botão `Excluir Selecionados (N)` no cabeçalho (ao lado da busca) só aparece no estado `!showDeleted`. Esta spec **mantém** esse comportamento atual (não está no escopo do problema aberto). A tela `AdminAthletes` posiciona o botão equivalente no rodapé da tabela, mas esta correção não replica essa diferença de layout.

### 8.3 Riscos
- Nenhum risco de regressão: handlers de `Importar`/`Exportar`/`Cadastrar` já são seguros para ambos os estados — eles operam sobre a lista ativa do main process, não sobre o array atualmente renderizado.

---

## 9. Criterios de Aceite

- [ ] CA-01: Em `AdminAreas`, com `Mostrar apenas os deletados` = `false`, os botões `Importar`, `Exportar JSON` e `Cadastrar` estão visíveis.
- [ ] CA-02: Em `AdminAreas`, ao marcar `Mostrar apenas os deletados`, os botões `Importar`, `Exportar JSON` e `Cadastrar` continuam visíveis.
- [ ] CA-03: Em `AdminArbitros`, com `Mostrar apenas os deletados` = `false`, os botões `Exportar`, `Importar` e `Cadastrar` estão visíveis.
- [ ] CA-04: Em `AdminArbitros`, ao marcar `Mostrar apenas os deletados`, os botões `Exportar`, `Importar` e `Cadastrar` continuam visíveis.
- [ ] CA-05: A barra de busca permanece visível e funcional em ambos os estados nas duas telas.
- [ ] CA-06: O `Switch` em `AdminAreas` e `AdminArbitros` adota a cor padrão do tema (sem `color="red"`), igual a `AdminAthletes`.
- [ ] CA-07: Marcar/desmarcar o toggle não gera erros no console nem regressão na lista de deletados.

---

## 10. Plano de Implementacao (Passo a Passo)

```
Passo 1: Corrigir AdminAreas.tsx
  - O que fazer: remover o wrapper { !showDeleted && (...) } em torno do fragmento com os botões Importar/Exportar JSON/Cadastrar (linhas 263-287). Remover a prop color="red" do Switch (linha 258).
  - Arquivo(s): src/pages/AdminAreas.tsx
  - Como validar: reler o trecho alterado e confirmar que os botões ficam fora do condicional e que o Switch fica sem color="red".

Passo 2: Corrigir AdminArbitros.tsx
  - O que fazer: remover o wrapper { !showDeleted && (...) } em torno do fragmento com os botões Exportar/Importar/Cadastrar (linhas 267-279). Remover a prop color="red" do Switch (linha 262).
  - Arquivo(s): src/pages/AdminArbitros.tsx
  - Como validar: reler o trecho alterado e confirmar que os botões ficam fora do condicional e que o Switch fica sem color="red".

Passo 3: Lint + typecheck
  - O que fazer: rodar npm run lint e npm run build (que inclui tsc) para garantir que não houve regressão.
  - Arquivo(s): -
  - Como validar: ambos os comandos retornam 0.

Passo 4: Atualizar doc/spec.md
  - O que fazer: mover o item aberto "Em area de luta e arbitro tem que manter o cabeçalho quando troca a visualização para os deletados" para o Histórico de Correções, citando este spec e o diff aplicado.
  - Arquivo(s): doc/spec.md
  - Como validar: reler a seção Histórico de Correções e Problemas Encontrados.

Passo 5: Atualizar doc/requisitos.md
  - O que fazer: adicionar parágrafo curto descrevendo que o cabeçalho (botões + busca) de Áreas de Luta e Árbitros permanece visível em ambos os estados do toggle, alinhando com a regra de Atletas.
  - Arquivo(s): doc/requisitos.md
  - Como validar: reler o trecho inserido.
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** alteração direta, sem feature flag (mudança puramente visual de renderização condicional, sem risco de dados).
- **Como monitorar:** inspeção visual das duas telas em ambos os estados do toggle.
- **Plano de rollback:** revert do commit deste ciclo.

---

## 12. Definição de Pronto (DoD)

- [ ] Passos 1 e 2 aplicados.
- [ ] `npm run lint` e `npm run build` (tsc) sem erros.
- [ ] Seção **Histórico de Correções** de `doc/spec.md` atualizada com a entrada deste ciclo.
- [ ] `doc/requisitos.md` atualizado com a nova regra.
