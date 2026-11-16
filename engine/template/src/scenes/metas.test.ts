import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { META, metasInOrder } from './metas';
import { ALLOWED_DIGIT_TOKENS, BRAND, CUTS, FLAGS, SCENE_ORDER, TARGET, cutFromArgs, cutSlug } from '../video.config';
import { buildTimeline, totalDuration } from '../core/timeline';

const all = () => metasInOrder();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ALLOWED = new RegExp(`\\b(${ALLOWED_DIGIT_TOKENS.map(escape).join('|')})\\b`, 'g');

describe('guion', () => {
  it('cada id de SCENE_ORDER tiene metadatos y coincide con su id', () => {
    for (const id of SCENE_ORDER) expect(META[id]?.id).toBe(id);
  });
  it('ids de segmento únicos en todo el video', () => {
    const ids = all().flatMap((m) => m.segments.map((s) => s.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('el cierre es siempre la última escena y el logo de Gensler existe', () => {
    expect(SCENE_ORDER.at(-1)).toBe('close');
    expect(existsSync(`public/${BRAND.primary}`), `falta public/${BRAND.primary} (lo copia el scaffold desde 01. Videos/_kit/brand)`).toBe(true);
  });
  it('sin cifras: ningún dígito salvo las siglas permitidas, ningún %', () => {
    for (const m of all()) for (const s of m.segments) {
      expect(s.text.replace(ALLOWED, ''), `${m.id}/${s.id}`).not.toMatch(/\d|%/);
    }
  });
  it('cada segmento termina en puntuación', () => {
    for (const m of all()) for (const s of m.segments) expect(s.text, s.id).toMatch(/[.:?!]$/);
  });
  it('las escenas En vivo declaran el paso de la app', () => {
    for (const m of all()) if (m.register === 'live') expect(m.step, m.id).toBeDefined();
  });
  it('el video estimado no se pasa del máximo (la duración real la controla npm run qa)', () => {
    const durations = all().map((m) => buildTimeline(m).durationSec);
    expect(totalDuration(durations, FLAGS.transitionSec)).toBeLessThanOrEqual(TARGET.maxSec + 15);
  });
});

describe('cortes', () => {
  it('cada corte es un subconjunto de SCENE_ORDER en el mismo orden, con apertura y cierre', () => {
    for (const [name, order] of Object.entries(CUTS)) {
      const idx = order.map((id) => (SCENE_ORDER as readonly string[]).indexOf(id));
      expect(idx.every((i) => i >= 0), name).toBe(true);
      expect([...idx].sort((a, b) => a - b), name).toEqual(idx);
      expect(order[0], name).toBe(SCENE_ORDER[0]);
      expect(order.at(-1), name).toBe(SCENE_ORDER.at(-1));
    }
    expect(CUTS.full).toEqual([...SCENE_ORDER]);
  });
  it('--cut elige el corte y el nombre de salida; uno desconocido falla', () => {
    expect(cutFromArgs([])).toBe('full');
    expect(cutFromArgs(['--final', '--cut', 'client'])).toBe('client');
    expect(cutSlug('full')).not.toMatch(/-full/);
    expect(cutSlug('client')).toMatch(/-client$/);
    expect(() => cutFromArgs(['--cut', 'nope'])).toThrow(/nope/);
  });
});
