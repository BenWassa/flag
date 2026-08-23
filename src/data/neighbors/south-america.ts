// GENERATED FIXTURE. Do not hand-edit adjacency.
// Canonical source: SOUTH_AMERICA_LAND_ADJACENCY emitted by the production topology generator.
// Regenerate with: npm run maps:generate

export const SOUTH_AMERICA_LAND_ADJACENCY: Readonly<Record<string, readonly string[]>> = {
  BOL: ['ARG', 'BRA', 'CHL', 'PER', 'PRY'],
  COL: ['BRA', 'ECU', 'PAN', 'PER', 'VEN'],
  ECU: ['COL', 'PER'],
  PER: ['BOL', 'BRA', 'CHL', 'COL', 'ECU'],
  VEN: ['BRA', 'COL', 'GUY'],
  BRA: ['ARG', 'BOL', 'COL', 'FRA', 'GUY', 'PER', 'PRY', 'SUR', 'URY', 'VEN'],
  GUY: ['BRA', 'SUR', 'VEN'],
  SUR: ['BRA', 'FRA', 'GUY'],
  ARG: ['BOL', 'BRA', 'CHL', 'PRY', 'URY'],
  CHL: ['ARG', 'BOL', 'PER'],
  PRY: ['ARG', 'BOL', 'BRA'],
  URY: ['ARG', 'BRA'],
};

export const SOUTH_AMERICA_ZERO_LAND_NEIGHBOR_IDS = Object.freeze(
  Object.keys(SOUTH_AMERICA_LAND_ADJACENCY).filter((countryId) => SOUTH_AMERICA_LAND_ADJACENCY[countryId].length === 0),
);

// Known adjacency makes a country learnable, including when the truthful
// answer is the empty set. Absent adjacency means unimplemented curriculum.
export const SOUTH_AMERICA_STANDARD_NEIGHBOR_TARGET_IDS = Object.freeze(Object.keys(SOUTH_AMERICA_LAND_ADJACENCY));
