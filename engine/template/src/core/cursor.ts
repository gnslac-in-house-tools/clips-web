import type { MousePoint } from './events';

export function mouseAt(mouse: MousePoint[], tSec: number): { x: number; y: number; down: boolean; visible: boolean } {
  const first = mouse[0];
  if (!first || tSec < first.tSec) return { x: 0, y: 0, down: false, visible: false };
  let lo = 0;
  let hi = mouse.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (mouse[mid]!.tSec <= tSec) lo = mid; else hi = mid - 1; }
  const a = mouse[lo]!;
  const b = mouse[lo + 1];
  if (!b) return { x: a.x, y: a.y, down: a.down, visible: true };
  const p = (tSec - a.tSec) / Math.max(1e-6, b.tSec - a.tSec);
  return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, down: a.down, visible: true };
}
