import { describe, expect, it } from 'vitest';
import { mouseAt } from './cursor';

const mouse = [
  { tSec: 1, x: 0, y: 0, down: false },
  { tSec: 2, x: 100, y: 50, down: true },
];

describe('mouseAt', () => {
  it('invisible antes del primer punto', () => expect(mouseAt(mouse, 0.5).visible).toBe(false));
  it('interpola entre puntos', () => expect(mouseAt(mouse, 1.5)).toMatchObject({ x: 50, y: 25, visible: true }));
  it('se queda en el último punto', () => expect(mouseAt(mouse, 9)).toMatchObject({ x: 100, y: 50, down: true }));
  it('lista vacía', () => expect(mouseAt([], 1).visible).toBe(false));
});
