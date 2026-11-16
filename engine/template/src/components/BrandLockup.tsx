import { Img, getStaticFiles, staticFile } from 'remotion';
import { BRAND, FLAGS } from '../video.config';
import { tokens } from '../theme/tokens';

const has = (f: string) => getStaticFiles().some((x) => x.name === f);

/** Logos oficiales (public/brand/). `height`: alto del logo de Gensler. El del cliente sale solo con FLAGS.coBrand. */
export const BrandLockup: React.FC<{ opacity?: number; height?: number }> = ({ opacity = 1, height = 30 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: height * 0.9, opacity }}>
    <Img src={staticFile(BRAND.primary)} style={{ height, width: 'auto' }} />
    {FLAGS.coBrand && has(BRAND.partner) ? (
      <>
        <span style={{ width: 1.5, height: height * 1.7, background: tokens.color.lineStrong }} />
        <Img src={staticFile(BRAND.partner)} style={{ height: height * BRAND.partnerScale, width: 'auto' }} />
      </>
    ) : null}
  </div>
);
