# Spec: Corrigir Loading Infinito ao Criar Torneio

## 1. Contexto e Objetivo

- **O que é:** Correção de bug que impede a criação de novos torneios, exibindo loading infinito ao acessar a página de criação.
- **Por que existe:** O `AreaGuard` confunde o estado "carregando" com "nenhum torneio ativo", criando um deadlock circular onde é impossível criar o primeiro torneio.
- **Quem usa:** Administradores do sistema que tentam criar um novo torneio.
- **Escopo:** Correção do fluxo de criação e importação de torneios. Fora do escopo: outras funcionalidades protegidas por `AreaGuard`.

---

## 2. Analise dos Documentos de Referência

- **Guia de spec** (este documento): todas as seções serão preenchidas
- **Documento de requisitos** `requisitos.md`: seções 3.1 (Torneio), 3.2 (Criação de Torneio), 3.3 (Importação de Torneio)
- **Documentação técnica existente**: nenhum spec prévio para esta feature
- **Código-fonte relevante**: `src/components/AreaGuard.tsx`, `src/utils/TournamentModeContext.tsx`, `src/App.tsx`, `src/pages/CriarTorneio.tsx`, `src/pages/ImportarTorneio.tsx`

---

## 3. Historia de Usuario

```
Como administrador,
quero criar um novo torneio,
para que eu possa gerenciar campeonatos de Jiu-Jitsu.
```

**Cenários alternativos:**
- Administrador tenta importar torneio sem ter torneio ativo → deve funcionar normalmente
- Administrador tenta acessar funcionalidades protegidas (atletas, chaves) sem torneio ativo → deve ser bloqueado corretamente
- Torneio ativo existe → `AreaGuard` deve funcionar normalmente (bloquear modo área)

---

## 4. Requisitos Funcionais

- [ ] RF-01: O sistema deve permitir acesso à página de criação de torneio (`/admin/criar-torneio`) mesmo quando não há torneio ativo.
- [ ] RF-02: O sistema deve permitir acesso à página de importação de torneio (`/admin/importar-torneio`) mesmo quando não há torneio ativo.
- [ ] RF-03: O `AreaGuard` deve exibir loading apenas durante o carregamento inicial do modo, não quando o modo é `null` (sem torneio ativo).
- [ ] RF-04: Funcionalidades que dependem de torneio ativo (atletas, árbitros, chaves, etc.) devem continuar sendo bloqueadas pelo `AreaGuard` quando não há torneio ativo.
- [ ] RF-05: O botão "Criar Torneio" deve exibir estado de loading durante a submissão do formulário.

---

## 5. Requisitos Nao-Funcionais

- **Performance:** sem impacto significativo
- **Segurança:** sem mudanças
- **Acessibilidade:** sem mudanças
- **Compatibilidade:** sem mudanças
- **Observabilidade:** sem mudanças

---

## 6. Analise da Aplicacao

- **Arquitetura geral:** Electron app com React frontend e Node.js main process. Comunicação via IPC.
- **Padrões em uso:** React Context para estado global, `@mantine/form` para formulários, `react-router-dom` para navegação.
- **Fluxo de dados:** `TournamentModeContext` busca o modo via IPC `get-tournament-mode`. `AreaGuard` consome o contexto e bloqueia/permite acesso.
- **Contratos de API:** `getTournamentMode()` retorna `'admin' | 'area' | null`. `createTournament()` retorna `Torneio`.

---

## 7. Arquivos Envolvidos

| Arquivo | Acao | Razao |
|---------|------|-------|
| `src/components/AreaGuard.tsx` | Modificar | Adicionar estado `loading` separado de `mode` |
| `src/utils/TournamentModeContext.tsx` | Modificar | Expor estado `loading` no contexto |
| `src/App.tsx` | Modificar | Remover `AreaGuard` de rotas de criação/importação |
| `src/pages/CriarTorneio.tsx` | Modificar | Adicionar estado `loading` no botão de submit |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Tecnicos

- `AreaGuard` trata `mode === null` como "carregando" indefinidamente, mas `mode === null` também significa "nenhum torneio ativo"
- Deadlock circular: criar torneio requer torneio ativo (via `AreaGuard`), mas torneio ativo só existe após criação

### 8.2 Ambiguidades nos Requisitos

- Nenhuma ambiguidade identificada

### 8.3 Riscos

- Mudança no `AreaGuard` pode afetar outras rotas protegidas → mitigado por testar todas as rotas afetadas

---

## 9. Criterios de Aceite

- [ ] CA-01: dado que não há torneio ativo, quando o usuário navega para `/admin/criar-torneio`, então a página de criação é exibida corretamente (sem loading infinito).
- [ ] CA-02: dado que não há torneio ativo, quando o usuário navega para `/admin/importar-torneio`, então a página de importação é exibida corretamente.
- [ ] CA-03: dado que não há torneio ativo, quando o usuário tenta acessar `/admin/atletas`, então é redirecionado ou bloqueado adequadamente.
- [ ] CA-04: dado que há torneio ativo no modo admin, quando o usuário acessa rotas administrativas, então o acesso é permitido.
- [ ] CA-05: dado que há torneio ativo no modo área, quando o usuário acessa rotas administrativas, então é redirecionado para `/admin/placar`.
- [ ] CA-06: quando o formulário de criação está sendo submetido, o botão "Criar Torneio" exibe estado de loading.

---

## 10. Plano de Implementacao (Passo a Passo)

```
Passo 1: Adicionar estado `loading` ao TournamentModeContext
  - O que fazer: adicionar estado `loading: boolean` inicializado como `true`, setar como `false` após `refresh()` completar
  - Arquivo(s): `src/utils/TournamentModeContext.tsx`
  - Como validar: contexto expõe `loading` e `mode` separadamente

Passo 2: Modificar AreaGuard para usar loading
  - O que fazer: retornar `<Loader />` apenas quando `loading === true`, não quando `mode === null`
  - Arquivo(s): `src/components/AreaGuard.tsx`
  - Como validar: `mode === null` (sem torneio ativo) não mostra loading infinito

Passo 3: Remover AreaGuard das rotas de criação/importação
  - O que fazer: remover wrapper `<AreaGuard>` de `/admin/criar-torneio` e `/admin/importar-torneio` em App.tsx
  - Arquivo(s): `src/App.tsx`
  - Como validar: rotas acessíveis sem torneio ativo

Passo 4: Adicionar loading ao botão de submit em CriarTorneio
  - O que fazer: adicionar estado `submitting` e passar `loading={submitting}` ao botão
  - Arquivo(s): `src/pages/CriarTorneio.tsx`
  - Como validar: botão exibe spinner durante submissão
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto (correção de bug)
- **Como monitorar:** testar fluxo completo de criação de torneio em novo build
- **Plano de rollback:** reverter mudanças nos arquivos afetados

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite foram verificados
- [ ] Código revisado
- [ ] Documentação atualizada (este spec)
- [ ] Sem warnings ou erros não tratados introduzidos
- [ ] Seção **Histórico de Correções** atualizada em spec.md
