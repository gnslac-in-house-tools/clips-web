import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Un solo .env para TODOS los videos: el de la carpeta «01. Videos». Ningún proyecto guarda el suyo
 * (ni .env ni .env.example). Ahí solo van llaves; la URL de cada app vive en video.config.ts.
 * Orden: VIDEOS_ENV (ruta explícita) → la ruta fija de abajo → un .env en algún directorio padre.
 * Un .env suelto dentro del proyecto nunca tiene prioridad sobre el general.
 */
const FIXED = '(variables de entorno)';

function findGeneralEnv(): string | undefined {
  if (process.env.VIDEOS_ENV && existsSync(process.env.VIDEOS_ENV)) return process.env.VIDEOS_ENV;
  for (let dir = dirname(process.cwd()); ; dir = dirname(dir)) {
    const candidate = join(dir, '.env');
    if (existsSync(candidate)) return candidate;
    if (dirname(dir) === dir) return undefined;
  }
}

const GENERAL_ENV = findGeneralEnv();
if (GENERAL_ENV) config({ path: GENERAL_ENV, quiet: true });

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta ${name} en el .env general (${GENERAL_ENV ?? FIXED})`);
  return v;
}
