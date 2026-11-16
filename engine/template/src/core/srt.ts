import type { CaptionLine } from './captions';

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

function stamp(sec: number): string {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms % 1000, 3)}`;
}

export function toSrt(lines: CaptionLine[]): string {
  return lines.map((l, i) => `${i + 1}\n${stamp(l.startSec)} --> ${stamp(l.endSec)}\n${l.text}\n`).join('\n');
}
