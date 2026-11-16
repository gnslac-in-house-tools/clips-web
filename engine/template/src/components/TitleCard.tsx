import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { tokens } from '../theme/tokens';
import { FONT_FAMILY } from '../theme/fonts';

export const TitleCard: React.FC<{ title: string; kicker?: string; atSec?: number; size?: 'hero' | 'title' }> = ({ title, kicker, atSec = 0, size = 'title' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - atSec * fps, fps, config: tokens.spring.gentle });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily: FONT_FAMILY, color: tokens.color.ink }}>
      {kicker ? <div style={{ ...tokens.type.label, color: tokens.color.inkSoft, opacity: p, marginBottom: 18, textTransform: 'uppercase' }}>{kicker}</div> : null}
      <div style={{ ...tokens.type[size], opacity: p, transform: `translateY(${interpolate(p, [0, 1], [24, 0])}px)`, textAlign: 'center', maxWidth: 1400 }}>{title}</div>
    </AbsoluteFill>
  );
};
