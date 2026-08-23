export const MAP_CANVAS = Object.freeze({
  width: 835,
  height: 723,
  padding: 22,
  quantization: 100_000,
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
    GMB: Object.freeze({ dx: -36, dy: -8, r: 10 }),
    TGO: Object.freeze({ dx: -25, dy: 34, r: 10 }),
  }),
  lakes: Object.freeze([
    Object.freeze({ name: 'Lake Victoria', pattern: 'victoria', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Tanganyika', pattern: 'tanganyika', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Malawi', pattern: '(malawi|nyasa)', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Chad', pattern: '\\bchad\\b', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Turkana', pattern: 'turkana', flags: 'i', required: false }),
    Object.freeze({ name: 'Lake Albert', pattern: '\\balbert\\b', flags: 'i', required: false }),
    Object.freeze({ name: 'Lake Kivu', pattern: '\\bkivu\\b', flags: 'i', required: false }),
    Object.freeze({ name: 'Lake Tana', pattern: '\\btana\\b', flags: 'i', required: false }),
    Object.freeze({ name: 'Lake Nasser', pattern: '\\bnasser\\b', flags: 'i', required: false }),
  ]),
  localContextCountryIds: Object.freeze([]),
  localContextBounds: null,
  adjacencyMode: 'local',
  policy: 'africa-v1',
  boundaryPolicy: Object.freeze({
    naturalEarthView: 'default de-facto',
    somaliland: 'dissolved into canonical SOM scoring geometry; no separate target',
    westernSahara: 'non-scoring context; not merged into MAR',
    birTawil: 'non-scoring context; not merged into EGY or SDN',
    unRole: 'policy/dispute/disclaimer audit reference, not runtime redistribution source',
  }),
});


export const EUROPE_MAP_GENERATION_CONFIG = Object.freeze({
  id: 'europe',
  displayName: 'Europe',
  sourceContinent: 'Europe',
  exportPrefix: 'EUROPE',
  outputFilename: 'europe.ts',
  provenanceFilename: 'europe-cartography-provenance.json',
  expectedCountryCount: 44,
  regionIds: Object.freeze([
    'northern-europe',
    'western-europe',
    'eastern-europe',
    'southern-europe',
  ]),
  islandLocatorIds: Object.freeze(['MLT']),
  callouts: Object.freeze({}),
  lakes: Object.freeze([
    Object.freeze({ name: 'Lake Ladoga', pattern: 'ladoga', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Onega', pattern: 'onega', flags: 'i', required: false }),
  ]),
  localContextCountryIds: Object.freeze(['TUR', 'CYP', 'ARM', 'AZE', 'GEO']),
  localContextBounds: Object.freeze({ minLon: -35, maxLon: 55, minLat: 28, maxLat: 74 }),
  allowedContextPatterns: Object.freeze([
    Object.freeze({ pattern: '(kosovo|gibraltar|jersey|guernsey|isle of man|aland|faroe islands)', flags: 'i' }),
  ]),
  // Russia remains one whole canonical geometry. It is excluded only
  // from viewport fitting/focus calculations so far-eastern Russia can
  // extend beyond the Europe canvas instead of shrinking the continent.
  fitExcludeCountryIds: Object.freeze(['RUS']),
  focusExcludeCountryIds: Object.freeze(['RUS']),
  adjacencyMode: 'global',
  policy: 'standard-v1',
  boundaryPolicy: Object.freeze({
    naturalEarthView: 'default de-facto',
    russia: 'one canonical whole-country RUS geometry; excluded only from Europe viewport fit/focus so eastern geometry may crop at the canvas edge',
    turkiyeCyprusCaucasus: 'TUR/CYP/ARM/AZE/GEO are keyed non-scoring context; canonical ownership remains outside Europe curriculum',
    kosovo: 'non-scoring source context; no Atlas application-country target',
    gibraltar: 'non-scoring British Overseas Territory context; no Atlas application-country target',
    crownDependencies: 'Jersey, Guernsey and Isle of Man are non-scoring Crown Dependency context; no Atlas application-country targets',
    aland: 'non-scoring autonomous Finnish territory context; no Atlas application-country target',
    faroeIslands: 'non-scoring autonomous Danish territory context; no Atlas application-country target',
    overseasAndDependencies: 'other source features remain non-scoring context unless reconciled to a canonical Atlas country',
    crossContinentAdjacency: 'global application-country topology preserves complete RUS and other cross-continent land borders',
  }),
});

export const MAP_GENERATION_CONFIGS = Object.freeze([
  AFRICA_MAP_GENERATION_CONFIG,
  EUROPE_MAP_GENERATION_CONFIG,
]);
