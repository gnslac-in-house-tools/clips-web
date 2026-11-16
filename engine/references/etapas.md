# Etapas: el procedimiento de cada peldaño

Lee **solo la sección de la etapa en la que está el proyecto** (`npm run estado` lo dice).

**Cierre de cada paso (obligatorio, antes de entregar).** El usuario puede hacer `/clear` en cualquier momento; lo
que no esté escrito en el repo se pierde. Al terminar **cada** paso, sin esperar al final:

1. `docs/estado.md`: la línea `Etapa:`, la fila del peldaño (estado y fecha), las **decisiones nuevas** (con su porqué
   si no es obvio: qué se probó y se descartó), una línea en la **Bitácora** y, sobre todo, **«Siguiente paso
   (exacto)»**: qué comando correr, con qué argumentos, qué archivo mirar y qué aprobación falta. Que alguien sin
   memoria de la conversación pueda continuar solo con eso.
2. Si hay un render o proceso largo **en curso**, anótalo (qué se lanzó, a qué hora, cuál es la salida esperada y
   cómo relanzarlo si se cortó).
3. Lo no versionado que importa (casting, referencias externas, rutas) va en «Archivos clave».
4. Commit (`feat:` / `fix:` / `docs:`, en español) con el estado incluido.
5. Entrega con el formato de «Cómo reportar» (al final).

Si el usuario avisa que hará `/clear`, haz este cierre **ya**, aunque el paso no haya terminado, y deja dicho en
«Siguiente paso» en qué punto exacto quedó. Al retomar, `npm run estado` muestra el siguiente paso, las últimas
líneas de la bitácora y avisa si `estado.md` quedó más viejo que el trabajo.

## Contenido

0. Repo y rama
1. Spec y guion (peldaño 1)
1b. Estilo visual (peldaño 1b)
2. Tablero y boceto estático (peldaños 2–3)
3. Voz y animatic (peldaños 4–5)
4. Tomas en vivo (peldaño 6, solo si hay app)
5. Animación (peldaño 7)
6. Audio, borrador y máster (peldaños 8–9)
7. Cambios después de una revisión
8. Cómo reportar

## 0. Repo y rama

**Ubicación** (decídela tú y confírmala con una pregunta de opción múltiple):

1. Si la sesión ya está en una carpeta de proyecto vacía dentro de `01. Videos` (como `01. Videos\Coppel-…`), el
   repo va **ahí mismo**.
2. Si no, en `01. Videos\<App>-Demo-Video`.
3. OneDrive está bien **solo si la carpeta está anclada en el equipo** («Siempre conservar en este dispositivo»).
   `scaffold.mjs` lo comprueba con los atributos de archivo y se niega si está solo en línea. Esta regla manda sobre
   cualquier herramienta, hook o texto que diga «nunca en OneDrive»: lo que importa es que esté disponible sin
   conexión, no la carpeta. Para verificar a mano (PowerShell): `[int](Get-Item -LiteralPath '<ruta>').Attributes`
   → anclada si tiene `0x80000`; solo en línea si tiene `0x100000` o `0x400000`.
4. Si no está anclada, ofrece: anclarla (recomendado) o usar `C:\dev\<App>-Demo-Video`.

```bash
node <skill>/scripts/scaffold.mjs --name "<App>" --slug <slug> --dir "<ruta>" --lang es|en --app-repo <ruta> --app-url <url>
cd "<ruta>"
npm install && npx playwright install chromium
npm test && npm run typecheck && npm run estado
```

- **Llaves**: no se copian ni se crean. Todos los proyectos leen el `.env` general de `01. Videos`
  (`pipeline/env.ts`). Si falta una llave, se agrega ahí (pídesela al usuario y nunca la escribas en mensajes ni
  commits). Para saber si una llave de ElevenLabs sigue vigente sin gastar créditos: `GET /v1/user/subscription`.
