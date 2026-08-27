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
    // Togo's leader line drops nearly straight into the Gulf of Guinea, roughly
    // perpendicular to the simplified local coastline (~16° off horizontal). The
    // earlier south-west offset landed the target 5 canvas units from Ghana and
    // 29 from Togo, which read as Ghana's marker.
    TGO: Object.freeze({ dx: 9, dy: 42, r: 10 }),
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

export const SOUTH_AMERICA_MAP_GENERATION_CONFIG = Object.freeze({
  id: 'south-america',
  displayName: 'South America',
  sourceContinent: 'South America',
  exportPrefix: 'SOUTH_AMERICA',
  outputFilename: 'south-america.ts',
  provenanceFilename: 'south-america-cartography-provenance.json',
  expectedCountryCount: 12,
  regionIds: Object.freeze([
    'andean',
    'atlantic-south-america',
    'southern-cone',
  ]),
  islandLocatorIds: Object.freeze([]),
  callouts: Object.freeze({}),
  lakes: Object.freeze([
    Object.freeze({ name: 'Lake Titicaca', pattern: 'titicaca', flags: 'i', required: true }),
  ]),
  // PAN is needed as the complete cross-continent neighbour of COL. FRA is
  // clipped to its local French Guiana geometry for sovereign context without
  // pulling metropolitan France into the South America viewport.
  localContextCountryIds: Object.freeze(['PAN', 'FRA']),
  localContextBounds: Object.freeze({ minLon: -83, maxLon: -47, minLat: -58, maxLat: 14 }),
  allowedContextPatterns: Object.freeze([
    Object.freeze({ pattern: '(falkland|malvinas)', flags: 'i' }),
    Object.freeze({ pattern: 'southern patagonian ice field', flags: 'i' }),
  ]),
  adjacencyMode: 'global',
  policy: 'standard-v1',
  boundaryPolicy: Object.freeze({
    naturalEarthView: 'default de-facto',
    frenchGuiana: 'non-scoring sovereign FRA context; local display geometry clipped to French Guiana',
    falklands: 'non-scoring disputed context; no separate Atlas target',
    southernPatagonianIceField: 'non-scoring undemarcated Argentina-Chile boundary context; no separate Atlas target and no reassignment',
    trinidadAndTobago: 'remains canonical North America / Caribbean; not a South America scoring target',
    crossContinentAdjacency: 'global application-country topology preserves COL-PAN and sovereign overseas land borders',
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
  // Whole-country polygons stay canonical. Remote or overseas parts are
  // excluded only from Europe viewport fitting/focus; the SVG viewBox crops
  // them visually without creating a second geometry source.
  fitExcludeCountryIds: Object.freeze(['RUS', 'FRA', 'NOR', 'NLD']),
  focusExcludeCountryIds: Object.freeze(['RUS', 'FRA', 'NOR', 'NLD']),
  // Europe and Asia span far more canvas than the Africa-calibrated baseline,
  // so their non-interactive physical context carries proportionally more
  // detail for no learning value. Simplifying ocean/coastline/lake context
  // (never country geometry or adjacency) recovers ~30%/~21% of gzip.
  physicalTolerance: Object.freeze({ ocean: 0.6, coastline: 0.5, lakes: 0.25 }),
  adjacencyMode: 'global',
  policy: 'standard-v1',
  boundaryPolicy: Object.freeze({
    naturalEarthView: 'default de-facto',
    russia: 'one canonical whole-country RUS geometry; excluded only from Europe viewport fit/focus so the SVG viewport can crop eastern geometry without shrinking Europe',
    france: 'one canonical whole-country FRA geometry including French Guiana; excluded from Europe fit/focus so overseas geometry does not distort Europe',
    norway: 'one canonical whole-country NOR geometry; remote multipart source geometry is excluded from Europe fit/focus',
    netherlands: 'one canonical whole-country NLD geometry including Bonaire, Curacao, Saba and St Eustatius; those Caribbean parts are 0.58% of its projected area but set both the west and south edge of the Western Europe frame, so NLD is excluded from Europe fit/focus exactly as FRA is',
    microstates: 'AND/LIE/LUX/MCO/SMR/VAT use mainland callouts after phone-scale geometry audit; MLT uses the island locator; canonical polygon geometry is retained',
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

export const ASIA_MAP_GENERATION_CONFIG = Object.freeze({
  id: 'asia',
  displayName: 'Asia',
  sourceContinent: 'Asia',
  exportPrefix: 'ASIA',
  outputFilename: 'asia.ts',
  provenanceFilename: 'asia-cartography-provenance.json',
  expectedCountryCount: 48,
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
  islandLocatorIds: Object.freeze(['BHR', 'MDV', 'SGP']),
  callouts: Object.freeze({}),
  // Issue 113 prototype. Lebanon, Israel and Palestine sit within four canvas
  // units of each other, so no leader line can be placed without its own touch
  // surface covering a neighbour that is also an answer. Measured at the Middle
  // East opening view on a 320-wide phone, Palestine's tappable disc is 2.5 CSS
  // px. The panel gives all three the full 44 px.
  //
  // The Gulf cluster (BHR/QAT/KWT/ARE) fails the same clearance test but needs a
  // 369x325 px panel to stay true-scale, so it needs a schematic arrangement and
  // is deliberately left to follow-up work rather than forced in here.
  insets: Object.freeze([
    Object.freeze({
      id: 'eastern-mediterranean',
      label: 'Eastern Mediterranean',
      countryIds: Object.freeze(['LBN', 'ISR', 'PSE']),
      anchor: 'bottom-right',
    }),
  ]),
  lakes: Object.freeze([
    Object.freeze({ name: 'Caspian Sea', pattern: 'caspian', flags: 'i', required: false }),
    Object.freeze({ name: 'Lake Baikal', pattern: 'baikal', flags: 'i', required: true }),
    Object.freeze({ name: 'Aral Sea', pattern: 'aral', flags: 'i', required: false }),
  ]),
  localContextCountryIds: Object.freeze(['EGY', 'RUS']),
  // Russia is non-scoring Asia context, yet its trans-antimeridian geometry set
  // the Asia canvas's west edge at Chukotka. Because DEFAULT_MAX_ZOOM is
  // relative to the canvas, that under-scaled every Asian country by 2.31x even
  // at full pinch. It is excluded from the fit only: Russia stays in the
  // rendered context and in every opening frame it borders, and one canonical
  // whole-country RUS geometry with complete cross-continent adjacency remains.
  fitExcludeCountryIds: Object.freeze(['RUS']),
  localContextBounds: null,
  extraAdjacencyCountryIds: Object.freeze(['EGY']),
  allowedContextPatterns: Object.freeze([
    Object.freeze({ pattern: '(taiwan|n\\.?\\s*cyprus|northern cyprus|cyprus no mans area|akrotiri|dhekelia|siachen|hong kong|macao|macau|spratly|paracel|scarborough reef|indian ocean territories)', flags: 'i' }),
  ]),
  // Issue #28's Middle East and the learner-facing Caucasus overlap the
  // canonical UN-style region taxonomy rather than replacing it. They need
  // deterministic map framing without owning country records; Egypt stays
  // canonically African and is keyed Asia context.
  derivedFocusScopes: Object.freeze({
    'middle-east': Object.freeze([
      'ARE', 'BHR', 'CYP', 'EGY', 'IRN', 'IRQ', 'ISR', 'JOR', 'KWT',
      'LBN', 'OMN', 'PSE', 'QAT', 'SAU', 'SYR', 'TUR', 'YEM',
    ]),
    caucasus: Object.freeze(['ARM', 'AZE', 'GEO']),
  }),
  // Europe and Asia span far more canvas than the Africa-calibrated baseline,
  // so their non-interactive physical context carries proportionally more
  // detail for no learning value. Simplifying ocean/coastline/lake context
  // (never country geometry or adjacency) recovers ~30%/~21% of gzip.
  // Tolerances are canvas units, so excluding Russia from the fit — which draws
  // every remaining feature 2.31x larger — made the old values simplify
  // proportionally less and pushed gzip over budget on a smaller raw asset.
  // Scaling them by the same factor restores the previous on-screen
  // simplification of non-interactive context. Country geometry and adjacency
  // are untouched by these tolerances.
  physicalTolerance: Object.freeze({ ocean: 1.4, coastline: 1.15, lakes: 0.6 }),
  // West Asia is canonical classification only. Atlas navigates Middle East and
  // Caucasus instead, so West Asia gets no learner-facing map focus.
  hiddenFocusRegionIds: Object.freeze(['west-asia']),
  // Egypt stays canonically African with one country record and one progress
  // ledger, but Middle East must be able to teach it, so its globally derived
  // adjacency ships in the Asia module.
  adjacencyExtraCountryIds: Object.freeze(['EGY']),
  adjacencyMode: 'global',
  policy: 'standard-v1',
  boundaryPolicy: Object.freeze({
    naturalEarthView: 'default de-facto',
    egypt: 'canonical Africa-owned EGY; scored only through the overlapping Middle East learning scope',
    turkey: 'canonical Asia-owned TUR with whole-country geometry and complete cross-Europe adjacency',
    cyprus: 'canonical Asia-owned CYP',
    kazakhstan: 'canonical Asia-owned KAZ with whole-country geometry',
    russia: 'canonical Europe-owned RUS rendered as non-scoring Asia context; excluded from the Asia viewport fit only, so trans-antimeridian geometry cannot scale down the canvas every Asian country is measured against; complete adjacency remains global',
    caucasus: 'ARM, AZE and GEO are learner-facing Caucasus and are excluded from Middle East',
    taiwan: 'non-scoring source context under the current 195-country Atlas catalogue',
    palestineIsrael: 'PSE and ISR remain separate canonical scoring identities under the pinned Natural Earth source view',
    northernCyprus: 'non-scoring source context; no separate Atlas country identity',
    cyprusNoMansArea: 'non-scoring Natural Earth context inside Cyprus; no separate Atlas country identity',
    indianOceanTerritories: 'non-scoring Natural Earth territory context; no separate Atlas country identity',
    scarboroughReef: 'non-scoring Natural Earth disputed-feature context; no separate Atlas country identity',
    kashmir: 'pinned Natural Earth default de-facto boundary view; no handwritten override or additional scoring identity',
    physicalWater: 'linear rivers excluded; Caspian requested only if present in the pinned lakes layer; Lake Baikal required',
    unRole: 'policy/dispute/disclaimer audit reference, not runtime redistribution source',
  }),
});

export const NORTH_AMERICA_MAP_GENERATION_CONFIG = Object.freeze({
  id: 'north-america',
  displayName: 'North America',
  sourceContinent: 'North America',
  exportPrefix: 'NORTH_AMERICA',
  outputFilename: 'north-america.ts',
  provenanceFilename: 'north-america-cartography-provenance.json',
  expectedCountryCount: 23,
  regionIds: Object.freeze([
    'northern-america',
    'central-america',
    'caribbean',
  ]),
  islandLocatorIds: Object.freeze([]),
  callouts: Object.freeze({}),
  lakes: Object.freeze([]),
  localContextCountryIds: Object.freeze(['COL', 'VEN']),
  localContextBounds: Object.freeze({ minLon: -86, maxLon: -57, minLat: 0, maxLat: 25 }),
  allowedContextPatterns: Object.freeze([]),
  adjacencyMode: 'global',
  policy: 'standard-v1',
  boundaryPolicy: Object.freeze({
    naturalEarthView: 'default de-facto',
    scoredCountries: 'exact Atlas 23-country North America curriculum only',
    southAmericaContext: 'COL and VEN are keyed non-scoring context; PAN-COL adjacency remains global',
    dependenciesAndTerritories: 'non-scoring; explicit source-feature audit required before release',
    maritimeAdjacency: 'none; land adjacency only',
  }),
});

export const MAP_GENERATION_CONFIGS = Object.freeze([
  AFRICA_MAP_GENERATION_CONFIG,
  SOUTH_AMERICA_MAP_GENERATION_CONFIG,
  EUROPE_MAP_GENERATION_CONFIG,
  ASIA_MAP_GENERATION_CONFIG,
  NORTH_AMERICA_MAP_GENERATION_CONFIG,
]);
