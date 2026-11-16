import { access, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SFX, type SfxName } from '../src/audio/sfx';
import { soundEffect } from './eleven';

async function main() {
  const force = process.argv.includes('--force');
  await mkdir('public/generated/sfx', { recursive: true });
  for (const [name, s] of Object.entries(SFX) as [SfxName, (typeof SFX)[SfxName]][]) {
    const out = join('public', s.file);
    if (!force && (await access(out).then(() => true, () => false))) { console.log(`= ${name} (ya existe)`); continue; }
    await writeFile(out, await soundEffect(s.prompt, s.durationSec));
    console.log(`✓ ${name}`);
  }
}

main().catch((e) => { console.error(String(e)); process.exit(1); });
