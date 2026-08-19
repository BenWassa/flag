import type { StudyScope } from '../domain/models.js';

export interface MapScopeConfig {
  scope: StudyScope;
  countryIds: readonly string[];
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
    countryIds: NORTH_AFRICA_MAP_COUNTRY_IDS,
  },
  {
    scope: { kind: 'region', id: 'west-africa', label: 'West Africa' },
    countryIds: WEST_AFRICA_MAP_COUNTRY_IDS,
  },
  {
    scope: { kind: 'region', id: 'central-africa', label: 'Central Africa' },
    countryIds: CENTRAL_AFRICA_MAP_COUNTRY_IDS,
  },
  {
    scope: { kind: 'region', id: 'east-africa', label: 'East Africa' },
    countryIds: EAST_AFRICA_MAP_COUNTRY_IDS,
  },
  {
    scope: { kind: 'region', id: 'southern-africa', label: 'Southern Africa' },
    countryIds: SOUTHERN_AFRICA_MAP_COUNTRY_IDS,
  },
];

export const AFRICA_MAP_CONFIG: MapScopeConfig = {
  scope: AFRICA_MAP_SCOPE,
  countryIds: AFRICA_MAP_COUNTRY_IDS,
};

export const AFRICA_MAP_SCOPE_CONFIGS: readonly MapScopeConfig[] = [
  AFRICA_MAP_CONFIG,
  ...AFRICA_MAP_REGION_CONFIGS,
];

export function getAfricaMapScopeConfig(scopeId: string): MapScopeConfig | undefined {
  return AFRICA_MAP_SCOPE_CONFIGS.find((config) => config.scope.id === scopeId);
}
