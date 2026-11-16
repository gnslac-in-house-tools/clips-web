export type Register = 'motion' | 'live' | 'vision';

export interface Segment {
  id: string;
  text: string;
  /** Silencio después del segmento, en segundos. */
  pauseAfter?: number;
}

export interface SceneMeta {
  id: string;
  title: string;
  /** Marca de capítulo; solo la primera escena del capítulo la muestra. */
  chapter?: string;
  register: Register;
  /** Vista o paso de la app donde arranca una escena En vivo (lo resuelve goToStep en pipeline/app.ts). */
  step?: string;
  /** Dispositivo de la captura En vivo: 'phone' graba en vertical (CAPTURE.phone) y se muestra dentro de un teléfono. */
  device?: 'desktop' | 'phone';
  segments: Segment[];
  /** Silencio antes de la primera voz, en segundos. */
  leadIn?: number;
  /** Tiempo después de la última voz, en segundos. */
  tail?: number;
}
