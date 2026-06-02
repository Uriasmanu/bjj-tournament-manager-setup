# Spec: Placar / Scoreboard

## 1. Contexto e Objetivo

- **O que é:** Fluxo completo de início de lutas: seleção de área de luta → visualização das chaves da área → visualização do bracket com lutas iniciáveis → tela de placar (placeholder).
- **Por que existe:** O administrador do torneio precisa navegar por área de luta, visualizar as chaves alocadas em cada área e iniciar as lutas uma a uma, direcionando para a tela de placar onde o árbitro registrará o resultado.
- **Quem usa:** Administradores do torneio e árbitros responsáveis por cada área de luta.
- **Escopo:** Nesta entrega, o fluxo termina em uma tela de placar com texto "Placar" no centro. O placar funcional (cronômetro, pontuação, registro de resultado) fica para uma entrega futura. Also: lutas `atleta vs bye` não podem ser iniciadas.

## 2. Documentos de Referência

- `doc/spec.md` — Guia de especificação
- `doc/requisitos.md` — Regras de negócio do sistema
- `spec/areas-de-luta.md` — Spec de áreas de luta (já implementado)
- `src/pages/GerenciarChaves.tsx` — Padrão de listagem de chaves com visualização
- `src/components/BracketTree.tsx` — Componente de árvore de bracket
- `src/components/BracketCard.tsx` — Card de luta individual
- `src/components/RegistrarResultadoModal.tsx` — Modal de registro de resultado (existente, reutilizável no futuro)
- `src/types/bracket.ts` — Interfaces `Chave` e `Luta` (precisa ser estendida)
- `src/pages/Dashboard.tsx` — Dashboard com cards (adicionar card "Placar")
- `electron/brackets.ts` — Handlers IPC de chaves
- `electron/preload.ts` — Ponte IPC
- `electron/main.ts` — Registro de handlers IPC
- `src/App.tsx` — Rotas
- `src/types/electron.d.ts` — Tipos globais do IPC

## 3. História de Usuário

Como administrador do torneio,
quero selecionar uma área de luta, visualizar suas chaves e iniciar lutas uma a uma,
para que os árbitros possam começar as competições físicas e registrar os resultados.

## 4. Requisitos Funcionais

- [x] RF-01: O sistema deve exibir um card "Placar" no Dashboard (implemented)
- [x] RF-02: Ao acessar o Placar, o sistema deve solicitar a seleção de uma área de luta
- [x] RF-03: O sistema deve exibir a lista de chaves associadas à área de luta selecionada, com o nome do árbitro responsável
- [x] RF-04: O sistema deve filtrar chaves pelos árbitros atribuídos à área (via `area.arbitroIds` ∩ `chave.arbitroId`)
- [x] RF-05: Ao clicar em uma chave, o sistema deve exibir o layout da chave (árvore de bracket) com todas as rodadas (incluindo futuras com "A definir")
- [x] RF-06: O sistema não deve permitir iniciar lutas onde um dos lados é "bye" ou "tbd"
- [x] RF-07: O botão "Iniciar" deve ficar em uma lista de lutas abaixo do bracket, não nos cards
- [x] RF-08: Ao clicar "Iniciar" em uma luta válida, o sistema deve navegar para a tela de placar
- [x] RF-09: A tela de placar deve exibir o texto "Placar" centralizado (placeholder para implementação futura)
- [x] RF-10: O sistema deve exibir na tela de placar o nome dos atletas e o número da luta
- [x] RF-11: Lutas com status `completed` ou `in_progress` não devem exibir botão "Iniciar"
- [x] RF-12: A lista de chaves deve ter campo de busca textual que filtra por título da chave
- [x] RF-13: O sistema deve gerar todas as lutas do bracket (incluindo rodadas futuras), usando `"tbd"` para participantes ainda não definidos
- [x] RF-14: Cards do bracket devem ter tamanho uniforme (200x120px)
- [x] RF-15: O bracket deve exibir linhas de conexão entre os rounds (estilo chave de torneio)
- [x] RF-16: Dados legados (chaves sem `rodada`/`status`) devem ser normalizados automaticamente ao carregar

## 5. Requisitos Não-Funcionais

- **Persistência:** Dados lidos do JSON do torneio ativo. Status das lutas persistido no campo `lutas` da chave.
- **Stack:** React + Mantine + TypeScript + Electron IPC (mesma stack existente)
- **Performance:** Filtro client-side (volume esperado é pequeno, < 100 chaves)
- **Extensibilidade:** A tela de placar deve ser projetada para fácil substituição futura por um placar funcional.

