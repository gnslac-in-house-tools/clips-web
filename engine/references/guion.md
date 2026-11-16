# Guion: estructura, tono y reglas

El guion es lo primero que se escribe y lo primero que revisa el usuario: decide el ritmo, la duración y qué
se graba. Todo lo demás (grabación, zooms, apariciones) se ancla a sus frases y palabras.

**Cada video es distinto.** No hay un arco fijo ni un guion de referencia que copiar: la estructura y la narrativa
salen de la app, la audiencia y el objetivo de *este* proyecto. Lo que sí es constante es cómo se propone (sección 1)
y las reglas de escritura, honestidad y legibilidad.

## Contenido

1. Proponer la estructura (al inicio)
2. Duración: 2:00
3. Tono
4. Reglas de escritura para voz
5. Honestidad
6. Legibilidad y pronunciación
7. Guion en inglés
8. Correcciones que se repiten (no repetir)

## 1. Proponer la estructura (al inicio)

Con el cuestionario respondido (`cuestionario.md`: intención —vender o demostrar—, decisión que se busca, objeción,
prueba, audiencia, funciones y si existen), propones la estructura **tú**: el usuario elige, no la redacta. Un video
para vender y uno para demostrar toman caminos distintos; las formas de partida de cada camino están en
`cuestionario.md`. Si el usuario trae un guion previo, la estructura parte de él.

1. Arma **2 o 3 estructuras distintas** pensadas para esta app y esta audiencia. Cada una es una tabla corta:
   escena · registro (Motion / En vivo / Visión) · segundos · qué cuenta. Ejemplos de forma (no plantillas):
   - *Situación → respuesta*: una situación real del usuario de la app y cómo la resuelve, paso a paso.
   - *Recorrido por tareas*: las dos o tres tareas que más importan, cada una con su resultado.
   - *Antes / después*: cómo se hace hoy y cómo cambia con la app, con la prueba en vivo en medio.
   - *Diagnóstico → acción*: qué revela la app y qué decisión permite tomar.
2. Preséntalas con **una pregunta de opción múltiple** (AskUserQuestion, con `preview` para comparar tablas) y la
   que recomiendas primero, marcada «(Recomendado)», con una línea de por qué.
3. Con la elegida escribes el guion completo (sección 4) y lo presentas como tabla por escena.

Lo que vale para cualquier estructura:

- **Un hilo, no un recorrido de botones.** Las funciones aparecen como respuesta a algo que le importa a la audiencia.
- **La prueba en vivo es el corazón**: ~50 % del tiempo, escenas de 15–25 s (2–4 frases). Si un tema pide más, se
  parte en dos escenas del mismo capítulo.
- **El entusiasmo no cae antes del cierre.** Lo conceptual o «lo que podría ser» va al principio o como una sola
  frase con badge de Visión; una escena entera de Visión al final frena el video.
- **El cierre siempre es el logo de Gensler** (escena `close`, la última). Por defecto sin voz; si el usuario quiere
  una frase de cierre, es una sola.
- **Qué mostrar**: lo que la audiencia necesita ver que se cumple. Para cada función: ¿existe (En vivo) o no
  (Visión, con badge)?

## 2. Duración: 2:00

- **Objetivo: 2:00** (`TARGET.goalSec = 120`, rango aceptable 1:45–2:15). Si el usuario pide otra, cámbiala en
  `TARGET` y en `docs/estado.md`.
- **Presupuesto de palabras: ≈ 270–300** para 2:00 (la voz corre a ~2.5–2.8 palabras/s y ocupa ~90 % del video).
  `npm run script:check` cuenta las palabras y estima la duración.
- **La duración real la marca la voz**, no el conteo: con voces distintas el mismo guion puede variar ±15 %. Antes
  del casting da la duración como rango; después de `npm run voice`, confírmala con `npm run durations`.
- Si llegan comentarios que agregan texto, mide su impacto con la herramienta y repórtalo; no recortes por tu
  cuenta para cumplir la meta: pregunta (opción múltiple) qué se sacrifica.

## 3. Tono

Por defecto, película de producto premium: **calmado, seguro, cálido, sin exageración**. Más alegre que solemne,
pero sin llegar a divertido o infantil: sigue siendo una demo. Si la audiencia pide otro tono, se decide en el intake.

- Segunda persona directa: «Defines…», «Si mueves…». El espectador es quien usa la app.
- Frases que describen lo que se ve mientras se ve. Nada de «como pueden ver».
- Cero superlativos vacíos («revolucionario», «increíble», «potente»). El valor se demuestra en pantalla.
- Una idea por frase. Pausa natural entre ideas (`pauseAfter` 0.45 s por defecto; 0.7 s antes de un giro).
- Preguntas retóricas, como mucho una, para abrir la solución.
- Vocabulario del cliente y del dominio, no del código. Pregunta cómo llama el cliente a las cosas.

## 4. Reglas de escritura para voz

