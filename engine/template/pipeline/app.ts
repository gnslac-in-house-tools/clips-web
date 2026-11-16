import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { APP, CAPTURE, COPY } from '../src/video.config';

/**
 * Lanzador de la app real para grabar. Es el único archivo del pipeline que conoce la app:
 * cada `ADAPTAR` se resuelve leyendo el código de la app (selectores accesibles, llaves de
 * localStorage, cómo se navega entre vistas). Nunca se modifica el repo de la app.
 */

/** GPU en headless (WebGL de visores 3D) y sin estrangular timers ni render. */
export const BROWSER_ARGS = [
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--ignore-gpu-blocklist',
  '--enable-gpu-rasterization',
  '--use-angle=d3d11',
];

/**
 * ADAPTAR: estado determinista antes de que cargue la app (corre en cada navegación).
 * Ejemplos: marcar el tutorial como visto, limpiar localStorage, fijar un preset de datos.
 */
export async function prepareContext(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    // localStorage.clear();
    // localStorage.setItem('mi-app-tour-visto', '1');
  });
}

/** ADAPTAR: selector de algo que solo existe cuando la app terminó de cargar sus datos. */
export const READY_SELECTOR = 'body';

/** Viewport y DPR de la captura según el dispositivo de la escena (`meta.device`). */
export function captureFor(device: 'desktop' | 'phone' = 'desktop'): { viewport: { width: number; height: number }; dpr: number } {
  return device === 'phone' ? CAPTURE.phone : { viewport: CAPTURE.viewport, dpr: CAPTURE.dpr };
}

export async function launchApp(opts: { headed?: boolean; device?: 'desktop' | 'phone' } = {}): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  const browser = await chromium.launch({ headless: !opts.headed, args: BROWSER_ARGS });
  const cap = captureFor(opts.device);
  const phone = opts.device === 'phone';
  const context = await browser.newContext({
    viewport: cap.viewport, deviceScaleFactor: cap.dpr, isMobile: phone, hasTouch: phone, acceptDownloads: true, locale: COPY.locale,
  });
  await prepareContext(context);
  const page = await context.newPage();
  await page.goto(process.env.APP_URL ?? APP.url);
  await page.locator(READY_SELECTOR).first().waitFor({ state: 'visible', timeout: 30_000 });
  return { browser, context, page };
}

/**
 * ADAPTAR: lleva la app a la vista donde empieza una escena En vivo (`meta.step`).
 * Usa roles y nombres accesibles (getByRole) antes que clases CSS: sobreviven a rediseños.
 * Termina con el mouse fuera de cualquier hover y una pausa corta para que la UI se asiente.
 */
export async function goToStep(page: Page, step: string): Promise<void> {
  switch (step) {
    case 'home':
      break;
    default:
      throw new Error(`goToStep: paso "${step}" sin implementar en pipeline/app.ts`);
  }
  if (page.viewportSize()!.width > 800) await page.mouse.move(960, 1060);
  await page.waitForTimeout(500);
}
