import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ResolvedBeat } from '../core/beats';
import { tokens } from '../theme/tokens';

type Spot = Extract<ResolvedBeat, { kind: 'spotlight' }>;

export const Spotlights: React.FC<{ beats: ResolvedBeat[]; cameraScale: number }> = ({ beats, cameraScale }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const active = beats.filter((b): b is Spot => b.kind === 'spotlight' && t >= b.atSec - 0.3 && t <= b.untilSec + 0.4);
  if (!active.length) return null;
  const inv = 1 / cameraScale;
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
      {active.map((b, i) => {
        const o = interpolate(t, [b.atSec - 0.3, b.atSec + 0.2, b.untilSec, b.untilSec + 0.4], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const r = { x: b.rect.x - 10, y: b.rect.y - 10, w: b.rect.w + 20, h: b.rect.h + 20 };
        return (
          <g key={i} opacity={o}>
            <defs>
              <mask id={`spot-${i}`}>
                <rect width={1920} height={1080} fill="white" />
                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={12} fill="black" />
              </mask>
            </defs>
            <rect width={1920} height={1080} fill="rgba(20,20,24,0.38)" mask={`url(#spot-${i})`} />
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={12} fill="none" stroke={tokens.color.accent} strokeWidth={3 * inv} />
          </g>
        );
      })}
    </svg>
  );
};
