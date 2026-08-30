/**
 * Issue #119 — lazy access to generated spherical geography.
 *
 * Mirrors the loading contract `src/data/maps/index.ts` already uses for the
 * projected 2D assets: one dynamic import per continent so the bundler emits a
 * separate chunk and a learner only downloads the detail for geography they
 * actually opened. The world asset is the only one on the spatial entry path.
 */

import type { ContinentId } from '../../domain/models.js';
import { decodeGlobeAsset, type EncodedGlobeAsset, type GlobeAsset } from '../../spatial/globe-asset.js';

export type GlobeLodId = 'world' | ContinentId;

const loaders: Record<GlobeLodId, () => Promise<EncodedGlobeAsset>> = {
  world: async () => (await import('./world.js')).WORLD_GLOBE_ASSET,
  africa: async () => (await import('./africa.js')).AFRICA_GLOBE_ASSET,
  asia: async () => (await import('./asia.js')).ASIA_GLOBE_ASSET,
  europe: async () => (await import('./europe.js')).EUROPE_GLOBE_ASSET,
  'north-america': async () => (await import('./north-america.js')).NORTH_AMERICA_GLOBE_ASSET,
  'south-america': async () => (await import('./south-america.js')).SOUTH_AMERICA_GLOBE_ASSET,
  oceania: async () => (await import('./oceania.js')).OCEANIA_GLOBE_ASSET,
};

const decoded = new Map<GlobeLodId, Promise<GlobeAsset>>();

export function loadGlobeAsset(lod: GlobeLodId): Promise<GlobeAsset> {
  const cached = decoded.get(lod);
  if (cached) return cached;
  const pending = loaders[lod]().then(decodeGlobeAsset);
  decoded.set(lod, pending);
  // A failed download must not poison the cache: the next navigation to the
  // same continent should be allowed to try again.
  void pending.catch(() => decoded.delete(lod));
  return pending;
}

/** Test seam. Production never calls this. */
export function resetGlobeAssetCache(): void {
  decoded.clear();
}