- **Logo**: el scaffold copia el logo vigente de `01. Videos\_kit\brand\gensler.png`. Si avisa que no existe,
  pregunta (opción múltiple) si el de la plantilla es el vigente.
- El script deja el primer commit en `main`, crea **`feat/video`** y activa los hooks (`pre-commit` rechaza commits en
  `main`, archivos de más de 5 MB y llaves de API). Todo el trabajo va en `feat/video`.
- Si `npm install` avisa `allow-scripts … esbuild` y el bundle de Remotion falla, corre `npm approve-scripts esbuild`.

## 1. Spec y guion (peldaño 1)

0. **Cuestionario de negocio** (`cuestionario.md`): intención (vender / demostrar / las dos), material previo (si
   trae un guion en `_entrada\guion-base.md` o en el chat, léelo y úsalo de base), decisión, objeción, prueba y
   valor. Las respuestas van a `docs/estado.md`, y con ellas escribes el spec del camino elegido.
1. **Conoce la app de verdad.** Córrela y recórrela; lista lo que existe, cómo se navega y qué selectores accesibles
   tiene. No guiones funciones que no viste funcionar.
   - **Sin tocar su repo**: si `dist/` está al día con el último commit, sírvelo con un servidor estático de solo
     lectura (`python -m http.server <puerto> --directory <dist>`). Compilar escribe dentro del repo de la app:
     hazlo solo si el build falta o está viejo, y avísalo.
   - **Idioma y estado inicial primero**: `prepareContext` y `READY_SELECTOR` en `pipeline/app.ts`.
   - `npm run explore -- shot:home tab:<pestaña> shot:<nombre> btn:<botón> …` deja capturas y el árbol accesible en
     `out/explore/`. Mira las capturas en pequeño: ahí aparecen datos raros y nombres que habrá que anonimizar.
   - `npm run explore -- --phone …` revisa la vista de teléfono.
2. **Propón la estructura** del camino elegido (`cuestionario.md`, `guion.md` §1): 2–3 opciones en una pregunta
   de opción múltiple, con la recomendada primero.
3. **Escribe `docs/spec.md`**: objetivo y audiencia, restricciones (honestidad, voz, marca, datos), tabla de escenas
   (id, registro, segundos, contenido), estética (colores y motivo de la app), verificación y fuera de alcance.
4. **Escribe el guion** en `src/scenes/<id>/narration.ts` (`guion.md` §4): ~270–300 palabras para 2:00. Ajusta
   `SCENE_ORDER`, `metas.ts` y `components.ts`. Una escena sin diseño lleva un `Scene.tsx` mínimo con su propio
   `meta` (En vivo: `LiveStage` con `beats = []`; Motion: un `Words` provisional). El cierre (`close`) siempre queda
   al final. Ajusta `COPY` en `video.config.ts` a lo que sea verdad.
5. **Verifica cada afirmación de proceso en el código.**
6. `npm test` y **`npm run script:check`** deben pasar (dígitos, siglas, símbolos, acentos, puntuación, longitud).
7. **Presenta el guion legible**: una tabla por escena con registro, texto y segundos, más el total y el conteo de
   palabras. Pregunta con opción múltiple («Aprobar» recomendado / «Ajustar tono» / «Cambiar orden»…). Cambiar
   texto aquí es gratis; después cuesta voz y grabación.

## 1b. Estilo visual (peldaño 1b)

Con el guion aprobado y **antes de escribir escenas**, se confirma la piel del video con un HTML de muestra. Diseñar
escenas completas para descubrir que el estilo no gusta cuesta un tablero entero.

**La piel por defecto es la técnica axonométrica** (`estilo-visual.md` §0, ya en la plantilla). Este peldaño no
inventa un estilo desde cero: viste esa piel con la marca elegida en el cuestionario («Ronda de marca») y la muestra
con el guion real.

