# Pipeline técnico (referencia)

Stack: **Remotion 4.0.528** (React 19 + TypeScript) para componer y renderizar, **Playwright 1.63** para grabar
la app real vía CDP screencast, **ElevenLabs** para voz/efectos/música, **ffmpeg** para codificar, unir y medir,
**Vitest** para la lógica pura. Node 24.

## Contenido

1. Estructura del proyecto
2. Contratos (escena, segmento, línea de tiempo, grabación, beats)
3. Grabar una escena En vivo (Director)
4. Overlays de una escena En vivo (beats)
5. Escenas Motion
6. Render por niveles, fps y resolución
7. Caché
8. Herramientas de revisión
9. Problemas conocidos y soluciones

## 1. Estructura

```
src/video.config.ts      PROJECT (nombre, slug, idioma) · SCENE_ORDER · FLAGS · CAPTURE · VOICE · TARGET · COPY · BRAND · MUSIC
src/scenes/<id>/
  narration.ts           meta: { id, title, register, chapter?, step?, segments, leadIn?, tail? }
  Scene.tsx              composición Remotion
  record.ts              solo En vivo: setup(page) y record(director)
src/scenes/metas.ts      registro de metas (puro, usable desde Node)
src/scenes/components.ts registro de componentes
src/core/                lógica pura con tests: timeline, beats, camera, cursor, captions, words, pronounce, mix, srt
src/components/          SceneFrame, LiveStage, AppWindow, CameraLayer, Cursor, Spotlights, Callouts, Captions,
                         ChapterMark, LiveBadge, VisionBadge, BrandLockup, FlowDiagram, motion/{Card,Chip,Words}
src/theme/               tokens (colores, spring, tipografía) y fuente local
pipeline/                voice, voices-list, voices-cast, shots, record, recorder/*, probe-capture, sfx, music,
                         render, assemble, cache-rekey, srt, qa, stills, durations
public/brand/            logos (gensler.png incluido; partner.png del cliente)
public/generated/        voz, grabaciones, capturas, sfx, música (ignorado por git)
cache/ recordings/ out/  (ignorados por git)
```

## 2. Contratos

- **Escena**: `register: 'motion' | 'live' | 'vision'`. El video es la concatenación de `SCENE_ORDER` con fundidos.
- **Segmento**: `{ id, text, pauseAfter? }`. Unidad de voz, caché y sincronía.
- **Línea de tiempo**: `buildTimeline(meta, manifest)`. Arranca en `leadIn` (0.6 s), cada segmento dura su habla
  real (`speechEndSec`) o una estimación, pausa `pauseAfter` (0.45 s) y la escena termina `tail` (1.0 s) después
  de la última voz. Una escena En vivo dura `max(voz, grabación)`.
- **Grabación** (`public/generated/rec/<id>.json`): video intermedio 60 fps a resolución de captura, eventos
  `{ id, kind, tSec, endSec, rect, toRect? }` en px CSS del viewport 1920×1080, trayectoria del mouse.
- **Beats**: overlays declarativos que apuntan a eventos, segmentos o palabras; se resuelven a segundos y cajas.

## 3. Grabar una escena En vivo

`pipeline/app.ts` es el único archivo del pipeline que conoce la app. Adáptalo primero:

- `prepareContext`: estado determinista (tutorial visto, localStorage limpio, preset de datos).
- `READY_SELECTOR`: algo que solo existe cuando la app cargó sus datos.
- `goToStep(page, step)`: navega a la vista donde empieza cada escena (`meta.step`). Conviene que cada paso recargue la app (`page.goto`) y luego navegue: así no depende del paso anterior (`npm run shots` los recorre todos en la misma página). En apps 3D espera ~1.5 s al final para que el modelo asiente.

Graba sobre el build de producción de la app si es posible (más rápido y estable que `dev`). Estado determinista:
mismo input ⇒ misma pantalla en cada toma.

**Anonimizar la captura** (video genérico, sin cliente ni sitio). Se hace en `prepareContext`, solo en la sesión
de Playwright; el repo de la app no se toca. Patrón (`ANONYMIZE` en `pipeline/app.ts`):

- Logos con nombre o dirección: una regla CSS `visibility:hidden` con un selector estable (por ejemplo,
  `[role="img"][aria-label="<CLIENTE>"]`). `visibility` conserva el layout; `display:none` lo movería.
- Nombres en textos visibles (cliente, consultores, ciudad): un `MutationObserver` que recorre los nodos de texto
  y los atributos `title` y `aria-label`, y sustituye palabras completas por genéricas cortas ("Client",
  "Cons. A"). Cortas, porque la app calcula anchos de etiquetas con el texto original.
- Pásalo como **texto** (`addInitScript({ content })`), no como función de TS: tsx agrega el helper `__name` y el
  navegador truena con `ReferenceError: __name is not defined`.
