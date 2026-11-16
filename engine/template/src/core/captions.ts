import { toSpoken } from './pronounce';
import type { Alignment } from './timeline';

export interface CaptionLine { text: string; startSec: number; endSec: number }

/** Corta primero en puntuación fuerte/media y luego envuelve por palabras. */
export function splitCaptionLines(text: string, maxChars = 42): string[] {
  const clauses = text.match(/[^,.;:?!]+[,.;:?!]*\s*/g)?.map((c) => c.trim()).filter(Boolean) ?? [text];
  const lines: string[] = [];
  for (const clause of clauses) {
    let cur = '';
    for (const word of clause.split(/\s+/)) {
      const next = cur ? `${cur} ${word}` : word;
      if (next.length > maxChars && cur) { lines.push(cur); cur = word; } else cur = next;
    }
    if (cur) {
      const prev = lines.at(-1);
      // Une cláusulas muy cortas con la anterior si caben.
      if (prev && cur.length < 14 && `${prev} ${cur}`.length <= maxChars) lines[lines.length - 1] = `${prev} ${cur}`;
      else lines.push(cur);
    }
  }
  return lines;
}

export function captionsForSegment(text: string, alignment: Alignment | null, durationSec: number): CaptionLine[] {
  const lines = splitCaptionLines(text);
  if (!alignment || alignment.characters.length === 0) {
    const total = lines.reduce((s, l) => s + l.length, 0);
    let t = 0;
    return lines.map((l) => {
      const d = (l.length / total) * durationSec;
      const line = { text: l, startSec: t, endSec: t + d };
      t += d;
      return line;
    });
  }
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  const last = starts.length - 1;
  const at = (arr: number[], i: number) => arr[Math.min(Math.max(i, 0), last)] ?? 0;
  let offset = 0;
  return lines.map((l) => {
    const spoken = toSpoken(l);
    const line = { text: l, startSec: at(starts, offset), endSec: at(ends, offset + spoken.length - 1) };
    offset += spoken.length + 1; // +1 por el espacio que une las líneas
    return line;
  });
}
