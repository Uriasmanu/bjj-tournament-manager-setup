# Spec: Placar de Jiu-Jitsu (Scoreboard Funcional)

## 1. Contexto e Objetivo

- **O que é:** Tela funcional de placar para uma luta de Jiu-Jitsu, substituindo o placeholder atual em `src/pages/PlacarLuta.tsx`. Permite ao árbitro controlar a contagem de pontos (2, 3 e 4), vantagens, punições, tempo regressivo editável e registrar o resultado final com persistência no JSON do torneio.
- **Por que existe:** O `PlacarLuta` atual (`src/pages/PlacarLuta.tsx`) exibe apenas "Placar" + nomes dos atletas. Falta o controle real da luta, persistência dos dados parciais e finais e a integração com a regra IBJJF.
- **Quem usa:** Árbitros responsáveis por uma área de luta durante a condução dos combates.
- **Escopo:** Implementar a tela `PlacarLuta` funcional + IPC para persistir placar parcial e final. Pontuação, vantagens, punições, cronômetro decrescente editável, cores azul anil e branco, registro de finalização/desclassificação/empate com decisão do árbitro. **Fora de escopo:** sons (sem apito final), persistência em relatórios, pódios.

## 2. Documentos de Referência

- `doc/spec.md` — Guia de especificação
- `doc/requisitos.md` — Requisitos (seção 3.16 Placar/Resultados marcado como Pendente)
- `doc/IBJJF.md` — Regras oficiais IBJJF (sistema de pontuação por posição: 2, 3, 4)
- `spec/placar.md` — Spec do fluxo Placar (já implementado: PlacarMenu, PlacarChaves, PlacarBracket, PlacarLuta placeholder)
- `spec/bracket-formato-fixo.md` — Spec do formato do bracket
- `src/pages/PlacarLuta.tsx` — Placeholder atual a ser substituído
- `src/types/bracket.ts` — Interface `Luta` a ser estendida
- `electron/brackets.ts` — Handler `registrar-resultado` a ser estendido para placar detalhado
- `electron/preload.ts` — Bridge IPC a ser estendido
- `src/types/electron.d.ts` — Tipos do IPC
- `src/App.tsx` — Rota `/admin/placar/luta/:chaveId/:lutaId`

## 3. História de Usuário

Como árbitro de uma área de luta,
quero abrir a tela de placar de uma luta específica e registrar a pontuação, vantagens, punições e o tempo,
para que o resultado final da luta (pontos, finalização, desclassificação ou decisão) seja salvo no JSON do torneio e propagado para a próxima rodada da chave.

**Cenários alternativos:**
- Luta ainda sem ambos os atletas definidos (`tbd` ou `bye`): exibir estado bloqueado, sem controles.
- Tempo esgotado sem finalização/pontos: o sistema deve permitir registrar empate com decisão do árbitro, marcando o vencedor com flag `desempateArbitro`.
- Desclassificação por acúmulo de 4 punições: registrar vencedor por DQ.
- Finalização: registrar vencedor por submission (não usa pontos).

## 4. Requisitos Funcionais

### Pontuação
- [ ] RF-01: O sistema deve permitir adicionar/remover pontos de **2** (raspagem, joelho na barriga) para cada atleta.
- [ ] RF-02: O sistema deve permitir adicionar/remover pontos de **3** (passagem de guarda) para cada atleta.
- [ ] RF-03: O sistema deve permitir adicionar/remover pontos de **4** (montada, pegada de costas) para cada atleta.
- [ ] RF-04: O sistema deve exibir o **total acumulado** de pontos por atleta (soma de 2×qtd2 + 3×qtd3 + 4×qtd4).
- [ ] RF-05: Cada botão de ponto (`+2`, `+3`, `+4`) deve ter ação simétrica (`-`) que decrementa a quantidade desde que > 0.

### Vantagens e Punições
- [ ] RF-06: O sistema deve permitir adicionar/remover **vantagens** (0..N) por atleta (vantagem não tem valor numérico, é critério de desempate).
- [ ] RF-07: O sistema deve permitir adicionar/remover **punições** (0..4) por atleta.
- [ ] RF-08: Ao atingir 4 punições, o sistema deve exibir alerta visual de "desclassificação" e permitir registrar resultado por **DQ** (atleta adversário vence).
- [ ] RF-09: Quantidade de punições e vantagens deve ser editável manualmente (não auto-incrementada).

### Tempo
- [ ] RF-10: O sistema deve exibir cronômetro decrescente (mm:ss) com valor inicial **editável** (default 5min, ajustável 1–30 min).
- [ ] RF-11: O cronômetro deve ter botões **Iniciar/Pausar** e **Zerar** (volta ao valor inicial).
- [ ] RF-12: O cronômetro NÃO deve emitir som de apito final (silencioso ao chegar a 0). Apenas texto "Tempo esgotado" é exibido.
- [ ] RF-13: O tempo NÃO deve contar regressivamente enquanto a luta estiver no status `pending` (apenas após o árbitro "iniciar" a luta na tela).

