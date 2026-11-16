/**
 * Escalera de render, de barato a caro (cada peldaño necesita la aprobación del anterior):
 *   sketch  640×360 a 15 fps, ESTÁTICO, capturas fijas: boceto estúpidamente ligero tras el tablero de frames
 *   animatic 720p30 ESTÁTICO con voz real y capturas fijas: valida sincronía antes de animar o grabar
 *   pilot   720p30: la toma piloto (captura y cursor); los 60 fps quedan solo para el máster
 *   scene   720p30, animación completa: la escena piloto de animación y luego cada una de las demás
 *   draft   720p30: borrador completo con voz, tomas y música
 *   final   1080p60 (2k/4k solo si se piden)
 */
export const PRESETS = {
  sketch: { scale: 1 / 3, fps: 15, label: '360p15', crf: 30, liveStills: true, estatico: true },
  animatic: { scale: 2 / 3, fps: 30, label: '720p30', crf: 10, liveStills: true, estatico: true },
  draft: { scale: 2 / 3, fps: 30, label: '720p30', crf: 10, liveStills: false, estatico: false },
  pilot: { scale: 2 / 3, fps: 30, label: '720p30', crf: 10, liveStills: false, estatico: false },
  scene: { scale: 2 / 3, fps: 30, label: '720p30', crf: 10, liveStills: false, estatico: false },
  final: { scale: 1, fps: 60, label: '1080p60', crf: 10, liveStills: false, estatico: false },
  '2k': { scale: 4 / 3, fps: 60, label: '1440p60', crf: 10, liveStills: false, estatico: false },
  '4k': { scale: 2, fps: 60, label: '2160p60', crf: 10, liveStills: false, estatico: false },
} as const;
export type Preset = (typeof PRESETS)[keyof typeof PRESETS];

/** Etiqueta de calidad que entra en la llave de caché: un clip de un peldaño nunca se reutiliza en otro. */
export const qualityTag = (p: Preset) => `scale${p.scale.toFixed(4)}-fps${p.fps}-crf${p.crf}${p.liveStills ? '-stills' : ''}${p.estatico ? '-estatico' : ''}`;
