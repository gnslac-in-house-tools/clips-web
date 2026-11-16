import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { bodyEndSec, MUSIC_TAIL_SEC } from '../src/core/mix';
import { composeMusic } from './eleven';
import { probeDurationSec } from './ffprobe';
import { fullSceneDurations } from './srt';
import { MUSIC } from '../src/video.config';

const FILE = 'public/generated/music/bed.mp3';
const PROMPT = MUSIC.prompt;
/** La pista se pide más larga que el video: MusicBed recorta el inicio para alinear el fin del cuerpo con el cierre. */
const EXTRA_SEC = 25;
const ATTEMPTS = 3;

/** Duración real del video: voz y grabaciones En vivo, cuantizadas a fotogramas, menos los fundidos. */
export async function videoTotalSec(order?: readonly string[]): Promise<number> {
  const { secs, offsets } = await fullSceneDurations(order);
  return offsets.at(-1)! + secs.at(-1)!;
}

/** Nivel RMS (dB) de cada segundo de la pista. */
function levelsPerSecond(file: string): Promise<number[]> {
  return new Promise((resolve) => {
    const p = spawn('ffmpeg', ['-v', 'error', '-i', file, '-af', 'aresample=44100,asetnsamples=n=44100,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-', '-f', 'null', '-']);
    let out = '';
    p.stdout.on('data', (d) => { out += String(d); });
    p.on('close', () => resolve([...out.matchAll(/RMS_level=(-?[\d.]+|-inf)/g)].map((m) => (m[1] === '-inf' ? -120 : Number(m[1])))));
  });
}

/** public/generated/music/bed.json: duración y fin del cuerpo de la pista (también sirve para una pista puesta a mano). */
export async function writeBedInfo(): Promise<{ durationSec: number; bodyEndSec: number }> {
  const info = { durationSec: await probeDurationSec(FILE), bodyEndSec: bodyEndSec(await levelsPerSecond(FILE)) };
  await writeFile('public/generated/music/bed.json', JSON.stringify(info));
  return info;
}

async function main() {
  const total = await videoTotalSec();
  await mkdir('public/generated/music', { recursive: true });
  for (let i = 1; i <= ATTEMPTS; i++) {
    try {
      await writeFile(FILE, await composeMusic(PROMPT, Math.round((total + EXTRA_SEC) * 1000)));
    } catch (e) {
      console.error(String(e));
      console.error('Si el plan de ElevenLabs no incluye música, coloca una pista libre de regalías en public/generated/music/bed.mp3 (se usa igual).');
      process.exit(1);
    }
    const info = await writeBedInfo();
    const ok = info.bodyEndSec >= total - MUSIC_TAIL_SEC;
    console.log(`${ok ? '✓' : '✗'} intento ${i}: pista de ${info.durationSec.toFixed(1)} s, cuerpo hasta ${info.bodyEndSec} s, video de ${total.toFixed(1)} s`);
    if (ok) return;
  }
  console.error('La música generada no cubre el video; prueba de nuevo o usa una pista manual más larga.');
  process.exit(1);
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('pipeline/music.ts')) main();
