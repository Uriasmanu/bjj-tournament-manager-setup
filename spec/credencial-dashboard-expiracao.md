# spec/credencial-dashboard-expiracao.md

> Feature: resolver o item da seção **Feature** do `doc/spec.md`:
> **"em dashbor, tem que mostrar se esta usando credencial, credencial deve expirar a cada 1 ano, e depois pedir a senha novamente (me fale a senha pq vou trocar manualmente)"**
>
> Decisões consolidadas (confirmadas pelo usuário):
> 1. **Senha padrão:** o usuário forneceu a senha desejada (NÃO exposta nesta spec por segurança). O **hash SHA-256** correspondente será gravado em `electron/activation.ts` como novo `MASTER_PASSWORD_HASH`. A senha plaintext **NÃO** é gravada em nenhum arquivo do repositório — o usuário a conhece e pode trocá-la editando o hash manualmente no futuro.
> 2. **UI no Dashboard:** "tem que ser um lugar discreto" — um card/seção compacto e sutil acima do grid de cards principais, com cores neutras e tipografia pequena. Não compete visualmente com os cards de navegação.
>
> Mudanças principais:
> 1. **Expiração automática:** `activation.json` ganha campo `expiresAt = activatedAt + 1 ano`. `checkActivation()` retorna `false` se `now > expiresAt` → app mostra `ActivationScreen` para nova autenticação.
> 2. **Indicador no Dashboard:** nova IPC `activation.getInfo()` retorna status completo. Dashboard exibe seção sutil com: status (Ativada/Expirada), data de ativação, data de expiração, dias restantes.
> 3. **Senha rotacionável:** novo `MASTER_PASSWORD_HASH` (SHA-256 da senha fornecida). O usuário pode trocar futuramente editando o hash no código ou via env var `MASTER_PASSWORD_HASH` (já suportado).

---

## 1. Contexto e Objetivo

- **O que é:** adicionar expiração anual ao sistema de credencial existente (`activation`) e exibir o status da credencial de forma discreta no Dashboard.
- **Por que existe:** o sistema atual tem uma ativação **perpétua** — uma vez ativada com a senha mestra, o app nunca mais pede senha. O usuário quer (a) forçar re-autenticação anual por segurança, (b) ter visibilidade do status da credencial no Dashboard, e (c) poder rotacionar a senha manualmente.
- **Quem usa:** desenvolvedor/admin que gerencia a distribuição do software e usuários finais que precisam re-ativar anualmente.
- **Escopo:**
  - **Dentro:**
    - Adicionar `expiresAt` ao JSON de ativação (`activation.json`).
    - Modificar `checkActivation()` em `electron/activation.ts` para validar expiração.
    - Adicionar função `getActivationInfo()` retornando `{ activated, activatedAt, expiresAt, daysRemaining }`.
    - Adicionar IPC handler `get-activation-info` em `electron/main.ts`.
    - Expor `window.activation.getInfo()` em `electron/preload.ts`.
    - Atualizar `ActivationAPI` em `src/types/electron.d.ts`.
    - Adicionar seção sutil no Dashboard (`src/pages/Dashboard.tsx`) mostrando o status.
    - Atualizar `MASTER_PASSWORD_HASH` para o hash da nova senha fornecida.
  - **Fora:** UI para trocar senha (o usuário troca manualmente editando o código/env var), revogação remota, múltiplas credenciais, logging de ativações, notificações de expiração iminente por email.

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): seções 1–12 aplicadas. O item da seção **Feature** é o ponto de partida.
- **Documento de requisitos** (`doc/requisitos.md`): sem seção específica sobre ativação — esta spec cobre um gap.
- **Documentação técnica existente:**
  - `spec/formulario-adicionar-atleta.md` e outras — padrões de doc (12 seções + Checklist Rápido).
