import { describe, expect, it } from 'vitest';
import { toSrt } from './srt';

describe('toSrt', () => {
  it('formatea bloques numerados con milisegundos', () => {
    expect(toSrt([{ text: 'Hola.', startSec: 1.5, endSec: 3.25 }, { text: 'Adiós.', startSec: 61, endSec: 62 }])).toBe(
      '1\n00:00:01,500 --> 00:00:03,250\nHola.\n\n2\n00:01:01,000 --> 00:01:02,000\nAdiós.\n',
    );
  });
});
