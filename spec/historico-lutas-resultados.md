# spec/historico-lutas-resultados.md

> Feature: na aba "Lutas" da tela `/admin/resultados`, exibir o histórico completo de todas as lutas finalizadas (chaves + lutas casadas) em formato de **tabela compacta** com **busca por nome do atleta** e **expansão inline** para mostrar o placar detalhado. Resolve a solicitação: "Em resultados tem que ter uma forma facil e intuitiva de ver o as informaçoes das luta, todas as informaç~eos pontos, tempo, tipo de vitoria etc (historico completo de todas as lutas, em formato de lista e com a opção de bucar por nome do atleta)" (seção **Feature** de `doc/spec.md`).

---

## 1. Contexto e Objetivo

- **O que é:** reformular a aba "Lutas" de `/admin/resultados`, hoje composta por cards `LutaResumoCard` empilhados e agrupados por chave, para uma **tabela compacta** com sticky header, scroll interno, **campo de busca por nome do atleta** e **linhas expansíveis** que mostram o placar detalhado ao clique.
- **Por que existe:** a visualização atual em cards é verbosa e dificulta a varredura de muitas lutas (e.g., um torneio com 80+ lutas). O usuário precisa de uma lista escaneável, da capacidade de localizar rapidamente todas as lutas de um atleta específico e de consultar o placar detalhado sob demanda, sem ocupar espaço quando não está em foco.
- **Quem usa:** organizador do torneio, árbitro/operador de mesa e equipe técnica durante/após o torneio, em `/admin/resultados` → aba "Lutas".
- **Escopo:**
  - **Dentro:** aba "Lutas" reformulada (uma única `<Tabs.Panel value="lutas">`); `<TextInput>` de busca com `IconSearch`; `<Table>` com `stickyHeader` e `maxHeight: 60vh`; expansão acordeão de placar detalhado reutilizando o componente `PlacarDetalhado` já existente; contadores "Exibindo N de M lutas"; empty states específicos para "nenhuma luta finalizada" e "nenhuma luta encontrada para o termo X".
  - **Fora:** outras abas (Visão Geral, Chaves, Lutas Casadas, Equipes, Árbitros, Atletas), regras de persistência, geração de chaves, IPC, layout do menu/dashboard, novos ícones ou bibliotecas.

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): seções 1–12 aplicadas abaixo. A **Feature** (linha 27) é o ponto de partida: o texto é informal/português com typo, então esta spec o reescreve em forma verificável.
- **Documento de requisitos** (`doc/requisitos.md`): seção **3.23. Resultados — Tela com Tudo do Torneio** — descreve a página atual (6 abas, leitura-only). A nova feature respeita o caráter read-only.
- **Documentação técnica existente:**
  - `spec/tempo-luta-padrao-ibjjf.md` (padrão de doc) — estrutura de 12 seções + Checklist Rápido.
  - `spec/formulario-adicionar-atleta.md` (padrão de doc) — convenções de cabeçalho/citação/decisões `a confirmar`.
- **Código-fonte relevante:**
  - `src/pages/Resultados.tsx` — alvo principal; já contém `todasLutasFinalizadas` (useMemo, linhas 377–405) e o componente `PlacarDetalhado` (linhas 96–114) que será reutilizado.
  - `src/types/bracket.ts` — `Luta`, `PlacarLuta`, `Chave`.
  - `src/types/lutaCasada.ts` — `LutaCasada` e `AtletaSnapshot` (snapshot tem `nome`).
  - `src/utils/format.ts` — `formatarDuracao` (mm:ss) já utilizado pela tabela.

> ⚠️ `todasLutasFinalizadas` (Resultados.tsx:377) já produz a lista consolidada de lutas finalizadas (chave + casada), na ordem categoria → ordem. Esta spec **reutiliza** esse memo e adiciona apenas o nome do atleta para alimentar o filtro de busca.

> ⚠️ `PlacarDetalhado` (Resultados.tsx:96) já trata `placar` undefined com fallback "0" e aplica dimmed quando desclassificado. Será chamado dentro da linha expandida sem alterações.

