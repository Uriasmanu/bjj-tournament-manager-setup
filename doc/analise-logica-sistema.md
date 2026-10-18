# Análise da Lógica do Sistema — BJJ Tournament Manager

> Documento gerado a partir de leitura integral do código em `electron/*.ts`, `src/pages/*.tsx`, `src/hooks`, `src/services`, `src/utils` e `src/types`, cruzado com `doc/requisitos.md` e `doc/IBJJF.md`.

---

## 1. Para que serve o sistema

Aplicativo desktop (Electron + React/TypeScript) para **organizar e arbitrar campeonatos de Jiu-Jitsu seguindo as regras da IBJJF**. Cobre o ciclo completo de um evento:

1. **Cadastro** de atletas, árbitros e áreas de luta (tatames).
2. **Categorização** automática por idade/peso/gênero/faixa (regras IBJJF) ou categorias customizadas.
3. **Geração de chaves** (brackets) de eliminação simples, com sorteio, blindagem de equipe (atletas da mesma equipe em lados opostos) e repescagem especial para grupos de 3.
4. **Arbitragem ao vivo**: cronômetro, pontuação (2/3/4 pts, vantagens, punições), reconhecimento de gestos via webcam (MediaPipe) como atalho de pontuação, e um segundo monitor ("telão") espelhando o placar para o público.
5. **Lutas casadas**: partidas avulsas fora da chave normal (ex.: atleta sem oponente na categoria).
6. **Resultados e relatórios**: pódio (ouro/prata/dois bronzes, sem disputa de 3º lugar — regra IBJJF), ranking por equipe, geração de PDFs (chaves, resultados, lutas casadas).
7. **Múltiplos torneios**: criar, importar/exportar (merge por `updatedAt`), ativar um torneio por vez, com dois modos de operação — `admin` (acesso completo) e `area` (operador de tatame, UI restrita ao placar).
8. **Licenciamento**: ativação local vinculada à máquina, com expiração de 1 ano.

### Arquitetura
- **Sem banco de dados**: cada torneio é um arquivo JSON único em `userData/data/torneios/{id}.json` contendo atletas, árbitros, áreas, chaves, lutas casadas e categorias customizadas. O torneio ativo é apontado por `torneio-ativo.json`.
- **Processo principal (Electron)** concentra toda a lógica de negócio via handlers IPC (`electron/*.ts`); o **renderer (React)** é majoritariamente apresentação + chamadas IPC.
- Uma segunda janela (**"telão"**) é criada separadamente para exibir o placar ao vivo em projetor/TV.

---

## 2. Módulos e regras de negócio principais

| Módulo | Responsabilidade | Regra/observação notável |
|---|---|---|
| `electron/tournament.ts` | CRUD de torneios, ativação, import/export | Import faz *merge* item a item por `updatedAt` (last-write-wins); novo torneio já nasce com categorias não-adultas desabilitadas |
| `electron/athletes.ts` / `referees.ts` / `areas.ts` | CRUD com soft-delete | Auto-migração silenciosa de registros legados sem `id`/timestamps |
| `electron/categorias.ts` | Categorias habilitadas/customizadas por torneio | Sem validação de sobreposição/limites nas categorias customizadas |
| `electron/lutasCasadas.ts` | Partidas avulsas | Guarda **snapshot** congelado dos atletas no momento da criação |
| `electron/brackets.ts` (~1750 linhas) | Geração de chaves, sorteio, avanço de vencedor, auto-atribuição de árbitros | Algoritmo **hardcoded por tamanho** de chave (2 a 16), com repescagem especial para 3 atletas (regra IBJJF) |
| `electron/pdf.ts` | Geração de PDFs (chaves, resultados, lutas casadas) via `pdfkit` | Calcula pódio com bronze duplo (sem disputa de 3º) |
| `electron/activation.ts` | Licenciamento por máquina | Senha mestra fixa no código-fonte; expiração de 1 ano |
| `src/pages/PlacarLuta.tsx` / `PlacarLutaCasada.tsx` | Tela de arbitragem ao vivo | Cronômetro, pontuação manual + gestos, reset via Ctrl+Z |
| `src/hooks/useGestureScoring.ts` + `src/services/gestureDetection.ts` | Pontuação por gesto via webcam (MediaPipe) | Carrega modelo de **CDN externo em runtime**; lado do atleta fixo em `'A'` (lado B não implementado) |
| `src/types/category.ts` | Geração das categorias IBJJF | **`gerarCategorias()` só itera `['adulto']`** — categorias infantis/master nunca são geradas, apesar dos dados existirem no arquivo |

