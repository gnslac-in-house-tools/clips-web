#!/usr/bin/env node
/**
 * Crea el repo del video de una app a partir de assets/template.
 *
 *   node scaffold.mjs --name "Mi App" --slug mi-app --dir "<...>\01. Videos\Mi-App-Demo-Video" --lang es [--app-repo <ruta>] [--app-url http://localhost:4173/]
 *
 * Hace: copia la plantilla (sin node_modules), reemplaza los marcadores, `git init` con un primer
 * commit en main, crea y cambia a la rama feat/video, y activa los hooks (que rechazan commits en
 * main, archivos > 5 MB y llaves de API). No instala dependencias ni toca el repo de la app.
 *
 * Ubicación: el repo puede vivir en OneDrive SOLO si esa carpeta está anclada en el equipo («Siempre
 * conservar en este dispositivo»), no en línea. El script lo comprueba con los atributos de archivo.
 * Llaves: NO se copian. Todos los proyectos leen el .env general de 01. Videos (no hay .env por proyecto).
 * Logo: se toma de <01. Videos>/_kit/brand/gensler.png (el vigente) si existe.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Caja compartida de todos los videos (junto al .env general). */
const KIT_FIXED = join(dirname(fileURLToPath(import.meta.url)), 'kit');

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const fail = (msg) => { console.error(`✗ ${msg}`); process.exit(1); };

/**
 * Atributos de OneDrive en Windows: anclada = 0x80000 (FILE_ATTRIBUTE_PINNED);
 * solo en línea = 0x100000 (UNPINNED), 0x400000 (RECALL_ON_DATA_ACCESS) o 0x1000 (OFFLINE).
 * Se mira la carpeta existente más cercana: una carpeta nueva dentro de una anclada hereda el ancla.
 */
function checkOneDrive(target) {
  if (!/onedrive/i.test(target) || process.platform !== 'win32') return;
  let anchor = target;
  while (!existsSync(anchor) && dirname(anchor) !== anchor) anchor = dirname(anchor);
  const quoted = anchor.replace(/'/g, "''");
  let attr;
  try {
    attr = Number(execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', `[int](Get-Item -LiteralPath '${quoted}' -Force).Attributes`]).toString().trim());
  } catch {
    fail(`No pude leer los atributos de OneDrive de ${anchor}. Verifica a mano que esté anclada en el equipo.`);
  }
  const pinned = (attr & 0x80000) !== 0;
  const onlineOnly = (attr & 0x100000) !== 0 || (attr & 0x400000) !== 0 || (attr & 0x1000) !== 0;
  if (onlineOnly || !pinned) {
    fail(`${anchor} está en OneDrive pero NO anclada en el equipo (sus archivos pueden estar solo en línea). `
      + 'Clic derecho en la carpeta → «Siempre conservar en este dispositivo», o usa una ruta fuera de OneDrive como C:\\dev\\<App>-Demo-Video.');
  }
  console.log(`✓ OneDrive: ${anchor} está anclada en el equipo (disponible sin conexión).`);
}

const name = arg('name');
const slug = arg('slug', name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
const dir = arg('dir');
const lang = arg('lang', 'es');
const appRepo = arg('app-repo', '');
const appUrl = arg('app-url', 'http://localhost:4173/');

if (!name || !dir) fail('Uso: node scaffold.mjs --name "<App>" --dir <ruta> [--slug <slug>] [--lang es|en] [--app-repo <ruta>] [--app-url <url>]');
if (!['es', 'en'].includes(lang)) fail(`--lang debe ser es o en (llegó "${lang}")`);
if (!/^[a-z0-9-]+$/.test(slug)) fail(`--slug solo admite minúsculas, dígitos y guiones (llegó "${slug}")`);
const target = resolve(dir);
checkOneDrive(target);
// `_entrada` es donde el usuario deja su guion o material previo antes de crear el repo: no cuenta como contenido.
if (existsSync(target) && readdirSync(target).filter((f) => f !== '_entrada').length) fail(`${target} ya existe y no está vacío`);

const template = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'template');
cpSync(template, target, { recursive: true, filter: (src) => !/[\\/]node_modules([\\/]|$)/.test(src) });

const TEXT = /\.(ts|tsx|json|md|mjs|js|gitignore|gitattributes)$|pre-commit$/;
const replacements = { __APP_NAME__: name, __APP_SLUG__: slug, __LANG__: lang, __APP_REPO__: appRepo || '(ruta del repo de la app)', __APP_URL__: appUrl };
const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
for (const file of walk(target)) {
  if (!TEXT.test(file)) continue;
  const src = readFileSync(file, 'utf8');
  let out = src;
  for (const [k, v] of Object.entries(replacements)) out = out.split(k).join(v);
  if (out !== src) writeFileSync(file, out);
}

// Logo de Gensler (el vigente): de la caja compartida; si falta, queda el de la plantilla y se avisa.
const kitLogo = [join(dirname(target), '_kit'), KIT_FIXED].map((k) => join(k, 'brand', 'gensler.png')).find(existsSync);
if (kitLogo) {
  cpSync(kitLogo, join(target, 'public', 'brand', 'gensler.png'));
  console.log(`✓ Logo de Gensler tomado de ${kitLogo}`);
} else {
  console.warn('! No existe _kit/brand/gensler.png: quedó el logo de la plantilla. Confirma con el usuario que sea el vigente.');
}

const git = (...a) => execFileSync('git', a, { cwd: target, stdio: 'pipe' }).toString().trim();
git('init', '-b', 'main');
git('add', '-A');
// El bit de ejecución del hook entra en el primer commit (si se marca después, queda como cambio suelto en feat/video).
try { git('update-index', '--chmod=+x', '.githooks/pre-commit'); } catch { /* Windows sin bit de ejecución: git bash lo corre igual */ }
git('commit', '-m', `chore: esqueleto del video demo de ${name} (plantilla app-demo-video)`);
git('switch', '-c', 'feat/video');
git('config', 'core.hooksPath', '.githooks');

console.log(`✓ ${target}`);
console.log(`  rama: ${git('branch', '--show-current')} · hooks: .githooks · idioma: ${lang} · slug: ${slug}`);
console.log('  siguiente: npm install && npx playwright install chromium   (las llaves salen del .env general de 01. Videos)');
