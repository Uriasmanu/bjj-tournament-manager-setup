# Fase 1 — Implementação: Detecção de Gestos via Webcam

## Objetivo

Entregar uma versão funcional onde:
1. Um botão "🎥 Câmera" liga/desliga a webcam no placar
2. A câmera roda nos bastidores (sem preview visual)
3. O MediaPipe detecta mãos e identifica gestos (dedos, braço)
4. Um log aparece no console do navegador com o gesto detectado
5. Uma notificação toast aparece na tela quando o gesto é confirmado (3s)

**O que NÃO está nesta fase:** detecção de braçadeira (lado A/B será fixo por enquanto).

---

## Passo 1 — Instalar Dependências

```bash
npm install @mediapipe/hands @mediapipe/camera_utils
```

Verificar que foram instaladas:
```bash
npm ls @mediapipe/hands @mediapipe/camera_utils
```

---

## Passo 2 — Criar `src/types/gesture.ts`

Criar o arquivo `src/types/gesture.ts` com o seguinte conteúdo:

```typescript
export type GestureType =
  | 'points_2'
  | 'points_3'
  | 'points_4'
  | 'advantage'
  | 'penalty'
  | 'start_fight';

export interface GestureResult {
  type: GestureType;
  side: 'A' | 'B';
  confidence: number;
  timestamp: number;
}

export interface GestureConfig {
  enabled: boolean;
  dwellTimeMs: number;
}
```

---

## Passo 3 — Criar `src/services/gestureDetection.ts`

Criar o arquivo `src/services/gestureDetection.ts` com todo o conteúdo abaixo:

