---
name: app-preview-clip
description: Use when someone asks for a short, silent, looping clip or preview of an app (10–35 s) for a deck, email, Teams or a portfolio — "un clip", "un preview", "un loop", "un gif de la app", "algo corto para la presentación", "la parte más interesante en loop" — even if they don't mention Remotion. For long demo videos with voice, use app-demo-video.
---

# Clips de preview de apps

Un clip de preview muestra **una acción y todas sus consecuencias**: un gesto (mover una masa, cambiar una
opción) y cómo cambian los números. No es un recorrido por funciones. En 25 s el público sigue una causa con
sus efectos; seis funciones seguidas se vuelven ruido. La persona narra en vivo; el clip no habla.

Deriva de **app-demo-video** y usa su motor (plantilla, Director, cámara, spotlight, cursor). No lo copies:
referencia sus scripts.

## Formato fijo

- 10–35 s, 1920×1080 a 30 fps, H.264, **sin pista de audio**, sin subtítulos, ≤ 8 MB.
- **Loop sin salto:** termina con un fundido de 0.4 s a su primer cuadro.
- Póster `<slug>-poster.jpg` (primer cuadro), para cuando el video no cargue.
- **La duración pedida es un tope, no una meta.** Si la mejor acción dura menos, entrega esa acción sola y dilo.
  Une dos tramos solo si muestran **la misma** acción o su consecuencia en otro lugar (escritorio → celular,
  planta → 3D); dos funciones distintas pegadas para llenar segundos rompen la regla de una acción.
- El texto dentro del clip (callouts, títulos) puede ir en cualquier idioma.
- Honestidad, igual que en app-demo-video: solo se muestra lo que existe. Los valores de ejemplo de la app
  pueden verse, pero el texto que acompañe al clip no los cita como reales.

## Dónde va el resultado

El clip se entrega en una carpeta propia (`<repo-del-video>/out/preview/` o la que pida el usuario).
**Si ya existe un clip aprobado de esa app en otro proyecto** (un deck, un portafolio), no lo reemplaces ni
edites sus scripts o su spec: entrega el nuevo al lado y di qué cambiaría si lo adoptan.

## Elige el camino más barato (en este orden)

1. **Recortar un máster ya aprobado.** Revisa en su `video.config.ts` que `FLAGS.burnCaptions` sea `false`.
2. **Volver a renderizar escenas existentes** si el máster trae subtítulos: rama aparte en el repo del video
   (nunca `main`), `burnCaptions: false`, y por escena
   `npx remotion render src/index.ts <escena> out/preview/<archivo>.mp4 --crf=18 --muted`.
3. **Grabar y componer** si no hay nada grabado de la versión actual de la app:
   - Repo con `node engine/scaffold.mjs --name "<App>" --slug <slug> --dir C:\dev\<App>-Demo-Video --lang es --app-repo <ruta> --app-url <url>` (dentro de `work/`, ignorado por git).
   - La app se corre sin modificar su repo (servidor de desarrollo o `dist/` con un servidor estático).
   - `pipeline/app.ts`: `prepareContext` (estado de fábrica en cada toma), `READY_SELECTOR` y un caso de `goToStep`.
   - `npm run explore` antes de escribir la grabación: confirma selectores con el árbol accesible.
   - Una sola escena `preview`, sin voz: `narration.ts` con `register: 'live'`, `segments: []` y un `step`;
     `SCENE_ORDER = ['preview']`; `FLAGS.burnCaptions = false`.
   - `record.ts` usa `d.at(seg)`, `d.click`, `d.drag`, `d.mark` y `d.wait`. **`d.cue` y `d.cueWord` fallan sin voz.**
     Calcula los puntos de arrastre desde las cajas de los elementos, nunca con coordenadas fijas.
   - `Scene.tsx`: beats anclados a eventos (`{ event: 'id' }`), un zoom a la vez (1.4–2.2×), vuelta a `'full'`
     entre ideas, callouts de 2 a 5 palabras y `<LiveStage … autoTicks={false} />`.
   - `npm test && npm run typecheck`, `npm run record -- preview`, y render
     `npx remotion render src/index.ts preview out/preview/<slug>-preview-1080p60.mp4 --crf=18 --muted`.

