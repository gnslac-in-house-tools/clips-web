import { metasInOrder } from '../src/scenes/metas';
import { fullSceneDurations } from './srt';
import { CUTS, cutFromArgs } from '../src/video.config';

/** Tabla de duraciones: voz real vs. grabación, y el total del video (`-- --cut <corte>` para un corte). */
async function main() {
  const order = CUTS[cutFromArgs(process.argv)];
  const { timelines, secs, offsets } = await fullSceneDurations(order);
  const metas = metasInOrder(order);
  for (const [i, m] of metas.entries()) {
    const at = offsets[i]!;
    console.log(`${m.id.padEnd(16)} ${String(Math.floor(at / 60))}:${(at % 60).toFixed(1).padStart(4, '0')}  escena ${secs[i]!.toFixed(1).padStart(5)} s  voz ${timelines[i]!.durationSec.toFixed(1).padStart(5)} s`);
  }
  const last = metas.length - 1;
  console.log(`TOTAL ${(offsets[last]! + secs[last]!).toFixed(1)} s`);
}

main().catch((e) => { console.error(String(e)); process.exit(1); });
