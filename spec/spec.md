# Spec: Navegação ao clicar em "Editar Torneio"

## Problema

Ao clicar no botão **Editar** (ícone de lápis) de um torneio na tela `ListarTorneios`, o usuário não é redirecionado para a tela de dashboard — a aplicação fica em uma tela em branco.

## Causa Raiz

A rota `/admin/dashboard` **não está definida** no roteador da aplicação.

### Fluxo atual

1. `ListarTorneios.tsx:174` — botão "Editar" chama `handleEdit(torneio)`
2. `ListarTorneios.tsx:55-57` — `handleEdit` chama `window.electronAPI.startTournament(id)` e depois `navigate('/admin/dashboard')`
3. `App.tsx:20-23` — o `<Routes>` do React Router **só definia** as rotas:

   | Path | Componente |
   |---|---|
   | `/` | `MenuInicial` |
   | `/admin/criar-torneio` | `CriarTorneio` |
   | `/admin/importar-torneio` | `ImportarTorneio` |
   | `/admin/listar-torneios` | `ListarTorneios` |

4. Como não havia rota para `/admin/dashboard` nem um fallback (`path="*"`), o React Router renderizava **nada** — tela em branco.

### Impacto

- O bug também afeta o botão **Iniciar** (play) em `ListarTorneios.tsx:44`, que igualmente navegava para `/admin/dashboard`.

## Correção Aplicada

1. **Renomeado** `src/pages/MenuInicial.tsx` → `src/pages/Dashboard.tsx` e o componente interno de `MenuInicial` para `Dashboard`.
2. **Atualizado** `src/App.tsx`:
   - Import alterado para `Dashboard`
   - Rota `/admin/dashboard` adicionada apontando para `<Dashboard />`
   - Rota `/` mantida apontando para `<Dashboard />`

## Notas Adicionais

- O `handleEdit` chama `startTournament(id)` via IPC para marcar o torneio como ativo (persiste em `torneio-ativo.json`) antes de navegar — essa parte funciona corretamente.
- Não há tratamento de loading durante a chamada IPC assíncrona.