- Verifica con `npm run explore` que el árbol accesible ya no traiga los nombres, y revisa las capturas.

`record.ts` usa el `Director` (`pipeline/recorder/director.ts`):

| Método | Uso |
|---|---|
| `cue(seg, offset?)` | Espera en tiempo real hasta el inicio del segmento |
| `cueWord(seg, palabra, offset?, ocurrencia?)` | Espera hasta que la voz diga esa palabra (usa la alineación) |
| `move(target, dur?)` | Mueve el cursor en arco humano |
| `click(id, target, {dur})` | Mueve y hace clic; registra evento con caja |
| `press(id, target)` | Alias de click (selecciones sin arrastre) |
| `drag(id, from, to, {dur, holdSec, approach})` | Arrastre con trayectoria registrada |
| `slider(id, locator, {from, to, min, max, dur})` | Arrastra un input range de un valor a otro |
| `choose(id, select, value)` | Anima el clic y asigna un `<select>` nativo (su popup no se captura) |
| `type(id, locator, texto, {cps})` | Escribe a ~16 caracteres/s |
| `key(id, 'Control+z')` | Tecla o combinación |
| `mark(id, target)` | Registra una caja sin acción (lo que un zoom/callout va a señalar) |
| `waitUntil(id, fn, target?, timeoutSec?)` | Espera algo asíncrono y registra cuándo llegó |
| `wait(sec)` | Pausa |

Un `target` es un `Locator` o un punto `{x, y}` en px CSS. Usa `getByRole`/`getByLabel` antes que clases CSS.

```bash
npm run record -- <id>              # toma principal (headless)
npm run record -- <id> --headed     # ver el navegador mientras graba
npm run record -- <id> --take 2     # toma alternativa: <id>.take2.mp4/json
npm run record -- <id> --promote 2  # la toma 2 pasa a ser la principal
```

El grabador aborta si una acción llegó más de 0.35 s tarde respecto de la voz (lista las acciones atrasadas:
acorta `dur` o adelanta offsets) y guarda una captura del error en `recordings/<id>-error.png`. Reporta fps medio
y hueco máximo entre frames. El screencast solo emite cuadros cuando la página cambia, así que en una vista
quieta el fps medio sale bajo (3–10) y eso es normal: lo que importa son los fps **durante el movimiento**
(animaciones, órbita 3D, gráficas que se redibujan), que mide `probe:capture`. Si ahí baja de ~45 fps, cambia
la configuración de captura.

## 4. Overlays de una escena En vivo

`Scene.tsx` declara `beats` y los pasa a `LiveStage`:

```ts
const beats: Beat[] = [
  { kind: 'zoom', at: { event: 'headcount', offset: -0.3 }, target: { events: ['operacion', 'turnos'], pad: 40 }, zoom: 1.8 },
  { kind: 'spotlight', at: { event: 'program' }, until: { segment: 'i2', edge: 'end', offset: 0.4 }, target: { event: 'program' } },
  { kind: 'callout', at: { event: 'turnos' }, until: { event: 'turnos', edge: 'end', offset: 0.5 }, target: { event: 'turnos' }, text: 'Turnos', side: 'right' },
  { kind: 'sfx', at: { event: 'fix', edge: 'end' }, name: 'pop', volume: 0.25 },
  { kind: 'zoom', at: { segment: 'i3', edge: 'end', offset: 0.6 }, target: 'full' },
];
```

- Tiempo (`at`, `until`): `{ sec }`, `{ segment, edge?, offset? }`, `{ word, segment, offset? }`, `{ event, edge?, offset? }`.
- Objetivo (`target`): `{ event, which?: 'rect' | 'toRect', pad? }`, `{ events: [...], pad? }` (unión de cajas),
  `{ rect, pad? }` o `'full'` (solo zoom).
- Un beat que no se puede resolver (evento inexistente, sin grabación) se omite con un aviso; no rompe el render.
- Antes de grabar, la escena se ve con la captura fija (`npm run shots`) y sin overlays de eventos.

## 5. Escenas Motion

Componen `Background`, `Card`, `Chip`, `Words`, `FlowDiagram`, `AppWindow` + `AppSurface` (captura fija de la
app) y el motivo propio de la app. Las apariciones usan `useWordTime(timeline)` y `useAppear(at, spring)`.
`useWordTime` nunca lanza: si la palabra ya no está en la frase, devuelve el inicio del segmento.
Todo determinista: nada de `Math.random()` ni `Date.now()` (posiciones fijas o derivadas del índice).

## 6. Render por niveles, fps y resolución