### Visual e Identidade
- [ ] RF-14: O layout deve ter **Atleta A** no lado esquerdo com fundo **azul anil** (`#1e3a8a`, indigo-900 / Tailwind `indigo-900`).
- [ ] RF-15: O layout deve ter **Atleta B** no lado direito com fundo **branco** (`#ffffff`) e texto escuro.
- [ ] RF-16: O nome dos atletas deve ser exibido de acordo com a luta selecionada (vindo dos parâmetros da rota + carregamento de `loadAthletes`).
- [ ] RF-17: A luta da Rodada 1 deve permitir iniciar normalmente; lutas com `tbd`/`bye` devem exibir estado bloqueado "Aguardando definição anterior".

### Resultado Final e Persistência
- [ ] RF-18: O sistema deve permitir registrar o resultado final: **Vitória por Pontos** (vencedor com mais pontos), **Finalização** (submission), **Decisão do Árbitro** (empate → flag de desempate), **Desclassificação (DQ)**.
- [ ] RF-19: Ao confirmar o resultado, o sistema deve persistir no JSON do torneio dentro da `Luta` correspondente:
  - `vencedorId`
  - `status` (`'completed'` para normal, `'wo'` para DQ/WO)
  - `placar` (snapshot final: pontos 2/3/4, vantagens, punições, total)
  - `desempateArbitro: boolean` (true se decidido por árbitro)
  - `finalizacao: boolean` (true se venceu por submission)
  - `desclassificacao: boolean` (true se houve DQ)
- [ ] RF-20: O vencedor deve ser **propagado** para a próxima rodada da chave (mesmo comportamento do `advanceWinnerInChave` atual).
- [ ] RF-21: Ao salvar o resultado, o sistema deve navegar de volta para `PlacarBracket` (`/admin/placar/chave/:chaveId`) para visualização da chave atualizada.

## 5. Requisitos Não-Funcionais

- **Performance:** Botões respondem em <50ms. Cronômetro usa `setInterval` de 1000ms.
- **Persistência:** Imediata no JSON do torneio via IPC `registrar-resultado` estendido.
- **Stack:** React + Mantine + TypeScript + Electron IPC.
- **Acessibilidade:** Botões com `aria-label` descritivo, contraste suficiente (azul anil com texto branco atende WCAG AA).
- **Sem áudio:** Nenhum `Audio` API ou beep é emitido (RF-12). Cronômetro para em 0:00 e exibe texto estático.
- **Compatibilidade:** Mesma do app (Windows 10/11, Electron 30).

## 6. Análise da Aplicação

### Arquitetura

```
Frontend (React + Mantine)
  └─ src/pages/PlacarLuta.tsx       — Placar funcional (substituir placeholder)
  └─ src/types/bracket.ts           — Estender Luta com placar
  └─ src/types/electron.d.ts        — Estender registrarResultado

IPC Bridge
  └─ electron/preload.ts            — Atualizar assinatura registrarResultado

Backend (Electron main process)
  └─ electron/brackets.ts           — Handler registrar-resultado estendido
  └─ (lógica advanceWinnerInChave   — Já existente, reusar)
```

### Fluxo de dados

1. PlacarBracket → "Iniciar" → navega para `/admin/placar/luta/:chaveId/:lutaId`
2. PlacarLuta carrega: chave (via `loadChaves`), atletas (via `loadAthletes`), árbitros.
3. Estado local: `placar = { atletaA: { pontos2, pontos3, pontos4, vantagens, punicoes }, atletaB: {...} }` e `tempoRestante`, `tempoInicial`, `rodando`.
4. Botões +2/+3/+4/vantagem/punição → atualizam estado local (não persistem a cada clique).
5. "Iniciar Luta" → `setRodando(true)`, status da luta vira `in_progress` (atualiza chave).
6. Cronômetro roda com `setInterval(1000)`, decrementa `tempoRestante`.
7. Ao chegar 0:00 → `setRodando(false)`, exibe "Tempo esgotado" (sem som).
8. "Zerar" → `tempoRestante = tempoInicial`, `setRodando(false)`.
9. "Finalizar Luta" → modal pede tipo de resultado (Pontos/Finalização/DQ/Desempate), confirma → IPC `registrar-resultado` com placar completo.
10. Backend atualiza `luta.vencedorId`, `luta.status`, `luta.placar`, propaga vencedor e retorna a chave.
11. UI navega para `/admin/placar/chave/:chaveId`.

### Extensão da Interface Luta

```typescript
export interface PlacarLuta {
  pontos2: number;
  pontos3: number;
  pontos4: number;
  vantagens: number;
  punicoes: number;
  total: number; // 2*qtd2 + 3*qtd3 + 4*qtd4
}

export interface Luta {
  // ... campos existentes
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'wo';
  placarA?: PlacarLuta;
  placarB?: PlacarLuta;
  finalizacao?: boolean;
  desclassificacao?: boolean;
  desempateArbitro?: boolean;
  vencedorId?: string | null;
}
```

### Layout Visual

