import { AbsoluteFill } from 'remotion';
import { FLAGS } from '../video.config';
import { tokens } from '../theme/tokens';

/** Ventana flotante que contiene la app a 1920×1080 CSS, escalada al cuadro. */
export const AppWindow: React.FC<{ children: React.ReactNode; enter?: number }> = ({ children, enter = 1 }) => {
  const s = tokens.windowScale * (0.96 + 0.04 * enter);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: FLAGS.width, height: FLAGS.height, transform: `scale(${s}) translateY(${(1 - enter) * 40}px)`,
        opacity: enter, borderRadius: tokens.radius.window / tokens.windowScale, overflow: 'hidden',
        boxShadow: tokens.shadow.window, background: tokens.color.white, position: 'relative', flexShrink: 0,
      }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
