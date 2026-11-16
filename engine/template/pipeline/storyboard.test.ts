import { describe, expect, it } from 'vitest';
import { assignLines, storyboardHtml, type StoryScene } from './storyboard';

describe('assignLines', () => {
  const segs = [{ text: 'uno', startSec: 0.5 }, { text: 'dos', startSec: 4 }, { text: 'tres', startSec: 6 }, { text: 'cuatro', startSec: 11 }];
  it('cada frase va al primer frame que la muestra sonando; si ningún frame cae en ella, al frame anterior', () => {
    expect(assignLines(segs, [2, 5, 9])).toEqual([['uno'], ['dos'], ['tres', 'cuatro']]);
    expect(assignLines(segs, [5, 12])).toEqual([['uno', 'dos', 'tres'], ['cuatro']]);
  });
  it('un frame sin frase nueva queda vacío (continúa la anterior)', () => {
    expect(assignLines(segs, [1, 2, 4.5])).toEqual([['uno'], [], ['dos', 'tres', 'cuatro']]);
  });
  it('no pierde ni repite frases', () => {
    expect(assignLines(segs, [3, 7]).flat()).toEqual(['uno', 'dos', 'tres', 'cuatro']);
  });
});

const scenes: StoryScene[] = [
  { id: 'gancho', title: 'Gancho', register: 'motion', frames: [
    { n: 'F01', img: 'F01.png', sec: 3.2, lines: ['Cada proyecto es una decisión & una <evidencia>.'] },
    { n: 'F02', img: 'F02.png', sec: 5.9, lines: [] },
  ] },
  { id: 'cierre', title: 'Cierre', register: 'motion', frames: [{ n: 'F26', img: 'F26.png', sec: 2.5, lines: [] }] },
];

describe('storyboardHtml', () => {
  const html = storyboardHtml('Guion visual', scenes, new Set(['cierre']));
  it('pone cada frame con su imagen, su número y su segundo', () => {
    for (const n of ['F01', 'F02', 'F26']) expect(html).toContain(`src="${n}.png"`);
    expect(html).toContain('3.2 s');
  });
  it('escapa el texto de la voz', () => {
    expect(html).toContain('decisión &amp; una &lt;evidencia&gt;.');
    expect(html).not.toContain('<evidencia>');
  });
  it('un frame sin frase nueva dice que sigue la anterior; una escena sin voz dice «Sin voz»', () => {
    expect(html).toContain('(sigue la frase anterior)');
    expect(html).toContain('Sin voz');
  });
});
