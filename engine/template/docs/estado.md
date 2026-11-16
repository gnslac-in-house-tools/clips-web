# Estado: __APP_NAME__

Etapa: 0 · repo creado (aún sin intake)

Es lo único que hace falta leer para retomar el proyecto (con `npm run estado`). Se actualiza **al cerrar cada
paso y antes de un `/clear`**, no al final: decisiones, peldaños, siguiente paso exacto y bitácora. Nada de
narrativa: hechos y decisiones. Quien retome no tiene memoria de la conversación; lo que no esté aquí no existe.

## Siguiente paso (exacto)

1. Hacer el intake (preguntas de opción múltiple) y escribir `docs/spec.md`.

## Decisiones aprobadas

- Intención: (pendiente: vender / demostrar / las dos) · material previo: (pendiente: ¿hay guion en `_entrada\guion-base.md`?)
- Decisión que se busca, objeción y prueba elegida: (pendiente; si es una demo: qué debe quedar claro)
- Audiencia y quién decide: (pendiente)
- Idioma: __LANG__ · duración objetivo 2:00 · cierre: logo de Gensler
- Anonimato: (pendiente) · subtítulos quemados: (pendiente) · co-branding: (pendiente)
- Marca y piel: (pendiente: marca del cliente, de la app o Gensler; colores medidos; objeto protagonista del dibujo técnico)
- Estructura de escenas: (pendiente: se propone en el intake según la app)
- Voz: (pendiente: casting) · ruido medido: (pendiente)

## Peldaños de la escalera de calidad

| Peldaño | Estado | Aprobado el |
|---|---|---|
| 1 Guion | pendiente | |
| 1b Estilo visual (HTML: piel técnica + marca) | pendiente | |
| 2 Tablero y guion visual | pendiente | |
| 3 Boceto estático 360p15 | pendiente | |
| 4 Voz (casting + guion completo) | pendiente | |
| 5 Animatic estático 720p30 | pendiente | |
| 6 Tomas en vivo (si hay app) | pendiente | |
| 7 Animación (escena piloto → resto) | pendiente | |
| 8 Audio y borrador | pendiente | |
| 9 Máster 1080p60 | pendiente (necesita autorización explícita) | |

## Bitácora (una línea por paso)

- (fecha) · Repo creado desde la plantilla.

## Archivos clave

- Guion: `src/scenes/<id>/narration.ts` · escenas: `src/scenes/<id>/Scene.tsx` · frames: `src/frames.ts`
- Spec: `docs/spec.md` · tablero: `out/frames/tablero.png` · estilo: `docs/estilo/index.html`
- Voz: `public/generated/voice-manifest.json` (caché en `cache/voice/`) · casting: `out/casting/`
