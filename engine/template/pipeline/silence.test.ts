import { describe, expect, it } from 'vitest';
import { speechEndFromLog } from './silence';

const log = (lines: string[]) => lines.join('\n');

describe('speechEndFromLog', () => {
  it('toma el inicio del silencio final y deja un margen corto', () => {
    const l = log(['[silencedetect] silence_start: 1.2', '[silencedetect] silence_end: 1.5 | silence_duration: 0.3', '[silencedetect] silence_start: 4.40']);
    expect(speechEndFromLog(l, 5.15)).toBeCloseTo(4.48);
  });
  it('si el último silencio termina antes del final, no hay silencio final: usa la duración', () => {
    const l = log(['[silencedetect] silence_start: 1.2', '[silencedetect] silence_end: 1.5 | silence_duration: 0.3']);
    expect(speechEndFromLog(l, 5.15)).toBe(5.15);
  });
  it('un silencio que llega hasta el final también reporta silence_end: se trata como final', () => {
    const l = log(['[silencedetect] silence_start: 4.4', '[silencedetect] silence_end: 5.15 | silence_duration: 0.75']);
    expect(speechEndFromLog(l, 5.15)).toBeCloseTo(4.48);
  });
  it('un ruido corto al cierre del archivo no anula el silencio final', () => {
    const l = log(['[silencedetect] silence_start: 5.350567', '[silencedetect] silence_end: 7.784762 | silence_duration: 2.434195']);
    expect(speechEndFromLog(l, 7.84)).toBeCloseTo(5.43);
  });
  it('sin silencios usa la duración', () => {
    expect(speechEndFromLog('', 3)).toBe(3);
  });
});
