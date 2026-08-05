# Documento de Implementação — Pontuação por Gestos via Webcam

## 1. Visão Geral

### 1.1 Conceito — Controle Remoto por Gestos

A câmera funciona como um **controle remoto invisível**. O árbitro simplesmente vira para a câmera, faz o gesto, e após **3 segundos** o ponto é registrado no placar automaticamente.

**Sem painel de câmera. Sem overlay. Sem complexidade na tela.**

```
┌─────────────────────────────────────────────────────────┐
│  PLACAR (como já é)                                     │
│                                                         │
│  [Zerar] [Iniciar] [Tempo: 5min] [Telão] [🎥 Câmera]  │
│                                                         │
│              ⏱ 04:32                                    │
│                                                         │
│  ┌─────────────┐          ┌─────────────┐              │
│  │  Atleta B    │          │  Atleta A    │              │
│  │  Total: 2    │          │  Total: 0    │              │
│  │  [+2] [+3]   │          │  [+2] [+3]   │              │
│  │  [+4]        │          │  [+4]        │              │
│  │  Vant: 0     │          │  Vant: 0     │              │
│  │  Puni: 0     │          │  Puni: 0     │              │
│  └─────────────┘          └─────────────┘              │
│                                                         │
│  (Nada muda na UI — a câmera trabalha nos bastidores)  │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Fluxo do Usuário

```
1. Operador clica em "🎥 Câmera"
   └── Câmera liga (sem nada aparecer na tela)
   └── Botão fica verde "🎥 Câmera On"

2. Árbitro vira para a câmera e faz o gesto (ex: 2 dedos)
   └── Sistema detecta: "2 dedos, mão com braçadeira = Atleta A"
   └── Inicia contagem de 3 segundos

3. Após 3 segundos sem gesto diferente
   └── Ponto é registrado: Atleta A +2
   └── Placar atualiza instantaneamente
   └── Notificação sutil no canto: "+2 Atleta A"

4. Operador clica em "🎥 Câmera" novamente
   └── Câmera desliga
   └── Botão volta ao normal
```

### 1.3 Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Desktop | Electron 30 |
| UI | Mantine 7.17 |
| Visão Computacional | `@mediapipe/hands` + `@mediapipe/camera_utils` |
| Câmera | `react-webcam` ou `getUserMedia` nativo |

---

## 2. O Que Precisa Ser Implementado

### Arquivos Novos (5 arquivos)

| Arquivo | Responsabilidade |
|---|---|
| `src/types/gesture.ts` | Tipos dos gestos e configuração |
| `src/services/gestureDetection.ts` | Serviço MediaPipe — detecta mãos e dedos |
| `src/services/braceletDetection.ts` | Identifica qual mão tem braçadeira |
| `src/hooks/useGestureScoring.ts` | Hook que conecta câmera → detecção → placar |
| `src/components/GestureNotification.tsx` | Notificação sutil de ponto registrado |

### Arquivos Modificados (2 arquivos)

| Arquivo | Mudança |
|---|---|
| `src/pages/PlacarLuta.tsx` | +1 botão, +1 hook, +1 notificação (tudo aditivo) |
| `src/pages/PlacarLutaCasada.tsx` | Mesmas adições |

### Arquivo de Config (1 arquivo)

| Arquivo | Mudança |
|---|---|
| `package.json` | +3 dependências MediaPipe |

---

## 3. Dependências

```bash
npm install @mediapipe/hands @mediapipe/camera_utils
```

| Pacote | Finalidade |
|---|---|
| `@mediapipe/hands` | Detecção dos 21 pontos-chave de cada mão |
| `@mediapipe/camera_utils` | Captura e processamento de frames da câmera |

> `@mediapipe/drawing_utils` **NÃO é necessário** — não vamos desenhar nada na tela.

---

## 4. Detalhamento dos Arquivos

### 4.1 `src/types/gesture.ts`

```typescript
export type GestureType =
  | 'points_2'      // 2 dedos → +2 pontos
  | 'points_3'      // 3 dedos → +3 pontos
  | 'points_4'      // 4 dedos → +4 pontos
  | 'advantage'     // braço horizontal → vantagem
  | 'penalty'       // braço elevado à altura do ombro com punho fechado → punição
  | 'start_fight';  // punho fechado descendo → iniciar/retomar luta

