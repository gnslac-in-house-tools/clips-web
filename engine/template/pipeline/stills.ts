import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';

/** Fotogramas de revisión: npx tsx pipeline/stills.ts welcome@3 welcome@7.5 Full@96 … → out/stills/. Empaqueta una sola vez. */
async function main() {
  const shots = process.argv.slice(2).map((a) => { const [id, sec] = a.split('@'); return { id: id!, sec: Number(sec) }; });
  if (!shots.length || shots.some((s) => !s.id || !Number.isFinite(s.sec))) throw new Error('Uso: npx tsx pipeline/stills.ts <composición>@<segundo> …');
  await mkdir('out/stills', { recursive: true });
  const serveUrl = await bundle({ entryPoint: resolve('src/index.ts'), publicDir: resolve('public') });
  const comps = new Map<string, Awaited<ReturnType<typeof selectComposition>>>();
  for (const s of shots) {
    const comp = comps.get(s.id) ?? (await selectComposition({ serveUrl, id: s.id }));
    comps.set(s.id, comp);
    const frame = Math.min(comp.durationInFrames - 1, Math.round(s.sec * comp.fps));
    const output = `out/stills/${s.id}@${s.sec}.png`;
    await renderStill({ serveUrl, composition: comp, frame, output, scale: 0.5 });
    console.log(`✓ ${output}`);
  }
}

main().catch((e) => { console.error(String(e)); process.exit(1); });
