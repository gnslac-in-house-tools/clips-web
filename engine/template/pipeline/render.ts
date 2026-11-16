import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { CUTS, FLAGS, SCENE_ORDER, cutFromArgs, cutSlug, type Cut } from '../src/video.config';
import type { SceneProps } from '../src/data/load';
import { assembleFilter, sourcesFor } from './assemble';
import { linearLoudnormFilter } from './loudnorm';
import { musicTrimSec } from '../src/core/mix';
import { videoTotalSec, writeBedInfo } from './music';

/**
 * Render por niveles, de barato a caro. Nada de calidad alta antes de aprobar el borrador.
 *
 *   npm run render -- --animatic     animatic 720p30 estático: voz real, capturas fijas de la app
 *   npm run render -- --sketch       boceto 360p15 estático (sin coreografía): lo primero tras el tablero de frames
 *   npm run render -- --scene <id> --pilot   la toma piloto, 720p30 (captura y cursor)
 *   npm run render -- --scene <id>  una escena con la animación completa, 720p30 (escena piloto de animación primero)
 *   npm run render -- --scene <id>   cualquier otra escena, 720p30
 *   npm run render -- --draft        video completo, 720p30: revisar guion, ritmo, voz y música
 *   npm run render -- --final        máster 1080p60 + SRT (se mide duración y loudness con npm run qa)
 *   npm run render -- --final --2k   además 1440p60 (solo si se pide)
 *   npm run render -- --final --4k   además 2160p60 (solo si se pide)
 *   … --cut client                   un corte de CUTS (video.config): mismas escenas en caché, otra salida
 */
import { PRESETS, qualityTag, type Preset } from './presets';
export { PRESETS, qualityTag };

const run = (cmd: string, args: string[]) => new Promise<void>((ok, fail) => {
  const p = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  p.on('close', (c) => (c === 0 ? ok() : fail(new Error(`${cmd} salió con ${c}`))));
});
const exists = (p: string) => stat(p).then(() => true, () => false);

/**
 * loudnorm en dos pasadas y lineal: mide el video completo y aplica una sola ganancia. En una pasada
 * loudnorm trabaja en modo dinámico y sube y baja la ganancia a lo largo del video (la voz se
 * sentía "a veces cerca, a veces lejos"). Va entre comillas porque `run` usa shell en Windows.
 */
async function linearLoudnorm(file: string): Promise<string> {
  const target = 'loudnorm=I=-16:TP=-1.5:LRA=11';
  const log = await new Promise<string>((ok, fail) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', `${target}:print_format=json`, '-f', 'null', '-']);
    let err = '';
    p.stderr.on('data', (d) => { err += String(d); });
    p.on('close', (c) => (c === 0 ? ok(err) : fail(new Error(`loudnorm (medición) salió con ${c}`))));
  });
  const m = JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1)) as Record<string, string>;
  return `"${linearLoudnormFilter(m)}"`;
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...(await walk(p))); else out.push(p);
  }
  return out;
}

/** Firma barata de un archivo grande (medios): tamaño + fecha de modificación. */
const fileSig = async (p: string) => { const s = await stat(p).catch(() => null); return s ? `${p}:${s.size}:${s.mtimeMs}` : `${p}:missing`; };


/** Clave de caché: código que afecta la escena + sus datos (voz, grabación, captura) + marca, efectos y calidad. */
export async function sceneKey(id: string, props: SceneProps, quality: string): Promise<string> {
  const h = createHash('sha256');
  const src = sourcesFor(id, (await walk('src')).map((f) => f.replace(/\\/g, '/')).sort());
  for (const f of src) h.update(f).update(await readFile(f));
  h.update(JSON.stringify(props));
  const media = [props.recording?.video, props.shot, ...props.timeline.segments.map((s) => s.file)].filter(Boolean).map((f) => `public/${f}`);
  const shared = [...(await walk('public/brand').catch(() => [])), ...(await walk('public/fonts')), ...(await walk('public/generated/sfx').catch(() => []))];
  for (const f of [...media, ...shared]) h.update(await fileSig(f));
  return h.update(quality).digest('hex').slice(0, 16);
}

const bundleProject = () => bundle({ entryPoint: resolve('src/index.ts'), publicDir: resolve('public') });

