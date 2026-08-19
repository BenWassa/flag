import type { MapRegionAsset } from '../../domain/map-models.js';

export async function loadMapAsset(scopeId: string): Promise<MapRegionAsset | null> {
  if (scopeId !== 'west-africa') return null;
  const module = await import('./west-africa.js');
  return module.WEST_AFRICA_MAP;
}