> ⚠️ A busca usa `atletaASnapshot.nome`/`atletaBSnapshot.nome` para lutas casadas (snapshot) e `atleta.nome` (lookup em `atletas[]`) para lutas de chave. `getAtletaResumo` (linha 318) já trata `tbd`/`bye` e atleta removido.

---

## 3. História de Usuário

```
Como organizador/árbitro,
quero ver o histórico completo de lutas em formato de lista compacta,
quero filtrar as lutas por nome do atleta,
e quero expandir uma linha sob demanda para ver o placar detalhado (pontos 2/3/4, vantagens, punições),
para que eu possa auditar rapidamente o resultado de qualquer luta durante ou após o torneio,
sem rolar por uma pilha de cards verbosa.
```

**Cenários alternativos:**

- Torneio sem nenhuma luta finalizada — empty state "Nenhuma luta finalizada ainda." (preservado).
- Busca por substring sem matches — empty state "Nenhuma luta encontrada para o termo '{busca}'." + contador "Exibindo 0 de M lutas".
- Atleta removido do torneio — `getAtletaResumo` devolve "Atleta removido"; a busca casará com esse texto (decisão documentada em 8.2).
- Luta casada (luta avulsa) — incluída na mesma tabela, com badge "LUTA CASADA" ao lado da categoria.
- Luta com `desclassificacao=true` — o atleta desclassificado recebe `line-through` + badge "DQ" vermelho; o vencedor recebe badge "VENCEDOR" verde.
- Várias linhas expandidas — comportamento **acordeão**: clicar em uma linha fecha qualquer outra aberta.

---

## 4. Requisitos Funcionais

- [ ] RF-01: a aba "Lutas" de `/admin/resultados` renderiza, no topo, um `<TextInput>` com `leftSection={<IconSearch size={16} />}` e `placeholder="Buscar por nome do atleta"`, com `aria-label="Buscar lutas por nome do atleta"`.
- [ ] RF-02: a busca é **case-insensitive** e aplica `includes` (substring match) sobre `atletaA.nome` **OU** `atletaB.nome` (luta de chave) e `atletaASnapshot.nome` **OU** `atletaBSnapshot.nome` (luta casada).
- [ ] RF-03: a busca é **reativa** (filtra em tempo real a cada `onChange`, sem botão "Buscar"). `busca.trim() === ''` ⇒ lista completa.
- [ ] RF-04: abaixo do campo de busca, um texto "Exibindo N de M lutas" mostra a contagem (`N` = filtradas, `M` = totais).
- [ ] RF-05: a tabela usa `<Table>` do Mantine com `stickyHeader`, `highlightOnHover` e `striped`. Está envolvida em um `<Paper>` com `style={{ overflow: 'auto', maxHeight: '60vh' }}` (mesmo padrão da aba "Atletas").
- [ ] RF-06: as colunas são, nesta ordem: **Categoria**, **Luta**, **Atleta A**, **Placar**, **Atleta B**, **Tipo vitória**, **Tempo**, **Status**. Em telas estreitas (<700px) a tabela rola horizontalmente.
- [ ] RF-07: a coluna "Categoria" exibe o nome da categoria (ex.: "Adulto Masculino Leve") em uma célula; se a luta for casada, exibe também badge "LUTA CASADA" ao lado do nome.
- [ ] RF-08: a coluna "Luta" exibe "L{ordem} · R{rodada}" para chaves; para casadas, exibe "—" (sem ordem/rodada).
- [ ] RF-09: as colunas "Atleta A" e "Atleta B" exibem o nome do atleta. Se o atleta for o vencedor, adiciona badge verde "VENCEDOR". Se for o desclassificado (`desclassificadoId === atleta.id`), aplica `text-decoration: line-through` e badge vermelho "DQ".
- [ ] RF-10: a coluna "Placar" exibe o placar resumido no formato "{totalA} × {totalB}", com `font-weight: 900` e `font-size: lg`. O número do vencedor fica em verde (`green.7`), o do perdedor em `dark`, o do DQ em `red.7` — `dimmed` quando desclassificado.
- [ ] RF-11: a coluna "Tipo vitória" exibe um `<Badge>` com o mesmo `getTipoVitoria` (label + ícone + cor) já utilizado pelos cards. Texto: "🏆 Pontos" | "🏁 Finalização" | "🚫 Desclassificação" | "⚖️ Desempate".
- [ ] RF-12: a coluna "Tempo" exibe `formatarDuracao(tempoRealSegundos)` (mm:ss), ou "—" se `tempoRealSegundos` for `undefined`/`null`.
- [ ] RF-13: a coluna "Status" exibe um `<Badge>` "FINALIZADA" verde para `status='completed'`, ou "WO" vermelho para `status='wo'`. (Não há lutas `pending` no memo `todasLutasFinalizadas`.)
- [ ] RF-14: cada linha é clicável (`onClick` na `<Table.Tr>`) e alterna a expansão (acordeão). Cursor `pointer`; `aria-label` descritivo "Luta {categoria} — {atletaA} vs {atletaB} — clique para expandir/recolher".
- [ ] RF-15: quando uma linha está expandida (`expandedId === item.id`), uma `<Table.Tr>` adicional é renderizada logo abaixo com `colSpan={8}`, contendo um `<Group>` com **dois cards de placar detalhado** lado a lado (um para A, um para B), reutilizando o componente `PlacarDetalhado` (pontos 2/3/4 como badges, vantagens, punições, total).
- [ ] RF-16: apenas uma linha pode estar expandida por vez; clicar em uma linha diferente fecha a anterior automaticamente.
- [ ] RF-17: empty state "Nenhuma luta finalizada ainda." permanece quando `M === 0` (preservado).
- [ ] RF-18: empty state adicional "Nenhuma luta encontrada para o termo '{busca}'." é exibido quando `M > 0` e `N === 0`. Este empty state exibe também o contador "Exibindo 0 de M lutas" e um botão "Limpar busca" que chama `setBusca('')`.

