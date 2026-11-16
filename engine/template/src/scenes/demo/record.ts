import type { Page } from 'playwright';
import type { Director } from '../../../pipeline/recorder/director';

/**
 * EJEMPLO — guion de grabación de una escena En vivo. Reglas:
 * - Cada acción espera su frase: `d.cue(seg)` o `d.cueWord(seg, palabra, offset)`. El cursor llega
 *   ~0.3–0.6 s ANTES de la palabra que nombra la acción (el ojo va antes que el oído).
 * - Cada cosa que un zoom, spotlight o callout vaya a señalar se registra con un id:
 *   `d.click('id', …)`, `d.mark('id', locator)`. Scene.tsx apunta a esos ids, nunca a coordenadas.
 * - Localiza con roles y nombres accesibles (getByRole, getByLabel) antes que con clases CSS.
 * - Si `npm run record` reporta acciones atrasadas (> 0.35 s), acorta `dur` o adelanta offsets.
 */
export async function setup(_page: Page): Promise<void> {
  // Estado previo a la toma que no debe verse (abrir un panel, elegir un preset…).
}

export async function record(d: Director): Promise<void> {
  const p = d.page;
  await d.cue('d1');
  await d.mark('screen', p.locator('body'));

  await d.cueWord('d2', 'opción', -0.5);
  // ADAPTAR: el control real, p. ej. p.getByRole('button', { name: 'Opción B' }).
  await d.click('choose', { x: 400, y: 300 }, { dur: 0.9 });
  await d.wait(0.4);
  // ADAPTAR: el valor que cambia (la cifra o la gráfica, no el panel entero), p. ej. p.getByTestId('kpi-area').
  await d.mark('result', { x: 1500, y: 500 });

  await d.cueWord('d3', 'detalle', -0.5);
  await d.click('detail', { x: 1500, y: 620 }, { dur: 0.8 });
}