```typescript
import { Hands, Results, NormalizedLandmarkList } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import type { GestureType, GestureResult } from '../types/gesture';

// ==================== UTILITÁRIOS DE GEOMETRIA ====================

function calculateAngle(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = Math.abs(radians * 180 / Math.PI);
  if (degrees > 180) degrees = 360 - degrees;
  return degrees;
}

// ==================== DETECÇÃO DE DEDOS ====================

function countExtendedFingers(landmarks: NormalizedLandmarkList): number {
  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];
  let count = 0;
  for (let i = 0; i < 4; i++) {
    if (landmarks[tips[i]].y < landmarks[pips[i]].y) {
      count++;
    }
  }
  return count;
}

function isFistClosed(landmarks: NormalizedLandmarkList): boolean {
  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];
  for (let i = 0; i < 4; i++) {
    if (landmarks[tips[i]].y < landmarks[pips[i]].y) {
      return false;
    }
  }
  return true;
}

// ==================== DETECÇÃO DE BRAÇO ====================

function isArmHorizontal(landmarks: NormalizedLandmarkList): boolean {
  const shoulder = landmarks[11]; // ombro esquerdo
  const elbow = landmarks[13];    // cotovelo
  const wrist = landmarks[15];    // pulso
  const angle = calculateAngle(shoulder, elbow, wrist);
  const shoulderWristDy = Math.abs(shoulder.y - wrist.y);
  return angle > 160 && shoulderWristDy < 0.08;
}

function isArmPointingDown(landmarks: NormalizedLandmarkList): boolean {
  const shoulder = landmarks[11];
  const elbow = landmarks[13];
  const wrist = landmarks[15];
  const angle = calculateAngle(shoulder, elbow, wrist);
  return wrist.y > elbow.y && angle > 150;
}

// ==================== HISTÓRICO PARA START FIGHT ====================

const wristHistory: { y: number; timestamp: number }[] = [];

function isStartFightGesture(landmarks: NormalizedLandmarkList): boolean {
  const wrist = landmarks[0];
  if (!isFistClosed(landmarks)) return false;

  const now = Date.now();
  wristHistory.push({ y: wrist.y, timestamp: now });
  if (wristHistory.length > 10) wristHistory.shift();
  if (wristHistory.length < 5) return false;

  const recent = wristHistory.slice(-5);
  const deltaY = recent[recent.length - 1].y - recent[0].y;
  const deltaTime = recent[recent.length - 1].timestamp - recent[0].timestamp;
  if (deltaTime === 0) return false;

  const velocity = deltaY / deltaTime;
  return velocity > 0.001;
}

// ==================== CLASSIFICAÇÃO DO GESTO ====================

function classifyGesture(landmarks: NormalizedLandmarkList): { type: GestureType; confidence: number } | null {
  // 1. Punho fechado descendo → iniciar luta
  if (isStartFightGesture(landmarks)) {
    return { type: 'start_fight', confidence: 0.85 };
  }

  // 2. Braço horizontal → vantagem
  if (isArmHorizontal(landmarks)) {
    return { type: 'advantage', confidence: 0.80 };
  }

  // 3. Braço para baixo → punição
  if (isArmPointingDown(landmarks)) {
    return { type: 'penalty', confidence: 0.80 };
  }

  // 4. Dedos estendidos → pontuação
  const fingers = countExtendedFingers(landmarks);
  switch (fingers) {
    case 2: return { type: 'points_2', confidence: 0.90 };
    case 3: return { type: 'points_3', confidence: 0.90 };
    case 4: return { type: 'points_4', confidence: 0.90 };
    default: return null;
  }
}

// ==================== SERVIÇO PRINCIPAL ====================

type GestureCallback = (result: GestureResult) => void;

let hands: Hands | null = null;
let camera: Camera | null = null;
let currentCallback: GestureCallback | null = null;

export function initializeHandDetection(
  videoElement: HTMLVideoElement,
  onGesture: GestureCallback
): void {
  currentCallback = onGesture;

  hands = new Hands({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    },
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5,
  });

  hands.onResults((results: Results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

    // Para cada mão detectada, classificar o gesto
    for (const landmarks of results.multiHandLandmarks) {
      const classified = classifyGesture(landmarks);
      if (classified && currentCallback) {
        currentCallback({
          type: classified.type,
          side: 'A', // FASE 1: fixo como 'A' — braçadeira será implementada depois
          confidence: classified.confidence,
          timestamp: Date.now(),
        });
      }
    }
  });

  camera = new Camera(videoElement, {
    onFrame: async () => {
      if (hands && videoElement) {
        await hands.send({ image: videoElement });
      }
    },
    width: 640,
    height: 480,
  });

  camera.start();
  console.log('[GestureDetection] Câmera iniciada');
}

export function stopDetection(): void {
  if (camera) {
    camera.stop();
    camera = null;
  }
  if (hands) {
    hands.close();
    hands = null;
  }
  currentCallback = null;
  wristHistory.length = 0;
  console.log('[GestureDetection] Câmera parada');
}
```

---

## Passo 4 — Criar `src/hooks/useGestureScoring.ts`

Criar o arquivo `src/hooks/useGestureScoring.ts`:

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import { initializeHandDetection, stopDetection } from '../services/gestureDetection';
import type { GestureType, GestureResult } from '../types/gesture';

// ==================== DWELL TIMER ====================

class DwellTimer {
  private startTime = 0;
  private lastGesture: string | null = null;
  private dwellMs: number;

  constructor(dwellMs: number) {
    this.dwellMs = dwellMs;
  }

  check(gestureKey: string): boolean {
    const now = Date.now();

    if (gestureKey !== this.lastGesture) {
      this.startTime = now;
      this.lastGesture = gestureKey;
      return false;
    }

    if (now - this.startTime >= this.dwellMs) {
      this.reset();
      return true;
    }

    return false;
  }

  reset() {
    this.startTime = 0;
    this.lastGesture = null;
  }

  getProgress(): number {
    if (!this.lastGesture) return 0;
    const elapsed = Date.now() - this.startTime;
    return Math.min(1, elapsed / this.dwellMs);
  }
}

// ==================== HOOK ====================

interface UseGestureScoringConfig {
  enabled: boolean;
  dwellTimeMs: number;
  onScoreUpdate: (side: 'A' | 'B', type: GestureType) => void;
  onTimerControl: (action: 'start' | 'pause') => void;
}