## 6. Análise da Aplicação

### Arquitetura

```
Frontend (React + Mantine)
  └─ src/pages/PlacarMenu.tsx       — Seleção de área de luta
  └─ src/pages/PlacarChaves.tsx     — Lista de chaves da área com busca textual
  └─ src/pages/PlacarBracket.tsx    — Visualização do bracket + lista de lutas iniciáveis
  └─ src/pages/PlacarLuta.tsx       — Tela de placar (placeholder)
  └─ src/components/BracketTree.tsx — Árvore de bracket com conectores visuais entre rounds
  └─ src/components/BracketCard.tsx — Card de luta (200×120px, sem botão "Iniciar")

IPC Bridge
  └─ electron/preload.ts            — loadChavesPorArea, loadCategorias, loadAtletas
  └─ electron/main.ts               — Registrar handler loadChavesPorArea

Backend (Electron main process)
  └─ electron/brackets.ts           — loadChavesPorArea, normalizeChave, geração de lutas com TBD
```

### Fluxo de dados

1. Dashboard → card "Placar" → `/admin/placar`
2. PlacarMenu carrega áreas via `loadAreas()` → exibe Select + botão "Acessar"
3. Usuário seleciona área → `loadChavesPorArea(areaId)` → retorna chaves cujo `arbitroId` está em `area.arbitroIds`
4. PlacarChaves exibe cards das chaves com nome do árbitro; usuário pode digitar na busca textual para filtrar pelo título
5. Usuário clica em chave → navega para `/admin/placar/chave/:areaId/:chaveId`
6. PlacarBracket carrega chave completa → BracketTree exibe todas as rodadas do bracket com linhas de conexão
7. Abaixo do bracket, tabela "Lutas para Iniciar" lista lutas da 1ª rodada sem bye/tbd com status `pending`
8. Usuário clica "Iniciar" na tabela → navega para `/admin/placar/luta/:chaveId/:lutaId`
9. PlacarLuta exibe "Placar" + nomes dos atletas + número da luta

### Extensão da Interface Luta

```typescript
export interface Luta {
  id: string;
  ordem: number;
  rodada: number;
  atletaAId: string;       // pode ser 'tbd' ou 'bye' para lutas futuras ou WO
  atletaBId: string;       // pode ser 'tbd' ou 'bye' para lutas futuras ou WO
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'wo';
  vencedorId?: string | null;
}
```

### Extensão da Interface Chave

```typescript
export interface Chave {
  // ... campos existentes
  totalRodadas: number;    // calculado a partir do total de atletas
}
```

### Estrutura do JSON

```json
{
  "chaves": [
    {
      "id": "uuid",
      "categoriaId": "adulto-masculino-leve",
      "arbitroId": "uuid-do-arbitro",
      "lutas": [
        {
          "id": "uuid",
          "ordem": 1,
          "rodada": 1,
          "atletaAId": "uuid-atleta",
          "atletaBId": "uuid-atleta",
          "status": "pending",
          "vencedorId": null
        },
        {
          "id": "uuid",
          "ordem": 2,
          "rodada": 2,
          "atletaAId": "tbd",
          "atletaBId": "tbd",
          "status": "pending",
          "vencedorId": null
        }
      ],
      "posicoesAtletas": ["uuid1", "uuid2"],
      "totalAtletas": 2,
      "totalLutas": 1,
      "totalRodadas": 1,
      "status": "gerada"
    }
  ]
}
```

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---------|------|-------|
| `src/types/bracket.ts` | Modificar | Adicionar campos `status`, `vencedorId`, `rodada`, `totalRodadas` em `Luta`/`Chave` |
| `src/pages/PlacarMenu.tsx` | Criar | Tela de seleção de área de luta com Select + botão "Acessar" |
| `src/pages/PlacarChaves.tsx` | Criar | Tela de listagem de chaves da área selecionada + campo de busca textual que filtra por título |
| `src/pages/PlacarBracket.tsx` | Criar | Tela que carrega chave, exibe BracketTree (todas rodadas com conectores) + tabela "Lutas para Iniciar" com botão "Iniciar" apenas para lutas válidas |
| `src/pages/PlacarLuta.tsx` | Criar | Tela de placar (placeholder) com "Placar" centralizado + nomes dos atletas + número da luta |
| `src/pages/Dashboard.tsx` | Modificar | Adicionar card "Placar" como implemented |
| `src/App.tsx` | Modificar | Adicionar rotas `/admin/placar`, `/admin/placar/chaves/:areaId`, `/admin/placar/chave/:areaId/:chaveId`, `/admin/placar/luta/:chaveId/:lutaId` |
| `electron/preload.ts` | Modificar | Adicionar método `loadChavesPorArea` |
| `electron/brackets.ts` | Modificar | Adicionar handler `loadChavesPorArea` que filtra por `arbitroId` da área; adicionar `normalizeChave`/`normalizeLuta` para migração retroativa; gerar lutas futuras com `'tbd'`; calcular `totalRodadas` |
| `src/types/electron.d.ts` | Modificar | Adicionar assinatura `loadChavesPorArea` no tipo ElectronAPI |
| `src/components/BracketTree.tsx` | Modificar | Renderizar todas as rodadas com conectores visuais (`ConnectorRight`/`ConnectorTop`/`ConnectorBottom` via divs absolutas); `groupByRound` defensivo contra `rodada` undefined; `getRoundLabel` no lugar de `roundLabels` fixo; sem `onIniciarClick` |
| `src/components/BracketCard.tsx` | Modificar | Tamanho fixo 200×120px; exibir "A definir" para atleta `'tbd'` ou `'bye'`; sem botão "Iniciar" |

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos (Resolvidos)

