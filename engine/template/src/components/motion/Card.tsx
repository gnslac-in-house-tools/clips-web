import { useCurrentFrame, useVideoConfig } from 'remotion';
import { tokens } from '../../theme/tokens';
import { FONT_FAMILY } from '../../theme/fonts';
import { useAppear } from '../useWordTime';

/**
 * Tarjeta con la piel de los paneles de la app (blanco, filete gris, radio y sombra suaves).
 * Entra con un pop y luego flota apenas (`float`), para que la composición respire.
 */
export const Card: React.FC<{
  at: number; x: number; y: number; w: number; h?: number; title?: string; icon?: React.ReactNode; rotate?: number;
  float?: number; dim?: number; tone?: 'default' | 'vision'; children?: React.ReactNode; style?: React.CSSProperties;
}> = ({ at, x, y, w, h, title, icon, rotate = 0, float = 6, dim = 0, tone = 'default', children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = useAppear(at, tokens.spring.pop);
  const bob = Math.sin((frame / fps) * 1.1 + x * 0.01) * float;
  const vision = tone === 'vision';
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: tokens.radius.card,
      background: vision ? `linear-gradient(160deg, ${tokens.color.white} 0%, #F1EEFB 100%)` : tokens.color.white,
      border: `1.5px ${vision ? 'dashed' : 'solid'} ${vision ? tokens.color.vision : tokens.color.line}`,
      boxShadow: tokens.shadow.card, fontFamily: FONT_FAMILY, overflow: 'hidden',
      opacity: p, transform: `translateY(${(1 - p) * 60 + bob}px) rotate(${rotate}deg) scale(${0.92 + 0.08 * p})`,
      filter: dim ? `grayscale(${dim})` : undefined, ...style,
    }}>
      {title ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '22px 26px 0', fontSize: 22, fontWeight: 600, color: vision ? tokens.color.vision : tokens.color.inkSoft, letterSpacing: 0.2 }}>
          {icon}{title}
        </div>
      ) : null}
      {children}
    </div>
  );
};

/** Icono cuadrado redondeado de color, como los de la paleta de la app. */
export const IconTile: React.FC<{ color: string; label: string; size?: number }> = ({ color, label, size = 40 }) => (
  <span style={{ width: size, height: size, borderRadius: size * 0.28, background: color, color: tokens.color.white, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, letterSpacing: 0 }}>
    {label}
  </span>
);
