import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ResolvedBeat } from '../core/beats';
import { tokens } from '../theme/tokens';
import { FONT_FAMILY } from '../theme/fonts';

type C = Extract<ResolvedBeat, { kind: 'callout' }>;

export const Callouts: React.FC<{ beats: ResolvedBeat[]; cameraScale: number }> = ({ beats, cameraScale }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const inv = 1 / cameraScale;
  return (
    <>
      {beats.filter((b): b is C => b.kind === 'callout' && t >= b.atSec && t <= b.untilSec + 0.3).map((b, i) => {
        const inP = spring({ frame: frame - b.atSec * fps, fps, config: tokens.spring.pop });
        const out = interpolate(t, [b.untilSec, b.untilSec + 0.3], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const gap = 18 * inv;
        const pos: React.CSSProperties =
          b.side === 'bottom' ? { left: b.rect.x + b.rect.w / 2, top: b.rect.y + b.rect.h + gap, transform: `translate(-50%, 0) scale(${inv * inP})`, transformOrigin: '50% 0' }
          : b.side === 'left' ? { left: b.rect.x - gap, top: b.rect.y + b.rect.h / 2, transform: `translate(-100%, -50%) scale(${inv * inP})`, transformOrigin: '100% 50%' }
          : b.side === 'right' ? { left: b.rect.x + b.rect.w + gap, top: b.rect.y + b.rect.h / 2, transform: `translate(0, -50%) scale(${inv * inP})`, transformOrigin: '0 50%' }
          : { left: b.rect.x + b.rect.w / 2, top: b.rect.y - gap, transform: `translate(-50%, -100%) scale(${inv * inP})`, transformOrigin: '50% 100%' };
        return (
          <div key={i} style={{
            position: 'absolute', ...pos, opacity: out, whiteSpace: 'nowrap', padding: '10px 18px', borderRadius: tokens.radius.pill,
            background: tokens.color.ink, color: tokens.color.white, fontFamily: FONT_FAMILY, ...tokens.type.label, boxShadow: tokens.shadow.pill,
          }}>
            {b.text}
          </div>
        );
      })}
    </>
  );
};