---

## 5. Requisitos Não-Funcionais

- **Performance:** filtro client-side O(N) sobre o memo `todasLutasFinalizadas` (já computado); sem IPC novo; sem refetch. Tabela virtualiza visualmente via `stickyHeader` + `maxHeight: 60vh` (mesmo padrão da aba Atletas).
- **Segurança:** nenhuma entrada nova do usuário; nenhuma persistência; nenhuma chamada IPC.
- **Acessibilidade:** `<TextInput>` com `aria-label`; `<Table.Tr>` clicáveis com `role="button"`, `tabIndex={0}`, `aria-expanded`, `aria-controls`; foco visível (Mantine `highlightOnHover` + `style={{ outline: 'none' }}` + `:focus-visible` herdado do tema).
- **Compatibilidade:** Electron + React 18 + Mantine 7. Sem mudança de browser-only API.
- **Observabilidade:** nenhuma métrica/log novo.

---

## 6. Análise da Aplicação

- **Arquitetura geral:** renderer React consumindo IPC do main process (já carrega `getActiveTournament`). Esta feature é 100% client-side após o load.
- **Padrões em uso:**
  - `@mantine/core` (Tabs, Table, TextInput, Badge, Paper, Group, Stack).
  - `useMemo` para memoização (já há 4 memos: `atletas`, `chaves`, `chavesEncerradas`, `todasLutasFinalizadas`).
  - `useState` para estado local de UI.
  - Ícones: `@tabler/icons-react` (já há `IconSwords` importado; adicionar `IconSearch` e `IconX`).
- **Fluxo de dados:** o `getActiveTournament` (useEffect, linha 298) carrega `torneio` uma única vez. `todasLutasFinalizadas` (memo, linha 377) gera a lista consolidada. Esta spec adiciona:
  - `useState<string> busca` (estado de busca).
  - `useMemo` que combina `todasLutasFinalizadas` com `getAtletaResumo` para extrair `atletaANome`/`atletaBNome` (uma única vez por mudança de `torneio` ou `atletas`).
  - `useMemo` que aplica o filtro sobre essa lista enriquecida.
  - `useState<string | null> expandedId` (id da linha expandida; acordeão).
