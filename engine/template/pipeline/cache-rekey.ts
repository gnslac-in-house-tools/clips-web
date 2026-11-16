import { readdir, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { bundle } from '@remotion/bundler';
import { selectComposition } from '@remotion/renderer';
import { SCENE_ORDER } from '../src/video.config';
import type { SceneProps } from '../src/data/load';
import { PRESETS, qualityTag, sceneKey } from './render';

/**
 * Reasigna clips del máster (1080p60) ya renderizados a su clave actual tras un cambio que se
 * verificó neutro para la imagen (p. ej. servir la misma fuente desde disco). Úsalo solo con esa
 * verificación hecha (stills antes/después idénticos): si no, re-renderiza.
 * Uso: npx tsx pipeline/cache-rekey.ts intro problem …
 */
async function main() {
  const ids = process.argv.slice(2);
  if (!ids.length) throw new Error('Uso: npx tsx pipeline/cache-rekey.ts <escena> …');
  const inputProps = { fps: PRESETS.final.fps };
  const serveUrl = await bundle({ entryPoint: resolve('src/index.ts'), publicDir: resolve('public') });
  const files = await readdir('cache/scenes');
  for (const id of ids) {
    if (!(SCENE_ORDER as readonly string[]).includes(id)) throw new Error(`Escena desconocida: ${id}`);
    const comp = await selectComposition({ serveUrl, id, inputProps });
    const key = await sceneKey(id, comp.props as SceneProps, qualityTag(PRESETS.final));
    const old = files.filter((f) => f.startsWith(`${id}-`) && f.endsWith('.mp4') && !f.includes('.tmp'));
    if (old.length !== 1) { console.log(`· ${id}: ${old.length} clips en caché, no se toca (borra los que sobran o re-renderiza)`); continue; }
    if (old[0] === `${id}-${key}.mp4`) { console.log(`· ${id}: ya al día`); continue; }
    await rename(`cache/scenes/${old[0]}`, `cache/scenes/${id}-${key}.mp4`);
    console.log(`✓ ${id}: ${old[0]} → ${id}-${key}.mp4`);
  }
}

main().catch((e) => { console.error(String(e)); process.exit(1); });
