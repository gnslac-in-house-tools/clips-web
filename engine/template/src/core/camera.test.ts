import { describe, expect, it } from 'vitest';
import { cameraAt, FULL, stateFor, withSettle } from './camera';

describe('stateFor', () => {
  it('full es escala 1 centrada', () => expect(stateFor('full')).toEqual(FULL));
  it('limita el zoom a [1, 2.2]', () => {
    expect(stateFor({ x: 900, y: 500, w: 10, h: 10 }).scale).toBe(2.2);
    expect(stateFor({ x: 0, y: 0, w: 1900, h: 1000 }).scale).toBe(1);
  });
  it('recorta el centro para no mostrar fuera de la app (elemento en el borde)', () => {
    const s = stateFor({ x: 0, y: 0, w: 200, h: 100 }, 2);
    expect(s.cx).toBe(1920 / 4);
    expect(s.cy).toBe(1080 / 4);
    const e = stateFor({ x: 1800, y: 1000, w: 120, h: 80 }, 2);
    expect(e.cx).toBe(1920 - 1920 / 4);
    expect(e.cy).toBe(1080 - 1080 / 4);
  });
});

describe('cameraAt', () => {
  const a = stateFor({ x: 100, y: 100, w: 300, h: 200 }, 2);
  const shots = [{ atSec: 0, state: FULL }, { atSec: 2, state: a }, { atSec: 2.5, state: FULL }];
  it('antes del primer shot y en reposo', () => {
    expect(cameraAt(1, shots)).toEqual(FULL);
  });
  it('llega al destino después de moveSec', () => {
    expect(cameraAt(2 + 1.2, [shots[0]!, shots[1]!])).toEqual(a);
  });
  it('un shot que interrumpe a otro parte del estado intermedio (sin saltos)', () => {
    const before = cameraAt(2.5 - 1e-6, shots);
    const after = cameraAt(2.5 + 1e-6, shots);
    expect(Math.abs(before.scale - after.scale)).toBeLessThan(1e-3);
    expect(Math.abs(before.cx - after.cx)).toBeLessThan(0.5);
  });
});

describe('withSettle', () => {
  const a = stateFor({ x: 100, y: 100, w: 300, h: 200 }, 2);
  it('vuelve a la vista completa antes del final para que el corte sea al mismo encuadre', () => {
    const shots = withSettle([{ atSec: 2, state: a }], 10, 1.4);
    expect(cameraAt(10, shots)).toEqual(FULL);
    expect(shots.at(-1)).toEqual({ atSec: 10 - 1.4, state: FULL });
  });
  it('no agrega nada si ya termina en vista completa', () => {
    const shots = [{ atSec: 2, state: a }, { atSec: 5, state: FULL }];
    expect(withSettle(shots, 10, 1.4)).toEqual(shots);
  });
  it('un zoom que empieza durante el cierre se descarta: el cierre manda', () => {
    const shots = withSettle([{ atSec: 2, state: a }, { atSec: 9, state: a }], 10, 1.4);
    expect(cameraAt(10, shots)).toEqual(FULL);
  });
});