async function renderFull(preset: Preset, out: string, cut: Cut) {
  const order = CUTS[cut];
  // La música debe cubrir el video completo; se valida antes de gastar tiempo de render.
  if (await exists('public/generated/music/bed.mp3')) musicTrimSec((await writeBedInfo()).bodyEndSec, await videoTotalSec(order));
  const concurrency = Number(process.env.RENDER_CONCURRENCY ?? 2);
  const inputProps = { fps: preset.fps, liveStills: preset.liveStills, movimiento: preset.estatico ? 'estatico' : 'completo' };
  const quality = qualityTag(preset);
  const serveUrl = await bundleProject();
  await mkdir('cache/scenes', { recursive: true });
  const clips: string[] = [];
  const frames: number[] = [];
  for (const id of order) {
    const comp = await selectComposition({ serveUrl, id, inputProps });
    const key = await sceneKey(id, comp.props as SceneProps, quality);
    const clip = `cache/scenes/${id}-${key}.mp4`;
    if (await exists(clip)) console.log(`· ${id}: sin cambios (caché)`);
    else {
      console.log(`▶ ${id}: renderizando ${comp.durationInFrames} fotogramas a ${preset.label}…`);
      await renderMedia({ serveUrl, composition: comp, inputProps, timeoutInMilliseconds: 120000, codec: 'h264', crf: preset.crf, scale: preset.scale, outputLocation: `${clip}.tmp.mp4`, enforceAudioTrack: true, concurrency });
      await rename(`${clip}.tmp.mp4`, clip);
    }
    clips.push(clip);
    frames.push(comp.durationInFrames);
  }
  // La cama (música con ducking y whooshes) sí depende del corte: se renderiza con su orden de escenas.
  const bedProps = { ...inputProps, order };
  const bed = `cache/bed-${cut}.wav`;
  const bedComp = await selectComposition({ serveUrl, id: 'Bed', inputProps: bedProps });
  await renderMedia({ serveUrl, composition: bedComp, inputProps: bedProps, codec: 'wav', outputLocation: bed, concurrency });
  const T = Math.round(FLAGS.transitionSec * preset.fps);
  const raw = out.replace(/\.mp4$/, '.raw.mp4');
  await run('ffmpeg', ['-y', '-v', 'error', ...clips.flatMap((c) => ['-i', c]), '-i', bed,
    '-filter_complex', `"${assembleFilter(frames, preset.fps, T).replace(/\n/g, '')}"`, '-map', '[vout]', '-map', '[aout]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', preset === PRESETS.sketch ? '30' : preset.scale >= 2 ? '16' : '14', '-r', String(preset.fps), '-c:a', 'pcm_s16le', '-f', 'mov', raw]);
  await run('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-c:v', 'copy', '-af', await linearLoudnorm(raw), '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', out]);
  console.log(`✓ ${out}`);
}

async function renderScene(id: string, pilot: boolean) {
  if (!(SCENE_ORDER as readonly string[]).includes(id)) throw new Error(`Escena desconocida: ${id}. Opciones: ${SCENE_ORDER.join(', ')}`);
  const p = pilot ? PRESETS.pilot : PRESETS.scene;
  const inputProps = { fps: p.fps, movimiento: 'completo' };
  const serveUrl = await bundleProject();
  const comp = await selectComposition({ serveUrl, id, inputProps });
  await mkdir('out/preview', { recursive: true });
  const out = `out/preview/${id}-${p.label}.mp4`;
  await renderMedia({ serveUrl, composition: comp, inputProps, timeoutInMilliseconds: 120000, codec: 'h264', crf: 20, scale: p.scale, outputLocation: out, concurrency: Number(process.env.RENDER_CONCURRENCY ?? 2) });
  console.log(`✓ ${out}`);
}

async function main() {
  const cut = cutFromArgs(process.argv);
  const name = (label: string, suffix = '') => `${cutSlug(cut)}-demo-${label}${suffix}.mp4`;
  const scene = process.argv.includes('--scene') ? process.argv[process.argv.indexOf('--scene') + 1] : undefined;
  if (scene) return renderScene(scene, process.argv.includes('--pilot'));
  if (process.argv.includes('--animatic')) {
    await mkdir('out/preview', { recursive: true });
    return renderFull(PRESETS.animatic, `out/preview/${name(PRESETS.animatic.label, '-animatic')}`, cut);
  }
  if (process.argv.includes('--sketch')) {
    await mkdir('out/preview', { recursive: true });
    return renderFull(PRESETS.sketch, `out/preview/${name(PRESETS.sketch.label, '-boceto')}`, cut);
  }
  if (process.argv.includes('--draft')) {
    await mkdir('out/preview', { recursive: true });
    return renderFull(PRESETS.draft, `out/preview/${name(PRESETS.draft.label, '-borrador')}`, cut);
  }
  if (!process.argv.includes('--final')) throw new Error('Uso: npm run render -- --sketch | --animatic | --scene <id> [--pilot] | --draft | --final [--2k] [--4k] [--cut <corte>]');
  await mkdir('out/final', { recursive: true });
  await renderFull(PRESETS.final, `out/final/${name(PRESETS.final.label)}`, cut);
  if (process.argv.includes('--2k')) await renderFull(PRESETS['2k'], `out/final/${name(PRESETS['2k'].label)}`, cut);
  if (process.argv.includes('--4k')) await renderFull(PRESETS['4k'], `out/final/${name(PRESETS['4k'].label)}`, cut);
  await run('npx', ['tsx', 'pipeline/srt.ts', '--cut', cut]);
  console.log('✓ out/final listo');
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('pipeline/render.ts')) main().catch((e) => { console.error(String(e)); process.exit(1); });
