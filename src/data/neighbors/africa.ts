// GENERATED FIXTURE. Do not hand-edit adjacency.
// Canonical source: AFRICA_LAND_ADJACENCY emitted by scripts/generate-maps.mjs from the Issue #9 topology.
// Regenerate with: npm run maps:generate

export const AFRICA_LAND_ADJACENCY: Readonly<Record<string, readonly string[]>> = {
  DZA: ['LBY', 'MAR', 'MLI', 'MRT', 'NER', 'TUN'],
  EGY: ['LBY', 'SDN'],
  LBY: ['DZA', 'EGY', 'NER', 'SDN', 'TCD', 'TUN'],
  MAR: ['DZA'],
  SDN: ['CAF', 'EGY', 'ERI', 'ETH', 'LBY', 'SSD', 'TCD'],
  TUN: ['DZA', 'LBY'],
  BEN: ['BFA', 'NER', 'NGA', 'TGO'],
  BFA: ['BEN', 'CIV', 'GHA', 'MLI', 'NER', 'TGO'],
  CPV: [],
  CIV: ['BFA', 'GHA', 'GIN', 'LBR', 'MLI'],
  GMB: ['SEN'],
  GHA: ['BFA', 'CIV', 'TGO'],
  GIN: ['CIV', 'GNB', 'LBR', 'MLI', 'SEN', 'SLE'],
  GNB: ['GIN', 'SEN'],
  LBR: ['CIV', 'GIN', 'SLE'],
  MLI: ['BFA', 'CIV', 'DZA', 'GIN', 'MRT', 'NER', 'SEN'],
  MRT: ['DZA', 'MLI', 'SEN'],
  NER: ['BEN', 'BFA', 'DZA', 'LBY', 'MLI', 'NGA', 'TCD'],
  NGA: ['BEN', 'CMR', 'NER', 'TCD'],
  SEN: ['GIN', 'GMB', 'GNB', 'MLI', 'MRT'],
  SLE: ['GIN', 'LBR'],
  TGO: ['BEN', 'BFA', 'GHA'],
  AGO: ['COD', 'COG', 'NAM', 'ZMB'],
  CMR: ['CAF', 'COG', 'GAB', 'GNQ', 'NGA', 'TCD'],
  CAF: ['CMR', 'COD', 'COG', 'SDN', 'SSD', 'TCD'],
  TCD: ['CAF', 'CMR', 'LBY', 'NER', 'NGA', 'SDN'],
  COD: ['AGO', 'BDI', 'CAF', 'COG', 'RWA', 'SSD', 'TZA', 'UGA', 'ZMB'],
  GNQ: ['CMR', 'GAB'],
  GAB: ['CMR', 'COG', 'GNQ'],
  COG: ['AGO', 'CAF', 'CMR', 'COD', 'GAB'],
  STP: [],
  BDI: ['COD', 'RWA', 'TZA'],
  COM: [],
  DJI: ['ERI', 'ETH', 'SOM'],
  ERI: ['DJI', 'ETH', 'SDN'],
  ETH: ['DJI', 'ERI', 'KEN', 'SDN', 'SOM', 'SSD'],
  KEN: ['ETH', 'SOM', 'SSD', 'TZA', 'UGA'],
  MDG: [],
  MWI: ['MOZ', 'TZA', 'ZMB'],
  MUS: [],
  MOZ: ['MWI', 'SWZ', 'TZA', 'ZAF', 'ZMB', 'ZWE'],
  RWA: ['BDI', 'COD', 'TZA', 'UGA'],
  SYC: [],
  SOM: ['DJI', 'ETH', 'KEN'],
  SSD: ['CAF', 'COD', 'ETH', 'KEN', 'SDN', 'UGA'],
  TZA: ['BDI', 'COD', 'KEN', 'MOZ', 'MWI', 'RWA', 'UGA', 'ZMB'],
  UGA: ['COD', 'KEN', 'RWA', 'SSD', 'TZA'],
  ZMB: ['AGO', 'COD', 'MOZ', 'MWI', 'NAM', 'TZA', 'ZWE'],
  ZWE: ['BWA', 'MOZ', 'ZAF', 'ZMB'],
  BWA: ['NAM', 'ZAF', 'ZWE'],
  SWZ: ['MOZ', 'ZAF'],
  LSO: ['ZAF'],
  NAM: ['AGO', 'BWA', 'ZAF', 'ZMB'],
  ZAF: ['BWA', 'LSO', 'MOZ', 'NAM', 'SWZ', 'ZWE'],
};

export const AFRICA_ZERO_LAND_NEIGHBOR_IDS = Object.freeze(
  Object.keys(AFRICA_LAND_ADJACENCY).filter((countryId) => AFRICA_LAND_ADJACENCY[countryId].length === 0),
);

// Known adjacency makes a country learnable, including when the truthful
// answer is the empty set. Absent adjacency means unimplemented curriculum.
export const AFRICA_STANDARD_NEIGHBOR_TARGET_IDS = Object.freeze(Object.keys(AFRICA_LAND_ADJACENCY));
