import { testGuides } from './tests';
import { trainingGuides } from './training';
import { guidePath, type Guide } from './types';

export { testGuides, trainingGuides, guidePath };
export const guides: Guide[] = [...testGuides, ...trainingGuides];

/** Look up a guide by its 'fitness-tests/army-aft' style key. */
export function guideByKey(key: string): Guide | undefined {
  const [section, slug] = key.split('/');
  const kind = section === 'fitness-tests' ? 'test' : 'training';
  return guides.find((g) => g.kind === kind && g.slug === slug);
}
