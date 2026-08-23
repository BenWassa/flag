// GENERATED FIXTURE. Do not hand-edit adjacency.
// Canonical source: EUROPE_LAND_ADJACENCY emitted by the production topology generator.
// Regenerate with: npm run maps:generate

export const EUROPE_LAND_ADJACENCY: Readonly<Record<string, readonly string[]>> = {
  DNK: ['DEU'],
  EST: ['LVA', 'RUS'],
  FIN: ['NOR', 'RUS', 'SWE'],
  ISL: [],
  IRL: ['GBR'],
  LVA: ['BLR', 'EST', 'LTU', 'RUS'],
  LTU: ['BLR', 'LVA', 'POL', 'RUS'],
  NOR: ['FIN', 'RUS', 'SWE'],
  SWE: ['FIN', 'NOR'],
  GBR: ['IRL'],
  AUT: ['CHE', 'CZE', 'DEU', 'HUN', 'ITA', 'LIE', 'SVK', 'SVN'],
  BEL: ['DEU', 'FRA', 'LUX', 'NLD'],
  FRA: ['AND', 'BEL', 'BRA', 'CHE', 'DEU', 'ESP', 'ITA', 'LUX', 'MCO', 'SUR'],
  DEU: ['AUT', 'BEL', 'CHE', 'CZE', 'DNK', 'FRA', 'LUX', 'NLD', 'POL'],
  LIE: ['AUT', 'CHE'],
  LUX: ['BEL', 'DEU', 'FRA'],
  MCO: ['FRA'],
  NLD: ['BEL', 'DEU'],
  CHE: ['AUT', 'DEU', 'FRA', 'ITA', 'LIE'],
  BLR: ['LTU', 'LVA', 'POL', 'RUS', 'UKR'],
  BGR: ['GRC', 'MKD', 'ROU', 'SRB', 'TUR'],
  CZE: ['AUT', 'DEU', 'POL', 'SVK'],
  HUN: ['AUT', 'HRV', 'ROU', 'SRB', 'SVK', 'SVN', 'UKR'],
  MDA: ['ROU', 'UKR'],
  POL: ['BLR', 'CZE', 'DEU', 'LTU', 'RUS', 'SVK', 'UKR'],
  ROU: ['BGR', 'HUN', 'MDA', 'SRB', 'UKR'],
  RUS: ['AZE', 'BLR', 'CHN', 'EST', 'FIN', 'GEO', 'KAZ', 'LTU', 'LVA', 'MNG', 'NOR', 'POL', 'PRK', 'UKR'],
  SVK: ['AUT', 'CZE', 'HUN', 'POL', 'UKR'],
  UKR: ['BLR', 'HUN', 'MDA', 'POL', 'ROU', 'RUS', 'SVK'],
  ALB: ['GRC', 'MKD', 'MNE'],
  AND: ['ESP', 'FRA'],
  BIH: ['HRV', 'MNE', 'SRB'],
  HRV: ['BIH', 'HUN', 'MNE', 'SRB', 'SVN'],
  GRC: ['ALB', 'BGR', 'MKD', 'TUR'],
  ITA: ['AUT', 'CHE', 'FRA', 'SMR', 'SVN', 'VAT'],
  MLT: [],
  MNE: ['ALB', 'BIH', 'HRV', 'SRB'],
  MKD: ['ALB', 'BGR', 'GRC', 'SRB'],
  PRT: ['ESP'],
  SMR: ['ITA'],
  SRB: ['BGR', 'BIH', 'HRV', 'HUN', 'MKD', 'MNE', 'ROU'],
  SVN: ['AUT', 'HRV', 'HUN', 'ITA'],
  ESP: ['AND', 'FRA', 'MAR', 'PRT'],
  VAT: ['ITA'],
};

export const EUROPE_ZERO_LAND_NEIGHBOR_IDS = Object.freeze(
  Object.keys(EUROPE_LAND_ADJACENCY).filter((countryId) => EUROPE_LAND_ADJACENCY[countryId].length === 0),
);

// Known adjacency makes a country learnable, including when the truthful
// answer is the empty set. Absent adjacency means unimplemented curriculum.
export const EUROPE_STANDARD_NEIGHBOR_TARGET_IDS = Object.freeze(Object.keys(EUROPE_LAND_ADJACENCY));
