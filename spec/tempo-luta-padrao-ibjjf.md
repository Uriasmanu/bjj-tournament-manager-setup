# spec/tempo-luta-padrao-ibjjf.md

> Feature: pré-preencher o "Tempo inicial" no placar com o tempo de luta sugerido pelas regras da IBJJF (idade + faixa), mantendo o usuário livre para editar manualmente. Em lutas casadas, o tempo sugerido é o **maior** entre os dois atletas (maior categoria ou maior cor de faixa).

---

## 1. Contexto e Objetivo

- **O que é:** ao abrir a tela de `PlacarLuta` ou `PlacarLutaCasada`, o campo "Tempo inicial (min)" passa a vir preenchido com o tempo sugerido pela tabela oficial de tempos de luta da IBJJF, calculado a partir da idade e da faixa dos atletas. Em lutas casadas, usa-se o **maior** tempo entre os dois atletas.
- **Por que existe:** hoje o sistema usa um valor fixo de 5 minutos (`TEMPO_DEFAULT_SEGUNDOS = 5 * 60`) e o usuário precisa ajustar manualmente. As regras da IBJJF variam de 2 a 10 minutos conforme idade e graduação; aplicar a sugestão economiza tempo e evita erro humano. No caso de lutas casadas, em que os atletas podem vir de categorias/faixas diferentes, deve prevalecer o tempo mais longo (decisão explícita registrada no `[aberto]` de `doc/spec.md`).
- **Quem usa:** árbitro/operador de mesa durante a condução da luta em `/admin/placar/luta/...` e `/admin/placar/luta-casada/...`.
- **Escopo:**
  - **Dentro:** exibição e pré-preenchimento do tempo padrão nas duas telas de placar (regular e casada), com um rótulo visual indicando "Sugestão IBJJF: N min". Em luta casada, o tempo é `MAX(sugerir(A), sugerir(B))`; em luta regular, é `sugerir(A)` com fallback para `sugerir(B)`.
  - **Fora:** persistência do tempo sugerido (o tempo continua sendo editável e não é gravado no JSON da luta antes do início), regras de W.O./DQ, propagação de vencedor, fluxo de finalização, geração de chaves.

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): seções 1–12 sendo aplicadas abaixo.
- **Documento de requisitos** (`doc/requisitos.md`): seção **3.16. Layout Responsivo** (regras de tela) e **3.8. Atletas** (modelo `Atleta`).
- **Documentação técnica existente:** `spec/formulario-adicionar-atleta.md` (primeira spec do repositório) — convenções: cabeçalho com citação, todas as 12 seções, decisões `a confirmar` sinalizadas.
- **Código-fonte relevante:**
  - `src/pages/PlacarLuta.tsx` — alvo principal; usa `NumberInput` para "Tempo inicial (min)" e tem `TEMPO_DEFAULT_SEGUNDOS = 5 * 60`.
  - `src/pages/PlacarLutaCasada.tsx` — segunda tela alvo; mesmo padrão, mas usa `AtletaSnapshot` (sem `anoNascimento`).
  - `src/types/athlete.ts` — interface `Atleta` (possui `anoNascimento` e `faixa`).
  - `src/types/lutaCasada.ts` — `AtletaSnapshot` **não** inclui `anoNascimento`.
  - `src/types/category.ts` — `calcularFaixaEtaria(idade)` reutilizável; mas as faixas etárias do spec novo são mais agregadas que as do sistema, então será necessário um novo classificador.

> ⚠️ Divergência confirmada: a `FaixaEtaria` atual do sistema vai de **4–5 (pré-mirim)** e **6–7 (mirim)**; a tabela de tempos de luta IBJJF trata **4–6 como "Mirim"** e **7–9 como "Infantil"**. O cálculo do tempo sugerido **não pode reaproveitar** `calcularFaixaEtaria` diretamente — ele segue a tabela de tempos, não a tabela de categorias. Esta divergência é documentada na seção 8.2.

