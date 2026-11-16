import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { tokens } from '../../theme/tokens';
import { FONT_DISPLAY, FONT_FAMILY, FONT_MONO, FONT_SERIF } from '../../theme/fonts';
import { FUNDIDO_ESTATICO, esEstatico } from '../../core/movimiento';

/**
 * Kit técnico (piel default de la skill): titulares ligeros con palabra clave en serif itálica, paneles con
 * encabezado mono, barras sin cifras, chips, etiquetas con línea guía y el riel de fases. Todo con los tokens de
 * la marca (tokens.ts); sin orbes ni gradientes detrás de los gráficos.
 */

/** Segundos de la escena (las animaciones van en segundos, no en fotogramas). */
export function useSec(): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
}
const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
/** 0→1 desde `start` en `dur` s, con desaceleración. En modo estático: un fundido corto en `start`, sin coreografía. */
export const ramp = (t: number, start: number, dur = 0.6) => esEstatico()
  ? interpolate(t, [start, start + FUNDIDO_ESTATICO], [0, 1], CLAMP)
  : interpolate(t, [start, start + dur], [0, 1], { ...CLAMP, easing: Easing.bezier(0.16, 1, 0.3, 1) });
/** 0→1 con ease in-out (movimientos de composición). En modo estático: un cambio corto, sin recorrido largo. */
export const glide = (t: number, start: number, dur = 1.2) => esEstatico()
  ? interpolate(t, [start, start + FUNDIDO_ESTATICO], [0, 1], CLAMP)
  : interpolate(t, [start, start + dur], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) });
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
/** Visible entre `a` y `b` con fundidos. */
export const win = (t: number, a: number, b: number, f = 0.5) => ramp(t, a, f) * (1 - ramp(t, b, f));
/** Igual que `win`, pero sale antes de `b` para que el siguiente panel entre sobre limpio (sin encimarse). */
export const turno = (t: number, a: number, b: number) => ramp(t, a + 0.1, 0.45) * (1 - ramp(t, b - 0.45, 0.35));

