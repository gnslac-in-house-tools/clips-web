import { describe, expect, it } from 'vitest';
import { voiceKey } from './voiceKey';
import { VOICE } from '../src/video.config';

describe('voiceKey', () => {
  const v = { ...VOICE, voiceId: 'abc' };
  it('es estable', () => expect(voiceKey('hola', v)).toBe(voiceKey('hola', v)));
  it('cambia con el texto, la voz o los ajustes', () => {
    const k = voiceKey('hola', v);
    expect(voiceKey('hola.', v)).not.toBe(k);
    expect(voiceKey('hola', { ...v, voiceId: 'xyz' })).not.toBe(k);
    expect(voiceKey('hola', { ...v, settings: { ...v.settings, stability: 0.9 } })).not.toBe(k);
  });
});

describe('supportsContext', () => {
  it('v3 no acepta previous_text/next_text; v2 sí', async () => {
    const { supportsContext } = await import('./voiceKey');
    expect(supportsContext('eleven_v3')).toBe(false);
    expect(supportsContext('eleven_multilingual_v2')).toBe(true);
  });
});