- **Código-fonte relevante:**
  - `electron/activation.ts` — alvo principal. Contém `MASTER_PASSWORD_HASH`, `checkActivation()`, `validatePassword()`, `activateLicense()`.
  - `electron/main.ts` — registra `registerActivationHandlers()`. Precisa adicionar handler para `get-activation-info`.
  - `electron/preload.ts` — expõe `window.activation` com `check`, `validate`, `activate`. Precisa adicionar `getInfo`.
  - `src/types/electron.d.ts` — interface `ActivationAPI`. Precisa adicionar `getInfo`.
  - `src/App.tsx` — chama `window.activation.check()` no mount. **Sem mudança** (continua funcionando).
  - `src/components/ActivationScreen.tsx` — tela de ativação. **Sem mudança** (já mostra prompt de senha; após 1 ano, `checkActivation()` retorna `false` e ela aparece novamente).
  - `src/pages/Dashboard.tsx` — alvo da UI do status.

> ⚠️ **Análise do `activation.json` atual:**
> - Formato existente: `{ token: string, activatedAt: string }` (sem `expiresAt`).
> - Decisão: ao detectar ativação sem `expiresAt` (formato legado), `checkActivation()` retorna `false` (forçar re-ativação com novo formato). Isso é seguro: usuários com ativação antiga precisarão re-inserir a senha uma vez, e a partir daí terão `expiresAt` válido.

> ⚠️ **Compatibilidade com ativação existente:**
> - Usuários que já ativaram antes desta spec: o `activation.json` existente tem `{ token, activatedAt }` sem `expiresAt`. Após o deploy, ao abrir o app, `checkActivation()` retornará `false` (não tem `expiresAt`) → tela de ativação aparece → usuário digita a senha → novo `activation.json` com `expiresAt` é gravado.
> - Isso é uma **mudança breaking leve**: usuários ativos precisam re-ativar uma vez. Comportamento aceitável (alinhado com a feature de "expiração anual").

> ⚠️ **Onde colocar o status no Dashboard (decisão "discreto"):**
> - O usuário pediu "lugar discreto". Opções consideradas:
>   - Hero banner (proeminente) — rejeitado.
>   - Card no grid (proeminente) — rejeitado.
>   - Sidebar footer (discreto, mas só visível em `lg+`) — aceitável mas perde visibilidade mobile.
>   - **Seção sutil acima do grid** (escolhido): Box compacto com `background: #f8f9fa`, `border: 1px solid #e9ecef`, `padding: sm`, `borderRadius: 8`. Posicionado entre o hero banner e o `<Grid>` de cards. Tipografia `xs`, cor `dimmed`. Badge de status com cor contextual (verde=Ativada, amarelo=Próx. expiração, vermelho=Expirada).
>   - Esta opção é "discreta" (cores neutras, tamanho pequeno) e "sempre visível" (em todos os breakpoints).

> ⚠️ **Segurança da senha:**
> - A senha plaintext (fornecida pelo usuário, **não** exposta nesta spec) **NÃO** deve aparecer em nenhum arquivo commitado. Apenas o hash SHA-256.
> - O hash `f83244662ee78bf661577ecd28343bc4ff6538b6f249d6d7b1bf34817ec0ced4` é o que vai em `electron/activation.ts`.
> - O usuário conhece a senha plaintext. Se ele quiser trocar no futuro, edita o hash no código (ou define `MASTER_PASSWORD_HASH` via env var — já suportado).

> ⚠️ **Cálculo de `daysRemaining`:**
> - `daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))`.
> - Se negativo (expirado), retorna `0` (ou exibe "Expirada").
> - Cor do badge: verde se `daysRemaining > 30`, amarelo se `7 < daysRemaining <= 30`, vermelho se `daysRemaining <= 7` ou expirado.

---

## 3. História de Usuário

```
Como desenvolvedor/admin do software,
quero que a credencial expire a cada 1 ano e que o status seja visível no Dashboard,
para que eu tenha controle sobre quem está usando o software e possa rotacionar a senha manualmente.
```

**Cenários alternativos:**

