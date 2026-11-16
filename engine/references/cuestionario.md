# Cuestionario inicial: empezamos por el guion

Al correr la skill en un proyecto nuevo, **lo primero que dices** es esto (adáptalo, pero conserva la idea):

> «Vamos a empezar por el **guion**. Te haré unas preguntas cortas de opción múltiple, la mayoría sobre el
> negocio: para qué sirve el video, quién decide y cómo lo vamos a usar. Con tus respuestas te propongo un spec y
> una estructura, y solo entonces escribimos el guion. Son unas 3 rondas.»

Todas las preguntas son de **opción múltiple (AskUserQuestion)**, con la opción sugerida primero y marcada
«(Recomendado)». Hasta 4 preguntas por llamada. Nunca preguntas abiertas. Antes de preguntar, lee la app y el repo:
lo que deduzcas va como opción recomendada. No repitas lo que ya esté en `docs/estado.md`.

Las intenciones quedan **escritas**: al terminar cada ronda anota las respuestas en `docs/estado.md` («Decisiones
aprobadas») y la intención completa en `docs/spec.md`. Es lo que se vuelve a leer al retomar el proyecto.

## Ronda 1: intención y material previo (siempre)

| Pregunta | Opciones (la primera es la sugerida) |
|---|---|
| ¿Para qué es este video? | **Vender o conseguir una aprobación** (propuesta, horas, piloto) · **Demostrar una app que ya funciona** (como demo) · **Las dos**: vender con la demo en vivo como prueba |
| ¿Ya tienes un guion, notas o ideas? | **No, lo escribimos desde cero** · Tengo un borrador o notas sueltas · Tengo un guion completo · Solo tengo la idea o el mensaje clave |
| *(solo si tiene algo)* ¿Dónde lo dejamos? | **Lo dejo en `_entrada\guion-base.md`** dentro de la carpeta del proyecto · Lo pego aquí en el chat · Está en otro formato (Word, PDF, presentación, Miro) y lo busco yo |
| ¿Quién lo va a ver y quién decide? | **Quien decide y paga** (dirección, cliente) · El equipo técnico o de diseño que lo va a usar · Usuarios finales · Una mezcla (decisores y equipo) |

