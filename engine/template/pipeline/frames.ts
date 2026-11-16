import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { FRAMES } from '../src/frames';
import { META } from '../src/scenes/metas';
import { buildTimeline } from '../src/core/timeline';
import { chromium } from 'playwright';
import { PROJECT } from '../src/video.config';
import { assignLines, storyboardHtml, type StoryScene } from './storyboard';

/**
 * Tablero de frames (método «frames primero»). Renderiza cada frame de src/frames.ts a 960×540, le pone su número,
 * arma out/frames/tablero.png (4 columnas), escribe docs/frames.md con la voz que suena en cada uno y el guion visual
 * (out/frames/guion-visual.png y .html: frames por escena con su frase). Las escenas En vivo usan su captura fija.
 *   npm run frames
 */
const ff = (args: string[]) => { const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' }); if (r.status) throw new Error(`ffmpeg falló: ${args.join(' ')}`); };
const FONT = "fontfile='C\\:/Windows/Fonts/arialbd.ttf'";

/** La frase que suena en el segundo `sec` de la escena (o la última que sonó; «—» si no hay voz). */
function voiceAt(scene: string, sec: number): string {
  const meta = META[scene];
  if (!meta) return '—';
  const segs = buildTimeline(meta).segments;
  const cur = [...segs].reverse().find((s) => s.startSec <= sec + 0.05);
  return cur ? meta.segments.find((m) => m.id === cur.id)?.text ?? '—' : '—';
}

async function main() {
  await rm('out/frames', { recursive: true, force: true });
  await mkdir('out/frames/raw', { recursive: true });
  const serveUrl = await bundle({ entryPoint: resolve('src/index.ts'), publicDir: resolve('public') });
  const comps = new Map<string, Awaited<ReturnType<typeof selectComposition>>>();
  const rows: string[] = [];
  const story: StoryScene[] = [];
  const inputProps = { liveStills: true };
  for (const [i, f] of FRAMES.entries()) {
    const n = String(i + 1).padStart(2, '0');
    const [id, s] = f.at.split('@'); const sec = Number(s);
    const comp = comps.get(id!) ?? (await selectComposition({ serveUrl, id: id!, inputProps }));
    comps.set(id!, comp);
    await renderStill({ serveUrl, composition: comp, frame: Math.min(comp.durationInFrames - 1, Math.round(sec * comp.fps)), output: `out/frames/raw/F${n}.png`, scale: 0.5, inputProps });
    ff(['-i', `out/frames/raw/F${n}.png`, '-vf', `drawbox=x=18:y=18:w=86:h=44:color=0x1D1E21@0.85:t=fill,drawtext=${FONT}:text='F${n}':x=32:y=27:fontsize=28:fontcolor=white`, `out/frames/F${n}.png`]);
    rows.push(`| F${n} | \`${id}\` @ ${sec} s | ${voiceAt(id!, sec)} | ${f.pantalla} | ${f.movimiento} |`);
    const meta = META[id!]!;
    if (story.at(-1)?.id !== id) story.push({ id: id!, title: meta.title, register: meta.register, frames: [] });
    story.at(-1)!.frames.push({ n: `F${n}`, img: `F${n}.png`, sec, lines: [] });
    console.log(`✓ F${n} ${f.at}`);
  }
  const cols = 4, total = Math.ceil(FRAMES.length / cols) * cols;
  for (let i = FRAMES.length; i < total; i++) ff(['-f', 'lavfi', '-i', 'color=c=0xF2F2F0:s=960x540', '-frames:v', '1', `out/frames/F${String(i + 1).padStart(2, '0')}.png`]);
  ff(['-framerate', '1', '-start_number', '1', '-i', 'out/frames/F%02d.png', '-vf', `tile=${cols}x${total / cols}:padding=12:margin=12:color=0xF2F2F0`, '-frames:v', '1', 'out/frames/tablero.png']);
  for (let i = FRAMES.length; i < total; i++) await rm(`out/frames/F${String(i + 1).padStart(2, '0')}.png`);
  await writeFile('docs/frames.md', [
    '# Tablero de frames', '',
    'Generado por `npm run frames` desde `src/frames.ts` (no editar a mano). Imagen: `out/frames/tablero.png`; cada',
    'frame en `out/frames/Fnn.png`. La voz es la frase que suena en ese segundo (estimada hasta generar la voz real).', '',
    '| Frame | Momento | Voz | En pantalla | Movimiento |', '|---|---|---|---|---|', ...rows, '',
  ].join('\n'));
  for (const sc of story) {
    const meta = META[sc.id]!;
    const segs = buildTimeline(meta).segments.map((t) => ({ text: meta.segments.find((m) => m.id === t.id)!.text, startSec: t.startSec }));
    assignLines(segs, sc.frames.map((f) => f.sec)).forEach((lines, k) => { sc.frames[k]!.lines = lines; });
  }
  const silent = new Set(story.filter((sc) => META[sc.id]!.segments.length === 0).map((sc) => sc.id));
  await writeFile('out/frames/guion-visual.html', storyboardHtml(`${PROJECT.name} · guion visual`, story, silent));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(pathToFileURL(resolve('out/frames/guion-visual.html')).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'out/frames/guion-visual.png', fullPage: true });
  await browser.close();
  console.log('✓ out/frames/tablero.png · out/frames/guion-visual.png · docs/frames.md');
}

main().catch((e) => { console.error(String(e)); process.exit(1); });