```
+--------------------------------------------------------------+
|                  ← Placar · Luta 3 · Rodada 1                |
+--------------------------------------------------------------+
| [⏱ 04:32] [▶ Iniciar] [⟲ Zerar]  Tempo inicial: [05:00] min |
+----------------------------+---------------------------------+
|  ATLETA A                  |  ATLETA B                       |
|  (azul anil #1e3a8a)       |  (branco #ffffff)               |
|                            |                                 |
|  João Silva (Gracie)       |  Maria Souza (Alliance)         |
|                            |                                 |
|  Pontos: 7                 |  Pontos: 4                      |
|  +2: 1  -2                 |  +2: 2  -2                      |
|  +3: 1  -3                 |  +3: 0  -3                      |
|  +4: 0  -4                 |  +4: 0  -4                      |
|  Vantagens: 2              |  Vantagens: 1                   |
|  Punições: 1               |  Punições: 3                    |
+----------------------------+---------------------------------+
|            [🏁 Finalizar Luta]  [↩ Desistir]                |
+--------------------------------------------------------------+
```

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `spec/placar-jiu-jitsu.md` | Criar | Este documento |
| `src/types/bracket.ts` | Modificar | Estender `Luta` com `placarA`, `placarB`, `finalizacao`, `desclassificacao`, `desempateArbitro` |
| `src/pages/PlacarLuta.tsx` | Modificar | Substituir placeholder por placar funcional com botões de pontuação, vantagens, punições, cronômetro, modal de resultado final |
| `src/types/electron.d.ts` | Modificar | Estender assinatura de `registrarResultado` para incluir `placarA`, `placarB`, `finalizacao`, `desclassificacao`, `desempateArbitro` |
| `electron/preload.ts` | Modificar | Pass-through dos novos campos no bridge IPC |
| `electron/brackets.ts` | Modificar | Handler `registrar-resultado`: persistir `placarA`, `placarB`, `finalizacao`, `desclassificacao`, `desempateArbitro` na luta; manter `advanceWinnerInChave`; normalizar campos novos para chaves legadas |

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- **Sincronia com `advanceWinnerInChave`:** o handler atual só recebe `vencedorId` + `status`. Estender payload com placar não impacta a lógica de propagação.
- **Status `in_progress`:** o tipo `Luta` já aceita `in_progress`, mas nenhum fluxo o atribui hoje. Esta feature atribui via "Iniciar Luta" (RF-13) — opcional, pode-se manter `pending` até a finalização.
- **Cronômetro regressivo:** requer `useEffect` com cleanup correto do `setInterval` para não vazar timer ao desmontar o componente.
- **Persistência parcial:** placar intermediário (durante a luta) **NÃO** é persistido — só o snapshot final ao registrar resultado. Decisão para evitar escritas constantes no JSON.
- **Normalização retroativa:** chaves existentes sem `placarA`/`placarB` devem ser aceitas sem erro. `normalizeLuta` deve adicionar `placarA = undefined` e `placarB = undefined` como default.

### 8.2 Ambiguidades nos Requisitos

- ~~"Sem som de apito final" — basta não usar Audio API; não há `<audio>` no projeto.~~ **Resolvido:** confirmado: nenhum arquivo do projeto usa Audio API.
- ~~"Pontos acumulados" — soma 2×qtd2 + 3×qtd3 + 4×qtd4 ou soma simples (qtd2+qtd3+qtd4)?~~ **Resolvido:** "acumulado" = soma ponderada (2×qtd2 + 3×qtd3 + 4×qtd4), conforme regra IBJJF.
- ~~"Desempate por decisão do árbitro" — quando ocorre?~~ **Resolvido:** quando o árbitro clica em "Finalizar Luta" e o placar está empatado (mesmos pontos, mesmas vantagens, mesmas punições). UI oferece opção "Decisão do Árbitro" que requer escolher vencedor.
- ~~"Tempo editável" — pode ser editado durante a luta?~~ **Resolvido:** pode ser editado a qualquer momento, mesmo durante a contagem regressiva (RF-10: "editável sem som de apito final" implica editável em qualquer estado).
- ~~"Cor azul anil" — qual hex específico?~~ **Resolvido:** `#1e3a8a` (Tailwind `indigo-900`) — anil escuro, suficiente contraste com texto branco.

### 8.3 Riscos

- **Mudança no payload de `registrar-resultado`** pode quebrar o `PlacarBracket` que também chama este IPC via troféu. Mitigação: tornar campos novos opcionais (`placarA?`, `placarB?`, `finalizacao?`, `desclassificacao?`).
- **Cronômetro pode perder precisão** se a janela for minimizada (throttle de `setInterval` em background). Aceitável para o MVP; o tempo exibido é indicativo, o "tempo real" é controlado pelo árbitro.

## 9. Critérios de Aceite

