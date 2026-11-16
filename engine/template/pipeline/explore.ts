import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BROWSER_ARGS, prepareContext, READY_SELECTOR } from './app';
import { APP, COPY } from '../src/video.config';

/**
 * Recorrido exploratorio de la app (etapa 1): antes de escribir el guion, ver qué existe y cómo
 * se llama cada control. Cada paso deja una captura y el árbol accesible (roles y nombres para
 * los selectores de record.ts) en out/explore/.
 *
 *   npm run explore -- shot:home tab:Program shot:program btn:Compare wait:1500 shot:compare
 *
 * Pasos: shot:<nombre> · btn:<nombre accesible> · tab:<nombre> · text:<texto exacto> ·
 * css:<selector> · click:<x>,<y> · tap:<x>,<y> · key:<tecla> · wait:<ms>. Captura a DPR 1: es para mirar, no para grabar.
 * El idioma de la UI y el estado inicial salen de prepareContext (pipeline/app.ts).
 * `--phone` explora la vista de teléfono (390×844, táctil, DPR 3) para ver si la app es responsive.
 */
const OUT = join('out', 'explore');
mkdirSync(OUT, { recursive: true });

const phone = process.argv.includes('--phone');
const steps = process.argv.slice(2).filter((a) => a !== '--phone');
const browser = await chromium.launch({ headless: true, args: BROWSER_ARGS });
const context = await browser.newContext(phone
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: COPY.locale }
  : { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: COPY.locale });
await prepareContext(context);
const page = await context.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const t0 = Date.now();
await page.goto(process.env.APP_URL ?? APP.url);
await page.locator(READY_SELECTOR).first().waitFor({ state: 'visible', timeout: 30_000 });
await page.waitForTimeout(3000);
console.log(`carga: ${Date.now() - t0} ms`);

for (const step of steps) {
  const [kind, ...rest] = step.split(':');
  const arg = rest.join(':');
  switch (kind) {
    case 'shot':
      await page.screenshot({ path: join(OUT, `${arg}.png`) });
      writeFileSync(join(OUT, `${arg}.aria.txt`), await page.locator('body').ariaSnapshot());
      console.log(`✓ ${arg}`);
      break;
    case 'btn': await page.getByRole('button', { name: arg }).first().click(); break;
    case 'tab': await page.getByRole('tab', { name: arg }).first().click(); break;
    case 'tap': { const [x, y] = arg.split(',').map(Number); await page.touchscreen.tap(x!, y!); break; }
    case 'text': await page.getByText(arg, { exact: true }).first().click(); break;
    case 'css': await page.locator(arg).first().click(); break;
    case 'click': { const [x, y] = arg.split(',').map(Number); await page.mouse.click(x!, y!); break; }
    case 'key': await page.keyboard.press(arg); break;
    case 'wait': await page.waitForTimeout(Number(arg)); break;
    default: throw new Error(`paso desconocido: ${step}`);
  }
  if (kind !== 'wait' && kind !== 'shot') await page.waitForTimeout(900);
}
if (errors.length) console.log('errores de la app:', errors.slice(0, 8));
await browser.close();
