import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { speechEndFromLog } from './silence';

/**
 * Limpieza de cada frase de voz (sin API, determinista). Lo que se oía mal en un proyecto anterior y por qué:
 * - ruido de fondo: algunas voces de la biblioteca traen el ruido de su grabación (Talia: piso de
 *   −39 a −46 dB, contra −64 a −69 dB de voces limpias) y cambia de frase a frase;
 * - cortes: ElevenLabs a veces corta el archivo en la última sílaba, sin cola;
 * - "cerca/lejos" y saturación: cada frase llega con otro nivel, con picos a −0.2 dBFS.
 * La v1 de esta cadena comprimía y subía el ruido. Esta no comprime:
 *   paso altos (70 Hz) → reducción de ruido solo si el piso está alto → fin del habla medido DESPUÉS
 *   de limpiar → recorte con cola suave (fade de 120 ms) → una sola ganancia a VOICE_LUFS → limitador
 *   (v3) Si el habla llega al final del archivo (eleven_v3 casi nunca deja silencio), el fade no se come la última
 *   sílaba: baja a 30 ms (solo quita el clic) y se agregan 250 ms de silencio después.
 *   de picos a VOICE_TP (sin loudnorm: lineal no llega al objetivo y dinámico bombea).
 *   Arranque «pegado al micro» (eleven_v3 a veces entrega el primer medio segundo 3–6 dB más fuerte): NO se corrige
 *   aquí con ganancia ni ecualización (el usuario lo pidió: se oye mal); voice.ts vuelve a grabar la toma.
 *   Devuelve el fin del habla del archivo limpio.
 */
export const VOICE_LUFS = -18;
const VOICE_TP = -2;
/** Subir si cambia la cadena: invalida los archivos limpios en caché (cache/voice/<key>.m<versión>.wav). */
export const MASTER_VERSION = 3;
/** Piso de ruido (dB RMS en ventanas de 50 ms, percentil 10) a partir del cual se reduce el ruido. */
const NOISY_FLOOR_DB = -58;
const FADE_OUT_SEC = 0.12;
/** Habla que llega al final del archivo: fade mínimo y silencio agregado. */
const FADE_SECO_SEC = 0.03;
const COLA_SILENCIO_SEC = 0.25;

const ffmpeg = (args: string[]) => new Promise<string>((resolve, reject) => {
  const p = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let err = '';
  p.stderr.on('data', (d) => { err += String(d); });
  p.on('close', (code) => (code === 0 ? resolve(err) : reject(new Error(`ffmpeg salió con ${code}:\n${err.slice(-1200)}`))));
});

/** Piso de ruido: percentil 10 del RMS en ventanas de 50 ms (las pausas entre palabras). */
export async function noiseFloorDb(file: string): Promise<number> {
  const log = await ffmpeg(['-hide_banner', '-nostats', '-i', file, '-af', 'aresample=44100,asetnsamples=2205,astats=metadata=1:reset=1:measure_overall=none,ametadata=print:key=lavfi.astats.1.RMS_level', '-f', 'null', '-']);
  const lv = [...log.matchAll(/RMS_level=(-?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1])).sort((a, b) => a - b);
  return lv.length ? lv[Math.floor(lv.length / 10)]! : -90;
}

const rmsDb = async (file: string, ss: number, t?: number) => {
  const log = await ffmpeg(['-hide_banner', '-ss', String(ss), ...(t ? ['-t', String(t)] : []), '-i', file, '-af', 'astats=measure_perchannel=none', '-f', 'null', '-']);
  const m = [...log.matchAll(/RMS level dB:\s*(-?\d+(?:\.\d+)?)/g)].at(-1);
  return m ? Number(m[1]) : -90;
};
/** Cuánto más fuerte (dB RMS) suena el arranque (primer medio segundo) que el resto de la frase. */
export async function arranqueDb(file: string): Promise<number> {
  return (await rmsDb(file, 0, 0.5)) - (await rmsDb(file, 0.5));
}

const durationOf = async (file: string) => {
  const log = await ffmpeg(['-hide_banner', '-i', file, '-f', 'null', '-']);
  const m = [...log.matchAll(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/g)].at(-1);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
};

export async function masterVoice(inFile: string, outFile: string): Promise<{ speechEndSec: number }> {
  const floor = await noiseFloorDb(inFile);
  const denoise = floor > NOISY_FLOOR_DB ? `,afftdn=nr=14:nf=${Math.round(floor - 2)}:tn=1` : '';
  const clean = `aresample=48000,highpass=f=70${denoise}`;
  const cleanFile = outFile.replace(/\.wav$/, '.clean.wav');
  if (!(await access(cleanFile).then(() => true, () => false))) await ffmpeg(['-y', '-v', 'error', '-i', inFile, '-af', clean, '-c:a', 'pcm_s24le', cleanFile]);
  const dur = await durationOf(cleanFile);
  const sil = await ffmpeg(['-v', 'info', '-i', cleanFile, '-af', 'silencedetect=noise=-50dB:d=0.12', '-f', 'null', '-']);
  const speechEnd = speechEndFromLog(sil, dur);
  if (await access(outFile).then(() => true, () => false)) return { speechEndSec: speechEnd };
  const end = Math.min(dur, speechEnd + 0.15);
  const seco = speechEnd >= dur - 0.05;
  const fade = seco ? FADE_SECO_SEC : FADE_OUT_SEC;
  const shape = `atrim=0:${end.toFixed(3)},afade=t=in:d=0.012,afade=t=out:st=${Math.max(0, end - fade).toFixed(3)}:d=${fade}${seco ? `,apad=pad_dur=${COLA_SILENCIO_SEC}` : ''}`;
  // Ganancia exacta a VOICE_LUFS y limitador de picos: loudnorm lineal no llega al objetivo si los picos
  // lo impiden (dejaba frases a −21.5 LUFS junto a otras a −18) y en modo dinámico bombea.
  const meas = await ffmpeg(['-hide_banner', '-nostats', '-i', cleanFile, '-af', `${shape},ebur128`, '-f', 'null', '-']);
  const I = Number([...meas.matchAll(/^\s+I:\s+(-?\d+(?:\.\d+)?) LUFS/gm)].at(-1)?.[1] ?? VOICE_LUFS);
  const gain = VOICE_LUFS - I;
  const limit = 10 ** (VOICE_TP / 20);
  await ffmpeg(['-y', '-v', 'error', '-i', cleanFile, '-af', `${shape},volume=${gain.toFixed(2)}dB,alimiter=limit=${limit.toFixed(3)}:attack=4:release=60:level=false`, '-c:a', 'pcm_s24le', outFile]);
  return { speechEndSec: speechEnd };
}