- **Contratos de API:** **inalterados**. Nenhum IPC novo.

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---|---|---|
| `src/pages/Resultados.tsx` | Modificar | Substituir `Tabs.Panel value="lutas"` (cards) por tabela compacta com busca, stickyHeader, expansão e empty states. Adicionar 2 ícones (`IconSearch`, `IconX`) e 2 estados (`busca`, `expandedId`). |
| `spec/historico-lutas-resultados.md` | Criar | Esta especificação. |
| `doc/spec.md` | Modificar | Adicionar entrada no **Histórico de Correções** após implementação. |

> ⚠️ Nenhum outro arquivo precisa ser tocado. `PlacarDetalhado` (componente interno) é reutilizado sem mudança. As outras 5 abas (Visão Geral, Chaves, Lutas Casadas, Equipes, Árbitros, Atletas) seguem intactas.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- **Reuso de `todasLutasFinalizadas` (linha 377):** o memo atual já cobre chaves + casadas e filtra `isLutaValida` (lutas com vencedor real). Decisão: **reusar** este memo como entrada; adicionar apenas um segundo memo que extrai `atletaANome`/`atletaBNome` para alimentar o filtro.
- **`AtletaSnapshot` vs `getAtletaResumo`:** para lutas casadas, o nome vem do `atletaASnapshot.nome` (já gravado no `LutaCasada`); para lutas de chave, o nome vem do `getAtletaResumo(id)` que faz lookup em `atletas[]`. Decisão: o memo de enriquecimento trata os dois caminhos num único objeto unificado.
- **`PlacarDetalhado` em linha expandida:** o componente já lida com `placar` undefined, mas o `useMemo` da linha atual já garante que só lutas com vencedor chegam à tabela (`isLutaValida` filtra). Ainda assim, o `PlacarDetalhado` mantém o fallback "0" como defesa.
- **Estilo da linha clicável:** `<Table.Tr>` no Mantine não tem `onClick` documentado para esse caso. Decisão: usar `onClick` direto no `<Table.Tr>` + `style={{ cursor: 'pointer' }}` + `aria-expanded`; testado com `useState` simples. **Risco baixo** (Mantine 7 aceita `onClick` em `<Table.Tr>`).
- **`aria-expanded` em `<Table.Tr>`:** não é um padrão ARIA formal para `<tr>` (é para `button`/`row`). Decisão: aplicar `aria-expanded` e `role="button"` para melhor acessibilidade; o screen reader ainda anuncia a linha como célula.

### 8.2 Ambiguidades nos Requisitos

- **"Formato de lista" (Feature original):** pode ser tabela ou lista vertical. Decisão: **tabela compacta** (escaneável, ocupa menos espaço vertical que cards). A lista vertical seria similar aos cards atuais, sem ganho real de densidade.
- **"Buscar por nome" (Feature original):** case-insensitive vs case-sensitive; match exato vs substring. Decisão: case-insensitive + substring (`includes`). Decisão de UX padrão em sistemas de filtro.
- **"Luta" no singular vs plural na busca:** a busca casa com **qualquer** dos dois atletas (A ou B) da luta. Decisão atual: `atletaA.nome OR atletaB.nome` contém o termo.
- **Atleta removido e busca:** `getAtletaResumo` devolve "Atleta removido". Decisão: a busca casa com "removido" também (não filtramos esse caso — a UX mais previsível é "o termo aparece em qualquer um dos dois nomes mostrados").
- **Comportamento de expansão (RF-14):** acordeão (uma linha por vez) ou múltiplas? Decisão: **acordeão** (mais limpo visualmente, evita poluir a tabela com várias expansões simultâneas).
- **Placar detalhado das duas pontas:** mostro sempre A e B lado a lado ou só o vencedor? Decisão: sempre os dois (consistente com o card atual; necessário para auditoria).
- **Busca em lutas casadas:** o snapshot guarda o nome no momento da criação. Se o atleta foi renomeado/removido depois, a busca continua funcionando contra o nome original (decisão aceita — é o nome "oficial" da luta casada).
- **Status `wo` (BYE) na coluna Status:** BYE aparece como `status='wo'` mas é resolvido na geração (sem luta real). Decisão atual: o memo `todasLutasFinalizadas` inclui essas lutas (porque têm `vencedorId` definido). Decisão: manter — usuário pode querer auditar WOs pré-preenchidos também.

