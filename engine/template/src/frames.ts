/**
 * Tablero de frames (método «frames primero»): los cuadros clave del video, uno por momento, con lo que se ve en
 * pantalla y cómo entra o sale. `npm run frames` los renderiza, arma `out/frames/tablero.png`, el guion visual
 * (`out/frames/guion-visual.png`) y escribe `docs/frames.md` con la frase de voz que suena en cada uno.
 * Se aprueba antes de animar o gastar en voz. `at`: composición@segundo (voz estimada mientras no haya voz real).
 *
 * EJEMPLO neutro para las escenas del esqueleto: reemplázalo con los momentos del video real.
 */
export interface Frame { at: string; pantalla: string; movimiento: string }

export const FRAMES: Frame[] = [
  { at: 'intro@1.5', pantalla: 'Nombre de la app como titular cinético', movimiento: 'Cada palabra sube desde su máscara' },
  { at: 'intro@6', pantalla: 'Chip de honestidad bajo el titular', movimiento: 'El chip entra con resorte al decir «interfaz»' },
  { at: 'intro@10', pantalla: 'La ventana de la app sube desde abajo', movimiento: 'La ventana entra con el resorte de cámara; el titular se va' },
  { at: 'demo@3', pantalla: 'App · vista principal', movimiento: 'En vivo; zoom al control que se toca' },
  { at: 'demo@6', pantalla: 'App · el resultado que cambia, con su callout', movimiento: 'Zoom al resultado; callout de 2 a 5 palabras' },
  { at: 'close@2', pantalla: 'Logo de Gensler centrado', movimiento: 'Sin voz; el logo sube suave' },
];
