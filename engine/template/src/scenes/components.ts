import type { SceneProps } from '../data/load';
import { Scene as intro } from './intro/Scene';
import { Scene as demo } from './demo/Scene';
import { Scene as close } from './close/Scene';

export const SCENE_COMPONENTS: Record<string, React.FC<SceneProps>> = {
  intro, demo, close,
};