### 8.3 Riscos

- **Risco baixo.** Mudança é isolada em uma única `<Tabs.Panel>`. Nenhuma regra de negócio removida; nenhum IPC novo; nenhuma migração de dados.
- **Regressão potencial:** se a tabela quebrar com N muito grande (>200 linhas), a rolagem interna continua funcional (já testado na aba Atletas).
- **Reuso equivocado de `PlacarDetalhado`:** o componente é interno (não exportado). Como está no mesmo arquivo (`Resultados.tsx`), reuso é direto — zero risco.
- **Manutenção do `expandedId`:** se o usuário expandir uma linha e depois filtrar a busca, a linha expandida pode "sumir" mas o `expandedId` continua apontando para um id não renderizado. Decisão: o `expandedId` é resetado para `null` sempre que o `useMemo` recalcula o filtro (via `useEffect` mínimo de reset quando `busca` muda). **Decisão final**: resetar `expandedId` quando `busca` muda (evita acúmulo).

> ⚠️ Nenhum impedimento bloqueante.

---

## 9. Critérios de Aceite

- [ ] CA-01: dado que o torneio tem 8 lutas finalizadas em 2 chaves, quando o usuário abre a aba "Lutas", então vê uma tabela com 8 linhas (sticky header, maxHeight 60vh) e o contador "Exibindo 8 de 8 lutas".
- [ ] CA-02: dado que existe a luta "João Silva vs Maria Souza", quando o usuário digita "joão" no campo de busca, então apenas as linhas em que "joão" (case-insensitive) aparece no Atleta A ou B são exibidas; o contador atualiza para "Exibindo N de 8 lutas".
- [ ] CA-03: dado que o usuário digitou "ZZZ" (sem matches), quando a busca é aplicada, então é exibido "Nenhuma luta encontrada para o termo 'ZZZ'." com o contador "Exibindo 0 de 8 lutas" e um botão "Limpar busca" que, ao ser clicado, chama `setBusca('')`.
- [ ] CA-04: dado que a busca está vazia, quando a lista é renderizada, então todas as M lutas são exibidas e o contador mostra "Exibindo M de M lutas".
- [ ] CA-05: dado que uma luta tem vencedor A, quando a linha é renderizada, então o nome do Atleta A tem badge verde "VENCEDOR" e o nome do Atleta B não tem; o placar resumido mostra "{totalA} × {totalB}" com o número de A em `green.7` e o de B em `dark`.
- [ ] CA-06: dado que uma luta tem `desclassificacao=true` e `desclassificadoId=B`, quando a linha é renderizada, então o nome do Atleta B tem `text-decoration: line-through` e badge vermelho "DQ"; o badge "Tipo vitória" é "🚫 Desclassificação" (cor red).
- [ ] CA-07: dado uma linha de luta casada, quando renderizada, então exibe badge "LUTA CASADA" cinza-escuro na coluna "Categoria" e badge "FINALIZADA" verde na coluna "Status" (ou "WO" se `status='wo'`).
- [ ] CA-08: dado que o usuário clica em uma linha, quando a linha é clicada, então uma nova `<Table.Tr>` é renderizada logo abaixo com `colSpan={8}`, contendo dois blocos `PlacarDetalhado` lado a lado (um para A, um para B). Clicar novamente fecha.
- [ ] CA-09: dado que uma linha está expandida, quando o usuário clica em outra linha, então a anterior fecha e a nova abre (acordeão).
- [ ] CA-10: dado que o usuário clica em uma linha, o elemento recebe `aria-expanded="true"` e `role="button"`. Clicar novamente ajusta para `aria-expanded="false"`.
- [ ] CA-11: dado que o usuário digita uma busca que filtra a lista e a linha atualmente expandida deixa de aparecer, quando o filtro é recalculado, então `expandedId` é resetado para `null` (a linha não volta "fantasma" quando a busca é limpa).
- [ ] CA-12: dado que o torneio não tem nenhuma luta finalizada, quando a aba "Lutas" é renderizada, então é exibido o empty state "Nenhuma luta finalizada ainda." (preservado).
- [ ] CA-13: dado que o usuário redimensiona a janela para <700px, a tabela rola horizontalmente sem quebrar o layout (paper externo mantém `width: 100%`).

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Adicionar imports e estados
  - O que fazer: importar IconSearch e IconX de @tabler/icons-react. Adicionar useState<string> busca, useState<string | null> expandedId.
  - Arquivo: src/pages/Resultados.tsx (topo + linha ~293)
  - Como validar: tsc passa.

