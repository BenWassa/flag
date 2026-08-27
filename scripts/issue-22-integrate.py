from pathlib import Path

# Shared map scopes: one North America membership source for Locations/Outlines/Neighbours.
p = Path('src/data/map-scopes.ts')
s = p.read_text()
anchor = """/**
 * Generated geography coverage is registered by continent. New continent work
 * extends this registry rather than adding parallel lookup functions.
 */
"""
if 'NORTH_AMERICA_MAP_CONTINENT_CONFIG' not in s:
    block = """export const NORTHERN_AMERICA_MAP_COUNTRY_IDS = ['CAN', 'USA'] as const;

export const CENTRAL_AMERICA_MAP_COUNTRY_IDS = [
  'BLZ', 'CRI', 'SLV', 'GTM', 'HND', 'MEX', 'NIC', 'PAN',
] as const;

export const CARIBBEAN_MAP_COUNTRY_IDS = [
  'ATG', 'BHS', 'BRB', 'CUB', 'DMA', 'DOM', 'GRD',
  'HTI', 'JAM', 'KNA', 'LCA', 'VCT', 'TTO',
] as const;

export const NORTH_AMERICA_MAP_COUNTRY_IDS = [
  ...NORTHERN_AMERICA_MAP_COUNTRY_IDS,
  ...CENTRAL_AMERICA_MAP_COUNTRY_IDS,
  ...CARIBBEAN_MAP_COUNTRY_IDS,
] as const;

export const NORTH_AMERICA_MAP_SCOPE: StudyScope = {
  kind: 'continent',
  id: 'north-america',
  label: 'North America',
};

export const NORTH_AMERICA_MAP_REGION_CONFIGS: readonly MapScopeConfig[] = [
  {
    scope: { kind: 'region', id: 'northern-america', label: 'Northern America' },
    continentId: 'north-america',
    countryIds: NORTHERN_AMERICA_MAP_COUNTRY_IDS,
    launcherLabel: { left: 43, top: 28 },
  },
  {
    scope: { kind: 'region', id: 'central-america', label: 'Central America' },
    continentId: 'north-america',
    countryIds: CENTRAL_AMERICA_MAP_COUNTRY_IDS,
    launcherLabel: { left: 39, top: 68 },
  },
  {
    scope: { kind: 'region', id: 'caribbean', label: 'Caribbean' },
    continentId: 'north-america',
    countryIds: CARIBBEAN_MAP_COUNTRY_IDS,
    launcherLabel: { left: 69, top: 67 },
  },
];

export const NORTH_AMERICA_MAP_CONFIG: MapScopeConfig = {
  scope: NORTH_AMERICA_MAP_SCOPE,
  continentId: 'north-america',
  countryIds: NORTH_AMERICA_MAP_COUNTRY_IDS,
};

export const NORTH_AMERICA_MAP_SCOPE_CONFIGS: readonly MapScopeConfig[] = [
  NORTH_AMERICA_MAP_CONFIG,
  ...NORTH_AMERICA_MAP_REGION_CONFIGS,
];

export const NORTH_AMERICA_MAP_CONTINENT_CONFIG: MapContinentConfig = {
  continentId: 'north-america',
  scope: NORTH_AMERICA_MAP_SCOPE,
  countryIds: NORTH_AMERICA_MAP_COUNTRY_IDS,
  regions: NORTH_AMERICA_MAP_REGION_CONFIGS,
  // COL/VEN preserve the southern mainland edge. FRA/NLD are clipped to their
  // Caribbean overseas geometry; none is learner-scored in North America.
  contextCountryIds: ['COL', 'VEN', 'FRA', 'NLD'],
};

"""
    if anchor not in s: raise SystemExit('map scope registry anchor missing')
    s = s.replace(anchor, block + anchor)
    s = s.replace("  ASIA_MAP_CONTINENT_CONFIG,\n]);", "  ASIA_MAP_CONTINENT_CONFIG,\n  NORTH_AMERICA_MAP_CONTINENT_CONFIG,\n]);")
p.write_text(s)

# Lazy map loader.
p = Path('src/data/maps/index.ts')
s = p.read_text()
if "'north-america': async () =>" not in s:
    anchor = """  asia: async () => {
    const data = await import('./asia.js');
    return {
      viewBox: data.ASIA_VIEWBOX,
      geometry: data.ASIA_GEOMETRY,
      contextPaths: data.ASIA_EXTRA_CONTEXT_PATHS,
      sharedBoundaryPaths: data.ASIA_SHARED_BOUNDARY_PATHS,
      coastlinePaths: data.ASIA_COASTLINE_PATHS,
      water: data.ASIA_WATER,
      scopeFocus: data.ASIA_SCOPE_FOCUS,
      insets: data.ASIA_INSETS,
    };
  },
"""
    addition = anchor + """  'north-america': async () => {
    const data = await import('./north-america.js');
    return {
      viewBox: data.NORTH_AMERICA_VIEWBOX,
      geometry: data.NORTH_AMERICA_GEOMETRY,
      contextPaths: data.NORTH_AMERICA_EXTRA_CONTEXT_PATHS,
      sharedBoundaryPaths: data.NORTH_AMERICA_SHARED_BOUNDARY_PATHS,
      coastlinePaths: data.NORTH_AMERICA_COASTLINE_PATHS,
      water: data.NORTH_AMERICA_WATER,
      scopeFocus: data.NORTH_AMERICA_SCOPE_FOCUS,
      insets: data.NORTH_AMERICA_INSETS,
    };
  },
"""
    if anchor not in s: raise SystemExit('map loader anchor missing')
    s = s.replace(anchor, addition)
p.write_text(s)

# Neighbour registry: generated topology fixture, including explicit empty sets.
p = Path('src/data/neighbors/index.ts')
s = p.read_text()
if "from './north-america.js'" not in s:
    anchor = """import {
  ASIA_LAND_ADJACENCY,
  ASIA_ZERO_LAND_NEIGHBOR_IDS,
} from './asia.js';
"""
    addition = anchor + """import {
  NORTH_AMERICA_LAND_ADJACENCY,
  NORTH_AMERICA_ZERO_LAND_NEIGHBOR_IDS,
} from './north-america.js';
"""
    if anchor not in s: raise SystemExit('neighbor import anchor missing')
    s = s.replace(anchor, addition)
    s = s.replace("  ASIA_ZERO_LAND_NEIGHBOR_IDS,\n};", "  ASIA_ZERO_LAND_NEIGHBOR_IDS,\n  NORTH_AMERICA_LAND_ADJACENCY,\n  NORTH_AMERICA_ZERO_LAND_NEIGHBOR_IDS,\n};")
    s = s.replace("""  asia: {
    continentId: 'asia',
    adjacency: ASIA_LAND_ADJACENCY,
    coverageExcludedIds: [],
  },
};
""", """  asia: {
    continentId: 'asia',
    adjacency: ASIA_LAND_ADJACENCY,
    coverageExcludedIds: [],
  },
  'north-america': {
    continentId: 'north-america',
    adjacency: NORTH_AMERICA_LAND_ADJACENCY,
    coverageExcludedIds: [],
  },
};
""")
p.write_text(s)
