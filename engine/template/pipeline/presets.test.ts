import { describe, expect, it } from 'vitest';
import { PRESETS, qualityTag } from './presets';

describe('PRESETS', () => {
  it('el boceto es el peldaño más ligero: 640×360, 15 fps, sin tomas (capturas fijas)', () => {
    expect(PRESETS.sketch).toMatchObject({ scale: 1 / 3, fps: 15, liveStills: true });
    expect(PRESETS.sketch.crf).toBeGreaterThan(PRESETS.draft.crf);
  });
  it('los peldaños suben de calidad en orden: boceto < borrador < máster', () => {
    const order = [PRESETS.sketch, PRESETS.draft, PRESETS.final];
    for (let i = 1; i < order.length; i++) expect(order[i]!.scale * order[i]!.fps).toBeGreaterThan(order[i - 1]!.scale * order[i - 1]!.fps);
  });
  it('la etiqueta de caché distingue boceto y borrador (un clip ligero nunca entra a otro nivel)', () => {
    expect(qualityTag(PRESETS.sketch)).not.toBe(qualityTag(PRESETS.draft));
  });
});

describe('escena suelta', () => {
  it('tomas y escenas se revisan a 720p30; los 60 fps quedan solo para el máster (la calidad nunca sube y baja)', () => {
    expect(PRESETS.scene).toMatchObject({ scale: 2 / 3, fps: 30, estatico: false });
    expect(PRESETS.pilot).toMatchObject({ scale: 2 / 3, fps: 30 });
    expect(PRESETS.final.fps).toBe(60);
  });
});

describe('animatic', () => {
  it('el animatic con voz va a 720p30 con capturas fijas (las tomas llegan después, en el piloto)', () => {
    expect(PRESETS.animatic).toMatchObject({ scale: 2 / 3, fps: 30, liveStills: true });
    expect(qualityTag(PRESETS.animatic)).not.toBe(qualityTag(PRESETS.draft));
  });
});

describe('movimiento', () => {
  it('boceto y animatic son estáticos; animación, borrador y máster llevan la coreografía completa', () => {
    expect(PRESETS.sketch.estatico).toBe(true);
    expect(PRESETS.animatic.estatico).toBe(true);
    for (const p of [PRESETS.scene, PRESETS.draft, PRESETS.final]) expect(p.estatico).toBe(false);
  });
  it('un clip estático nunca se reutiliza como animado (la llave de caché los distingue)', () => {
    expect(qualityTag(PRESETS.animatic)).toMatch(/estatico/);
    expect(qualityTag(PRESETS.scene)).not.toMatch(/estatico/);
  });
});
