import { describe, expect, it } from 'vitest';
import { PRONOUNCE, toSpoken } from './pronounce';

describe('toSpoken', () => {
  it('reemplaza términos como palabras completas', () => {
    for (const [term, spoken] of Object.entries(PRONOUNCE)) expect(toSpoken(`Un ${term}.`)).toBe(`Un ${spoken}.`);
  });
  it('no toca subcadenas dentro de otras palabras', () => {
    const [term] = Object.keys(PRONOUNCE);
    if (term) expect(toSpoken(`${term}S y A${term}`)).toBe(`${term}S y A${term}`);
  });
  it('deja intacto el texto sin términos', () => {
    expect(toSpoken('Todo empieza aquí.')).toBe('Todo empieza aquí.');
  });
});
