import { AbsoluteFill, Img, OffthreadVideo, getStaticFiles, staticFile } from 'remotion';
import { endBy, resolveBeats, type Beat } from '../core/beats';
import type { Recording } from '../core/events';
import type { SceneTimeline } from '../core/timeline';
import { SFX } from '../audio/sfx';
import { COPY } from '../video.config';
import { tokens } from '../theme/tokens';
import { FONT_FAMILY } from '../theme/fonts';
import { AppWindow } from './AppWindow';
import { Background } from './Background';
import { CameraLayer, settleStart, useCamera } from './Camera';
import { Callouts } from './Callout';
import { Cursor } from './Cursor';
import { SfxCue } from './SfxCue';
import { Spotlights } from './Spotlight';

export const AppSurface: React.FC<{ recording: Recording | null; shot: string | null }> = ({ recording, shot }) => {
  if (recording) return <OffthreadVideo src={staticFile(recording.video)} muted style={{ width: 1920, height: 1080 }} />;
  if (shot) return <Img src={staticFile(shot)} style={{ width: 1920, height: 1080 }} />;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily: FONT_FAMILY, color: tokens.color.inkFaint, fontSize: 40 }}>
      {COPY.noCapture}
    </AbsoluteFill>
  );
};

const sfxAvailable = (file: string) => getStaticFiles().some((f) => f.name === file);

export const LiveStage: React.FC<{ timeline: SceneTimeline; recording: Recording | null; shot: string | null; beats?: Beat[]; autoTicks?: boolean }> = ({
  timeline, recording, shot, beats = [], autoTicks = true,
}) => {
  // Sin animación de entrada: entre escenas En vivo la ventana no se mueve y el fundido es solo de contenido.
  const sceneSec = Math.max(timeline.durationSec, recording?.durationSec ?? 0);
  const resolved = endBy(resolveBeats(beats, timeline, recording), settleStart(sceneSec));
  const cam = useCamera(resolved, sceneSec);
  const ticks = autoTicks && recording ? recording.events.filter((e) => e.kind === 'click').map((e) => e.endSec - 0.05) : [];
  return (
    <>
      <Background />
      <AppWindow>
        <CameraLayer beats={resolved} sceneSec={sceneSec}>
          <AppSurface recording={recording} shot={shot} />
          <Spotlights beats={resolved} cameraScale={cam.scale} />
          <Callouts beats={resolved} cameraScale={cam.scale} />
          {recording ? <Cursor mouse={recording.mouse} events={recording.events} cameraScale={cam.scale} /> : null}
        </CameraLayer>
      </AppWindow>
      {sfxAvailable(SFX.tick.file) ? ticks.map((t, i) => <SfxCue key={`tick-${i}`} name="tick" atSec={t} volume={0.22} />) : null}
      {resolved.flatMap((b, i) => (b.kind === 'sfx' && sfxAvailable(SFX[b.name].file) ? [<SfxCue key={`sfx-${i}`} name={b.name} atSec={b.atSec} volume={b.volume} />] : []))}
    </>
  );
};
