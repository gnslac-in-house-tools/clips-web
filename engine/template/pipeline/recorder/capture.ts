import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Page } from 'playwright';
import type { Frame } from './concat';

/** Frames reales de la página (1920×1080 CSS × DPR) con marca de tiempo del compositor. */
export async function startScreencast(page: Page, dir: string, quality = 92, dpr = 2, viewport = { width: 1920, height: 1080 }): Promise<() => Promise<Frame[]>> {
  await mkdir(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames: Frame[] = [];
  const writes: Promise<void>[] = [];
  let n = 0;
  cdp.on('Page.screencastFrame', (f: { data: string; sessionId: number; metadata: { timestamp?: number } }) => {
    const file = join(dir, `${String(n++).padStart(6, '0')}.jpg`);
    frames.push({ file, ts: f.metadata.timestamp ?? Date.now() / 1000 });
    writes.push(writeFile(file, Buffer.from(f.data, 'base64')));
    // Si el navegador ya se cerró por otro error, el ack falla: no debe tapar ese error real.
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality, maxWidth: Math.round(viewport.width * dpr), maxHeight: Math.round(viewport.height * dpr), everyNthFrame: 1 });
  return async () => {
    await cdp.send('Page.stopScreencast');
    await Promise.all(writes);
    await cdp.detach();
    return frames;
  };
}

export function fpsStats(frames: Frame[], t0: number, tEnd: number) {
  const inside = frames.filter((f) => f.ts >= t0 && f.ts <= tEnd);
  let maxGap = 0;
  for (let i = 1; i < inside.length; i++) maxGap = Math.max(maxGap, inside[i]!.ts - inside[i - 1]!.ts);
  return { avgFps: inside.length / Math.max(0.001, tEnd - t0), maxGapSec: maxGap };
}