- [ ] CA-01: Dado a rota `/admin/placar/luta/:chaveId/:lutaId` com luta válida, o sistema deve exibir os dois atletas com cores azul anil (A) e branco (B).
- [ ] CA-02: Dado o placar aberto, o sistema deve exibir botões `+2`, `+3`, `+4` (e `-`) para cada atleta, com contadores visíveis.
- [ ] CA-03: Dado cliques em `+2`, `+3`, `+4`, o sistema deve atualizar o total acumulado (2×qtd2 + 3×qtd3 + 4×qtd4) em tempo real.
- [ ] CA-04: Dado cliques em vantagem/punição, o sistema deve incrementar/decrementar e exibir o valor atual.
- [ ] CA-05: Ao atingir 4 punições para qualquer atleta, o sistema deve exibir alerta visual "Desclassificação iminente" e habilitar botão "Finalizar por DQ".
- [ ] CA-06: O cronômetro deve iniciar com valor padrão 5:00 (editável 1–30 min), ter botões Iniciar/Pausar/Zerar e decrementar a cada segundo.
- [ ] CA-07: Ao chegar em 0:00, o cronômetro para e exibe "Tempo esgotado" sem emitir som.
- [ ] CA-08: O valor inicial do tempo pode ser editado via input numérico a qualquer momento.
- [ ] CA-09: Ao clicar "Finalizar Luta", o sistema abre modal pedindo: tipo (Pontos/Finalização/DQ/Desempate) + vencedor.
- [ ] CA-10: Ao confirmar, o sistema persiste `placarA`, `placarB`, `vencedorId`, `status`, `finalizacao`, `desclassificacao`, `desempateArbitro` na luta via IPC e navega de volta para o bracket.
- [ ] CA-11: O vencedor é propagado para a próxima rodada (slot `tbd` da rodada seguinte).
- [ ] CA-12: Lutas com `atletaAId === 'tbd'` ou `'bye'` (ou idem B) exibem estado bloqueado "Aguardando definição anterior" e não permitem iniciar.
- [ ] CA-13: Lutas com `status === 'completed'` ou `'wo'` exibem placar congelado e botão "Finalizar Luta" desabilitado.
- [ ] CA-14: Chaves existentes sem `placarA`/`placarB` carregam sem erro (normalização retroativa).

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Estender interface Luta com placar
  - O que fazer: Adicionar PlacarLuta interface; adicionar placarA, placarB, finalizacao, desclassificacao, desempateArbitro (todos opcionais) em Luta
  - Arquivo(s): src/types/bracket.ts
  - Como validar: TypeScript compila; normalizeLuta() preenche defaults

Passo 2: Estender assinatura do IPC registrarResultado
  - O que fazer: Adicionar campos opcionais placarA, placarB, finalizacao, desclassificacao, desempateArbitro
  - Arquivo(s): src/types/electron.d.ts, electron/preload.ts
  - Como validar: TypeScript compila; chamada antiga (sem placar) continua funcionando

Passo 3: Estender handler backend registrar-resultado
  - O que fazer: Persistir placarA, placarB, finalizacao, desclassificacao, desempateArbitro na luta
  - Arquivo(s): electron/brackets.ts
  - Como validar: Após IPC, o JSON do torneio contém os novos campos na luta atualizada

Passo 4: Normalizar chaves legadas
  - O que fazer: normalizeLuta adiciona placarA/placarB como undefined; normalizeChave ok
  - Arquivo(s): electron/brackets.ts
  - Como validar: Chaves antigas sem placar carregam sem erro

Passo 5: Implementar PlacarLuta funcional
  - O que fazer: Substituir placeholder por:
    - Layout azul anil (atleta A) e branco (atleta B)
    - Botões +2/+3/+4/-2/-3/-4 com contadores
    - Controles de vantagem e punição
    - Cronômetro decrescente editável (Iniciar/Pausar/Zerar)
    - Alerta de desclassificação em 4 punições
    - Modal "Finalizar Luta" com tipo + vencedor
    - Estado bloqueado para lutas com tbd/bye ou completed/wo
    - Integração com registrarResultado IPC
    - Navegação de volta para PlacarBracket após sucesso
  - Arquivo(s): src/pages/PlacarLuta.tsx
  - Como validar: Luta completa pode ser iniciada, pontos marcados, tempo corrido, resultado finalizado e propagado

Passo 6: Verificar lint e typecheck
  - O que fazer: Rodar npm run lint e tsc --noEmit
  - Arquivo(s): -
  - Como validar: Sem erros
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto. Feature isolada à tela `PlacarLuta` e extensões de tipo/IPC compatíveis com chamadas anteriores.
- **Como monitorar:** Teste manual: Dashboard → Placar → Área → Chave → Iniciar Luta → operar placar → finalizar → verificar chave atualizada e JSON do torneio com `placarA`/`placarB`.
- **Plano de rollback:** Reverter commit. Lutas já finalizadas mantêm `placarA`/`placarB` salvos; a UI reverteria para placeholder mas os dados ficam preservados.

## 12. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite verificados
- [ ] Código compila sem erros de TypeScript (`tsc --noEmit` limpo)
- [ ] `npm run lint` passa sem erros
- [ ] Placar funcional com pontos (2/3/4), vantagens, punições
- [ ] Cronômetro decrescente editável, sem áudio
- [ ] Cores azul anil (Atleta A) e branco (Atleta B)
- [ ] Modal de resultado final com 4 tipos (Pontos, Finalização, DQ, Desempate)
- [ ] Persistência no JSON do torneio com placar snapshot
- [ ] Vencedor propagado para próxima rodada
- [ ] Normalização retroativa para chaves legadas
- [ ] Estado bloqueado para lutas com tbd/bye ou completed/wo

## 13. Problema Original (de `doc/spec.md`)

> ## Feature v1
>  crie o placar de jiu jitsu
> pontos por posição 2,3 e 4, pontos acumulados, vantage, punição, tempo decrecente editavel sem som de apito final
> cor azul anil e branco, exibir nome dos atletas de acordo coma luta que foi selecionadaa para iniciar
> salvar no JSON do torneio o resultado final
> quem ganhou
> quem perdeu
> quais pontos fez
> pontos totais
> punições, vantagens
> se teve desclassificação
> se teve finalização ou venceu por ponto
> se identificar empate, quem for selecionado vencedor fica com uma flag de descizão do arbitro

