// GENERATED FIXTURE. Do not hand-edit adjacency.
// Canonical source: ASIA_LAND_ADJACENCY emitted by the production topology generator.
// Regenerate with: npm run maps:generate

export const ASIA_LAND_ADJACENCY: Readonly<Record<string, readonly string[]>> = {
  KAZ: ['CHN', 'KGZ', 'RUS', 'TKM', 'UZB'],
  KGZ: ['CHN', 'KAZ', 'TJK', 'UZB'],
  TJK: ['AFG', 'CHN', 'KGZ', 'UZB'],
  TKM: ['AFG', 'IRN', 'KAZ', 'UZB'],
  UZB: ['AFG', 'KAZ', 'KGZ', 'TJK', 'TKM'],
  CHN: ['AFG', 'BTN', 'IND', 'KAZ', 'KGZ', 'LAO', 'MMR', 'MNG', 'NPL', 'PAK', 'PRK', 'RUS', 'TJK', 'VNM'],
  JPN: [],
  MNG: ['CHN', 'RUS'],
  PRK: ['CHN', 'KOR', 'RUS'],
  KOR: ['PRK'],
  BRN: ['MYS'],
  KHM: ['LAO', 'THA', 'VNM'],
  IDN: ['MYS', 'PNG', 'TLS'],
  LAO: ['CHN', 'KHM', 'MMR', 'THA', 'VNM'],
  MYS: ['BRN', 'IDN', 'THA'],
  MMR: ['BGD', 'CHN', 'IND', 'LAO', 'THA'],
  PHL: [],
  SGP: [],
  THA: ['KHM', 'LAO', 'MMR', 'MYS'],
  TLS: ['IDN'],
  VNM: ['CHN', 'KHM', 'LAO'],
  AFG: ['CHN', 'IRN', 'PAK', 'TJK', 'TKM', 'UZB'],
  BGD: ['IND', 'MMR'],
  BTN: ['CHN', 'IND'],
  IND: ['BGD', 'BTN', 'CHN', 'MMR', 'NPL', 'PAK'],
  MDV: [],
  NPL: ['CHN', 'IND'],
  PAK: ['AFG', 'CHN', 'IND', 'IRN'],
  LKA: [],
  ARM: ['AZE', 'GEO', 'IRN', 'TUR'],
  AZE: ['ARM', 'GEO', 'IRN', 'RUS', 'TUR'],
  BHR: [],
  CYP: [],
  GEO: ['ARM', 'AZE', 'RUS', 'TUR'],
  IRN: ['AFG', 'ARM', 'AZE', 'IRQ', 'PAK', 'TKM', 'TUR'],
  IRQ: ['IRN', 'JOR', 'KWT', 'SAU', 'SYR', 'TUR'],
  ISR: ['EGY', 'JOR', 'LBN', 'PSE', 'SYR'],
  JOR: ['IRQ', 'ISR', 'PSE', 'SAU', 'SYR'],
  KWT: ['IRQ', 'SAU'],
  LBN: ['ISR', 'SYR'],
  OMN: ['ARE', 'SAU', 'YEM'],
  PSE: ['EGY', 'ISR', 'JOR'],
  QAT: ['SAU'],
  SAU: ['ARE', 'IRQ', 'JOR', 'KWT', 'OMN', 'QAT', 'YEM'],
  SYR: ['IRQ', 'ISR', 'JOR', 'LBN', 'TUR'],
  TUR: ['ARM', 'AZE', 'BGR', 'GEO', 'GRC', 'IRN', 'IRQ', 'SYR'],
  ARE: ['OMN', 'SAU'],
  YEM: ['OMN', 'SAU'],
  EGY: ['ISR', 'LBY', 'PSE', 'SDN'],
};

export const ASIA_ZERO_LAND_NEIGHBOR_IDS = Object.freeze(
  Object.keys(ASIA_LAND_ADJACENCY).filter((countryId) => ASIA_LAND_ADJACENCY[countryId].length === 0),
);

// Known adjacency makes a country learnable, including when the truthful
// answer is the empty set. Absent adjacency means unimplemented curriculum.
export const ASIA_STANDARD_NEIGHBOR_TARGET_IDS = Object.freeze(Object.keys(ASIA_LAND_ADJACENCY));
