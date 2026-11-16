# Video demo: __APP_NAME__

Repo del video demo de la app (`__APP_REPO__`), hecho con la skill `app-demo-video` (Remotion + Playwright +
ElevenLabs). Aquí solo van las reglas y decisiones que no se deducen del código. Comandos y flujo: `README.md`.
Spec y guion: `docs/` (el estado vivo del proyecto: `docs/estado.md`). Completa las secciones marcadas con (completar) a medida que el usuario decida.

## Reglas que no se rompen

- **Rama `feat/video`.** Nunca `main`. El hook `pre-commit` rechaza commits en `main`/`master`, archivos de más
  de 5 MB y cadenas con forma de llave de API. Commits en español con prefijo (`feat:`, `fix:`, `docs:`).
- **El repo de la app no se modifica.** Se corre de solo lectura en `APP.url` (`src/video.config.ts`).
- **Ubicación.** Puede vivir en OneDrive solo si la carpeta está anclada en el equipo («Siempre conservar en este dispositivo»); si estuviera solo en línea, se ancla o se usa una ruta fuera de OneDrive.
- **Un solo `.env`, el general de `01. Videos`.** Este repo no tiene `.env` ni `.env.example`; `pipeline/env.ts` lo lee de ahí. Nunca se escribe una llave en mensajes, commits, logs ni en este repo.
- **Siempre de menos a más.** Cada peldaño de la escalera de calidad se aprueba antes del siguiente; el máster necesita autorización explícita.
- **Preguntas al usuario: solo de opción múltiple, con una sugerencia marcada.** Nunca preguntas abiertas de texto ni de lectura.
- **El video termina con el logo de Gensler** (el vigente, de `01. Videos/_kit/brand`).
- **No gastar créditos de ElevenLabs sin aprobación.** Respeta la caché (`cache/voice/`); música y efectos se generan una sola vez.
  **Una toma de voz por frase, siempre**: `voice.ts` no repite frases por su cuenta; arranque fuerte y final
  sospechoso solo se avisan («óyelo»). Regenerar una frase es un sí del usuario, frase por frase.
- **El máster 1080p60 necesita autorización explícita del usuario**, aun con el borrador aprobado. Sin 2K/4K salvo que lo pida.
- **Conserva lo anterior.** El usuario edita el original después: no borres progreso; mueve los másters previos a
  subcarpetas de `out/final/` antes de sobrescribir.

## Contenido del video (completar)

- Idioma, marca (`FLAGS.coBrand`), audiencia.
- Anonimato: ¿sin cliente, proyecto, sitio ni ciudad en voz y pantalla? La voz nunca dice cifras; no se inventan.
- Honestidad: qué es En vivo, qué es Visión (con badge), qué es explicación Motion.
- Subtítulos quemados (`FLAGS.burnCaptions`): ¿sí o no? Quitarlos tarde obliga a recentrar las escenas Motion.
- Cierre: quién se acredita (equipo, solo el logo, nadie).

## Versiones (`CUTS` en `src/video.config.ts`)

Un corte solo quita escenas de `SCENE_ORDER`: reutiliza los clips de `cache/scenes/` y re-renderiza la cama de
música, la unión y el loudness (~3 min). `--cut <corte>` en `render`, `qa`, `durations` y `audio:preview`. Salida:
`out/final/<slug>-<corte>-demo-1080p60.mp4`. (completar: qué cortes existen y para quién)

## Voz y audio

- Voz (completar): id, modelo y por qué. El casting siempre se propone, y el guion se revisa antes (`npm run script:check` + lectura: lo que la voz puede leer mal se escribe como se dice). **Mide el ruido de una voz antes de elegirla** (piso en pausas < −65 dB).
  Prefiere `eleven_multilingual_v2` con contexto de frase.
- `pipeline/voiceMaster.ts` (sin compresor): paso altos → reducción de ruido solo si el piso supera −58 dB → cola
  suave de 120 ms → ganancia exacta a −18 LUFS → limitador a −2 dBFS. Si cambias la cadena, sube `MASTER_VERSION`.
- Mezcla: `MUSIC.base` 0.40, `MUSIC.duck` 0.15; máster con loudnorm lineal de dos pasadas a −16 LUFS, pico −1.5.
- **Antes de un máster, `npm run audio:preview`** (~1 min): que el usuario lo escuche.
- La duración depende de la voz: estima con `npm run durations`, no con el conteo de palabras. Objetivo: **2:00** (`TARGET`).
- Antes de regenerar voz, `npm run voice:plan` muestra cuántos caracteres costaría.

## Grabación y caché

- Cada `goToStep` recarga la app. Escenas de teléfono: `device: 'phone'`.
- El último zoom de una escena En vivo necesita `tail`: la cámara vuelve a vista completa ~1.9 s antes del fin.
- Tocar `video.config.ts`, `Root.tsx` o `metas.ts` invalida la caché de todas las escenas; si el cambio no toca
  la imagen, copia cada clip a su llave nueva (`sceneKey`) en vez de re-renderizar.
- Un render largo no debe correr con la computadora suspendida (Remotion pierde el Chrome y cae). Relanza el mismo
  comando: retoma desde `cache/scenes/`. Sin internet sigue corriendo (la fuente sale de `public/fonts/`).

## Windows y shell

- Los hooks bloquean `taskkill /PID`, `rmdir /s`, `Set-Location C:\` y `rm` con variables sin proteger. Para matar
  un render: `Stop-Process` por línea de comandos (`TaskStop` no mata Chrome ni ffmpeg). Para limpiar: rutas
  literales o `"${var:?}"`.
- En Git Bash `-pattern_type glob` de ffmpeg no funciona; los grafos largos van en archivo (`-/filter_complex`).

## Economía de contexto (tokens)

- Al retomar: `npm run estado` y `docs/estado.md`; no recorras el repo ni releas lo aprobado. Actualiza `docs/estado.md` en cada aprobación.
- Revisa con el tablero (`tablero.png`, un solo cuadro) y fotogramas pequeños; no leas mp4 ni logs enteros (redirígelos a archivo y mira la cola).
- Una revisión toca solo lo que cambió: `npm run durations` traduce el minuto a escena y segmento.

## Pendiente conocido (completar)
