import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import type { GestureType, GestureResult } from '../types/gesture';

function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = Math.abs((radians * 180) / Math.PI);
  if (degrees > 180) degrees = 360 - degrees;
  return degrees;
}

function countExtendedFingers(landmarks: import('@mediapipe/hands').NormalizedLandmarkList): number {
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

function isFistClosed(landmarks: import('@mediapipe/hands').NormalizedLandmarkList): boolean {
  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];
  for (let i = 0; i < 4; i++) {
    if (landmarks[tips[i]].y < landmarks[pips[i]].y) {
      return false;
    }
  }
  return true;
}

function isArmHorizontal(landmarks: import('@mediapipe/hands').NormalizedLandmarkList): boolean {
  const shoulder = landmarks[11];
  const elbow = landmarks[13];
  const wrist = landmarks[15];
  const angle = calculateAngle(shoulder, elbow, wrist);
  const shoulderWristDy = Math.abs(shoulder.y - wrist.y);
  return angle > 160 && shoulderWristDy < 0.08;
}

function isArmPointingDown(landmarks: import('@mediapipe/hands').NormalizedLandmarkList): boolean {
  const shoulder = landmarks[11];
  const elbow = landmarks[13];
  const wrist = landmarks[15];
  const angle = calculateAngle(shoulder, elbow, wrist);
  return wrist.y > elbow.y && angle > 150;
}

const wristHistory: { y: number; timestamp: number }[] = [];

function isStartFightGesture(landmarks: import('@mediapipe/hands').NormalizedLandmarkList): boolean {
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

function classifyGesture(
  landmarks: import('@mediapipe/hands').NormalizedLandmarkList
): { type: GestureType; confidence: number } | null {
  if (isStartFightGesture(landmarks)) {
    return { type: 'start_fight', confidence: 0.85 };
  }

  if (isArmHorizontal(landmarks)) {
    return { type: 'advantage', confidence: 0.80 };
  }

  if (isArmPointingDown(landmarks)) {
    return { type: 'penalty', confidence: 0.80 };
  }

  const fingers = countExtendedFingers(landmarks);
  switch (fingers) {
    case 2:
      return { type: 'points_2', confidence: 0.90 };
    case 3:
      return { type: 'points_3', confidence: 0.90 };
    case 4:
      return { type: 'points_4', confidence: 0.90 };
    default:
      return null;
  }
}

type GestureCallback = (result: GestureResult) => void;

let handsInstance: Hands | null = null;
let cameraInstance: Camera | null = null;
let currentCallback: GestureCallback | null = null;

export function initializeHandDetection(
  videoElement: HTMLVideoElement,
  onGesture: GestureCallback
): void {
  currentCallback = onGesture;

  handsInstance = new Hands({
    locateFile: (file: string) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    },
  });

  handsInstance.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5,
  });

  handsInstance.onResults((results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

    for (const landmarks of results.multiHandLandmarks) {
      const classified = classifyGesture(landmarks);
      if (classified && currentCallback) {
        currentCallback({
          type: classified.type,
          side: 'A',
          confidence: classified.confidence,
          timestamp: Date.now(),
        });
      }
    }
  });

  cameraInstance = new Camera(videoElement, {
    onFrame: async () => {
      if (handsInstance && videoElement) {
        await handsInstance.send({ image: videoElement });
      }
    },
    width: 640,
    height: 480,
  });

  cameraInstance.start();
  console.log('[GestureDetection] Câmera iniciada');
}

export function stopDetection(): void {
  if (cameraInstance) {
    cameraInstance.stop();
    cameraInstance = null;
  }
  if (handsInstance) {
    handsInstance.close();
    handsInstance = null;
  }
  currentCallback = null;
  wristHistory.length = 0;
  console.log('[GestureDetection] Câmera parada');
}