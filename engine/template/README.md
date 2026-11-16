# Video demo — __APP_NAME__

Video demo de ~2:00 hecho con Remotion sobre la app real (grabada con Playwright), voz de ElevenLabs y
música generada. Creado con la skill `app-demo-video`. El repo de la app (`__APP_REPO__`) no se modifica.

- **Rama de trabajo:** `feat/video`. El hook `pre-commit` rechaza commits en `main`, archivos de más de 5 MB y llaves de API.
- **Spec y guion:** `docs/`.

## Requisitos

- Node 24, ffmpeg y ffprobe en el PATH, `npx playwright install chromium`.
- Llaves: el **`.env` general** de `01. Videos` (`ELEVENLABS_API_KEY`). Este proyecto no tiene `.env` ni `.env.example`.
- La app corriendo en `APP.url` (`src/video.config.ts`; de preferencia su build de producción: `npm run build && npx vite preview`).

## Flujo

```bash
npm run estado                         # estado compacto del proyecto (~25 líneas): lo primero al retomar
npm test && npm run typecheck          # el guion pasa las reglas (sin cifras, puntuación, ids)
npm run script:check                   # legibilidad del guion para la voz (siglas, cifras, símbolos, redacción), sin gastar créditos
npm run voices:list                    # voces candidatas en el idioma del video
npm run voices:cast -- --ids a,b,c     # la misma muestra con cada voz → out/casting/
npm run voice:plan                     # ensayo sin API: qué frases se generarían y cuántos caracteres costarían
npm run voice                          # genera solo los segmentos nuevos o cambiados (caché por hash)
npm run shots                          # capturas fijas de cada vista En vivo (animatic)
npm run probe:capture -- --drag canvas # fps reales de captura (obligatorio si hay WebGL/3D)
npm run record -- <escena>             # graba una escena En vivo (--headed, --take n, --promote n)
npm run studio                         # revisión en vivo, sin renderizar
npm run stills -- intro@3 demo@8       # fotogramas sueltos → out/stills/
npm run durations                      # duración por escena (voz vs. grabación) y total
npm run render -- --scene <escena>     # una escena a 720p60 (revisar movimiento)
npm run sfx && npm run music           # efectos y cama musical (una vez, cuando el corte ya está estable)
npm run render -- --draft              # video completo a 720p30 (revisar historia, ritmo y audio)
npm run render -- --final              # máster 1080p60 + SRT (--2k / --4k solo si se piden)
npm run audio:preview                  # voz + música como van a quedar (~1 min): que el usuario escuche antes del máster
npm run qa                             # duración, loudness −16 LUFS y fotogramas de control
# otra versión (p. ej. para el cliente): define un corte en CUTS (video.config.ts) y agrega --cut <corte> a render, qa y durations
```

## Agregar, quitar o reordenar escenas

1. Crear `src/scenes/<id>/narration.ts` (`meta`) y `Scene.tsx`; si es En vivo, también `record.ts` (`setup`, `record`).
2. Registrar el `meta` en `src/scenes/metas.ts` y el componente en `src/scenes/components.ts`.
3. Poner el id en `SCENE_ORDER` (`src/video.config.ts`). Quitar una escena = sacarla de `SCENE_ORDER`.
4. `npm run voice` (solo genera lo nuevo) y, si es En vivo, `npm run record -- <id>`.

Los zooms, spotlights y callouts apuntan a ids de evento de la grabación (`d.mark('id', …)`), no a coordenadas:
si cambia la interfaz, se vuelve a grabar la escena y los overlays siguen alineados. Las apariciones de las
escenas Motion se sincronizan con palabras de la voz (`useWordTime`).

## Honestidad

- En vivo lleva siempre `COPY.liveBadge`; Visión (`register: 'vision'`) lleva `COPY.visionBadge` (lo pone `SceneFrame`).
- El guion no lleva cifras ni dígitos, ni siglas con dígitos como «3D» (se escriben como se dicen: «tercera dimensión»). Lo verifican `src/scenes/metas.test.ts` y `npm run script:check`.
- El video siempre termina con el logo de Gensler (escena `close`, última en `SCENE_ORDER`).
- Co-branding: `FLAGS.coBrand` y `BRAND` en `src/video.config.ts`.