export interface GestureResult {
  type: GestureType;
  side: 'A' | 'B' | null;  // null para start_fight (não precisa de lado)
  confidence: number;       // 0-1
  timestamp: number;
}

export interface GestureConfig {
  enabled: boolean;
  dwellTimeMs: number;      // padrão: 3000ms (3 segundos)
  cameraDeviceId?: string;
}
```

### 4.2 `src/services/gestureDetection.ts`

Serviço que roda nos bastidores. **Sem UI.**

```typescript
// Funções principais:
initializeHandDetection(videoElement) → void
onResults(callback: (result: GestureResult) => void) → void
stopDetection() → void

// Funções auxiliares:
countExtendedFingers(landmarks) → number
whichHandHasBracelet(leftLandmarks, rightLandmarks, frame) → 'left' | 'right'
```

**Regras de Detecção:**

| Gesto | Condição |
|---|---|
| +2 pontos | Mão com 2 dedos estendidos (indicador + médio) |
| +3 pontos | Mão com 3 dedos estendidos (indicador + médio + anelar) |
| +4 pontos | Mão com 4 dedos estendidos (indicador + médio + anelar + mínimo) |
| Vantagem | Braço estendido horizontalmente (ângulo > 160°, diferença Y ombro-pulso < 8%) |
| Punição | Braço elevado à altura do ombro com punho fechado (ângulo > 160°, diferença Y ombro-pulso < 8%, todos os dedos fechados) |
| **Iniciar/Retomar** | **Punho fechado + movimento rápido para baixo (velocidade Y > threshold)** |

**Gesto "Iniciar/Retomar Luta" — detalhes:**
```
Sequência do gesto:
1. Árbitro levanta punho fechado (altura do peito ou acima)
2. Descide o punho abruptamente (movimento de "corte")
3. Sistema detecta: punho fechado + velocidade descendente alta
4. Após 3s de estabilidade → cronômetro inicia/pausa
```

**Mapeamento de lado (braçadeira):**
- Mão com braçadeira detectada = **Atleta A** (lado azul)
- Mão sem braçadeira = **Atleta B** (lado branco)

### 4.3 `src/services/braceletDetection.ts`

```typescript
// Detecta cor da braçadeira na região do pulso
detectBracelet(landmarks, videoFrame) → 'left' | 'right' | null

// Calibração manual (caso detecção automática falhe)
setBraceletSide(side: 'left' | 'right') → void
```

**Estratégia:** Analisa a região ao redor do pulso (landmarks 0 e 5) em espaço HSV. A braçadeira do árbitro CBJJ é tipicamente verde/amarela — saturação e luminosidade diferentes da pele.

### 4.4 `src/hooks/useGestureScoring.ts`

Hook que conecta tudo. **O coração da integração.**

```typescript
function useGestureScoring(config: {
  enabled: boolean;
  dwellTimeMs: number;
  onScoreUpdate: (side: 'A' | 'B', type: GestureType) => void;
  onTimerControl: (action: 'start' | 'pause') => void;
}) {
  return {
    isDetecting: boolean,      // câmera está ativa?
    lastAction: string | null, // última ação registrada (para notificação)
    start: () => void,         // ligar câmera
    stop: () => void,          // desligar câmera
  };
}
```

**Lógica interna do hook:**

```
Frame da câmera
    │
    ▼
MediaPipe detecta mãos
    │
    ▼
Identifica braçadeira → lado (A ou B)
    │
    ▼
Conta dedos ou analisa braço → tipo de gesto
    │
    ├── É "start_fight"?
    │       │
    │       ├── SIM → Gesto estável por 3s? → SIM → onTimerControl('start')
    │       │                                    → NÃO → aguardar
    │       └── NÃO → Continuar para outros gestos
    │
    ▼
Gesto de pontuação estável por 3 segundos?
    │
    ├── NÃO → Reiniciar contagem
    │
    └── SIM → Chamar onScoreUpdate(lado, gesto)
              │
              ▼
         Placar é atualizado
```

### 4.5 `src/components/GestureNotification.tsx`

Notificação sutil que aparece por 2-3 segundos no canto da tela quando um gesto é registrado.

```tsx
// Exemplo de exibição:
// "+2 pontos → Atleta A" (toast verde)
// "Vantagem → Atleta B" (toast azul)
// "Punição → Atleta A" (toast vermelho)
// "Luta Iniciada" (toast azul, sem lado)

