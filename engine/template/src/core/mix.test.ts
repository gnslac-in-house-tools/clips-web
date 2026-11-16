import { describe, expect, it } from 'vitest';
import { musicVolume, voiceIntervals } from './mix';

const o = { totalSec: 60, base: 0.2, duck: 0.06, rampSec: 0.5, fadeInSec: 2, fadeOutSec: 3 };

describe('musicVolume', () => {
  it('baja bajo la voz y sube lejos de ella', () => {
    const voice = [{ startSec: 10, endSec: 20 }];
    expect(musicVolume(15, voice, o)).toBeCloseTo(0.06);
    expect(musicVolume(30, voice, o)).toBeCloseTo(0.2);
    const ramp = musicVolume(20.25, voice, o);
    expect(ramp).toBeGreaterThan(0.06);
    expect(ramp).toBeLessThan(0.2);
  });
  it('fade in y fade out', () => {
    expect(musicVolume(0, [], o)).toBe(0);
    expect(musicVolume(60, [], o)).toBe(0);
    expect(musicVolume(1, [], o)).toBeCloseTo(0.1);
  });
});

describe('voiceIntervals', () => {
  it('desplaza cada segmento por el offset de su escena', () => {
    const tl = (id: string) => ({ sceneId: id, durationSec: 5, segments: [{ id: 'a', text: '', startSec: 1, endSec: 2, file: null, alignment: null, estimated: true }] });
    expect(voiceIntervals([tl('x'), tl('y')], [0, 4.5])).toEqual([{ startSec: 1, endSec: 2 }, { startSec: 5.5, endSec: 6.5 }]);
  });
});

describe('bodyEndSec', () => {
  it('el cuerpo termina en el último segundo que sigue cerca del nivel típico (antes de la cola de reverberación)', async () => {
    const { bodyEndSec } = await import('./mix');
    const levels = [...Array(10).fill(-16), -17, -15.7, -19, -33.8, -37.7, -44, -60];
    expect(bodyEndSec(levels)).toBe(13);
  });
  it('un decrescendo largo no cuenta como cuerpo', async () => {
    const { bodyEndSec } = await import('./mix');
    const levels = [...Array(10).fill(-19), -20, -24.3, -25.3, -26.3, -28.2, -30, -31.4, -39.8, -54];
    expect(bodyEndSec(levels)).toBe(12);
  });
});

describe('musicTrimSec', () => {
  it('recorta el inicio para que el final del cuerpo caiga 3.5 s antes del final del video (el acorde suena sobre los logos)', async () => {
    const { musicTrimSec } = await import('./mix');
    expect(musicTrimSec(212, 206.4)).toBeCloseTo(212 - (206.4 - 3.5));
  });
  it('si el cuerpo de la música termina antes, falla con instrucciones en vez de dejar el cierre sin música', async () => {
    const { musicTrimSec } = await import('./mix');
    expect(() => musicTrimSec(197, 206.4)).toThrow(/npm run music/);
  });
});
