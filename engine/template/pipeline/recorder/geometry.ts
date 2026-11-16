import type { Rect } from '../../src/core/events';
import type { Point } from './mouse';

export const center = (r: Rect): Point => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/**
 * Centro del thumb de un input range. `thumb`: ancho del thumb en px CSS; verifícalo en los
 * estilos de la app (en algunas apps es 16 px).
 */
export function sliderX(rect: Rect, value: number, min: number, max: number, thumb = 16): number {
  return rect.x + thumb / 2 + ((value - min) / (max - min)) * (rect.w - thumb);
}