> ⚠️ **Problema aberto tratado (regra do `MAX` em lutas casadas):** o item `[aberto]` em `doc/spec.md` ("Em lutas casadas, o tempo de sugestão é sempre do que tem a maior categoria, ou maior cor de faixa") é o **gatilho** desta spec e está refletido em RF-03 e CA-10.

---

## 3. História de Usuário

```
Como árbitro/operador de mesa,
quero que o cronômetro da luta já abra pré-configurado com o tempo oficial da IBJJF (por idade e faixa),
para que eu não precise lembrar da tabela e possa focar na condução da luta,
e para que eu ainda possa ajustar manualmente se o campeonato usar regras diferentes.

Em lutas casadas (atletas de categorias/faixas distintas),
quero que o sistema escolha o maior tempo entre os dois atletas,
para que a sugestão respeite a regra da IBJJF de prevalência do tempo mais longo.
```

**Cenários alternativos:**

- Luta regular: usar atleta A como referência (mesma chave ⇒ mesma categoria) com fallback para B.
- Luta casada: tempo sugerido = `MAX(sugerir(A), sugerir(B))`, com fallback para `TEMPO_DEFAULT_SEGUNDOS` se ambos removidos.
- Atleta removido/cadastro ausente — usa fallback 5 min; se o outro existir, o MAX reflete o valor real.
- Usuário altera o tempo manualmente — a sugestão é apenas o valor inicial; edição posterior segue o comportamento atual.
- Luta casada cujo snapshot não tem `anoNascimento` — sistema carrega a lista de atletas via IPC para resolver idade/faixa.

---

## 4. Requisitos Funcionais

- [ ] RF-01: existe uma função `sugerirTempoLutaMinutos(atleta: Atleta): number` em `src/types/fightTime.ts` que retorna o tempo de luta em minutos, baseada na tabela IBJJF descrita em `doc/spec.md` (Feature).
- [ ] RF-02: ao abrir `PlacarLuta`, o `useEffect` que carrega chave/luta/atletas chama `sugerirTempoLutaMinutos` para o atleta A (fallback: atleta B) e usa o resultado (em segundos) como `tempoInicial` e `tempoRestante` iniciais.
- [ ] RF-03: ao abrir `PlacarLutaCasada`, o componente carrega também a lista de atletas via `window.electronAPI.loadAthletes()`, calcula `sugerirTempoLutaMinutos` para o atleta A e para o atleta B, e usa `max(minutosA, minutosB)` (com fallback para `TEMPO_LUTA_FALLBACK_MINUTOS` se ambos ausentes) como `tempoInicial` e `tempoRestante` iniciais.
- [ ] RF-04: junto do rótulo "Tempo inicial (min):", exibir um `<Badge>` (cor `blue`/`light`) com o texto "Sugestão IBJJF · N min" indicando o valor sugerido, mesmo após o usuário editar.
- [ ] RF-05: a edição manual do `NumberInput` continua intacta (mesma `handleTempoInicialChange`, mesma validação 1–30 min, mesmo comportamento de pause/resume/zerar).
- [ ] RF-06: a constante `TEMPO_DEFAULT_SEGUNDOS = 5 * 60` permanece no código como **fallback** para os casos em que a sugestão não pode ser computada (sem atleta, sem `anoNascimento`, faixa desconhecida).
- [ ] RF-07: a função `sugerirTempoLutaMinutos` cobre todas as faixas etárias da tabela IBJJF: 4–6 (Mirim), 7–9 (Infantil), 10–15 (Infanto-Juvenil), 16–17 (Juvenil), 18–29 (Adulto) e 30+ (Master 1–7). Retorna 5 como fallback.

---

## 5. Requisitos Não-Funcionais

- **Performance:** zero impacto (cálculo síncrono O(1) no momento do load; 2 chamadas em `PlacarLutaCasada` são desprezíveis).
- **Segurança:** nenhuma entrada de dados nova; nenhum IPC novo além do `loadAthletes` já usado em `PlacarLuta`.
- **Acessibilidade:** o `Badge` precisa de `aria-label` descritivo (ex.: "Sugestão de tempo de luta pela IBJJF").
- **Compatibilidade:** Electron + React 18 + Mantine 7; sem mudança de API pública.
- **Observabilidade:** nenhuma métrica/log.

