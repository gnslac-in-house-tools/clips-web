/** Inicio de cada escena en fotogramas: la anterior menos el traslape del fundido (igual que TransitionSeries). */
export function frameOffsets(frames: number[], transitionFrames: number): number[] {
  const out: number[] = [];
  let t = 0;
  for (const f of frames) { out.push(t); t += f - transitionFrames; }
  return out;
}

const sec = (frames: number, fps: number) => Number((frames / fps).toFixed(4));

/**
 * filter_complex para unir los clips por escena: xfade encadenado para el video y, para el audio,
 * cada escena desplazada a su offset más la cama (música + whooshes), que va como última entrada.
 */
export function assembleFilter(frames: number[], fps: number, transitionFrames: number): string {
  const offsets = frameOffsets(frames, transitionFrames);
  const d = sec(transitionFrames, fps);
  const lines: string[] = [];
  let v = '[0:v]';
  for (let i = 1; i < frames.length; i++) {
    lines.push(`${v}[${i}:v]xfade=transition=fade:duration=${d}:offset=${sec(offsets[i]!, fps)}[v${i}]`);
    v = `[v${i}]`;
  }
  lines.push(`${v}format=yuv420p[vout]`);
  frames.forEach((_, i) => lines.push(i === 0 ? '[0:a]anull[a0]' : `[${i}:a]adelay=${Math.round((offsets[i]! / fps) * 1000)}:all=1[a${i}]`));
  const bed = frames.length;
  lines.push(`${frames.map((_, i) => `[a${i}]`).join('')}[${bed}:a]amix=inputs=${frames.length + 1}:normalize=0:duration=longest[aout]`);
  return lines.join(';\n');
}

/** Fuentes que afectan el render de una escena: todo src/ salvo las carpetas de las otras escenas y los tests. */
export function sourcesFor(sceneId: string, files: string[]): string[] {
  return files.filter((f) => {
    if (f.endsWith('.test.ts')) return false;
    const m = /^src\/scenes\/([^/]+)\//.exec(f);
    return !m || m[1] === sceneId;
  });
}
