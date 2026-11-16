import { Audio, Sequence, staticFile, useVideoConfig } from 'remotion';
import { SFX, type SfxName } from '../audio/sfx';

export const SfxCue: React.FC<{ name: SfxName; atSec: number; volume?: number }> = ({ name, atSec, volume = 0.3 }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(atSec * fps))} layout="none">
      <Audio src={staticFile(SFX[name].file)} volume={volume} />
    </Sequence>
  );
};
