import type { SceneMeta } from './types';

/**
 * Revisión de legibilidad del guion para la voz (puro: sin React, Remotion ni Node).
 * La corre `npm run script:check` ANTES de gastar créditos de voz. Lo que no se pronuncia bien se
 * escribe como se dice («3D» → «tercera dimensión»): un guion que se lee bien no siempre se oye bien.
 */
export type Severity = 'error' | 'aviso';
export interface Issue { scene: string; segment: string; severity: Severity; rule: string; detail: string }

const MAX_WORDS = 25;
/** Anglicismos frecuentes que los modelos leen distinto: pruébalos en el casting o escríbelos en español. */
const ANGLICISMS = ['headcount', 'layout', 'dashboard', 'feedback', 'workflow', 'insight', 'score', 'testfit', 'kpi', 'kpis', 'roi', 'input', 'output', 'upload', 'download', 'plugin', 'script', 'framework', 'cloud', 'big data'];
const LETTER = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';

export interface CheckOptions {
  lang?: 'es' | 'en';
  /** Claves ya cubiertas por el diccionario de pronunciación (src/core/pronounce.ts). */
  pronounced?: string[];
}

export function checkScript(metas: SceneMeta[], opts: CheckOptions = {}): Issue[] {
  const lang = opts.lang ?? 'es';
  const known = new Set((opts.pronounced ?? []).map((k) => k.toLowerCase()));
  const out: Issue[] = [];
  for (const m of metas) {
    let yRun = 0;
    for (const s of m.segments) {
      const add = (severity: Severity, rule: string, detail: string) => out.push({ scene: m.id, segment: s.id, severity, rule, detail });
      const t = s.text;
      const words = t.split(/\s+/).filter(Boolean);

      const digit = t.match(/\p{L}*\d[\p{L}\d]*/u);
      if (digit) add('error', 'dígito', `«${digit[0]}»: escríbelo como se dice (tercera dimensión, dos dimensiones, cien, etc.)`);
      const symbol = t.match(/[%&/#@+=<>_*\\|~^$€£]/);
      if (symbol) add('error', 'símbolo', `«${symbol[0]}»: la voz lo lee mal o lo salta; escríbelo con palabras`);
      if (/https?:\/\/|www\.|\.com\b|\.mx\b/i.test(t)) add('error', 'url', 'una dirección no se dicta bien; nómbrala');
      if (!/[.:?!]$/.test(t.trim())) add('error', 'puntuación final', 'cada segmento termina en . ? ! o :');
      if (lang === 'es' && /\?\s*$/.test(t) && !t.includes('¿')) add('error', 'signo de apertura', 'falta «¿» al inicio de la pregunta');
      if (lang === 'es' && /!\s*$/.test(t) && !t.includes('¡')) add('error', 'signo de apertura', 'falta «¡» al inicio de la exclamación');
      if (lang === 'es') {
        const accent = t.match(new RegExp(`\\b[${LETTER}]{3,}(?:cion|sion)\\b`, 'i'));
        if (accent) add('error', 'acento', `«${accent[0]}» parece llevar acento (-ción / -sión en singular)`);
      }

      for (const raw of t.match(new RegExp(`\\b[A-ZÁÉÍÓÚÑ]{2,}\\b`, 'g')) ?? []) {
        if (!known.has(raw.toLowerCase())) add('aviso', 'sigla', `«${raw}»: ¿cómo se pronuncia? Escríbela como se dice o agrégala a pronounce.ts y pruébala en el casting`);
      }
      for (const a of ANGLICISMS) {
        if (new RegExp(`(?<![${LETTER}])${a}(?![${LETTER}])`, 'i').test(t) && !known.has(a)) add('aviso', 'anglicismo', `«${a}»: los modelos lo leen distinto; pruébalo en el casting o di su equivalente`);
      }
      if (/[()[\]{}]/.test(t)) add('aviso', 'paréntesis', 'la voz no distingue paréntesis; usa comas o dos frases');
      if (/["“”«»]/.test(t)) add('aviso', 'comillas', 'las comillas no suenan; si es una cita, introdúcela con palabras');
      if (/[—–]/.test(t)) add('aviso', 'guion largo', 'su pausa es ambigua; usa coma o punto');
      if (/\.\.\.|…/.test(t)) add('aviso', 'puntos suspensivos', 'cambian el ritmo de forma impredecible');
      if (/ {2,}/.test(t)) add('aviso', 'espacios dobles', 'quítalos');
      if (/\s[,;:.?!]/.test(t)) add('aviso', 'espacio antes del signo', 'quita el espacio antes de la puntuación');
      if (new RegExp(`[,;][${LETTER}]`).test(t)) add('aviso', 'falta espacio', 'falta un espacio después de la coma o el punto y coma');
      const dup = t.match(new RegExp(`\\b([${LETTER}]+)\\s+\\1\\b`, 'i'));
      if (dup && dup[1]!.length > 1) add('aviso', 'palabra repetida', `«${dup[0]}»`);
      if (words.length > MAX_WORDS) add('aviso', 'segmento largo', `${words.length} palabras (máx. ${MAX_WORDS}): pártelo en dos frases`);
      if ((t.match(/,/g) ?? []).length >= 4) add('aviso', 'lista larga', 'muchas comas seguidas: más de tres elementos se vuelven ruido en voz');
      yRun = /^(Y|And)\s/.test(t) ? yRun + 1 : 0;
      if (yRun === 3) add('aviso', 'muchas «Y»', 'tres frases seguidas empiezan con «Y»');
    }
  }
  return out;
}

/** Palabras totales del guion, para compararlas con el objetivo de duración (≈ 2.5 palabras/s, conservador). */
export const wordCount = (metas: SceneMeta[]) => metas.reduce((n, m) => n + m.segments.reduce((k, s) => k + s.text.split(/\s+/).filter(Boolean).length, 0), 0);
