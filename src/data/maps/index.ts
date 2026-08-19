import type { MapCountryCallout, MapRegionAsset } from '../../domain/map-models.js';

const WEST_AFRICA_CALLOUTS: Readonly<Record<string, MapCountryCallout>> = {
  // The Gambia: external Atlantic target avoids forcing a precise tap inside
  // the narrow Senegal-enclosed strip while the leader preserves true location.
  GMB: {
    anchor: { cx: 98.2, cy: 244.0 },
    target: { cx: 68, cy: 244, r: 12 },
  },
  // Togo: place the touch target in the Gulf of Guinea, connected to the coast.
  TGO: {
    anchor: { cx: 270.0, cy: 314.5 },
    target: { cx: 270, cy: 347, r: 12 },
  },
  // Cabo Verde: keep the real island locator visible and give it a nearby
  // external target rather than pretending the islands are physically larger.
  CPV: {
    anchor: { cx: 37.5, cy: 221.5 },
    target: { cx: 58, cy: 204, r: 12 },
  },
};

function applyWestAfricaGameplayMetadata(asset: MapRegionAsset): MapRegionAsset {
  return {
    ...asset,
    countries: asset.countries.map((country) => {
      const callout = WEST_AFRICA_CALLOUTS[country.countryId];
      if (!callout) return country;
      return {
        ...country,
        callout,
        // The explicit visible callout replaces the old invisible oversized hit
        // assist for these tiny/narrow states.
        hitAssist: undefined,
      };
    }),
  };
}

export async function loadMapAsset(scopeId: string): Promise<MapRegionAsset | null> {
  if (scopeId !== 'west-africa') return null;
  const module = await import('./west-africa.js');
  return applyWestAfricaGameplayMetadata(module.WEST_AFRICA_MAP);
}
