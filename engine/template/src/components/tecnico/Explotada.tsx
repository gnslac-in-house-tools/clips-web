import { tokens } from '../../theme/tokens';
import { mix } from './base';

/**
 * Axonometría explotada por capas (piel técnica, default de la skill), al estilo del portafolio del usuario:
 * losas translúcidas, muros que se desvanecen hacia abajo, semitono de puntos para datos, un acento en rutas y
 * nodos, conectores punteados entre capas. Edificio rectangular genérico (`ancho` × `fondo` m) con cuatro tipos
 * de capa. `explode` 1 = capas separadas; 0 = edificio armado (se anima para «construir»).
 */
export type TipoCapa = 'estructura' | 'programa' | 'instalaciones' | 'cubierta';
export interface Capa { tipo: TipoCapa; num: string; nombre: string }

export const CAPAS_TIENDA: Capa[] = [
  { tipo: 'estructura', num: '01', nombre: 'Estructura' },
  { tipo: 'programa', num: '02', nombre: 'Programa' },
  { tipo: 'instalaciones', num: '03', nombre: 'Instalaciones' },
  { tipo: 'cubierta', num: '04', nombre: 'Cubierta' },
];

const C = Math.cos(Math.PI / 6);
const S = 0.5;
const HM = 1.0;

export interface Geo { Q: (x: number, y: number, z: number) => [number, number]; zs: number[]; s: number; ancho: number; fondo: number }

/** Geometría: escala y centrado según la separación actual; al armarse (`explode` → 0) el edificio crece y se centra en la caja. */
export function geometria({ caja: [bx, by, bw, bh], n, ancho = 12, fondo = 8, sep = 5.6, explode = 1 }: { caja: [number, number, number, number]; n: number; ancho?: number; fondo?: number; sep?: number; explode?: number }): Geo {
  const P1 = (x: number, y: number, z: number): [number, number] => [(x - y) * C, (x + y) * S - z];
  const gap = mix(HM * 1.05, sep, explode);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) for (const [x, y] of [[0, 0], [ancho, 0], [ancho, fondo], [0, fondo]] as const) { pts.push(P1(x, y, i * gap)); pts.push(P1(x, y, i * gap + HM)); }
  const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
  const s = Math.min(bw / (Math.max(...xs) - Math.min(...xs)), bh / (Math.max(...ys) - Math.min(...ys)));
  const dx = bx + (bw - (Math.max(...xs) - Math.min(...xs)) * s) / 2 - Math.min(...xs) * s;
  const dy = by + (bh - (Math.max(...ys) - Math.min(...ys)) * s) / 2 - Math.min(...ys) * s;
  const zs = Array.from({ length: n }, (_, i) => i * gap);
  return { Q: (x, y, z) => [(x - y) * C * s + dx, ((x + y) * S - z) * s + dy], zs, s, ancho, fondo };
}

export interface Marca { capa: number; x: number; y: number; tono: 'amber' | 'ok' | 'accent'; p: number }

