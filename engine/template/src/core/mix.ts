import type { SceneTimeline } from './timeline';

export interface Interval { startSec: number; endSec: number }

export function voiceIntervals(timelines: SceneTimeline[], offsets: number[]): Interval[] {
  return timelines.flatMap((tl, i) => tl.segments.map((s) => ({ startSec: s.startSec + offsets[i]!, endSec: s.endSec + offsets[i]! })));
}

export function musicVolume(
  tSec: number,
  voice: Interval[],
  o: { totalSec: number; base?: number; duck?: number; rampSec?: number; fadeInSec?: number; fadeOutSec?: number },
): number {
  const base = o.base ?? 0.2, duck = o.duck ?? 0.06, ramp = o.rampSec ?? 0.5;
  let k = 1;
  for (const v of voice) {
    const d = tSec < v.startSec ? v.startSec - tSec : tSec > v.endSec ? tSec - v.endSec : 0;
    k = Math.min(k, Math.min(1, d / ramp));
  }
  const fadeIn = Math.min(1, tSec / (o.fadeInSec ?? 2));
  const fadeOut = Math.min(1, Math.max(0, (o.totalSec - tSec) / (o.fadeOutSec ?? 3)));
  return (duck + (base - duck) * k) * fadeIn * fadeOut;
}

/** Cola que se deja sonar después del cuerpo de la música (sobre los logos, con el fade out final). */
export const MUSIC_TAIL_SEC = 3.5;

/**
 * Fin del cuerpo de la pista a partir de su nivel por segundo (dB): el último segundo que sigue a menos de
 * 6 dB de la mediana. Lo que viene después es el acorde final y su cola: con 12 dB, un decrescendo largo
 * contaba como cuerpo y el acorde caía antes del cierre.
 */
export function bodyEndSec(levelsDb: number[]): number {
  const sorted = [...levelsDb].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;
  let last = -1;
  levelsDb.forEach((l, i) => { if (l > median - 6) last = i; });
  return last + 1;
}

/** Segundos a recortar del inicio de la música para que el fin de su cuerpo caiga MUSIC_TAIL_SEC antes del final del video. */
export function musicTrimSec(bodyEnd: number, totalSec: number): number {
  const trim = bodyEnd - (totalSec - MUSIC_TAIL_SEC);
  if (trim < 0) {
    throw new Error(`La música termina en ${bodyEnd.toFixed(1)} s y el video dura ${totalSec.toFixed(1)} s: regenera la cama con npm run music.`);
  }
  return trim;
}
