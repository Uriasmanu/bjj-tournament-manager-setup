# Registro de Horário de Início e Término de Lutas

> Spec para a feature declarada em `doc/spec.md` seção **Feature**:
> *"registrar horario em que q luta começou e terminou(timestamp)"*

---

## 1. Contexto e Objetivo

- **O que é:** Persistir o horário (data + hora, formato `DD/MM/YYYY HH:MM:SS`) em que cada luta **começou** (primeiro clique no botão "Iniciar" do cronômetro) e **terminou** (confirmação final do resultado) para auditoria e exibição na tela de Resultados.
- **Por que existe:** O sistema não possui hoje nenhum registro de quando a luta ocorreu. Sem timestamp, é impossível responder perguntas como "em que horário a final da categoria pesado adulto aconteceu?" ou correlacionar uma luta com a transmissão/registro em vídeo do evento.
- **Quem usa:** Organizadores e árbitros que consultam a tela de Resultados após o evento para fins de auditoria, documentação ou geração de relatórios. Não afeta o fluxo operacional durante a luta.
- **Escopo:**
  - **Dentro:** adição dos campos `horarioInicio` e `horarioTermino` em `Luta`; adição do campo `horarioInicio` em `LutaCasada` (o campo `dataFinalizacao` existente será usado como término). Captura dos timestamps no `PlacarLuta` e `PlacarLutaCasada`. Exibição em `Resultados` para ambos os tipos.
  - **Fora:** notificações proativas de início/fim, exportação de relatórios em PDF/Excel baseados em timestamp, ordenação por horário, dashboards de tempo médio de luta, alteração do status `in_progress` que já existe no tipo mas não é utilizado pelo fluxo atual (decisão: não tocar nisso, manter comportamento atual).

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): 12 seções padrão, seção 5 (Requisitos Não-Funcionais) exige observabilidade, seção 11 (Rollout) pede plano de rollback.
- **Documento de requisitos** (`doc/requisitos.md`): seção 3.4 (Placar) menciona que a persistência da luta ocorre no JSON do torneio. Seção 3.11.1.3 (Propagação) já trata do `registrarResultadoHandler`. Seção 3.5 (Importação) trata de normalização retroativa — o mesmo padrão será seguido aqui (`normalizeLuta`/`normalizeLutaCasada`).
- **Documentação técnica existente** (`spec/credencial-dashboard-expiracao.md`): padrão seguido nos ciclos anteriores. Esta spec é independente.
- **Código-fonte relevante lido:**
  - `src/types/bracket.ts` (Luta, PlacarLuta): confirmado que `tempoRealSegundos?: number` já existe no tipo mas não é gravado em lugar nenhum — fora do escopo desta feature, não tocar.
  - `src/types/lutaCasada.ts` (LutaCasada): confirmado que `dataFinalizacao?: string | null` já existe e é gravado em ISO. Esta spec o reutiliza como `horarioTermino` (sem renomear para preservar compatibilidade com JSONs antigos).
  - `src/pages/PlacarLuta.tsx`: estado `rodando` indica cronômetro ligado. Lógica de start/pause/zerar existe mas nenhum timestamp é gravado.
  - `src/pages/PlacarLutaCasada.tsx:437`: já chama `dataFinalizacao: new Date().toISOString()` ao persistir — a única coisa que precisa mudar é também gravar `horarioInicio` no 1º "Iniciar".
  - `electron/brackets.ts:1442` `registrarResultadoHandler`: recebe placar/vencedor mas não recebe timestamps — precisa ser estendido.
  - `electron/lutasCasadas.ts:25` `normalizeLutaCasada`: precisa ganhar default para `horarioInicio`.
  - `electron/brackets.ts:954` `normalizeLuta`: precisa ganhar defaults para `horarioInicio` e `horarioTermino`.
  - `src/pages/Resultados.tsx:180-253` `LutaResumoCard`: componente que renderiza a luta finalizada em Resultados. Precisa ganhar exibição dos dois horários.

> ⚠️ **Inferência sinalizada:** a seção 3.4 de `requisitos.md` menciona o fluxo Placar mas não detalha o que é gravado em cada status de `Luta`. Estou inferindo (a confirmar nos passos) que `in_progress` nunca é gravado pelo fluxo atual e que `completed`/`wo` são os únicos estados pós-finalização.

---

## 3. História de Usuário

```
Como organizador de torneio,
quero ver, na tela de Resultados, o horário em que cada luta começou e terminou,
para que eu possa auditar a sequência do evento, gerar relatórios e cruzar com gravações de vídeo.
```

