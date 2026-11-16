/**
 * Configuración del video. Todo lo que cambia entre una app y otra vive aquí:
 * nombre, idioma, voz, marca, textos de honestidad, duración objetivo y música.
 */
export type Lang = 'es' | 'en';

export const PROJECT: { name: string; slug: string; lang: Lang } = {
  /** Nombre visible de la app (títulos, README). */
  name: '__APP_NAME__',
  /** Prefijo de los archivos de salida: out/final/<slug>-demo-1080p60.mp4. */
  slug: '__APP_SLUG__',
  /** Idioma de la narración, los subtítulos y los textos en pantalla. */
  lang: '__LANG__' as Lang,
};

/**
 * App que se graba. La URL no es un secreto (las llaves viven solo en el .env general de 01. Videos),
 * así que va aquí (sin process.env: este archivo también lo carga el bundle de Remotion, en el navegador).
 * Los scripts de Node aceptan un APP_URL del entorno para sobrescribirla.
 */
export const APP = {
  url: '__APP_URL__',
};

/**
 * Orden del video. Agregar/quitar/reordenar escenas = editar este arreglo. El esqueleto trae solo tres
 * (apertura, una escena En vivo de ejemplo y cierre): la estructura real se propone al inicio del proyecto
 * según la app y la audiencia. El cierre (con el logo de Gensler) siempre es la última escena.
 */
export const SCENE_ORDER = [
  'intro',
  'demo',
  'close',
] as const;

/**
 * Cortes del video: subconjuntos de SCENE_ORDER, en el mismo orden. Un corte solo quita escenas, así
 * reutiliza los clips ya renderizados (cache/scenes) y su música se realinea por el final.
 *   npm run render -- --final --cut client  →  out/final/<slug>-client-demo-1080p60.mp4
 * `full` es el video completo (salida sin sufijo). Caso típico: una versión para el cliente sin las
 * escenas técnicas (cómo se publica, herramientas internas), solo cómo se usa y en qué le beneficia.
 */
export const CUTS = {
  full: [...SCENE_ORDER],
  client: [...SCENE_ORDER],
} satisfies Record<string, string[]>;
export type Cut = keyof typeof CUTS;

/** Lee `--cut <nombre>` de los argumentos (default `full`). */
export function cutFromArgs(argv: string[]): Cut {
  const i = argv.indexOf('--cut');
  const name = i >= 0 ? argv[i + 1] : 'full';
  if (!name || !(name in CUTS)) throw new Error(`Corte desconocido: ${name}. Opciones: ${Object.keys(CUTS).join(', ')}`);
  return name as Cut;
}

/** Prefijo de los archivos de salida de un corte: <slug>-demo… para `full`, <slug>-<corte>-demo… para los demás. */
export const cutSlug = (cut: Cut) => (cut === 'full' ? PROJECT.slug : `${PROJECT.slug}-${cut}`);

export const FLAGS = {
  /** Muestra el logo del cliente junto al de Gensler (BrandLockup). */
  coBrand: false,
  /** Subtítulos quemados. Pregunta al inicio si se quieren: quitarlos tarde obliga a recentrar las escenas Motion. El SRT se entrega aparte igual. */
  burnCaptions: true,
  /** fps del máster. El borrador (`render -- --draft`) se renderiza a 30 sin tocar esto. */
  fps: 60,
  /** Espacio de composición: siempre 1920×1080. La resolución de salida se elige al renderizar (`scale`). */
  width: 1920,
  height: 1080,
  transitionSec: 0.7,
};

/**
 * Captura de la app real. DPR 2 graba a 3840×2160 aunque la salida sea 1080p: los zooms de hasta
 * 2.2× recortan la imagen y necesitan esos píxeles extra para seguir nítidos.
 */
export const CAPTURE = {
  viewport: { width: 1920, height: 1080 },
  dpr: 2,
  /** Escenas con `device: 'phone'`: vista vertical táctil de un teléfono de tamaño medio, a DPR 3. */
  phone: { viewport: { width: 390, height: 844 }, dpr: 3 },
};

export const VOICE = {
  /** Se elige en el casting (`npm run voices:list`, `npm run voices:cast`). Vacío = `npm run voice` se niega a correr. */
  voiceId: '',
  /** eleven_v3 (más expresivo, sin contexto entre frases) o eleven_multilingual_v2 (acepta previous/next_text y `speed`). */
  modelId: 'eleven_v3',
  outputFormat: 'mp3_44100_192',
  /** v3 acepta estabilidad 0 (creativa), 0.5 (natural) o 1 (robusta). En v2: stability, similarity_boost, style, speed. */
  settings: { stability: 0.5 } as Record<string, number | boolean>,
};

/**
 * Duración objetivo: 2:00 (≈ 270–300 palabras de guion). Rango aceptable de la duración final, que verifica
 * `npm run qa`. Si el usuario pide otra duración, cámbiala aquí.
 */
export const TARGET = { goalSec: 120, minSec: 105, maxSec: 135 };

/**
 * Dígitos que sí pueden aparecer en el guion. Ninguno: la voz puede decir mal «3D» o «2D», así que se escriben
 * como se pronuncian («tercera dimensión», «dos dimensiones»). Se deja vacío a propósito.
 */
export const ALLOWED_DIGIT_TOKENS: string[] = [];

interface Copy { liveBadge: string; visionBadge: string; closeFootnote: string; noCapture: string; locale: string }

const COPY_BY_LANG: Record<Lang, Copy> = {
  es: {
    /** Siempre visible en escenas En vivo (SceneFrame). Ajustar a lo que es verdad para esta app. */
    liveBadge: 'Interfaz preliminar · Datos de ejemplo',
    visionBadge: 'Concepto · hoja de ruta',
    closeFootnote: 'Prototipo · datos de ejemplo',
    noCapture: 'Sin captura todavía',
    locale: 'es-MX',
  },
  en: {
    liveBadge: 'Preliminary interface · Sample data',
    visionBadge: 'Concept · roadmap',
    closeFootnote: 'Prototype · sample data',
    noCapture: 'No capture yet',
    locale: 'en-US',
  },
};

export const COPY: Copy = COPY_BY_LANG[PROJECT.lang] ?? COPY_BY_LANG.es;

export const BRAND = {
  /** Archivos en public/brand/. El logo de Gensler (el nuevo) lo copia el scaffold desde 01. Videos/_kit/brand/gensler.png. */
  primary: 'brand/gensler.png',
  /** Logo del cliente (PNG con fondo transparente). Solo se muestra con FLAGS.coBrand. */
  partner: 'brand/partner.png',
  /** Alto del logo del cliente relativo al de Gensler (compensa isotipos y proporciones). */
  partnerScale: 1.6,
};

export const MUSIC = {
  /**
   * Ganancia de la cama sin voz y bajo la voz (ducking). Con la voz masterizada a −18 LUFS (voiceMaster)
   * y una pista de ~−16 LUFS: 0.15 deja la música ~15 dB bajo la voz y 0.40 la trae al frente en las pausas.
   */
  base: 0.4,
  duck: 0.15,
  /** Prompt de ElevenLabs Music. Instrumental, sin percusión marcada, con un acorde final claro. */
  prompt: 'Minimal ambient electronic underscore for a premium software product film. Warm soft piano and airy pads, gentle steady pulse around 90 BPM, optimistic and calm, clean and modern, no vocals, no drum hits, unobtrusive under a voice-over. Keeps its full texture until the very end, then one clear resolved final chord with a short natural tail.',
};