**Si ya tiene material**: léelo entero antes de seguir y no preguntes lo que ya responde. Extrae de él el mensaje
clave, el orden y las frases que quiere conservar; después pásalo por las mismas reglas (`guion.md` §4–6:
honestidad, legibilidad, ~270–300 palabras). Preséntale lo que cambiarías (antes → después) como opción múltiple. Su
texto es la base: se adapta, no se descarta. La carpeta `_entrada\` no se versiona; copia lo útil a `docs/`.

## Camino A: vender (o conseguir una aprobación)

El video es un argumento de negocio y la app es la prueba. Preguntas de la **Ronda 2**:

| Pregunta | Opciones |
|---|---|
| ¿Qué decisión debe tomar quien lo vea al terminar? | **Aprobar la propuesta o las horas** · Aceptar un piloto · Agendar la siguiente reunión · Liberar presupuesto |
| ¿Cuál es la objeción principal que hay que desactivar? | **No confían en que funcione** · Les parece caro o lento · Ya tienen otra forma de hacerlo · No ven la urgencia |
| ¿Cómo hoy resuelven el problema? | **A mano / con herramientas sueltas** · Con otro software · Con otro proveedor · No lo resuelven |
| ¿Qué prueba los convence más? | **Verla funcionando con su caso** · Ver el antes y el después de su proceso · Ver hacia dónde puede crecer (con badge de Visión) · Ver la credibilidad del equipo |

**Ronda 3** (valor y uso; con multiselección donde aplique):

| Pregunta | Opciones |
|---|---|
| ¿Qué valor quieres que recuerden? (hasta dos) | **Ahorra tiempo** · Reduce riesgo y errores · Mejores decisiones con datos · Se vuelve estándar y escala |
| ¿Hay cifras de negocio reales y aprobadas para mostrar? | **No: sin cifras** (el valor se demuestra, no se promete) · Sí, solo en pantalla · Sí, también en la voz |
| ¿Dónde y cómo se va a ver? | **Se envía por correo o Teams, sin presentador** · Dentro de una reunión, con alguien hablando antes y después · En un evento o pantalla · Como pieza interna de aprobación |
| ¿Cómo debe terminar? | **Logo de Gensler, sin voz** · Una frase de invitación y el logo · Una frase con el siguiente paso concreto y el logo |

**Spec propuesto (`docs/spec.md`)**: objetivo de negocio · decisión que se busca · decisor y audiencia · objeción y
cómo se contesta · prueba elegida · valor a recordar (cualitativo) · cómo se usa el video · restricciones
(honestidad, anonimato, sin cifras) · estructura · fuera de alcance.

**Estructuras para proponer** (formas de partida, no plantillas: ajústalas al caso y ofrece 2–3 con `preview`):

- *Dolor → respuesta → prueba → siguiente paso*: el costo de hacerlo como hoy (Motion, ~20 s) · la promesa (Motion,
  ~15 s) · la prueba en vivo de lo que más pesa (En vivo, ~55 s) · el valor para ellos (Motion, ~20 s) · cierre.
- *Objeción primero*: arranca con la duda que tienen y la contesta con la app (En vivo, ~70 s), luego valor y cierre.
- *Visión → prueba*: lo que podría ser, con honestidad (Motion/Visión, ~25 s), y la demostración de lo que ya existe
  (En vivo, ~65 s) antes del valor y el cierre.

## Camino B: demostrar una app que ya funciona

El video es la demo: la app es la protagonista. Preguntas de la **Ronda 2**:

| Pregunta | Opciones |
|---|---|
| ¿Qué debe quedar claro de la app? | **Qué hace y para quién** · Cómo se usa, paso a paso · Qué la hace distinta · Qué está listo y qué falta |
| ¿Quién la va a ver? | **Quienes la van a usar** · Quienes la aprueban o financian · El equipo que la mantiene · Mezcla |
| ¿Cuánto de la app se muestra? | **Las 2–3 funciones principales** (lo que cabe en 2:00) · Un recorrido completo · Una sola función clave |
| ¿Todo lo que se muestra ya existe? | **Sí, todo es real** · Hay partes que son concepto (llevan badge de Visión) · Es un prototipo y se dice desde el inicio |

**Ronda 3**: dónde se usa (correo, reunión, documentación o capacitación, evento), si hay datos que no pueden verse
(anonimato) y cómo debe terminar (igual que en el camino A).

**Spec propuesto (`docs/spec.md`)**: objetivo · audiencia · funciones que se muestran, por prioridad, con su
registro (En vivo / Visión) · flujo de la demo · qué es real y qué es visión · estructura · restricciones · fuera de
alcance.

**Estructuras para proponer** (también formas de partida):

- *Qué es → cómo se usa → qué sigue*: una apertura breve (Motion, ~15 s), dos o tres escenas En vivo de una tarea
  cada una (~75 s), y el estado actual y lo que viene (~15 s), antes del cierre.
- *Una situación de uso real*: una situación del usuario y cómo la app la resuelve de punta a punta (En vivo, ~90 s).
- *Por funciones*: una escena En vivo por función principal con su resultado visible, en el orden de importancia.

## Camino C: las dos (vender con la demo como prueba)

Haz las preguntas del camino A (negocio) y, de la Ronda 2 del B, solo «¿Cuánto de la app se muestra?» y «¿Todo lo
que se muestra ya existe?». La estructura es del camino A, con la parte En vivo del B como prueba (~50–55 % del tiempo).

## Ronda de marca: cómo se viste la piel técnica (siempre)

La piel visual por defecto es la **técnica axonométrica** (`estilo-visual.md` §0); lo que cambia en cada video es la
marca que la viste. Pregunta (opción múltiple, recomendada primero según el caso):

| Pregunta | Opciones |
|---|---|
| ¿Con qué marca vestimos el video? | **Marca del cliente** (si el video nombra a un cliente: colores medidos de su logo, co-branding en el cierre) · **Colores de la app** (si es una demo de una app con identidad propia) · **Identidad Gensler / Halo** (pieza interna o genérica) |
| ¿Dónde está el logo? *(si es del cliente)* | **Lo dejo en `_entrada\`** (PNG transparente, SVG o el que haya: se limpia el fondo) · Búscalo tú en la web del cliente · Sin logo del cliente |
| ¿Qué objeto protagoniza el dibujo técnico? | Lo deduces del guion y lo ofreces: **un edificio o tienda en capas** (`Explotada`) · una torre o fachada · un plano o mapa · un diagrama de flujo |

De la respuesta salen `accent`, `highlight`, `navy` y `brandLine` en `tokens.ts` (los neutros perla y grafito no
cambian) y `FLAGS.coBrand`. Anótalo en `docs/estado.md`.

## Ronda final: lo técnico (con defaults, casi todo deducido)

Pregunta solo lo que no puedas deducir, siempre con opciones: idioma y voz · anonimato (caso de estudio o genérico) ·
subtítulos quemados · versión para el cliente (corte) · resolución del máster · cómo correr la app. Los
defaults están en la tabla de `SKILL.md`.

## Después del cuestionario

1. Escribe `docs/spec.md` con lo que respondió y preséntalo como resumen corto (no como pregunta de lectura): «Esto
   entendí; ¿lo apruebas?» con opciones **Aprobar** (recomendada) / **Ajustar** / **Cambiar de camino**.
2. Propón 2–3 estructuras del camino elegido (con `preview`), la recomendada primero.
3. Con la elegida, escribe el guion (`guion.md`) y sigue en `etapas.md` §1.