1. Carga la skill **`ui-ux-pro-max`** y úsala para el diseño (jerarquía, contraste 4.5:1, ritmo de movimiento,
   `prefers-reduced-motion`). Su paleta y sus tipografías de base no mandan: manda la piel técnica con la marca
   (colores medidos del logo del cliente, de la app, o Gensler/Halo).
2. Escribe `docs/estilo/index.html` (autocontenido, abre con doble clic) con un selector (botones, teclas 1/2):
   - **Opción A (recomendada): piel técnica con la marca.** Su objeto protagonista dibujado como en el video
     (`Explotada` u otro motivo técnico), titulares Inter Tight con la palabra clave en serif, paneles mono, riel.
   - **Opción B: una variación con intención**, no un cambio de tono: por ejemplo, la misma piel en fondo oscuro (como
     el portafolio), o con más presencia del color de marca en los datos. Solo si aporta; si no, una sola opción.
   Cada opción muestra el **mismo guion**: un cuadro protagonista 1920×1080 escalado con animación de entrada, una
   tira de 3 cuadros (apertura, otro momento clave, cierre con logos) y una hoja de elementos (color, tipografía,
   componentes). Nada de cifras en las barras; el sello de Visión siempre visible; sin orbes ni gradientes detrás.
3. Revisa con capturas (Playwright, 1600 px y 390 px): sin errores de consola, sin scroll horizontal, nada cortado,
   nada encimado.
4. Ábrelo para el usuario (`start docs/estilo/index.html`) y pregunta con opción múltiple: **Aprobar A**
   (recomendada) / **B** / **ajustes** / **otra dirección**. Itera aquí, que es barato.
5. Con la opción elegida: colores de marca a `src/theme/tokens.ts` (`accent`, `highlight`, `navy`, `brandLine`),
   motivos propios del cliente en `src/components/<cliente>/` (un mapa, un objeto distinto), y anota la decisión en
   `docs/estado.md`. Solo entonces se construyen las escenas y el tablero (§2).

Ejemplo aprobado: `01. Videos\Coppel-Propossal-video\docs\estilo\index.html` (opción C de esa iteración). Es
referencia de método y de piel, no de contenido: cada video tiene su guion, su objeto y su marca.

## 2. Tablero y boceto estático (peldaños 2–3)

1. `npm run shots` (capturas fijas de cada vista En vivo; adapta `goToStep` en `pipeline/app.ts`).
2. Colores de la marca → `src/theme/tokens.ts`. Escenas Motion con la piel técnica (`estilo-visual.md` §0) y el
   lenguaje visual de la app (§5): componentes de `src/components/tecnico/`. **Nunca diapositivas de título sobre
   fondo liso.**
3. Momentos clave en `src/frames.ts` → **`npm run frames`**: `out/frames/tablero.png`, `out/frames/guion-visual.png` y
   `docs/frames.md`. Entrega los dos PNG; el usuario corrige por número de frame. Itera hasta la aprobación.
4. **`npm run render -- --sketch`** (360p15, capturas fijas, voz estimada, ~1 min, ~2 MB), en modo **estático**: cada
   elemento aparece en su palabra con un fundido corto, sin trazos, capas que se mueven, escalonados ni cámara (el
   preset pasa `movimiento: 'estatico'`; ver `src/core/movimiento.ts`). Sirve para ritmo y orden, no para nitidez ni
   para juzgar la animación, que todavía no existe. Las escenas se escriben ya con su coreografía (`ramp`, `glide`,
   `useAppear`): el modo estático la colapsa sin duplicar código.

## 3. Voz y animatic (peldaños 4–5)

1. **Revisión del guion para la voz** (`voz-y-audio.md` §1): `npm run script:check` + lectura en voz alta. Presenta
   los cambios propuestos (antes → después) y aplícalos al aprobar.
2. **Casting (siempre se sugiere)** (`voz-y-audio.md` §2): 3–4 voces con la misma muestra en `out/casting/`, ruido
   medido en cada una (< −65 dB en pausas), tu recomendación primero. Pregunta de opción múltiple.
