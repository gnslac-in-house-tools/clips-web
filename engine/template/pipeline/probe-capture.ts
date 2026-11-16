import { rm } from 'node:fs/promises';
import { chromium } from 'playwright';
import { BROWSER_ARGS, READY_SELECTOR, goToStep, prepareContext } from './app';
import { startScreencast } from './recorder/capture';
import { APP } from '../src/video.config';

/**
 * Mide los fps reales del screencast mientras hay movimiento continuo, en varias configuraciones.
 * Correr antes de la toma piloto, sobre todo si la app tiene WebGL (three.js, mapas): si ninguna
 * configuración pasa de ~45 fps durante el movimiento, la captura alternativa es Chromium visible
 * + ffmpeg ddagrab sobre la ventana.
 *
 * Uso: npx tsx pipeline/probe-capture.ts [--step <paso>] [--drag <selector>] [filtro-de-nombre]
 * `--drag`: elemento sobre el que se arrastra en círculos (p. ej. el canvas del visor 3D para orbitar).
 */
const CONFIGS = [
  { name: 'headless dpr2 q92', headless: true, dpr: 2, quality: 92, args: BROWSER_ARGS },
  { name: 'headed dpr2 q92', headless: false, dpr: 2, quality: 92, args: BROWSER_ARGS },
  { name: 'headless dpr2 q80', headless: true, dpr: 2, quality: 80, args: BROWSER_ARGS },
  { name: 'headless dpr1.5 q90', headless: true, dpr: 1.5, quality: 90, args: BROWSER_ARGS },
  { name: 'headless dpr2 sin angle', headless: true, dpr: 2, quality: 92, args: BROWSER_ARGS.filter((a) => !a.startsWith('--use-angle')) },
];

const arg = (name: string) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined);

async function main() {
  const step = arg('--step');
  const dragSel = arg('--drag');
  const only = process.argv.slice(2).find((a, i, all) => !a.startsWith('--') && !all[i - 1]?.startsWith('--'));
  for (const c of CONFIGS) {
    if (only && !c.name.includes(only)) continue;
    const browser = await chromium.launch({ headless: c.headless, args: c.args });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: c.dpr });
    await prepareContext(context);
    const page = await context.newPage();
    await page.goto(process.env.APP_URL ?? APP.url);
    await page.locator(READY_SELECTOR).first().waitFor();
    if (step) await goToStep(page, step);
    const bb = dragSel ? await page.locator(dragSel).first().boundingBox() : { x: 560, y: 240, width: 800, height: 600 };
    if (!bb) throw new Error(`--drag ${dragSel}: el elemento no está visible`);
    const cx = bb.x + bb.width / 2;
    const cy = bb.y + bb.height / 2;
    const r = Math.min(bb.width, bb.height) * 0.3;
    const stop = await startScreencast(page, 'recordings/_probe', c.quality, c.dpr);
    await page.waitForTimeout(300);
    const t0 = Date.now() / 1000;
    await page.mouse.move(cx + r, cy);
    if (dragSel) await page.mouse.down();
    for (let i = 0; i < 180; i++) {
      const a = (i / 180) * Math.PI * 4;
      await page.mouse.move(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      await page.waitForTimeout(16);
    }
    if (dragSel) await page.mouse.up();
    const t1 = Date.now() / 1000;
    const frames = (await stop()).filter((f) => f.ts >= t0 && f.ts <= t1);
    console.log(`${c.name.padEnd(26)} ${(frames.length / (t1 - t0)).toFixed(1)} fps durante movimiento (${frames.length} frames en ${(t1 - t0).toFixed(1)} s)`);
    await browser.close();
    await rm('recordings/_probe', { recursive: true, force: true });
  }
}

main().catch((e) => { console.error(String(e)); process.exit(1); });
