import { describe, expect, it } from 'vitest';
import { loadSceneData } from './load';
import { META } from '../scenes/metas';

const none = { json: async () => null, exists: async () => false };
/** Puede no haber escenas En vivo (video solo Motion/Visión): las pruebas de captura se saltan. */
const live = Object.values(META).find((m) => m.register === 'live');
const motion = Object.values(META).find((m) => m.register !== 'live')!;

describe('loadSceneData', () => {
  it('sin manifest ni grabación usa estimaciones, recording y shot null', async () => {
    const data = await loadSceneData((live ?? motion).id, none);
    expect(data.recording).toBeNull();
    expect(data.shot).toBeNull();
    expect(data.timeline.segments.every((s) => s.estimated)).toBe(true);
  });
  it.skipIf(!live)('escena En vivo con captura disponible la usa', async () => {
    const shot = `generated/shots/${live!.step}.png`;
    const data = await loadSceneData(live!.id, { ...none, exists: async (p) => p === shot });
    expect(data.shot).toBe(shot);
  });
  it('escena Motion nunca pide grabación ni captura', async () => {
    const asked: string[] = [];
    await loadSceneData(motion.id, { json: async (p) => { asked.push(p); return null; }, exists: async (p) => { asked.push(p); return true; } });
    expect(asked).toEqual(['generated/voice-manifest.json']);
  });
  it('lanza si la escena no existe', async () => {
    await expect(loadSceneData('nope', none)).rejects.toThrow(/nope/);
  });
});