Esta spec cobre integralmente o Feature v1 acima. Cada bullet foi convertido em requisito funcional (RF) ou critério de aceite (CA).

---

## Histórico de Alterações

| Data | Versão | Descrição |
|------|--------|-----------|
| 02/06/2026 | 1.0 | Criação inicial da spec do Placar de Jiu-Jitsu funcional (Feature v1) |
| 02/06/2026 | 1.1 | Correção `## Problema v1` (doc/spec.md): cronômetro centralizado na tela e pontos exibidos em fonte grande. Ver §14. |
| 02/06/2026 | 1.2 | Correção `## Problema v2` (doc/spec.md): pontos (+2/+3/+4) reorganizados em layout horizontal. Ver §15. |
| 02/06/2026 | 1.3 | Feedback visual: valores de Vantagens e Punições reduzidos (eram do mesmo tamanho dos pontos). Ver §16. |
| 02/06/2026 | 1.4 | Correções adicionais `## Problema v2` (doc/spec.md linhas 21-26): remover alertas de flag, voltar para tela da área, indicador de chave em progresso, chaves em formato de lista, botão "Iniciar Área de Luta", criação dinâmica de lutas. Ver §17. |

---

## 14. Correções aplicadas (## Problema v1)

Origem: `doc/spec.md` § "## Problema v1"

> "Não gostei do formato do placar, o tempo tem que ficar no centro da tela. Mude tambem como os pontos são exibidos, tem que ser grande."

### 14.1 Correção #1 — Cronômetro no centro da tela

**Problema:** Na v1.0 o cronômetro ficava em uma `<Paper>` no topo da página, à esquerda, junto com os botões Iniciar/Pausar/Zerar e o input de tempo inicial. O usuário pediu que **o tempo fique no centro da tela**.

**Solução (v1.1):**
- Reorganizar a UI em 3 zonas verticais:
  1. **Topo:** apenas o input de "Tempo inicial (min)" e botões Iniciar/Pausar/Zerar (controles auxiliares).
  2. **Centro da tela:** cronômetro gigante, com fonte `clamp(96px, 18vw, 220px)`, centralizado horizontal e verticalmente, com badge "TEMPO ESGOTADO" abaixo quando zerado. Botão de play/pause sobreposto ao cronômetro (clicável em qualquer parte do cronômetro para iniciar/pausar).
  3. **Abaixo do cronômetro:** colunas Atleta A (azul anil) × Atleta B (branco) com placar.

**Arquivos alterados:** `src/pages/PlacarLuta.tsx`

### 14.2 Correção #2 — Pontos exibidos em fonte grande

**Problema:** Na v1.0 o "Total" de pontos estava em `Text size="48px"` (que **não é um valor válido** para a prop `size` do Mantine `Text` — a prop aceita apenas `'xs' | 'sm' | 'md' | 'lg' | 'xl'`; o "48px" era ignorado silenciosamente e o número renderizava pequeno). Os contadores `+2/+3/+4` também estavam com `size="xl"`, pequeno demais para visualização à distância pelo árbitro.

**Solução (v1.1):**
- Total de pontos: `<Text style={{ fontSize: 'clamp(80px, 10vw, 140px)' }}>` (não usar `size` da prop, aplicar via `style.fontSize`).
- Contadores `+2 / +3 / +4`: `fontSize: 'clamp(36px, 4vw, 56px)'`.
- Nomes dos atletas: `clamp(28px, 2.5vw, 40px)` (mais destacados).
- Uso de `fontWeight: 900` para todos os números de pontuação.
- Aplicar `lineHeight: 1` para evitar espaçamento vertical extra.

**Arquivos alterados:** `src/pages/PlacarLuta.tsx`

### 14.3 Critérios de aceite adicionais (v1.1)

- [ ] CA-15: O cronômetro (mm:ss) deve estar **centralizado horizontal e verticalmente** na tela, com fonte grande (`clamp(96px, 18vw, 220px)`).
- [ ] CA-16: O número total de pontos de cada atleta deve estar em fonte `clamp(80px, 10vw, 140px)`, com `font-weight: 900`.
- [ ] CA-17: Os contadores `+2 / +3 / +4` devem estar em fonte `clamp(36px, 4vw, 56px)`.
- [ ] CA-18: O nome do atleta deve estar em fonte `clamp(28px, 2.5vw, 40px)`, em destaque.
- [ ] CA-19: O input de "Tempo inicial" e os botões Iniciar/Pausar/Zerar ficam no topo da tela (acima do cronômetro), em tamanho discreto, para não competir visualmente com o cronômetro central.

---

## 15. Correções aplicadas (## Problema v2)

Origem: `doc/spec.md` § "## Problema v2"

> "Não gostei do formato do placar, o tempo tem que ficar no centro da tela. Mude tambem como os pontos são exibidos, tem que ser grande. **Os pontos devem ser na horizontal**."

A primeira e segunda frases foram resolvidas na v1.1 (ver §14). A terceira é nova.

### 15.1 Correção #3 — Pontos em layout horizontal

