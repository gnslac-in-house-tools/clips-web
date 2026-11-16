import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { metasInOrder } from '../src/scenes/metas';
import { CUTS, TARGET, cutFromArgs, cutSlug } from '../src/video.config';
import { probeDurationSec } from './ffprobe';
import { fullSceneDurations } from './srt';

const capture = (args: string[]) => new Promise<string>((resolve) => {
  const p = spawn('ffmpeg', args);
  let err = '';
  p.stderr.on('data', (d) => { err += String(d); });
  p.on('close', () => resolve(err));
});

/** QA del máster: duración, loudness y dos fotogramas por escena en out/qa/ para la revisión visual. */
async function main() {
  const cut = cutFromArgs(process.argv);
  const file = process.argv.slice(2).find((a) => a.endsWith('.mp4')) ?? `out/final/${cutSlug(cut)}-demo-1080p60.mp4`;
  const qaDir = cut === 'full' ? 'out/qa' : `out/qa/${cut}`;
  await mkdir(qaDir, { recursive: true });
  const dur = await probeDurationSec(file);
  const { offsets, secs } = await fullSceneDurations(CUTS[cut]);
  const metas = metasInOrder(CUTS[cut]);
  for (const [i, m] of metas.entries()) {
    for (const [tag, t] of [['a', offsets[i]! + 1.2], ['b', offsets[i]! + secs[i]! / 2]] as const) {
      await capture(['-y', '-v', 'error', '-ss', t.toFixed(2), '-i', file, '-frames:v', '1', `${qaDir}/${String(i + 1).padStart(2, '0')}-${m.id}-${tag}.png`]);
    }
  }
  const log = await capture(['-v', 'info', '-i', file, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-']);
  const lufs = Number(/I:\s+(-?\d+(?:\.\d+)?) LUFS/.exec(log.split('Summary:').at(-1) ?? '')?.[1]);
  const problems: string[] = [];
  if (dur < TARGET.minSec || dur > TARGET.maxSec) problems.push(`duración ${dur.toFixed(1)} s fuera de ${TARGET.minSec}–${TARGET.maxSec}`);
  if (!(lufs >= -17 && lufs <= -15)) problems.push(`loudness ${lufs} LUFS fuera de −16 ± 1`);
  console.log(`duración ${dur.toFixed(1)} s · loudness ${lufs} LUFS · ${metas.length * 2} fotogramas en ${qaDir}/`);
  if (problems.length) { console.error(`✗ ${problems.join('; ')}`); process.exit(1); }
  console.log(`✓ QA automático ok — falta revisión visual de ${qaDir}/`);
}

main().catch((e) => { console.error(String(e)); process.exit(1); });
