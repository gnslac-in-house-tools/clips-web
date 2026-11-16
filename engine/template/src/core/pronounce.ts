import { PROJECT } from '../video.config';

/**
 * Escritura fonética para la voz. Solo reemplazos de palabra completa: los subtítulos se
 * calculan línea por línea con esta misma función, así que un reemplazo nunca puede cruzar
 * un espacio del texto original. Los subtítulos y la pantalla muestran el texto original.
 *
 * Agrega aquí siglas, nombres de producto y anglicismos que la voz lea mal. Escucha cada
 * término en el casting antes de darlo por bueno: una sigla como "3D" puede sonar "tres" y perderse: mejor escribirla como se dice.
 */
const BY_LANG: Record<'es' | 'en', Record<string, string>> = {
  es: {
    '3D': 'tres dimensiones',
    '2D': 'dos dimensiones',
    PDF: 'pe de efe',
    PNG: 'pe ene ge',
    XLSX: 'equis ele ese equis',
    DXF: 'de equis efe',
    DWG: 'de doble ve ge',
  },
  en: {
    '3D': 'three D',
    '2D': 'two D',
    XLSX: 'X L S X',
    DXF: 'D X F',
    DWG: 'D W G',
  },
};

export const PRONOUNCE: Record<string, string> = BY_LANG[PROJECT.lang] ?? BY_LANG.es;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const keys = Object.keys(PRONOUNCE);
const PATTERN = keys.length
  ? new RegExp(`(?<![\\p{L}\\p{N}])(${keys.map(escape).join('|')})(?![\\p{L}\\p{N}])`, 'gu')
  : null;

export function toSpoken(text: string): string {
  return PATTERN ? text.replace(PATTERN, (m) => PRONOUNCE[m] ?? m) : text;
}
