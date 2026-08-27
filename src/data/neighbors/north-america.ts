// GENERATED FIXTURE. Do not hand-edit adjacency.
// Canonical source: NORTH_AMERICA_LAND_ADJACENCY emitted by the production topology generator.
// Regenerate with: npm run maps:generate

export const NORTH_AMERICA_LAND_ADJACENCY: Readonly<Record<string, readonly string[]>> = {
  CAN: ['USA'],
  USA: ['CAN', 'MEX'],
  BLZ: ['GTM', 'MEX'],
  CRI: ['NIC', 'PAN'],
  SLV: ['GTM', 'HND'],
  GTM: ['BLZ', 'HND', 'MEX', 'SLV'],
  HND: ['GTM', 'NIC', 'SLV'],
  MEX: ['BLZ', 'GTM', 'USA'],
  NIC: ['CRI', 'HND'],
  PAN: ['COL', 'CRI'],
  ATG: [],
  BHS: [],
  BRB: [],
  CUB: [],
  DMA: [],
  DOM: ['HTI'],
  GRD: [],
  HTI: ['DOM'],
  JAM: [],
  KNA: [],
  LCA: [],
  VCT: [],
  TTO: [],
};

export const NORTH_AMERICA_ZERO_LAND_NEIGHBOR_IDS = Object.freeze(
  Object.keys(NORTH_AMERICA_LAND_ADJACENCY).filter((countryId) => NORTH_AMERICA_LAND_ADJACENCY[countryId].length === 0),
);

// Known adjacency makes a country learnable, including when the truthful
// answer is the empty set. Absent adjacency means unimplemented curriculum.
export const NORTH_AMERICA_STANDARD_NEIGHBOR_TARGET_IDS = Object.freeze(Object.keys(NORTH_AMERICA_LAND_ADJACENCY));
