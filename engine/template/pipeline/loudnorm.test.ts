import { describe, expect, it } from 'vitest';
import { linearLoudnormFilter } from './loudnorm';

const m = { input_i: '-20.1', input_tp: '-3.2', input_lra: '5.0', input_thresh: '-30.4', target_offset: '0.1' };

describe('linearLoudnormFilter', () => {
  it('aplica la ganancia lineal medida en la primera pasada', () => {
    expect(linearLoudnormFilter(m)).toBe('loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=-20.1:measured_TP=-3.2:measured_LRA=5.0:measured_thresh=-30.4:offset=0.1:linear=true,aresample=48000');
  });
  it('con audio en silencio (borrador sin voz ni música) no normaliza', () => {
    expect(linearLoudnormFilter({ ...m, input_i: '-inf', input_tp: '-inf' })).toBe('aresample=48000');
  });
});
