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

export const MAP_GENERATION_CONFIGS = Object.freeze([
  AFRICA_MAP_GENERATION_CONFIG,
]);
