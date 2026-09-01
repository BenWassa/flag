export const MAP_CANVAS = Object.freeze({
  width: 835,
  height: 723,
  padding: 22,
  quantization: 100_000,
  simplificationQuantile: 0.72,
  pathDigits: 2,
});

// Source reconciliation is global because canonical country geometry must not
// diverge between projected Locations/Outlines and the Spatial globe. Every
// extra piece is still sourced from the same pinned Natural Earth 1:10m file.
export const CANONICAL_SOURCE_GEOMETRY_MERGES = Object.freeze({
  CYP: Object.freeze([
    Object.freeze({ pattern: '^Northern Cyprus$', flags: 'i', required: true }),
    Object.freeze({ pattern: '^Cyprus No Mans Area$', flags: 'i', required: true }),
  ]),
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
  // Issue #137: keep every small country in canonical geography. Practical
  // touch assistance is invisible and persistent; the four island/split-island
  // markers below are perceptual hints only and never become the hit surface.
  islandLocatorIds: Object.freeze([]),
  hitAssistIds: Object.freeze(['BHR', 'BRN', 'ISR', 'KWT', 'LBN', 'MDV', 'PSE', 'QAT', 'SGP']),
  visibleMarkerIds: Object.freeze(['BHR', 'BRN', 'MDV', 'SGP']),
  callouts: Object.freeze({}),
  insets: Object.freeze([]),
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
    cyprus: 'canonical Asia-owned CYP dissolved from pinned source CYP, Northern Cyprus and Cyprus No Mans Area geometry; Akrotiri and Dhekelia remain British sovereign-base context',
    kazakhstan: 'canonical Asia-owned KAZ with whole-country geometry',
    russia: 'canonical Europe-owned RUS rendered as non-scoring Asia context; excluded from the Asia viewport fit only, so trans-antimeridian geometry cannot scale down the canvas every Asian country is measured against; complete adjacency remains global',
    caucasus: 'ARM, AZE and GEO are learner-facing Caucasus and are excluded from Middle East',
    taiwan: 'non-scoring source context under the current 195-country Atlas catalogue',
    palestineIsrael: 'PSE and ISR remain separate canonical scoring identities under the pinned Natural Earth source view',
    northernCyprus: 'source-derived geometry reconciled into canonical CYP; no separate Atlas country identity',
    cyprusNoMansArea: 'source-derived UN buffer geometry reconciled into canonical CYP; no separate Atlas country identity',
    sovereignBaseAreas: 'Akrotiri and Dhekelia remain non-scoring British source context and are not absorbed into CYP',
    assistance: 'max zoom 8; invisible hit assistance for BHR/BRN/ISR/KWT/LBN/MDV/PSE/QAT/SGP; restrained persistent visual markers only for BHR/BRN/MDV/SGP; no Asia question-triggered inset',
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
  hitAssistIds: Object.freeze(['BHS', 'BLZ', 'DOM', 'HTI', 'JAM', 'SLV', 'TTO']),
  callouts: Object.freeze({}),
  insets: Object.freeze([
    Object.freeze({ id: 'northern-lesser-antilles', label: 'Northern Lesser Antilles', countryIds: Object.freeze(['KNA', 'ATG']), anchor: 'top-right' }),
    Object.freeze({ id: 'windward-islands-north', label: 'Windward Islands', countryIds: Object.freeze(['DMA', 'LCA']), anchor: 'top-right' }),
    Object.freeze({ id: 'windward-islands-south', label: 'Southern Windward Islands', countryIds: Object.freeze(['VCT', 'GRD', 'BRB']), anchor: 'top-right' }),
  ]),
  lakes: Object.freeze([
    Object.freeze({ name: 'Lake Superior', pattern: 'superior', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Michigan', pattern: 'michigan', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Huron', pattern: 'huron', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Erie', pattern: '\\berie\\b', flags: 'i', required: true }),
    Object.freeze({ name: 'Lake Ontario', pattern: 'ontario', flags: 'i', required: true }),
  ]),
  localContextCountryIds: Object.freeze(['COL', 'VEN', 'FRA', 'NLD']),
  localContextBounds: Object.freeze({ minLon: -90, maxLon: -55, minLat: 0, maxLat: 30 }),
  allowedContextPatterns: Object.freeze([
    Object.freeze({ pattern: '(anguilla|aruba|bajo nuevo|bermuda|british virgin|cayman|cura|greenland|montserrat|puerto rico|saint barthelemy|saint martin|saint pierre|serranilla|sint maarten|turks and caicos|united states virgin|guantanamo)', flags: 'i' }),
  ]),
  excludedContextPatterns: Object.freeze([
    Object.freeze({ pattern: 'united states minor outlying islands', flags: 'i' }),
  ]),
  fitExcludeContextPatterns: Object.freeze([
    Object.freeze({ pattern: 'greenland', flags: 'i' }),
    Object.freeze({ pattern: 'bermuda', flags: 'i' }),
  ]),
  fitCountryBounds: Object.freeze({
    USA: Object.freeze({ minLon: -170, maxLon: -50, minLat: 24, maxLat: 75 }),
  }),
  focusCountryBounds: Object.freeze({
    USA: Object.freeze({ minLon: -170, maxLon: -50, minLat: 24, maxLat: 75 }),
  }),
  focusMinimumByScope: Object.freeze({
    'central-america': Object.freeze({ width: 120, height: 110 }),
    caribbean: Object.freeze({ width: 105, height: 105 }),
  }),
  physicalTolerance: Object.freeze({ ocean: 1.4, coastline: 1.15, lakes: 0.6 }),
  adjacencyMode: 'global',
  policy: 'standard-v1',
  boundaryPolicy: Object.freeze({
    naturalEarthView: 'default de-facto',
    scoredCountries: 'exact Atlas 23-country North America curriculum only',
    canadaUnitedStates: 'canonical whole-country CAN/USA; USA remote multipart components are excluded from viewport fit/focus only, never from scored geometry or Outlines',
    southAmericaContext: 'COL and VEN are keyed non-scoring context; PAN-COL adjacency remains global',
    franceNetherlandsContext: 'FRA and NLD are keyed non-scoring context clipped to Caribbean overseas geometry; metropolitan Europe is not loaded into this viewport',
    greenland: 'non-scoring Danish context; rendered when visible but excluded from projection fit',
    bermuda: 'non-scoring British dependency context; rendered when visible but excluded from projection fit',
    saintPierreAndMiquelon: 'non-scoring French dependency context near Canada',
    puertoRico: 'non-scoring United States dependency context in the Caribbean',
    britishCaribbean: 'Anguilla, British Virgin Islands, Cayman Islands, Montserrat and Turks and Caicos Islands are non-scoring context',
    frenchCaribbean: 'Saint Barthelemy and Saint Martin are non-scoring source context; FRA Caribbean geometry is keyed non-scoring context',
    dutchCaribbean: 'Aruba, Curacao and Sint Maarten are non-scoring source context; NLD Caribbean geometry is keyed non-scoring context',
    disputedBanks: 'Bajo Nuevo Bank and Serranilla Bank remain non-scoring Natural Earth indeterminate context',
    guantanamo: 'Natural Earth Guantanamo Bay lease remains non-scoring context and is not promoted to an Atlas country',
    usMinorOutlyingIslands: 'explicitly excluded from North America runtime context because remote Pacific dependencies are irrelevant to this learner viewport',
    maritimeAdjacency: 'none; topology-derived land adjacency only, including explicit empty sets',
    assistance: 'real polygons first; invisible hit assistance for BHS/BLZ/DOM/HTI/JAM/SLV/TTO; true-scale insets for KNA+ATG, DMA+LCA and VCT+GRD+BRB; no leader-line callouts or schematic relocation',
  }),
});

export const OCEANIA_MAP_GENERATION_CONFIG = Object.freeze({
  id: 'oceania',
  displayName: 'Oceania',
  sourceContinent: 'Oceania',
  exportPrefix: 'OCEANIA',
  outputFilename: 'oceania.ts',
  provenanceFilename: 'oceania-cartography-provenance.json',
  expectedCountryCount: 14,
  regionIds: Object.freeze([
    'australia-new-zealand',
    'melanesia',
    'micronesia',
    'polynesia',
  ]),
  // Pacific-centred projection is a generic generator option, not a Kiribati
  // geometry patch. It moves the projection seam away from the scored Pacific
  // archipelagos while retaining canonical source coordinates/topology.
  projectionRotate: Object.freeze([-160, 0, 0]),
  islandLocatorIds: Object.freeze([]),
  hitAssistIds: Object.freeze(['FJI', 'SLB', 'VUT', 'KIR', 'MHL', 'FSM', 'NRU', 'PLW', 'WSM', 'TON', 'TUV']),
  geographicAuditCountryIds: Object.freeze(['KIR']),
  callouts: Object.freeze({}),
  insets: Object.freeze([]),
  lakes: Object.freeze([]),
  // Indonesia is non-scoring Oceania context so the PNG land boundary is
  // visible locally; global topology still owns the complete PNG-IDN edge.
  localContextCountryIds: Object.freeze(['IDN']),
  localContextBounds: Object.freeze({ minLon: 125, maxLon: 145, minLat: -12, maxLat: 3 }),
  allowedContextPatterns: Object.freeze([
    Object.freeze({ pattern: '(american samoa|ashmore|cartier|cook islands|coral sea|french polynesia|guam|heard island|macdonald islands|new caledonia|niue|norfolk island|northern mariana|pitcairn|tokelau|wallis|futuna)', flags: 'i' }),
  ]),
  // Non-scoring dependencies may be rendered when they fall inside the Pacific
  // canvas, but they never get to determine scoring scale/framing.
  fitExcludeContextPatterns: Object.freeze([
    Object.freeze({ pattern: '(american samoa|ashmore|cartier|cook islands|coral sea|french polynesia|guam|heard island|macdonald islands|new caledonia|niue|norfolk island|northern mariana|pitcairn|tokelau|wallis|futuna)', flags: 'i' }),
  ]),
  physicalTolerance: Object.freeze({ ocean: 1.8, coastline: 1.4, lakes: 0.6 }),
  adjacencyMode: 'global',
  policy: 'standard-v1',
  boundaryPolicy: Object.freeze({
    naturalEarthView: 'default de-facto',
    scoredCountries: 'exact Atlas 14-country Oceania curriculum only',
    antimeridian: 'Pacific-centred Natural Earth projection rotation moves the rendering seam away from scored archipelagos; canonical geographic geometry is not duplicated, shifted or hand-edited',
    indonesia: 'canonical Asia-owned IDN is keyed non-scoring local context; complete PNG-IDN land adjacency is derived from the global application-country topology',
    newCaledonia: 'French dependency; non-scoring context only',
    frenchPolynesia: 'French dependency; non-scoring context only',
    guam: 'United States dependency; non-scoring context only',
    northernMarianaIslands: 'United States commonwealth; non-scoring context only',
    americanSamoa: 'United States dependency; non-scoring context only',
    cookIslands: 'self-governing state in free association with New Zealand; not an Atlas application-country target under the current catalogue',
    niue: 'self-governing state in free association with New Zealand; not an Atlas application-country target under the current catalogue',
    otherPacificDependencies: 'other pinned-source Pacific dependencies/features remain non-scoring context unless explicitly excluded after source audit',
    maritimeAdjacency: 'none; topology-derived direct land adjacency only, including explicit empty sets',
    assistance: 'production 320px audit retains real polygons for AUS, NZL and PNG; 11 small-island targets use question-specific invisible 44px hit assistance anchored inside canonical land; no visible locator, callout or inset is predeclared',
  }),
});

export const MAP_GENERATION_CONFIGS = Object.freeze([
  AFRICA_MAP_GENERATION_CONFIG,
  SOUTH_AMERICA_MAP_GENERATION_CONFIG,
  EUROPE_MAP_GENERATION_CONFIG,
  ASIA_MAP_GENERATION_CONFIG,
  NORTH_AMERICA_MAP_GENERATION_CONFIG,
  OCEANIA_MAP_GENERATION_CONFIG,
]);