// Implementado com Mantine Notifications:
import { showNotification } from '@mantine/notifications';

function notifyGesture(side: 'A' | 'B' | null, type: GestureType) {
  const labels: Record<GestureType, string> = {
    points_2: '+2 pontos',
    points_3: '+3 pontos',
    points_4: '+4 pontos',
    advantage: 'Vantagem',
    penalty: 'Punição',
    start_fight: 'Luta Iniciada',
  };

  showNotification({
    title: labels[type],
    message: side ? `→ Atleta ${side}` : 'Cronômetro iniciado',
    color: type === 'penalty' ? 'red' : type === 'start_fight' ? 'blue' : 'green',
    autoClose: 2500,
  });
}
```

---

## 5. Modificações nos Arquivos Existentes

### 5.1 `src/pages/PlacarLuta.tsx`

> **Tudo que existe continua igual.** São apenas adições pontuais.

**Adicionar imports:**
```typescript
import { IconCamera } from '@tabler/icons-react';  // adicionar ao import existente
import { useGestureScoring } from '../hooks/useGestureScoring';
import { showNotification } from '@mantine/notifications';
```

**Adicionar states (após os existentes):**
```typescript
const [gestureEnabled, setGestureEnabled] = useState(false);
```

**Adicionar callback de pontuação (após handleZerar):**
```typescript
const handleGestureScore = useCallback((side: 'A' | 'B', type: GestureType) => {
  if (bloqueado) return;
  const setter = side === 'A' ? setPlacarA : setPlacarB;
  setter(prev => {
    const novo = { ...prev };
    switch (type) {
      case 'points_2': novo.pontos2 += 1; break;
      case 'points_3': novo.pontos3 += 1; break;
      case 'points_4': novo.pontos4 += 1; break;
      case 'advantage': novo.vantagens += 1; break;
      case 'penalty': novo.punicoes = Math.min(4, novo.punicoes + 1); break;
    }
    novo.total = novo.pontos2 * 2 + novo.pontos3 * 3 + novo.pontos4 * 4;
    return novo;
  });
  // Notificação sutil
  const labels = { points_2: '+2', points_3: '+3', points_4: '+4', advantage: 'Vantagem', penalty: 'Punição' };
  showNotification({
    title: labels[type],
    message: `→ Atleta ${side}`,
    color: type === 'penalty' ? 'red' : 'green',
    autoClose: 2500,
  });
}, [bloqueado]);

// Callback para controle do cronômetro por gesto
const handleGestureTimer = useCallback((action: 'start' | 'pause') => {
  if (bloqueado) return;
  if (action === 'start') {
    if (!rodando && horarioInicioRef.current === null) {
      horarioInicioRef.current = dayjs().format('DD/MM/YYYY HH:mm:ss');
    }
    setRodando(true);
  } else {
    setRodando(false);
  }
  showNotification({
    title: action === 'start' ? 'Luta Iniciada' : 'Luta Pausada',
    message: 'Cronômetro ajustado por gesto',
    color: 'blue',
    autoClose: 2500,
  });
}, [bloqueado, rodando]);
```

**Adicionar hook (após os callbacks):**
```typescript
const gesture = useGestureScoring({
  enabled: gestureEnabled,
  dwellTimeMs: 3000,
  onScoreUpdate: handleGestureScore,
  onTimerControl: handleGestureTimer,
});
```

**Adicionar 1 botão na barra de ferramentas (ao lado do Telão):**
```tsx
<Button
  size="xs"
  variant={gestureEnabled ? 'filled' : 'light'}
  color={gestureEnabled ? 'green' : 'dark'}
  leftSection={<IconCamera size={14} />}
  onClick={() => setGestureEnabled(g => !g)}
  disabled={bloqueado}
>
  {gestureEnabled ? 'Câmera On' : 'Câmera'}
