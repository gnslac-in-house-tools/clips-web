export interface Point { x: number; y: number }

const ease = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);

/** Trayectoria humana: arco suave (bezier cuadrática) con aceleración in-out. */
export function humanPath(from: Point, to: Point, durSec: number, fps = 60): { t: number; x: number; y: number }[] {
  const n = Math.max(1, Math.round(durSec * fps));
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(80, len * 0.12);
  const c = { x: (from.x + to.x) / 2 - (dy / len) * bend, y: (from.y + to.y) / 2 + (dx / len) * bend };
  const out: { t: number; x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const u = ease(i / n);
    const a = (1 - u) ** 2, b = 2 * (1 - u) * u, d = u ** 2;
    out.push({ t: (i / n) * durSec, x: a * from.x + b * c.x + d * to.x, y: a * from.y + b * c.y + d * to.y });
  }
  out[n] = { t: durSec, x: to.x, y: to.y };
  return out;
}
