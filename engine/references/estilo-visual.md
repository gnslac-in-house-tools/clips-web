# Estilo visual y movimiento

Estética de película de producto premium y minimalista. Cada video toma el color, la forma y el motivo de SU app;
no se copia el aspecto de otro video. Los valores de esta guía ya están en la plantilla (`src/theme/tokens.ts`, `src/core/camera.ts`, `src/components/`). Este documento
explica el porqué, para decidir bien cuando una app nueva pide algo distinto.

## Contenido

0. Piel por defecto: técnico axonométrico
1. Los tres registros
2. Marco: fondo, ventana, badges
3. Cámara
4. Spotlight, callouts y cursor
5. Escenas Motion: el lenguaje visual de la app
6. Tipografía y color
7. Transiciones y capítulos
8. Sonido ligado al movimiento
9. Vocabulario por tipo de app
10. Checklist visual

## 0. Piel por defecto: técnico axonométrico

Aprobada por el usuario como default (video Coppel, 2026-11-11), con su portafolio como referencia. Cada video la
viste con **su** marca (colores del cliente, de la app o Gensler; ver `cuestionario.md`, «Ronda de marca»). Ya está
en la plantilla: `src/components/tecnico/`, `Background`, `ChapterMark`, `VisionBadge`, `src/theme/fonts.ts`.

| Elemento | Cómo es | Componente |
|---|---|---|
| Fondo | Perla `#F2F2F0`, retícula fina de 96 px. **Sin cruces «+» en las esquinas** (el usuario las quitó; `cruces` existe pero va apagado), **sin orbes ni gradientes** | `Background` |
| Titular | Inter Tight 300, tracking −0.04 em, número de capítulo gris a la izquierda; la palabra clave entre `*asteriscos*` va en Instrument Serif itálica con el acento; palabras escalonadas | `Titular` |
| Objeto protagonista | Axonometría explotada por capas: losas translúcidas, muros que se desvanecen hacia abajo, semitono de puntos para datos, ruta y nodos en el acento, nodo clave amarillo con borde marino, conectores punteados. `explode` 1→0 «construye» | `Explotada` (+ `geometria`, `esquinaCapa`, `puntoCapa`) |
| Etiquetas | Mono mayúsculas con línea guía y punto; en acento la que está en foco | `Guia` |
| Datos | Panel blanco con filete fino y encabezado mono; barras sin cifras sobre pista punteada, marca de objetivo; Pareto con semitono y top en amarillo | `Panel`, `FilaBarra`, `Kicker`, `Pareto`, `Corchete` |
| Chips | Contorno; sólido de acento **con texto blanco**; amarillo con texto grafito | `Chip` |
| Riel | Línea fina con nodos cuadrados; fase activa amarilla con borde marino; nombres en mono | `Riel` |
| Sello de honestidad | Mono con cuadrito amarillo, siempre visible en Visión | `VisionBadge` |

Sin flecha del norte en mapas ni pies tipo «imágenes ilustrativas» (el sello Visión ya lo dice). Con objeto a la
izquierda y panel a la derecha, el hueco izquierdo del objeto es igual al hueco entre objeto (con etiquetas) y panel.
Una cuadrícula de «muchas tiendas» usa variantes distintas (`VARIANTES_TIENDA`), nunca la misma repetida.

Reglas: un protagonista por cuadro; los paneles se suceden **sin encimarse** (`turno`, no `win`); etiquetas mono
≥ 15 px a 1080p; el color vive en los datos, las rutas y el riel, nunca detrás de los gráficos.

## 1. Los tres registros

| Registro | Qué es | Cómo se ve |
|---|---|---|
| `motion` | Ideas: bienvenida, problema, promesa, valor, cierre | Composiciones con tarjetas, chips y titulares cinéticos sobre el fondo neutro |
| `live` | La app real grabada | Ventana flotante con la grabación, cámara, cursor propio, spotlights, callouts, `LiveBadge` |
| `vision` | Lo que aún no existe | La piel técnica (§0): dibujos de línea, axonometrías y paneles sin cifras; nunca imita una pantalla real; `VisionBadge` siempre |

Nunca se mezclan: un espectador debe saber en cada instante si lo que ve existe.

## 2. Marco

- Fondo `Background`: neutro claro, retícula de puntos con deriva lenta y un brillo suave del acento que se
  mueve. Nunca estático, nunca llamativo. `filete` dibuja la línea de marca arriba (intro y cierre).
- La app vive en `AppWindow`: 1920×1080 CSS escalado al 86 % del cuadro, esquinas de 22 px, sombra larga y suave.
- Entre dos escenas En vivo la ventana **no se mueve** (sin animación de entrada): el fundido es solo de contenido,
  al mismo encuadre. Por eso cada escena En vivo cierra en vista completa (`withSettle`) y apaga sus resaltes
  antes del fundido (`endBy`). El usuario marcó como "abruptas" las transiciones que no lo hacían.
- `LiveBadge` (arriba a la derecha) siempre visible en En vivo: los zooms pueden sacar de cuadro los avisos de la
  propia app. Su texto (`COPY.liveBadge`) dice lo que es verdad: "Interfaz preliminar · Datos de ejemplo".

