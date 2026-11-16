import type { SfxName } from '../audio/sfx';
import { findEvent, type Recording, type Rect } from './events';
import type { SceneTimeline } from './timeline';
import { wordStartSec } from './words';

export type TimeRef =
  | { sec: number }
  | { segment: string; edge?: 'start' | 'end'; offset?: number }
  | { word: string; segment: string; offset?: number; occurrence?: number }
  | { event: string; edge?: 'start' | 'end'; offset?: number };

export type TargetRef =
  | { rect: Rect; pad?: number }
  | { event: string; which?: 'rect' | 'toRect'; pad?: number }
  | { events: string[]; pad?: number };

export type Beat =
  | { kind: 'zoom'; at: TimeRef; target: TargetRef | 'full'; zoom?: number }
  | { kind: 'spotlight'; at: TimeRef; until: TimeRef; target: TargetRef }
  | { kind: 'callout'; at: TimeRef; until: TimeRef; target: TargetRef; text: string; side?: 'top' | 'bottom' | 'left' | 'right' }
  | { kind: 'sfx'; at: TimeRef; name: SfxName; volume?: number };

export type ResolvedBeat =
  | { kind: 'zoom'; atSec: number; rect: Rect | 'full'; zoom?: number }
  | { kind: 'spotlight'; atSec: number; untilSec: number; rect: Rect }
  | { kind: 'callout'; atSec: number; untilSec: number; rect: Rect; text: string; side: 'top' | 'bottom' | 'left' | 'right' }
  | { kind: 'sfx'; atSec: number; name: SfxName; volume: number };

export function resolveTime(ref: TimeRef, tl: SceneTimeline, rec: Recording | null): number | null {
  if ('sec' in ref) return ref.sec;
  if ('word' in ref) {
    const seg = tl.segments.find((s) => s.id === ref.segment);
    if (!seg) return null;
    try { return wordStartSec(seg, ref.word, ref.occurrence) + (ref.offset ?? 0); } catch { return null; }
  }
  if ('segment' in ref) {
    const seg = tl.segments.find((s) => s.id === ref.segment);
    if (!seg) return null;
    return (ref.edge === 'end' ? seg.endSec : seg.startSec) + (ref.offset ?? 0);
  }
  const e = findEvent(rec, ref.event);
  if (!e) return null;
  return (ref.edge === 'end' ? e.endSec : e.tSec) + (ref.offset ?? 0);
}

const padRect = (r: Rect, p = 0): Rect => ({ x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p });

export function resolveRect(ref: TargetRef, rec: Recording | null): Rect | null {
  if ('rect' in ref) return padRect(ref.rect, ref.pad);
  const ids = 'events' in ref ? ref.events : [ref.event];
  const rects = ids.map((id) => {
    const e = findEvent(rec, id);
    return 'which' in ref && ref.which === 'toRect' ? e?.toRect : e?.rect;
  });
  if (rects.some((r) => !r)) return null;
  const rs = rects as Rect[];
  const x = Math.min(...rs.map((r) => r.x));
  const y = Math.min(...rs.map((r) => r.y));
  const x2 = Math.max(...rs.map((r) => r.x + r.w));
  const y2 = Math.max(...rs.map((r) => r.y + r.h));
  return padRect({ x, y, w: x2 - x, h: y2 - y }, ref.pad);
}

const MIN_VISIBLE_SEC = 0.6;

export function resolveBeats(beats: Beat[], tl: SceneTimeline, rec: Recording | null): ResolvedBeat[] {
  const out: ResolvedBeat[] = [];
  for (const b of beats) {
    const atSec = resolveTime(b.at, tl, rec);
    if (atSec === null) { console.warn(`[${tl.sceneId}] beat omitido (tiempo sin resolver): ${JSON.stringify(b.at)}`); continue; }
    if (b.kind === 'sfx') { out.push({ kind: 'sfx', atSec, name: b.name, volume: b.volume ?? 0.3 }); continue; }
    if (b.kind === 'zoom') {
      const rect = b.target === 'full' ? 'full' : resolveRect(b.target, rec);
      if (!rect) { console.warn(`[${tl.sceneId}] zoom omitido (caja sin resolver)`); continue; }
      out.push({ kind: 'zoom', atSec, rect, zoom: b.zoom });
      continue;
    }
    const rawUntil = resolveTime(b.until, tl, rec);
    const rect = resolveRect(b.target, rec);
    if (rawUntil === null || !rect) { console.warn(`[${tl.sceneId}] ${b.kind} omitido (sin resolver)`); continue; }
    // Un evento puede ocurrir más tarde que el fin de su frase: se garantiza una duración visible.
    const untilSec = Math.max(rawUntil, atSec + MIN_VISIBLE_SEC);
    if (b.kind === 'spotlight') out.push({ kind: 'spotlight', atSec, untilSec, rect });
    else out.push({ kind: 'callout', atSec, untilSec, rect, text: b.text, side: b.side ?? 'top' });
  }
  return out.sort((a, b) => a.atSec - b.atSec);
}

/** Spotlights y callouts terminan a más tardar en `sec` (antes del fundido); los que empezarían después se descartan. */
export function endBy(beats: ResolvedBeat[], sec: number): ResolvedBeat[] {
  return beats.flatMap((b): ResolvedBeat[] => {
    if (b.kind !== 'spotlight' && b.kind !== 'callout') return [b];
    if (b.atSec >= sec) return [];
    return [{ ...b, untilSec: Math.min(b.untilSec, sec) }];
  });
}