**Cenários alternativos:**

- *Luta finalizada sem nunca ter iniciado o cronômetro:* o sistema grava apenas `horarioTermino`. `horarioInicio` fica `undefined`. A UI exibe "—" para o horário de início.
- *Luta reaberta (status revertido para pending):* os timestamps são limpos. A próxima finalização gera novos timestamps (recomeça do zero).
- *Luta casada finalizada antes desta feature:* JSONs antigos não têm `horarioInicio` (campo opcional); o sistema exibe "—" para o horário de início, sem quebrar.

---

## 4. Requisitos Funcionais

- [ ] **RF-01:** Ao clicar pela primeira vez no botão "Iniciar" do cronômetro em `PlacarLuta` ou `PlacarLutaCasada`, o sistema deve gravar `horarioInicio` com a data/hora atual no formato `DD/MM/YYYY HH:MM:SS` (timezone local do usuário).
- [ ] **RF-02:** Pausar e retomar o cronômetro não deve sobrescrever `horarioInicio` (o valor do 1º Iniciar é preservado).
- [ ] **RF-03:** Ao confirmar o resultado no modal final de `PlacarLuta` ou `PlacarLutaCasada`, o sistema deve gravar `horarioTermino` (em `Luta`) ou `dataFinalizacao` (em `LutaCasada`) com a data/hora atual no formato `DD/MM/YYYY HH:MM:SS`.
- [ ] **RF-04:** A tela de Resultados deve exibir, para cada luta finalizada (chave ou casada), os campos "Início" e "Término" com os horários gravados, ou "—" se ausentes.
- [ ] **RF-05:** Se uma luta for reaberta (vencedor removido / status revertido para `pending`), os campos `horarioInicio` e `horarioTermino`/`dataFinalizacao` devem ser limpos.
- [ ] **RF-06:** JSONs de lutas legados (sem `horarioInicio`/`horarioTermino`/`dataFinalizacao`) devem ser lidos sem erro: `normalizeLuta` e `normalizeLutaCasada` devem tratar campos ausentes como `undefined`.
- [ ] **RF-07:** O sistema deve ser tolerante a lutas com `horarioInicio` mas sem `horarioTermino` (ex.: app crashou no meio da finalização): exibe só o início.

---

## 5. Requisitos Não-Funcionais

- **Performance:** nenhum impacto perceptível. Gravação é string de 19 caracteres, sem cálculo extra.
- **Segurança:** timestamps são gerados client-side no main process via `new Date()` (sem input do usuário) e formatados também no renderer. Não há risco de injection.
- **Acessibilidade:** os horários devem ser exibidos em texto simples (`<Text>`) com `aria-label` descritivo (ex.: "Iniciada em 05 de junho de 2026 às 14:32:10"). Não usar apenas cor para sinalizar.
- **Compatibilidade:** Electron + React + Mantine já existentes; `dayjs` já é dependência (usado em vários arquivos). Nenhuma nova dependência.
- **Observabilidade:** nenhum log adicional. Os timestamps são a própria observabilidade.
- **Atomicidade:** a gravação dos timestamps deve ser atômica com a gravação do resultado (mesma chamada IPC, mesmo `saveTorneio`).

---

## 6. Análise da Aplicação

- **Arquitetura:** renderer (PlacarLuta/PlacarLutaCasada) → IPC (`registrarResultado` ou `updateLutaCasada`) → main process → `saveTorneio` no disco. Timestamps viajam junto com o payload do resultado.
- **Padrões em uso:**
  - `dayjs` para formatação de datas (já usado em `PlacarLuta.tsx` e outros).
  - `normalizeLuta`/`normalizeLutaCasada` no main process para garantir defaults ao ler JSON.
  - `JSON.parse(JSON.stringify(...))` no `registrarResultadoHandler` para deep-clone do bracket antes de modificar.
  - Status da luta: `'pending' | 'completed' | 'wo'` na prática (o `'in_progress'` do tipo nunca é gravado pelo fluxo atual).
- **Fluxo de dados:**
  - Luta: renderer chama `window.electronAPI.registrarResultado({ ..., horarioInicio, horarioTermino })` → `registrarResultadoHandler` no main → modifica a luta no bracket → `saveTorneio` → retorna o bracket atualizado.
  - LutaCasada: renderer monta objeto `LutaCasada` completo com `horarioInicio` e `dataFinalizacao` → `window.electronAPI.updateLutaCasada(luta)` → `updateLutaCasadaHandler` no main → `saveTorneio` → retorna a luta atualizada.