## 3. Cámara

`src/core/camera.ts` + `CameraLayer`. Gramática:

- **Un movimiento a la vez.** Nunca zoom + paneo + spotlight entrando en el mismo instante.
- **Primero el control, luego el resultado**: un zoom al botón o slider que se toca y otro al valor que cambia.
  Nunca un zoom a la unión de dos cosas lejanas (`events: ['boton', 'panel-del-otro-lado']`): la caja queda
  enorme, la cámara se centra en lo que hay en medio y el spotlight queda fuera de cuadro. `events: [...]` es
  para elementos vecinos (dos campos seguidos de un formulario).
- Registra (`d.mark`) **el valor que cambia** (la cifra, la gráfica), no el panel entero: la caja de un panel
  alto produce zooms y callouts mal ubicados.
- **Zoom de 1.4× a 2.2×** sobre la herramienta en uso (el máximo es 2.2: más allá se pierde contexto y nitidez).
  1.05–1.1× para "respirar" sobre el área de trabajo completa.
- **Regreso a plano general (`target: 'full'`) entre ideas**: al terminar cada frase que cambia de tema.
- Interpolación: escala en log (el zoom se siente uniforme) con ease-in-out cúbico de **1.2 s**. Spring de cámara
  `damping 38 / stiffness 55 / mass 1.3`: llega sin rebote, con peso.
- El encuadre se recorta a la app: un elemento en el borde no muestra el fondo.
- El zoom empieza **0.2–0.6 s antes** del evento (`offset: -0.3`): la cámara llega cuando la acción ocurre.
- La captura es a DPR 2 (3840×2160) aunque la salida sea 1080p: es lo que mantiene nítido un zoom de 2×.

## 4. Spotlight, callouts y cursor

- **Spotlight**: oscurece el resto de la UI (38 %) y rodea la zona activa con un halo del acento (3 px, radio 12).
  Entra 0.3 s antes, sale 0.4 s después. Mínimo visible 0.6 s.
- **Callout**: pill negro con texto blanco, **2 a 5 palabras** ("Validación en vivo", "Ctrl + Z",
  "Estimación paramétrica"). Entra con spring `pop`. Nunca repite literalmente la voz: la resume o nombra.
  Tamaño constante aunque la cámara haga zoom.
- **Cursor**: el del sistema se oculta y Remotion dibuja uno propio desde la trayectoria grabada: flecha oscura
  con borde blanco y sombra, tamaño constante con cualquier zoom, se encoge un poco al presionar y deja un pulso
  del acento al hacer clic. Trayectorias en arco suave (bezier) con aceleración in-out, como una mano.
  El cursor llega a su destino **antes** de la palabra que nombra la acción.
- Ticks suaves en cada clic (`autoTicks`), casi imperceptibles.

## 5. Escenas Motion: el lenguaje visual de la app

La lección más importante: **las escenas Motion se construyen con la piel de la app**, no con diapositivas.
Los títulos sobre fondo liso se rechazaron ("aburridísimas"); lo que funciona:

- **Tarjetas** (`Card`) con el estilo de los paneles de la app: blanco, filete gris, radio 24, sombra suave.
  Entran con `pop` y luego flotan apenas (`float`), para que la composición respire.
- **Chips** (`Chip`) con la forma de los de la app, con punto de color por categoría.
- **Titulares cinéticos** (`Words`): cada palabra entra con un leve ascenso y desenfoque, escalonada 60 ms;
  `marks` pasa un resaltador por las palabras clave al decirlas.
- **Un motivo de la app**: una ilustración simplificada del objeto central de la app, animada (por ejemplo, las
  bandas de color de una planta que se reacomodan al decir "paramétrico"). Para cada
  app nueva, diseña su motivo: torre en massing para un dashboard de torres, gráfica que se dibuja para uno de
  métricas, etc. Reutilízalo en bienvenida, problema, promesa y valor: da unidad al video.
- **Diagramas de flujo** (`FlowDiagram`) para la promesa: nodos con la piel de la app que se encienden al ritmo de
  la voz y datos que fluyen por las conexiones.
- Todo aparece **cuando la voz lo nombra** (`useWordTime(timeline)('segmento', 'palabra', -0.15)`): sincronía
  palabra-imagen, nunca segundos fijos.
- Lo viejo o el problema se apaga a gris (`dim`), lo nuevo entra con color.
- "Más alegre, pero sin llegar a divertido o infantil": color de la app, movimiento con spring, nada de
  personajes, emojis ni rebotes exagerados.

## 6. Tipografía y color

- **Inter** (servida desde `public/fonts/`: el render no depende de internet). Pesos 300–600.
- Escala: hero 92/600/−3, título 64/600/−1.8, cuerpo 34/400, etiqueta 22/500, subtítulo 34/500.
- Títulos grandes y ligeros; callouts cortos.
- **Colores de la app**: copia sus CSS variables o tokens a `tokens.ts` (acento, tinta, líneas, paleta categórica).
  El video habla el mismo idioma visual que la interfaz que muestra.