**Problema:** Na v1.1 os controles de pontuação `+2 / +3 / +4` estavam empilhados **verticalmente** (um embaixo do outro), cada um com sua label à direita e botões `−` e `+` à esquerda. Isso ocupava muito espaço vertical dentro do painel do atleta e dificultava a leitura rápida durante a luta.

**Solução (v1.2):**
- Os 3 controles `+2 / +3 / +4` ficam lado a lado em uma **única linha horizontal** dentro de cada painel de atleta.
- Cada bloco horizontal contém: `−` (botão) + número grande + `+` (botão) + label pequena (e.g. "+2 pts") abaixo ou ao lado.
- A linha inteira de pontos ocupa uma única faixa do painel, liberando espaço vertical para os demais controles (vantagens, punições, total).
- O `Total` continua em destaque no topo do painel (não muda).

**Layout proposto (Atleta A, à esquerda):**
```
+----------------------------------+
| ATLETA A                         |
| João Silva                       |
| Gracie Barra                     |
|                                  |
|         Total: 7                 |
|                                  |
| ┌──────┬──────┬──────┐          |
| │  +2  │  +3  │  +4  │ ← linha  |
| │ [−1+]│ [−1+]│ [−0+]│   única  |
| └──────┴──────┴──────┘          |
|                                  |
| Vantagens: [− 2 +]               |
| Punições:  [− 1 +]               |
+----------------------------------+
```

**Arquivos alterados:** `src/pages/PlacarLuta.tsx`

### 15.2 Critérios de aceite adicionais (v1.2)

- [ ] CA-20: Os controles de pontuação `+2 / +3 / +4` devem estar dispostos **em uma única linha horizontal** dentro do painel de cada atleta, lado a lado.
- [ ] CA-21: Cada bloco de pontuação mantém a estrutura `− [N] +` (botão decremento, número, botão incremento) e exibe a label `+2 pts`, `+3 pts`, `+4 pts` abaixo ou ao lado do número.
- [ ] CA-22: A linha de pontos ocupa uma única faixa do painel do atleta (não empilhada verticalmente), liberando espaço vertical para Vantagens e Punições.

---

## 16. Correção de feedback visual (v1.3)

Origem: feedback do usuário durante revisão visual

> "Punição e vantagem estão muito grandes o valor do ponto"

### 16.1 Correção #4 — Reduzir tamanho de Vantagens e Punições

**Problema:** Na v1.2 os contadores de Vantagens e Punições usavam a mesma `FONT_COUNTER` (`clamp(36px, 4vw, 56px)`) que os pontos +2/+3/+4. Isso fazia com que Vantagens e Punições tivessem o mesmo destaque visual que pontos reais, o que é incorreto — pontos são o critério principal, Vantagens e Punições são secundários.

**Solução (v1.3):**
- Criada constante `FONT_VANT_PUN = 'clamp(22px, 2.2vw, 32px)'` (significativamente menor que `FONT_COUNTER`).
- Vantagens e Punições passam a usar `FONT_VANT_PUN` no número do contador.
- Botões `−` e `+` de Vantagens/Punições reduzidos: `32×32px` (eram `44×44px`), com `font-size: 16` (era 20).
- Labels de seção ("Vantagens", "Punições") reduzidas de `size="lg"` para `size="md"`.
- Corrigido typo `size="ms"` no botão "Adicionar vantagem" (não era valor válido do Mantine) → `size="md"`.

**Arquivos alterados:** `src/pages/PlacarLuta.tsx`

### 16.2 Critérios de aceite adicionais (v1.3)

- [ ] CA-23: O número do contador de Vantagens deve estar em fonte menor que o número de pontos (`FONT_VANT_PUN` ≤ `FONT_COUNTER`).
- [ ] CA-24: O número do contador de Punições deve estar em fonte menor que o número de pontos (`FONT_VANT_PUN` ≤ `FONT_COUNTER`).
- [ ] CA-25: Os botões `−` e `+` de Vantagens e Punições devem ser menores que os botões de pontos.
- [ ] CA-26: Hierarquia visual no painel: Total (maior) > Pontos +2/+3/+4 (FONT_COUNTER) > Vantagens/Punições (FONT_VANT_PUN).

---

## 17. Correções adicionais (v1.4) — 6 itens de `## Problema v2`

Origem: `doc/spec.md` § "## Problema v2" (linhas 21–26)

### 17.1 Correção #5 — Remover alertas de flag no modal de finalização

> "Não precisa desse aviso: O vencedor será marcado com a flag finalizacao no JSON."

**Problema:** No modal de finalização existiam 3 `<Alert>` informando que o vencedor seria marcado com a flag correspondente (`finalizacao`, `desempateArbitro`, `desclassificacao`). Esses alertas são ruído visual: o usuário já sabe o tipo que escolheu, e a flag é um detalhe de implementação.

**Solução:** Remover os 3 `<Alert>` do modal. Manter apenas o resumo "Placar: A X × B" e os radio groups.

**Arquivo:** `src/pages/PlacarLuta.tsx` (linhas com `<Alert color="orange|red|grape" ...>`).

**CA-27:** O modal "Finalizar Luta" não deve exibir nenhum alerta descrevendo qual flag será gravada no JSON.

### 17.2 Correção #6 — Navegação pós-confirmação vai para a tela da Área