- **Usuário acabou de ativar:** Dashboard mostra "Credencial: Ativada · Expira em 365 dias (DD/MM/AAAA)".
- **Faltam 30 dias para expirar:** Dashboard mostra badge amarelo "Expira em breve" + "Expira em 30 dias (DD/MM/AAAA)".
- **Faltam 7 dias:** Dashboard mostra badge vermelho "Expira em breve" + "Expira em 7 dias".
- **Credencial expirada (1+ ano):** ao abrir o app, `checkActivation()` retorna `false` → `ActivationScreen` aparece → usuário digita a senha (que pode ser a mesma ou uma nova se o dev rotacionou) → novo `activation.json` com novo `expiresAt` é gravado.
- **Ativação legada (sem `expiresAt`):** tratada como expirada → `ActivationScreen` aparece → re-ativação gera novo `expiresAt`.
- **Dashboard sem `activation.json` (nunca ativado):** isso **NÃO** deveria acontecer no fluxo normal (porque `App.tsx` força ativação antes de mostrar o Dashboard). Mas defensivamente: `getActivationInfo` retorna `activated: false`, `activatedAt: null`, `expiresAt: null`, `daysRemaining: null`. Dashboard mostra "Credencial: Não ativada" (caso edge improvável).
- **Env var `MASTER_PASSWORD_HASH` setada:** o código já suporta (`process.env.MASTER_PASSWORD_HASH || '<default>'`). A spec não muda esse comportamento. Dev pode rotacionar via env sem editar o código.

---

## 4. Requisitos Funcionais

- [ ] RF-01: o arquivo `electron/activation.ts` tem o `MASTER_PASSWORD_HASH` substituído pelo hash SHA-256 da senha fornecida pelo usuário (`f83244662ee78bf661577ecd28343bc4ff6538b6f249d6d7b1bf34817ec0ced4`). A senha plaintext NÃO é gravada em nenhum arquivo do repositório.
- [ ] RF-02: `checkActivation()` em `electron/activation.ts` retorna `false` se o `activation.json` não tem campo `expiresAt` (formato legado). Retorna `false` se `new Date() > new Date(expiresAt)`. Caso contrário, mantém a validação atual do `token`.
- [ ] RF-03: `activateLicense()` em `electron/activation.ts` agora grava `{ token, activatedAt, expiresAt }` no `activation.json`, onde `expiresAt = activatedAt + 1 ano` (em ISO 8601).
- [ ] RF-04: nova função `getActivationInfo()` em `electron/activation.ts` retorna:
  ```ts
  type ActivationInfo = {
    activated: boolean;
    activatedAt: string | null;
    expiresAt: string | null;
    daysRemaining: number | null;
  };
  ```
  - Se `activation.json` não existe ou é inválido → `{ activated: false, activatedAt: null, expiresAt: null, daysRemaining: null }`.
  - Se existe mas está expirado (ou sem `expiresAt`) → `{ activated: false, activatedAt: '<ISO>', expiresAt: '<ISO ou null>', daysRemaining: 0 }`.
  - Se ativo → calcula `daysRemaining = max(0, Math.ceil((expiresAt - now) / 86400000))`.
- [ ] RF-05: nova IPC handler em `electron/main.ts`: `ipcMain.handle('get-activation-info', () => getActivationInfo())`. Adicionar à função `registerActivationHandlers()`.
- [ ] RF-06: novo método `getInfo` em `electron/preload.ts` no objeto `activation`: `getInfo: () => ipcRenderer.invoke('get-activation-info')`.
- [ ] RF-07: interface `ActivationAPI` em `src/types/electron.d.ts` ganha `getInfo: () => Promise<ActivationInfo>`. Tipo `ActivationInfo` exportado.
- [ ] RF-08: `src/pages/Dashboard.tsx` exibe uma seção sutil entre o hero banner e o `<Grid>` de cards:
  - Container: `<Box mb="md" p="sm" style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8 }}>`.
  - Conteúdo: `<Group gap="xs" align="center">` com:
    - `<IconLock size={14} color="#6c757d" />` (decorativo).
    - `<Text size="xs" c="dimmed">Credencial:</Text>`.
    - `<Badge size="xs" color={statusColor}>{statusLabel}</Badge>` — cor: verde (`Ativada`) se `daysRemaining > 30`, amarelo (`Expira em breve`) se `7 < daysRemaining <= 30`, vermelho (`Expirada` ou `Expira em breve`) se `daysRemaining <= 7` ou expirado.
    - `<Text size="xs" c="dimmed">· Expira em {daysRemaining} dias ({formatDate(expiresAt)})</Text>` — se `activated`.
    - `<Text size="xs" c="dimmed">· Ativada em {formatDate(activatedAt)}</Text>` — sempre que houver `activatedAt`.
  - Se `!activated` e `activatedAt === null`: mostrar "Credencial: Não ativada" (edge case defensivo).
