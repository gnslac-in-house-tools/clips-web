# Voz, efectos y música

Todo se genera con ElevenLabs. La llave (`ELEVENLABS_API_KEY`) vive solo en el **`.env` general** de
`01. Videos`; ningún proyecto tiene el suyo, y nunca va en git ni en mensajes. Cada llamada gasta créditos de la
cuenta del usuario: la caché por hash evita regenerar lo que no cambió, y la música y los efectos se generan una
sola vez, cuando el corte ya está estable.

## Contenido

1. Revisión del guion antes de generar voz
2. Casting de voz (siempre se sugiere)
3. Modelos y ajustes
4. Generación y caché
5. Efectos
6. Música
7. Mezcla y loudness

## 1. Revisión del guion antes de generar voz

Es el paso previo a gastar un solo carácter. Un guion que se lee bien no siempre se oye bien: la voz puede
trabarse con siglas, cifras, símbolos y anglicismos. **Siempre** se revisa, y el resultado se le presenta al
usuario junto con el casting.

1. `npm run script:check` (mecánico): marca dígitos, siglas en mayúsculas, símbolos (`% & / # @ + =`), URLs,
   paréntesis, comillas, guiones largos, espacios dobles o antes de un signo, finales sin puntuación, segmentos de
   más de 25 palabras y tres o más frases seguidas que empiezan con «Y».
2. Revisión de redacción (tú, leyendo en voz alta): ortografía y acentos completos, concordancia, frases
   que continúan a la anterior (cada segmento es una oración completa), lenguaje del cliente y no del código,
   ningún término que dependa de verse en pantalla para entenderse.
3. **Lo que se pronuncia mal se escribe como se dice.** Ejemplos: «3D» → «tercera dimensión» (o «tres
   dimensiones»), «2D» → «dos dimensiones», «IA» → «inteligencia artificial», «KPI» → «indicadores», «ROI» →
   «retorno de inversión», «m²» → «metros cuadrados», «%» → «por ciento», «Wi-Fi» → «wifi». Cuando la sigla es parte
   del nombre en pantalla, se deja en `src/core/pronounce.ts` (el texto original queda en los subtítulos).
4. Los términos dudosos entran en la muestra del casting (siguiente sección) para oírlos antes de decidir.
5. Presenta al usuario una **lista corta de cambios propuestos** (antes → después) con una sugerencia, y aplícalos
   al aprobar. No gastes voz con el guion sin revisar.

## 2. Casting de voz (siempre se sugiere)

El casting **nunca se omite ni se pregunta si hace falta**: en la etapa de voz la skill lo propone ella misma, con
una sugerencia, antes de generar el guion completo. Parámetros del video: idioma (`PROJECT.lang`, default `es`) y
voz (default: **mujer, español neutro latinoamericano**).

1. `npm run voices:list -- [--gender female] [--accent latin american]` lista las voces de la cuenta y candidatas
   de la biblioteca compartida en el idioma del video (uso "narrative_story").
2. Elige 3–4 candidatas y genera la misma muestra con cada una:
   `npm run voices:cast -- --ids isabel:<id>,maria:<owner/id>,… --con "Término dudoso" [--model …] [--speed 1.1]`.
   La muestra son las dos frases más largas del guion real más las frases con los términos dudosos (`--con`): ahí
   se oyen la naturalidad y la pronunciación. **El archivo siempre lleva el nombre de la voz**
   (`out/casting/isabel-<id>-eleven_v3.mp3`): pon `nombre:` antes de cada id (obligatorio para las de la biblioteca,
   que entran a la cuenta como `casting-<id>`), para que el usuario elija por nombre y no por un id.
3. **Mide el ruido de cada candidata** (sección 3) y marca como descartadas las que no pasan, antes de que el
   usuario escuche.
4. Tú sugieres una voz (la de mejor ruido y naturalidad) y el usuario elige de oído en `out/casting/`, con una
   pregunta de opción múltiple (la sugerida primero). Guarda `voiceId`, `modelId` y `settings` en `VOICE`
   (`src/video.config.ts`) con un comentario de quién se eligió y cuándo.

Voces candidatas de partida (español neutro latino, biblioteca compartida, `owner/id`). Son puntos de arranque,
no una decisión: cada video se castea de nuevo y la lista puede estar desactualizada, así que confirma con
`voices:list` que sigan disponibles.

