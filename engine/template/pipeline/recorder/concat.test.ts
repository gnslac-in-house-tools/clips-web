import { describe, expect, it } from 'vitest';
import { buildConcatList } from './concat';

const durations = (list: string) => [...list.matchAll(/^duration ([\d.]+)$/gm)].map((m) => Number(m[1]));

describe('buildConcatList', () => {
  it('con frames escasos cubre exactamente tEnd − t0 y repite el último', () => {
    const list = buildConcatList([{ file: 'a.jpg', ts: 99 }, { file: 'b.jpg', ts: 105 }], 100, 110);
    expect(durations(list).reduce((s, d) => s + d, 0)).toBeCloseTo(10);
    expect(list.trim().split('\n').at(-1)).toBe("file 'b.jpg'");
    expect(list.startsWith("file 'a.jpg'")).toBe(true);
  });
  it('descarta frames posteriores a tEnd', () => {
    const list = buildConcatList([{ file: 'a.jpg', ts: 100 }, { file: 'z.jpg', ts: 200 }], 100, 101);
    expect(list).not.toContain('z.jpg');
    expect(durations(list)).toEqual([1]);
  });
  it('sin frames lanza', () => {
    expect(() => buildConcatList([], 0, 1)).toThrow(/frames/);
  });
});