- [ ] RF-09: o Dashboard carrega `getActivationInfo()` no `useEffect` existente (junto com `getActiveTournament`). Estado local: `const [activationInfo, setActivationInfo] = useState<ActivationInfo | null>(null)`. Renderiza a seção sutil quando `activationInfo !== null`.
- [ ] RF-10: a senha plaintext (fornecida pelo usuário, **NÃO** exposta nesta spec por segurança) **NÃO** aparece em nenhum arquivo do repositório. Apenas o hash SHA-256. Confirmação visual: `grep -r "<senha-plaintext>" .` (em arquivos do repo) deve retornar 0 matches.
- [ ] RF-11: a lógica de expiração é **tempo real** (lê `new Date()` a cada `checkActivation()`). Não há cache nem timer de re-checagem — o Electron já chama `checkActivation()` no boot, o que é suficiente.
- [ ] RF-12: nenhum novo arquivo é criado. Modificações em: `electron/activation.ts`, `electron/main.ts`, `electron/preload.ts`, `src/types/electron.d.ts`, `src/pages/Dashboard.tsx`.
- [ ] RF-13: nenhum IPC novo além de `get-activation-info`. Nenhum tipo novo além de `ActivationInfo`. Nenhuma migração de dados (formato legado é tratado como expirado).

---

## 5. Requisitos Não-Funcionais

- **Performance:** `getActivationInfo()` lê 1 arquivo pequeno (`activation.json`, ~100 bytes) e faz cálculos de data triviais. Sem impacto perceptível.
- **Segurança:**
  - Senha nunca é armazenada em plaintext no código.
  - Hash SHA-256 armazenado em `electron/activation.ts` (e/ou env var `MASTER_PASSWORD_HASH`).
  - `getActivationInfo()` não expõe a senha nem o token — apenas metadados (datas, status).
- **Acessibilidade:** o badge de status tem `aria-label` descritivo. A seção tem `role="status"` para leitores de tela anunciarem mudanças.
- **Compatibilidade:** Electron + React 18 + Mantine 7. Sem mudança de browser-only API.
- **Observabilidade:** nenhuma métrica/log novo.

---

## 6. Análise da Aplicação

- **Arquitetura geral:** Electron (main + preload + renderer). Main process controla credencial via IPC. Renderer consome via `window.activation`.
- **Padrões em uso:**
  - **Main:** `app.getPath('userData')` para localizar `activation.json`. `crypto.createHash('sha256')` e `crypto.createHmac('sha256')` para hash e token.
  - **Preload:** `contextBridge.exposeInMainWorld` para expor APIs.
  - **Renderer:** `useState` + `useEffect` para carregar dados assíncronos.
- **Fluxo de dados:**
  1. `App.tsx` (mount) → `window.activation.check()` → IPC `check-activation` → `checkActivation()` → lê `activation.json` + valida `token` + valida `expiresAt`.
  2. Se válido → `MainApp` é renderizado.
  3. `Dashboard` (mount) → `window.activation.getInfo()` → IPC `get-activation-info` → `getActivationInfo()` → retorna metadados → Dashboard renderiza seção sutil.
- **Contratos de API:**
  - Existentes: `check`, `validate`, `activate`.
  - Novo: `getInfo` (retorna `ActivationInfo`).

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---|---|---|
| `electron/activation.ts` | Modificar | (1) Substituir `MASTER_PASSWORD_HASH`; (2) modificar `checkActivation()` para validar `expiresAt`; (3) modificar `activateLicense()` para incluir `expiresAt`; (4) adicionar `getActivationInfo()`. |
| `electron/main.ts` | Modificar | Adicionar handler IPC `get-activation-info` em `registerActivationHandlers()`. |
| `electron/preload.ts` | Modificar | Adicionar `getInfo: () => ipcRenderer.invoke('get-activation-info')` no objeto `activation`. |
| `src/types/electron.d.ts` | Modificar | Adicionar `ActivationInfo` type e método `getInfo` em `ActivationAPI`. |
| `src/pages/Dashboard.tsx` | Modificar | Adicionar `useState<ActivationInfo>`, `useEffect` para carregar, e seção sutil de status. |
| `spec/credencial-dashboard-expiracao.md` | Criar | Esta especificação. |
| `doc/spec.md` | Modificar | Adicionar entry consolidada no Histórico de Correções referenciando esta spec. A seção **Feature** permanece inalterada (regra "NÃO apagar algo"). |

