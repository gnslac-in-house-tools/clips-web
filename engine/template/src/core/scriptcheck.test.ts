import { describe, expect, it } from 'vitest';
import type { SceneMeta } from './types';
import { checkScript, wordCount } from './scriptcheck';

const scene = (...texts: string[]): SceneMeta[] => [{
  id: 's', title: 'S', register: 'motion',
  segments: texts.map((text, i) => ({ id: `s${i + 1}`, text })),
}];
const rules = (texts: string[], opts = {}) => checkScript(scene(...texts), opts).map((i) => i.rule);

describe('script:check', () => {
  it('un guion limpio no marca nada', () => {
    expect(rules(['Esta es una plataforma para revisar proyectos.', 'Elige una opción y el resumen cambia.'])).toEqual([]);
  });
  it('rechaza dígitos y siglas con dígitos como 3D', () => {
    expect(rules(['Todo se ve en 3D.'])).toContain('dígito');
    expect(rules(['Cuesta 40 millones.'])).toContain('dígito');
  });
  it('rechaza símbolos, urls y finales sin puntuación', () => {
    expect(rules(['Sube un diez %.'])).toContain('símbolo');
    expect(rules(['Entra a www.ejemplo.com ahora.'])).toContain('url');
    expect(rules(['Sin punto final'])).toContain('puntuación final');
  });
  it('en español exige signo de apertura y acentos en -ción', () => {
    expect(rules(['Y si todo viviera en un modelo?'])).toContain('signo de apertura');
    expect(rules(['La informacion llega completa.'])).toContain('acento');
    expect(rules(['La información llega completa.'])).not.toContain('acento');
    expect(rules(['Las decisiones y las versiones se comparten.'])).not.toContain('acento');
  });
  it('avisa de siglas sin pronunciación y las acepta si están en el diccionario', () => {
    expect(rules(['El reporte sale en PDF.'])).toContain('sigla');
    expect(rules(['El reporte sale en PDF.'], { pronounced: ['PDF'] })).not.toContain('sigla');
  });
  it('avisa de anglicismos, paréntesis, guiones largos y palabras repetidas', () => {
    expect(rules(['Mira el dashboard completo.'])).toContain('anglicismo');
    expect(rules(['Mira el resumen (completo).'])).toContain('paréntesis');
    expect(rules(['Mira el resumen — completo.'])).toContain('guion largo');
    expect(rules(['Mira el el resumen.'])).toContain('palabra repetida');
  });
  it('avisa de segmentos largos y de tres «Y» seguidas', () => {
    const long = Array.from({ length: 26 }, () => 'dato').join(' ') + '.';
    expect(rules([long])).toContain('segmento largo');
    expect(rules(['Y uno.', 'Y dos.', 'Y tres.'])).toContain('muchas «Y»');
  });
  it('cuenta las palabras del guion', () => {
    expect(wordCount(scene('Una dos tres.', 'Cuatro cinco.'))).toBe(5);
  });
});
