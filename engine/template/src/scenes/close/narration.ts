import type { SceneMeta } from '../../core/types';

/**
 * Cierre: siempre es la última escena y siempre termina con el logo de Gensler (el nuevo).
 * Por defecto va SIN voz: solo el logo, con el acorde final de la música sonando ahí (la duración es
 * `leadIn + tail`). Si el usuario pide una frase de cierre, agrégala en `segments` (una sola frase) y
 * la escena la muestra como titular sobre el logo.
 */
export const meta: SceneMeta = {
  id: 'close',
  title: 'Cierre',
  register: 'motion',
  leadIn: 0.8,
  tail: 4.0,
  segments: [],
};
