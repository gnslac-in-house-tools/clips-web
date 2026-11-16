import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fullSceneDurations } from './srt';
import { musicTrimSec, musicVolume, voiceIntervals } from '../src/core/mix';
import { CUTS, MUSIC, cutFromArgs, cutSlug } from '../src/video.config';

/**
 * Escucha rápida del audio, sin Remotion (~1 min contra ~45 del máster): la voz masterizada en sus
 * tiempos exactos + la cama con el mismo ducking que el video, normalizada igual que el máster (dos
 * pasadas, lineal). Sin efectos ni whooshes. Para que el usuario apruebe la voz y la mezcla antes del máster.
 *   npm run audio:preview [-- --cut client]  →  out/preview/<slug>-audio-preview.m4a
 * En un proyecto anterior, el render audio-only de la composición Full con Remotion tardaba más de 10 minutos.
 */
const cut = cutFromArgs(process.argv);
const { timelines, secs, offsets } = await fullSceneDurations(CUTS[cut]);
const last = secs.length - 1;
const total = offsets[last]! + secs[last]!;
const voice = voiceIntervals(timelines, offsets);
const bed = JSON.parse(readFileSync('public/generated/music/bed.json', 'utf8')) as { bodyEndSec: number };
const trim = musicTrimSec(bed.bodyEndSec, total);
mkdirSync('cache/preview', { recursive: true });
mkdirSync('out/preview', { recursive: true });

// Envolvente de la música a 1 kHz (Float32 mono): se remuestrea y se multiplica por la cama.
const RATE = 1000;
const env = new Float32Array(Math.ceil(total * RATE));
for (let i = 0; i < env.length; i++) env[i] = musicVolume(i / RATE, voice, { totalSec: total, base: MUSIC.base, duck: MUSIC.duck });
writeFileSync('cache/preview/env.f32', Buffer.from(env.buffer));

const segs = timelines.flatMap((tl, i) => tl.segments.filter((s) => s.file).map((s) => ({ file: `public/${s.file}`, at: offsets[i]! + s.startSec })));
const inputs = ['-f', 'f32le', '-ar', String(RATE), '-ac', '1', '-i', 'cache/preview/env.f32', '-ss', trim.toFixed(3), '-t', total.toFixed(3), '-i', 'public/generated/music/bed.mp3', ...segs.flatMap((s) => ['-i', s.file])];
const graph = [
  '[0:a]aresample=48000,aformat=channel_layouts=stereo[env]',
  '[1:a]aresample=48000,aformat=channel_layouts=stereo[bed]',
  '[bed][env]amultiply[music]',
  ...segs.map((s, i) => `[${i + 2}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(s.at * 1000)}:all=1[v${i}]`),
  `[music]${segs.map((_, i) => `[v${i}]`).join('')}amix=inputs=${segs.length + 1}:normalize=0:duration=first[mix]`,
];
// El grafo va en un archivo (`-/filter_complex`): con decenas de frases no cabe en la línea de comandos de Windows.
writeFileSync('cache/preview/mix.filter', graph.join(';\n'));
const ff = (args: string[]) => {
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stderr;
};
ff(['-y', '-v', 'error', ...inputs, '-/filter_complex', 'cache/preview/mix.filter', '-map', '[mix]', '-c:a', 'pcm_s24le', 'cache/preview/mix.wav']);
const target = 'loudnorm=I=-16:TP=-1.5:LRA=11';
const log = ff(['-hide_banner', '-nostats', '-i', 'cache/preview/mix.wav', '-af', `${target}:print_format=json`, '-f', 'null', '-']);
const m = JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1)) as Record<string, string>;
const out = `out/preview/${cutSlug(cut)}-audio-preview.m4a`;
ff(['-y', '-v', 'error', '-i', 'cache/preview/mix.wav', '-af', `${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`, '-c:a', 'aac', '-b:a', '256k', out]);
console.log(`✓ ${out} (${total.toFixed(1)} s, ${segs.length} frases, música desde ${trim.toFixed(1)} s)`);