| Comando | Salida | Para revisar |
|---|---|---|
| `npm run studio` | Remotion Studio (sin render) | Iterar composición en vivo |
| `npm run stills -- intro@3 demo@8.5 Full@96` | PNG sueltos a media resolución en `out/stills/` | Encuadres, tipografía, layout |
| `npm run render -- --sketch` | `out/preview/<slug>-…-360p15-boceto.mp4` | Boceto ligero tras el tablero: ritmo y movimiento, capturas fijas |
| `npm run frames` | `out/frames/tablero.png`, `guion-visual.png`, `docs/frames.md` | Tablero de frames (desde `src/frames.ts`): lo primero tras el guion |
| `npm run render -- --animatic` | `out/preview/<slug>-demo-720p30-animatic.mp4` | Voz real con capturas fijas, antes de grabar la app |
| `npm run render -- --scene <id> --pilot` | `out/preview/<id>-720p60.mp4` | Toma piloto: única revisión de suavidad (cursor, zooms, springs) antes del máster |
| `npm run render -- --scene <id>` | `out/preview/<id>-720p30.mp4` | Cualquier otra escena |
| `npm run render -- --draft` | `out/preview/<slug>-demo-720p30-borrador.mp4` | Historia, ritmo, voz, música del video completo |
| `npm run render -- --final` | `out/final/<slug>-demo-1080p60.mp4` + SRT | Entrega |
| `… --final --2k` / `--4k` | además 1440p60 / 2160p60 | Solo si el usuario lo pide |

- La composición siempre es 1920×1080; la salida se escala (`scale` 2/3, 1, 4/3, 2).
- El fps llega como input prop (`{ fps }`) y `calculateMetadata` lo aplica: el borrador a 30 fps reutiliza el
  mismo código. Todo lo que depende de fotogramas se calcula con `useVideoConfig().fps`, nunca con constantes.
- A 30 fps los movimientos se ven menos fluidos: **el movimiento se aprueba en `--scene` (60 fps), la historia en
  `--draft`**. La duración del borrador difiere del máster en décimas (cuantización a fotogramas): duración y
  loudness se miden solo en el máster con `npm run qa`.
- La captura es a DPR 2 (`CAPTURE.dpr`) aunque la salida sea 1080p: un zoom de 2× recorta la mitad de la imagen y
  necesita esos píxeles. Para 4K con zooms de 2× haría falta DPR 4 (no práctico): limita los zooms a ~1.5× o acepta
  algo de suavidad.
- Render por escena con caché, unido con `xfade` (video) y `adelay`+`amix` (audio de cada escena + la cama de
  música y whooshes renderizada aparte como `Bed`), luego `loudnorm`.
- `RENDER_CONCURRENCY` (default 2) controla las pestañas de Chrome por render.

## 7. Caché

- Voz: por hash del texto hablado + voz + modelo + ajustes (`cache/voice/`).
- Escenas: por hash del código que afecta la escena (todo `src/` salvo las carpetas de otras escenas y los tests),
  sus props, sus medios (voz, grabación, captura), marca, fuentes, efectos y la etiqueta de calidad
  (escala + fps). Un clip del borrador nunca se reutiliza en el máster. Cambiar una escena re-renderiza solo esa.
- `npx tsx pipeline/cache-rekey.ts <ids…>`: reasigna clips del máster tras un cambio verificado como neutro para la
  imagen (stills antes/después idénticos). Si no hay esa verificación, re-renderiza.
- Ojo: cualquier archivo de `src/` fuera de las escenas (`video.config.ts`, `Root.tsx`, `metas.ts`) entra en la
  llave de **todas** las escenas. Un cambio ahí que no toca la imagen (p. ej. agregar `CUTS`) invalida la caché
  entera: calcula las llaves con `sceneKey` antes (con `git stash`) y después, y copia cada clip de la llave vieja a
  la nueva. Así se arma la versión para el cliente sin re-renderizar 40 minutos.
- Cortes (`CUTS` + `--cut`): las escenas se toman de la caché tal cual; solo la cama (`cache/bed-<corte>.wav`), la
  unión y el loudnorm se rehacen. La música se realinea por el final: el corte más corto empieza más adentro de
  la pista, con el mismo fade in.

## 8. Herramientas de revisión

- `npm run durations`: duración por escena (voz vs. grabación), su inicio en el video y el total. Úsalo para
  traducir los minutos que menciona el usuario ("en el 2:10…") a una escena y un segmento.
- `npm run qa`: duración contra `TARGET`, loudness y dos fotogramas por escena en `out/qa/` (`--cut <corte>` →
  `out/qa/<corte>/`).
- `npm run audio:preview [-- --cut <corte>]`: voz + música con el ducking y loudness del máster, sin efectos, en
  `out/preview/<slug>-audio-preview.m4a` (~1 min). Existe porque un render solo-audio de `Full` con Remotion
  tardaba más de 10 minutos. Usa `-/filter_complex <archivo>`: con decenas de frases el grafo no cabe en la línea
  de comandos de Windows.
