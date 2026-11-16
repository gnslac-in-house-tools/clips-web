import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { tokens } from '../theme/tokens';
import { FONT_FAMILY } from '../theme/fonts';

/** Confirma visualmente una descarga real (el archivo se guardó durante la grabación). */
export const DownloadChip: React.FC<{ atSec: number; text: string; index: number }> = ({ atSec, text, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - atSec * fps, fps, config: tokens.spring.pop });
  const out = interpolate(frame / fps, [atSec + 2.6, atSec + 3.1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{
      position: 'absolute', right: 96, bottom: 150 + index * 72, opacity: Math.min(p, out), transform: `translateY(${(1 - p) * 20}px)`,
      padding: '14px 22px', borderRadius: 16, background: tokens.color.white, boxShadow: tokens.shadow.pill,
      fontFamily: FONT_FAMILY, ...tokens.type.label, color: tokens.color.ink, display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <span style={{ color: tokens.color.accent }}>↓</span>{text}
    </div>
  );
};
