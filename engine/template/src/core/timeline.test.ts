import { describe, expect, it } from 'vitest';
import { buildTimeline, estimateSec, sceneOffsets, segmentStart, totalDuration } from './timeline';
import type { SceneMeta } from './types';

const meta: SceneMeta = {
  id: 's', title: 'S', register: 'motion', leadIn: 1, tail: 2,
  segments: [
    { id: 'a', text: 'uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece.' },
    { id: 'b', text: 'uno dos.', pauseAfter: 1 },
  ],
};

describe('buildTimeline', () => {
  it('sin manifest usa estimaciones y encadena con pausas', () => {
    const tl = buildTimeline(meta, null);
    const [a, b] = tl.segments;
    expect(a!.startSec).toBe(1);
    expect(a!.endSec).toBeCloseTo(1 + estimateSec(meta.segments[0]!.text));
    expect(b!.startSec).toBeCloseTo(a!.endSec + 0.45);
    expect(tl.durationSec).toBeCloseTo(b!.endSec + 2);
    expect(a!.estimated).toBe(true);
  });
  it('usa la duración real del manifest cuando el texto coincide', () => {
    const tl = buildTimeline(meta, {
      's/a': { key: 'k', text: meta.segments[0]!.text, file: 'generated/voice/s/a.mp3', durationSec: 3, alignment: null },
    });
    expect(tl.segments[0]!.endSec).toBe(4);
    expect(tl.segments[0]!.file).toBe('generated/voice/s/a.mp3');
    expect(tl.segments[0]!.estimated).toBe(false);
  });
  it('corta el silencio final: la frase termina donde termina el habla', () => {
    const tl = buildTimeline(meta, {
      's/a': { key: 'k', text: meta.segments[0]!.text, file: 'generated/voice/s/a.mp3', durationSec: 3, speechEndSec: 2.4, alignment: null },
    });
    expect(tl.segments[0]!.endSec).toBeCloseTo(1 + 2.4);
    expect(tl.segments[1]!.startSec).toBeCloseTo(1 + 2.4 + 0.45);
  });
  it('ignora una entrada del manifest si el texto cambió (voz vieja)', () => {
    const tl = buildTimeline(meta, {
      's/a': { key: 'k', text: 'texto viejo.', file: 'x.mp3', durationSec: 3, alignment: null },
    });
    expect(tl.segments[0]!.file).toBeNull();
    expect(tl.segments[0]!.estimated).toBe(true);
  });
  it('segmentStart lanza con los ids disponibles si no existe', () => {
    expect(() => segmentStart(buildTimeline(meta), 'z')).toThrow(/a, b/);
  });
});

describe('offsets del video completo', () => {
  it('descuenta el traslape de las transiciones', () => {
    expect(sceneOffsets([10, 20, 5], 0.5)).toEqual([0, 9.5, 29]);
    expect(totalDuration([10, 20, 5], 0.5)).toBe(34);
  });
});

describe('quantizeSec', () => {
  it('redondea hacia arriba al fotograma, como la duración de cada Sequence', async () => {
    const { quantizeSec } = await import('./timeline');
    expect(quantizeSec(10.001, 60)).toBeCloseTo(601 / 60);
    expect(quantizeSec(10, 60)).toBe(10);
  });
});
