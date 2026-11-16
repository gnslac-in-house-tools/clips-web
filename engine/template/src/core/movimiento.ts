import { getInputProps } from 'remotion';

/**
 * Modo de movimiento. `estatico` (boceto y animatic): cada elemento aparece en su palabra con un fundido corto, sin
 * coreografía (trazos, explosiones, escalonados, cámara). `completo` (animación, borrador, máster): la coreografía
 * entera. Lo decide el render por peldaño (`presets.ts`, campo `estatico`), así las mismas escenas sirven para ambos
 * y la animación se hace una sola vez, ya con los tiempos de la voz real.
 */
export type Movimiento = 'estatico' | 'completo';

let cache: Movimiento | null = null;
export function movimiento(): Movimiento {
  if (cache) return cache;
  try {
    const p = getInputProps() as { movimiento?: Movimiento };
    cache = p.movimiento === 'estatico' ? 'estatico' : 'completo';
  } catch {
    cache = 'completo';
  }
  return cache;
}
export const esEstatico = () => movimiento() === 'estatico';

/** Duración del fundido con el que aparece todo en modo estático. */
export const FUNDIDO_ESTATICO = 0.3;
