# Clips de preview de apps (versión web)

Este repo trae la skill `app-preview-clip` (`.claude/skills/`) y el motor que usa en `engine/`
(scaffold + plantilla Remotion/Playwright). Corre en Claude Code web (Linux), sin editor local.

- Pide un clip («hazme un preview de <app>») y sigue la skill. Los repos de video se crean en `work/` (ignorado por git).
- Flujo: `node engine/scaffold.mjs ... --dir work/<App>-Demo-Video` → `bash scripts/prepare-video-repo.sh work/<App>-Demo-Video`.
- Salida final: `out/preview/` (mp4, póster). Descárgala desde la sesión; la nube no guarda carpetas locales.
- La app a grabar debe ser alcanzable desde la nube: pública, o un repo que se clone y corra aquí (`APP_URL`).
- Sin voz ni ElevenLabs: los clips son mudos, no hacen falta llaves.
- Si necesitas llaves u otros datos, van como variables de entorno del entorno web, nunca en archivos.
- Honestidad: solo se muestra lo que existe. Nunca modificar el repo de la app.
