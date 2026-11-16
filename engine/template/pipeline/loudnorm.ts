/**
 * Filtro de la segunda pasada de loudnorm (lineal) a partir de la medición de la primera. Si el audio está en silencio
 * (borrador sin voz ni música: input_i = -inf) loudnorm no acepta la medición; se deja el audio igual.
 */
export function linearLoudnormFilter(m: Record<string, string>): string {
  if (!Number.isFinite(Number(m.input_i))) return 'aresample=48000';
  return `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
}