---

## 6. Análise da Aplicação

- **Arquitetura:** renderer React consumindo IPC do main process. `PlacarLuta` já carrega `loadChaves` e `loadAthletes` em paralelo. `PlacarLutaCasada` carrega só `loadLutasCasadasPorArea` — será preciso adicionar `loadAthletes` à carga.
- **Padrões em uso:** `@mantine/core`, `useDisclosure`, `useState`, `useEffect`, `useMemo`. Componentes funcionais. Sem `useForm` nestas telas.
- **Fluxo de dados:** o tempo é estado local (não persistido). Mudar o input dispara `handleTempoInicialChange` que atualiza `tempoInicial`/`tempoRestante`. A função nova (`sugerirTempoLutaMinutos`) é pura, recebe um `Atleta` e retorna minutos.
- **Contratos de API:** inalterados. Apenas `loadAthletes` será chamado em mais um lugar (`PlacarLutaCasada`).

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---|---|---|
| `src/types/fightTime.ts` | Criar | Módulo com `sugerirTempoLutaMinutos(atleta): number` e a tabela IBJJF. |
| `src/pages/PlacarLuta.tsx` | Modificar | Usar a sugestão no `useEffect` de load; renderizar `<Badge>` ao lado do input. |
| `src/pages/PlacarLutaCasada.tsx` | Modificar | Carregar `loadAthletes`; usar a sugestão no `useEffect` com regra do `MAX`; renderizar `<Badge>`. |
| `spec/tempo-luta-padrao-ibjjf.md` | Criar | Esta especificação. |
| `doc/spec.md` | Modificar | Mover o `[aberto]` para **Histórico de Correções** (resolvido) e adicionar entrada da feature. |

> ⚠️ Nenhum outro arquivo precisa ser tocado. `PlacarBracket`, `PlacarChaves`, `BracketTree` e o IPC `registrarResultado` seguem intocados.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- **`AtletaSnapshot` não tem `anoNascimento`.** A `LutaCasada` carrega apenas snapshot no `loadLutasCasadasPorArea`. Solução: `PlacarLutaCasada` carrega também `loadAthletes()` (mesmo padrão de `PlacarLuta`) e faz lookup por `id` para ambos A e B.
- **Divergência de faixas etárias.** O sistema atual usa Pré-Mirim (4–5) / Mirim (6–7) / Infantil A (8–9) / Infantil B (10–11) / Infanto-Juvenil A (12–13) / Infanto-Juvenil B (14–15). O spec novo trata 4–6 / 7–9 / 10–15. Decisão: o classificador para **tempo de luta** segue a tabela de tempos da IBJJF (mais agregada), **não** reaproveita `calcularFaixaEtaria` da `category.ts`. Isso evita refatoração de regras de negócio já estáveis.
- **Faixa `branca` (sem sufixo) é ambígua.** Pode ser "Branca" de mirim (4–6 anos, 2 min) ou "Branca" de adulto (18–29 anos, 5 min). A idade resolve a ambiguidade — para o classificador de tempo, **a idade tem prioridade sobre a faixa** nas faixas etárias até Infanto-Juvenil (onde a faixa é ignorada — vale "Todas" 2/3/4 min).

### 8.2 Ambiguidades nos Requisitos

