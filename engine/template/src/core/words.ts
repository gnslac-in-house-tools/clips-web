import { toSpoken } from './pronounce';
import type { TimedSegment } from './timeline';

/** Momento (segundos de escena) en que la voz empieza a decir `word`. */
export function wordStartSec(seg: TimedSegment, word: string, occurrence = 0): number {
  const spoken = toSpoken(seg.text).toLowerCase();
  const needle = toSpoken(word).toLowerCase();
  let idx = -1;
  for (let i = 0, from = 0; i <= occurrence; i++) {
    idx = spoken.indexOf(needle, from);
    if (idx < 0) break;
    from = idx + needle.length;
  }
  if (idx < 0) throw new Error(`"${word}" no aparece en ${seg.id}: "${seg.text}"`);
  const al = seg.alignment;
  if (al && al.character_start_times_seconds.length > idx) return seg.startSec + al.character_start_times_seconds[idx]!;
  return seg.startSec + (idx / Math.max(1, spoken.length)) * (seg.endSec - seg.startSec);
}
