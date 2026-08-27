from pathlib import Path

p = Path('scripts/map-generation-core.mjs')
s = p.read_text()

replacements = [
("""  const contextPatterns = (config.allowedContextPatterns ?? []).map(
    (spec) => new RegExp(spec.pattern, spec.flags ?? 'i'),
  );
  const unexpected = [];
  for (const sourceFeature of countriesSource.features) {
    if (String(sourceFeature.properties?.CONTINENT ?? '').toLowerCase() !== config.sourceContinent.toLowerCase()) continue;
    const id = sourceCountryId(sourceFeature, allIds);
    if (id && (scoredIds.has(id) || localContextIds.has(id))) continue;
    const name = sourceName(sourceFeature) || '(unnamed)';
    if (contextPatterns.length && !contextPatterns.some((pattern) => pattern.test(name))) {
      unexpected.push(name);
      continue;
    }
    normalized.push({
""",
"""  const contextPatterns = (config.allowedContextPatterns ?? []).map(
    (spec) => new RegExp(spec.pattern, spec.flags ?? 'i'),
  );
  const excludedContextPatterns = (config.excludedContextPatterns ?? []).map(
    (spec) => new RegExp(spec.pattern, spec.flags ?? 'i'),
  );
  const unexpected = [];
  for (const sourceFeature of countriesSource.features) {
    if (String(sourceFeature.properties?.CONTINENT ?? '').toLowerCase() !== config.sourceContinent.toLowerCase()) continue;
    const id = sourceCountryId(sourceFeature, allIds);
    if (id && (scoredIds.has(id) || localContextIds.has(id))) continue;
    const name = sourceName(sourceFeature) || '(unnamed)';
    if (excludedContextPatterns.some((pattern) => pattern.test(name))) continue;
    if (contextPatterns.length && !contextPatterns.some((pattern) => pattern.test(name))) {
      unexpected.push(name);
      continue;
    }
    normalized.push({
"""),
("""function boundsToFocus(bounds, padding = 26) {
  const [[x0, y0], [x1, y1]] = bounds;
  let width = Math.max(1, x1 - x0) + padding * 2;
  let height = Math.max(1, y1 - y0) + padding * 2;
  width = Math.max(width, 180);
  height = Math.max(height, 170);
""",
"""function boundsToFocus(bounds, padding = 26, minimum = {}) {
  const [[x0, y0], [x1, y1]] = bounds;
  let width = Math.max(1, x1 - x0) + padding * 2;
  let height = Math.max(1, y1 - y0) + padding * 2;
  width = Math.max(width, minimum.width ?? 180);
  height = Math.max(height, minimum.height ?? 170);
"""),
("""  const fitExcludedIds = new Set(config.fitExcludeCountryIds ?? []);
  const fitCollection = featureCollection(normalized.features.filter((item) => {
    const countryId = item.properties?.countryId;
    return !countryId || !fitExcludedIds.has(countryId);
  }));
  if (!fitCollection.features.length) throw new Error(`${config.displayName} viewport-fit policy removed every feature.`);
""",
"""  const fitExcludedIds = new Set(config.fitExcludeCountryIds ?? []);
  const fitCountryBounds = config.fitCountryBounds ?? {};
  const fitExcludedContextPatterns = (config.fitExcludeContextPatterns ?? []).map(
    (spec) => new RegExp(spec.pattern, spec.flags ?? 'i'),
  );
  const fitCollection = featureCollection(normalized.features.flatMap((item) => {
    const countryId = item.properties?.countryId;
    if (countryId && fitExcludedIds.has(countryId)) return [];
    if (item.properties?.role === 'context'
      && fitExcludedContextPatterns.some((pattern) => pattern.test(sourceName(item)))) return [];
    const bounds = countryId ? fitCountryBounds[countryId] : undefined;
    if (!bounds) return [item];
    const geometry = filterGeometryByBounds(item.geometry, bounds);
    if (!geometry) {
      throw new Error(`${config.displayName} viewport-fit bounds removed every component of ${countryId}.`);
    }
    return [{ ...item, geometry }];
  }));
  if (!fitCollection.features.length) throw new Error(`${config.displayName} viewport-fit policy removed every feature.`);
"""),
("""  const islandLocators = new Set(config.islandLocatorIds ?? []);
""",
"""  const islandLocators = new Set(config.islandLocatorIds ?? []);
  const hitAssistIds = new Set(config.hitAssistIds ?? []);
  for (const id of hitAssistIds) {
    if (islandLocators.has(id)) {
      throw new Error(`${config.displayName} ${id} cannot use both a visible locator and invisible hit assistance.`);
    }
  }
"""),
("""    if (item.properties?.role === 'country' && islandLocators.has(id)) {
      const centroid = planarPath.centroid(item);
      countryGeometry.outlinePath = countryPath;
      countryGeometry.locator = {
        cx: Number(centroid[0].toFixed(2)),
        cy: Number(centroid[1].toFixed(2)),
        r: 7,
      };
    } else {
      countryGeometry.path = answerableIds.has(id)
        ? countryPath
        : (clippedPath(item) || countryPath);
    }
    if (item.properties?.role === 'country') {
""",
"""    if (item.properties?.role === 'country' && islandLocators.has(id)) {
      const centroid = planarPath.centroid(item);
      const anchor = config.locatorAnchorMode === 'pole'
        ? poleOfInaccessibility(pathRings(countryPath))
        : { x: centroid[0], y: centroid[1] };
      countryGeometry.outlinePath = countryPath;
      countryGeometry.locator = {
        cx: Number(anchor.x.toFixed(2)),
        cy: Number(anchor.y.toFixed(2)),
        r: 7,
      };
    } else {
      countryGeometry.path = answerableIds.has(id)
        ? countryPath
        : (clippedPath(item) || countryPath);
    }
    if (item.properties?.role === 'country' && hitAssistIds.has(id)) {
      const anchor = poleOfInaccessibility(pathRings(countryPath));
      countryGeometry.hitAssist = {
        cx: Number(anchor.x.toFixed(2)),
        cy: Number(anchor.y.toFixed(2)),
        r: 7,
      };
    }
    if (item.properties?.role === 'country') {
"""),
("""  const focusExcludedIds = new Set(config.focusExcludeCountryIds ?? []);
  const focusForIds = (ids) => {
    const preferredIds = ids.filter((id) => !focusExcludedIds.has(id));
    const focusIds = preferredIds.length ? preferredIds : ids;
    const regionFeatures = focusIds.map((id) => simplifiedById.get(id)).filter(Boolean);
    const bounds = planarPath.bounds(featureCollection(regionFeatures));
""",
"""  const focusExcludedIds = new Set(config.focusExcludeCountryIds ?? []);
  const focusCountryBounds = config.focusCountryBounds ?? {};
  const focusProjectedById = new Map(
    normalized.features
      .filter((item) => item.properties?.countryId && focusCountryBounds[item.properties.countryId])
      .map((item) => {
        const id = item.properties.countryId;
        const filtered = filterGeometryByBounds(item.geometry, focusCountryBounds[id]);
        if (!filtered) throw new Error(`${config.displayName} focus bounds removed every component of ${id}.`);
        return [id, {
          type: 'Feature',
          properties: { ...item.properties },
          geometry: projectGeometry(filtered, projection),
        }];
      }),
  );
  const focusForIds = (ids, scopeId) => {
    const preferredIds = ids.filter((id) => !focusExcludedIds.has(id));
    const focusIds = preferredIds.length ? preferredIds : ids;
    const regionFeatures = focusIds
      .map((id) => focusProjectedById.get(id) ?? simplifiedById.get(id))
      .filter(Boolean);
    const bounds = planarPath.bounds(featureCollection(regionFeatures));
"""),
("""      for (const circle of [geometry[id]?.locator, geometry[id]?.callout?.target]) {
""",
"""      for (const circle of [geometry[id]?.locator, geometry[id]?.hitAssist, geometry[id]?.callout?.target]) {
"""),
("""  for (const circle of [geometry.locator, geometry.callout?.target]) {
""",
"""  for (const circle of [geometry.locator, geometry.hitAssist, geometry.callout?.target]) {
"""),
]