export const MONO: React.CSSProperties = { fontFamily: FONT_MONO, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' };

/**
 * Titular técnico: Inter Tight ligera; las palabras entre *asteriscos* van en serif itálica con el acento; «\n» corta
 * línea. Cada palabra entra escalonada desde `at`. `num`: el número gris del capítulo a la izquierda.
 */
export const Titular: React.FC<{ text: string; at: number; x: number; y: number; w: number; size?: number; num?: string; out?: number; align?: 'left' | 'center'; color?: string }> = ({ text, at, x, y, w, size = 70, num, out = 0, align = 'left', color = tokens.color.ink }) => {
  const t = useSec();
  let k = 0;
  let inEm = false;
  const lines = text.split('\n');
  const o = 1 - out;
  if (o <= 0 || t < at - 0.1) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, opacity: o, transform: `translateY(${-out * 20}px)`, textAlign: align }}>
      {num ? <span style={{ position: 'absolute', left: -74, top: size * 0.2, fontFamily: FONT_DISPLAY, fontWeight: 300, fontSize: size * 0.57, color: tokens.color.inkFaint, opacity: ramp(t, at, 0.5) }}>{num}</span> : null}
      {lines.map((line, li) => (
        <div key={li} style={{ fontFamily: FONT_DISPLAY, fontWeight: 300, fontSize: size, lineHeight: 1.04, letterSpacing: `${-size * 0.04}px`, color }}>
          {line.split(' ').filter(Boolean).map((word, wi, arr) => {
            if (word.startsWith('*')) inEm = true;
            const em = inEm;
            if (/\*[.,:;!?]*$/.test(word)) inEm = false;
            const clean = word.replace(/\*/g, '');
            const p = ramp(t, at + (esEstatico() ? 0 : (k++) * 0.06), 0.55);
            return (
              <span key={wi} style={{ display: 'inline-block', whiteSpace: 'pre', opacity: p, transform: `translateY(${(1 - p) * 22}px)`, filter: `blur(${(1 - p) * 6}px)`,
                ...(em ? { fontFamily: FONT_SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: size * 1.04, letterSpacing: `${-size * 0.008}px`, color: tokens.color.accent } : {}) }}>
                {clean}{wi < arr.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Párrafo de apoyo (Inter, gris). */
export const Lead: React.FC<{ text: string; p: number; x: number; y: number; w: number; size?: number }> = ({ text, p, x, y, w, size = 22 }) =>
  p <= 0 ? null : <p style={{ position: 'absolute', left: x, top: y, width: w, margin: 0, fontFamily: FONT_FAMILY, fontSize: size, lineHeight: 1.45, color: tokens.color.inkSoft, opacity: p, transform: `translateY(${(1 - p) * 12}px)` }}>{text}</p>;

/** Eje vertical de la zona de contenido (entre el titular y el riel): los bloques se centran aquí. */
export const EJE_Y = 640;

/**
 * Panel técnico: blanco, filete fino, encabezado mono con punto de acento. Con `cy` (en vez de `y`) se centra
 * verticalmente sobre ese eje, sea cual sea su alto: así se alinea con el dibujo de al lado.
 */
export const Panel: React.FC<{ x: number; y?: number; cy?: number; w: number; h?: number; p: number; titulo: string; derecha?: string; children?: React.ReactNode }> = ({ x, y, cy, w, h, p, titulo, derecha, children }) =>
  p <= 0 ? null : (
    <div style={{ position: 'absolute', left: x, top: cy ?? y ?? EJE_Y, width: w, height: h, background: tokens.color.white, border: '1px solid rgba(29,30,33,0.16)', borderRadius: 10, overflow: 'hidden', opacity: p, transform: `translateY(calc(${cy !== undefined ? '-50%' : '0px'} + ${(1 - p) * 26}px))` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '15px 22px', borderBottom: '1px solid rgba(29,30,33,0.12)', ...MONO, fontSize: 15, color: tokens.color.inkSoft }}>
        <span style={{ color: tokens.color.ink, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: tokens.color.accent }} />{titulo}</span>
        {derecha ? <span>{derecha}</span> : null}
      </div>
      <div style={{ padding: '22px 26px' }}>{children}</div>
    </div>
  );

/** Subtítulo mono dentro de un panel. */
export const Kicker: React.FC<{ text: string; mt?: number }> = ({ text, mt = 0 }) => <div style={{ ...MONO, fontSize: 14, color: tokens.color.inkSoft, margin: `${mt}px 0 14px` }}>{text}</div>;

/** Fila con barra sin cifras: pista punteada, relleno y marca opcional de objetivo. */
export const FilaBarra: React.FC<{ label: string; v: number; tono?: 'ink' | 'accent' | 'highlight'; obj?: number; nota?: string; dim?: number; labelW?: number }> = ({ label, v, tono = 'ink', obj, nota, dim = 0, labelW = 150 }) => {
  const color = { ink: tokens.color.ink, accent: tokens.color.accent, highlight: tokens.color.highlight }[tono];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${labelW}px 1fr 90px`, alignItems: 'center', gap: 16, marginBottom: 18, opacity: 1 - 0.6 * dim }}>
      <span style={{ fontFamily: FONT_FAMILY, fontSize: 21, color: tokens.color.ink }}>{label}</span>
      <div style={{ position: 'relative', height: 12, background: 'repeating-linear-gradient(90deg, rgba(29,30,33,0.10) 0 2px, transparent 2px 6px)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.max(0, Math.min(1, v)) * 100}%`, background: color, boxShadow: tono === 'highlight' ? `inset 0 0 0 1.5px ${tokens.color.navy}` : undefined }} />
        {obj !== undefined ? <div style={{ position: 'absolute', left: `${obj * 100}%`, top: -9, bottom: -9, borderLeft: `1.5px dashed ${tokens.color.navy}` }} /> : null}
      </div>
      <span style={{ ...MONO, fontSize: 13, color: tokens.color.inkSoft, textAlign: 'right' }}>{nota ?? ''}</span>
    </div>
  );
};

/** Chip técnico: contorno, sólido de acento (texto blanco) o resaltado (texto grafito). */
export const Chip: React.FC<{ label: string; tono?: 'linea' | 'on' | 'am'; p?: number; size?: number }> = ({ label, tono = 'linea', p = 1, size = 14 }) => {
  const s = { linea: { bg: tokens.color.white, fg: tokens.color.ink, bd: 'rgba(29,30,33,0.22)' }, on: { bg: tokens.color.accent, fg: tokens.color.white, bd: tokens.color.accent }, am: { bg: tokens.color.highlight, fg: tokens.color.ink, bd: tokens.color.highlight } }[tono];
  return <span style={{ ...MONO, letterSpacing: '0.08em', fontSize: size, padding: '9px 12px', borderRadius: 5, border: `1px solid ${s.bd}`, background: s.bg, color: s.fg, display: 'inline-block', opacity: p, transform: `scale(${0.9 + 0.1 * p})` }}>{label}</span>;
};

/**
 * Etiqueta con línea guía: un punto en `from`, codo opcional y texto mono. `on` la pinta con el acento.
 * `lado`: hacia dónde se escribe el texto desde el final de la guía.
 */
export const Guia: React.FC<{ from: [number, number]; to: [number, number]; codo?: [number, number]; label: string; num?: string; p: number; on?: boolean; lado?: 'der' | 'izq' | 'centro'; size?: number }> = ({ from, to, codo, label, num, p, on = false, lado = 'der', size = 16 }) => {
  if (p <= 0) return null;
  const c = on ? tokens.color.accent : 'rgba(29,30,33,0.45)';
  const pts = [from, ...(codo ? [codo] : []), to];
  const tx = lado === 'der' ? 'translate(12px, -50%)' : lado === 'izq' ? 'translate(calc(-100% - 12px), -50%)' : 'translate(-50%, calc(-100% - 10px))';
  return (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: p }}>
        <path d={pts.map((q, i) => `${i ? 'L' : 'M'}${q[0]} ${q[1]}`).join(' ')} fill="none" stroke={c} strokeWidth={1.2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
        <circle cx={from[0]} cy={from[1]} r={3.5} fill={on ? tokens.color.accent : tokens.color.ink} />
      </svg>
      <div style={{ position: 'absolute', left: to[0], top: to[1], transform: tx, opacity: p, whiteSpace: 'nowrap', ...MONO, fontSize: size, color: on ? tokens.color.ink : tokens.color.inkSoft }}>
        {num ? <b style={{ fontWeight: 500, color: on ? tokens.color.accent : tokens.color.ink, marginRight: 12 }}>{num}</b> : null}{label}
      </div>
    </>
  );
};

/** Riel de fases (abajo): línea fina, nodos cuadrados, fase activa en amarillo con borde marino. */
export const Riel: React.FC<{ fases: readonly string[]; activo: number; prev?: number; changeAt?: number; p?: number }> = ({ fases, activo, prev, changeAt = 0, p = 1 }) => {
  const t = useSec();
  const k = prev === undefined ? 1 : glide(t, changeAt, 0.8);
  const pos = prev === undefined ? activo : mix(prev, activo, k);
  const x0 = 360, x1 = 1560, y = 1004, n = fases.length;
  const xs = fases.map((_, i) => x0 + ((x1 - x0) * i) / (n - 1));
  if (p <= 0) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: p }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
        <line x1={x0} y1={y} x2={x1} y2={y} stroke="rgba(29,30,33,0.25)" strokeWidth={1.5} />
        <line x1={x0} y1={y} x2={mix(x0, x1, Math.max(0, pos) / (n - 1))} y2={y} stroke={tokens.color.accent} strokeWidth={2.5} />
        {xs.map((x, i) => {
          const on = Math.max(0, 1 - Math.abs(pos - i));
          const done = pos >= i - 0.01;
          const s = 13 + 5 * on;
          return <rect key={i} x={x - s / 2} y={y - s / 2} width={s} height={s} fill={on > 0.5 ? tokens.color.highlight : done ? tokens.color.accent : tokens.color.bg} stroke={on > 0.5 ? tokens.color.navy : done ? tokens.color.accent : 'rgba(29,30,33,0.4)'} strokeWidth={1.5} />;
        })}
      </svg>
      {xs.map((x, i) => {
        const on = Math.max(0, 1 - Math.abs(pos - i));
        return <div key={i} style={{ position: 'absolute', left: x, top: 1026, transform: 'translateX(-50%)', whiteSpace: 'nowrap', ...MONO, fontSize: 15, color: on > 0.5 ? tokens.color.ink : tokens.color.inkFaint }}>{fases[i]}</div>;
      })}
    </div>
  );
};

/** Corchete técnico sobre un rango horizontal, con su etiqueta centrada. */
export const Corchete: React.FC<{ x0: number; x1: number; y: number; label: string; p: number }> = ({ x0, x1, y, label, p }) =>
  p <= 0 ? null : (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: p }}>
        <path d={`M${x0} ${y + 12} V${y} H${x1} V${y + 12} M${(x0 + x1) / 2} ${y} V${y - 16}`} fill="none" stroke={tokens.color.ink} strokeWidth={1.2} />
      </svg>
      <div style={{ position: 'absolute', left: (x0 + x1) / 2, top: y - 26, transform: 'translate(-50%, -100%)', ...MONO, fontSize: 16, color: tokens.color.ink, opacity: p, whiteSpace: 'nowrap' }}>{label}</div>
    </>
  );
