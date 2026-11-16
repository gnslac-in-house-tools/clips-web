import { spawn } from 'node:child_process';

/** Margen tras la última sílaba, para no comerse la caída natural de la voz. */
const MARGIN_SEC = 0.08;
/**
 * Un silencio cuenta como final si termina a menos de esto del final del archivo. Con 0.05 un ruido de
 * ~55 ms al cierre del mp3 dejaba 2.4 s de silencio dentro de la escena (en una toma real): 0.2 s no es habla.
 */
const END_TOLERANCE_SEC = 0.2;

/** Fin del habla a partir del log de `silencedetect`; si no hay silencio final, la duración completa. */
export function speechEndFromLog(log: string, durationSec: number): number {
  const events = [...log.matchAll(/silence_(start|end): (-?\d+(?:\.\d+)?)/g)].map((m) => ({ kind: m[1], t: Number(m[2]) }));
  const lastStart = events.map((e, i) => ({ ...e, i })).filter((e) => e.kind === 'start').at(-1);
  if (!lastStart) return durationSec;
  const end = events.slice(lastStart.i + 1).find((e) => e.kind === 'end');
  if (end && end.t < durationSec - END_TOLERANCE_SEC) return durationSec;
  return Math.min(durationSec, lastStart.t + MARGIN_SEC);
}

export function speechEndSec(file: string, durationSec: number): Promise<number> {
  return new Promise((resolve) => {
    const p = spawn('ffmpeg', ['-v', 'info', '-i', file, '-af', 'silencedetect=noise=-45dB:d=0.12', '-f', 'null', '-']);
    let log = '';
    p.stderr.on('data', (d) => { log += String(d); });
    p.on('close', () => resolve(speechEndFromLog(log, durationSec)));
  });
}