export function useGestureScoring(config: UseGestureScoringConfig) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dwellRef = useRef(new DwellTimer(config.dwellTimeMs));
  const configRef = useRef(config);
  configRef.current = config;

  const handleGesture = useCallback((result: GestureResult) => {
    const cfg = configRef.current;

    // Criar chave do gesto (tipo + lado)
    const gestureKey = `${result.type}_${result.side}`;

    // Verificar dwell time
    const confirmed = dwellRef.current.check(gestureKey);

    // Log no console para debug
    const progress = dwellRef.current.getProgress();
    console.log(
      `[Gesture] ${result.type} → Atleta ${result.side} | ` +
      `Confiança: ${(result.confidence * 100).toFixed(0)}% | ` +
      `Dwell: ${(progress * 100).toFixed(0)}%` +
      (confirmed ? ' ✅ CONFIRMADO' : ' ⏳ aguardando...')
    );

    if (confirmed) {
      setLastAction(`${result.type} → ${result.side}`);

      if (result.type === 'start_fight') {
        cfg.onTimerControl('start');
      } else {
        cfg.onScoreUpdate(result.side, result.type);
      }

      // Limpar notificação após 3s
      setTimeout(() => setLastAction(null), 3000);
    }
  }, []);

  const start = useCallback(() => {
    // Criar elemento de vídeo oculto
    if (!videoRef.current) {
      const video = document.createElement('video');
      video.style.display = 'none';
      video.setAttribute('playsinline', 'true');
      document.body.appendChild(video);
      videoRef.current = video;
    }

    initializeHandDetection(videoRef.current, handleGesture);
    setIsDetecting(true);
    console.log('[useGestureScoring] Detecção iniciada');
  }, [handleGesture]);

  const stop = useCallback(() => {
    stopDetection();
    if (videoRef.current) {
      videoRef.current.remove();
      videoRef.current = null;
    }
    setIsDetecting(false);
    dwellRef.current.reset();
    console.log('[useGestureScoring] Detecção parada');
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isDetecting,
    lastAction,
    start,
    stop,
  };
}
```

---

## Passo 5 — Modificar `src/pages/PlacarLuta.tsx`

### 5.1 — Adicionar imports (linhas 19-27)

No bloco de imports do `@tabler/icons-react`, adicionar `IconCamera`:

```typescript
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconReload,
  IconFlag,
  IconAlertTriangle,
  IconArrowBack,
  IconDeviceDesktop,
  IconCamera,           // ← ADICIONAR
} from '@tabler/icons-react';
```

Após o import de `useCallback` (linha 29), adicionar:

```typescript
import { useGestureScoring } from '../hooks/useGestureScoring';
import { showNotification } from '@mantine/notifications';
import type { GestureType } from '../types/gesture';
```

### 5.2 — Adicionar states (após linha 339, após `const [telaoAberto, setTelaoAberto] = useState(false);`)

```typescript
const [gestureEnabled, setGestureEnabled] = useState(false);
```

### 5.3 — Adicionar callback de pontuação (após a função `handleZerar`, linha ~346)

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
  const labels: Record<string, string> = { points_2: '+2', points_3: '+3', points_4: '+4', advantage: 'Vantagem', penalty: 'Punição' };
  showNotification({
    title: labels[type] ?? type,
    message: `→ Atleta ${side}`,
    color: type === 'penalty' ? 'red' : 'green',
    autoClose: 2500,
  });
}, [bloqueado]);

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

### 5.4 — Adicionar hook (após os callbacks)

```typescript
const gesture = useGestureScoring({
  enabled: gestureEnabled,
  dwellTimeMs: 3000,
  onScoreUpdate: handleGestureScore,
  onTimerControl: handleGestureTimer,
});

