import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { tokens } from '../theme/tokens';

/**
 * Lienzo técnico (piel default): fondo neutro, retícula fina y cruces de registro en las esquinas.
 * Sin orbes ni gradientes detrás de los gráficos: el color vive en los datos.
 * `filete`: línea de marca que se dibuja arriba (tokens.color.brandLine). `cruces`: marcas de registro.
 */
export const Background: React.FC<{ filete?: boolean; cruces?: boolean; reticula?: boolean }> = ({ filete = false, cruces = false, reticula = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const line = interpolate(t, [0.1, 1.1], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const grid = 'rgba(29,30,33,0.045)';
  return (
    <AbsoluteFill style={{ background: tokens.color.bg }}>
      {reticula ? (
        <AbsoluteFill style={{ backgroundImage: `linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`, backgroundSize: '96px 96px', backgroundPosition: '0 -4px' }} />
      ) : null}
      {cruces ? [[72, 140], [1848, 140], [72, 1000], [1848, 1000]].map(([x, y]) => <Cruz key={`${x}-${y}`} x={x!} y={y!} />) : null}
      {filete ? <div style={{ position: 'absolute', left: 0, top: 0, height: 4, width: '100%', clipPath: `inset(0 ${100 - line}% 0 0)`, background: tokens.color.brandLine }} /> : null}
    </AbsoluteFill>
  );
};

/** Cruz de registro «+». */
export const Cruz: React.FC<{ x: number; y: number; size?: number; color?: string }> = ({ x, y, size = 22, color = 'rgba(29,30,33,0.45)' }) => (
  <svg width={size} height={size} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2 }}>
    <path d={`M${size / 2} 0 V${size} M0 ${size / 2} H${size}`} stroke={color} strokeWidth={1.5} />
  </svg>
);
