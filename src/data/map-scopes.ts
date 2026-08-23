import type { ContinentId, StudyScope } from '../domain/models.js';

export interface MapScopeConfig {
  scope: StudyScope;
  continentId: ContinentId;
  countryIds: readonly string[];
  /** Optional tuned label anchor for the compact launcher map, in percentages. */
  launcherLabel?: Readonly<{ left: number; top: number }>;
}

export interface MapContinentConfig {
  continentId: ContinentId;
  scope: StudyScope;
  countryIds: readonly string[];
  regions: readonly MapScopeConfig[];
  /** Keyed canonical countries rendered as non-scoring context in this continent asset. */
  contextCountryIds?: readonly string[];
}

export const NORTH_AFRICA_MAP_COUNTRY_IDS = [
  'DZA', 'EGY', 'LBY', 'MAR', 'SDN', 'TUN',
] as const;

export const WEST_AFRICA_MAP_COUNTRY_IDS = [
  'BEN', 'BFA', 'CPV', 'CIV', 'GMB', 'GHA', 'GIN', 'GNB',
  'LBR', 'MLI', 'MRT', 'NER', 'NGA', 'SEN', 'SLE', 'TGO',
] as const;

export const CENTRAL_AFRICA_MAP_COUNTRY_IDS = [
  'AGO', 'CMR', 'CAF', 'TCD', 'COD', 'GNQ', 'GAB', 'COG', 'STP',
] as const;

export const EAST_AFRICA_MAP_COUNTRY_IDS = [
  'BDI', 'COM', 'DJI', 'ERI', 'ETH', 'KEN', 'MDG', 'MWI', 'MUS',
  'MOZ', 'RWA', 'SYC', 'SOM', 'SSD', 'TZA', 'UGA', 'ZMB', 'ZWE',
] as const;

export const SOUTHERN_AFRICA_MAP_COUNTRY_IDS = [
  'BWA', 'SWZ', 'LSO', 'NAM', 'ZAF',
] as const;

export const AFRICA_MAP_COUNTRY_IDS = [
  ...NORTH_AFRICA_MAP_COUNTRY_IDS,
  ...WEST_AFRICA_MAP_COUNTRY_IDS,
  ...CENTRAL_AFRICA_MAP_COUNTRY_IDS,
  ...EAST_AFRICA_MAP_COUNTRY_IDS,
  ...SOUTHERN_AFRICA_MAP_COUNTRY_IDS,
] as const;

export const AFRICA_MAP_SCOPE: StudyScope = {
  kind: 'continent',
  id: 'africa',
  label: 'Africa',
};

export const AFRICA_MAP_REGION_CONFIGS: readonly MapScopeConfig[] = [
  {
    scope: { kind: 'region', id: 'north-africa', label: 'North Africa' },
    continentId: 'africa',
    countryIds: NORTH_AFRICA_MAP_COUNTRY_IDS,
    launcherLabel: { left: 49, top: 18 },
  },
  {
    scope: { kind: 'region', id: 'west-africa', label: 'West Africa' },
    continentId: 'africa',
    countryIds: WEST_AFRICA_MAP_COUNTRY_IDS,
    launcherLabel: { left: 23, top: 35 },
  },
  {
    scope: { kind: 'region', id: 'central-africa', label: 'Central Africa' },
    continentId: 'africa',
    countryIds: CENTRAL_AFRICA_MAP_COUNTRY_IDS,
    launcherLabel: { left: 45, top: 58 },
  },
  {
    scope: { kind: 'region', id: 'east-africa', label: 'East Africa' },
    continentId: 'africa',
    countryIds: EAST_AFRICA_MAP_COUNTRY_IDS,
    launcherLabel: { left: 77, top: 46 },
  },
  {
    scope: { kind: 'region', id: 'southern-africa', label: 'Southern Africa' },
    continentId: 'africa',
    countryIds: SOUTHERN_AFRICA_MAP_COUNTRY_IDS,
    launcherLabel: { left: 55, top: 82 },
  },
];

export const AFRICA_MAP_CONFIG: MapScopeConfig = {
  scope: AFRICA_MAP_SCOPE,
  continentId: 'africa',
  countryIds: AFRICA_MAP_COUNTRY_IDS,
};

export const AFRICA_MAP_SCOPE_CONFIGS: readonly MapScopeConfig[] = [
  AFRICA_MAP_CONFIG,
  ...AFRICA_MAP_REGION_CONFIGS,
];

export const AFRICA_MAP_CONTINENT_CONFIG: MapContinentConfig = {
  continentId: 'africa',
  scope: AFRICA_MAP_SCOPE,
  countryIds: AFRICA_MAP_COUNTRY_IDS,
  regions: AFRICA_MAP_REGION_CONFIGS,
  contextCountryIds: [],
};