export const Explotada: React.FC<{
  id: string; caja: [number, number, number, number]; capas?: Capa[]; explode?: number;
  /** Aparición por capa (0→1): cae desde arriba. */
  aparece?: number[];
  /** Capa en foco (losa amarilla tenue, ruta y etiqueta en acento). */
  resalta?: number;
  /** Trazo de la ruta de instalaciones (0→1). */
  ruta?: number;
  /** Relleno de acento por capa (construido / gemelo digital). */
  relleno?: number[];
  /** Componentes repetibles (góndolas) en amarillo. */
  modulos?: number;
  marcas?: Marca[];
  opacity?: number;
}> = ({ id, caja, capas = CAPAS_TIENDA, explode = 1, aparece, resalta = -1, ruta = 1, relleno, modulos = 0, marcas = [], opacity = 1 }) => {
  const g = geometria({ caja, n: capas.length, explode });
  const { Q, zs, ancho: W, fondo: D } = g;
  const f = (p: [number, number]) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  const poly = (arr: [number, number][], z: number) => 'M' + arr.map(([x, y]) => f(Q(x, y, z))).join(' L') + ' Z';
  const ln = (a: [number, number, number], b: [number, number, number]) => `M${f(Q(...a))} L${f(Q(...b))}`;
  const rect = (x0: number, y0: number, x1: number, y1: number): [number, number][] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const stroke = 'rgba(29,30,33,0.62)';

  const muro = (a: [number, number], b: [number, number], z: number, h: number, key: string) => (
    <g key={key}>
      <path d={`M${f(Q(a[0], a[1], z))} L${f(Q(b[0], b[1], z))} L${f(Q(b[0], b[1], z + h))} L${f(Q(a[0], a[1], z + h))} Z`} fill={`url(#${id}m)`} />
      <path d={ln([a[0], a[1], z + h], [b[0], b[1], z + h])} stroke={stroke} strokeWidth={1.2} fill="none" />
      <path d={`${ln([a[0], a[1], z], [a[0], a[1], z + h])} ${ln([b[0], b[1], z], [b[0], b[1], z + h])}`} stroke="rgba(29,30,33,0.22)" strokeWidth={1} fill="none" />
    </g>
  );
  const muros = (lista: [[number, number], [number, number]][], z: number, h: number, pre: string) =>
    lista.slice().sort((p, q) => p[0][0] + p[0][1] + p[1][0] + p[1][1] - (q[0][0] + q[0][1] + q[1][0] + q[1][1])).map(([a, b], i) => muro(a, b, z, h, `${pre}${i}`));
  const caja3 = (x0: number, y0: number, x1: number, y1: number, z: number, h: number, key: string, top = 'rgba(255,255,255,0.7)') => (
    <g key={key}>
      {muros([[[x0, y0], [x1, y0]], [[x0, y0], [x0, y1]], [[x1, y0], [x1, y1]], [[x0, y1], [x1, y1]]], z, h, key)}
      <path d={poly(rect(x0, y0, x1, y1), z + h)} fill={top} stroke="rgba(29,30,33,0.55)" strokeWidth={1} />
    </g>
  );
  const losa = (z: number, op: number, i: number, dash?: string) => (
    <>
      <path d={poly(rect(0, 0, W, D), z)} fill={i === resalta ? 'rgba(241,210,36,0.16)' : `rgba(255,255,255,${op})`} stroke="rgba(29,30,33,0.55)" strokeWidth={1.2} strokeDasharray={dash} />
      {relleno?.[i] ? <path d={poly(rect(0, 0, W, D), z)} fill={tokens.color.accent} opacity={0.12 * relleno[i]!} /> : null}
      <path d={`M${f(Q(W, 0, z))} L${f(Q(W, 0, z - 0.14))} L${f(Q(W, D, z - 0.14))} L${f(Q(0, D, z - 0.14))} L${f(Q(0, D, z))}`} stroke="rgba(29,30,33,0.35)" strokeWidth={1} fill="none" />
    </>
  );

  const contenido = (c: Capa, i: number) => {
    const z = zs[i]!;
    switch (c.tipo) {
      case 'estructura': {
        const cols: [number, number][] = [];
        for (const x of [0, W / 3, (2 * W) / 3, W]) for (const y of [0, D / 2, D]) cols.push([x, y]);
        return (
          <>
            {losa(z, 0.22, i)}
            <path d={cols.map(([x, y]) => ln([x, y, z], [x, y, z + HM])).join(' ')} stroke="rgba(29,30,33,0.55)" strokeWidth={1.6} fill="none" />
            <path d={[0, D / 2, D].map((y) => ln([0, y, z + HM], [W, y, z + HM])).join(' ') + ' ' + [0, W / 3, (2 * W) / 3, W].map((x) => ln([x, 0, z + HM], [x, D, z + HM])).join(' ')} stroke="rgba(29,30,33,0.28)" strokeWidth={1} fill="none" />
          </>
        );
      }
      case 'programa': {
        const zona = rect(0.2, 0.2, W * 0.65, D - 0.2);
        return (
          <>
            {losa(z, 0.32, i)}
            <mask id={`${id}k${i}`} maskUnits="userSpaceOnUse"><path d={poly(zona, z)} fill={`url(#${id}r)`} /></mask>
            <rect x={0} y={0} width={1920} height={1080} fill={`url(#${id}p)`} mask={`url(#${id}k${i})`} />
            {muros([[[0, 0], [W, 0]], [[0, 0], [0, D]], [[W, 0], [W, D]], [[0, D], [W * 0.25, D]], [[W * 0.42, D], [W, D]], [[W * 0.67, 0], [W * 0.67, D * 0.78]], [[W * 0.67, D * 0.56], [W, D * 0.56]], [[W * 0.67, D * 0.78], [W, D * 0.78]]], z, HM, `${id}pm`)}
            {[0.2, 0.42, 0.64].map((k, j) => caja3(W * 0.1, D * k, W * 0.55, D * k + 0.55, z, 0.5, `${id}g${j}`, modulos > 0 ? `rgba(241,210,36,${0.25 + 0.6 * modulos})` : undefined))}
          </>
        );
      }
      case 'instalaciones': {
        const r: [number, number][] = [[W * 0.12, D * 0.25], [W * 0.88, D * 0.25], [W * 0.88, D * 0.75], [W * 0.33, D * 0.75]];
        const [nx, ny] = Q(W * 0.88, D * 0.25, z + 0.4);
        return (
          <>
            {losa(z, 0.35, i, '6 6')}
            <path d={'M' + r.map(([x, y]) => f(Q(x, y, z + 0.4))).join(' L')} stroke={tokens.color.accent} strokeWidth={2.6} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ruta} strokeLinecap="round" />
            <path d={`${ln([W * 0.42, D * 0.25, z + 0.4], [W * 0.42, D * 0.1, z + 0.4])} ${ln([W * 0.67, D * 0.75, z + 0.4], [W * 0.67, D * 0.9, z + 0.4])} ${ln([W * 0.2, D * 0.25, z + 0.4], [W * 0.2, D * 0.43, z + 0.4])}`} stroke={tokens.color.accent} strokeWidth={1.6} opacity={0.7 * ruta} fill="none" />
            {([[W * 0.42, D * 0.1], [W * 0.67, D * 0.9], [W * 0.2, D * 0.43], [W * 0.33, D * 0.75]] as [number, number][]).map(([x, y], j) => { const [px, py] = Q(x, y, z + 0.4); return <rect key={j} x={px - 4} y={py - 4} width={8} height={8} fill="#fff" stroke={tokens.color.accent} strokeWidth={1.6} opacity={ruta} />; })}
            <circle cx={nx} cy={ny} r={15} fill="none" stroke={tokens.color.accent} strokeWidth={1} opacity={0.5 * ruta} />
            <circle cx={nx} cy={ny} r={7} fill={tokens.color.highlight} stroke={tokens.color.navy} strokeWidth={2} opacity={ruta} />
          </>
        );
      }
      case 'cubierta':
        return (
          <>
            {losa(z, 0.42, i)}
            {muros([[[0, 0], [W, 0]], [[0, 0], [0, D]], [[W, 0], [W, D]], [[0, D], [W, D]]], z, 0.32, `${id}cp`)}
            {caja3(W * 0.2, D * 0.375, W * 0.38, D * 0.575, z, 0.9, `${id}e1`)}
            {caja3(W * 0.52, D * 0.375, W * 0.65, D * 0.51, z, 0.6, `${id}e2`)}
          </>
        );
    }
  };

  const conectores: [number, number][] = [[W * 0.25, D * 0.25], [W * 0.8, D * 0.75]];
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity }}>
      <defs>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1D1E21" stopOpacity={0.16} /><stop offset="1" stopColor="#1D1E21" stopOpacity={0.015} /></linearGradient>
        <pattern id={`${id}p`} width={7} height={7} patternUnits="userSpaceOnUse"><circle cx={2} cy={2} r={1.35} fill={tokens.color.accent} /></pattern>
        <radialGradient id={`${id}r`} cx=".38" cy=".55" r=".62"><stop offset="0" stopColor="#fff" /><stop offset=".55" stopColor="#fff" stopOpacity={0.55} /><stop offset="1" stopColor="#fff" stopOpacity={0} /></radialGradient>
      </defs>
      {capas.map((c, i) => {
        const p = aparece?.[i] ?? 1;
        if (p <= 0) return null;
        const next = i < capas.length - 1 && (aparece?.[i + 1] ?? 1) > 0;
        return (
          <g key={i}>
            <g opacity={p} transform={`translate(0 ${(1 - p) * -40})`}>{contenido(c, i)}</g>
            {next && explode > 0.15 ? (
              <path d={conectores.map(([x, y]) => ln([x, y, zs[i]! + (c.tipo === 'programa' ? HM : 0.1)], [x, y, zs[i + 1]!])).join(' ')} stroke={tokens.color.accent} strokeWidth={1.2} strokeDasharray="3 5" opacity={0.75 * explode * (aparece?.[i + 1] ?? 1)} fill="none" />
            ) : null}
          </g>
        );
      })}
      {marcas.map((m, i) => {
        if (m.p <= 0) return null;
        const [px, py] = Q(m.x * W, m.y * D, zs[m.capa]! + 0.5);
        const col = m.tono === 'amber' ? tokens.color.warning : m.tono === 'ok' ? tokens.color.ok : tokens.color.accent;
        return (
          <g key={i} opacity={m.p}>
            <circle cx={px} cy={py} r={20} fill="none" stroke={col} strokeWidth={1.4} />
            <rect x={px - 7} y={py - 7} width={14} height={14} fill={col} stroke="#fff" strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
};

/** Punto en pantalla de la esquina derecha de una capa (para anclar etiquetas con línea guía). */
export const esquinaCapa = (g: Geo, i: number): [number, number] => g.Q(g.ancho, 0, g.zs[i]!);
/** Punto en pantalla de una posición relativa (0–1) sobre una capa. */
export const puntoCapa = (g: Geo, i: number, x: number, y: number, dz = 0.5): [number, number] => g.Q(x * g.ancho, y * g.fondo, g.zs[i]! + dz);
