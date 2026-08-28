// GENERATED FIXTURE. Do not hand-edit adjacency.
// Canonical source: OCEANIA_LAND_ADJACENCY emitted by the production topology generator.
// Regenerate with: npm run maps:generate

export const OCEANIA_LAND_ADJACENCY: Readonly<Record<string, readonly string[]>> = {
  AUS: [],
  NZL: [],
  FJI: [],
  PNG: ['IDN'],
  SLB: [],
  VUT: [],
  KIR: [],
  MHL: [],
  FSM: [],
  NRU: [],
  PLW: [],
  WSM: [],
  TON: [],
  TUV: [],
};

export const OCEANIA_ZERO_LAND_NEIGHBOR_IDS = Object.freeze(
  Object.keys(OCEANIA_LAND_ADJACENCY).filter((countryId) => OCEANIA_LAND_ADJACENCY[countryId].length === 0),
);

// Known adjacency makes a country learnable, including when the truthful
// answer is the empty set. Absent adjacency means unimplemented curriculum.
export const OCEANIA_STANDARD_NEIGHBOR_TARGET_IDS = Object.freeze(Object.keys(OCEANIA_LAND_ADJACENCY));
