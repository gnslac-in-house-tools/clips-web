import type { SceneMeta } from '../../core/types';

/**
 * EJEMPLO neutro — reemplazar en la etapa de guion. La estructura y el contenido de cada video se deciden
 * en el intake según la app y la audiencia; esto solo muestra cómo se escribe una escena Motion.
 */
export const meta: SceneMeta = {
  id: 'intro',
  title: 'Bienvenida',
  register: 'motion',
  leadIn: 1.2,
  segments: [
    { id: 'w1', text: 'Esta es la nueva plataforma para revisar cada proyecto en un solo lugar.' },
    { id: 'w2', text: 'Es una interfaz preliminar: un prototipo de lo que podría ser.' },
    { id: 'w3', text: 'Convierte los datos del proyecto en decisiones claras y compartidas.' },
  ],
};
