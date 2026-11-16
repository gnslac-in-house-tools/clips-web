import { Audio, getStaticFiles, staticFile, useVideoConfig } from 'remotion';
import { musicTrimSec, musicVolume, type Interval } from '../core/mix';
import { MUSIC } from '../video.config';

const FILE = 'generated/music/bed.mp3';

/**
 * Cama musical con ducking bajo la voz. Se alinea por el final: se recorta el inicio de la pista
 * para que el fin de su cuerpo caiga justo antes del final del video (`bodyEnd` sale de bed.json).
 */
export const MusicBed: React.FC<{ voice: Interval[]; totalSec: number; bodyEnd: number | null }> = ({ voice, totalSec, bodyEnd }) => {
  const { fps } = useVideoConfig();
  if (!getStaticFiles().some((f) => f.name === FILE) || bodyEnd === null) return null;
  const trim = Math.round(musicTrimSec(bodyEnd, totalSec) * fps);
  return <Audio src={staticFile(FILE)} trimBefore={trim} volume={(f) => musicVolume(f / fps, voice, { totalSec, base: MUSIC.base, duck: MUSIC.duck })} />;
};
