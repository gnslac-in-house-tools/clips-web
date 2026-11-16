import { describe, expect, it } from 'vitest';
import { captionsForSegment, splitCaptionLines } from './captions';
import { toSpoken } from './pronounce';
import type { Alignment } from './timeline';

function fakeAlignment(spoken: string, secPerChar = 0.05): Alignment {
  const chars = [...spoken];
  return {
    characters: chars,
    character_start_times_seconds: chars.map((_, i) => i * secPerChar),
    character_end_times_seconds: chars.map((_, i) => (i + 1) * secPerChar),
  };
}

describe('splitCaptionLines', () => {
  it('corta en puntuación y respeta el máximo', () => {
    const text = 'El sitio puede venir de tu propio plano: cargas un PDF y su contorno define la zona disponible.';
    const lines = splitCaptionLines(text, 42);
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(42);
    expect(lines.join(' ')).toBe(text);
  });
  it('una frase corta queda en una línea', () => {
    expect(splitCaptionLines('Todo empieza aquí.')).toEqual(['Todo empieza aquí.']);
  });
});

describe('captionsForSegment', () => {
  const text = 'Cargas un PDF y su contorno define la zona, y listo.';
  it('usa la alineación del texto fonético para ubicar cada línea', () => {
    const al = fakeAlignment(toSpoken(text));
    const lines = captionsForSegment(text, al, 10);
    expect(lines[0]!.startSec).toBe(0);
    for (let i = 1; i < lines.length; i++) expect(lines[i]!.startSec).toBeGreaterThan(lines[i - 1]!.startSec);
    expect(lines.at(-1)!.endSec).toBeCloseTo(toSpoken(text).length * 0.05);
  });
  it('sin alineación reparte la duración por longitud', () => {
    const lines = captionsForSegment(text, null, 10);
    expect(lines[0]!.startSec).toBe(0);
    expect(lines.at(-1)!.endSec).toBeCloseTo(10);
  });
  it('tolera una alineación más corta que el texto', () => {
    const al = fakeAlignment('Cargas un');
    expect(() => captionsForSegment(text, al, 10)).not.toThrow();
  });
});
