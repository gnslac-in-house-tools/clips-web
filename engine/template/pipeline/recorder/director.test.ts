import { describe, expect, it, vi } from 'vitest';
import { Director, type Clock } from './director';
import { buildTimeline } from '../../src/core/timeline';
import type { SceneMeta } from '../../src/core/types';

function fakeClock(): Clock & { advance(sec: number): void } {
  let t = 1000;
  return { now: () => t, sleep: async (ms) => { t += ms / 1000; }, advance(sec) { t += sec; } };
}

function fakePage() {
  const mouse = { move: vi.fn(async () => {}), down: vi.fn(async () => {}), up: vi.fn(async () => {}) };
  return { mouse, keyboard: { press: vi.fn(async () => {}) } } as never;
}

const meta: SceneMeta = { id: 's', title: 'S', register: 'live', step: 'input', leadIn: 1, segments: [{ id: 'a', text: 'uno dos tres cuatro cinco.' }, { id: 'b', text: 'seis siete.' }] };

describe('Director', () => {
  it('cue espera hasta el inicio del segmento', async () => {
    const clock = fakeClock();
    const d = new Director(fakePage(), buildTimeline(meta), clock);
    d.start();
    await d.cue('a');
    expect(d.t()).toBeCloseTo(1);
    expect(d.maxLag()).toBe(0);
  });
  it('registra el retraso si la acción anterior se pasó del cue', async () => {
    const clock = fakeClock();
    const tl = buildTimeline(meta);
    const d = new Director(fakePage(), tl, clock);
    d.start();
    clock.advance(tl.segments[1]!.startSec + 0.5);
    await d.cue('b');
    expect(d.maxLag()).toBeCloseTo(0.5);
    expect(d.lags[0]!.cue).toBe('b+0');
  });
  it('click registra evento con caja y la trayectoria del mouse', async () => {
    const clock = fakeClock();
    const d = new Director(fakePage(), buildTimeline(meta), clock);
    d.start();
    await d.click('btn', { x: 500, y: 300 }, { dur: 0.5 });
    const e = d.events.find((x) => x.id === 'btn')!;
    expect(e.kind).toBe('click');
    expect(e.endSec).toBeGreaterThan(e.tSec);
    expect(d.mouse.at(-1)).toMatchObject({ x: 500, y: 300 });
  });
  it('un movimiento respeta su duración aunque cada mouse.move sea lento', async () => {
    const clock = fakeClock();
    const slowMove = vi.fn(async () => { clock.advance(0.04); });
    const page = { mouse: { move: slowMove, down: vi.fn(async () => {}), up: vi.fn(async () => {}) }, keyboard: { press: vi.fn(async () => {}) } } as never;
    const d = new Director(page, buildTimeline(meta), clock);
    d.start();
    await d.move({ x: 800, y: 400 }, 1.0);
    expect(d.t()).toBeLessThan(1.1);
    expect(d.mouse.at(-1)).toMatchObject({ x: 800, y: 400 });
  });
  it('drag con approach corto no gasta tiempo en acercarse', async () => {
    const clock = fakeClock();
    const d = new Director(fakePage(), buildTimeline(meta), clock);
    d.start();
    await d.drag('g', { x: 100, y: 100 }, { x: 300, y: 100 }, { dur: 0.5, approach: 0.1 });
    expect(d.t()).toBeLessThan(0.8);
  });
  it('ids de evento repetidos lanzan', async () => {
    const d = new Director(fakePage(), buildTimeline(meta), fakeClock());
    d.start();
    await d.mark('x', { x: 1, y: 1 });
    await expect(d.mark('x', { x: 1, y: 1 })).rejects.toThrow(/x/);
  });
});