- ~~A interface `Luta` atual em `src/types/bracket.ts` não possui campos `status`, `vencedorId` ou `rodada`~~ → **Resolvido:** Interface estendida com `rodada`, `status`, `vencedorId` (opcional).
- ~~`BracketTree.tsx` usa `chave.totalRodadas` que não existe na interface `Chave`~~ → **Resolvido:** Campo `totalRodadas` adicionado à interface `Chave` e calculado em `getTotalRodadas()`.
- ~~Chaves não possuem `areaId`~~ → **Resolvido:** Associação é feita por `arbitroId` (chave.arbitroId ∩ area.arbitroIds), sem necessidade de `areaId` na chave.
- ~~Dados legados sem `rodada`/`status`/`totalRodadas` causam `TypeError: Cannot read properties of undefined`~~ → **Resolvido:** `normalizeChave()`/`normalizeLuta()` preenchem defaults nos handlers IPC.
- ~~`groupByRound` quebra com `rodada` undefined~~ → **Resolvido:** Filtro defensivo com fallback para round 0.
- ~~Botão "Iniciar" dentro do BracketCard quebrava layout uniforme~~ → **Resolvido:** Botão removido dos cards; movido para tabela separada abaixo do bracket.
- ~~Largura/altura variável dos cards distorcia o bracket~~ → **Resolvido:** Cards com tamanho fixo 200×120px.
- ~~Conector SVG (`BracketConnector`) não renderizava corretamente por não saber a altura real dos cards~~ → **Resolvido:** Conectores implementados como divs absolutas (`ConnectorRight`/`ConnectorTop`/`ConnectorBottom`), mesma técnica do exemplo HTML de referência.

### 8.2 Ambiguidades nos Requisitos (Resolvidas)

- ~~O que acontece quando uma luta é "iniciada"?~~ → **Resolvido:** Esta entrega apenas navega para a tela de placar (placeholder). Persistência do status fica para entrega futura.
- ~~Como voltar da tela de placar para a lista de chaves?~~ → **Resolvido:** PageLayout com `voltarPara` fornece botão "Voltar".
- ~~Chaves sem árbitro ou sem área devem aparecer?~~ → **Resolvido:** Chaves cujo `arbitroId` não está em nenhuma `area.arbitroIds` não aparecem na seleção. Chaves sem `arbitroId` também não aparecem.

### 8.3 Riscos (Resolvidos)

- ~~A interface `Luta` é referenciada em múltiplos lugares. Alterar a interface pode causar erros de compilação nos arquivos existentes.~~ → **Resolvido:** Alterações foram compatíveis com usos existentes (adição de campos, não remoção). Nenhum arquivo existente quebrou.

## 9. Critérios de Aceite