> ⚠️ Nenhum outro arquivo precisa ser tocado. `App.tsx` e `ActivationScreen.tsx` seguem **inalterados** — o ciclo de ativação existente já cobre o re-prompt após expiração.

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos

- **Formato legado sem `expiresAt`:** usuários que já ativaram antes desta spec têm `activation.json` sem `expiresAt`. Decisão: `checkActivation()` retorna `false` para esse caso → app força re-ativação. Trade-off: usuários ativos precisam re-inserir a senha uma vez após o deploy. Comportamento aceitável.
- **Token HMAC depende do `MASTER_PASSWORD_HASH`:** ao trocar o hash, todos os tokens antigos ficam inválidos. Combinado com o tratamento de legado, isso é OK: após o deploy, todos os usuários (antigos e novos) precisam re-ativar com a nova senha.
- **Defesa contra `wmic` falhar:** `getMachineId()` já tem fallback para `crypto.randomUUID()`. Se `wmic` falhar e gerar UUIDs diferentes entre sessões, o token pode invalidar. Comportamento existente; não muda nesta spec.
- **Leitura de `activation.json` corrompido:** `checkActivation` e `getActivationInfo` retornam `false` / metadados nulos em caso de exception (try/catch existente). Comportamento robusto.

### 8.2 Ambiguidades nos Requisitos

- **"Tem que ser um lugar discreto" (UI no Dashboard):** decido por seção sutil acima do grid (cores neutras, tipografia `xs`, badge de status). Documentado em §2 e RF-08.
- **"Me fale a senha pq vou trocar manualmente":** interpretamos como: o usuário quer uma senha **conhecida** (não aleatória) para que ele possa rotacioná-la no futuro. Decisão: o usuário forneceu a senha (NÃO exposta nesta spec), o hash vai no código, a senha plaintext **não** vai em nenhum arquivo.
- **"Depois pedir a senha novamente" (re-prompt):** o ciclo de ativação existente (`App.tsx` → `ActivationScreen`) já cobre isso. Após `expiresAt` passar, `checkActivation()` retorna `false` e o `ActivationScreen` aparece. **Nenhuma mudança** em `App.tsx` ou `ActivationScreen.tsx` é necessária.
- **Quem pode trocar a senha?** Apenas o dev (editando código ou env var). Não há UI para isso. Decisão consciente — alinhada com "vou trocar manualmente".
- **Notificação antes de expirar?** Não mencionada. Decisão: badge amarelo "Expira em breve" quando `daysRemaining <= 30` é a única "notificação" visual. Sem email, sem modal, sem notificação do sistema.
- **Rotação automática da senha?** Não. Decisão: o dev rotaciona manualmente quando quiser (1x por ano ou conforme política).
- **Múltiplas senhas (revogação)?** Não. Decisão: 1 senha por vez (a do `MASTER_PASSWORD_HASH`). Para revogar, basta trocar a senha.

### 8.3 Riscos

- **Risco baixo.** Mudança isolada em 5 arquivos. Lógica de validação comprovada (existente há ciclos).
- **Regressão:** usuários ativos perdem acesso e precisam re-ativar. Comportamento intencional e alinhado com a feature.
- **Senha em código:** o hash SHA-256 está em `electron/activation.ts` (visível no repo). Quem tem acesso ao repo pode rodar o hash por força bruta, mas a senha é complexa o suficiente (18 caracteres com símbolos, números, maiúsculas e minúsculas) para tornar isso inviável. Boa prática: rotacionar 1x por ano (alinhado com a expiração).
- **`daysRemaining` em fusos horários:** usamos `new Date()` (hora local) tanto no `checkActivation` quanto no `getActivationInfo`. Diferenças de fuso entre máquinas não afetam (cada máquina calcula em seu próprio fuso, e a `activation.json` é local). Comportamento correto.

