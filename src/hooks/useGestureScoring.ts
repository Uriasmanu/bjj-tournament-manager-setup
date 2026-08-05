import { useCallback, useEffect, useRef, useState } from 'react';
import { initializeHandDetection, stopDetection } from '../services/gestureDetection';
import type { GestureType, GestureResult } from '../types/gesture';

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

    const gestureKey = `${result.type}_${result.side}`;

    const confirmed = dwellRef.current.check(gestureKey);

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

      setTimeout(() => setLastAction(null), 3000);
    }
  }, []);

  const start = useCallback(() => {
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