- [x] CA-01: Dado o Dashboard, quando visualizo, deve existir um card "Placar" clicável com opacidade 1
- [x] CA-02: Dado o card "Placar", quando clico, devo ser redirecionado para `/admin/placar`
- [x] CA-03: Dado a tela de placar sem áreas cadastradas, deve exibir mensagem "Nenhuma área de luta cadastrada"
- [x] CA-04: Dado a tela de placar com áreas, quando seleciono uma área, devo ver a lista de chaves (filtradas pelos árbitros da área) com o nome do árbitro
- [x] CA-05: Dado a lista de chaves, quando clico em uma chave, devo ver o layout do bracket **com todas as rodadas** (não apenas a 1ª)
- [x] CA-06: Dado o layout do bracket, cards com atleta `'tbd'` ou `'bye'` devem exibir "A definir"
- [x] CA-07: Dado o layout do bracket, cards devem ter tamanho uniforme (200px × 120px)
- [x] CA-08: Dado o layout do bracket, linhas de conexão entre rounds devem estar visíveis (ConnectorRight/ConnectorTop/ConnectorBottom)
- [x] CA-09: Dado o layout do bracket com lutas abaixo, lutas com `'bye'` ou `'tbd'` não devem aparecer na tabela "Lutas para Iniciar"
- [x] CA-10: Dado a tabela "Lutas para Iniciar", apenas lutas da 1ª rodada com status `pending` e ambos os atletas definidos devem aparecer
- [x] CA-11: Dado uma luta válida na tabela, quando clico "Iniciar", devo ser redirecionado para `/admin/placar/luta/:chaveId/:lutaId`
- [x] CA-12: Dado a tela de placar, deve exibir "Placar" centralizado com o nome dos atletas e número da luta
- [x] CA-13: Dado uma luta com status `completed` ou `in_progress`, não deve ser possível iniciá-la novamente (não aparece na tabela)
- [x] CA-14: Dado a lista de chaves, quando digito um termo na busca, a lista filtra apenas chaves cujo título contenha o termo
- [x] CA-15: Dado chaves existentes sem os campos novos (`rodada`, `status`, `totalRodadas`), o sistema deve exibi-las sem erro (normalização retroativa)

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Estender interfaces Luta e Chave
  - O que fazer: Adicionar campos `status`, `vencedorId`, `rodada` em Luta; `totalRodadas` em Chave
  - Arquivo(s): src/types/bracket.ts
  - Como validar: TypeScript compila sem erros

Passo 2: Gerar lutas com TBD e calcular totalRodadas
  - O que fazer: criarLuta/gerarLutas/gerarLutasChaveEstruturada incluem `rodada`, `status:'pending'`; lutas de rodadas futuras usam `'tbd'` para atletaAId/atletaBId; getTotalRodadas calcula a partir do total de atletas
  - Arquivo(s): electron/brackets.ts
  - Como validar: Chave gerada tem lutas de todas as rodadas; lutas futuras têm atleta = 'tbd'

Passo 3: Implementar loadChavesPorArea por árbitros da área
  - O que fazer: Handler que carrega a área, extrai arbitroIds e filtra chaves por arbitroId
  - Arquivo(s): electron/brackets.ts
  - Como validar: Handler retorna apenas chaves cujo arbitroId está na área

Passo 4: Normalizar dados legados (normalizeChave/normalizeLuta)
  - O que fazer: Funções que preenchem defaults para rodada, status, totalRodadas; aplicar nos handlers load-chaves, load-chave-por-categoria, load-chaves-por-area
  - Arquivo(s): electron/brackets.ts
  - Como validar: Chaves antigas sem campos novos são exibidas sem erro

Passo 5: Registrar handler e preload bridge
  - O que fazer: Adicionar método loadChavesPorArea no preload.ts, handler no main.ts, tipo no electron.d.ts
  - Arquivo(s): electron/preload.ts, electron/main.ts, src/types/electron.d.ts
  - Como validar: IPC channel registrado sem conflito

Passo 6: Criar PlacarMenu (seleção de área)
  - O que fazer: Página com Select de área + botão "Acessar"
  - Arquivo(s): src/pages/PlacarMenu.tsx
  - Como validar: Navega para /admin/placar/chaves/:areaId

Passo 7: Criar PlacarChaves (lista de chaves + busca)
  - O que fazer: Página que carrega chaves da área, exibe cards com nome do árbitro + campo de busca textual
  - Arquivo(s): src/pages/PlacarChaves.tsx
  - Como validar: Chaves da área são exibidas; busca filtra em tempo real

Passo 8: Adaptar BracketTree (conectores, rodadas defensivas, getRoundLabel)
  - O que fazer: groupByRound defensivo contra rodada undefined; getRoundLabel substitui roundLabels; remover BracketConnector; adicionar ConnectorRight/ConnectorTop/ConnectorBottom como divs absolutas para linhas entre rounds
  - Arquivo(s): src/components/BracketTree.tsx
  - Como validar: Bracket exibe todas rodadas com linhas de conexão visíveis; chaves antigas não quebram