export const ANDEAN_MAP_COUNTRY_IDS = [
  'BOL', 'COL', 'ECU', 'PER', 'VEN',
] as const;

export const ATLANTIC_SOUTH_AMERICA_MAP_COUNTRY_IDS = [
  'BRA', 'GUY', 'SUR',
] as const;

export const SOUTHERN_CONE_MAP_COUNTRY_IDS = [
  'ARG', 'CHL', 'PRY', 'URY',
] as const;

export const SOUTH_AMERICA_MAP_COUNTRY_IDS = [
  ...ANDEAN_MAP_COUNTRY_IDS,
  ...ATLANTIC_SOUTH_AMERICA_MAP_COUNTRY_IDS,
  ...SOUTHERN_CONE_MAP_COUNTRY_IDS,
] as const;

export const SOUTH_AMERICA_MAP_SCOPE: StudyScope = {
  kind: 'continent',
  id: 'south-america',
  label: 'South America',
};

export const SOUTH_AMERICA_MAP_REGION_CONFIGS: readonly MapScopeConfig[] = [
  {
    scope: { kind: 'region', id: 'andean', label: 'Andean' },
    continentId: 'south-america',
    countryIds: ANDEAN_MAP_COUNTRY_IDS,
    launcherLabel: { left: 28, top: 39 },
  },
  {
    scope: { kind: 'region', id: 'atlantic-south-america', label: 'Atlantic' },
    continentId: 'south-america',
    countryIds: ATLANTIC_SOUTH_AMERICA_MAP_COUNTRY_IDS,
    launcherLabel: { left: 63, top: 38 },
  },
  {
    scope: { kind: 'region', id: 'southern-cone', label: 'Southern Cone' },
    continentId: 'south-america',
    countryIds: SOUTHERN_CONE_MAP_COUNTRY_IDS,
    launcherLabel: { left: 43, top: 76 },
  },
];

export const SOUTH_AMERICA_MAP_CONFIG: MapScopeConfig = {
  scope: SOUTH_AMERICA_MAP_SCOPE,
  continentId: 'south-america',
  countryIds: SOUTH_AMERICA_MAP_COUNTRY_IDS,
};

export const SOUTH_AMERICA_MAP_CONTINENT_CONFIG: MapContinentConfig = {
  continentId: 'south-america',
  scope: SOUTH_AMERICA_MAP_SCOPE,
  countryIds: SOUTH_AMERICA_MAP_COUNTRY_IDS,
  regions: SOUTH_AMERICA_MAP_REGION_CONFIGS,
  contextCountryIds: ['PAN', 'FRA'],
};

/**
 * Generated geography coverage is registered by continent. New continent work
 * extends this registry rather than adding parallel lookup functions.
 */
export const MAP_CONTINENT_CONFIGS: readonly MapContinentConfig[] = Object.freeze([
  AFRICA_MAP_CONTINENT_CONFIG,
  SOUTH_AMERICA_MAP_CONTINENT_CONFIG,
]);

const MAP_CONTINENT_BY_ID = new Map(
  MAP_CONTINENT_CONFIGS.map((config) => [config.continentId, config]),
);
const MAP_SCOPE_BY_ID = new Map<string, MapScopeConfig>(
  MAP_CONTINENT_CONFIGS.flatMap((continent) => [
    [continent.scope.id as string, {
      scope: continent.scope,
      continentId: continent.continentId,
      countryIds: continent.countryIds,
    }] as const,
    ...continent.regions.map((region) => [region.scope.id as string, region] as const),
  ]),
);

export function getMapScopeConfig(scopeId: string): MapScopeConfig | undefined {
  return MAP_SCOPE_BY_ID.get(scopeId);
}

export function getMapContinentConfig(continentId: ContinentId): MapContinentConfig | undefined {
  return MAP_CONTINENT_BY_ID.get(continentId);
}

export function getMapContinentConfigForScope(scopeId: string): MapContinentConfig | undefined {
  const scope = getMapScopeConfig(scopeId);
  return scope ? getMapContinentConfig(scope.continentId) : undefined;
}

export function generatedMapCountryIds(): readonly string[] {
  return MAP_CONTINENT_CONFIGS.flatMap((continent) => [...continent.countryIds]);
}

/** Compatibility seam for Africa-specific verification while callers migrate. */
export function getAfricaMapScopeConfig(scopeId: string): MapScopeConfig | undefined {
  const config = getMapScopeConfig(scopeId);
  return config?.continentId === 'africa' ? config : undefined;
}
