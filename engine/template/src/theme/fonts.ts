import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';

/**
 * Fuentes servidas desde public/fonts/ (woff2 latin de @fontsource): el render no depende de internet.
 * Piel técnica (default de la skill): Inter Tight ligera para titulares, Inter para cuerpo, Geist Mono para
 * etiquetas y paneles, Instrument Serif itálica para la palabra clave de un titular.
 */
export const FONT_FAMILY = 'Inter';
export const FONT_DISPLAY = '"Inter Tight", Inter, sans-serif';
export const FONT_MONO = '"Geist Mono", ui-monospace, monospace';
export const FONT_SERIF = '"Instrument Serif", Georgia, serif';

const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

const FACES: [string, string, FontFaceDescriptors][] = [
  ['Inter', 'fonts/inter-latin.woff2', { weight: '300 600', style: 'normal' }],
  ['Inter Tight', 'fonts/inter-tight-latin-wght-normal.woff2', { weight: '100 900', style: 'normal' }],
  ['Geist Mono', 'fonts/geist-mono-latin-400-normal.woff2', { weight: '400', style: 'normal' }],
  ['Geist Mono', 'fonts/geist-mono-latin-500-normal.woff2', { weight: '500', style: 'normal' }],
  ['Instrument Serif', 'fonts/instrument-serif-latin-400-italic.woff2', { weight: '400', style: 'italic' }],
];

if (typeof document !== 'undefined') {
  const handle = delayRender('Cargando fuentes (locales)');
  Promise.all(FACES.map(([family, file, d]) => new FontFace(family, `url(${staticFile(file)}) format('woff2')`, { ...d, unicodeRange: LATIN }).load()))
    .then((faces) => { faces.forEach((f) => document.fonts.add(f)); continueRender(handle); })
    .catch((err) => cancelRender(err));
}
