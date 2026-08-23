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
  precisionSensitiveCountryIds: Object.freeze(['AND', 'LIE', 'LUX', 'MCO', 'SMR', 'VAT', 'MLT']),
  wholeOutlineCountryIds: Object.freeze(['RUS', 'FRA', 'NOR']),
  callouts: Object.freeze({
    AND: Object.freeze({ dx: -28, dy: 18, r: 10 }),
    LIE: Object.freeze({ dx: 24, dy: -20, r: 10 }),
    LUX: Object.freeze({ dx: -25, dy: -20, r: 10 }),
    MCO: Object.freeze({ dx: 27, dy: 16, r: 10 }),
    SMR: Object.freeze({ dx: 24, dy: -16, r: 10 }),
    VAT: Object.freeze({ dx: -26, dy: 18, r: 10 }),
  }),
  lakes: Object.freeze([
    Object.freeze({ name: 'Lake Ladoga', pattern: 'ladoga', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Onega', pattern: 'onega', flags: 'i', required: false }),
  ]),
  localContextCountryIds: Object.freeze(['TUR', 'CYP', 'ARM', 'AZE', 'GEO']),
  localContextBounds: Object.freeze({ minLon: -35, maxLon: 55, minLat: 28, maxLat: 74 }),
  allowedContextPatterns: Object.freeze([
    Object.freeze({ pattern: '(kosovo|gibraltar|jersey|guernsey|isle of man|aland|faroe islands)', flags: 'i' }),
  ]),
  // Whole-country silhouettes stay canonical. Remote or overseas parts are
  // excluded only from Europe viewport fitting/focus and clipped at render time.
  fitExcludeCountryIds: Object.freeze(['RUS', 'FRA', 'NOR']),
  focusExcludeCountryIds: Object.freeze(['RUS', 'FRA', 'NOR']),
  adjacencyMode: 'global',
  policy: 'standard-v1',
  boundaryPolicy: Object.freeze({
    naturalEarthView: 'default de-facto',
    russia: 'one canonical whole-country RUS outline; Europe map rendering is clipped to its canvas and RUS is excluded only from viewport fit/focus calculations',
    france: 'one canonical whole-country FRA outline including French Guiana; Europe map rendering is clipped to its canvas and FRA is excluded from fit/focus so overseas geometry does not distort Europe',
    norway: 'one canonical whole-country NOR outline; remote multipart source geometry is excluded from fit/focus while Europe map rendering stays clipped to its canvas',
    microstates: 'AND/LIE/LUX/MCO/SMR/VAT use mainland callouts after phone-scale geometry audit; MLT uses the island locator; canonical outline geometry is retained',
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
