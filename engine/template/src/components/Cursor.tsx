import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { mouseAt } from '../core/cursor';
import type { MousePoint, RecEvent } from '../core/events';
import { tokens } from '../theme/tokens';

/** Cursor dibujado desde la trayectoria registrada; tamaño constante aunque la cámara haga zoom. */
export const Cursor: React.FC<{ mouse: MousePoint[]; events: RecEvent[]; cameraScale: number }> = ({ mouse, events, cameraScale }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const m = mouseAt(mouse, t);
  if (!m.visible) return null;
  const inv = 1 / cameraScale;
  const pulses = events.filter((e) => (e.kind === 'click' || e.kind === 'drag') && t >= e.endSec - 0.12 && t < e.endSec + 0.45);
  return (
    <>
      {pulses.map((e) => {
        const p = interpolate(t, [e.endSec - 0.12, e.endSec + 0.45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <div key={e.id} style={{
            position: 'absolute', left: m.x, top: m.y, width: 64 * inv, height: 64 * inv, marginLeft: -32 * inv, marginTop: -32 * inv,
            borderRadius: '50%', border: `${2.5 * inv}px solid ${tokens.color.accent}`, opacity: 1 - p, transform: `scale(${0.3 + p})`,
          }} />
        );
      })}
      <svg width={30 * inv} height={30 * inv} viewBox="0 0 30 30" style={{ position: 'absolute', left: m.x - 3 * inv, top: m.y - 2 * inv, transform: `scale(${m.down ? 0.9 : 1})`, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}>
        <path d="M3 2 L3 24 L9 18.5 L13 27 L17 25.2 L13 17 L21 17 Z" fill="#1D1D1F" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </>
  );
};