</Button>
```

**Pronto.** Nada mais muda no PlacarLuta.tsx.

### 5.2 `src/pages/PlacarLutaCasada.tsx`

Mesmas adições do PlacarLuta.tsx — imports, states, callback, hook, botão.

---

## 6. Algoritmos de Detecção

### 6.1 Contagem de Dedos

```typescript
function countExtendedFingers(landmarks: Landmark[]): number {
  const tips = [8, 12, 16, 20];   // pontas dos dedos
  const pips = [6, 10, 14, 18];   // articulações PIP

  let count = 0;
  for (let i = 0; i < 4; i++) {
    // Ponta do dedo acima da articulação = dedo estendido
    if (landmarks[tips[i]].y < landmarks[pips[i]].y) {
      count++;
    }
  }
  return count;
}
```

### 6.2 Detecção de Braço Horizontal (Vantagem)

```typescript
function isArmHorizontal(shoulder: Landmark, elbow: Landmark, wrist: Landmark): boolean {
  const angle = calculateAngle(shoulder, elbow, wrist);
  const shoulderWristDy = Math.abs(shoulder.y - wrist.y);
  return angle > 160 && shoulderWristDy < 0.08;
}

function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) -
                  Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = Math.abs(radians * 180 / Math.PI);
  if (degrees > 180) degrees = 360 - degrees;
  return degrees;
}
```

### 6.3 Detecção de Braço Elevado à Altura do Ombro com Punho Fechado (Punição)

```typescript
function isArmRaisedToShoulderWithFist(landmarks: Landmark[]): boolean {
  const shoulder = landmarks[11];
  const elbow = landmarks[13];
  const wrist = landmarks[15];

  // 1. Braço estendido horizontalmente (mesmo critério de vantagem)
  const angle = calculateAngle(shoulder, elbow, wrist);
  const shoulderWristDy = Math.abs(shoulder.y - wrist.y);
  const armHorizontal = angle > 160 && shoulderWristDy < 0.08;

  // 2. Punho fechado (todos os dedos curvados)
  const fistClosed = isFistClosed(landmarks);

  return armHorizontal && fistClosed;
}
```

### 6.4 Detecção de Punho Fechado Descendo (Iniciar/Retomar Luta)

```typescript
// Histórico de posições do pulso para calcular velocidade
const wristHistory: { y: number; timestamp: number }[] = [];

function isStartFightGesture(landmarks: Landmark[], timestamp: number): boolean {
  const wrist = landmarks[0]; // pulso
  const fingertips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
  const fingerPips = [landmarks[6], landmarks[10], landmarks[14], landmarks[18]];

  // 1. Verificar se todos os dedos estão fechados (punho)
  let allClosed = true;
  for (let i = 0; i < 4; i++) {
    if (fingertips[i].y < fingerPips[i].y) {
      allClosed = false; // dedo estendido = não é punho
      break;
    }
  }
  if (!allClosed) return false;

  // 2. Calcular velocidade descendente do pulso
  wristHistory.push({ y: wrist.y, timestamp });
  if (wristHistory.length > 10) wristHistory.shift(); // manter últimos 10 frames

  if (wristHistory.length < 5) return false;

  const recent = wristHistory.slice(-5);
  const deltaY = recent[recent.length - 1].y - recent[0].y;
  const deltaTime = recent[recent.length - 1].timestamp - recent[0].timestamp;

  if (deltaTime === 0) return false;

  const velocity = deltaY / deltaTime; // positivo = movendo para baixo

  // 3. Velocidade descendente alta (> 0.001 por ms = movimento rápido)
  return velocity > 0.001;
}
```

---

## 7. Dwell Time — 3 Segundos

Todos os gestos (pontuação, vantagem, punição e iniciar luta) devem ser mantidos estáveis por **3 segundos** antes de serem confirmados.

```
Tempo:  0s -------- 1s -------- 2s -------- 3s
Gesto:  [2 dedos]   [2 dedos]   [2 dedos]   [2 dedos]  → CONFIRMADO (+2 pts)
        [2 dedos]   [3 dedos]   [2 dedos]   ...        → REINICIADO
        [punho↓]    [punho↓]    [punho↓]    [punho↓]   → CONFIRMADO (Iniciar)
```

**Implementação:**

```typescript
class DwellTimer {
  private startTime = 0;
  private lastGesture: string | null = null;
  private dwellMs: number;

  check(gesture: string): boolean {
    const now = Date.now();

    if (gesture !== this.lastGesture) {
      this.startTime = now;
      this.lastGesture = gesture;
      return false;
    }

    if (now - this.startTime >= this.dwellMs) {
      this.reset();
      return true;  // CONFIRMADO
    }

    return false;  // Ainda aguardando
  }

