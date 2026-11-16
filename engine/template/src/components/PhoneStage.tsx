import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { MousePoint, Recording } from '../core/events';
import { CAPTURE, COPY } from '../video.config';
import { tokens } from '../theme/tokens';
import { FONT_FAMILY } from '../theme/fonts';
import { Background } from './Background';

const { width: PW, height: PH } = CAPTURE.phone.viewport;
const BEZEL = 14;

/**
 * Escena En vivo grabada en teléfono (`device: 'phone'`): la captura vertical dentro de un teléfono
 * sin marca, con la misma sombra larga que AppWindow. `x`: centro horizontal del teléfono en el cuadro.
 * Sin cámara ni flecha de cursor: en táctil se dibuja un punto de toque (TouchDot) mientras se presiona.
 */
export const PhoneStage: React.FC<{ recording: Recording | null; shot: string | null; x?: number; y?: number; scale?: number; children?: React.ReactNode; background?: boolean }> = ({
  recording, shot, x = 960, y = 540, scale = 1.12, children, background = true,
}) => {
  const w = PW + BEZEL * 2, h = PH + BEZEL * 2;
  return (
    <>
      {background ? <Background /> : null}
      <AbsoluteFill>
        <div style={{
          position: 'absolute', left: x - (w * scale) / 2, top: y - (h * scale) / 2, width: w, height: h,
          transform: `scale(${scale})`, transformOrigin: '0 0', borderRadius: 64, background: '#1D1D1F', padding: BEZEL,
          boxShadow: tokens.shadow.window, boxSizing: 'border-box',
        }}>
          <div style={{ width: PW, height: PH, borderRadius: 50, overflow: 'hidden', background: tokens.color.white, position: 'relative' }}>
            {recording ? <OffthreadVideo src={staticFile(recording.video)} muted style={{ width: PW, height: PH }} />
              : shot ? <Img src={staticFile(shot)} style={{ width: PW, height: PH }} />
              : <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily: FONT_FAMILY, color: tokens.color.inkFaint, fontSize: 22 }}>{COPY.noCapture}</AbsoluteFill>}
            {recording ? <TouchDot mouse={recording.mouse} /> : null}
          </div>
        </div>
        {children}
      </AbsoluteFill>
    </>
  );
};

/** Cuánto sigue visible el punto después de soltar (un toque dura ~70 ms: sin esto sería un parpadeo). */
const RELEASE_SEC = 0.35;

/** Punto de toque: un dedo sobre la pantalla, en coordenadas CSS del teléfono. */
const TouchDot: React.FC<{ mouse: MousePoint[] }> = ({ mouse }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  let last: MousePoint | null = null;
  let current: MousePoint | null = null;
  for (const m of mouse) {
    if (m.tSec > t) break;
    current = m;
    if (m.down) last = m;
  }
  if (!last || !current) return null;
  const since = current.down ? 0 : t - last.tSec;
  if (since > RELEASE_SEC) return null;
  const at = current.down ? current : last;
  const o = 1 - since / RELEASE_SEC;
  const r = 22 + since * 30;
  return (
    <div style={{
      position: 'absolute', left: at.x - r, top: at.y - r, width: r * 2, height: r * 2, borderRadius: 999,
      background: 'rgba(29,29,31,0.28)', border: '2px solid rgba(255,255,255,0.9)', boxShadow: tokens.shadow.pill,
      opacity: o, pointerEvents: 'none',
    }} />
  );
};
