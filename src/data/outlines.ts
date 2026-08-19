import type { OutlineAsset } from '../domain/outline.js';
import { buildOutlineAsset } from '../domain/outline.js';
import { loadMapAsset } from './maps/index.js';

/**
 * Outlines consume the production cartography asset instead of owning geometry.
 * The map loader already provides the requested scope plus Africa context from
 * the canonical generated Natural Earth module; normalization happens only
 * after that source-of-truth geometry has been loaded.
 */
export async function loadOutlineAsset(scopeId: string): Promise<OutlineAsset | null> {
  const mapAsset = await loadMapAsset(scopeId);
  if (!mapAsset) return null;
  return buildOutlineAsset(mapAsset.scope, mapAsset.countries, mapAsset.contextCountries ?? []);
}
