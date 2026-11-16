import { copyFile, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Page } from 'playwright';
import { META } from '../src/scenes/metas';
import { buildTimeline, type VoiceManifest } from '../src/core/timeline';
import { captureFor, launchApp, goToStep } from './app';
import { Director } from './recorder/director';
import { startScreencast, fpsStats } from './recorder/capture';
import { buildConcatList } from './recorder/concat';
import { encodeFrames } from './recorder/encode';

const MAX_LAG = 0.35;
const arg = (name: string) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined);
const exists = (p: string) => access(p).then(() => true, () => false);

async function promote(id: string, take: string) {
  const dir = 'public/generated/rec';
  const rec = JSON.parse(await readFile(join(dir, `${id}.take${take}.json`), 'utf8'));
  rec.video = `generated/rec/${id}.mp4`;
  await copyFile(join(dir, `${id}.take${take}.mp4`), join(dir, `${id}.mp4`));
  await writeFile(join(dir, `${id}.json`), JSON.stringify(rec));
  console.log(`✓ toma ${take} promovida a ${id}`);
}

async function main() {
  const id = process.argv[2];
  const meta = id ? META[id] : undefined;
  if (!meta || meta.register !== 'live') throw new Error(`Uso: npm run record -- <escena En vivo>. Opciones: ${Object.values(META).filter((m) => m.register === 'live').map((m) => m.id).join(', ')}`);
  const toPromote = arg('--promote');
  if (toPromote) return promote(id!, toPromote);

  const manifestPath = 'public/generated/voice-manifest.json';
  const manifest: VoiceManifest | null = (await exists(manifestPath)) ? JSON.parse(await readFile(manifestPath, 'utf8')) : null;
  const timeline = buildTimeline(meta, manifest);
  if (timeline.segments.some((s) => s.estimated)) console.warn('⚠ Hay segmentos sin voz real: el ritmo usará estimaciones. Corre npm run voice primero.');

  const scene = (await import(pathToFileURL(resolve(`src/scenes/${id}/record.ts`)).href)) as { setup(page: Page): Promise<void>; record(d: Director): Promise<void> };
  const take = arg('--take');
  const base = take ? `${id}.take${take}` : id!;
  const framesDir = resolve('recordings', base);

  const cap = captureFor(meta.device);
  const { browser, page } = await launchApp({ headed: process.argv.includes('--headed'), device: meta.device });
  try {
    await goToStep(page, meta.step!);
    await scene.setup(page);
    const stop = await startScreencast(page, framesDir, 92, cap.dpr, cap.viewport);
    await page.waitForTimeout(400);
    const d = new Director(page, timeline);
    d.start();
    await scene.record(d);
    const endSec = Math.max(timeline.durationSec, d.t() + 0.8);
    await d.at(endSec);
    const frames = await stop();
    const t0 = d.startedAt();
    const stats = fpsStats(frames, t0, t0 + endSec);
    console.log(`frames: ${frames.length} · fps medio ${stats.avgFps.toFixed(1)} · hueco máx ${stats.maxGapSec.toFixed(2)} s`);
    if (d.maxLag() > MAX_LAG) {
      throw new Error(`Acciones atrasadas respecto de la voz:\n${d.lags.filter((l) => l.lagSec > MAX_LAG).map((l) => `  ${l.cue}: +${l.lagSec.toFixed(2)} s`).join('\n')}\nAjusta dur/offsets en record.ts.`);
    }
    await mkdir('public/generated/rec', { recursive: true });
    const listFile = join(framesDir, 'list.txt');
    await writeFile(listFile, buildConcatList(frames, t0, t0 + endSec));
    await encodeFrames(listFile, `public/generated/rec/${base}.mp4`, cap.dpr, cap.viewport);
    await writeFile(`public/generated/rec/${base}.json`, JSON.stringify(d.toRecording(id!, `generated/rec/${base}.mp4`, endSec)));
    console.log(`✓ public/generated/rec/${base}.mp4 (${endSec.toFixed(1)} s)`);
  } catch (e) {
    const shot = resolve('recordings', `${base}-error.png`);
    await page.screenshot({ path: shot }).catch(() => {});
    console.error(`Captura del error: ${shot}`);
    throw e;
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(String(e)); process.exit(1); });