- Para revisar tú mismo un render: extrae fotogramas con ffmpeg (`-ss <seg> -frames:v 1`) y míralos; arma una hoja
  de contacto con `hstack`/`vstack` para ver varias escenas de una vez.

## 9. Problemas conocidos y soluciones

| Síntoma | Causa | Solución |
|---|---|---|
| El 3D (WebGL) graba a pocos fps o en negro | Headless sin GPU o ANGLE incorrecto | `npm run probe:capture -- --drag canvas`; prueba `headed`, sin `--use-angle`; alternativa: Chromium visible + ffmpeg `ddagrab` |
| "Acciones atrasadas respecto de la voz" | Un movimiento tarda más que la frase | Reduce `dur`, usa `approach` corto en drags seguidos, adelanta `cueWord` con offset negativo |
| Los clics no llegan a un elemento de un panel con scroll | El elemento está fuera del área visible | `rectOf` hace `scrollIntoViewIfNeeded`; si el panel tiene scroll propio, desplázalo en `setup` |
| La fuente cambia entre renders o falla sin internet | Fuente remota | Inter se sirve desde `public/fonts/` (ya resuelto en la plantilla) |
| La música termina antes del video | Pista corta o cuerpo mal detectado | `npm run music` mide y reintenta; el render se niega si no alcanza |
| Deriva de audio entre escenas | Tiempos no cuantizados | La plantilla cuantiza a fotogramas (`quantizeSec`) igual que `TransitionSeries` |
| `npm warn allow-scripts … esbuild` al instalar | npm 11 no corre postinstall sin permiso | Normalmente funciona igual (binario opcional); si el bundle falla: `npm approve-scripts esbuild` y reinstala |
| Respuesta del asistente distinta en cada toma | Modelo no determinista | Graba varias tomas (`--take n`), revisa y promueve la mejor |
| Popup de `<select>` nativo no se ve | El screencast no captura popups del sistema | `d.choose()` anima el clic y asigna el valor |
| `ReferenceError: __name is not defined` en la app | Función de TS pasada a `addInitScript`: tsx le agrega `__name` | Pasa el script como texto: `addInitScript({ content: '…' })` |
| Una escena en teléfono (vertical) | Antes todo se grababa a 1920×1080 | `device: 'phone'` en `narration.ts`: `launchApp`, `npm run shots` y `npm run record` usan `CAPTURE.phone` (390×844, `isMobile`, `hasTouch`, DPR 3) y la escena compone con `PhoneStage` (teléfono sin marca, `x`/`y`/`scale`; sin cámara ni flecha: un punto de toque se dibuja mientras se presiona). Un `<select>` nativo se cambia con `d.choose` (su menú no se captura). Deja el teléfono lejos del `LiveBadge` (arriba a la derecha) y de los subtítulos (abajo al centro). Probado en una app real |
| El último zoom o callout de una escena En vivo casi no se ve | La cámara empieza a volver a vista completa `SETTLE_SEC + transitionSec` (~1.9 s) antes del fin de la escena, y `endBy` corta los resaltes ahí | Sube `tail` en `narration.ts` (por ejemplo, 2.6 s) y vuelve a grabar para que la toma dure lo mismo. El `pauseAfter` del último segmento no cuenta: la cola es `tail` |
| Dos acciones nombradas en palabras muy juntas ("geometry… geometric") | Un estado dura menos de 1 s en pantalla | Ancla la segunda acción a una palabra posterior (por ejemplo, volver a la vista anterior en "marked", no en "geometric") para que cada estado se vea ≥ 1.5 s |
| `Protocol error (Page.bringToFront): Session closed` o `Timed out … connecting to the browser` en pleno render | La computadora se suspendió o cambió la red y Remotion perdió el Chrome headless | Vuelve a lanzar el mismo comando: retoma desde las escenas en `cache/scenes/` (solo repite la que iba a medias). Revisa que no queden procesos viejos (`chrome-headless-shell`, `ffmpeg`) |
| Tocar `video.config.ts`, `Root.tsx` o `metas.ts` invalida toda la caché | Esos archivos entran en la llave de cada escena | Si el cambio no toca la imagen, calcula las llaves antes y después (`sceneKey`, con `git stash`) y copia cada clip a su llave nueva (ver §7) |
| Sin subtítulos las escenas Motion se ven altas | Se compusieron con espacio abajo para ellos | Baja cada grupo 40–120 px al centro óptico; compara con una línea al 50 % antes y después (`stills`) |
| Descargas que no se ven | Son archivos | `page.waitForEvent('download')` + `saveAs` en `recordings/…`; muéstralas con `DownloadChip` |
