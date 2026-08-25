import type { ContinentId } from '../../../domain/models.js';
import africa from './africa.png';
import asia from './asia.png';
import europe from './europe.png';
import northAmerica from './north-america.png';
import oceania from './oceania.png';
import southAmerica from './south-america.png';

/**
 * Earned continent-crest artwork (#34). Keyed by the canonical ContinentId so
 * an unsupported continent simply has no entry rather than a placeholder.
 */
export const CONTINENT_TROPHY_IMAGES: Partial<Record<ContinentId, string>> = {
  africa,
  asia,
  europe,
  'north-america': northAmerica,
  oceania,
  'south-america': southAmerica,
};