Passo 9: Adaptar BracketCard (tamanho uniforme, sem Iniciar)
  - O que fazer: Card com 200×120px fixo; exibir "A definir" para tbd/bye; remover botão "Iniciar"
  - Arquivo(s): src/components/BracketCard.tsx
  - Como validar: Cards têm tamanho uniforme; não há botão Iniciar dentro do card

Passo 10: Criar PlacarBracket (bracket + tabela de lutas para iniciar)
  - O que fazer: Página que carrega chave, exibe BracketTree (sem onIniciar) + tabela "Lutas para Iniciar" abaixo com botão Iniciar apenas para lutas da 1ª rodada, pending, sem bye/tbd
  - Arquivo(s): src/pages/PlacarBracket.tsx
  - Como validar: Rota /admin/placar/chave/:areaId/:chaveId exibe bracket + tabela com Iniciar

Passo 11: Criar PlacarLuta (placeholder)
  - O que fazer: Página com "Placar" centralizado + nome dos atletas + número da luta
  - Arquivo(s): src/pages/PlacarLuta.tsx
  - Como validar: Tela exibe "Placar" com dados da luta

Passo 12: Registrar rotas e atualizar Dashboard
  - O que fazer: Adicionar rotas em App.tsx; adicionar card "Placar" como implemented no Dashboard
  - Arquivo(s): src/App.tsx, src/pages/Dashboard.tsx
  - Como validar: Navegação entre telas funciona; card clicável
```

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** Deploy direto (sem feature flag). A feature não afeta módulos existentes.
- **Como monitorar:** Testar manualmente o fluxo completo: Dashboard → Placar → seleção de área → lista de chaves → visualização de bracket → iniciar luta → tela de placar.
- **Plano de rollback:** Reverter o commit da feature.

## 12. Definição de Pronto (DoD)

- [x] Todos os critérios de aceite verificados
- [x] Código compila sem erros de TypeScript (`tsc --noEmit` limpo)
- [x] `npm run lint` passa sem erros (0 warnings)
- [x] Navegação entre telas funcionando
- [x] Card "Placar" no Dashboard clicável
- [x] Seleção de área filtra chaves corretamente (por árbitros da área)
- [x] Busca textual na lista de chaves
- [x] Bracket exibe todas as rodadas (incluindo futuras com "A definir")
- [x] Cards do bracket têm tamanho uniforme (200×120px)
- [x] Linhas de conexão visíveis entre rounds do bracket
- [x] Botão "Iniciar" está na tabela abaixo do bracket, não nos cards
- [x] Tabela "Lutas para Iniciar" só mostra lutas válidas (1ª rodada, pending, sem bye/tbd)
- [x] Tela de placar exibe placeholder "Placar" + nomes dos atletas
- [x] Lutas finalizadas ou em andamento não podem ser reiniciadas
- [x] Dados legados normalizados (chaves antigas sem `rodada`/`status` não quebram)

---

## Histórico de Alterações

| Data | Versão | Descrição |
|------|--------|-----------|
| 02/06/2026 | 1.0 | Criação inicial da spec |
| 02/06/2026 | 1.1 | Corrigido filtro: chaves agora são filtradas por `arbitroId` da área (não `areaId` na chave) |
| 02/06/2026 | 1.2 | Adicionada busca textual na lista de chaves |
| 02/06/2026 | 1.3 | Adicionada normalização retroativa (`normalizeChave`/`normalizeLuta`) para chaves antigas sem `rodada`/`status`/`totalRodadas` |
| 02/06/2026 | 1.4 | Corrigido `groupByRound` para não quebrar com `rodada` undefined (`TypeError: Cannot read properties of undefined (reading 'push')`) |
| 02/06/2026 | 1.5 | Adicionado `getRoundLabel` no lugar do `roundLabels` fixo para melhor legibilidade e segurança |
| 02/06/2026 | 1.6 | Botão "Iniciar" removido dos `BracketCard` e movido para lista de lutas abaixo do bracket (`PlacarBracket`) |
| 02/06/2026 | 1.7 | Conector do bracket refeito: substituído `BracketConnector` por `ConnectorRight`/`ConnectorTop`/`ConnectorBottom` aplicados por card, usando divs com posicionamento absoluto (mesma técnica do exemplo HTML de referência) |
| 02/06/2026 | 1.8 | Bracket agora exibe formato fixo de pirâmide deitada (3, 2, 1) em todas as rodadas. Lógica de padding/truncamento generalizada para todas as colunas (não apenas Rodada 1) + limitação de colunas a no máximo 3 via `slice(-3)`. Ver `spec/bracket-formato-fixo.md`. |
