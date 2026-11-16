import { describe, expect, it } from 'vitest';
import { humanPath } from './mouse';

describe('humanPath', () => {
  const path = humanPath({ x: 0, y: 0 }, { x: 600, y: 200 }, 1, 60);
  it('empieza y termina exactamente', () => {
    expect(path[0]).toMatchObject({ x: 0, y: 0, t: 0 });
    expect(path.at(-1)).toMatchObject({ x: 600, y: 200, t: 1 });
  });
  it('tiempo monótono y un punto por frame', () => {
    expect(path.length).toBe(61);
    for (let i = 1; i < path.length; i++) expect(path[i]!.t).toBeGreaterThan(path[i - 1]!.t);
  });
  it('se curva levemente (no es una recta)', () => {
    const mid = path[30]!;
    expect(Math.abs(mid.y - mid.x / 3)).toBeGreaterThan(5);
  });
});