> "Quando confirma o vencedor, tem que voltar para a tela da area"

**Problema:** Após confirmar o resultado da luta, o sistema navega para `/admin/placar/chave/:chaveId` (tela do bracket). O usuário quer voltar para a lista de chaves da **área** (`/admin/placar/chaves/:areaId`).

**Solução:**
- `PlacarLuta` precisa conhecer o `areaId` (vem da rota ou é resolvido a partir da chave).
- O componente `PlacarBracket` precisa passar o `areaId` ao navegar para `PlacarLuta` (já passa via URL, mas o `PlacarLuta` não está lendo o `areaId` da rota atual).
- Adicionar `areaId` na URL `/admin/placar/luta/:chaveId/:lutaId` ou resolver via `loadAreas`/`loadChavesPorArea`.

**Arquivos:**
- `src/App.tsx` (ajustar rota para incluir `areaId`)
- `src/pages/PlacarLuta.tsx` (ler `areaId` da URL e usar na navegação)
- `src/pages/PlacarBracket.tsx` (atualizar link de "Iniciar")

**CA-28:** Após confirmar o resultado, o sistema navega para `/admin/placar/chaves/:areaId` (lista de chaves da área).
**CA-29:** A rota `/admin/placar/luta/:chaveId/:lutaId` deve incluir `:areaId` (ou resolver via lookup) para suportar o retorno.

### 17.3 Correção #7 — Indicador de chave "em progresso"

> "As chaves tem que ter um indicador que mostra se esta em progresso"

**Problema:** Não há forma visual de saber se uma chave já teve lutas iniciadas, está em andamento ou finalizada.

**Solução:**
- Definir regra de status da `Chave`:
  - `pendente` (nenhuma luta iniciada): status atual `'gerada'`
  - `em progresso` (pelo menos 1 luta `in_progress`/`completed`/`wo` mas ainda há lutas não finalizadas)
  - `finalizada` (todas as lutas com `status === 'completed' || status === 'wo'`)
- Exibir um `<Badge>` ao lado do badge "Gerada" atual:
  - Verde "Em progresso" se há lutas iniciadas mas não todas finalizadas
  - Cinza "Pendente" se nenhuma luta foi iniciada
  - Verde escuro "Finalizada" se todas as lutas terminaram

**Arquivos:** `src/pages/PlacarChaves.tsx` (adicionar badges), `src/types/bracket.ts` (campo computado)

**CA-30:** A lista de chaves da área deve exibir um badge de status: "Pendente" (cinza), "Em progresso" (amarelo/laranja) ou "Finalizada" (verde).
**CA-31:** O status é derivado do estado das lutas: nenhuma iniciada → pendente; alguma iniciada e alguma não finalizada → em progresso; todas finalizadas → finalizada.

### 17.4 Correção #8 — Chaves em formato de lista (não cards)

> "As chaves na area não devem ser cards, deve ser em formato de lista"

**Problema:** `PlacarChaves` renderiza chaves em `<SimpleGrid>` com `<Card>` (layout 1-3 colunas). Usuário quer formato de lista (tabela/lista vertical).

**Solução:**
- Substituir `<SimpleGrid>` + `<Card>` por `<Table>` ou lista vertical de linhas.
- Cada linha contém: Título, Status (badge), Árbitro, Qtd Lutas, Qtd Atletas, Ação (botão "Abrir").
- Manter busca textual e empty states.

**Arquivo:** `src/pages/PlacarChaves.tsx`

**CA-32:** As chaves da área devem ser exibidas em formato de lista/tabela (uma chave por linha), não em grid de cards.

### 17.5 Correção #9 — Botão "Iniciar Área de Luta" + status da área

> "Crie um botão chamado iniciar area de luta, ele tem que ficar bem visivel, para que a area tenha o status de em progresso"

**Problema:** Não existe um botão explícito para iniciar uma área de luta. Quando o usuário entra no Placar, a área é "aberta" implicitamente ao clicar em uma chave.

**Solução:**
- Adicionar campo `status: 'pendente' | 'em_progresso' | 'finalizada'` em `AreaLuta` (default: `'pendente'`).
- Adicionar IPC `set-area-status(areaId, status)` no backend.
- Em `PlacarMenu`, ao selecionar a área, exibir botão grande e bem visível "Iniciar Área de Luta" (cor verde, ícone play, posição destacada).
- Em `PlacarChaves`, exibir o status atual da área no cabeçalho e o botão "Iniciar Área" se status = `pendente`.
- Ao clicar, o status muda para `em_progresso` e a UI mostra badge "Em progresso".

**Arquivos:**
- `src/types/area.ts` (campo `status`)
- `src/types/electron.d.ts`, `electron/preload.ts` (novo IPC)
- `electron/areas.ts` (handler + normalização retroativa)
- `src/pages/PlacarMenu.tsx` (botão "Iniciar Área")
- `src/pages/PlacarChaves.tsx` (header com status + botão)

