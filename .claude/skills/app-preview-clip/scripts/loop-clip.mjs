// Clip mudo en loop: tramos de uno o varios videos, unidos con fundidos, sin audio, con fundido final al
// primer cuadro (loop sin salto) y póster. Uso:
//   node loop-clip.mjs --id <slug> --out <dir> --seg <video>@<desde>-<hasta> [--seg …] [--fade 0.4] [--fps 30] [--crf 24]
import { spawnSync } from "node:child_process";
import { mkdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const segs = args.flatMap((a, i) => (a === "--seg" ? [args[i + 1]] : [])).map((s) => {
  const at = s.lastIndexOf("@"), [from, to] = s.slice(at + 1).split("-").map(Number);
  return { src: s.slice(0, at), from, to };
});
const id = opt("id"), OUT = opt("out"), FADE = Number(opt("fade", "0.4")), FPS = Number(opt("fps", "30")), CRF = opt("crf", "24");
if (!id || !OUT || !segs.length || segs.some((s) => !(s.to > s.from))) {
  console.error("uso: --id <slug> --out <dir> --seg <video>@<desde>-<hasta> [--seg …]");
  process.exit(2);
}
const ffmpeg = (a) => { const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...a], { stdio: "inherit" }); if (r.status) throw new Error(`ffmpeg falló (${r.status})`); };

mkdirSync(OUT, { recursive: true });
const scale = "scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p";
const still = join(OUT, `${id}-poster.png`), poster = join(OUT, `${id}-poster.jpg`), mp4 = join(OUT, `${id}.mp4`);
ffmpeg(["-ss", String(segs[0].from), "-i", segs[0].src, "-frames:v", "1", "-vf", scale, still]);
ffmpeg(["-i", still, "-q:v", "3", poster]);
const inputs = segs.flatMap((s) => ["-ss", String(s.from), "-t", String(s.to - s.from), "-i", s.src]);
// El póster dura dos cuadros más que el fundido: xfade termina en su penúltimo cuadro (~92 %) y el loop saltaría.
inputs.push("-loop", "1", "-framerate", String(FPS), "-t", String(FADE + 2 / FPS), "-i", still);
const f = segs.map((_, k) => `[${k}:v]fps=${FPS},${scale},setpts=PTS-STARTPTS[v${k}]`);
f.push(`[${segs.length}:v]fps=${FPS},${scale}[still]`);
let cur = "v0", len = segs[0].to - segs[0].from;
segs.slice(1).forEach((s, i) => {
  f.push(`[${cur}][v${i + 1}]xfade=transition=fade:duration=${FADE}:offset=${(len - FADE).toFixed(3)}[x${i + 1}]`);
  cur = `x${i + 1}`;
  len += s.to - s.from - FADE;
});
f.push(`[${cur}][still]xfade=transition=fade:duration=${FADE}:offset=${(len - FADE).toFixed(3)}[out]`);
ffmpeg([...inputs, "-filter_complex", f.join(";"), "-map", "[out]", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", CRF,
  "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", String(FPS), "-movflags", "+faststart", mp4]);
unlinkSync(still); // solo sirve para cerrar el loop

// Verificación: sin audio, 1920×1080, y el último cuadro ≈ el primero (SSIM ≥ 0.95 → el loop no salta).
const probe = JSON.parse(spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,width,height:format=duration", "-of", "json", mp4], { encoding: "utf8" }).stdout);
const first = join(OUT, `${id}-first.png`), last = join(OUT, `${id}-last.png`);
ffmpeg(["-i", mp4, "-frames:v", "1", first]);
ffmpeg(["-sseof", "-0.05", "-i", mp4, "-frames:v", "1", last]);
const ssim = Number(/All:([\d.]+)/.exec(spawnSync("ffmpeg", ["-hide_banner", "-i", first, "-i", last, "-lavfi", "ssim", "-f", "null", "-"], { encoding: "utf8" }).stderr)?.[1] ?? 0);
unlinkSync(first); unlinkSync(last);
const v = probe.streams.find((x) => x.codec_type === "video"), audio = probe.streams.some((x) => x.codec_type === "audio");
const mb = statSync(mp4).size / 1e6, sec = Number(probe.format.duration);
const bad = [audio && "TIENE AUDIO", (v.width !== 1920 || v.height !== 1080) && `mide ${v.width}×${v.height}`, mb > 8 && "pasa de 8 MB", ssim < 0.95 && "EL LOOP SALTA"].filter(Boolean);
console.log(`${mp4}\n  ${sec.toFixed(1)} s · ${mb.toFixed(1)} MB · audio ${audio ? "sí" : "no"} · loop SSIM ${ssim.toFixed(3)} · póster ${poster}`);
if (bad.length) { console.error(`  MAL: ${bad.join("; ")}`); process.exit(1); }
