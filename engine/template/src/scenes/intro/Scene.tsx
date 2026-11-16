import { AbsoluteFill, getStaticFiles, interpolate } from 'remotion';
import { AppWindow } from '../../components/AppWindow';
import { AppSurface } from '../../components/LiveStage';
import { Background } from '../../components/Background';
import { BrandLockup } from '../../components/BrandLockup';
import { SceneFrame } from '../../components/SceneFrame';
import { SfxCue } from '../../components/SfxCue';
import { Chip } from '../../components/motion/Chip';
import { Words } from '../../components/motion/Words';
import { useAppear, useWordTime } from '../../components/useWordTime';
import { SFX } from '../../audio/sfx';
import { META } from '../metas';
import type { SceneProps } from '../../data/load';
import { PROJECT } from '../../video.config';
import { tokens } from '../../theme/tokens';
import { meta } from './narration';

const has = (f: string) => getStaticFiles().some((x) => x.name === f);
/** La ventana que sube muestra la primera vista En vivo (captura de `npm run shots`). */
const firstStep = Object.values(META).find((m) => m.register === 'live')?.step;
const shot = firstStep ? `generated/shots/${firstStep}.png` : null;

/**
 * Bienvenida: marca → título cinético → chip de honestidad → sube la ventana con la app real.
 * Cada aparición está anclada a una palabra de la voz (useWordTime), no a segundos fijos.
 */
export const Scene: React.FC<SceneProps> = ({ timeline }) => {
  const w = useWordTime(timeline);
  const brand = useAppear(0.3);
  const swap = useAppear(w('w2', 'interfaz', -0.4));
  const win = useAppear(w('w3', 'datos', -0.4), tokens.spring.camera);
  const lift = interpolate(win, [0, 1], [0, -220]);
  return (
    <SceneFrame meta={meta} timeline={timeline}>
      <Background filete />
      <AbsoluteFill style={{ alignItems: 'center', transform: `translateY(${lift}px)`, opacity: 1 - win }}>
        <div style={{ position: 'absolute', top: 96, opacity: brand, transform: `translateY(${(1 - brand) * -16}px)` }}><BrandLockup /></div>
        <Words text={PROJECT.name} at={w('w1', 'plataforma', -0.25)} out={swap} color={{ [PROJECT.name.split(' ').at(-1)!]: tokens.color.accent }}
          style={{ ...tokens.type.hero, position: 'absolute', top: 250, width: '100%', textAlign: 'center' }} />
        <Words text="Lo que podría ser." at={w('w2', 'prototipo', -0.2)} marks={['podría']} markAt={w('w2', 'podría', 0)} markTone="violet"
          style={{ ...tokens.type.hero, position: 'absolute', top: 250, width: '100%', textAlign: 'center' }} />
        <div style={{ position: 'absolute', top: 395, opacity: useAppear(w('w2', 'interfaz', -0.2), tokens.spring.pop) }}>
          <Chip label="Interfaz preliminar · prototipo" dot={tokens.color.highlight} size={28} />
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - win) * 900}px)` }}>
        <AppWindow enter={win}>
          <AppSurface recording={null} shot={shot && has(shot) ? shot : null} />
        </AppWindow>
      </div>
      {has(SFX.swell.file) ? <SfxCue name="swell" atSec={0} volume={0.25} /> : null}
    </SceneFrame>
  );
};
