export type SfxName = 'tick' | 'whoosh-soft' | 'pop' | 'swell' | 'rise';

export const SFX: Record<SfxName, { prompt: string; durationSec: number; file: string }> = {
  tick: { prompt: 'very soft minimal user interface click, clean, subtle, high-end product interface, dry, short', durationSec: 0.5, file: 'generated/sfx/tick.mp3' },
  'whoosh-soft': { prompt: 'soft airy whoosh transition, minimal, gentle, premium technology product film', durationSec: 1, file: 'generated/sfx/whoosh-soft.mp3' },
  pop: { prompt: 'soft subtle pop notification, clean minimal user interface, warm', durationSec: 0.5, file: 'generated/sfx/pop.mp3' },
  swell: { prompt: 'gentle rising ambient swell, warm soft pad, minimal, cinematic but subtle', durationSec: 3, file: 'generated/sfx/swell.mp3' },
  rise: { prompt: 'short delicate shimmering rise, minimal digital sparkle, subtle and elegant', durationSec: 1.5, file: 'generated/sfx/rise.mp3' },
};