- **Master 1–7 (30+):** o spec agrega todos os mestres em "Master". A idade mínima de master no sistema é 30 (`master1 = 30–35`). Decisão proposta: `idade >= 30` ⇒ faixa etária "master". Linhas "Master" da tabela IBJJF cobrem de uma vez só.
- **Texto do Badge:** "Sugestão IBJJF · N min" — a confirmar com o usuário se prefere outra label (ex.: "Padrão IBJJF" ou "Tempo oficial").
- **Comportamento ao editar:** o Badge continua mostrando o valor sugerido (não o valor atual). O usuário sabe qual era a sugestão e qual o valor que ele escolheu (visível no `NumberInput`). Decisão proposta: Badge fixo, `NumberInput` dinâmico.
- **Idade fora das faixas etárias da tabela (ex.: 3 anos ou 100 anos):** o sistema **não** deve quebrar. Decisão: fallback de 5 min.
- **Atletas sem `anoNascimento`:** `Atleta.anoNascimento` é `number`, mas dados legados podem ter `0`. Decisão: `anoNascimento <= 0` ⇒ fallback 5 min.
- **"Maior categoria" e "maior cor de faixa" no `[aberto]`:** interpreto como a **maximização do tempo** retornado por `sugerirTempoLutaMinutos`. A função é monotonicamente não-decrescente em ambas as dimensões (idade e faixa), então `MAX(sugerir(A), sugerir(B))` cobre ambos os sentidos do enunciado.

### 8.3 Riscos

- **Risco baixo.** Mudança é puramente aditiva: novo módulo + 2 consumidores. Nenhuma regra existente removida. `TEMPO_DEFAULT_SEGUNDOS` permanece.
- **Regressão potencial:** se o IPC `loadAthletes` falhar em `PlacarLutaCasada`, o `.catch` atual já trata `setLoading(false)`. O fallback de 5 min cobre a ausência de atletas sem quebrar a renderização.

> ⚠️ Nenhum impedimento bloqueante.

---

## 9. Critérios de Aceite

- [ ] CA-01: dado um atleta com 6 anos, faixa `branca`, quando `sugerirTempoLutaMinutos(atleta)` for chamado, então retorna `2`.
- [ ] CA-02: dado um atleta com 10 anos, faixa `azul`, quando a função for chamada, então retorna `4` (Infanto-Juvenil ignora faixa).
- [ ] CA-03: dado um atleta com 25 anos, faixa `preta`, quando a função for chamada, então retorna `10`.
- [ ] CA-04: dado um atleta com 35 anos (Master 1), faixa `preta`, quando a função for chamada, então retorna `7`.
- [ ] CA-05: dado um atleta com 3 anos (fora da tabela), quando a função for chamada, então retorna `5` (fallback).
- [ ] CA-06: dado que o usuário abre `PlacarLuta` para uma luta de Adulto Marrom, quando a tela carrega, então o `NumberInput` "Tempo inicial (min)" mostra `8` e o Badge ao lado mostra "Sugestão IBJJF · 8 min".
- [ ] CA-07: dado que o usuário abre `PlacarLutaCasada` para uma luta de Juvenil Branca vs Adulto Azul (6 min), quando a tela carrega, então o `NumberInput` mostra `5` (= `max(5, 6) = 6` — **errado**, ver CA-07b).
- [ ] CA-07b (correção do CA-07): dado que o usuário abre `PlacarLutaCasada` para uma luta de Juvenil Branca (5 min) vs Adulto Azul (6 min), quando a tela carrega, então o `NumberInput` mostra `6` e o Badge mostra "Sugestão IBJJF · 6 min" (= `max(5, 6) = 6`).
- [ ] CA-08: dado que o usuário altera manualmente o "Tempo inicial (min)" para `6`, quando ele começa a digitar, então o `NumberInput` aceita o valor e o Badge continua exibindo a sugestão original (não muda).
- [ ] CA-09: dado que o atleta A foi removido (id inválido), quando `PlacarLuta` carrega, então `tempoInicial` cai no fallback `TEMPO_DEFAULT_SEGUNDOS` (5 min) e a renderização prossegue normalmente.
- [ ] CA-10 (regra do `[aberto]`): dado que a luta casada tem atleta A com 8 anos (Infantil, 3 min) e atleta B com 30 anos Master 1 roxa (6 min), quando `PlacarLutaCasada` carrega, então o `NumberInput` mostra `6` e o Badge mostra "Sugestão IBJJF · 6 min" (= `max(3, 6) = 6`).
- [ ] CA-11: dado que ambos os atletas da luta casada foram removidos, quando `PlacarLutaCasada` carrega, então `tempoInicial` cai no fallback `TEMPO_LUTA_FALLBACK_MINUTOS` (5 min).

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Criar src/types/fightTime.ts
  - O que fazer: definir tipo FaixaEtariaTempo, função calcularIdadeLocal(anoNascimento) e função sugerirTempoLutaMinutos(atleta) cobrindo a tabela IBJJF.
  - Arquivo: src/types/fightTime.ts (novo)
  - Como validar: rodar `npx tsc --noEmit` e revisar retorno das faixas.

