import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { tokens } from '../../theme/tokens';
import { FONT_FAMILY } from '../../theme/fonts';
import { useAppear } from '../useWordTime';

export type MarkTone = 'yellow' | 'blue' | 'violet';

const MARK: Record<MarkTone, string> = { yellow: tokens.color.highlight, blue: tokens.color.accentTint, violet: tokens.color.visionTint };

/** Resaltador: una franja que barre de izquierda a derecha detrás del texto, como un marcador. */
export const Mark: React.FC<{ at: number; tone?: MarkTone; children: React.ReactNode }> = ({ at, tone = 'yellow', children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = interpolate(frame / fps, [at, at + 0.45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (u) => 1 - (1 - u) ** 3 });
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span style={{ position: 'absolute', left: '-0.08em', right: '-0.08em', bottom: '0.06em', height: '0.42em', background: MARK[tone], transformOrigin: 'left center', transform: `scaleX(${p})`, borderRadius: 6, zIndex: 0 }} />
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </span>
  );
};

/**
 * Titular cinético: cada palabra entra con un leve ascenso y desenfoque, escalonada.
 * `marks` resalta palabras (por su texto, sin puntuación) a partir de `markAt`.
 */
export const Words: React.FC<{
  text: string; at: number; stagger?: number; style?: React.CSSProperties; color?: Record<string, string>;
  marks?: string[]; markAt?: number; markTone?: MarkTone; out?: number;
}> = ({ text, at, stagger = 0.06, style, color = {}, marks = [], markAt, markTone = 'yellow', out = 0 }) => {
  const words = text.split(' ');
  return (
    <div style={{ fontFamily: FONT_FAMILY, color: tokens.color.ink, ...tokens.type.title, ...style, opacity: 1 - out, transform: `translateY(${-out * 30}px)` }}>
      {words.map((w, i) => {
        const bare = w.replace(/[.,:;¿?¡!]/g, '');
        const inner = marks.includes(bare) ? <Mark at={markAt ?? at + 0.6} tone={markTone}>{w}</Mark> : w;
        return (
          <Word key={`${w}-${i}`} at={at + i * stagger} color={color[bare]}>
            {inner}{i < words.length - 1 ? ' ' : ''}
          </Word>
        );
      })}
    </div>
  );
};

const Word: React.FC<{ at: number; color?: string; children: React.ReactNode }> = ({ at, color, children }) => {
  const p = useAppear(at, tokens.spring.gentle);
  return (
    <span style={{ display: 'inline-block', whiteSpace: 'pre', opacity: p, color, transform: `translateY(${(1 - p) * 26}px)`, filter: `blur(${(1 - p) * 8}px)` }}>
      {children}
    </span>
  );
};
