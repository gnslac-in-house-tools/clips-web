import { spawn } from 'node:child_process';

/**
 * Argumentos de ffmpeg para el intermedio de una toma: 60 fps constantes a la resolución de captura (viewport × DPR).
 * Cuadro clave cada 0.5 s y sin cuadros B: Remotion (OffthreadVideo) busca cada cuadro sin decodificar cientos de
 * cuadros 4K hacia atrás; con el GOP por defecto (~4 s) el render completo fallaba con «No frame found at position…»
 * y con timeouts de delayRender. Rango de video estándar: las capturas JPEG dejaban el archivo en yuvj420p.
 */
export function encodeArgs(input: string, outFile: string, dpr = 2, viewport = { width: 1920, height: 1080 }, concat = true): string[] {
  const w = Math.round(viewport.width * dpr / 2) * 2;
  const h = Math.round(viewport.height * dpr / 2) * 2;
  return ['-y', ...(concat ? ['-f', 'concat', '-safe', '0'] : []), '-i', input,
    '-vf', `fps=60,scale=${w}:${h}:flags=lanczos:out_range=tv,format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-g', '30', '-bf', '0', '-color_range', 'tv', '-movflags', '+faststart', outFile];
}

const run = (args: string[]) => new Promise<void>((resolve, reject) => {
  const p = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let err = '';
  p.stderr.on('data', (d) => { err += String(d); });
  p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg salió con ${code}:\n${err.slice(-1500)}`))));
});

/** Frames del screencast → intermedio de la toma. */
export function encodeFrames(listFile: string, outFile: string, dpr = 2, viewport = { width: 1920, height: 1080 }): Promise<void> {
  return run(encodeArgs(listFile, outFile, dpr, viewport));
}

/** Re-codifica una toma ya grabada con los mismos parámetros (sin volver a grabar). */
export function reencodeTake(inFile: string, outFile: string, dpr = 2, viewport = { width: 1920, height: 1080 }): Promise<void> {
  return run(encodeArgs(inFile, outFile, dpr, viewport, false));
}
