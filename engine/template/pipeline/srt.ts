import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { metasInOrder } from '../src/scenes/metas';
import { buildTimeline, quantizeSec, sceneOffsets, type VoiceManifest } from '../src/core/timeline';
import { captionsForSegment } from '../src/core/captions';
import { toSrt } from '../src/core/srt';
import type { Recording } from '../src/core/events';
import { CUTS, FLAGS, PROJECT, cutFromArgs, cutSlug } from '../src/video.config';

const readJson = async <T>(p: string): Promise<T | null> => ((await access(p).then(() => true, () => false)) ? JSON.parse(await readFile(p, 'utf8')) : null);

export async function fullSceneDurations(order: readonly string[] = CUTS.full) {
  const manifest = await readJson<VoiceManifest>('public/generated/voice-manifest.json');
  const metas = metasInOrder(order);
  const timelines = metas.map((m) => buildTimeline(m, manifest));
  const secs = await Promise.all(metas.map(async (m, i) => {
    const rec = m.register === 'live' ? await readJson<Recording>(`public/generated/rec/${m.id}.json`) : null;
    return quantizeSec(Math.max(timelines[i]!.durationSec, rec?.durationSec ?? 0), FLAGS.fps);
  }));
  return { timelines, secs, offsets: sceneOffsets(secs, Math.round(FLAGS.transitionSec * FLAGS.fps) / FLAGS.fps) };
}

async function main() {
  const cut = cutFromArgs(process.argv);
  const { timelines, offsets } = await fullSceneDurations(CUTS[cut]);
  const lines = timelines.flatMap((tl, i) => tl.segments.flatMap((s) =>
    captionsForSegment(s.text, s.alignment, s.endSec - s.startSec).map((l) => ({
      text: l.text, startSec: offsets[i]! + s.startSec + l.startSec, endSec: offsets[i]! + s.startSec + l.endSec,
    }))));
  const file = `out/final/${cutSlug(cut)}-demo.${PROJECT.lang}.srt`;
  await mkdir('out/final', { recursive: true });
  await writeFile(file, toSrt(lines));
  console.log(`✓ ${file} (${lines.length} líneas)`);
}

if (process.argv[1]?.endsWith('srt.ts')) main().catch((e) => { console.error(String(e)); process.exit(1); });
