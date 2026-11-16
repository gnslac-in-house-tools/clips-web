import { AbsoluteFill, Composition, Easing, getStaticFiles, staticFile, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { loadSceneData, sceneSec, type SceneProps } from './data/load';
import { SCENE_COMPONENTS } from './scenes/components';
import { SCENE_ORDER, FLAGS } from './video.config';
import { quantizeSec, sceneOffsets, totalDuration } from './core/timeline';
import { voiceIntervals } from './core/mix';
import { MusicBed } from './components/MusicBed';
import { SfxCue } from './components/SfxCue';
import { SFX } from './audio/sfx';
import './theme/fonts';

const io = {
  json: async (path: string) => {
    try { const res = await fetch(staticFile(path)); return res.ok ? await res.json() : null; } catch { return null; }
  },
  exists: async (path: string) => {
    try { return (await fetch(staticFile(path), { method: 'HEAD' })).ok; } catch { return false; }
  },
};

/**
 * `fps` llega como input prop desde pipeline/render.ts (30 en el borrador, 60 en el máster). Todo lo
 * que depende de fotogramas se calcula con el fps de la composición, nunca con una constante.
 */
/** `order`: escenas de un corte (CUTS en video.config); sin él, SCENE_ORDER completo. */
type FullProps = { scenes: Record<string, SceneProps>; musicBodyEnd: number | null; fps?: number; order?: string[]; liveStills?: boolean };

const transitionFrames = (fps: number) => Math.round(FLAGS.transitionSec * fps);
const sceneFrames = (p: SceneProps, fps: number) => Math.ceil(sceneSec(p) * fps - 1e-9);

/** Tiempos del video completo, cuantizados a fotogramas igual que TransitionSeries (sin deriva entre escenas). */
function layout(scenes: Record<string, SceneProps>, fps: number, order: readonly string[]) {
  const secs = order.map((id) => quantizeSec(sceneSec(scenes[id]!), fps));
  const T = transitionFrames(fps) / fps;
  return { secs, offsets: sceneOffsets(secs, T), total: totalDuration(secs, T) };
}

/** Música con ducking bajo la voz y un whoosh en cada corte: se mezcla aparte en el render por escena. */
const Bed: React.FC<FullProps> = ({ scenes, musicBodyEnd, order = [...SCENE_ORDER] }) => {
  const { fps } = useVideoConfig();
  const { offsets, total } = layout(scenes, fps, order);
  const voice = voiceIntervals(order.map((id) => scenes[id]!.timeline), offsets);
  const whoosh = getStaticFiles().some((f) => f.name === SFX['whoosh-soft'].file);
  return (
    <AbsoluteFill>
      <MusicBed voice={voice} totalSec={total} bodyEnd={musicBodyEnd} />
      {whoosh ? offsets.slice(1).map((o, i) => <SfxCue key={`w-${i}`} name="whoosh-soft" atSec={o - 0.15} volume={0.12} />) : null}
    </AbsoluteFill>
  );
};

const Full: React.FC<FullProps> = ({ scenes, musicBodyEnd, order = [...SCENE_ORDER] }) => {
  const { fps } = useVideoConfig();
  const T = transitionFrames(fps);
  return (
    <AbsoluteFill>
      <Bed scenes={scenes} musicBodyEnd={musicBodyEnd} order={order} />
      <TransitionSeries>
        {order.flatMap((id, i) => {
          const Comp = SCENE_COMPONENTS[id]!;
          const props = scenes[id]!;
          const seq = (
            <TransitionSeries.Sequence key={id} durationInFrames={sceneFrames(props, fps)}>
              <Comp {...props} />
            </TransitionSeries.Sequence>
          );
          return i === 0 ? [seq] : [<TransitionSeries.Transition key={`t-${id}`} presentation={fade()} timing={linearTiming({ durationInFrames: T, easing: Easing.inOut(Easing.cubic) })} />, seq];
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

const fullMetadata = async ({ props }: { props: FullProps }) => {
  const fps = props.fps ?? FLAGS.fps;
  const order = props.order ?? [...SCENE_ORDER];
  // Con `liveStills` (boceto, animatic) las escenas En vivo duran lo que su voz: la cama debe medir lo mismo.
  const entries = await Promise.all(order.map(async (id) => {
    const d = await loadSceneData(id, io);
    return [id, props.liveStills ? { ...d, recording: null } : d] as const;
  }));
  const scenes = Object.fromEntries(entries);
  const bed = (await io.json('generated/music/bed.json')) as { bodyEndSec: number } | null;
  return { props: { scenes, musicBodyEnd: bed?.bodyEndSec ?? null, fps, order }, fps, durationInFrames: Math.round(layout(scenes, fps, order).total * fps) };
};

export const RemotionRoot: React.FC = () => (
  <>
    {SCENE_ORDER.map((id) => (
      <Composition
        key={id}
        id={id}
        component={SCENE_COMPONENTS[id]!}
        fps={FLAGS.fps}
        width={FLAGS.width}
        height={FLAGS.height}
        durationInFrames={60}
        defaultProps={{ timeline: { sceneId: id, segments: [], durationSec: 1 }, recording: null, shot: null } as SceneProps}
        calculateMetadata={async ({ props }) => {
          const fps = props.fps ?? FLAGS.fps;
          const loaded = await loadSceneData(id, io);
          // Boceto (`liveStills`): las escenas En vivo usan su captura fija, sin decodificar la toma.
          const data = props.liveStills ? { ...loaded, recording: null } : loaded;
          return { props: { ...data, fps, liveStills: Boolean(props.liveStills) }, fps, durationInFrames: sceneFrames(data, fps) };
        }}
      />
    ))}
    <Composition id="Full" component={Full} fps={FLAGS.fps} width={FLAGS.width} height={FLAGS.height} durationInFrames={60} defaultProps={{ scenes: {}, musicBodyEnd: null } as FullProps} calculateMetadata={fullMetadata} />
    <Composition id="Bed" component={Bed} fps={FLAGS.fps} width={FLAGS.width} height={FLAGS.height} durationInFrames={60} defaultProps={{ scenes: {}, musicBodyEnd: null } as FullProps} calculateMetadata={fullMetadata} />
  </>
);
