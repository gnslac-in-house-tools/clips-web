import { AbsoluteFill, getStaticFiles } from 'remotion';
import { Background } from '../../components/Background';
import { BrandLockup } from '../../components/BrandLockup';
import { SceneFrame } from '../../components/SceneFrame';
import { SfxCue } from '../../components/SfxCue';
import { Words } from '../../components/motion/Words';
import { useAppear, useWordTime } from '../../components/useWordTime';
import { SFX } from '../../audio/sfx';
import type { SceneProps } from '../../data/load';
import { COPY } from '../../video.config';
import { tokens } from '../../theme/tokens';
import { FONT_FAMILY } from '../../theme/fonts';
import { meta } from './narration';

/**
 * Cierre: el logo de Gensler siempre va al final. Sin frase (lo normal), el logo es el protagonista;
 * con una frase en `narration.ts`, la frase entra como titular cinético y el logo aparece al decir su
 * última palabra. La nota de honestidad va abajo.
 */
export const Scene: React.FC<SceneProps> = ({ timeline }) => {
  const w = useWordTime(timeline);
  const first = timeline.segments[0];
  const text = first?.text ?? '';
  const words = text.replace(/[.!?¿¡]/g, '').split(' ').filter(Boolean);
  const hasPhrase = Boolean(first && words.length);
  const brand = useAppear(hasPhrase ? w(first!.id, words.at(-1)!, 0.1) : meta.leadIn ?? 0.8);
  return (
    <SceneFrame meta={meta} timeline={timeline}>
      <Background filete />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        {hasPhrase ? (
          <Words text={text} at={w(first!.id, words[0]!, -0.2)}
            style={{ ...tokens.type.hero, textAlign: 'center', marginTop: -60, maxWidth: 1500 }} />
        ) : null}
        <div style={{ marginTop: hasPhrase ? 70 : 0, opacity: brand, transform: `translateY(${(1 - brand) * 16}px)` }}>
          <BrandLockup height={hasPhrase ? 48 : 72} />
        </div>
        <div style={{ position: 'absolute', bottom: 70, fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: 500, color: tokens.color.inkSoft, opacity: brand }}>{COPY.closeFootnote}</div>
      </AbsoluteFill>
      {hasPhrase && getStaticFiles().some((f) => f.name === SFX.rise.file) ? <SfxCue name="rise" atSec={w(first!.id, words[0]!, -0.3)} volume={0.22} /> : null}
    </SceneFrame>
  );
};
