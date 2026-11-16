import { mkdir } from 'node:fs/promises';
import { META } from '../src/scenes/metas';
import { goToStep, launchApp } from './app';

/** Capturas fijas de cada paso usado por una escena En vivo: sirven al animatic antes de grabar. */
async function main() {
  const live = Object.values(META).filter((m) => m.register === 'live' && m.step);
  await mkdir('public/generated/shots', { recursive: true });
  for (const device of ['desktop', 'phone'] as const) {
    const steps = [...new Set(live.filter((m) => (m.device ?? 'desktop') === device).map((m) => m.step!))];
    if (!steps.length) continue;
    const { browser, page } = await launchApp({ device });
    try {
      for (const step of steps) {
        await goToStep(page, step);
        await page.screenshot({ path: `public/generated/shots/${step}.png` });
        console.log(`✓ shots/${step}.png (${device})`);
      }
    } finally {
      await browser.close();
    }
  }
}

main().catch((e) => { console.error(String(e)); process.exit(1); });
