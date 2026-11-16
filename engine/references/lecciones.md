# Lecciones

Lo que salió mal o bien en videos anteriores y quedó como regla. Son lecciones de **proceso y técnica**: no
describen la historia ni la estructura de ningún video, porque cada uno es distinto. Léelas antes del guion y antes
de diseñar escenas.

## Proceso

- **De barato a caro, con aprobación en cada peldaño.** «Primero la versión de baja resolución», «un borrador
  estúpidamente ligero». Ver la Escalera de calidad en `SKILL.md`.
- **Frames primero, siempre.** Un tablero de cuadros clave numerados permite corregir por número («F06 debe
  mostrar más opciones») antes de animar. Varias rondas de tablero no cuestan render ni créditos.
- **Guion visual junto al tablero**: todos los frames con la frase que les toca, «para tener una noción».
  `npm run frames` arma `out/frames/guion-visual.png`; cada frase va al primer frame que la muestra sonando.
- **La coreografía, después de la voz.** Animar con la voz estimada obliga a rehacer cada entrada cuando llega la
  real; el boceto y el animatic van estáticos y la animación se hace una vez, con una escena piloto (video anterior).
- **No grabes todas las tomas de un jalón.** Grabar varias en 4K y 60 fps con voz estimada y sin piloto aprobado
  se tuvo que frenar y rehacer. Una toma piloto, con voz real.
- **Tras las tomas: clips sueltos + video integrado, antes de la música.**
- **Revisa la narración antes de generar la voz completa** (`voz-y-audio.md` §1): legibilidad, siglas y frases que
  continúan a la anterior. Después de generar, mide ruido en las pausas reales, pausas solo en la puntuación y
  nivel de los últimos 100 ms (finales cortados).
- **Con capturas fijas, la cama de audio debe medir lo mismo que el video**; si se calcula con tomas provisionales,
  el archivo queda con segundos de cola vacía.
- **Escucha el audio antes del máster** (`audio:preview`): un primer audio «terrible» se corrige ahí, no después
  de una hora de render.
- **El máster espera autorización explícita**, aun con el borrador aprobado.
- **Duración con la voz real**: una estimación de ~3:45 terminó en 4:14.

## Guion y narrativa

- **Para el cliente, nada técnico**: se habla de lo que gana, no de las herramientas internas.
- **Verifica cada afirmación en el código, no en el README.**
- **Genérico cuando la audiencia es nueva**: sin cliente, ciudad ni personas. La anonimización va en la sesión de
  captura (script de inicio + observador de texto y atributos `title`/`aria-label`) y una red que falla la captura
  si un nombre se filtra (`assertAnonymous`).
- **Una frase síntesis entre actos**: las frases fuertes van en pantalla como titular cinético, no solo en la voz.
- Lo que aún no existe va en registro Visión, con badge, y con barras sin cifras.
- **Lo que se pronuncia mal se escribe como se dice**: «3D» se perdía; «tercera dimensión» no.

## Movimiento con intención

- **Un solo motivo visual de principio a fin**, tomado de la propia app. Un estilo nuevo por escena se siente como
  plantilla.
- **De muchos a uno**: muchos elementos llenan la pantalla → zoom a unos pocos → uno. La escala cuenta «esto aplica
  a todo» sin decirlo.
- **Cortes con significado, no fundidos genéricos**: algo de una escena se transforma en lo que abre la siguiente.
- **Las ideas se mueven como dice la voz**: «casi nunca se miden juntas» → los dos elementos se separan.
- **Más de ~5 s sin cambio es un hueco**: cada frase lleva algo que se mueve (un clic, un spotlight, un callout,
  datos que se actualizan).
- **Orbes y fondos discretos** («no tan notorios todo el tiempo»). Donde el contenido es la figura no hay orbes.
- Geografía real (Natural Earth) en vez de calles inventadas: las inventadas «se veían horribles».
- Animaciones en segundos (`frame / fps`), no en fotogramas, para que 15, 30 y 60 fps se vean iguales.
- Titulares con palabras que suben desde una máscara, chips de ícono que empujan el texto, easings de
  desaceleración (expo, back suave) y grano fino.

## Grabación de la app

- **Congela la app** (`git archive` de un commit a `app-snapshot/`) y grábala por `file://`: nada cambia entre
  tomas y el repo de la app no se toca.
- En `record.ts`, el clic llega en `cue + dur` del movimiento: adelanta el cue esa duración, o la toma sale
  «atrasada respecto de la voz».
- Para que algo «nazca» en cámara, `setup` deja otro estado activo y el clic va dentro de la toma.
- Si una escena Motion desemboca en la app, usa como imagen de llegada el primer cuadro de la toma siguiente
  (ffmpeg `-ss 0.05`): así no hay salto en el corte.
- Un spotlight oscurece todo lo demás: no lo pongas sobre un menú que se abre hacia abajo.

## Audio y voz

- **Música por secciones: suma el recorte a los tiempos del prompt.** La pista se pide de `video + 25 s` y se
  alinea por el final, así que se recortan ~`25 − cola` segundos del inicio. Escribe cada tiempo del prompt como
  `tiempo del video + recorte esperado`, o pide la pista con la duración exacta del video.
- **Mide el ruido de la voz antes de elegirla**: una voz elegida solo de oído traía de −46 a −53 dB y hubo que
  rehacer todo.
- Un borrador sin voz ni música tiene audio en silencio: loudnorm no acepta `-inf` (`pipeline/loudnorm.ts` lo salta).

## Windows y render

- Concurrencia alta + tomas 4K provoca «No frame found at position…»: baja `RENDER_CONCURRENCY` y relanza
  (retoma de la caché).
- En Git Bash, `drawtext` de ffmpeg con rutas `C:` falla al escaparse; `tile` necesita filas explícitas (`tile=6x5`).
- **Codifica las tomas para que Remotion pueda buscar cuadros**: un cuadro clave cada 0.5 s (`-g 30`), sin cuadros
  B (`-bf 0`) y rango estándar (`out_range=tv`). `pipeline/recorder/encode.ts` ya lo hace; `reencodeTake` arregla
  tomas viejas sin regrabar.
- Con tomas 4K, un cuadro puede tardar más de 28 s en decodificarse: `render.ts` ya pasa
  `timeoutInMilliseconds: 120000`; si aun así falla, relanza (retoma de la caché).
- **Antes de entregar un render, confirma que terminó** (`✓` en el log y la fecha del archivo): en la carpeta puede
  quedar un borrador viejo con el mismo nombre. Mueve los anteriores a `out/preview/anteriores/` antes de relanzar.
- Generar efectos (`npm run sfx`) cambia la llave de caché de todas las escenas: hazlo antes del render completo.
- `TaskStop` no mata Chrome ni ffmpeg: `Stop-Process` sobre `chrome-headless-shell`, `ffmpeg` y `remotion`.
