import { COPY } from '../video.config';
import { tokens } from '../theme/tokens';
import { FONT_FAMILY } from '../theme/fonts';

/** Siempre visible en escenas En vivo: los zooms pueden sacar de cuadro los avisos propios de la app. */
export const LiveBadge: React.FC = () => (
  <div style={{
    position: 'absolute', right: 72, top: 22, padding: '8px 16px', borderRadius: tokens.radius.pill,
    background: 'rgba(255,255,255,0.82)', color: tokens.color.inkSoft, fontFamily: FONT_FAMILY,
    fontSize: 18, fontWeight: 500, boxShadow: tokens.shadow.pill,
  }}>
    {COPY.liveBadge}
  </div>
);