- **Contratos de API (existentes):**
  - `registrarResultado(data: { chaveId, lutaId, vencedorId, status, placarA, placarB, finalizacao, desclassificacao, desempateArbitro })` — **modificar** para aceitar `horarioInicio` e `horarioTermino` opcionais.
  - `updateLutaCasada(luta: LutaCasada)` — **sem mudança de contrato**; o renderer envia o objeto completo (incluindo `horarioInicio` e `dataFinalizacao`).

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---|---|---|
| `src/types/bracket.ts` | Modificar | Adicionar `horarioInicio?: string` e `horarioTermino?: string` ao tipo `Luta`. |
| `src/types/lutaCasada.ts` | Modificar | Adicionar `horarioInicio?: string` ao tipo `LutaCasada` (já tem `dataFinalizacao`). |
| `src/pages/PlacarLuta.tsx` | Modificar | Gravar `horarioInicio` no 1º clique em "Iniciar" (estado `horarioInicioRef` + `useRef`); enviar `horarioInicio` e `horarioTermino` no `registrarResultado`; limpar ao reabrir luta. |
| `src/pages/PlacarLutaCasada.tsx` | Modificar | Mesma lógica: `horarioInicio` no 1º "Iniciar"; enviar no `updateLutaCasada`. |
| `electron/brackets.ts` | Modificar | Estender `registrarResultadoHandler` para aceitar e gravar `horarioInicio`/`horarioTermino`; estender `normalizeLuta` para defaults. Adicionar função `reabrirLutaHandler` (ou estender IPC existente) para limpar timestamps ao reabrir. |
| `electron/lutasCasadas.ts` | Modificar | Estender `normalizeLutaCasada` para default de `horarioInicio`. |
| `src/pages/Resultados.tsx` | Modificar | Adicionar props `horarioInicio`/`horarioTermino` em `LutaResumoCard`; renderizar em novo bloco. Passar props dos dois tipos de luta ao chamar `<LutaResumoCard>`. |
| `src/types/electron.d.ts` | Modificar (a confirmar) | Tipos de IPC permanecem os mesmos (renderer envia objeto completo). Pode não precisar de mudança. |
| `doc/spec.md` | Modificar | Adicionar entry no Histórico de Correções. |
| `doc/requisitos.md` | Modificar | Documentar a nova feature na seção 2.1 e 3.4 (Placar). |

> ⚠️ `src/types/electron.d.ts` sinalizado como "a confirmar" — os tipos de IPC `registrarResultado` e `updateLutaCasada` podem estar ou não neste arquivo. Se estiverem, precisam ser estendidos.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- **Campo `in_progress` do tipo `Luta` é morto:** o tipo define `'pending' | 'scheduled' | 'in_progress' | 'completed' | 'wo'`, mas o fluxo atual nunca grava `in_progress`. A spec atual não muda isso, mas é uma oportunidade perdida: se quiséssemos que `in_progress` refletisse o 1º "Iniciar", precisaríamos mudar o status. **Decisão:** não fazer; manter compatibilidade. `horarioInicio` é independente do status.
- **Timestamps client-side podem divergir se o usuário trocar o relógio:** a feature assume que o relógio do sistema está correto. Não há sincronização NTP. **Aceitável:** é o que o usuário pediu ("horário em que a luta começou/terminou", implícito no relógio local).
- **Reabertura de luta não tem handler explícito:** a reabertura acontece via edição direta do JSON ou via algum fluxo que ainda não investiguei. **Decisão:** implementar limpeza no `registrarResultadoHandler` quando o novo `vencedorId` for `null` (indicando reabertura) — se existir essa rota. Caso contrário, deixar para ciclo futuro.

### 8.2 Ambiguidades nos Requisitos

- ❓ **Reabertura de luta:** o usuário não esclareceu se deve limpar os timestamps. Resolvido: sim, limpar. Se reabrir e refinalizar, novos timestamps são gravados.
- ❓ **Formato `DD/MM/YYYY HH:MM:SS` vs `dayjs.format('DD/MM/YYYY HH:mm:ss')`:** o usuário escolheu formato brasileiro. Vou usar o dayjs para garantir.

### 8.3 Riscos

- **Mudança no tipo `Luta`:** adicionar campos opcionais é retroativo. Risco zero de regressão.
- **Mudança no handler `registrarResultado`:** o renderer envia campos novos. Se um renderer antigo chamar o handler, os campos ficam `undefined` e nada é gravado. Aceitável: ambos serão atualizados juntos neste ciclo.
- **JSONs legados sem `horarioInicio`:** `normalizeLuta` e `normalizeLutaCasada` vão retornar `undefined`. UI exibe "—". Sem erro.

