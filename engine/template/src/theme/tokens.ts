/**
 * Lenguaje visual del video: piel técnica (default de la skill, `components/tecnico/`) vestida con la marca.
 * Neutros perla y grafito fijos; `accent`, `highlight`, `navy` y `brandLine` salen de la marca elegida en el
 * cuestionario (colores medidos del logo del cliente, de la app o identidad Gensler). Spring, tipografía y sombras
 * son el punto de partida de la plantilla y normalmente no se tocan.
 */
export const tokens = {
  color: {
    bg: '#F2F2F0',
    bgDeep: '#E7E7E3',
    ink: '#1D1E21',
    inkSoft: '#5E6166',
    inkFaint: '#9A9CA0',
    line: '#DEDEDA',
    lineStrong: '#C4C4BF',
    /** Acento principal de la app: halos de spotlight, pulsos del cursor, resaltes. */
    accent: '#3483FA',
    accentTint: 'rgba(52, 131, 250, 0.14)',
    accentWash: 'rgba(52, 131, 250, 0.07)',
    /** Filete de marca bajo el título (Background `filete`) y resaltador `Mark` amarillo. */
    brandLine: '#FFE600',
    highlight: '#FFE600',
    navy: '#2D3277',
    warning: '#B26A00',
    warningTint: 'rgba(178, 106, 0, 0.10)',
    ok: '#1BAF7A',
    /** Registro Visión (lo no construido): violeta punteado, nunca se confunde con la UI real. */
    vision: '#6E56CF',
    visionTint: 'rgba(110, 86, 207, 0.12)',
    white: '#FFFFFF',
  },
  /** Paleta categórica de la app (tipos de espacio, series de gráficas…). Cópiala de la app. */
  palette: ['#2A78D6', '#1BAF7A', '#4A3AA7', '#E34948', '#EDA100', '#008300'],
  radius: { window: 22, card: 24, pill: 999 },
  shadow: {
    window: '0 50px 140px rgba(0,0,0,0.16), 0 12px 32px rgba(0,0,0,0.08)',
    pill: '0 6px 20px rgba(0,0,0,0.10)',
    card: '0 2px 4px rgba(20,23,26,0.05), 0 24px 64px rgba(20,23,26,0.09)',
  },
  /** La app (1920×1080) se muestra al 86% del cuadro. */
  windowScale: 0.86,
  spring: {
    gentle: { damping: 200, stiffness: 90, mass: 1 },
    camera: { damping: 38, stiffness: 55, mass: 1.3 },
    pop: { damping: 18, stiffness: 180, mass: 0.8 },
  },
  type: {
    hero: { fontSize: 92, fontWeight: 600, letterSpacing: -3 },
    title: { fontSize: 64, fontWeight: 600, letterSpacing: -1.8 },
    body: { fontSize: 34, fontWeight: 400, letterSpacing: -0.4 },
    label: { fontSize: 22, fontWeight: 500, letterSpacing: 0.2 },
    caption: { fontSize: 34, fontWeight: 500, letterSpacing: -0.2 },
  },
} as const;
