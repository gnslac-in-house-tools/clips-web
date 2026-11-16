import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { FUNDIDO_ESTATICO, esEstatico } from '../core/movimiento';
import type { SceneTimeline } from '../core/timeline';
import { wordStartSec } from '../core/words';
import { tokens } from '../theme/tokens';

/** Tiempo de una palabra de la voz; si el guion cambió y ya no está, cae al inicio del segmento (nunca lanza en render). */
export function useWordTime(timeline: SceneTimeline) {
  return (segment: string, word: string, offset = 0): number => {
    const seg = timeline.segments.find((s) => s.id === segment);
    if (!seg) return 0;
    try { return wordStartSec(seg, word) + offset; } catch { return seg.startSec + offset; }
  };
}

export function useAppear(atSec: number, config: { damping: number; stiffness: number; mass: number } = tokens.spring.gentle): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (esEstatico()) return interpolate(frame / fps, [atSec, atSec + FUNDIDO_ESTATICO], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return spring({ frame: frame - atSec * fps, fps, config });
}