---

## 3. Pontos fortes observados

- Regras de negócio da IBJJF (repescagem de 3, bronze duplo, blindagem de equipe, tempos de luta por faixa/idade) estão **corretamente implementadas** e bem documentadas em `doc/IBJJF.md`/`doc/requisitos.md`.
- `doc/requisitos.md` é mantido como um changelog vivo e bastante fiel ao código — raro e valioso.
- Soft-delete consistente entre entidades, com cascata correta (ex.: deletar árbitro limpa `arbitroId` nas chaves).

---

## 4. Sugestões de melhoria

### Críticas (bugs/funcionalidade quebrada)
1. **Categorias infantis/master inacessíveis**: `gerarCategorias()` em `src/types/category.ts` hardcoda `faixasEtarias: ['adulto']`. Todas as tabelas de peso para faixas infantis/master (`KIDS_PESO_LIMITES`) existem mas nunca são usadas — `classificarCategoria()` sempre retorna `null` para atletas não-adultos. Dado que o IBJJF.md documentado cobre categorias infantis, isso é uma lacuna funcional relevante (hoje contornada só via categorias customizadas manuais). *(Confirmado lendo `src/types/category.ts:88`.)*
2. **Pontuação por gesto só funciona para o lado A**: detecção de lado (atleta A vs B, provavelmente por bracelete) nunca foi implementada — feature "Fase 1" ficou pela metade e deixa a pontuação por gesto praticamente inutilizável em combate real. *(Confirmado em `src/services/gestureDetection.ts:141`, `side: 'A'` fixo.)*
3. **"Detecção de braço" é, na prática, detecção de dedos da mão — não funciona como descrito**: `isArmHorizontal` e `isArmRaisedToShoulderWithFist` (`src/services/gestureDetection.ts:40-58`) nomeiam variáveis como `shoulder`/`elbow`/`wrist` usando os índices **11, 13 e 15** — mas a fonte de dados é o modelo **MediaPipe Hands**, que só retorna 21 pontos da mão (0-20), sem nenhum ponto de ombro/cotovelo. Esses índices correspondem na verdade à articulação DIP do dedo médio (11), à base do dedo anelar (13) e à DIP do anelar (15). Ou seja, os gestos de "vantagem" (braço na horizontal) e "punição" (braço erguido com punho fechado) calculam um ângulo entre juntas de dedos da mesma mão, não a postura do braço — a lógica não mede o que o nome das funções e a documentação (`doc/fase1-implementacao.md`) dizem medir. Isso é mais grave que uma simples discrepância de gesto: a feature de vantagem/punição por gesto provavelmente nunca funcionou como projetada.

### Arquiteturais (risco de manutenção)
4. **Duplicação massiva de código**:
   - `loadTorneio`/`saveTorneio`/`getTorneioPath` reimplementados em 6+ arquivos de `electron/`.
   - `FAIXA_LABEL`/`FAIXA_ORDER`/`capitalize` repetidos em `brackets.ts`, `pdf.ts`, `PlacarLuta.tsx`, `PlacarExibicao.tsx`, `PlacarChaves.tsx`.
   - `PlacarLuta.tsx` e `PlacarLutaCasada.tsx` são componentes quase idênticos de ~1000 linhas cada (confirmado: 1059 e 1003 linhas) — qualquer correção de pontuação precisa ser replicada nos dois.
   - Lógica de cálculo de pódio (`getChaveVencedorId` etc.) duplicada entre `electron/pdf.ts` e o lado renderer.
   
   **Sugestão**: extrair um módulo compartilhado (`shared/`) para persistência de torneio, constantes de faixa/labels, e um hook/componente único de placar parametrizado por tipo de luta (chave vs. casada).

