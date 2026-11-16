import { LiveStage } from '../../components/LiveStage';
import { SceneFrame } from '../../components/SceneFrame';
import type { Beat } from '../../core/beats';
import type { SceneProps } from '../../data/load';
import { meta } from './narration';

/**
 * Overlays de la escena En vivo, anclados a eventos de la grabación. Gramática de cámara:
 * un movimiento a la vez — primero el control que se toca, luego el resultado que cambia —,
 * zoom 1.4–2.2× y regreso a 'full' entre ideas. Nunca un zoom a la unión de dos cosas lejanas
 * (la caja queda enorme y la cámara se centra en lo que hay en medio).
 * Callouts de 2 a 5 palabras. La escena cierra sola en vista completa (withSettle) antes del fundido.
 */
const beats: Beat[] = [
  { kind: 'zoom', at: { event: 'choose', offset: -0.4 }, target: { event: 'choose', pad: 160 }, zoom: 1.6 },
  { kind: 'spotlight', at: { event: 'choose' }, until: { event: 'choose', edge: 'end', offset: 0.3 }, target: { event: 'choose', pad: 6 } },
  { kind: 'zoom', at: { event: 'result', offset: -0.1 }, target: { event: 'result', pad: 200 }, zoom: 1.7 },
  { kind: 'callout', at: { event: 'result', offset: 0.4 }, until: { segment: 'd2', edge: 'end', offset: 0.4 }, target: { event: 'result' }, text: 'Se actualiza al momento', side: 'left' },
  { kind: 'zoom', at: { event: 'detail', offset: -0.3 }, target: { event: 'detail', pad: 120 }, zoom: 1.8 },
  { kind: 'sfx', at: { event: 'detail', edge: 'end' }, name: 'pop', volume: 0.2 },
  { kind: 'zoom', at: { segment: 'd3', edge: 'end', offset: 0.6 }, target: 'full' },
];

export const Scene: React.FC<SceneProps> = ({ timeline, recording, shot }) => (
  <SceneFrame meta={meta} timeline={timeline}>
    <LiveStage timeline={timeline} recording={recording} shot={shot} beats={beats} />
  </SceneFrame>
);
