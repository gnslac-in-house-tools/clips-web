export interface Frame { file: string; ts: number }

const q = (f: string) => `file '${f.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`;

/** Lista para el demuxer concat de ffmpeg: cada frame dura hasta el siguiente, recortado a [t0, tEnd]. */
export function buildConcatList(frames: Frame[], t0: number, tEnd: number): string {
  if (frames.length === 0) throw new Error('El screencast no produjo frames');
  const sorted = [...frames].sort((a, b) => a.ts - b.ts);
  let first = 0;
  for (let i = 0; i < sorted.length; i++) if (sorted[i]!.ts <= t0) first = i;
  const lines: string[] = [];
  let last = sorted[first]!;
  for (let i = first; i < sorted.length && sorted[i]!.ts < tEnd; i++) {
    const start = Math.max(sorted[i]!.ts, t0);
    const next = Math.min(sorted[i + 1]?.ts ?? tEnd, tEnd);
    const dur = next - start;
    if (dur <= 0) continue;
    lines.push(q(sorted[i]!.file), `duration ${dur.toFixed(6)}`);
    last = sorted[i]!;
  }
  lines.push(q(last.file));
  return `${lines.join('\n')}\n`;
}
