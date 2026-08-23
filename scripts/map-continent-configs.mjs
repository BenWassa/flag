export const MAP_CANVAS = Object.freeze({
  width: 835,
  height: 723,
  padding: 22,
  quantization: 100000,
  simplificationQuantile: 0.72,
  pathDigits: 2,
});

export const AFRICA_MAP_GENERATION_CONFIG = Object.freeze({
  id: 'africa',
  displayName: 'Africa',
  sourceContinent: 'Africa',
  exportPrefix: 'AFRICA',
  outputFilename: 'africa.ts',
  provenanceFilename: 'cartography-provenance.json',
  expectedCountryCount: 54,
  regionIds: Object.freeze([
    'north-africa',
    'west-africa',
    'central-africa',
    'east-africa',
    'southern-africa',
  ]),
  islandLocatorIds: Object.freeze(['CPV', 'STP', 'COM', 'MUS', 'SYC']),
  callouts: Object.freeze({
    GMB: Object.freeze({ targetDx: -18, targetDy: -2, radius: 7 }),
    TGO: Object.freeze({ targetDx: 14, targetDy: 12, radius: 7 }),
  }),
  lakes: Object.freeze([
    Object.freeze({ name: 'Lake Victoria', pattern: 'victoria', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Tanganyika', pattern: 'tanganyika', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Malawi', pattern: 'malawi', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Chad', pattern: 'chad', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Turkana', pattern: 'turkana', flags: 'i', required: false }),
    Object.freeze({ name: 'Lake Albert', pattern: 'albert', flags: 'i', required: false }),
    Object.freeze({ name: 'Lake Kivu', pattern: 'kivu', flags: 'i', required: false }),
    Object.freeze({ name: 'Lake Mweru', pattern: 'mweru', flags: 'i', required: false }),
    Object.freeze({ name: 'Lake Tana', pattern: 'tana', flags: 'i', required: false }),
    Object.freeze({ name: 'Lake Kariba', pattern: 'kariba', flags: 'i', required: false }),
    Object.freeze({ name: 'Lake Volta', pattern: 'volta', flags: 'i', required: false }),
    Object.freeze({ name: 'Lake Nasser', pattern: 'nasser', flags: 'i', required: false }),
  ]),
  localContextCountryIds: Object.freeze([]),
  localContextBounds: null,
  adjacencyMode: 'local',
  policy: 'africa-v1',
  boundaryPolicy: Object.freeze({
    scoredCountries: 54,
    somaliland: 'merged into canonical SOM geometry and adjacency',
    westernSahara: 'non-scoring context',
    birTawil: 'non-scoring context; not merged into EGY or SDN',
    lakeBoundaries: 'lakes are visual physical context only and do not alter political adjacency',
  }),
});

export const ASIA_MAP_GENERATION_CONFIG = Object.freeze({
  id: 'asia',
  displayName: 'Asia',
  sourceContinent: 'Asia',
  exportPrefix: 'ASIA',
  outputFilename: 'asia.ts',
  provenanceFilename: 'asia-cartography-provenance.json',
  expectedCountryCount: 48,
  // Canonical classification remains the five formal Asia regions. Learner
  // navigation is explicitly declared below and replaces West Asia with two
  // pedagogical scopes without duplicating country identity.
  regionIds: Object.freeze([
    'central-asia',
    'east-asia',
    'southeast-asia',
    'south-asia',
    'west-asia',
  ]),
  learningScopes: Object.freeze([
    Object.freeze({ id: 'central-asia', countryIds: Object.freeze(['KAZ', 'KGZ', 'TJK', 'TKM', 'UZB']) }),
    Object.freeze({ id: 'east-asia', countryIds: Object.freeze(['CHN', 'JPN', 'MNG', 'PRK', 'KOR']) }),
    Object.freeze({ id: 'southeast-asia', countryIds: Object.freeze(['BRN', 'KHM', 'IDN', 'LAO', 'MYS', 'MMR', 'PHL', 'SGP', 'THA', 'TLS', 'VNM']) }),
    Object.freeze({ id: 'south-asia', countryIds: Object.freeze(['AFG', 'BGD', 'BTN', 'IND', 'MDV', 'NPL', 'PAK', 'LKA']) }),
    Object.freeze({ id: 'middle-east', countryIds: Object.freeze(['BHR', 'CYP', 'EGY', 'IRN', 'IRQ', 'ISR', 'JOR', 'KWT', 'LBN', 'OMN', 'PSE', 'QAT', 'SAU', 'SYR', 'TUR', 'ARE', 'YEM']) }),
    Object.freeze({ id: 'caucasus', countryIds: Object.freeze(['ARM', 'AZE', 'GEO']) }),
  ]),
  // Visible locators are reserved for island states whose political polygon is
  // not an honest phone-scale tap target. The generated outline remains intact.
  islandLocatorIds: Object.freeze(['BHR', 'MDV', 'SGP']),
  callouts: Object.freeze({}),
  lakes: Object.freeze([
    Object.freeze({ name: 'Caspian Sea', pattern: 'caspian', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Baikal', pattern: 'baikal', flags: 'i', required: true }),
    Object.freeze({ name: 'Aral Sea', pattern: 'aral', flags: 'i', required: false }),
  ]),
  // Egypt participates as a scored member only inside Middle East. Russia is
  // non-scoring context so cross-Europe/Asia neighbours can be shown truthfully.
  localContextCountryIds: Object.freeze(['EGY', 'RUS']),
  // Full Russia must not determine the Asia camera extent; Egypt must, because
  // the Middle East scope includes it as an active target.
  fitContextCountryIds: Object.freeze(['EGY']),
  localContextBounds: null,
  // Egypt needs a complete generated adjacency record for the overlapping
  // Middle East scope even though its canonical continent remains Africa.
  extraAdjacencyCountryIds: Object.freeze(['EGY']),
  allowedContextPatterns: Object.freeze([
    Object.freeze({ pattern: '(taiwan|n\\.?\\s*cyprus|northern cyprus|akrotiri|dhekelia|siachen|hong kong|macao|macau|spratly|paracel)', flags: 'i' }),
  ]),
  adjacencyMode: 'global',
  policy: 'standard-v1',
  boundaryPolicy: Object.freeze({
    scoredCountries: 48,
    egypt: 'canonical Africa-owned EGY; scored only through the overlapping Middle East learning scope',
    turkey: 'canonical Asia-owned TUR with whole-country geometry and complete cross-Europe adjacency',
    cyprus: 'canonical Asia-owned CYP',
    kazakhstan: 'canonical Asia-owned KAZ with whole-country geometry',
    russia: 'canonical Europe-owned RUS rendered as non-scoring Asia context; complete adjacency remains global',
    caucasus: 'ARM, AZE and GEO are learner-facing Caucasus and are excluded from Middle East',
    taiwan: 'non-scoring source context under the current 195-country Atlas catalogue',
    palestineIsrael: 'PSE and ISR remain separate canonical scoring identities under the pinned Natural Earth source view',
    northernCyprus: 'non-scoring source context; no separate Atlas country identity',
    kashmir: 'pinned Natural Earth default de-facto boundary view; no handwritten override or additional scoring identity',
  }),
});

export const MAP_GENERATION_CONFIGS = Object.freeze([
  AFRICA_MAP_GENERATION_CONFIG,
  ASIA_MAP_GENERATION_CONFIG,
]);
