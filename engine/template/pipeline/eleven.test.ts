import { beforeEach, describe, expect, it, vi } from 'vitest';
import { elevenFetch } from './eleven';

beforeEach(() => { process.env.ELEVENLABS_API_KEY = 'sk_secretsecretsecret'; });

describe('elevenFetch', () => {
  it('reintenta 429 y 5xx y luego devuelve la respuesta buena', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response('lento', { status: 429 }))
      .mockResolvedValueOnce(new Response('uy', { status: 503 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    const res = await elevenFetch('/v1/x', { method: 'GET' }, { fetch, sleep: async () => {} });
    expect(await res.text()).toBe('ok');
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls[0]![1].headers['xi-api-key']).toBe('sk_secretsecretsecret');
  });
  it('un 4xx no se reintenta y el error no contiene la key', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{"detail":"bad voice"}', { status: 400 }));
    const err = await elevenFetch('/v1/x', { method: 'GET' }, { fetch, sleep: async () => {} }).catch((e: Error) => e);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(err)).toMatch(/400/);
    expect(String(err)).toMatch(/bad voice/);
    expect(String(err)).not.toMatch(/sk_secret/);
  });
  it('falla con mensaje claro si falta la key', async () => {
    delete process.env.ELEVENLABS_API_KEY;
    await expect(elevenFetch('/v1/x', { method: 'GET' }, { fetch: vi.fn(), sleep: async () => {} })).rejects.toThrow(/ELEVENLABS_API_KEY/);
  });
});