---

## 9. Critérios de Aceite

- [ ] **CA-01:** dado que o usuário abre uma luta válida e clica "Iniciar" no cronômetro pela 1ª vez, quando o clique ocorre, então `horarioInicio` é gravado no estado da página com formato `DD/MM/YYYY HH:MM:SS` (regex: `^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$`).
- [ ] **CA-02:** dado que o usuário clicou "Iniciar" e depois clicou "Pausar" e "Iniciar" novamente, quando o estado é inspecionado, então `horarioInicio` permanece com o valor do 1º clique.
- [ ] **CA-03:** dado que o usuário confirma o resultado no modal final, quando a persistência é concluída, então `horarioTermino` (em Luta) ou `dataFinalizacao` (em LutaCasada) é gravado no JSON do torneio com formato `DD/MM/YYYY HH:MM:SS`.
- [ ] **CA-04:** dado que uma luta foi finalizada, quando o usuário acessa a tela de Resultados, então a UI exibe os horários "Início" e "Término" com os valores gravados, ou "—" se ausentes.
- [ ] **CA-05:** dado um JSON de torneio legado sem `horarioInicio`/`horarioTermino` em uma luta, quando o sistema carrega o torneio, então nenhum erro é lançado e a UI exibe "—" para os horários ausentes.
- [ ] **CA-06:** dado que o cronômetro nunca foi iniciado (luta finalizada diretamente), quando a UI exibe a luta em Resultados, então "Início" mostra "—" e "Término" mostra o horário gravado.
- [ ] **CA-07:** dado que uma luta tem apenas `horarioInicio` gravado (app crashou no meio), quando a UI exibe, então "Início" mostra o valor e "Término" mostra "—".
- [ ] **CA-08:** dado que a luta é reaberta (vencedor removido / status revertido), quando o usuário refinaliza, então os novos `horarioInicio`/`horarioTermino` substituem os antigos.

---

## 10. Plano de Implementação (Passo a Passo)

### Passo 1: Estender os tipos TypeScript
- **O que fazer:** Adicionar `horarioInicio?: string` e `horarioTermino?: string` ao tipo `Luta` em `src/types/bracket.ts`. Adicionar `horarioInicio?: string` ao tipo `LutaCasada` em `src/types/lutaCasada.ts` (não mexer em `dataFinalizacao`).
- **Arquivo(s):** `src/types/bracket.ts`, `src/types/lutaCasada.ts`.
- **Como validar:** `npx tsc --noEmit` passa sem erros.

### Passo 2: Estender `normalizeLuta` e `normalizeLutaCasada` no main process
- **O que fazer:** Adicionar defaults em `normalizeLuta` (`electron/brackets.ts:954`) para `horarioInicio` e `horarioTermino` = `undefined`. Adicionar default em `normalizeLutaCasada` (`electron/lutasCasadas.ts:25`) para `horarioInicio` = `undefined`.
- **Arquivo(s):** `electron/brackets.ts`, `electron/lutasCasadas.ts`.
- **Como validar:** `npx tsc --noEmit` passa.

### Passo 3: Estender `registrarResultadoHandler` no main process
- **O que fazer:** Aceitar `horarioInicio` e `horarioTermino` opcionais no `data` param. Se fornecidos, gravá-los na `luta` antes do `saveTorneio`.
- **Arquivo(s):** `electron/brackets.ts:1442`.
- **Como validar:** `npx tsc --noEmit` passa.

### Passo 4: Modificar `PlacarLuta.tsx` para capturar e enviar timestamps
- **O que fazer:**
  - Adicionar `useRef<string | null>(null)` para `horarioInicioRef` (mais leve que `useState` para evitar re-render desnecessário).
  - Em `handleIniciarPausar`: se `!rodando && horarioInicioRef.current === null`, setar `horarioInicioRef.current = dayjs().format('DD/MM/YYYY HH:mm:ss')`.
  - Em `persistirResultado`: calcular `horarioTermino = dayjs().format('DD/MM/YYYY HH:mm:ss')` e enviar junto com `horarioInicioRef.current` no payload do `registrarResultado`.
- **Arquivo(s):** `src/pages/PlacarLuta.tsx`.
- **Como validar:** `npx tsc --noEmit` + `npm run lint` passam.

