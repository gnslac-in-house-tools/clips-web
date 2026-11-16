import { describe, expect, it } from 'vitest';
import { resolveBeats, resolveRect, resolveTime, endBy } from './beats';
import { buildTimeline } from './timeline';
import type { Recording } from './events';
import type { SceneMeta } from './types';

const meta: SceneMeta = { id: 's', title: 'S', register: 'live', step: 'input', leadIn: 1, segments: [{ id: 'a', text: 'hola mundo bonito.' }] };
const tl = buildTimeline(meta);
const rec: Recording = {
  sceneId: 's', video: 'v.mp4', durationSec: 10, viewport: { w: 1920, h: 1080 }, mouse: [], maxLagSec: 0,
  events: [
    { id: 'e1', kind: 'click', tSec: 3, endSec: 4, rect: { x: 10, y: 10, w: 100, h: 50 } },
    { id: 'e2', kind: 'mark', tSec: 5, endSec: 5, rect: { x: 300, y: 300, w: 10, h: 10 } },
  ],
};

describe('resolveTime', () => {
  it('segmento, palabra, evento y segundos', () => {
    expect(resolveTime({ segment: 'a' }, tl, rec)).toBe(1);
    expect(resolveTime({ segment: 'a', edge: 'end', offset: 1 }, tl, rec)).toBeCloseTo(tl.segments[0]!.endSec + 1);
    expect(resolveTime({ event: 'e1', edge: 'end' }, tl, rec)).toBe(4);
    expect(resolveTime({ sec: 7 }, tl, rec)).toBe(7);
    expect(resolveTime({ word: 'mundo', segment: 'a' }, tl, rec)).toBeGreaterThan(1);
  });
  it('evento inexistente o sin grabación → null (no lanza)', () => {
    expect(resolveTime({ event: 'nope' }, tl, rec)).toBeNull();
    expect(resolveTime({ event: 'e1' }, tl, null)).toBeNull();
  });
});

describe('resolveRect', () => {
  it('une varias cajas y aplica padding', () => {
    expect(resolveRect({ events: ['e1', 'e2'], pad: 10 }, rec)).toEqual({ x: 0, y: 0, w: 320, h: 320 });
  });
  it('evento sin caja → null', () => {
    expect(resolveRect({ event: 'nope' }, rec)).toBeNull();
  });
});

describe('resolveBeats · duración mínima', () => {
  it('un spotlight o callout cuyo until cae antes de su at dura al menos 0.6 s', () => {
    const out = resolveBeats([
      { kind: 'spotlight', at: { event: 'e2' }, until: { event: 'e1' }, target: { event: 'e2' } },
      { kind: 'callout', at: { event: 'e2' }, until: { sec: 5.1 }, target: { event: 'e2' }, text: 'x' },
    ], tl, rec);
    for (const b of out) if (b.kind === 'spotlight' || b.kind === 'callout') expect(b.untilSec).toBeGreaterThanOrEqual(b.atSec + 0.6);
  });
});

describe('resolveBeats', () => {
  it('omite los beats sin resolver y ordena por tiempo', () => {
    const out = resolveBeats([
      { kind: 'zoom', at: { event: 'e2' }, target: { event: 'e2' } },
      { kind: 'zoom', at: { event: 'nope' }, target: 'full' },
      { kind: 'zoom', at: { event: 'e1' }, target: { event: 'e1' } },
    ], tl, rec);
    expect(out.map((b) => b.atSec)).toEqual([3, 5]);
  });
});

describe('endBy', () => {
  const rect = { x: 0, y: 0, w: 10, h: 10 };
  it('recorta spotlights y callouts que siguen activos en el cierre de la escena', () => {
    const out = endBy([{ kind: 'spotlight', atSec: 2, untilSec: 20, rect }, { kind: 'callout', atSec: 3, untilSec: 20, rect, text: 't', side: 'top' }], 15);
    expect(out.map((b) => (b.kind === 'spotlight' || b.kind === 'callout' ? b.untilSec : null))).toEqual([15, 15]);
  });
  it('descarta los que empezarían después del cierre y no toca zooms ni sfx', () => {
    const out = endBy([{ kind: 'spotlight', atSec: 16, untilSec: 20, rect }, { kind: 'zoom', atSec: 17, rect, zoom: 2 }], 15);
    expect(out).toEqual([{ kind: 'zoom', atSec: 17, rect, zoom: 2 }]);
  });
});
