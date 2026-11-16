import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

export async function probeDurationSec(file: string): Promise<number> {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]);
  const d = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(d)) throw new Error(`ffprobe no pudo leer la duración de ${file}`);
  return d;
}