**CA-33:** A interface `AreaLuta` deve ter campo `status: 'pendente' | 'em_progresso' | 'finalizada'` com default `'pendente'`.
**CA-34:** A tela de seleção de área deve exibir um botão "Iniciar Área de Luta" proeminente após selecionar a área.
**CA-35:** O botão "Iniciar Área" fica desabilitado quando o status já é `em_progresso` ou `finalizada`.
**CA-36:** A lista de chaves da área deve exibir o status da área (badge "Pendente" / "Em progresso" / "Finalizada") no cabeçalho.
**CA-37:** Áreas existentes sem o campo `status` devem ser normalizadas para `pendente` ao carregar (retrocompatibilidade).

### 17.6 Correção #10 — Criação dinâmica de lutas quando área em progresso

> "quando a area tem o status de em progresso, as chaves criam automaticamente as lutas a seguir ex: chave de 3 vai ter atleta x atleta e atleta x bye, quando a area estive em progresso a chve vai receber os cards sreferentes a semi final e final"

**Problema:** Hoje, ao gerar uma chave, **todas** as lutas de todas as rodadas são criadas de uma vez (com `'tbd'` para slots a definir). O usuário quer que, ao iniciar a área, as lutas das **rodadas seguintes** (semi, final) sejam **criadas/reveladas** naquele momento. Antes do início da área, a chave só tem a 1ª rodada visível.

**Solução proposta:**

1. Mudar a geração de chaves (`gerarChave` em `electron/brackets.ts`): gerar **apenas a 1ª rodada** inicialmente. As lutas das rodadas seguintes ficam com `totalLutas` e `totalRodadas` corretos no objeto, mas o array `lutas` contém só as lutas da R1.
2. Ao mudar o status da área para `em_progresso` (IPC `set-area-status`), iterar sobre todas as chaves da área e **adicionar as lutas das rodadas seguintes** automaticamente, mantendo `posicoesAtletas` intacto. Para chaves ímpares, a primeira luta da R2 inclui `bye` (ex: chave de 3 com `atletaC vs bye` na R2 caso R1 não tenha propagado vencedor).
3. A propagação de vencedor (`advanceWinnerInChave`) continua igual — funciona normalmente para as lutas criadas dinamicamente.

**Exemplo (chave de 3 atletas):**
- Antes de iniciar área:
  ```
  R1: [atletaA vs atletaB]
  ```
- Após clicar "Iniciar Área":
  ```
  R1: [atletaA vs atletaB]
  R2: [atletaC vs (vencedor R1 OU bye)]
  ```

**Arquivos:**
- `electron/brackets.ts` (`gerarChave` cria só R1; novo handler `expandirChavesAoIniciarArea(areaId)`)
- `electron/areas.ts` (`set-area-status` chama expansão automaticamente)
- `src/types/electron.d.ts`, `electron/preload.ts` (novo IPC)

**CA-38:** Ao gerar uma chave, o array `lutas` deve conter apenas as lutas da 1ª rodada; `totalRodadas` permanece igual mas `totalLutas` reflete só R1 inicialmente.
**CA-39:** Ao mudar o status de uma área para `em_progresso`, o sistema deve adicionar automaticamente as lutas das rodadas seguintes em todas as chaves da área.
**CA-40:** Para chaves com número ímpar de atletas, a primeira luta da R2 deve ter `bye` no slot à espera (ex: 3 atletas → R2 = `atletaC vs bye` ou `atletaC vs (vencedor R1)`).
**CA-41:** Lutas adicionadas dinamicamente recebem `status: 'pending'` e `atletaAId/atletaBId` = `tbd` ou `bye` conforme o caso.

### 17.7 Resumo da ordem de implementação sugerida

1. **#5 (alertas)** — `PlacarLuta.tsx` (3 linhas removidas)
2. **#6 (navegação)** — `App.tsx` (rota), `PlacarLuta.tsx` (ler areaId), `PlacarBracket.tsx`
3. **#7 (status indicator)** — `PlacarChaves.tsx` (badges)
4. **#8 (lista)** — `PlacarChaves.tsx` (refator de Card → Table)
5. **#9 (botão Iniciar Área)** — `area.ts` (tipo), `areas.ts` (IPC), `PlacarMenu.tsx`, `PlacarChaves.tsx`
6. **#10 (lutas dinâmicas)** — `brackets.ts` (geração parcial), `areas.ts` (handler de expansão)

### 17.8 Critérios de aceite consolidados (v1.4)

- [ ] CA-27: Modal "Finalizar Luta" sem alertas de flag
- [ ] CA-28: Navegação pós-confirmação → `/admin/placar/chaves/:areaId`
- [ ] CA-29: Rota inclui `areaId` ou resolve via lookup
- [ ] CA-30: Badge de status da chave (Pendente/Em progresso/Finalizada)
- [ ] CA-31: Status derivado das lutas
- [ ] CA-32: Chaves em formato de lista (não cards)
- [ ] CA-33: `AreaLuta.status` com default `'pendente'`
- [ ] CA-34: Botão "Iniciar Área de Luta" proeminente
- [ ] CA-35: Botão desabilitado quando status ≠ pendente
- [ ] CA-36: Badge de status da área no header de chaves
- [ ] CA-37: Normalização retroativa de áreas sem `status`
- [ ] CA-38: Geração inicial de chave só com R1
- [ ] CA-39: Expansão automática ao iniciar área
- [ ] CA-40: Lutas com `bye` em chaves ímpares
- [ ] CA-41: Lutas adicionadas com `status: 'pending'`

