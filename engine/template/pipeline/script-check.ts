import { metasInOrder } from '../src/scenes/metas';
import { checkScript, wordCount } from '../src/core/scriptcheck';
import { buildTimeline, totalDuration } from '../src/core/timeline';
import { PRONOUNCE } from '../src/core/pronounce';
import { FLAGS, PROJECT, TARGET } from '../src/video.config';

/**
 * Revisión de legibilidad del guion antes de generar voz (`npm run script:check`).
 * No llama a ninguna API ni gasta créditos. Sale con código 1 si hay errores.
 */
const metas = metasInOrder();
const issues = checkScript(metas, { lang: PROJECT.lang, pronounced: Object.keys(PRONOUNCE) });
const errors = issues.filter((i) => i.severity === 'error');
const warnings = issues.filter((i) => i.severity === 'aviso');

for (const i of issues) console.log(`${i.severity === 'error' ? '✗' : '·'} ${i.scene}/${i.segment}  [${i.rule}] ${i.detail}`);

const words = wordCount(metas);
const est = totalDuration(metas.map((m) => buildTimeline(m).durationSec), FLAGS.transitionSec);
const mm = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
console.log(`\n${words} palabras · duración estimada ${mm(est)} (objetivo ${mm(TARGET.goalSec)}, rango ${mm(TARGET.minSec)}–${mm(TARGET.maxSec)}; la real depende de la voz)`);
if (est < TARGET.minSec || est > TARGET.maxSec) console.log('· la estimación sale del rango objetivo');
console.log(errors.length ? `✗ ${errors.length} error(es) y ${warnings.length} aviso(s): corrígelos antes de generar voz` : `✓ sin errores (${warnings.length} aviso(s) para revisar de oído)`);
process.exit(errors.length ? 1 : 0);
