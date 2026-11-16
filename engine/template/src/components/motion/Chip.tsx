import { tokens } from '../../theme/tokens';
import { FONT_FAMILY } from '../../theme/fonts';

export type ChipTone = 'default' | 'solid' | 'blue' | 'warning' | 'vision' | 'ok';

const TONES: Record<ChipTone, { bg: string; fg: string; border: string }> = {
  default: { bg: tokens.color.white, fg: tokens.color.ink, border: tokens.color.line },
  solid: { bg: tokens.color.accent, fg: tokens.color.white, border: tokens.color.accent },
  blue: { bg: tokens.color.accentTint, fg: tokens.color.accent, border: 'transparent' },
  warning: { bg: '#FFF4E0', fg: tokens.color.warning, border: 'rgba(178,106,0,0.25)' },
  vision: { bg: tokens.color.visionTint, fg: tokens.color.vision, border: tokens.color.vision },
  ok: { bg: 'rgba(27,175,122,0.12)', fg: '#0E7A53', border: 'transparent' },
};

/** Chip con la forma de los de la app (pill blanco con filete gris, punto de color opcional). */
export const Chip: React.FC<{ label: string; dot?: string; tone?: ChipTone; size?: number; style?: React.CSSProperties; dashed?: boolean }> = ({
  label, dot, tone = 'default', size = 26, style, dashed,
}) => {
  const c = TONES[tone];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: size * 0.45, whiteSpace: 'nowrap',
      padding: `${size * 0.42}px ${size * 0.8}px`, borderRadius: tokens.radius.pill, background: c.bg, color: c.fg,
      border: `1.5px ${dashed ? 'dashed' : 'solid'} ${c.border}`, fontFamily: FONT_FAMILY, fontSize: size, fontWeight: 500,
      letterSpacing: -0.2, boxShadow: tone === 'default' ? tokens.shadow.card : undefined, ...style,
    }}>
      {dot ? <span style={{ width: size * 0.42, height: size * 0.42, borderRadius: 99, background: dot, flex: 'none' }} /> : null}
      {label}
    </div>
  );
};