for old, new in replacements:
    if old not in s:
        raise SystemExit(f'anchor not found: {old[:80]!r}')
    s = s.replace(old, new, 1)

old = """    return boundsToFocus(bounds);
  };
"""
new = """    return boundsToFocus(bounds, 26, config.focusMinimumByScope?.[scopeId]);
  };
"""
if old not in s:
    raise SystemExit('focus return anchor not found')
s = s.replace(old, new, 1)
s = s.replace("[config.id]: focusForIds(scoredCatalog.map((row) => row.id)),", "[config.id]: focusForIds(scoredCatalog.map((row) => row.id), config.id),")
s = s.replace("scopeFocus[region] = focusForIds(ids);", "scopeFocus[region] = focusForIds(ids, region);")
s = s.replace("scopeFocus[scopeId] = focusForIds(ids);", "scopeFocus[scopeId] = focusForIds(ids, scopeId);")
p.write_text(s)

p = Path('scripts/map-continent-configs.mjs')
s = p.read_text()
start = s.index('export const NORTH_AMERICA_MAP_GENERATION_CONFIG')
end = s.index('\nexport const MAP_GENERATION_CONFIGS', start)
block = r'''export const NORTH_AMERICA_MAP_GENERATION_CONFIG = Object.freeze({
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
'''
s = s[:start] + block + s[end:]
p.write_text(s)
