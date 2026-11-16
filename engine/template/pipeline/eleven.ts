import { requireEnv } from './env';
import type { Alignment } from '../src/core/timeline';

const BASE = 'https://api.elevenlabs.io';

interface Deps { fetch?: typeof fetch; sleep?: (ms: number) => Promise<void> }
const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function elevenFetch(
  path: string,
  init: RequestInit & { query?: Record<string, string> },
  deps: Deps = {},
): Promise<Response> {
  const key = requireEnv('ELEVENLABS_API_KEY');
  const doFetch = deps.fetch ?? fetch;
  const sleep = deps.sleep ?? defaultSleep;
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v);
  const headers = { 'xi-api-key': key, 'Content-Type': 'application/json', ...(init.headers as Record<string, string> | undefined) };
  for (let attempt = 0; ; attempt++) {
    const res = await doFetch(url.toString(), { ...init, headers });
    if (res.ok) return res;
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < 3) { await sleep(1000 * 2 ** attempt); continue; }
    const body = (await res.text()).slice(0, 400);
    throw new Error(`ElevenLabs ${init.method ?? 'GET'} ${path} → ${res.status}: ${body}`);
  }
}

export interface TtsBody {
  text: string;
  model_id: string;
  voice_settings: Record<string, number | boolean>;
  previous_text?: string;
  next_text?: string;
  seed?: number;
}

export async function ttsWithTimestamps(voiceId: string, body: TtsBody, outputFormat: string) {
  const res = await elevenFetch(`/v1/text-to-speech/${voiceId}/with-timestamps`, {
    method: 'POST', body: JSON.stringify(body), query: { output_format: outputFormat },
  });
  const json = (await res.json()) as { audio_base64: string; alignment: Alignment | null };
  return { audio: Buffer.from(json.audio_base64, 'base64'), alignment: json.alignment };
}

export async function soundEffect(text: string, durationSec: number): Promise<Buffer> {
  const res = await elevenFetch('/v1/sound-generation', {
    method: 'POST', query: { output_format: 'mp3_44100_192' },
    body: JSON.stringify({ text, duration_seconds: durationSec, prompt_influence: 0.6 }),
  });
  return Buffer.from(await res.arrayBuffer());
}

export async function composeMusic(prompt: string, lengthMs: number): Promise<Buffer> {
  const res = await elevenFetch('/v1/music', {
    method: 'POST', query: { output_format: 'mp3_44100_192' },
    body: JSON.stringify({ prompt, music_length_ms: lengthMs, force_instrumental: true }),
  });
  return Buffer.from(await res.arrayBuffer());
}

export interface VoiceInfo { voice_id: string; name: string; labels?: Record<string, string>; preview_url?: string }
export interface SharedVoiceInfo { voice_id: string; public_owner_id: string; name: string; accent?: string; description?: string; preview_url?: string }

export async function listVoices(): Promise<VoiceInfo[]> {
  const res = await elevenFetch('/v2/voices', { method: 'GET', query: { page_size: '100' } });
  return ((await res.json()) as { voices: VoiceInfo[] }).voices;
}

export async function searchSharedVoices(o: { language: string; gender: string; accent?: string }): Promise<SharedVoiceInfo[]> {
  const res = await elevenFetch('/v1/shared-voices', {
    method: 'GET',
    query: { language: o.language, gender: o.gender, use_cases: 'narrative_story', page_size: '40', ...(o.accent ? { accent: o.accent } : {}) },
  });
  return ((await res.json()) as { voices: SharedVoiceInfo[] }).voices;
}

/** Las voces de la biblioteca compartida deben agregarse a la cuenta antes de usarlas por API. */
export async function addSharedVoice(publicUserId: string, voiceId: string, name: string): Promise<string> {
  const res = await elevenFetch(`/v1/voices/add/${publicUserId}/${voiceId}`, {
    method: 'POST', body: JSON.stringify({ new_name: name }),
  });
  return ((await res.json()) as { voice_id: string }).voice_id;
}
