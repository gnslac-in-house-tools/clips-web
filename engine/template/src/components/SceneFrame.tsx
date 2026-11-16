import { AbsoluteFill } from 'remotion';
import type { SceneMeta } from '../core/types';
import type { SceneTimeline } from '../core/timeline';
import { FLAGS } from '../video.config';
import { Captions } from './Captions';
import { ChapterMark } from './ChapterMark';
import { LiveBadge } from './LiveBadge';
import { VisionBadge } from './VisionBadge';
import { VoiceTrack } from './VoiceTrack';

/** Capas comunes: la honestidad (badges) se garantiza aquí, por registro, no escena por escena. */
export const SceneFrame: React.FC<{ meta: SceneMeta; timeline: SceneTimeline; children: React.ReactNode }> = ({ meta, timeline, children }) => (
  <AbsoluteFill>
    {children}
    {meta.chapter ? <ChapterMark label={meta.chapter} /> : null}
    {meta.register === 'vision' ? <VisionBadge /> : null}
    {meta.register === 'live' ? <LiveBadge /> : null}
    {FLAGS.burnCaptions ? <Captions timeline={timeline} /> : null}
    <VoiceTrack timeline={timeline} />
  </AbsoluteFill>
);
