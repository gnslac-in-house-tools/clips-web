import { describe, expect, it } from 'vitest';
import { center, sliderX } from './geometry';

describe('sliderX', () => {
  const rect = { x: 100, y: 0, w: 216, h: 20 };
  it('mapea min y max a los centros del thumb en los extremos', () => {
    expect(sliderX(rect, 0, 0, 10)).toBe(108);
    expect(sliderX(rect, 10, 0, 10)).toBe(308);
    expect(sliderX(rect, 5, 0, 10)).toBe(208);
  });
});

describe('center', () => {
  it('centro de la caja', () => expect(center({ x: 10, y: 20, w: 100, h: 40 })).toEqual({ x: 60, y: 40 }));
});