5. **Geração de chaves hardcoded por tamanho**: confirmado em `electron/brackets.ts` — 14 geradores (`gerarLutasDois` ... `gerarLutas16`, `gerarLutasGeral`) e 9 funções de avanço de vencedor (`advanceWinner5` ... `advanceWinner16`) espalhados por ~1750 linhas, sem nenhum teste automatizado. Alto risco de regressão a cada ajuste. O caso genérico (`gerarLutasGeral`/`advanceWinnerInChave`, já usado para 7-8 atletas) poderia ser generalizado para substituir a maior parte disso, reduzindo a superfície de bugs.

6. **Persistência sem transação/lock**: cada escrita reescreve o JSON inteiro do torneio sem lock de arquivo; com a janela principal e a janela do telão potencialmente lendo/escrevendo ao mesmo tempo, há risco de corrupção em crash no meio da escrita. Vale considerar escrita atômica (escrever em arquivo temporário + rename) como mitigação de baixo custo.

7. **Ausência de testes automatizados**: nenhum arquivo de teste encontrado no repositório, especialmente arriscado dado a complexidade do algoritmo de chaves. Priorizar testes unitários para `brackets.ts` (geração e avanço de vencedor por tamanho) traria o maior retorno.

### Segurança / robustez
8. **Licenciamento é "segurança de fachada"**: confirmado em `electron/activation.ts` — hash da senha mestra (`MASTER_PASSWORD_HASH`) fica hardcoded no código-fonte (com override opcional por variável de ambiente), comparação é SHA-256 sem salt, e o fallback de `getMachineId()` gera um UUID aleatório quando não consegue ler hardware (WMIC/registro) — tornando o vínculo com a máquina pouco confiável fora do Windows ou sem essas permissões.
9. **Gestos via webcam dependem de internet** (MediaPipe carregado de CDN em runtime) em um app que, fora isso, funciona 100% offline — inconsistência arquitetural e ponto de falha em eventos sem rede estável.
10. **Normalização de texto para minúsculas na gravação** (nomes/equipes) exige recapitalização manual em toda superfície de exibição — qualquer tela nova que esqueça disso mostrará dados em minúsculo.

### Menores / limpeza
11. Parâmetros mortos em `pdfGenerator.ts` (`_getChaveVencedorId`, `_getChavePerdedorFinalId`, `_getPerdedoresSemifinal` — confirmado sem uso no corpo da função, resquício de refatoração que moveu essa lógica para `electron/pdf.ts`).
12. `Arbitro.chaveIds` é uma referência denormalizada que precisa ser sincronizada manualmente com `Chave.arbitroId` — fonte potencial de dessincronia; considerar derivar sempre a partir de `Chave.arbitroId` em vez de manter duas fontes de verdade.
13. `Chave.status` no tipo só define `'gerada'`, sem modelar estados como "em andamento"/"finalizada" no nível da chave (hoje o status fica implícito no conjunto de lutas).

---

## 5. Prioridade sugerida

| Prioridade | Item |
|---|---|
| Alta | #1 (categorias infantis), #3 (gesto de vantagem/punição não mede o que diz medir), #7 (testes em `brackets.ts`), #6 (escrita atômica) |
| Média | #4 (duplicação de componentes/constantes), #5 (generalizar geração de chaves), #2 (lado B dos gestos) |
| Baixa | #8, #9, #10, #11, #12, #13 |

---

## 6. Nota sobre verificação

Este documento foi revisado criticamente contra o código-fonte após a primeira versão: os achados nas seções 1-2 e os itens #1, #2, #4 (duplicação), #5 (contagem de funções), #8 e #11 foram reconferidos linha a linha e se confirmaram. O item #3 foi descoberto nessa segunda passada — a análise inicial aceitou a descrição de "braço na horizontal/erguido" sem checar se os índices de landmark usados eram compatíveis com o modelo (MediaPipe Hands só retorna pontos da mão, não do braço), e o código reaproveita índices de dedos com nomes de variável de membro superior (`shoulder`/`elbow`/`wrist`).