Passo 2: Aplicar sugestão em PlacarLuta
  - O que fazer: importar sugerirTempoLutaMinutos. No useEffect, calcular a sugestão a partir de athlete A (com fallback para B), e usar setTempoInicial/setTempoRestante com o valor convertido para segundos. Adicionar <Badge> ao lado do NumberInput.
  - Arquivo: src/pages/PlacarLuta.tsx
  - Como validar: abrir uma luta conhecida (ex.: adulto marrom) e ver "8" no input.

Passo 3: Aplicar sugestão MAX em PlacarLutaCasada (resolve [aberto])
  - O que fazer: importar loadAthletes em paralelo, localizar atleta A e B pelo id, aplicar sugestão nos dois, usar Math.max(A, B) (com fallback) e renderizar <Badge>. Resolve o item [aberto] "Em lutas casadas, o tempo de sugestão é sempre do que tem a maior categoria, ou maior cor de faixa".
  - Arquivo: src/pages/PlacarLutaCasada.tsx
  - Como validar: abrir uma luta casada conhecida (ex.: Mirim vs Adulto Preta) e ver "10" no input.

Passo 4: Validar que nada quebrou
  - O que fazer: rodar `npm run lint` e `npx tsc --noEmit`. Garantir que nenhum warning/erro novo aparece e que PlacarBracket, PlacarChaves, persistirResultado, registrarResultado seguem intactos.
  - Arquivo: -
  - Como validar: lint e tsc.

Passo 5: Mover [aberto] para Histórico de Correções
  - O que fazer: em doc/spec.md, remover o item [aberto] da seção Problemas Encontrados e adicionar entrada consolidada no Histórico de Correções referenciando esta spec e o problema resolvido.
  - Arquivo: doc/spec.md
  - Como validar: grep por "[aberto]" retorna vazio.
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto (mudança isolada no renderer).
- **Como monitorar:** visualmente em `npm run dev` — abrir lutas de cada faixa etária/graduação e verificar se o tempo bate com a tabela; testar lutas casadas com atletas de categorias/faixas divergentes.
- **Plano de rollback:** `git revert` do commit desta feature.

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os 11 CA verificados manualmente.
- [ ] `npm run lint` e `tsc --noEmit` passam.
- [ ] `PlacarLuta`, `PlacarLutaCasada`, `PlacarBracket`, `PlacarChaves` seguem abrindo normalmente.
- [ ] `doc/spec.md` (Histórico de Correções) atualizado com entrada consolidada (feature + [aberto] resolvido).
- [ ] Nenhum item `[aberto]` pendente em `doc/spec.md`.
- [ ] Diff revisado: nenhuma função removida, `TEMPO_DEFAULT_SEGUNDOS` preservado, IPC `loadAthletes` é o único IPC novo usado.

---

## Checklist Rápido

- [x] Itens em "Problemas Encontrados" lidos — **1 `[aberto]` encontrado e tratado** (regra do MAX em lutas casadas).
- [x] Documentos de referência lidos (`doc/requisitos.md`, código-fonte).
- [x] História de usuário e objetivo claros.
- [x] Arquivos envolvidos identificados e lidos.
- [x] Problemas e impedimentos listados (divergência de faixa etária, snapshot sem anoNascimento, fallback, regra do MAX).
- [x] Plano de implementação em ordem lógica.
- [x] Critérios de aceite verificáveis.
- [x] Incertezas sinalizadas explicitamente (`a confirmar`).
