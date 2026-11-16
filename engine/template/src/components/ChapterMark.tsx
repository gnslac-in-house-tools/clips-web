import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { tokens } from '../theme/tokens';
import { FONT_MONO } from '../theme/fonts';

/** Marca de capítulo técnica: «— 02 · DISEÑO» en mono, arriba a la izquierda. Aparece a los 0.3 s y se va a los 4.2 s. */
export const ChapterMark: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = interpolate(frame, [0.3 * fps, 0.8 * fps, 3.5 * fps, 4.2 * fps], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const [first, ...rest] = label.split(' ');
  const numbered = /^\d+$/.test(first ?? '');
  const text = numbered ? `${first} · ${rest.join(' ')}` : label;
  return (
    <div style={{
      position: 'absolute', left: 72, top: 50, display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT_MONO, fontSize: 17, fontWeight: 500,
      letterSpacing: '0.18em', textTransform: 'uppercase', color: tokens.color.inkSoft, opacity: o, transform: `translateX(${(1 - o) * -16}px)`,
    }}>
      <span style={{ width: 40, height: 1.5, background: tokens.color.inkSoft }} />
      {text}
    </div>
  );
};
