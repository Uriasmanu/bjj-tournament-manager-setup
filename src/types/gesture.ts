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
