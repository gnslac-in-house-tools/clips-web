import type { SceneMeta } from '../../core/types';

/**
 * EJEMPLO de escena En vivo. Cada frase describe lo que se ve en ese momento: la grabación se
 * ancla a estas frases (record.ts) y los zooms/callouts a los eventos grabados (Scene.tsx).
 */
export const meta: SceneMeta = {
  id: 'demo',
  title: 'Demo',
  chapter: '01 Demo',
  register: 'live',
  step: 'home',
  segments: [
    { id: 'd1', text: 'Todo empieza en la vista principal.' },
    { id: 'd2', text: 'Eliges una opción, y el resumen se actualiza al momento.', pauseAfter: 0.6 },
    { id: 'd3', text: 'Cada cifra tiene su detalle, a un clic.' },
  ],
};
