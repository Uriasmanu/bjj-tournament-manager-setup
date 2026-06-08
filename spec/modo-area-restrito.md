# Modo Área Restrito (Modal Admin/Área ao Iniciar Torneio)

## 1. Contexto e Objetivo

- **O que é:** Ao clicar em "Iniciar" em um torneio, um modal pergunta se o usuário é Administrador ou Área de Luta. Administrador segue o fluxo normal (Dashboard com acesso total). Área de Luta vai direto para o Placar (seleção de área) e tem navegação restrita.
- **Por que existe:** Evitar que operadores de área de luta alterem informações administrativas do torneio (atletas, árbitros, chaves, áreas, etc.). Cada máquina de área deve poder apenas operar o placar.
- **Quem usa:** Organizadores (modo admin) e operadores de área de luta (modo área).
- **Escopo:** Dentro: modal de seleção ao iniciar, restrição de navegação no modo área, armazenamento do modo no torneio-ativo.json. Fora: autenticação por senha, permissões granulares.

## 2. Documentos de Referência

- `doc/spec.md` — Guia de spec
- `doc/requisitos.md` — Requisitos do sistema
- `electron/tournament.ts` — Handler `start-tournament`
- `src/pages/ListarTorneios.tsx` — Botão "Iniciar" atual
- `src/App.tsx` — Rotas da aplicação
- `src/types/electron.d.ts` — Tipagens IPC

## 3. História de Usuário

```
Como operador de área de luta,
quero iniciar o torneio no modo área,
para que eu possa apenas operar o placar da minha área sem risco de alterar configurações do torneio.
```

```
Como organizador,
quero que operadores de área não tenham acesso às funções administrativas,
para que a configuração do torneio não seja alterada acidentalmente.
```

## 4. Requisitos Funcionais

- [ ] RF-01: O sistema deve exibir um modal ao clicar em "Iniciar" em um torneio, com duas opções: "Administrador" e "Área de Luta".
- [ ] RF-02: Ao selecionar "Administrador", o torneio inicia no modo admin e o usuário é redirecionado ao Dashboard (comportamento atual).
- [ ] RF-03: Ao selecionar "Área de Luta", o torneio inicia no modo área e o usuário é redirecionado ao PlacarMenu (`/admin/placar`).
- [ ] RF-04: No modo área, o usuário só pode navegar entre: Menu Inicial (`/`), Dashboard (`/admin/dashboard` — apenas leitura) e Placar (`/admin/placar` e sub-rotas).
- [ ] RF-05: No modo área, as demais rotas administrativas (`/admin/atletas`, `/admin/arbitros`, `/admin/areas`, `/admin/categorias/chaves`, `/admin/resultados`, `/admin/lutas-casadas`) devem ser bloqueadas com redirecionamento ou ocultação.
- [ ] RF-06: O modo escolhido deve ser persistido em `torneio-ativo.json` junto com o `id` do torneio.
- [ ] RF-07: Um novo IPC `get-tournament-mode` deve retornar o modo atual (`'admin' | 'area' | null`).

## 5. Requisitos Não-Funcionais

- **Compatibilidade:** O modo área não altera a estrutura do JSON do torneio — apenas o `torneio-ativo.json` é modificado.
- **Observabilidade:** Notificação de sucesso ao iniciar o torneio em qualquer modo.

## 6. Análise da Aplicação

- **Arquitetura:** Electron + React. O `torneio-ativo.json` armazena `{ id, mode }`. O frontend consulta o modo via IPC e condiciona a navegação.
- **Fluxo de dados:** ListarTorneios → modal → startTournament(id, mode) → navigate(admin ou placar).
- **Contratos:** `startTournament(id, mode)` modifica o ATIVO_FILE. `getTournamentMode()` lê o ATIVO_FILE.

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `electron/tournament.ts` | Modificar | `startTournament` aceitar `{ id, mode }`; adicionar `getTournamentMode` |
| `electron/preload.ts` | Modificar | Expor `getTournamentMode` no IPC |
| `src/types/electron.d.ts` | Modificar | Adicionar `getTournamentMode` e atualizar `startTournament` |
| `src/pages/ListarTorneios.tsx` | Modificar | Adicionar modal Admin/Área antes de iniciar |
| `src/App.tsx` | Criar | Adicionar `TournamentModeContext` e guard de rotas |
| `src/components/PageLayout.tsx` | Modificar | Opcional: ocultar navegação não permitida no modo área |
| `src/pages/Dashboard.tsx` | Modificar | No modo área, exibir versão somente leitura (apenas info do torneio, sem cards de navegação) |

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- Nenhum identificado.

### 8.2 Ambiguidades

- "Central do torneio" no modo área: deve ser o Dashboard existente mas sem os cards de navegação admin (apenas header com nome/data/badge).

### 8.3 Riscos

- Se o modo não for persistido corretamente (ex.: `torneio-ativo.json` corrompido), o sistema deve tratar como admin (fallback seguro).

## 9. Critérios de Aceite

- [ ] CA-01: Dado um torneio na listagem, quando clico em "Iniciar", então um modal aparece com "Administrador" e "Área de Luta".
- [ ] CA-02: Dado que selecionei "Administrador", então o torneio inicia e vou para o Dashboard com acesso total.
- [ ] CA-03: Dado que selecionei "Área de Luta", então o torneio inicia e vou para o PlacarMenu.
- [ ] CA-04: Dado que estou no modo área, quando navego para uma rota admin restrita, então sou redirecionado para o Dashboard ou Placar.
- [ ] CA-05: Dado que estou no modo área, então o Dashboard exibe apenas informações do torneio (sem cards de navegação admin).
- [ ] CA-06: Dado que fecho e reabro o app no modo área, então o modo é preservado.

## 10. Plano de Implementação

```
Passo 1: Backend — Modificar startTournament e adicionar getTournamentMode
  - O que fazer: startTournament aceita { id: string, mode: 'admin' | 'area' }; ATIVO_FILE salva { id, mode }; novo IPC get-tournament-mode retorna o mode do ATIVO_FILE
  - Arquivo(s): electron/tournament.ts, electron/preload.ts, src/types/electron.d.ts
  - Como validar: compilação sem erros

Passo 2: Frontend — Modal de seleção em ListarTorneios
  - O que fazer: Substituir handleStart para abrir modal com duas opções; Admin → startTournament(id, 'admin') → navigate('/admin/dashboard'); Area → startTournament(id, 'area') → navigate('/admin/placar')
  - Arquivo(s): src/pages/ListarTorneios.tsx
  - Como validar: modal aparece ao clicar em Play

Passo 3: Frontend — Guard de rotas para modo área
  - O que fazer: Criar TournamentModeContext; em App.tsx, verificar modo e redirecionar rotas restritas; Dashboard oculta cards admin no modo área
  - Arquivo(s): src/App.tsx, src/pages/Dashboard.tsx
  - Como validar: modo área não acessa rotas admin
```

## 11. Rollout e Observabilidade

- **Estratégia:** Deploy direto (nova funcionalidade, não altera comportamento existente do modo admin).
- **Monitorar:** N/A (funcionalidade local, sem métricas).
- **Rollback:** Restaurar versão anterior dos arquivos modificados.

## 12. Definição de Pronto

- [ ] Todos os critérios de aceite foram verificados
- [ ] Código revisado
- [ ] Documentação atualizada (spec criada, requisitos.md se necessário)
- [ ] Sem warnings ou erros no compilador TypeScript
