import { useCurrentFrame, useVideoConfig } from 'remotion';
import { cameraAt, cameraTransform, stateFor, withSettle } from '../core/camera';
import { FLAGS } from '../video.config';

/** Movimiento de cámara (cameraAt) + margen: la cámara llega a vista completa antes de que empiece el fundido. */
const SETTLE_SEC = 1.2 + 0.2;

/** Segundo en que la escena empieza a cerrar: la cámara vuelve a vista completa y se apagan los resaltes. */
export const settleStart = (sceneSec: number) => sceneSec - SETTLE_SEC - FLAGS.transitionSec;
import type { ResolvedBeat } from '../core/beats';

export const useCamera = (beats: ResolvedBeat[], sceneSec?: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shots = beats.flatMap((b) => (b.kind === 'zoom' ? [{ atSec: b.atSec, state: stateFor(b.rect, b.zoom) }] : []));
  return cameraAt(frame / fps, sceneSec === undefined ? shots : withSettle(shots, sceneSec, sceneSec - settleStart(sceneSec)));
};

export const CameraLayer: React.FC<{ beats: ResolvedBeat[]; sceneSec?: number; children: React.ReactNode }> = ({ beats, sceneSec, children }) => {
  const cam = useCamera(beats, sceneSec);
  return (
    <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 50%', transform: cameraTransform(cam) }}>
      {children}
    </div>
  );
};
