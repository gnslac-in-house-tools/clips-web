import { describe, expect, it } from 'vitest';
import { frameOffsets, assembleFilter } from './assemble';

describe('frameOffsets', () => {
  it('cada escena empieza donde terminó la anterior menos el traslape del fundido (en fotogramas)', () => {
    expect(frameOffsets([600, 300, 450], 42)).toEqual([0, 558, 816]);
  });
});

describe('assembleFilter', () => {
  it('encadena xfade entre escenas y mezcla el audio de cada escena en su offset más la cama', () => {
    const f = assembleFilter([600, 300, 450], 60, 42);
    expect(f).toContain('[0:v][1:v]xfade=transition=fade:duration=0.7:offset=9.3[v1]');
    expect(f).toContain('[v1][2:v]xfade=transition=fade:duration=0.7:offset=13.6[v2]');
    expect(f).toContain('[1:a]adelay=9300:all=1[a1]');
    expect(f).toContain('[2:a]adelay=13600:all=1[a2]');
    // la cama (música + whooshes) es la última entrada
    expect(f).toContain('[a0][a1][a2][3:a]amix=inputs=4:normalize=0:duration=longest[aout]');
    expect(f).toContain('[v2]format=yuv420p[vout]');
  });
  it('una sola escena no necesita xfade', () => {
    const f = assembleFilter([600], 60, 42);
    expect(f).toContain('[0:v]format=yuv420p[vout]');
    expect(f).toContain('[a0][1:a]amix=inputs=2');
  });
});

describe('sourcesFor', () => {
  const files = ['src/components/Chip.tsx', 'src/scenes/welcome/Scene.tsx', 'src/scenes/close/Scene.tsx', 'src/scenes/metas.ts', 'src/video.config.ts'];
  it('incluye lo compartido y la carpeta de la escena, no las de otras escenas', async () => {
    const { sourcesFor } = await import('./assemble');
    expect(sourcesFor('welcome', files)).toEqual(['src/components/Chip.tsx', 'src/scenes/welcome/Scene.tsx', 'src/scenes/metas.ts', 'src/video.config.ts']);
  });
});
