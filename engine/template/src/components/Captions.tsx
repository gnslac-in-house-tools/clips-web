import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { captionsForSegment } from '../core/captions';
import type { SceneTimeline } from '../core/timeline';
import { tokens } from '../theme/tokens';
import { FONT_FAMILY } from '../theme/fonts';

export const Captions: React.FC<{ timeline: SceneTimeline }> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  for (const seg of timeline.segments) {
    const lines = captionsForSegment(seg.text, seg.alignment, seg.endSec - seg.startSec);
    for (const l of lines) {
      const a = seg.startSec + l.startSec;
      const b = seg.startSec + l.endSec + 0.15;
      if (t >= a && t < b) {
        const o = interpolate(t, [a, a + 0.12, b - 0.12, b], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <div style={{ position: 'absolute', bottom: 92, width: '100%', textAlign: 'center', fontFamily: FONT_FAMILY, ...tokens.type.caption, opacity: o }}>
            <span style={{ background: 'rgba(29,29,31,0.78)', color: tokens.color.white, padding: '10px 22px', borderRadius: 14 }}>{l.text}</span>
          </div>
        );
      }
    }
  }
  return null;
};
