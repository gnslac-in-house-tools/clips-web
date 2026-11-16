import { getStaticFiles } from 'remotion';
import { SFX, type SfxName } from '../audio/sfx';
import { SfxCue } from './SfxCue';

/**
 * Sonido ligado al movimiento, por escena: cada efecto cae en el mismo instante que la animación que lo justifica
 * (los tiempos salen de `useWordTime`, igual que la animación). Volúmenes bajos, «casi imperceptibles»:
 * tick (etiqueta, check, celda) · pop (un resultado que aparece) · whoosh (panel o bloque que entra) ·
 * swell (una transformación grande del objeto) · rise (un momento clave). Si un archivo no existe, no suena.
 */
export const VOL: Record<SfxName, number> = { tick: 0.14, pop: 0.16, 'whoosh-soft': 0.1, swell: 0.18, rise: 0.15 };

export type Cue = [SfxName, number, number?];

export const Cues: React.FC<{ cues: Cue[] }> = ({ cues }) => {
  const files = new Set(getStaticFiles().map((f) => f.name));
  return (
    <>
      {cues.filter(([n, at]) => files.has(SFX[n].file) && Number.isFinite(at) && at >= 0).map(([n, at, vol], i) => (
        <SfxCue key={`${n}-${i}`} name={n} atSec={at} volume={vol ?? VOL[n]} />
      ))}
    </>
  );
};