  reset() {
    this.startTime = 0;
    this.lastGesture = null;
  }
}
```

---

## 8. Notificações

Quando um gesto é confirmado, uma notificação sutil aparece:

```
┌─────────────────────────┐
│  +2                     │
│  → Atleta A             │
└─────────────────────────┘
```

- Duração: 2.5 segundos
- Posição: canto superior direito
- Cor: verde (pontos/vantagem), vermelho (punição)
- Implementada com `@mantine/notifications` (já está no projeto)

---

## 9. Modificações no `package.json`

```json
{
  "dependencies": {
    "@mediapipe/hands": "^0.4.1675469240",
    "@mediapipe/camera_utils": "^0.3.1675466862"
  }
}
```

> Não precisa de `@mediapipe/drawing_utils` — não vamos desenhar nada.

---

## 10. Estrutura de Arquivos Final

```
src/
├── types/
│   └── gesture.ts                     ← NOVO (35 linhas)
├── services/
│   ├── gestureDetection.ts            ← NOVO (~180 linhas)
│   └── braceletDetection.ts           ← NOVO (~50 linhas)
├── hooks/
│   └── useGestureScoring.ts           ← NOVO (~90 linhas)
├── components/
│   └── GestureNotification.tsx        ← NOVO (~35 linhas)
├── pages/
│   ├── PlacarLuta.tsx                 ← MODIFICADO (+45 linhas)
│   └── PlacarLutaCasada.tsx           ← MODIFICADO (+45 linhas)
└── ...
```

**Total de código novo: ~480 linhas**

---

## 11. Ordem de Implementação

### Fase 1 — Infraestrutura (1-2 dias)
1. Instalar `@mediapipe/hands` e `@mediapipe/camera_utils`
2. Criar `src/types/gesture.ts`
3. Criar `src/services/gestureDetection.ts` com detecção básica de mãos
4. Testar: câmera liga e MediaPipe detecta mãos no console

### Fase 2 — Detecção de Gestos (2-3 dias)
1. Implementar `countExtendedFingers()`
2. Implementar detecção de braço horizontal (vantagem)
3. Implementar detecção de braço elevado à altura do ombro com punho fechado (punição)
4. Implementar detecção de punho fechado descendente (iniciar luta)
5. Criar `src/services/braceletDetection.ts`
6. Testar: cada gesto é logado corretamente no console

### Fase 3 — Hook e Integração (1-2 dias)
1. Criar `src/hooks/useGestureScoring.ts` com dwell time de 3s e callback de timer
2. Criar `src/components/GestureNotification.tsx`
3. Modificar `PlacarLuta.tsx` — adicionar botão, hook, callback de pontuação e callback de timer
4. Modificar `PlacarLutaCasada.tsx` — mesmas adições
5. **TESTE:** Árbitro faz gesto → 3s → ponto aparece no placar
6. **TESTE:** Árbitro faz gesto de iniciar → 3s → cronômetro começa

### Fase 4 — Refinamento (1-2 dias)
1. Ajustar sensibilidade de detecção
2. Testar em diferentes iluminações
3. Calibração da braçadeira
4. Otimizar performance

**Estimativa total: 5-9 dias de desenvolvimento**

---

## 12. Requisitos Não Funcionais

| RNF | Estratégia |
|---|---|
| FPS mínimo | MediaPipe via WASM/WebGL; resolução 640x480 |
| Offline | Tudo local; models em node_modules |
| Compatibilidade | Chrome 90+ (WebGL + WASM) |
| Iluminação | Calibração manual da braçadeira |

---

## 13. Riscos

| Risco | Mitigação |
|---|---|
| Falso positivo | Dwell time de 3 segundos filtra gestos acidentais |
| Braçadeira não detectada | Botão de calibração manual (força lado A/B) |
| FPS baixo | Resolução configurável; desligar se necessário |
| Árbitro fora de posição | Indicador no console quando mãos são detectadas |

---

## 14. Compatibilidade

| Aspecto | Impacto |
|---|---|
| PlacarLuta.tsx | +45 linhas aditivas — callback de pontuação + callback de timer + hook |
| PlacarLutaCasada.tsx | +45 linhas aditivas — idêntico |
| PlacarExibicao.tsx | Nenhum impacto (telão) |
| Botões +/− | Continuam funcionando normalmente |
| Botões de cronômetro | Continuam funcionando — gesto é alternativo, não substitui |
| Salvamento | Interface `PlacarLuta` não muda |
| Performance | Zero impacto quando câmera desligada |