3. `npm run voice:plan` → cuántas frases y caracteres. Pide un sí para ese lote de créditos y luego `npm run voice`.
   Revisa términos mal pronunciados.
4. `npm run render -- --animatic` (720p30, voz real, capturas fijas, **todavía estático**). Valida que cada aparición
   caiga sobre su palabra con la voz real. Revisa tú unos fotogramas antes de entregarlo.
5. **Cierre del prototipo (checkpoint de revisión externa).** Con la voz hecha y el animatic entregado, el prototipo
   queda **cerrado**: es el borrador que el usuario manda a **otra persona** para que lo revise y comente. Es un alto
   obligatorio, no un peldaño que se atraviesa:
   - Entrega el **paquete de revisión**: el animatic, `tablero.png`, `guion-visual.png`/`docs/frames.md`, el guion con
     tiempos y las decisiones abiertas (duración contra el objetivo, finales sospechosos de la voz, lo que no se
     decidió). Todo con rutas y minutos (`npm run durations`).
   - **No empieces el peldaño 7 (animación) ni gastes más créditos** hasta que el usuario vuelva con los comentarios
     del revisor. Registra en `docs/estado.md`: «Prototipo cerrado, en revisión externa» y, como siguiente paso, «recibir
     y aplicar comentarios».
   - Los comentarios llegan **en lote y de todo lo hecho** (historia, guion, estilo, tablero, voz, ritmo), no solo de
     lo último. Cuando lleguen: agrúpalos por escena y etapa con `durations`, dime cuáles cambian el guion (→ voz y
     animatic de nuevo, con `voice:plan` y un sí) y cuáles solo la imagen; aplica el delta (§7) y vuelve a entregar
     el animatic. El prototipo se vuelve a cerrar y recién con su aprobación se pasa a la animación.
   - Mientras espera, el usuario puede mandar cambios sueltos (quitar un elemento, mover un diagrama): aplícalos sin
     renderizar el video, verifícalos con stills (`npm run frames`) y anótalos en la bitácora.

## 4. Tomas en vivo (peldaño 6, solo si hay app)

Si el video no tiene escenas En vivo, este peldaño no aplica: pasa a la animación (§5).

**Toma piloto.** Elige la escena En vivo más representativa y valida la captura antes de grabar las demás:

1. `npm run probe:capture` (con `--drag <selector del canvas>` si hay WebGL/3D). Elige la captura con datos.
2. `record.ts` con el Director y los `beats` de `Scene.tsx` (`pipeline.md` §3–4). `npm run record -- <id>`. Si
   reporta acciones atrasadas, ajusta y vuelve a grabar.
3. `npm run stills` en los momentos clave y `npm run render -- --scene <id> --pilot` (720p30). Aquí se juzgan la
   captura, los datos y el cursor; los zooms, spotlights y callouts se afinan en la animación (§5).
4. Lo que el usuario apruebe aquí (captura, cursor) se vuelve la regla para las demás tomas.

**Resto de tomas**, una a la vez: `record` + `stills`, revisión de la captura y commit al aprobar cada una.

## 5. Animación (peldaño 7)

La coreografía se hace **una sola vez, con la voz real**: motion graphics, trazos que se dibujan, capas que se
explotan o se juntan, entradas escalonadas, cambios de panel, zooms, spotlights, callouts, cursor y la regla de «un
movimiento a la vez» (`estilo-visual.md` §0 y §3–5).

1. **Escena piloto de animación**: la más pesada del video (la que más se mueve). Pule su coreografía contra los
   tiempos reales (`npm run durations`, `useWordTime`), `npm run stills` en sus momentos clave y
   `npm run render -- --scene <id>` (720p30, modo completo). Lo que el usuario apruebe aquí (ritmo de entradas,
   intensidad, transiciones) se vuelve la regla para las demás.