Los tests (`src/scenes/metas.test.ts`) y `npm run script:check` verifican las mecánicas; las demás son de oído.

- **Sin dígitos, ni siquiera en siglas** (`ALLOWED_DIGIT_TOKENS` está vacío): «3D» se escribe «tercera dimensión» o
  «tres dimensiones». Los números van con letra y solo si son verdad.
- Cada segmento termina en `.`, `?`, `!` o `:`, y las preguntas y exclamaciones abren con `¿` / `¡`.
- Segmentos de 8–20 palabras. Uno de más de 25 se parte.
- **Cada segmento es una oración completa**: cada frase se genera por separado, y una que continúa a la anterior
  («Compararlas entre sí…») suena cortada. Evita varias frases seguidas que empiecen con «Y».
- Ids de segmento únicos en todo el video (`w1`, `p2`, `t3`…), un prefijo por escena.
- **Cada palabra que dispara algo debe estar literal en el texto**: `useWordTime(timeline)('w2', 'layout')` busca
  «layout» en la frase. Si se cambia la frase, revisa los `w(…)` y `cueWord(…)` de esa escena.
- Listas de tres elementos como máximo: más se vuelven ruido.
- Frases que suenan relacionadas deben ser una sola frase.

## 5. Honestidad

- **Nada de cifras inventadas**: ni tiempos («en segundos»), ni porcentajes, ni ahorros. Si la app calcula algo,
  se dice «estimado de forma paramétrica».
- Lo que no existe va en registro **Visión**, nunca narrado como si existiera («puede crecer hacia…»). El badge lo
  pone `SceneFrame`.
- Si la app es un prototipo, se dice al principio.
- Datos reales de un cliente o proyecto: pregunta qué puede salir en pantalla y en la voz. Una opción que funciona:
  cifras reales en pantalla y **voz sin cifras**; el video no envejece cuando cambian los datos.
- «En tiempo real», «al momento»: verifica cómo llega la información al usuario final. Solo lo que de verdad es
  instantáneo (un slider, cambiar de vista) se dice así.
- Video genérico (sin caso de estudio): ni cliente, ni proyecto, ni sitio, ni ciudad. La pantalla se anonimiza en
  la captura (`pipeline.md`, «Anonimizar la captura»).
- **Las frases de proceso se verifican en el código**, no en el README: la documentación puede resumir de más
  («calcula y valida» puede esconder que la validación es un paso aparte).
- Explicar algo que existe fuera de la app (un plugin, un script, un flujo de datos) va en Motion, con diagrama y
  nombres reales. No es Visión, porque existe.
- Respuestas de un asistente de IA dentro de la app: pregunta factual y verificable; revisa la respuesta grabada.

## 6. Legibilidad y pronunciación

Antes de generar voz, **siempre**: `npm run script:check` y una lectura en voz alta de todo el guion
(`voz-y-audio.md` §1). Lo que la voz puede leer mal se **escribe como se dice** en el guion; el diccionario
`src/core/pronounce.ts` queda solo para nombres que deben verse escritos de otra forma en pantalla.

- Siglas y cifras: «3D» → «tercera dimensión», «IA» → «inteligencia artificial», «m²» → «metros cuadrados».
- Reemplazos del diccionario solo de palabra completa (no cruzan espacios: los subtítulos dependen de eso).
- Anglicismos y nombres de producto: pruébalos en la muestra del casting; si suenan raro, sepáralos o tradúcelos.
- Nombres propios del cliente: cómo se pronuncian en voz alta.
- Ortografía y acentos completos: la voz y los subtítulos los usan.

## 7. Guion en inglés

- `PROJECT.lang = 'en'` cambia badges, locale de la captura y diccionario de pronunciación.
- El inglés es más compacto: ~10 % menos palabras para el mismo contenido (≈ 250–270 para 2:00).
- Segunda persona, presente, sin «As you can see».
- Si la app está en otro idioma que el video, callouts y titulares van en el idioma del video; la UI grabada no se
  traduce.
- Voces: `voices:list -- --lang en` y casting completo; pregunta el acento (opción múltiple).

## 8. Correcciones que se repiten (no repetir)

- **Diapositivas de título sobre fondo liso** se sienten tristes: las escenas Motion usan el lenguaje visual de la
  app (`estilo-visual.md` §5).
- **Voz robotizada**: casting con varias voces y modelos, frases cortas escritas para decirse.
- **Los comentarios del equipo se integran en el guion**, no se pegan al final.
- **Quitar escenas es barato; cambiar frases sueltas no**: cambiar texto de una escena En vivo ya grabada obliga a
  regrabar. Para una versión más corta, quita escenas (`CUTS`).
- **Lo técnico estorba al cliente**: si hay una audiencia cliente, ofrece un corte sin las escenas técnicas.
- **El cierre se decide al inicio**: logo de Gensler siempre; voz o crédito solo si el usuario lo pide.
