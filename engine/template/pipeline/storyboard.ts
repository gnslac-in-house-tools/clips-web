/**
 * Guion visual: los frames del tablero agrupados por escena, cada uno con la frase de voz que suena en él. Sirve para
 * tener la noción del video completo de un vistazo (imagen + guion), antes de animar. Lo arma `npm run frames`
 * (out/frames/guion-visual.html y .png).
 */
export type StoryFrame = { n: string; img: string; sec: number; lines: string[] };
export type StoryScene = { id: string; title: string; register: 'motion' | 'live' | 'vision'; frames: StoryFrame[] };

/**
 * Reparte las frases de una escena entre sus frames: cada frase va al primer frame que la muestra mientras suena;
 * si ningún frame cae dentro de ella, va al frame anterior (o al primero si va antes de todos). Ninguna se pierde ni
 * se repite.
 */
export function assignLines(segs: { text: string; startSec: number }[], secs: number[]): string[][] {
  const out = secs.map(() => [] as string[]);
  const playing = secs.map((f) => segs.reduce((k, sg, j) => (sg.startSec <= f + 0.05 ? j : k), -1));
  segs.forEach((sg, j) => {
    const shown = playing.indexOf(j);
    const before = secs.reduce((k, f, i) => (f < sg.startSec ? i : k), 0);
    out[shown >= 0 ? shown : before]!.push(sg.text);
  });
  return out;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const REG = { live: ['En vivo', '#3F6FE0'], vision: ['Visión', '#5B539B'], motion: ['Motion', '#5E6166'] } as const;

/** `silent`: escenas sin voz (el cierre). */
export function storyboardHtml(title: string, scenes: StoryScene[], silent: Set<string> = new Set(), fontDir = '../../public/fonts'): string {
  const sections = scenes.map((sc, i) => {
    const [label, color] = REG[sc.register];
    const cards = sc.frames.map((f) => {
      const voice = silent.has(sc.id) ? '<p class="v none">Sin voz</p>'
        : f.lines.length ? f.lines.map((l) => `<p class="v">«${esc(l)}»</p>`).join('') : '<p class="v cont">(sigue la frase anterior)</p>';
      return `<figure><div class="img"><img src="${esc(f.img)}"><b>${esc(f.n)}</b></div><figcaption><span class="t">${f.sec} s</span>${voice}</figcaption></figure>`;
    }).join('');
    return `<section><header><span class="num">${String(i + 1).padStart(2, '0')}</span><h2>${esc(sc.title)}</h2><span class="reg" style="color:${color};border-color:${color}">${label}</span><code>${esc(sc.id)}</code></header><div class="grid">${cards}</div></section>`;
  }).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
@font-face{font-family:Inter;src:url(${fontDir}/inter-latin.woff2) format('woff2');font-weight:100 900}
@font-face{font-family:Serif;src:url(${fontDir}/instrument-serif-italic-latin.woff2) format('woff2');font-style:italic}
@font-face{font-family:Mono;src:url(${fontDir}/jetbrains-mono-latin.woff2) format('woff2')}
*{box-sizing:border-box;margin:0}body{background:#F2F2F0;color:#1D1E21;font-family:Inter,Arial,sans-serif;width:1920px;padding:56px 64px}
h1{font-size:44px;font-weight:600;letter-spacing:-.5px}h1 em{font-family:Serif;font-weight:400}
.sub{font-family:Mono;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:#5E6166;margin:10px 0 36px}
section{margin-bottom:34px}header{display:flex;align-items:center;gap:14px;padding-bottom:12px;border-bottom:1px solid #DEDEDA;margin-bottom:16px}
.num{font-family:Mono;font-size:15px;color:#5E6166}h2{font-size:26px;font-weight:600}
.reg{font-size:14px;font-weight:600;border:1.5px solid;border-radius:999px;padding:3px 10px}code{font-family:Mono;font-size:14px;color:#9A9C9F;margin-left:auto}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}figure{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(40,32,90,.08)}
.img{position:relative;aspect-ratio:16/9;background:#ECECEE}.img img{width:100%;height:100%;object-fit:cover;display:block}
.img b{position:absolute;left:10px;top:10px;background:rgba(29,30,33,.86);color:#fff;font-size:15px;font-weight:700;padding:4px 9px;border-radius:7px}
figcaption{padding:12px 16px 16px}.t{font-family:Mono;font-size:13px;color:#5E6166}.v{font-size:18px;line-height:1.4;margin-top:6px}
.v.cont,.v.none{color:#9A9C9F;font-style:italic}
</style></head><body><h1>${esc(title)}</h1><p class="sub">Cada frame con las frases de voz de su tramo · el guion completo, en orden · voz estimada hasta tener la real</p>${sections}</body></html>`;
}
