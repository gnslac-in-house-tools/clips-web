import { tokens } from '../../theme/tokens';
import { ramp } from './base';

/**
 * Pareto técnico sin cifras: barras con contorno fino, las `top` primeras en amarillo con borde marino, el resto en
 * semitono de acento; línea acumulada con nodos cuadrados. `draw` anima barras y línea; `foco` atenúa el resto.
 */
export const Pareto: React.FC<{ id: string; x: number; y: number; w: number; h: number; valores: number[]; top?: number; draw: number; foco: number }> = ({ id, x, y, w, h, valores, top = 3, draw, foco }) => {
  const n = valores.length;
  const gap = w * 0.018;
  const bw = (w - gap * (n - 1)) / n;
  const max = Math.max(...valores);
  const tot = valores.reduce((a, b) => a + b, 0);
  let acc = 0;
  const cum = valores.map((v) => (acc += v) / tot);
  const base = y + h;
  const cx = (i: number) => x + i * (bw + gap) + bw / 2;
  const cy = (c: number) => base - h * 1.04 * c;
  const lineP = ramp(draw, 0.45, 0.55);
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      <defs><pattern id={id} width={7} height={7} patternUnits="userSpaceOnUse"><circle cx={2} cy={2} r={1.35} fill={tokens.color.accent} opacity={0.75} /></pattern></defs>
      <path d={`M${x - 16} ${base} H${x + w + 16}`} stroke="rgba(29,30,33,0.5)" strokeWidth={1.2} />
      {valores.map((v, i) => {
        const hh = (h * 0.92 * v) / max * ramp(draw, i * 0.04, 0.45);
        const hot = i < top;
        return <rect key={i} x={x + i * (bw + gap)} y={base - hh} width={bw} height={hh} fill={hot ? tokens.color.highlight : `url(#${id})`} stroke={hot ? tokens.color.navy : 'rgba(29,30,33,0.45)'} strokeWidth={1.2} opacity={hot ? 1 : 1 - 0.55 * foco} />;
      })}
      <path d={cum.map((c, i) => `${i ? 'L' : 'M'}${cx(i)} ${cy(c)}`).join(' ')} fill="none" stroke={tokens.color.accent} strokeWidth={2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - lineP} />
      {cum.map((c, i) => <rect key={i} x={cx(i) - 4} y={cy(c) - 4} width={8} height={8} fill="#fff" stroke={tokens.color.accent} strokeWidth={1.6} opacity={ramp(lineP, i / n, 0.15)} />)}
    </svg>
  );
};