- Acento para spotlights, pulsos y resaltes; violeta solo para Visión; ámbar solo para avisos/problemas; verde
  para "bien" u "ok".

## 7. Transiciones y capítulos

- Fundido de **0.7 s** con easing in-out cúbico entre todas las escenas. Un whoosh muy bajo en cada corte.
- `ChapterMark` arriba a la izquierda con la forma del stepper de la app: círculo de acento con el número y el
  nombre del capítulo ("01 Input", "02 Testfit", "03 Export"). Solo la primera escena del capítulo lo lleva.
  Aparece a los 0.3 s y se va a los 4.2 s.
- Subtítulos quemados (`FLAGS.burnCaptions`) abajo al centro, pill oscuro, líneas de ≤ 42 caracteres cortadas en
  puntuación. El SRT se entrega aparte.
  Pregunta al inicio si los quieren: quitarlos después del máster es caro. Las escenas
  Motion se componen altas (título en `top: 120`, tarjetas hasta ~800) para dejarles espacio abajo; sin
  subtítulos hay que bajar cada grupo 40–120 px hasta el centro óptico, y eso re-renderiza todas las escenas.

## 8. Sonido ligado al movimiento

"Casi imperceptible. Nunca un efecto sin un movimiento que lo justifique."

| Efecto | Cuándo | Volumen |
|---|---|---|
| `tick` | Cada clic grabado (automático) | 0.22 |
| `whoosh-soft` | Cada corte entre escenas (automático) | 0.12 |
| `pop` | Un resultado que aparece (aplicar un fix, una descarga) | 0.2–0.25 |
| `swell` | Arranque de la bienvenida | 0.25 |
| `rise` | Frase del cierre | 0.22 |

En escenas Motion, **casi cada animación lleva su sonido** (pedido del usuario en el video Coppel), con `Cues`
(`src/components/Cues.tsx`): una lista `[efecto, segundo, volumen?]` por escena con los mismos tiempos de
`useWordTime` que la animación. Vocabulario: `tick` 0.14 (etiqueta, check, celda, capa que aterriza) · `pop` 0.16
(un resultado que aparece: decisión, chip, prioridad) · `whoosh-soft` 0.10 (panel o bloque que entra) · `swell`
0.15–0.18 (transformación grande del objeto: se arma, se separa, nace) · `rise` 0.12–0.15 (momento clave: una ruta
que se traza, un ciclo que se cierra). Nada más fuerte que eso: la elegancia está en que casi no se note.

**Etiquetas sobre un objeto: el objeto se queda quieto.** Un recorrido de cámara o una flotación mientras aparecen
etiquetas se lee como «se mueve de repente a muchos lados» (rechazado). Los acercamientos van antes o después de las
etiquetas, nunca durante.

## 9. Vocabulario por tipo de app

La gramática no cambia; cambian los gestos que se graban.

- **Editor o configurador**: sliders que se arrastran (`d.slider`), drag & drop de objetos (`d.drag`),
  avisos que aparecen y se resuelven con un clic, Ctrl+Z, paletas. Zoom al control, luego al resultado.
- **Dashboard de datos**: cambiar de opción o escenario y ver cómo cambian los indicadores (zoom al
  selector → zoom a los KPIs, spotlight en el que cambió), modo comparativo lado a lado, gráficas que se
  actualizan (callout con la conclusión, no con el número), filtros. Las cifras de pantalla son las de la app:
  si son de un proyecto real, confirma que pueden mostrarse.
- **Visor 3D (three.js, WebGL)**: órbita lenta y continua arrastrando sobre el canvas (`d.drag` con `dur` de
  2–3 s), un cambio de vista o de capa a la vez, sin rótulos que tapen la geometría (los
  chips de id sobre el 3D "tapan todo"). Verifica los fps de captura con `npm run probe:capture -- --drag canvas`
  antes de grabar.
- **Formularios y flujos**: escribir con `d.type` a ~16 caracteres/s (legible), el resultado siempre en cuadro
  (si "no se ve lo que se escribe y se ve cortado el resultado", falla el zoom: debe incluir campo y resultado).
- **Asistentes de IA**: pregunta corta y factual, zoom a la pregunta y luego a la respuesta, esperas de red
  comprimidas (varias tomas, se elige una).

## 10. Checklist visual (antes de mostrar cada escena)

- [ ] Badges de honestidad visibles en todo momento (En vivo / Visión).
- [ ] Nada cortado: textos que se escriben y sus resultados quedan dentro del encuadre.
- [ ] Un solo movimiento de cámara a la vez; la escena En vivo cierra en vista completa.
- [ ] Callouts de 2–5 palabras, legibles al zoom actual.
- [ ] Sin pantallas de carga ni spinners largos (comprimir o grabar otra toma).
- [ ] Sin rótulos que tapen lo importante (3D, gráficas).
- [ ] Las apariciones de Motion caen sobre la palabra que las nombra.
- [ ] Nada parece diapositiva: hay tarjetas, chips, motivo o UI.
