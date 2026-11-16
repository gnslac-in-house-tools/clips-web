import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { tokens } from '../theme/tokens';
import { FONT_FAMILY } from '../theme/fonts';
import { COPY } from '../video.config';
import { IconTile } from './motion/Card';
import { useAppear } from './useWordTime';

export interface FlowNode {
  id: string;
  label: string;
  /** Centro del nodo en px del cuadro (1920×1080). */
  x: number; y: number; w: number; h: number;
  /** Glifo corto del icono (2–3 caracteres) y su color. */
  glyph: string; color: string;
  /** Segundo en que aparece (normalmente `w(segmento, palabra, -0.15)`). */
  at: number;
  /** Paso aún no construido: violeta punteado con la leyenda de Visión. */
  vision?: boolean;
  /** Nodo protagonista (el motor de la app): relleno de acento. */
  hero?: boolean;
}

/**
 * "Un modelo, muchas vistas": nodos con la piel de la app que aparecen al ritmo de la voz y
 * conexiones por las que fluyen datos. Para escenas de Promesa.
 */
export const FlowDiagram: React.FC<{ nodes: FlowNode[]; edges: [string, string][] }> = ({ nodes, edges }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {edges.map(([a, b]) => {
          const na = byId[a], nb = byId[b];
          if (!na || !nb) return null;
          const x1 = na.x + na.w / 2, y1 = na.y, x2 = nb.x - nb.w / 2, y2 = nb.y;
          const mx = (x1 + x2) / 2;
          const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
          const p = interpolate(t, [nb.at - 0.4, nb.at], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const vision = na.vision || nb.vision;
          const color = vision ? tokens.color.vision : tokens.color.accent;
          return (
            <g key={`${a}-${b}`}>
              <path d={d} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" pathLength={1}
                strokeDasharray={vision ? undefined : '1 1'} strokeDashoffset={vision ? 0 : 1 - p} opacity={vision ? p * 0.8 : 0.9}
                style={vision ? { strokeDasharray: '0.012 0.012' } : undefined} />
              {p >= 1 && !vision ? [0, 1, 2].map((k) => {
                const u = ((t - nb.at) * 0.55 + k / 3) % 1;
                const [cx, cy] = bezier(u, [x1, y1], [mx, y1], [mx, y2], [x2, y2]);
                return <circle key={k} cx={cx} cy={cy} r={6} fill={color} opacity={Math.sin(u * Math.PI)} />;
              }) : null}
            </g>
          );
        })}
      </svg>
      {nodes.map((n) => <Node key={n.id} node={n} />)}
    </>
  );
};

type Pt = [number, number];
const bezier = (u: number, a: Pt, b: Pt, c: Pt, d: Pt): Pt => {
  const v = 1 - u;
  return [0, 1].map((k) => v ** 3 * a[k]! + 3 * v * v * u * b[k]! + 3 * v * u * u * c[k]! + u ** 3 * d[k]!) as Pt;
};

const Node: React.FC<{ node: FlowNode }> = ({ node }) => {
  const p = useAppear(node.at, tokens.spring.pop);
  return (
    <div style={{
      position: 'absolute', left: node.x - node.w / 2, top: node.y - node.h / 2, width: node.w, height: node.h,
      borderRadius: 22, fontFamily: FONT_FAMILY, opacity: p, transform: `scale(${0.8 + 0.2 * p})`,
      background: node.vision ? `linear-gradient(160deg, #fff, #F1EEFB)` : node.hero ? tokens.color.accent : tokens.color.white,
      border: `2px ${node.vision ? 'dashed' : 'solid'} ${node.vision ? tokens.color.vision : node.hero ? tokens.color.accent : tokens.color.line}`,
      boxShadow: tokens.shadow.card, display: 'flex', alignItems: 'center', padding: '0 22px', gap: 14,
      fontSize: 27, fontWeight: 600, color: node.hero ? tokens.color.white : tokens.color.ink, letterSpacing: -0.4,
    }}>
      <IconTile color={node.hero ? 'rgba(255,255,255,0.22)' : node.color} label={node.glyph} size={42} />
      {node.label}
      {node.vision ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: node.h + 12, textAlign: 'center', fontSize: 18, fontWeight: 600, color: tokens.color.vision }}>{COPY.visionBadge}</div>
      ) : null}
    </div>
  );
};
