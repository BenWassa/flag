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
  /** Canonical scored countries owned by the continent. */
  countryIds: readonly string[];
  /** Learner-facing map scopes. These may cross canonical continent boundaries. */
  regions: readonly MapScopeConfig[];
  /** Keyed canonical countries rendered as non-scoring context in the parent asset. */
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

export const CENTRAL_ASIA_MAP_COUNTRY_IDS = [
  'KAZ', 'KGZ', 'TJK', 'TKM', 'UZB',
] as const;

export const EAST_ASIA_MAP_COUNTRY_IDS = [
  'CHN', 'JPN', 'MNG', 'PRK', 'KOR',
] as const;

export const SOUTHEAST_ASIA_MAP_COUNTRY_IDS = [
  'BRN', 'KHM', 'IDN', 'LAO', 'MYS', 'MMR', 'PHL', 'SGP', 'THA', 'TLS', 'VNM',
] as const;

export const SOUTH_ASIA_MAP_COUNTRY_IDS = [
  'AFG', 'BGD', 'BTN', 'IND', 'MDV', 'NPL', 'PAK', 'LKA',
] as const;

export const MIDDLE_EAST_MAP_COUNTRY_IDS = [
  'BHR', 'CYP', 'EGY', 'IRN', 'IRQ', 'ISR', 'JOR', 'KWT', 'LBN',
  'OMN', 'PSE', 'QAT', 'SAU', 'SYR', 'TUR', 'ARE', 'YEM',
] as const;

export const CAUCASUS_MAP_COUNTRY_IDS = ['ARM', 'AZE', 'GEO'] as const;

const CANONICAL_WEST_ASIA_MAP_COUNTRY_IDS = [
  'ARM', 'AZE', 'BHR', 'CYP', 'GEO', 'IRN', 'IRQ', 'ISR', 'JOR', 'KWT',
  'LBN', 'OMN', 'PSE', 'QAT', 'SAU', 'SYR', 'TUR', 'ARE', 'YEM',
] as const;

export const ASIA_MAP_COUNTRY_IDS = [
  ...CENTRAL_ASIA_MAP_COUNTRY_IDS,
  ...EAST_ASIA_MAP_COUNTRY_IDS,
  ...SOUTHEAST_ASIA_MAP_COUNTRY_IDS,
  ...SOUTH_ASIA_MAP_COUNTRY_IDS,
  ...CANONICAL_WEST_ASIA_MAP_COUNTRY_IDS,
] as const;

export const ASIA_MAP_SCOPE: StudyScope = {
  kind: 'continent',
  id: 'asia',
  label: 'Asia',
};

export const ASIA_MAP_REGION_CONFIGS: readonly MapScopeConfig[] = [
  {
    scope: { kind: 'region', id: 'central-asia', label: 'Central Asia' },
    continentId: 'asia',
    countryIds: CENTRAL_ASIA_MAP_COUNTRY_IDS,
    launcherLabel: { left: 43, top: 36 },
  },
  {
    scope: { kind: 'region', id: 'east-asia', label: 'East Asia' },
    continentId: 'asia',
    countryIds: EAST_ASIA_MAP_COUNTRY_IDS,
    launcherLabel: { left: 75, top: 38 },
  },
  {
    scope: { kind: 'region', id: 'southeast-asia', label: 'Southeast Asia' },
    continentId: 'asia',
    countryIds: SOUTHEAST_ASIA_MAP_COUNTRY_IDS,
    launcherLabel: { left: 73, top: 72 },
  },
  {
    scope: { kind: 'region', id: 'south-asia', label: 'South Asia' },
    continentId: 'asia',
    countryIds: SOUTH_ASIA_MAP_COUNTRY_IDS,
    launcherLabel: { left: 51, top: 64 },
  },
  {
    scope: { kind: 'region', id: 'middle-east', label: 'Middle East' },
    continentId: 'asia',
    countryIds: MIDDLE_EAST_MAP_COUNTRY_IDS,
    launcherLabel: { left: 22, top: 57 },
  },
  {
    scope: { kind: 'region', id: 'caucasus', label: 'Caucasus' },
    continentId: 'asia',
    countryIds: CAUCASUS_MAP_COUNTRY_IDS,
    launcherLabel: { left: 28, top: 36 },
  },
];

export const ASIA_MAP_CONFIG: MapScopeConfig = {
  scope: ASIA_MAP_SCOPE,
  continentId: 'asia',
  countryIds: ASIA_MAP_COUNTRY_IDS,
};

export const ASIA_MAP_SCOPE_CONFIGS: readonly MapScopeConfig[] = [
  ASIA_MAP_CONFIG,
  ...ASIA_MAP_REGION_CONFIGS,
];

export const ASIA_MAP_CONTINENT_CONFIG: MapContinentConfig = {
  continentId: 'asia',
  scope: ASIA_MAP_SCOPE,
  countryIds: ASIA_MAP_COUNTRY_IDS,
  regions: ASIA_MAP_REGION_CONFIGS,
  // EGY is scored only when Middle East is active; RUS is orientation and
  // complete-neighbour context. Neither changes canonical continent ownership.
  contextCountryIds: ['EGY', 'RUS'],
};

/**
 * Generated geography coverage is registered by continent. New continent work
 * extends this registry rather than adding parallel lookup functions.
 */
export const MAP_CONTINENT_CONFIGS: readonly MapContinentConfig[] = Object.freeze([
  AFRICA_MAP_CONTINENT_CONFIG,
  ASIA_MAP_CONTINENT_CONFIG,
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
  return [...new Set(MAP_CONTINENT_CONFIGS.flatMap((continent) => [
    ...continent.countryIds,
    ...continent.regions.flatMap((region) => region.countryIds),
  ]))];
}

/** Compatibility seam for Africa-specific verification while callers migrate. */
export function getAfricaMapScopeConfig(scopeId: string): MapScopeConfig | undefined {
  const config = getMapScopeConfig(scopeId);
  return config?.continentId === 'africa' ? config : undefined;
}
