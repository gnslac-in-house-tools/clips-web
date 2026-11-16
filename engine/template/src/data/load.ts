import { META } from '../scenes/metas';
import { buildTimeline, type SceneTimeline, type VoiceManifest } from '../core/timeline';
import type { Recording } from '../core/events';

/**
 * `type` (no interface): Remotion exige props asignables a Record<string, unknown>.
 * `fps`: opción de render (input prop); las escenas leen el fps con useVideoConfig(), no de aquí.
 */
export type SceneProps = { timeline: SceneTimeline; recording: Recording | null; shot: string | null; fps?: number; liveStills?: boolean };

export interface DataIO { json(path: string): Promise<unknown | null>; exists(path: string): Promise<boolean> }

export async function loadSceneData(id: string, io: DataIO): Promise<SceneProps> {
  const meta = META[id];
  if (!meta) throw new Error(`Escena desconocida: ${id}`);
  const manifest = (await io.json('generated/voice-manifest.json')) as VoiceManifest | null;
  const timeline = buildTimeline(meta, manifest);
  const stale = timeline.segments.filter((s) => s.estimated).map((s) => s.id);
  if (manifest && stale.length) console.warn(`[${id}] voz pendiente o desactualizada en: ${stale.join(', ')} (se usa estimación)`);
  if (meta.register !== 'live') return { timeline, recording: null, shot: null };
  const recording = (await io.json(`generated/rec/${id}.json`)) as Recording | null;
  const shotPath = `generated/shots/${meta.step}.png`;
  return { timeline, recording, shot: (await io.exists(shotPath)) ? shotPath : null };
}

export const sceneSec = (p: SceneProps) => Math.max(p.timeline.durationSec, p.recording?.durationSec ?? 0);