Passo 2: Criar memo de enriquecimento e memo de filtro
  - O que fazer: criar useMemo que, a partir de todasLutasFinalizadas, gera uma lista enriquecida com atletaANome/atletaBNome. Criar useMemo que aplica o filtro de busca. Resetar expandedId quando busca muda (useEffect).
  - Arquivo: src/pages/Resultados.tsx (após o useMemo todasLutasFinalizadas, linha ~405)
  - Como validar: tsc passa; digitar "x" no console.log mostra o array filtrado.

Passo 3: Substituir a renderização da aba "Lutas"
  - O que fazer: substituir o conteúdo de <Tabs.Panel value="lutas"> (linhas 529–620) por:
    - TextInput de busca + contador + tabela compacta (stickyHeader, maxHeight 60vh) + linhas clicáveis com expansão acordeão usando PlacarDetalhado.
  - Arquivo: src/pages/Resultados.tsx (linhas 529–620)
  - Como validar: abrir /admin/resultados, ver a tabela, digitar no input, clicar em uma linha, ver a expansão.

Passo 4: Validar com lint e tsc
  - O que fazer: rodar npm run lint e npx tsc --noEmit. Garantir que 0 erros novos são introduzidos.
  - Arquivos: -
  - Como validar: tsc e lint passam.

Passo 5: Verificar manualmente os CA
  - O que fazer: simular cenários: torneio com 8 lutas, busca por nome, clique em linha, lutas casadas, DQ, WO, etc.
  - Como validar: 13 CA verificados.

Passo 6: Atualizar doc/spec.md
  - O que fazer: adicionar entrada no Histórico de Correções referenciando esta spec.
  - Arquivo: doc/spec.md (linha 22)
  - Como validar: ver a entrada com data 2026-06-05.
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto (mudança isolada em renderer; sem migração).
- **Como monitorar:** visualmente em `npm run dev` — abrir Resultados, testar busca em diferentes bases (8, 50, 200+ lutas), verificar que a expansão não acumula e que a rolagem horizontal funciona em janelas estreitas.
- **Plano de rollback:** `git revert` do commit desta feature.

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os 13 CA verificados manualmente em dev.
- [ ] `npx tsc --noEmit` e `npm run lint` passam.
- [ ] As outras 5 abas (Visão Geral, Chaves, Lutas Casadas, Equipes, Árbitros, Atletas) seguem intactas.
- [ ] `PlacarDetalhado` reutilizado sem alteração.
- [ ] `doc/spec.md` (Histórico de Correções) atualizado com referência a esta feature.
- [ ] Nenhum item `[aberto]` pendente em `doc/spec.md` (já estava zerado).

---

## Checklist Rápido

- [x] Itens em "Problemas Encontrados" lidos — **nenhum `[aberto]`** (estado limpo após o ciclo anterior).
- [x] Documentos de referência lidos (`doc/requisitos.md` §3.23, código-fonte, 2 specs anteriores).
- [x] História de usuário e objetivo claros.
- [x] Arquivos envolvidos identificados e lidos.
- [x] Problemas e impedimentos listados (acordeão vs múltipla expansão, AtletaSnapshot vs getAtletaResumo, reset do expandedId ao filtrar).
- [x] Plano de implementação em ordem lógica.
- [x] Critérios de aceite verificáveis (13 CA).
- [x] Incertezas sinalizadas explicitamente (decisões em 8.2).
