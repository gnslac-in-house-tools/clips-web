export interface Rect { x: number; y: number; w: number; h: number }

export type EventKind = 'click' | 'drag' | 'hover' | 'type' | 'key' | 'mark';

export interface RecEvent {
  id: string;
  kind: EventKind;
  /** Segundos desde el inicio de la escena. */
  tSec: number;
  endSec: number;
  /** Caja del elemento en px CSS del viewport de la app (1920×1080). */
  rect?: Rect;
  /** Destino de un drag. */
  toRect?: Rect;
}

export interface MousePoint { tSec: number; x: number; y: number; down: boolean }

export interface Recording {
  sceneId: string;
  /** Ruta relativa a public/. */
  video: string;
  durationSec: number;
  viewport: { w: number; h: number };
  events: RecEvent[];
  mouse: MousePoint[];
  maxLagSec: number;
}

export function findEvent(rec: Recording | null, id: string): RecEvent | null {
  return rec?.events.find((e) => e.id === id) ?? null;
}