En los tres caminos el clip final sale de:

```bash
node .claude/skills/app-preview-clip/scripts/loop-clip.mjs --id <slug> --out <dir> \
  --seg "<video>@<desde>-<hasta>" [--seg "<otro-video>@<desde>-<hasta>"]
```

Une los tramos con fundidos, quita el audio, cierra el loop, genera el póster y **se verifica solo**: imprime
duración, peso, audio y el SSIM entre el primer y el último cuadro, y sale con código 1 si algo está mal.

## Elegir los cortes: mira cuadros, no calcules

Los tiempos se eligen sobre el video, no estimándolos desde `.srt`, JSON de eventos o duraciones de escenas:

```bash
ffmpeg -i <video> -vf "fps=1,scale=480:-1,drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='%{eif\:t\:d}':x=6:y=6:fontsize=24:fontcolor=red:box=1:boxcolor=white,tile=6x5" -frames:v 1 hoja.jpg
```

Luego confirma cada borde con un cuadro suelto (`-ss <t> -frames:v 1`). Para hallar un tramo en blanco
(un visor que carga), `signalstats` con `metadata=print:key=lavfi.signalstats.YMIN` por cuadro lo marca.

## Etapas con revisión (de barato a caro)

1. Propón el momento (la acción y sus consecuencias) con 2–4 cuadros del máster o capturas de `explore`.
   Espera aprobación antes de grabar o renderizar.
2. Recorte o toma: muestra 4 cuadros clave antes del clip final.
3. Clip final con `loop-clip.mjs`. Entrega ruta, duración, peso, póster y el SSIM del loop.

## Verificación antes de entregar

- La salida de `loop-clip.mjs` sin `MAL:` (sin audio, 1920×1080, ≤ 8 MB, SSIM ≥ 0.95).
- Una hoja de contacto del clip completo: ningún cuadro vacío, ningún subtítulo, ningún "Cargando…".
- Si va a un deck web: el Chromium de Playwright no reproduce H.264; las pruebas automáticas deben usar
  `channel: "chrome"` o `"msedge"`.

## Lecciones (deck de Gensler, oct 2026)

- IZA: el máster no tenía subtítulos y sirvió recortado; se saltó un título casi vacío de 3 s ("Open it anywhere.").
- MELI: el máster tenía subtítulos quemados; se renderizaron dos escenas con `burnCaptions: false` en una rama.
  La toma terminaba con un Ctrl+Z que deshacía el arreglo: el tramo se cortó antes.
- Praktico (toma nueva): en apps que recalculan en vivo, el arrastre es la mejor toma. Pero revisa que la
  consecuencia sea la que quieres contar: crecer una masa curva borró sus locales (m² rentables bajaron);
  se cambió por una masa rectangular que suma locales.
- Praktico: el vértice de la directriz caía justo sobre el centro de la píldora del muro y se robaba el
  arrastre. Agarra el muro un poco corrido a lo largo de él.
- Praktico: aun calentando el 3D antes de la toma, "Cargando 3D…" salió ~0.8 s; se cortó con dos tramos.
- `fps medio ~14` en la grabación es normal: el screencast solo manda cuadros cuando algo cambia. No hizo falta `--headed`.
- En un deck web, `play()` interrumpido al cambiar rápido de slide lanza `AbortError`: no es una falla del clip.

## Lo que nunca se hace

- Voz, música o ElevenLabs. Si el usuario quiere narración, esto es app-demo-video.
- Modificar el repo de la app, o trabajar en `main` del repo del video.
- Entregar un clip con pista de audio, subtítulos o salto visible en el loop.