| Voz | Ref | Nota |
|---|---|---|
| Isabel (v3) | `2802c1e7b99d44983ff5986d585de551c74fd9932fed49498426a8f3b6da1fd0/rixsIpPlTphvsJd2mI03` | Natural con v3, estabilidad 0.5 |
| Tatiana | `e9a6840c69b79812b77ea81fa11d55aaf80dcf1938fa0137bf7f514f67f75c99/2rigMbVWLdqtBSCahJFX` | |
| Mia García | `b11ba57b5815bf861c2cb764605fd53a9544948008706505e87a2765ac4b5717/ZpEtuMdTIlJXYXAhevhG` | |
| Samanta | `c0107a57bed40d12d2d7147a2d30de2de8a119a23353d2a06c84bb6a985528c1/qBvury71WUJfVeT1STkG` | |
| Luciana | (de la cuenta) | v2 a velocidad 1.10 |

Para inglés no hay candidatas de partida: haz el casting completo.

**Arranque «pegado al micro» o saturado** (eleven_v3, sobre todo con voces de la biblioteca): el primer medio segundo
sale 3–6 dB más fuerte que el resto. **No se corrige con ganancia, curvas ni ecualización** (el usuario lo pidió: se
oye mal). `voice.ts` mide el arranque de cada toma (`arranqueDb`) y la repite hasta 4 veces, quedándose con la mejor;
lo que siga arriba de +2 dB se marca para oírlo. Ojo: una frase con énfasis inicial también mide alto, así que la
decisión final es de oído.

**Emoción:** si el usuario pide «más emotivo», haz una prueba corta A/B (2–3 frases, ~500 caracteres) antes de
regenerar todo: A = v3 con estabilidad 0 («Creative»: más expresiva y más rápida), B = estabilidad 0.5 con etiquetas
de emoción de v3 (`[warmly]`, `[excited]`). En un video anterior ganó A. Si el usuario está en otro dispositivo, manda
las muestras con `SendUserFile`: una ruta local no le sirve.

## 3. Modelos y ajustes

| | `eleven_v3` | `eleven_multilingual_v2` |
|---|---|---|
| Naturalidad | Más expresivo; con algunas voces suena "robotizado" | Estable y predecible |
| Ajustes | Solo `stability`: 0 (creativa), 0.5 (natural), 1 (robusta) | `stability`, `similarity_boost`, `style`, `use_speaker_boost`, `speed` |
| Contexto entre frases | **No** acepta `previous_text`/`next_text` (400) | Sí (mejor entonación entre frases) |
| Ajuste de partida | `{ stability: 0.5 }` | `{ stability: 0.32, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true, speed: 1.05–1.10 }` |

Una voz puede sentirse robotizada con un modelo y natural con otro (v2 con `speed` 1.05–1.10 y estilo 0.4 frente
a v3 con estabilidad 0.5). Lección: **el casting compara voces y modelos con el mismo texto; no se elige por
descripción.**

**Mide el ruido de cada candidata antes de elegir.** Una voz de la biblioteca de la comunidad sonaba bien en la
muestra corta, pero su grabación traía ruido de fondo (−46 a −53 dB en las pausas, contra −82 a −86 dB de una voz
propia de ElevenLabs). En el video completo se oyó como "ruido de fondo, cortes feos, saturación" y hubo que rehacer
la voz y regrabar las tomas. Prefiere voces propias de ElevenLabs o
de la cuenta con piso < −65 dB, y para inglés `eleven_multilingual_v2` con `previous_text`/`next_text`: con v3
cada frase sale sin contexto y cambia la cercanía. Si el usuario dice que la
voz suena robotizada, genera variantes (otra voz, otro modelo, `speed` 1.05–1.10, guion con frases más cortas)
y que elija de oído.

## 4. Generación y caché

`npm run voice` (o `-- --scene <id>`):

- **Una sola toma por frase, siempre** (regla del usuario). El pipeline nunca repite una frase por su cuenta:
  arranque fuerte (primer medio segundo > 2 dB sobre el resto) y final sospechoso solo se **avisan** («óyelo») y
  se revisan de oído en el animatic. Así `voice:plan` cobra exactamente lo que dice. Antes se repetía hasta 4 veces
  y un guion de 2,340 caracteres gastó ~10,170 (video anterior). Regenerar una frase es decisión del usuario,
  frase por frase, con un sí explícito y su costo dicho.
- Texto → `toSpoken()` (diccionario de pronunciación) → TTS `with-timestamps` → mp3 + alineación por carácter.
- **Limpieza por frase** (`pipeline/voiceMaster.ts`, sin API, sin compresión): paso altos 70 Hz → reducción de
  ruido solo si el piso pasa de −58 dB → fin del habla medido en el archivo limpio → cola suave de 120 ms (nada de
  cortes en la última sílaba) → ganancia exacta a −18 LUFS → limitador a −2 dBFS. Se reproduce el `.wav` limpio y
  sus tiempos van al manifest. Si cambias la cadena, sube `MASTER_VERSION`.
