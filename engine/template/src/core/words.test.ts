import { describe, expect, it } from 'vitest';
import { wordStartSec } from './words';
import { toSpoken } from './pronounce';
import type { TimedSegment } from './timeline';

const text = 'Cargas un PDF y su contorno define la zona.';
const spoken = toSpoken(text);
const seg: TimedSegment = {
  id: 'i3', text, startSec: 10, endSec: 10 + spoken.length * 0.05, file: 'x', estimated: false,
  alignment: {
    characters: [...spoken],
    character_start_times_seconds: [...spoken].map((_, i) => i * 0.05),
    character_end_times_seconds: [...spoken].map((_, i) => (i + 1) * 0.05),
  },
};

describe('wordStartSec', () => {
  it('ubica una palabra con la alineación, relativo a la escena', () => {
    expect(wordStartSec(seg, 'contorno')).toBeCloseTo(10 + spoken.indexOf('contorno') * 0.05);
  });
  it('busca las siglas en su forma hablada', () => {
    expect(wordStartSec(seg, 'PDF')).toBeCloseTo(10 + spoken.indexOf(toSpoken('PDF')) * 0.05);
  });
  it('sin alineación estima por posición', () => {
    const est = { ...seg, alignment: null };
    const r = wordStartSec(est, 'zona');
    expect(r).toBeGreaterThan(10);
    expect(r).toBeLessThan(est.endSec);
  });
  it('lanza si la palabra no está', () => {
    expect(() => wordStartSec(seg, 'lockers')).toThrow(/lockers/);
  });
});
