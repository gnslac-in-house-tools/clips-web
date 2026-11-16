import { COPY } from '../video.config';
import { tokens } from '../theme/tokens';
import { FONT_MONO } from '../theme/fonts';

/** Sello técnico de honestidad, obligatorio en todo el registro Visión (lo agrega SceneFrame, no cada escena). */
export const VisionBadge: React.FC = () => (
  <div style={{
    position: 'absolute', right: 56, top: 44, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 6,
    background: tokens.color.bg, border: '1px solid rgba(29,30,33,0.35)', color: tokens.color.ink, fontFamily: FONT_MONO,
    fontSize: 15, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', zIndex: 20,
  }}>
    <span style={{ width: 9, height: 9, background: tokens.color.highlight, boxShadow: `0 0 0 1.5px ${tokens.color.navy}` }} />
    {COPY.visionBadge}
  </div>
);
