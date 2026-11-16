import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import type { SceneTimeline } from '../core/timeline';

export const VoiceTrack: React.FC<{ timeline: SceneTimeline }> = ({ timeline }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {timeline.segments.filter((s) => s.file).map((s) => (
        <Sequence key={s.id} from={Math.round(s.startSec * fps)} layout="none">
          <Audio src={staticFile(s.file!)} />
        </Sequence>
      ))}
    </>
  );
};
