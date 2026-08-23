import type { MapCountryGeometry, MapViewportFocus, MapWaterLayers } from '../../domain/map-models.js';

export const SOUTH_AMERICA_VIEWBOX: string;
export const SOUTH_AMERICA_CARTOGRAPHY_PROVENANCE: unknown;
export const SOUTH_AMERICA_GEOMETRY: Readonly<Record<string, MapCountryGeometry>>;
export const SOUTH_AMERICA_EXTRA_CONTEXT_PATHS: readonly string[];
export const SOUTH_AMERICA_SHARED_BOUNDARY_PATHS: readonly string[];
export const SOUTH_AMERICA_COASTLINE_PATHS: readonly string[];
export const SOUTH_AMERICA_WATER: Readonly<MapWaterLayers>;
export const SOUTH_AMERICA_SCOPE_FOCUS: Readonly<Record<string, MapViewportFocus>>;
export const SOUTH_AMERICA_LAND_ADJACENCY: Readonly<Record<string, readonly string[]>>;