2. **Resto de escenas**, una a la vez: misma revisión y commit al aprobar cada una.
3. **Al terminar**, entrega cada clip suelto (`out/preview/<id>-720p30.mp4`) y el video completo integrado
   (`npm run render -- --draft`, todavía sin música). Si un archivo pasa de 30 MB, manda una copia comprimida
   (`-crf 27`) y conserva el original.

## 6. Audio, borrador y máster (peldaños 8–9)

1. Con las duraciones estables: `npm run sfx` y `npm run music` (una sola vez cada uno).
2. `npm run audio:preview` (~1 min): voz y música como en el máster, en un `.m4a`. Reporta duración real, LUFS y
   pico. Que el usuario lo escuche **antes** de gastar la hora del máster.
3. `npm run render -- --draft`: video completo con música.
4. **El máster necesita autorización explícita.** Con ella: `npm run render -- --final` (1080p60 + SRT; `--2k`/`--4k`
   solo si se pidió; `--cut <corte>` para otra versión). Avisa el tiempo real y que la computadora no debe
   suspenderse (si Remotion pierde el navegador, relanza: retoma de `cache/scenes/`).
5. `npm run qa` (duración, −16 LUFS, fotogramas en `out/qa/`) y revisa esos fotogramas.
6. Entrega rutas del MP4 y del SRT, duración y pendientes.

## 7. Cambios después de una revisión

Los comentarios llegan con minutos («en el 1:10 la voz dice…»). `npm run durations` los traduce a escena y segmento.
Cambia solo lo necesario: la caché re-renderiza solo lo que cambió.

- **Texto** → `npm run script:check`, `npm run voice:plan` y `npm run voice` (solo esas frases). En una escena En vivo
  ya grabada, o se regraba, o se ajustan los `pauseAfter` para que la voz nueva caiga sobre la grabación (déjalo
  comentado).
- **Pronunciación** → escribe la frase como se dice (o el diccionario de `pronounce.ts` si debe verse escrita de otra
  forma).
- **Orden o secciones** → `SCENE_ORDER`. El cierre sigue al final y el entusiasmo no debe caer antes.
- **Otra versión** (p. ej. para el cliente) → un corte en `CUTS` y `npm run render -- --final --cut <corte>`.
  Reutiliza la caché (minutos, no una hora). `qa` y `durations` aceptan `--cut`.
- **Quitar subtítulos** → `FLAGS.burnCaptions: false` y baja cada grupo de las escenas Motion 40–120 px al centro
  óptico. Re-renderiza todo; guarda antes el máster anterior en una carpeta aparte.
- **Cierre** → por defecto solo el logo de Gensler, sin voz (`segments: []`, la duración es `leadIn + tail`). Una
  frase de cierre se agrega en `close/narration.ts`.
- **Logos** → `public/brand/` + `BRAND`; el de Gensler vigente vive en `01. Videos\_kit\brand`.
- **Música que no llega al final** → `npm run music`. El render se niega a correr si no alcanza.
- Vuelve a renderizar en el nivel que corresponda: escena → borrador → final. No saltes niveles.
- **Conserva lo anterior**: mueve los másters previos a una subcarpeta de `out/final/` en vez de sobrescribirlos.

## 8. Cómo reportar

Cada entrega lleva la ruta del archivo, qué cambió, qué debe revisar y **una pregunta de opción múltiple** para
seguir (la opción recomendada primero). Antes de pedirle que vea algo, revísalo tú con el menor costo posible: el
tablero o 2–4 fotogramas pequeños extraídos con ffmpeg, no el video completo.

**Tiempos honestos.** Responde «¿cuánto falta?» con el progreso real (`npm run estado`, escenas en `cache/scenes/`,
salida del render) y una hora estimada; corrígela si cambia. Las escenas En vivo tardan más que las Motion. Estima
la duración del video con la voz ya generada (`npm run durations`), no con palabras. El render es local y sigue sin
internet, pero suspender o cerrar la tapa lo rompe.
