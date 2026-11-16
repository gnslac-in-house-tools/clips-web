import { mkdir, writeFile } from 'node:fs/promises';
import { metasInOrder } from '../src/scenes/metas';
import { toSpoken } from '../src/core/pronounce';
import { VOICE } from '../src/video.config';
import { addSharedVoice, listVoices, ttsWithTimestamps } from './eleven';

/**
 * Casting: la misma muestra del guion real con varias voces (o ajustes) → out/casting/.
 * La muestra son las dos frases más largas del guion: ahí se oye la naturalidad y los términos técnicos.
 *
 * Uso: npm run voices:cast -- --ids isabel:id1,maria:owner/id2 [--con "Término,Otro"] [--model eleven_v3|eleven_multilingual_v2] [--speed 1.1] [--stability 0.5]
 * `owner/id` agrega la voz de la biblioteca compartida a la cuenta (una vez) antes de usarla.
 * `nombre:` antes del id pone el nombre de la voz en el archivo (`isabel-<id>-eleven_v3.mp3`); sin él se usa el nombre
 * de la cuenta («v3-Isabel» → «isabel»). Las voces de la biblioteca entran a la cuenta como `casting-<id>`, así que
 * para ellas el nombre se pasa siempre.
 */
/** «v3-María de Jesús» → «maria-de-jesus». */
const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/^(v[23]|casting|cast)-/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const arg = (name: string) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined);

async function main() {
  const ids = arg('--ids');
  if (!ids) throw new Error('Uso: npm run voices:cast -- --ids id1,owner/id2,id3 [--model …] [--speed …] [--stability …]');
  const model = arg('--model') ?? VOICE.modelId;
  const settings: Record<string, number | boolean> = { ...VOICE.settings };
  if (arg('--speed')) settings.speed = Number(arg('--speed'));
  if (arg('--stability')) settings.stability = Number(arg('--stability'));
  const textos = metasInOrder().flatMap((m) => m.segments).map((s) => s.text);
  const largas = [...textos].sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length).slice(0, 2);
  // --con "Término1,Término2": suma la primera frase que contenga cada término dudoso (se oye antes de decidir)
  const terminos = (arg('--con') ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const dudosas = terminos.map((term) => textos.find((tx) => tx.toLowerCase().includes(term))).filter((tx): tx is string => Boolean(tx) && !largas.includes(tx!));
  const sample = [...dudosas, ...largas].join(' ');
  await mkdir('out/casting', { recursive: true });
  const mine = await listVoices();
  for (const entrada of ids.split(',')) {
    const [label, raw] = entrada.includes(':') ? entrada.split(':') as [string, string] : [null, entrada];
    const [owner, shared] = raw.includes('/') ? raw.split('/') as [string, string] : [null, raw];
    const slot = `casting-${shared}`;
    const voiceId = owner ? (mine.find((v) => v.name === slot)?.voice_id ?? (await addSharedVoice(owner, shared, slot))) : shared;
    try {
      const { audio } = await ttsWithTimestamps(voiceId, { text: toSpoken(sample), model_id: model, voice_settings: settings }, VOICE.outputFormat);
      const cuenta = mine.find((v) => v.voice_id === voiceId)?.name;
      const nombre = slug(label ?? (cuenta && !cuenta.startsWith('casting-') ? cuenta : '') ?? '') || 'voz';
      const file = `out/casting/${nombre}-${voiceId}-${model}${settings.speed ? `-speed${settings.speed}` : ''}.mp3`;
      await writeFile(file, audio);
      console.log(`✓ ${file}`);
    } catch (e) {
      console.log(`✗ ${voiceId}: ${String(e).slice(0, 200)}`);
    }
  }
  console.log(`\nMuestra: "${sample}"`);
}

main().catch((e) => { console.error(String(e)); process.exit(1); });
