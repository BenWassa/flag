import type { MapCountryCallout, MapRegionAsset } from '../../domain/map-models.js';

/**
 * Phone-scale callouts for West Africa countries whose true polygon/locator is
 * too small or narrow for reliable touch selection at the default continent
 * scale. Targets are deliberately placed in nearby ocean/neutral space and are
 * spaced so their ~44px effective hit circles do not overlap one another.
 */
const WEST_AFRICA_CALLOUTS: Readonly<Record<string, MapCountryCallout>> = {
  // Cabo Verde: retain the real island locator; callout sits north-west at sea.
  CPV: {
    anchor: { cx: 37.5, cy: 221.5 },
    target: { cx: 32, cy: 185, r: 12 },
  },
  // The Gambia: Atlantic target avoids a precision tap inside the Senegal strip.
  GMB: {
    anchor: { cx: 98.2, cy: 244.0 },
    target: { cx: 65, cy: 235, r: 12 },
  },
  // Guinea-Bissau: move the touch surface south-west into the Atlantic.
  GNB: {
    anchor: { cx: 104, cy: 260 },
    target: { cx: 70, cy: 285, r: 12 },
  },
  // Sierra Leone: compact phone-scale polygon; callout sits off the coast.
  SLE: {
    anchor: { cx: 140, cy: 300 },
    target: { cx: 116, cy: 330, r: 12 },
  },
  // Togo: narrow north-south state; callout sits in the Gulf of Guinea.
  TGO: {
    anchor: { cx: 270.0, cy: 314.5 },
    target: { cx: 250, cy: 350, r: 12 },
  },
  // Benin: likewise narrow; separate Gulf target avoids Togo/Nigeria ambiguity.
  BEN: {
    anchor: { cx: 276, cy: 312 },
    target: { cx: 285, cy: 365, r: 12 },
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
        // Visible cartographic callouts replace invisible enlarged targets for
        // phone-small pilot countries: the learner can see why the target exists.
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
