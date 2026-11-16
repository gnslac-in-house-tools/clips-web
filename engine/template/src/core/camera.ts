import type { Rect } from './events';

export interface CameraState { scale: number; cx: number; cy: number }

const W = 1920;
const H = 1080;
export const FULL: CameraState = { scale: 1, cx: W / 2, cy: H / 2 };
const MIN = 1;
const MAX = 2.2;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function stateFor(target: Rect | 'full', zoom?: number): CameraState {
  if (target === 'full') return FULL;
  const scale = clamp(zoom ?? Math.min(W / (target.w * 1.6), H / (target.h * 1.6)), MIN, MAX);
  const hw = W / (2 * scale);
  const hh = H / (2 * scale);
  return { scale, cx: clamp(target.x + target.w / 2, hw, W - hw), cy: clamp(target.y + target.h / 2, hh, H - hh) };
}

const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const lerp = (a: CameraState, b: CameraState, p: number): CameraState => (p >= 1 ? b : {
  // la escala se interpola en log para que el zoom se sienta uniforme
  scale: Math.exp(Math.log(a.scale) + (Math.log(b.scale) - Math.log(a.scale)) * p),
  cx: a.cx + (b.cx - a.cx) * p,
  cy: a.cy + (b.cy - a.cy) * p,
});

export function cameraAt(tSec: number, shots: { atSec: number; state: CameraState }[], moveSec = 1.2): CameraState {
  const sorted = [...shots].sort((a, b) => a.atSec - b.atSec);
  let from = FULL;
  let current = FULL;
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i]!;
    if (s.atSec > tSec) break;
    const next = sorted[i + 1];
    const until = next && next.atSec <= tSec ? next.atSec : tSec;
    current = lerp(from, s.state, ease(Math.min(1, (until - s.atSec) / moveSec)));
    from = current;
  }
  return current;
}

/** Transform CSS para una capa de 1920×1080 con origen en el centro. */
export function cameraTransform(s: CameraState): string {
  return `scale(${s.scale}) translate(${W / 2 - s.cx}px, ${H / 2 - s.cy}px)`;
}

type Shot = { atSec: number; state: CameraState };
const isFull = (s: CameraState) => s.scale === FULL.scale && s.cx === FULL.cx && s.cy === FULL.cy;

/** Cierra la escena en vista completa: así el fundido a la siguiente escena En vivo es al mismo encuadre. */
export function withSettle(shots: Shot[], durationSec: number, settleSec: number): Shot[] {
  const at = durationSec - settleSec;
  const kept = [...shots].sort((a, b) => a.atSec - b.atSec).filter((s) => s.atSec < at);
  if (kept.length === shots.length && (kept.length === 0 || isFull(kept.at(-1)!.state))) return shots;
  return [...kept, { atSec: at, state: FULL }];
}
