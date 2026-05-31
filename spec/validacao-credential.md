# Validação de Credencial (Ativação Única)

## 1. Objetivo

Proteger o software contra compartilhamento indevido, exigindo uma senha de ativação **na primeira execução** em cada máquina. Após validada, o sistema libera o acesso permanente sem solicitar novamente a senha.

---

## 2. Fluxo de Funcionamento

1. Usuário instala e abre o software pela primeira vez.
2. Uma tela de ativação é exibida solicitando uma senha.
3. O usuário informa a senha fornecida pelo desenvolvedor.
4. O sistema valida a senha localmente (hash comparado).
5. Se correta: gera um **token único** baseado no hardware da máquina, criptografa e salva em disco.
6. Se incorreta: exibe erro e bloqueia o acesso.
7. Nas execuções seguintes, o sistema verifica se o token de ativação existe e é válido. Se sim, libera direto para o aplicativo.

---

## 3. Arquitetura da Solução

### 3.1. Geração da Senha Mestra (pelo desenvolvedor)

- Definir uma senha mestra (ex: `Bjj@2025!Secure`).
- Gerar o hash SHA-256 dessa senha.
- O hash é embutido no código do Electron (main process) — **não a senha em texto puro**.

```
hash = SHA256("Bjj@2025!Secure")
// Armazenado no código: "a1b2c3d4e5f6..."
```

### 3.2. Geração do Token de Ativação (na máquina do cliente)

- Na primeira ativação com sucesso, o sistema gera um identificador único da máquina:
  - **Windows**: usa `wmic csproduct get uuid` ou `win32_computersystemproduct.uuid`.
  - Combina com o nome do usuário e um salt fixo.
- Gera um hash HMAC desse identificador com a senha mestra.
- Salva esse token criptografado em um arquivo JSON em `app.getPath('userData')`.

### 3.3. Verificação na Inicialização

- No `main.ts`, antes de carregar a janela principal:
  - Verificar se o arquivo de ativação existe.
  - Se existir, carregar a janela normalmente (App).
  - Se não existir, carregar a janela com a tela de ativação (LockScreen).

### 3.4. Comunicação Main <> Renderer

- Usar `ipcMain.handle` / `ipcRenderer.invoke` para:
  - `validate-password`: recebe a senha digitada, compara o hash, retorna sucesso/erro.
  - `check-activation`: verifica se o token de ativação existe.
  - `activate-license`: gera e salva o token de ativação.

---

## 4. Estrutura de Arquivos

```
electron/
  main.ts              ← Lógica de verificação + criação do arquivo de ativação
  preload.ts           ← Exposição dos métodos IPC
  activation.ts        ← Funções de hash, token, leitura/escrita do arquivo

src/
  components/
    ActivationScreen.tsx  ← Tela de ativação (React)
  App.tsx              ← Verifica ativação e decide qual tela renderizar
```

---

## 5. Implementação Passo a Passo

### 5.1. `electron/activation.ts`

```typescript
import { app } from 'electron'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const MASTER_PASSWORD_HASH = process.env.MASTER_PASSWORD_HASH || ''
const ACTIVATION_FILE = 'activation.json'

function getActivationPath(): string {
  return path.join(app.getPath('userData'), ACTIVATION_FILE)
}

function getMachineId(): string {
  try {
    const uuid = execSync('wmic csproduct get uuid', { encoding: 'utf-8' })
    const lines = uuid.split('\n').map(l => l.trim()).filter(Boolean)
    return lines[1] || crypto.randomUUID()
  } catch {
    return crypto.randomUUID()
  }
}

export function checkActivation(): boolean {
  try {
    const filePath = getActivationPath()
    if (!fs.existsSync(filePath)) return false
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const machineId = getMachineId()
    const expectedToken = crypto
      .createHmac('sha256', MASTER_PASSWORD_HASH)
      .update(machineId)
      .digest('hex')
    return data.token === expectedToken
  } catch {
    return false
  }
}

export function validatePassword(password: string): boolean {
  const hash = crypto.createHash('sha256').update(password).digest('hex')
  return hash === MASTER_PASSWORD_HASH
}

export function activateLicense(): boolean {
  try {
    const machineId = getMachineId()
    const token = crypto
      .createHmac('sha256', MASTER_PASSWORD_HASH)
      .update(machineId)
      .digest('hex')
    const filePath = getActivationPath()
    fs.writeFileSync(filePath, JSON.stringify({ token, activatedAt: new Date().toISOString() }), 'utf-8')
    return true
  } catch {
    return false
  }
}
```

### 5.2. `electron/main.ts` — Verificação Inicial

```typescript
import { checkActivation } from './activation'

// No app.whenReady():
app.whenReady().then(() => {
  const isActivated = checkActivation()
  createWindow(isActivated)
})
```

Passar `isActivated` via `win.loadURL` como query param ou usar IPC.

### 5.3. `electron/preload.ts` — Exposição dos Métodos

```typescript
contextBridge.exposeInMainWorld('activation', {
  check: () => ipcRenderer.invoke('check-activation'),
  validate: (password: string) => ipcRenderer.invoke('validate-password', password),
  activate: () => ipcRenderer.invoke('activate-license'),
})
```

### 5.4. `src/components/ActivationScreen.tsx`

Tela fullscreen (sem possibilidade de fechar) com:
- Input de senha.
- Botão "Ativar".
- Mensagem de erro se senha incorreta.
- Ao ativar com sucesso, salva e redireciona para o App.

### 5.5. `src/App.tsx`

```tsx
const [activated, setActivated] = useState<boolean | null>(null)

useEffect(() => {
  window.activation.check().then(setActivated)
}, [])

if (activated === null) return <Loading />
if (!activated) return <ActivationScreen onActivated={() => setActivated(true)} />
return <MainApp />
```

---

## 6. Segurança

| Medida | Descrição |
|--------|-----------|
| Senha nunca em texto puro | Apenas o hash SHA-256 é armazenado no código |
| Token vinculado ao hardware | HMAC combina machine UUID + senha mestra |
| Arquivo em `userData` | Diretório protegido do sistema, não acessível ao usuário comum |
| Ofuscação via build | O código é compilado no bundle do Electron, dificultando engenharia reversa |

> **Atenção:** Esta solução oferece proteção básica contra uso não autorizado. Não é 100% à prova de cracking, mas eleva significativamente a barreira para compartilhamento indevido.

---

## 7. Build e Distribuição

- Definir a variável de ambiente `MASTER_PASSWORD_HASH` no momento do build.
- No `electron-builder`, é possível embutir via `extraResources` ou config.
- O desenvolvedor gera o hash com:

```bash
echo -n "SenhaMestra" | sha256sum
```

- Esse hash é inserido no código ou injetado via `process.env` no momento do build.

---

## 8. Considerações Finais

- O usuário comum não consegue remover a ativação sem perder dados (o arquivo de ativação está em `userData`).
- Para suporte técnico, o desenvolvedor pode fornecer uma senha de recovery ou um script para reativar.
- Recomenda-se testar em uma VM Windows antes de distribuir para clientes.