### Passo 5: Modificar `PlacarLutaCasada.tsx` para capturar e enviar timestamps
- **O que fazer:** Mesma lógica do Passo 4: `horarioInicioRef` no 1º "Iniciar"; `dataFinalizacao: dayjs().format('DD/MM/YYYY HH:mm:ss')` no `persistirResultado`; `horarioInicio` enviado junto.
- **Arquivo(s):** `src/pages/PlacarLutaCasada.tsx`.
- **Como validar:** `npx tsc --noEmit` + `npm run lint` passam.

### Passo 6: Estender `LutaResumoCard` em `Resultados.tsx`
- **O que fazer:**
  - Adicionar props `horarioInicio?: string` e `horarioTermino?: string`.
  - Renderizar em um novo bloco `<Group>` ao lado do `IconClock` (ou abaixo) com `<Text size="xs" c="dimmed">Início: {horarioInicio ?? '—'}</Text>` e `<Text size="xs" c="dimmed">Término: {horarioTermino ?? '—'}</Text>`.
  - Atualizar `aria-label` do `Card` para incluir os horários.
- **Arquivo(s):** `src/pages/Resultados.tsx:180-253`.
- **Como validar:** `npx tsc --noEmit` + `npm run lint` passam; visualmente os horários aparecem em Resultados.

### Passo 7: Passar timestamps ao renderizar `<LutaResumoCard>` em Resultados
- **O que fazer:**
  - Para chaves (linha ~716): passar `horarioInicio={l.horarioInicio}` e `horarioTermino={l.horarioTermino}`.
  - Para lutas casadas (linha ~813): passar `horarioInicio={luta.horarioInicio}` e `horarioTermino={luta.dataFinalizacao ?? undefined}`.
- **Arquivo(s):** `src/pages/Resultados.tsx`.
- **Como validar:** ao abrir Resultados com lutas finalizadas, os horários aparecem.

### Passo 8: Validar lint + typecheck finais
- **O que fazer:** Rodar `npx tsc --noEmit` e `npm run lint`. Garantir 0 erros/warnings novos.
- **Arquivo(s):** nenhum.
- **Como validar:** comandos retornam 0.

### Passo 9: Atualizar `doc/spec.md` e `doc/requisitos.md`
- **O que fazer:**
  - Adicionar entry consolidada no Histórico de Correções de `doc/spec.md`.
  - Adicionar linha "✅ Completo" na tabela 2.1 de `doc/requisitos.md` (seção "Implementado MVP"), possivelmente com nome "Registro de horário de início/término de lutas".
  - Adicionar/estender seção em `doc/requisitos.md` (3.4 ou nova 3.4.1) descrevendo as regras de negócio dos timestamps.
- **Arquivo(s):** `doc/spec.md`, `doc/requisitos.md`.
- **Como validar:** diffs revisados.

### Passo 10: Teste manual end-to-end
- **O que fazer:** Iniciar torneio de teste, gerar chave de 2 atletas, abrir PlacarLuta, clicar Iniciar, aguardar 3 segundos, pausar, retomar, finalizar por pontos, abrir Resultados e confirmar que "Início" e "Término" aparecem. Repetir para Luta Casada.
- **Arquivo(s):** nenhum.
- **Como validar:** visual + JSON do torneio no disco contém os campos corretos.

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto. Feature é puramente aditiva (campos opcionais) — não há migração obrigatória, não há breaking change em JSONs legados.
- **Como monitorar:** abrir um torneio de teste novo e verificar que `torneios/{id}.json` contém `chaves[].lutas[].horarioInicio` e `horarioTermino` para lutas finalizadas, e `lutasCasadas[].horarioInicio` para lutas casadas finalizadas. `grep` no arquivo do torneio deve mostrar os campos.
- **Plano de rollback:** nenhuma migração foi aplicada; basta reverter o commit. JSONs já gravados com os novos campos permanecem compatíveis (campos extras são ignorados pelo código antigo).

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os 8 CA verificados (CA-01 a CA-08).
- [ ] `npx tsc --noEmit` retorna 0.
- [ ] `npm run lint` retorna 0 erros/warnings novos (3 pré-existentes permanecem).
- [ ] `doc/spec.md` Histórico de Correções atualizado.
- [ ] `doc/requisitos.md` atualizado (seção 2.1 + nova seção de regras de negócio).
- [ ] Teste manual end-to-end realizado com sucesso em Luta e LutaCasada.
- [ ] JSON de torneio no disco contém os novos campos após finalização.
- [ ] Luta reaberta: confirmada limpeza dos timestamps.

---

*Spec gerada seguindo `doc/spec.md` seções 1-12. Nenhuma seção do template foi pulada.*