// Efeito para ligar/desligar câmera ao mudar gestureEnabled
useEffect(() => {
  if (gestureEnabled) {
    gesture.start();
  } else {
    gesture.stop();
  }
}, [gestureEnabled, gesture.start, gesture.stop]);
```

### 5.5 — Adicionar botão na barra de ferramentas (após o botão Telão, linha ~796)

Localizar o bloco `</Group>` que fecha o grupo de botões inferiores (linha 759-797) e adicionar o botão antes do fechamento:

```tsx
<Group justify="center" gap="xs" style={{ flexShrink: 0 }}>
  <Button
    size="xs"
    color="blue"
    leftSection={<IconFlag size={14} />}
    onClick={handleAbrirFinalizar}
    disabled={bloqueado}
  >
    Finalizar
  </Button>
  <Button
    size="xs"
    variant="default"
    leftSection={<IconArrowBack size={14} />}
    onClick={() => navigate(`/admin/placar/chave/${areaId}/${chaveId}`)}
  >
    Voltar
  </Button>
  {/* BOTÃO NOVO — Câmera */}
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
  {telaoAberto ? (
    // ... resto do código do telão inalterado
```

---

## Passo 6 — Testar

1. Rodar o projeto:
   ```bash
   npm run dev
   ```

2. Abrir o placar de uma luta:
   ```
   /admin/placar/luta/:areaId/:chaveId/:lutaId
   ```

3. Clicar no botão "🎥 Câmera"
   - Botão fica verde "Câmera On"
   - Console do navegador mostra: `[GestureDetection] Câmera iniciada`

4. Posicionar a mão na frente da câmera
   - Console mostra logs como: `[Gesture] points_2 → Atleta A | Confiança: 90% | Dwell: 45% ⏳ aguardando...`

5. Manter o gesto por 3 segundos
   - Console mostra: `[Gesture] points_2 → Atleta A | Confiança: 90% | Dwell: 100% ✅ CONFIRMADO`
   - Notificação toast aparece no canto: "+2 → Atleta A"
   - Placar é atualizado

6. Testar outros gestos:
   - 3 dedos → +3 pontos
   - 4 dedos → +4 pontos
   - Braço horizontal → Vantagem
   - Braço para baixo → Punição
   - Punho fechado descendo → Luta Iniciada

7. Clicar "Câmera On" novamente → câmera desliga

---

## Checklist de Validação

| # | Critério | OK? |
|---|---|---|
| 1 | Botão "Câmera" aparece no placar | ☐ |
| 2 | Clicar liga/desliga a câmera | ☐ |
| 3 | Console mostra logs de detecção em tempo real | ☐ |
| 4 | Gestos de 2, 3 e 4 dedos são reconhecidos | ☐ |
| 5 | Braço horizontal é reconhecido como vantagem | ☐ |
| 6 | Braço para baixo é reconhecido como punição | ☐ |
| 7 | Punho fechado descendente é reconhecido como iniciar | ☐ |
| 8 | Dwell time de 3s funciona (gesto precisa estar estável) | ☐ |
| 9 | Notificação toast aparece ao confirmar gesto | ☐ |
| 10 | Placar é atualizado com o ponto correto | ☐ |
| 11 | Botões manuais continuam funcionando | ☐ |
| 12 | Desligar câmera não perde dados do placar | ☐ |

---

## Arquivos Criados/Modificados

| Arquivo | Ação | Linhas |
|---|---|---|
| `src/types/gesture.ts` | CRIADO | ~20 |
| `src/services/gestureDetection.ts` | CRIADO | ~140 |
| `src/hooks/useGestureScoring.ts` | CRIADO | ~110 |
| `src/pages/PlacarLuta.tsx` | MODIFICADO | +50 |
| `package.json` | MODIFICADO | +2 deps |

**Total: ~320 linhas novas**

---

## O que NÃO está nesta fase (para a Próxima)

- Detecção de braçadeira (lado A/B será fixo como 'A')
- Calibração de cor/iluminação
- Modal de configurações
- Integração com `PlacarLutaCasada.tsx`
- Otimização de performance
