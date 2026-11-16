import type { SceneMeta } from './types';

export interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface VoiceEntry {
  key: string;
  /** Texto original (no fonético) con el que se generó el audio. */
  text: string;
  /** Ruta relativa a public/, para staticFile(). */
  file: string;
  durationSec: number;
  /** Fin real del habla (sin el silencio final del mp3); si falta se usa durationSec. */
  speechEndSec?: number;
  alignment: Alignment | null;
}

export type VoiceManifest = Record<string, VoiceEntry>;

export interface TimedSegment {
  id: string;
  text: string;
  startSec: number;
  endSec: number;
  file: string | null;
  alignment: Alignment | null;
  estimated: boolean;
}

export interface SceneTimeline {
  sceneId: string;
  segments: TimedSegment[];
  durationSec: number;
}

/** Ritmo de narración pausado (≈150 palabras por minuto, igual en español e inglés). Solo para estimar antes de tener la voz real. */
export const WORDS_PER_SEC = 2.5;
const DEFAULT_PAUSE = 0.45;
const DEFAULT_LEAD_IN = 0.6;
const DEFAULT_TAIL = 1.0;

export function estimateSec(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, words / WORDS_PER_SEC);
}

export function buildTimeline(meta: SceneMeta, manifest?: VoiceManifest | null): SceneTimeline {
  let t = meta.leadIn ?? DEFAULT_LEAD_IN;
  let lastEnd = t;
  const segments = meta.segments.map((s) => {
    const entry = manifest?.[`${meta.id}/${s.id}`];
    const fresh = entry && entry.text === s.text ? entry : null;
    const dur = fresh ? (fresh.speechEndSec ?? fresh.durationSec) : estimateSec(s.text);
    const seg: TimedSegment = {
      id: s.id, text: s.text, startSec: t, endSec: t + dur,
      file: fresh?.file ?? null, alignment: fresh?.alignment ?? null, estimated: !fresh,
    };
    lastEnd = seg.endSec;
    t = seg.endSec + (s.pauseAfter ?? DEFAULT_PAUSE);
    return seg;
  });
  return { sceneId: meta.id, segments, durationSec: lastEnd + (meta.tail ?? DEFAULT_TAIL) };
}

export function segmentStart(tl: SceneTimeline, id: string): number {
  const seg = tl.segments.find((s) => s.id === id);
  if (!seg) throw new Error(`Segmento "${id}" no existe en ${tl.sceneId}. Disponibles: ${tl.segments.map((s) => s.id).join(', ')}`);
  return seg.startSec;
}

export function sceneOffsets(durationsSec: number[], transitionSec: number): number[] {
  const out: number[] = [];
  let t = 0;
  for (const d of durationsSec) { out.push(t); t += d - transitionSec; }
  return out;
}

export function totalDuration(durationsSec: number[], transitionSec: number): number {
  if (durationsSec.length === 0) return 0;
  return durationsSec.reduce((s, d) => s + d, 0) - transitionSec * (durationsSec.length - 1);
}

/** Duración real de una escena en el video: su Sequence dura ceil(seg × fps) fotogramas. */
export const quantizeSec = (sec: number, fps: number) => Math.ceil(sec * fps - 1e-9) / fps;
