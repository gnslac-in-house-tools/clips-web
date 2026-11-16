import { createHash } from 'node:crypto';
import type { VOICE } from '../src/video.config';

/**
 * Llave de caché del audio. No incluye previous_text/next_text a propósito:
 * cambiar un segmento vecino no obliga a regenerar este.
 */
export function voiceKey(spoken: string, voice: typeof VOICE): string {
  const payload = JSON.stringify({ t: spoken, v: voice.voiceId, m: voice.modelId, f: voice.outputFormat, s: voice.settings });
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

/** Solo los modelos v2 aceptan el contexto de la frase anterior/siguiente (el v3 lo rechaza con 400). */
export const supportsContext = (modelId: string) => !modelId.startsWith('eleven_v3');
