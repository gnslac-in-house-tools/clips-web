import { listVoices, searchSharedVoices } from './eleven';
import { PROJECT } from '../src/video.config';

/**
 * Voces disponibles: las de la cuenta y candidatas de la biblioteca compartida en el idioma del video.
 * Uso: npm run voices:list -- [--gender female|male] [--accent latin american] [--lang es|en]
 */
const arg = (name: string) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined);

async function main() {
  const language = arg('--lang') ?? PROJECT.lang;
  const gender = arg('--gender') ?? 'female';
  const accent = arg('--accent');
  const mine = await listVoices();
  console.log('— Voces en la cuenta —');
  for (const v of mine) console.log(`${v.voice_id}  ${v.name}  ${JSON.stringify(v.labels ?? {})}`);
  const shared = await searchSharedVoices({ language, gender, accent });
  console.log(`\n— Biblioteca compartida (${language}, ${gender}${accent ? `, ${accent}` : ''}, narración) —`);
  for (const v of shared) console.log(`${v.public_owner_id}/${v.voice_id}  ${v.name}  acento=${v.accent ?? '?'}  ${v.description?.slice(0, 80) ?? ''}`);
  console.log('\nSiguiente: npm run voices:cast -- --ids <id>,<owner/id>,… (genera la misma muestra con cada voz).');
}

main().catch((e) => { console.error(String(e)); process.exit(1); });