> ⚠️ Nenhum impedimento bloqueante.

---

## 9. Critérios de Aceite

- [ ] CA-01: dado que o `electron/activation.ts` é inspecionado, o `MASTER_PASSWORD_HASH` é o hash SHA-256 da senha fornecida (`f83244662ee78bf661577ecd28343bc4ff6538b6f249d6d7b1bf34817ec0ced4`).
- [ ] CA-02: dado que o usuário abre o app pela primeira vez, quando a tela de ativação aparece, então o usuário digita a senha correta e o `activation.json` é gravado com `{ token, activatedAt, expiresAt }` onde `expiresAt = activatedAt + 1 ano`.
- [ ] CA-03: dado que o `activation.json` tem `expiresAt` no passado, quando o app é aberto, então `checkActivation()` retorna `false` e o `ActivationScreen` aparece para nova autenticação.
- [ ] CA-04: dado que o `activation.json` tem `expiresAt` no futuro (> 1 ano), quando o app é aberto, então `checkActivation()` retorna `true` e o app segue normal.
- [ ] CA-05: dado que o `activation.json` está no formato legado (sem `expiresAt`), quando o app é aberto, então `checkActivation()` retorna `false` (forçando re-ativação com novo formato).
- [ ] CA-06: dado que o usuário está no Dashboard, quando a página carrega, então uma seção sutil aparece entre o hero banner e o grid de cards, mostrando o status da credencial (Ativada/Expirada/Próx. expiração), data de ativação, data de expiração e dias restantes.
- [ ] CA-07: dado que a credencial tem `daysRemaining > 30`, quando o Dashboard renderiza, então o badge é **verde** com label "Ativada".
- [ ] CA-08: dado que a credencial tem `7 < daysRemaining <= 30`, quando o Dashboard renderiza, então o badge é **amarelo** com label "Expira em breve".
- [ ] CA-09: dado que a credencial tem `daysRemaining <= 7` ou está expirada, quando o Dashboard renderiza, então o badge é **vermelho** com label "Expirada" ou "Expira em breve".
- [ ] CA-10: dado que o código é grepado pela senha plaintext (`grep -r "<senha-plaintext>" .` em arquivos do repo), quando o comando roda, então **0 matches** são encontrados (a senha não está em nenhum arquivo commitado).
- [ ] CA-11: dado que o código está completo, quando rodamos `npx tsc --noEmit` e `npm run lint`, então 0 erros e 0 warnings novos (apenas os 3 pré-existentes em `PageLayout.tsx`/`PlacarBracket.tsx`).
- [ ] CA-12: dado que o `doc/spec.md` foi atualizado, então a seção **Feature** permanece inalterada (regra "NÃO apagar algo") e o Histórico de Correções tem uma nova entry referenciando esta spec.

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Atualizar MASTER_PASSWORD_HASH em electron/activation.ts
  - O que fazer: substituir o hash atual pelo novo hash da senha fornecida.
  - Arquivo: electron/activation.ts (linha 7)
  - Como validar: grep do hash no arquivo confirma substituição.

Passo 2: Modificar checkActivation para validar expiresAt
  - O que fazer: adicionar check `if (!data.expiresAt) return false` e `if (new Date() > new Date(data.expiresAt)) return false`.
  - Arquivo: electron/activation.ts (função checkActivation, linhas 24-38)
  - Como validar: tsc passa; simulação manual com activation.json forjado.

Passo 3: Modificar activateLicense para incluir expiresAt
  - O que fazer: calcular `const expiresAt = new Date(); expiresAt.setFullYear(expiresAt.getFullYear() + 1);` e incluir no JSON.
  - Arquivo: electron/activation.ts (função activateLicense, linhas 45-58)
  - Como validar: rodar app, ativar, inspecionar activation.json gerado.

Passo 4: Adicionar getActivationInfo em electron/activation.ts
  - O que fazer: nova função que retorna ActivationInfo. Ler activation.json, calcular daysRemaining, retornar objeto tipado.
  - Arquivo: electron/activation.ts (após activateLicense)
  - Como validar: tsc passa.

