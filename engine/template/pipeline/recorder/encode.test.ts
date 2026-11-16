import { describe, expect, it } from 'vitest';
import { encodeArgs } from './encode';

describe('encodeArgs', () => {
  const a = encodeArgs('list.txt', 'out.mp4', 2, { width: 1920, height: 1080 });
  const vf = a[a.indexOf('-vf') + 1]!;
  it('60 fps constantes a la resolución de captura', () => {
    expect(vf).toContain('fps=60');
    expect(vf).toContain('scale=3840:2160');
  });
  it('cuadro clave cada 0.5 s y sin cuadros B: Remotion busca cualquier cuadro sin decodificar cientos hacia atrás', () => {
    expect(a[a.indexOf('-g') + 1]).toBe('30');
    expect(a[a.indexOf('-bf') + 1]).toBe('0');
  });
  it('rango de video estándar (no yuvj420p de las capturas JPEG)', () => {
    expect(vf).toContain('out_range=tv');
    expect(a[a.indexOf('-color_range') + 1]).toBe('tv');
  });
});
