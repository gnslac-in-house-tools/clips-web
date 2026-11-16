import type { SceneMeta } from '../core/types';
import { SCENE_ORDER } from '../video.config';
import { meta as intro } from './intro/narration';
import { meta as demo } from './demo/narration';
import { meta as close } from './close/narration';

/** Registro de metadatos (puro: sin React ni Remotion, usable desde Node). */
export const META: Record<string, SceneMeta> = Object.fromEntries(
  [intro, demo, close].map((m) => [m.id, m]),
);

/** Metadatos en el orden del video, o de un corte (`CUTS` en video.config). */
export function metasInOrder(order: readonly string[] = SCENE_ORDER): SceneMeta[] {
  return order.map((id) => {
    const m = META[id];
    if (!m) throw new Error(`La escena "${id}" está en SCENE_ORDER pero no tiene narration.ts registrado en metas.ts`);
    return m;
  });
}
