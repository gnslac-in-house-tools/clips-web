import { copyFile, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { metasInOrder } from '../src/scenes/metas';
import { toSpoken } from '../src/core/pronounce';
import type { VoiceManifest } from '../src/core/timeline';
import { VOICE } from '../src/video.config';
import { ttsWithTimestamps } from './eleven';
import { supportsContext, voiceKey } from './voiceKey';
import { probeDurationSec } from './ffprobe';
import { MASTER_VERSION, masterVoice, arranqueDb } from './voiceMaster';

const MANIFEST = 'public/generated/voice-manifest.json';
const exists = (p: string) => access(p).then(() => true, () => false);

/**
 * ¿La frase pudo llegar cortada desde la API? eleven_v3 casi nunca deja silencio al final, así que un final seco es
 * normal (voiceMaster lo resuelve); sospechosa es la voz **sostenida** hasta el último instante: los últimos 50 ms y
 * los 100 ms anteriores por encima de −32 dB. Es un aviso para oírla, no una certeza: no gasta créditos sola.
 */
export function finalCortado(mp3: string): boolean {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-sseof', '-0.15', '-i', mp3, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], { maxBuffer: 1 << 20 });
  const buf = r.stdout as Buffer;
  if (!buf || buf.length < 4800) return false;
  const db = (from: number, to: number) => {
    let sum = 0; let n = 0;
    for (let i = from; i + 1 < to; i += 2) { const v = buf.readInt16LE(i); sum += v * v; n++; }
    return 10 * Math.log10(sum / Math.max(1, n) / 32768 ** 2 + 1e-12);
  };
  const ult50 = db(buf.length - 1600, buf.length);
  const antes = db(buf.length - 4800, buf.length - 1600);
  return ult50 > -32 && antes > -32;
}
/**
 * Arranque (dB RMS del primer medio segundo sobre el resto) a partir del cual se avisa «óyelo». SOLO AVISO: la toma
 * nunca se repite en automático. Antes se repetía hasta 4 veces y un guion de 2,340 caracteres gastó ~10,170
 * (video anterior). Regla del usuario: una toma por frase; el plan cobra exactamente lo que dice.
 */
const ARRANQUE_MAX_DB = 2;

async function main() {
  if (!VOICE.voiceId) throw new Error('VOICE.voiceId está vacío en src/video.config.ts: elige la voz con npm run voices:cast');
  // --plan: ensayo sin API. Dice qué frases se generarían y cuántos caracteres gastarían; no escribe nada.
  const plan = process.argv.includes('--plan');
  // --reintentar-cortadas: vuelve a generar, UNA toma cada una, las frases en caché cuyo final llegó cortado (gasta
  // créditos: córrelo solo con el sí del usuario y después de oírlas).
  const reintentar = process.argv.includes('--reintentar-cortadas');
  const toGenerate: { id: string; chars: number }[] = [];
  const cortadas: { id: string; chars: number }[] = [];
  const only = process.argv.includes('--scene') ? process.argv[process.argv.indexOf('--scene') + 1] : undefined;
  const manifest: VoiceManifest = (await exists(MANIFEST)) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {};
  let generated = 0;
  for (const meta of metasInOrder()) {
    if (only && meta.id !== only) continue;
    for (const [i, seg] of meta.segments.entries()) {
      const spoken = toSpoken(seg.text);
      const key = voiceKey(spoken, VOICE);
      const mp3 = join('cache/voice', `${key}.mp3`);
      const alignFile = join('cache/voice', `${key}.json`);
      const id = `${meta.id}/${seg.id}`;
      const enCache = await exists(mp3);
      const cortada = enCache && finalCortado(mp3);
      if (plan) {
        if (!enCache) toGenerate.push({ id, chars: spoken.length });
        else if (cortada) cortadas.push({ id, chars: spoken.length });
        continue;
      }
      if (cortada && !reintentar) console.warn(`  ⚠ ${id}: final sospechoso (voz sostenida hasta el último instante). Óyelo; si se oye cortado: npm run voice -- --reintentar-cortadas`);
      if (!enCache || (cortada && reintentar)) {
        await mkdir('cache/voice', { recursive: true });
        // Una sola toma por frase, siempre. Arranque fuerte o final sospechoso solo se avisan («óyelo»): regenerar una
        // frase es decisión del usuario, frase por frase. Nada se corrige con ganancia ni EQ.
        const { audio, alignment } = await ttsWithTimestamps(VOICE.voiceId, {
          text: spoken,
          model_id: VOICE.modelId,
          voice_settings: VOICE.settings,
          ...(supportsContext(VOICE.modelId) ? {
            previous_text: meta.segments[i - 1] ? toSpoken(meta.segments[i - 1]!.text) : undefined,
            next_text: meta.segments[i + 1] ? toSpoken(meta.segments[i + 1]!.text) : undefined,
          } : {}),
        }, VOICE.outputFormat);
        generated++;
        await writeFile(mp3, audio);
        await writeFile(alignFile, JSON.stringify(alignment));
        const arranque = await arranqueDb(mp3);
        const sospecha = finalCortado(mp3);
        console.log(`  ✓ ${id} · arranque ${arranque >= 0 ? '+' : ''}${arranque.toFixed(1)} dB${arranque > ARRANQUE_MAX_DB ? ' ⚠ arranque fuerte: óyelo' : ''}${sospecha ? ' · ⚠ final sospechoso: óyelo' : ''}`);
      }
      // Lo que suena es la frase limpia (sin ruido, con cola suave, al mismo nivel que las demás).
      // Su fin del habla y su duración son los del archivo limpio, que es el que se reproduce.
      const master = join('cache/voice', `${key}.m${MASTER_VERSION}.wav`);
      const { speechEndSec: cleanSpeechEnd } = await masterVoice(mp3, master);
      const publicFile = `generated/voice/${meta.id}/${seg.id}.wav`;
      await mkdir(dirname(join('public', publicFile)), { recursive: true });
      await copyFile(master, join('public', publicFile));
      const durationSec = await probeDurationSec(master);
      manifest[`${meta.id}/${seg.id}`] = {
        key, text: seg.text, file: publicFile, durationSec,
        speechEndSec: Math.min(durationSec, cleanSpeechEnd),
        alignment: JSON.parse(await readFile(alignFile, 'utf8')),
      };
    }
  }
  if (plan) {
    const chars = toGenerate.reduce((n, s) => n + s.chars, 0);
    for (const s of toGenerate) console.log(`  + ${s.id} (${s.chars} caracteres)`);
    console.log(toGenerate.length
      ? `Plan: ${toGenerate.length} frase(s) nuevas, ~${chars} caracteres de crédito. El resto sale de la caché.`
      : 'Plan: nada que generar, todo sale de la caché (0 créditos).');
    if (cortadas.length) {
      for (const s of cortadas) console.log(`  ⚠ ${s.id}: final sospechoso (${s.chars} caracteres)`);
      console.log(`Finales sospechosos: ${cortadas.length}, ~${cortadas.reduce((n, s) => n + s.chars, 0)} caracteres si se regeneran (una toma cada una, solo con --reintentar-cortadas).`);
    }
    return;
  }
  await mkdir(dirname(MANIFEST), { recursive: true });
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`Voz lista: ${generated} segmento(s) nuevos, el resto desde caché.`);
}

main().catch((e) => { console.error(String(e)); process.exit(1); });