- **Finales secos de `eleven_v3`**: casi ninguna frase trae silencio después de la última letra. La limpieza v3 lo
  detecta (habla hasta el final del archivo) y usa un fade de 30 ms + 250 ms de silencio; antes, el fade de 120 ms
  se comía la última sílaba y todo «sonaba cortado» (video anterior). Si el final es sospechoso (voz sostenida
  hasta el último instante), `voice` y `voice:plan` lo avisan: **óyelo en el animatic antes de gastar**, y solo si se
  oye cortado, y con el sí del usuario, regenera con `npm run voice -- --reintentar-cortadas` (una toma por frase).
- Para medir ruido y finales: piso en ventanas de 50 ms (percentil 5–10) y nivel de los últimos 100 ms del `.wav`
  limpio (debe quedar < −60 dB). Una frase corta sin pausas da un «piso» falso alto: mírala con su perfil.
- Llave de caché: `hash(texto hablado + voz + modelo + formato + ajustes)`. Cambiar una frase regenera solo esa
  frase; cambiar la voz regenera todo.
- El manifest (`public/generated/voice-manifest.json`) guarda duración, **`speechEndSec`** (fin real del habla,
  medido con `silencedetect`: el ritmo lo marca el habla, no el silencio final del mp3) y alineación.
- Si una frase cambió y su voz aún no se generó, la línea de tiempo usa una estimación y avisa.
- La alineación alimenta los subtítulos, `useWordTime` y `cueWord`.

Cambiar una frase de una escena En vivo ya grabada cambia sus tiempos: o se regraba la escena, o se ajustan los
`pauseAfter` para que la voz nueva caiga sobre la grabación existente (deja un comentario).

## 5. Efectos

`npm run sfx` genera una vez la biblioteca nombrada (`src/audio/sfx.ts`) con ElevenLabs Sound Effects:
`tick`, `whoosh-soft`, `pop`, `swell`, `rise`. Prompts minimalistas ("very soft minimal user interface click,
clean, subtle, high-end product interface"). Los componentes solo los usan si el archivo existe, así que el video
se puede revisar sin ellos. `--force` regenera.

## 6. Música

`npm run music`, cuando las duraciones ya están estables (voz real y grabaciones hechas):

- Prompt en `MUSIC.prompt`: ambient electrónico mínimo, piano suave y pads, pulso ~90 BPM, optimista y calmado,
  sin voces ni percusión marcada, textura completa hasta el final y **un acorde final resuelto**.
- Se pide **25 s más larga que el video** y `MusicBed` recorta el *inicio* para que el fin del cuerpo de la pista
  caiga **3.5 s antes del final**: el acorde suena sobre los logos del cierre. El usuario lo pidió así ("la
  música se acaba antes del video", "su cierre cae sobre los logos").
- `bed.json` guarda `bodyEndSec`: el último segundo a menos de 6 dB de la mediana (con 12 dB un decrescendo
  largo contaba como cuerpo y el acorde caía antes).
- El script reintenta hasta 3 veces si la pista no cubre el video; el render se niega a correr si la música no
  alcanza (antes de gastar tiempo).
- Si el plan de ElevenLabs no incluye música: una pista libre de regalías en `public/generated/music/bed.mp3`
  funciona igual (corre `npm run music` igual para que mida `bed.json`, o el render lo mide).

## 7. Mezcla y loudness

- **Antes del máster, escucha el audio:** `npm run audio:preview` genera en ~1 min un `.m4a` con la voz y la música
  como van a quedar. Es el filtro barato para ruido, saltos de volumen, cortes y balance. Los problemas típicos
  (ruido de fondo, "cerca/lejos", saturación de la música) se oyen ahí; no hace falta renderizar.

- Música (`MUSIC.base`/`MUSIC.duck`) 0.40 sin voz y **ducking** a 0.15 bajo la voz, con rampas de 0.5 s; fade in
  2 s, fade out 3 s. Con la voz a −18 LUFS y la pista a ~−16 LUFS la música queda ~15 dB bajo la voz. Con
  0.20/0.06 quedaba ~28 dB abajo y se pidió que se escuchara mejor.
- Voz a volumen completo; efectos según la tabla de `estilo-visual.md`.
- El máster se normaliza a **−16 LUFS integrado** con loudnorm **en dos pasadas, lineal** (mide y aplica una sola
  ganancia; en una pasada es dinámico y bombea), AAC 256 kbps.
- `npm run qa` verifica −16 ± 1 LUFS y la duración objetivo, y saca dos fotogramas por escena.
- Sin silencios de más de 1.5 s dentro de una escena (revisar en el borrador).