Passo 5: Adicionar IPC handler em electron/main.ts
  - O que fazer: ipcMain.handle('get-activation-info', () => getActivationInfo()) em registerActivationHandlers.
  - Arquivo: electron/main.ts (linhas 203-215)
  - Como validar: tsc passa.

Passo 6: Expor getInfo no preload
  - O que fazer: adicionar `getInfo: () => ipcRenderer.invoke('get-activation-info')` no objeto activation.
  - Arquivo: electron/preload.ts (linhas 105-109)
  - Como validar: tsc passa.

Passo 7: Atualizar interface em src/types/electron.d.ts
  - O que fazer: exportar type ActivationInfo; adicionar getInfo ao ActivationAPI.
  - Arquivo: src/types/electron.d.ts (linhas 71-75)
  - Como validar: tsc passa; tipo usado em Dashboard.tsx sem erro.

Passo 8: Adicionar seção sutil no Dashboard
  - O que fazer: useState<ActivationInfo>, useEffect para carregar, render condicional da seção.
  - Arquivo: src/pages/Dashboard.tsx (após hero banner, antes do <Grid>)
  - Como validar: npm run dev, abrir dashboard, ver seção sutil com status.

Passo 9: Validar com lint e tsc
  - O que fazer: rodar npx tsc --noEmit e npm run lint.
  - Como validar: 0 erros, 0 warnings novos.

Passo 10: Validar segurança da senha
  - O que fazer: grep pela senha plaintext (fornecida pelo usuário, NÃO exposta nesta spec) no repo (excluindo node_modules, dist). Deve retornar 0 matches em arquivos .ts/.tsx/.js/.json do código fonte.
  - Como validar: grep retorna apenas arquivos irrelevantes ou nada.

Passo 11: Atualizar doc/spec.md
  - O que fazer: adicionar entry consolidada no Histórico de Correções. NÃO alterar a seção Feature.
  - Arquivo: doc/spec.md
  - Como validar: Histórico tem nova entry; Feature intacta.
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto. Mudança isolada em renderer + main. Sem migração de dados.
- **Como monitorar:** abrir o app, ver se `ActivationScreen` aparece (esperado: sim, para todos que tinham ativação legada); ativar com a nova senha; ver Dashboard com seção sutil.
- **Plano de rollback:** `git revert` do commit desta feature. Após rollback, `activation.json` (formato novo com `expiresAt`) ainda será lido pelo código antigo como `{ token, activatedAt, expiresAt }` — o código antigo ignora `expiresAt` e valida só `token`, então o app continua funcionando.

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os 12 CA verificados manualmente em dev.
- [ ] `npx tsc --noEmit` e `npm run lint` passam (0 erros, 0 warnings novos).
- [ ] `MASTER_PASSWORD_HASH` atualizado para o novo hash.
- [ ] `activation.json` agora inclui `expiresAt`.
- [ ] Dashboard exibe seção sutil com status correto.
- [ ] Badge muda de cor conforme proximidade da expiração.
- [ ] Senha plaintext **não** aparece em nenhum arquivo do repo (CA-10).
- [ ] `doc/spec.md` (Histórico de Correções) atualizado com entry consolidada referenciando esta spec.
- [ ] Seção **Feature** do `doc/spec.md` permanece inalterada.

---

## Checklist Rápido

- [x] Itens em "Problemas Encontrados" lidos — **0 itens `[aberto]`** (seção vazia).
- [x] Documentos de referência lidos (`doc/requisitos.md`, código-fonte, 4 specs anteriores).
- [x] Decisões do usuário coletadas (senha fornecida; UI discreta).
- [x] História de usuário e objetivo claros.
- [x] Arquivos envolvidos identificados (5 arquivos + spec + Histórico).
- [x] Problemas e impedimentos listados (formato legado, hash em código, etc.).
- [x] Plano de implementação em ordem lógica (main → preload → types → renderer → validação).
- [x] Critérios de aceite verificáveis (12 CA).
- [x] Incertezas sinalizadas explicitamente (notificação, rotação automática, múltiplas senhas — todas "não mencionadas, decididas no escopo").
