from pathlib import Path
import re


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(text)


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


# Runtime metadata: continent-owned zoom ceiling and a separate truthful marker.
p = 'src/domain/map-models.ts'
s = read(p)
s = replace_once(s,
"  locator?: MapPoint;\n  hitAssist?: MapPoint;\n  /** Explicit cartographic callout for mainland countries too small/narrow for honest phone tapping. */",
"  locator?: MapPoint;\n  hitAssist?: MapPoint;\n  /** Persistent perceptual marker at the canonical location; never the practical touch surface. */\n  marker?: MapPoint;\n  /** Explicit cartographic callout for mainland countries too small/narrow for honest phone tapping. */",
'map marker type')
s = replace_once(s,
"  /** Preferred first viewport within the full continent canvas. */\n  initialFocus?: MapViewportFocus;",
"  /** Evidence-based maximum zoom multiplier owned by the continent configuration. */\n  maxZoom?: number;\n  /** Preferred first viewport within the full continent canvas. */\n  initialFocus?: MapViewportFocus;",
'map max zoom type')
write(p, s)

p = 'src/data/map-scopes.ts'
s = read(p)
s = replace_once(s,
"  /** Keyed canonical countries rendered as non-scoring context in the parent asset. */\n  contextCountryIds?: readonly string[];\n}",
"  /** Keyed canonical countries rendered as non-scoring context in the parent asset. */\n  contextCountryIds?: readonly string[];\n  /** Optional evidence-based zoom ceiling consumed generically by the map runtime. */\n  maxZoom?: number;\n}",
'continent max zoom config')
s = replace_once(s,
"export const ASIA_MAP_CONTINENT_CONFIG: MapContinentConfig = {\n  continentId: 'asia',\n  scope: ASIA_MAP_SCOPE,\n  countryIds: ASIA_MAP_COUNTRY_IDS,",
"export const ASIA_MAP_CONTINENT_CONFIG: MapContinentConfig = {\n  continentId: 'asia',\n  scope: ASIA_MAP_SCOPE,\n  countryIds: ASIA_MAP_COUNTRY_IDS,\n  maxZoom: 8,",
'Asia max zoom')
write(p, s)

p = 'src/data/maps/index.ts'
s = read(p)
s = replace_once(s,
"    hitAssist: geometry.hitAssist ? { ...geometry.hitAssist } : undefined,\n    callout: geometry.callout",
"    hitAssist: geometry.hitAssist ? { ...geometry.hitAssist } : undefined,\n    marker: geometry.marker ? { ...geometry.marker } : undefined,\n    callout: geometry.callout",
'clone marker')
s = replace_once(s,
"    water: {\n      oceanPath: data.water.oceanPath,\n      lakes: (data.water.lakes ?? []).map(cloneNamedPath),\n    },\n    initialFocus: data.scopeFocus[scopeId],",
"    water: {\n      oceanPath: data.water.oceanPath,\n      lakes: (data.water.lakes ?? []).map(cloneNamedPath),\n    },\n    maxZoom: continent.maxZoom,\n    initialFocus: data.scopeFocus[scopeId],",
'asset max zoom')
write(p, s)

# One canonical source-reconciliation policy is shared by projected maps and the globe.
p = 'scripts/map-continent-configs.mjs'
s = read(p)
s = replace_once(s,
"export const MAP_CANVAS = Object.freeze({\n  width: 835,\n  height: 723,\n  padding: 22,\n  quantization: 100_000,\n  simplificationQuantile: 0.72,\n  pathDigits: 2,\n});\n",
"export const MAP_CANVAS = Object.freeze({\n  width: 835,\n  height: 723,\n  padding: 22,\n  quantization: 100_000,\n  simplificationQuantile: 0.72,\n  pathDigits: 2,\n});\n\n// Source reconciliation is global because canonical country geometry must not\n// diverge between projected Locations/Outlines and the Spatial globe. Every\n// extra piece is still sourced from the same pinned Natural Earth 1:10m file.\nexport const CANONICAL_SOURCE_GEOMETRY_MERGES = Object.freeze({\n  CYP: Object.freeze([\n    Object.freeze({ pattern: '^Northern Cyprus$', flags: 'i', required: true }),\n    Object.freeze({ pattern: '^Cyprus No Mans Area$', flags: 'i', required: true }),\n  ]),\n});\n",
'global source merge policy')
old_asia = """  islandLocatorIds: Object.freeze(['BHR', 'MDV', 'SGP']),
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
"""
new_asia = """  // Issue #137: keep every small country in canonical geography. Practical
  // touch assistance is invisible and persistent; the four island/split-island
  // markers below are perceptual hints only and never become the hit surface.
  islandLocatorIds: Object.freeze([]),
  hitAssistIds: Object.freeze(['BHR', 'BRN', 'ISR', 'KWT', 'LBN', 'MDV', 'PSE', 'QAT', 'SGP']),
  visibleMarkerIds: Object.freeze(['BHR', 'BRN', 'MDV', 'SGP']),
  callouts: Object.freeze({}),
  insets: Object.freeze([]),
"""
s = replace_once(s, old_asia, new_asia, 'Asia projected assistance policy')
s = replace_once(s,
"    cyprus: 'canonical Asia-owned CYP',",
"    cyprus: 'canonical Asia-owned CYP dissolved from pinned source CYP, Northern Cyprus and Cyprus No Mans Area geometry; Akrotiri and Dhekelia remain British sovereign-base context',",
'Cyprus boundary summary')
s = replace_once(s,
"    northernCyprus: 'non-scoring source context; no separate Atlas country identity',\n    cyprusNoMansArea: 'non-scoring Natural Earth context inside Cyprus; no separate Atlas country identity',",
"    northernCyprus: 'source-derived geometry reconciled into canonical CYP; no separate Atlas country identity',\n    cyprusNoMansArea: 'source-derived UN buffer geometry reconciled into canonical CYP; no separate Atlas country identity',\n    sovereignBaseAreas: 'Akrotiri and Dhekelia remain non-scoring British source context and are not absorbed into CYP',\n    assistance: 'max zoom 8; invisible hit assistance for BHR/BRN/ISR/KWT/LBN/MDV/PSE/QAT/SGP; restrained persistent visual markers only for BHR/BRN/MDV/SGP; no Asia question-triggered inset',",
'Asia source/assistance policy')
write(p, s)

# Projected generator: apply the global source merge before continent selection;
# consume those split features so they cannot also render as duplicate context.
p = 'scripts/map-generation-core.mjs'
s = read(p)
s = replace_once(s,
"import { MAP_CANVAS } from './map-continent-configs.mjs';",
"import { CANONICAL_SOURCE_GEOMETRY_MERGES, MAP_CANVAS } from './map-continent-configs.mjs';",
'generator policy import')
needle = """function normalizeStandardContinent(countriesSource, catalog, scoredCatalog, config) {
  const allIds = new Set(catalog.map((row) => row.id));
  const scoredIds = new Set(scoredCatalog.map((row) => row.id));
  const localContextIds = new Set(config.localContextCountryIds ?? []);
  const grouped = new Map();

  for (const sourceFeature of countriesSource.features) {
    const id = sourceCountryId(sourceFeature, allIds);
    if (!id) continue;
    const values = grouped.get(id) ?? [];
    values.push(sourceFeature);
    grouped.set(id, values);
  }

  const normalized = [];
"""
replacement = """function normalizeStandardContinent(countriesSource, catalog, scoredCatalog, config) {
  const allIds = new Set(catalog.map((row) => row.id));
  const scoredIds = new Set(scoredCatalog.map((row) => row.id));
  const localContextIds = new Set(config.localContextCountryIds ?? []);
  const grouped = new Map();

  for (const sourceFeature of countriesSource.features) {
    const id = sourceCountryId(sourceFeature, allIds);
    if (!id) continue;
    const values = grouped.get(id) ?? [];
    values.push(sourceFeature);
    grouped.set(id, values);
  }

  const consumedMergeFeatures = new Set();
  for (const [countryId, specs] of Object.entries(CANONICAL_SOURCE_GEOMETRY_MERGES)) {
    const parts = grouped.get(countryId) ?? [];
    if (!parts.length) throw new Error(`Natural Earth is missing canonical source geometry for ${countryId}.`);
    for (const spec of specs) {
      const matcher = new RegExp(spec.pattern, spec.flags ?? 'i');
      const matches = countriesSource.features.filter((sourceFeature) => matcher.test(sourceName(sourceFeature)));
      if (spec.required && matches.length !== 1) {
        throw new Error(`${countryId} source reconciliation ${spec.pattern} expected exactly one feature, found ${matches.length}.`);
      }
      for (const sourceFeature of matches) {
        if (!parts.includes(sourceFeature)) parts.push(sourceFeature);
        consumedMergeFeatures.add(sourceFeature);
      }
    }
    grouped.set(countryId, parts);
  }

  const normalized = [];
"""
s = replace_once(s, needle, replacement, 'projected source reconciliation')
s = replace_once(s,
"  for (const sourceFeature of countriesSource.features) {\n    if (String(sourceFeature.properties?.CONTINENT ?? '').toLowerCase() !== config.sourceContinent.toLowerCase()) continue;",
"  for (const sourceFeature of countriesSource.features) {\n    if (consumedMergeFeatures.has(sourceFeature)) continue;\n    if (String(sourceFeature.properties?.CONTINENT ?? '').toLowerCase() !== config.sourceContinent.toLowerCase()) continue;",
'consume reconciled context')
s = replace_once(s,
"  const islandLocators = new Set(config.islandLocatorIds ?? []);\n  const hitAssistIds = new Set(config.hitAssistIds ?? []);\n  for (const id of hitAssistIds) {\n    if (islandLocators.has(id)) {\n      throw new Error(`${config.displayName} ${id} cannot use both a visible locator and invisible hit assistance.`);\n    }\n  }",
"  const islandLocators = new Set(config.islandLocatorIds ?? []);\n  const hitAssistIds = new Set(config.hitAssistIds ?? []);\n  const visibleMarkerIds = new Set(config.visibleMarkerIds ?? []);\n  for (const id of hitAssistIds) {\n    if (islandLocators.has(id)) {\n      throw new Error(`${config.displayName} ${id} cannot use both a visible locator and invisible hit assistance.`);\n    }\n  }\n  for (const id of visibleMarkerIds) {\n    if (!hitAssistIds.has(id)) throw new Error(`${config.displayName} ${id} visible marker requires invisible hit assistance.`);\n    if (islandLocators.has(id)) throw new Error(`${config.displayName} ${id} cannot use both a locator and a canonical-position marker.`);\n  }",
'marker validation')
s = replace_once(s,
"""    if (item.properties?.role === 'country' && hitAssistIds.has(id)) {
      const anchor = poleOfInaccessibility(pathRings(countryPath));
      countryGeometry.hitAssist = {
        cx: Number(anchor.x.toFixed(2)),
        cy: Number(anchor.y.toFixed(2)),
        r: 7,
      };
    }
""",
"""    if (item.properties?.role === 'country' && hitAssistIds.has(id)) {
      const anchor = poleOfInaccessibility(pathRings(countryPath));
      countryGeometry.hitAssist = {
        cx: Number(anchor.x.toFixed(2)),
        cy: Number(anchor.y.toFixed(2)),
        r: 7,
      };
      if (visibleMarkerIds.has(id)) {
        countryGeometry.marker = {
          cx: Number(anchor.x.toFixed(2)),
          cy: Number(anchor.y.toFixed(2)),
          r: 3.2,
        };
      }
    }
""",
'generate persistent marker')
s = replace_once(s,
"    ...(Object.keys(geographicAudit).length ? { geographicAudit } : {}),\n    boundaryPolicy: {",
"    ...(Object.keys(geographicAudit).length ? { geographicAudit } : {}),\n    canonicalSourceGeometryMerges: CANONICAL_SOURCE_GEOMETRY_MERGES,\n    boundaryPolicy: {",
'projected provenance merge policy')
write(p, s)

# Spherical generator consumes the same source policy before simplification.
p = 'scripts/generate-globe-assets.mjs'
s = read(p)
s = replace_once(s,
"import { feature } from 'topojson-client';",
"import { feature, merge } from 'topojson-client';",
'globe merge import')
s = replace_once(s,
"import { MAP_GENERATION_CONFIGS } from './map-continent-configs.mjs';",
"import { CANONICAL_SOURCE_GEOMETRY_MERGES, MAP_GENERATION_CONFIGS } from './map-continent-configs.mjs';",
'globe policy import')
insert_after = """function resolveCountryId(properties, allowedIds) {
  for (const key of ID_CANDIDATES) {
    const id = String(properties?.[key] ?? '').trim().toUpperCase();
    if (allowedIds.has(id)) return id;
  }
  return null;
}
"""
helper = insert_after + """

function sourceFeatureName(sourceFeature) {
  const properties = sourceFeature?.properties ?? {};
  return String(
    properties.ADMIN ?? properties.NAME ?? properties.NAME_EN
    ?? properties.SOVEREIGNT ?? properties.GEOUNIT ?? properties.SUBUNIT ?? '',
  ).trim();
}

function reconcileCanonicalSourceFeatures(features, allowedIds) {
  const kept = features.filter((item) => resolveCountryId(item.properties, allowedIds));
  const byId = new Map();
  for (const sourceFeature of kept) {
    const id = resolveCountryId(sourceFeature.properties, allowedIds);
    const parts = byId.get(id) ?? [];
    parts.push(sourceFeature);
    byId.set(id, parts);
  }

  for (const [countryId, specs] of Object.entries(CANONICAL_SOURCE_GEOMETRY_MERGES)) {
    const canonicalParts = byId.get(countryId) ?? [];
    if (!canonicalParts.length) throw new Error(`Natural Earth is missing canonical globe geometry for ${countryId}.`);
    const parts = [...canonicalParts];
    for (const spec of specs) {
      const matcher = new RegExp(spec.pattern, spec.flags ?? 'i');
      const matches = features.filter((sourceFeature) => matcher.test(sourceFeatureName(sourceFeature)));
      if (spec.required && matches.length !== 1) {
        throw new Error(`${countryId} globe source reconciliation ${spec.pattern} expected exactly one feature, found ${matches.length}.`);
      }
      for (const match of matches) if (!parts.includes(match)) parts.push(match);
    }
    const rawTopology = topology({ parts: { type: 'FeatureCollection', features: parts } });
    const reconciledGeometry = merge(rawTopology, rawTopology.objects.parts.geometries);
    const primary = canonicalParts[0];
    const replacement = { ...primary, geometry: reconciledGeometry };
    for (let index = kept.length - 1; index >= 0; index -= 1) {
      if (resolveCountryId(kept[index].properties, allowedIds) === countryId) kept.splice(index, 1);
    }
    kept.push(replacement);
  }
  return kept;
}
"""
s = replace_once(s, insert_after, helper, 'globe source reconciliation helper')
s = replace_once(s,
"  const kept = source.features.filter((item) => resolveCountryId(item.properties, allowedIds));",
"  const kept = reconcileCanonicalSourceFeatures(source.features, allowedIds);",
'globe reconciled source set')
s = replace_once(s,
"    identityPolicy: ID_CANDIDATES,\n    encoding: 'delta-varint',",
"    identityPolicy: ID_CANDIDATES,\n    canonicalSourceGeometryMerges: CANONICAL_SOURCE_GEOMETRY_MERGES,\n    encoding: 'delta-varint',",
'globe merge provenance')
write(p, s)

# Renderer: resolved countries remain selectable while the NEW current target is
# unresolved; persistent hit assists join the existing below-polygons assist layer.
p = 'src/ui/components/map.ts'
s = read(p)
s = replace_once(s,
"  const isSelectable = (countryId: string): boolean =>\n    interactive && !currentTargetResolved && !session.targets[countryId]?.resolved;",
"  const isSelectable = (_countryId: string): boolean =>\n    interactive && !currentTargetResolved;",
'global selectability')
s = replace_once(s,
"    const selectable = interactive && !currentTargetResolved && !state?.resolved;",
"    const selectable = interactive && !currentTargetResolved;",
'country selectability')
s = replace_once(s,
"        ${geometry.path ? `<path class=\"map-country__shape\" d=\"${geometry.path}\" />` : ''}\n        ${geometry.locator ? `",
"        ${geometry.path ? `<path class=\"map-country__shape\" d=\"${geometry.path}\" />` : ''}\n        ${geometry.marker ? `<circle class=\"map-country__marker\" cx=\"${geometry.marker.cx}\" cy=\"${geometry.marker.cy}\" r=\"${geometry.marker.r}\" aria-hidden=\"true\" />` : ''}\n        ${geometry.locator ? `",
'render marker')
s = replace_once(s,
"      const marks: { r: number; markup: string }[] = [];\n      if (geometry.locator) {",
"      const marks: { r: number; markup: string }[] = [];\n      if (geometry.hitAssist) {\n        marks.push({\n          r: geometry.hitAssist.r,\n          markup: `<circle class=\"map-country__assisted-hit\" cx=\"${geometry.hitAssist.cx}\" cy=\"${geometry.hitAssist.cy}\" r=\"${Math.max(geometry.hitAssist.r, 22)}\" data-map-hit data-map-hit-min=\"${geometry.hitAssist.r}\" />`,\n        });\n      }\n      if (geometry.locator) {",
'persistent hit assists')
s = replace_once(s,
'        data-map-max-zoom="5.5"',
'        data-map-max-zoom="${asset.maxZoom ?? 5.5}"',
'generic zoom ceiling')
write(p, s)

# New assist circles are inserted on every prompt rerender. Re-normalise their
# CSS-pixel hit size without resetting the remembered viewBox.
p = 'src/map-viewport.ts'
s = read(p)
s = replace_once(s,
"  const viewports = root ? [...root.querySelectorAll<HTMLElement>('[data-map-viewport]')] : [];\n  for (const viewport of viewports) positionViewport(viewport);",
"  const viewports = root ? [...root.querySelectorAll<HTMLElement>('[data-map-viewport]')] : [];\n  for (const viewport of viewports) {\n    if (viewport.dataset.mapPositioned === 'true') {\n      const box = currentBox(viewport);\n      if (box) applyBox(viewport, box, false);\n    } else {\n      positionViewport(viewport);\n    }\n  }",
'renormalise rerendered hits')
s = replace_once(s,
"  new MutationObserver(discoverViewports).observe(root, { childList: true, subtree: true });",
"  // React reuses the question-specific assist circle between prompts and\n  // updates its data-id/radius in place. Observe that identity change as well\n  // as inserted nodes so every new target is normalised back to 44 CSS px.\n  new MutationObserver(discoverViewports).observe(root, {\n    childList: true,\n    subtree: true,\n    attributes: true,\n    attributeFilter: ['data-id', 'cx', 'cy'],\n  });",
'renormalise reused prompt hit')
write(p, s)

# Styling: markers follow the country state, but never become a hit surface.
for p in ['src/styles/map.css', 'src/styles/map-cartography.css']:
    s = read(p)
    s = re.sub(
        r'(?m)^([^\n]*?)\.map-country__locator,\s*$',
        lambda m: f"{m.group(0)}\n{m.group(1)}.map-country__marker,",
        s,
    )
    write(p, s)

p = 'src/styles/map.css'
s = read(p)
s = replace_once(s,
".map-country__locator-hit,\n.map-country__callout-hit,\n.map-current-target-hit {",
".map-country__assisted-hit,\n.map-country__locator-hit,\n.map-country__callout-hit,\n.map-current-target-hit {",
'assist transparency')
s = replace_once(s,
".map-country__locator-hit,\n.map-country__callout-hit { pointer-events: none; }",
".map-country__assisted-hit,\n.map-country__locator-hit,\n.map-country__callout-hit { pointer-events: none; }",
'assist default pointer state')
s = replace_once(s,
".map-country[data-action=\"map-answer\"] .map-country__locator-hit,\n.map-country[data-action=\"map-answer\"] .map-country__callout-hit { pointer-events: all; }",
".map-country[data-action=\"map-answer\"] .map-country__locator-hit,\n.map-country[data-action=\"map-answer\"] .map-country__callout-hit,\n.map-assist-hits [data-action=\"map-answer\"] .map-country__assisted-hit { pointer-events: all; }",
'assist active pointer state')
write(p, s)

# Update the existing deterministic Asia verifier rather than creating a parallel
# cartography verification system.
p = 'scripts/verify-asia-expansion.mjs'
s = read(p)
s = replace_once(s,
"assert.deepEqual(locatorIds, ['BHR', 'MDV', 'SGP'], 'Initial visible locator policy is limited to Bahrain, Maldives and Singapore.');",
"assert.deepEqual(locatorIds, [], 'Asia keeps canonical small-country polygons instead of substituting visible locators.');\nconst hitAssistIds = Object.values(ASIA_GEOMETRY)\n  .filter((geometry) => geometry.hitAssist)\n  .map((geometry) => geometry.countryId)\n  .sort();\nassert.deepEqual(hitAssistIds, ['BHR', 'BRN', 'ISR', 'KWT', 'LBN', 'MDV', 'PSE', 'QAT', 'SGP']);\nconst markerIds = Object.values(ASIA_GEOMETRY)\n  .filter((geometry) => geometry.marker)\n  .map((geometry) => geometry.countryId)\n  .sort();\nassert.deepEqual(markerIds, ['BHR', 'BRN', 'MDV', 'SGP'], 'Only the audited island/split-island set receives a restrained perceptual marker.');",
'Asia assist verifier')
s = replace_once(s,
"assert.equal('rivers' in (asiaAsset.water ?? {}), false, 'Asia inherits the global no-rivers policy.');",
"assert.equal('rivers' in (asiaAsset.water ?? {}), false, 'Asia inherits the global no-rivers policy.');\nassert.equal(asiaAsset.maxZoom, 8, 'Asia exposes its evidence-based zoom ceiling through generic map metadata.');\nassert.deepEqual(middleEastAsset.insets, [], 'Middle East has no question-triggered Levant popup.');",
'Asia runtime verifier')
s = replace_once(s,
"assert.match(provenance.boundaryPolicy.kashmir, /no handwritten override/);",
"assert.match(provenance.boundaryPolicy.kashmir, /no handwritten override/);\nassert.deepEqual(provenance.canonicalSourceGeometryMerges.CYP.map((item) => item.pattern), ['^Northern Cyprus$', '^Cyprus No Mans Area$']);\nassert.match(provenance.boundaryPolicy.cyprus, /Northern Cyprus and Cyprus No Mans Area/);\nassert.match(provenance.boundaryPolicy.sovereignBaseAreas, /Akrotiri and Dhekelia/);\nassert.match(provenance.boundaryPolicy.assistance, /no Asia question-triggered inset/);",
'Cyprus provenance verifier')
s = replace_once(s,
"const loaderSource = await readFile('src/data/maps/index.ts', 'utf8');",
"const globeProvenance = JSON.parse(await readFile('src/data/globe/provenance.json', 'utf8'));\nassert.deepEqual(globeProvenance.canonicalSourceGeometryMerges, provenance.canonicalSourceGeometryMerges, 'Projected and spherical generators publish the same canonical Cyprus source-reconciliation policy.');\nconst outlineSource = await readFile('src/data/outlines.ts', 'utf8');\nassert.match(outlineSource, /loadMapAsset/, 'Outlines continue to consume canonical generated map geometry, including corrected CYP.');\nconst mapRendererSource = await readFile('src/ui/components/map.ts', 'utf8');\nassert.doesNotMatch(mapRendererSource, /!session\.targets\[countryId\]\?\.resolved/, 'A country resolved earlier in the round remains selectable against a later target.');\nassert.match(mapRendererSource, /data-map-max-zoom=\\\"\$\{asset\.maxZoom \?\? 5\.5\}\\\"/, 'The renderer consumes generic asset maxZoom metadata.');\nconst loaderSource = await readFile('src/data/maps/index.ts', 'utf8');",
'cross-surface verifier')
write(p, s)

# Focused exact-production browser acceptance. This complements, rather than
# replaces, the established shared pointer/inset/NA/Oceania suites.
write('tests/browser/asia-hardening.spec.ts', r'''import { expect, test, type Page } from '@playwright/test';
import { COUNTRIES } from '../../src/data/countries.js';

const ASSIST_IDS = ['BHR', 'BRN', 'ISR', 'KWT', 'LBN', 'MDV', 'PSE', 'QAT', 'SGP'] as const;
const MARKER_IDS = ['BHR', 'BRN', 'MDV', 'SGP'] as const;

function idForName(name: string): string {
  const country = COUNTRIES.find((item) => item.name === name);
  if (!country) throw new Error(`Unknown country prompt: ${name}`);
  return country.id;
}

async function openScope(page: Page, route: string, label: string) {
  await page.goto(route);
  await page.getByRole('button', { name: label }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
}

async function currentId(page: Page): Promise<string> {
  return idForName(await page.locator('#map-prompt-heading').innerText());
}

async function answerKeyboard(page: Page, id: string) {
  const country = page.locator(`.map-country[data-id="${id}"]`);
  await expect(country).toHaveAttribute('data-action', 'map-answer');
  await country.focus();
  await country.press('Enter');
}

async function waitForAdvance(page: Page, previousName: string) {
  await expect.poll(() => page.locator('#map-prompt-heading').innerText(), { timeout: 15_000 }).not.toBe(previousName);
}

async function actionablePoint(page: Page, id: string): Promise<{ x: number; y: number }> {
  const hit = page.locator(`.map-assist-hits [data-id="${id}"] .map-country__assisted-hit`);
  await expect(hit).toBeVisible();
  const box = await hit.boundingBox();
  if (!box) throw new Error(`No assist box for ${id}`);
  for (let rows = 5; rows <= 13; rows += 2) {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < rows; x += 1) {
        const point = {
          x: box.x + ((x + 0.5) / rows) * box.width,
          y: box.y + ((y + 0.5) / rows) * box.height,
        };
        const owner = await page.evaluate(({ x: px, y: py }) =>
          document.elementFromPoint(px, py)?.closest('[data-action="map-answer"]')?.getAttribute('data-id') ?? null,
        point);
        if (owner === id) return point;
      }
    }
  }
  throw new Error(`${id} has no exposed assisted hit point after real-geography precedence`);
}

async function assertAssistContracts(page: Page, expectedIds: readonly string[]) {
  const renderedIds = await page.locator('.map-assist-hits [data-id]').evaluateAll((groups) =>
    groups.map((group) => group.getAttribute('data-id')).filter(Boolean).sort(),
  );
  expect(renderedIds).toEqual([...expectedIds].sort());
  for (const id of expectedIds) {
    const hit = page.locator(`.map-assist-hits [data-id="${id}"] .map-country__assisted-hit`);
    await expect(hit).toHaveCount(1);
    const diameter = await hit.evaluate((circle) => {
      const item = circle as SVGCircleElement;
      const matrix = item.getScreenCTM();
      if (!matrix) return null;
      const radius = item.r.baseVal.value;
      return { x: radius * 2 * Math.hypot(matrix.a, matrix.b), y: radius * 2 * Math.hypot(matrix.c, matrix.d) };
    });
    expect(diameter, `${id} assist has a screen transform`).not.toBeNull();
    expect(Math.min(diameter!.x, diameter!.y), `${id} assist keeps the shared 44px contract`).toBeGreaterThanOrEqual(43.5);
    await actionablePoint(page, id);
  }
}

for (const viewport of [
  { name: '320 portrait', width: 320, height: 568 },
  { name: '390 portrait', width: 390, height: 844 },
  { name: 'short landscape', width: 844, height: 390 },
]) {
  test(`Asia max zoom is useful for small targets at ${viewport.name}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openScope(page, '/#/locations/asia', 'Play Asia');
    const map = page.locator('[data-map-viewport]');
    await expect(map).toHaveAttribute('data-map-max-zoom', '8');
    const auditedIds = ['ARM', 'AZE', 'GEO', 'LBN', 'PSE', 'BHR', 'SGP', 'BRN', 'MDV'];
    const opening: Record<string, number> = {};
    for (const id of auditedIds) {
      const shape = page.locator(`.map-country[data-id="${id}"] .map-country__shape`);
      const initial = await shape.boundingBox();
      expect(initial, `${id} has canonical projected geometry`).not.toBeNull();
      opening[id] = Math.min(initial!.width, initial!.height);
    }
    const arm = page.locator('.map-country[data-id="ARM"] .map-country__shape');
    const initialArm = await arm.boundingBox();
    for (let index = 0; index < 12; index += 1) {
      await page.mouse.move(initialArm!.x + initialArm!.width / 2, initialArm!.y + initialArm!.height / 2);
      await page.mouse.wheel(0, -900);
    }
    const finalArm = await arm.boundingBox();
    expect(finalArm).not.toBeNull();
    const finalArmMin = Math.min(finalArm!.width, finalArm!.height);
    expect(finalArmMin, 'Armenia grows materially at the configured maximum zoom').toBeGreaterThan(opening.ARM * 1.35);
    console.log(`ISSUE137_ZOOM ${viewport.width}x${viewport.height} ${JSON.stringify({ opening, armAtMax: finalArmMin })}`);
  });
}

test('Asia removes the Levant popup and keeps truthful persistent assistance', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openScope(page, '/#/locations/asia/middle-east', 'Learn Middle East');
  await expect(page.locator('[data-map-inset]')).toHaveCount(0);
  for (const id of ['LBN', 'ISR', 'PSE']) await expect(page.locator(`.map-country[data-id="${id}"] .map-country__shape`)).toHaveCount(1);
  for (const id of MARKER_IDS.filter((id) => ['BHR'].includes(id))) await expect(page.locator(`.map-country[data-id="${id}"] .map-country__marker`)).toHaveCount(1);
  await assertAssistContracts(page, ['BHR', 'ISR', 'KWT', 'LBN', 'PSE', 'QAT']);
});

test('feedback rerender preserves shared hit sizes and previously answered countries remain guesses', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openScope(page, '/#/locations/asia', 'Learn Asia');
  await assertAssistContracts(page, ASSIST_IDS);
  const firstName = await page.locator('#map-prompt-heading').innerText();
  const first = idForName(firstName);
  await answerKeyboard(page, first);
  await expect(page.locator('[data-action="map-answer"]')).toHaveCount(0);
  await waitForAdvance(page, firstName);
  await assertAssistContracts(page, ASSIST_IDS);
  await expect(page.locator(`.map-country[data-id="${first}"]`)).toHaveAttribute('data-action', 'map-answer');
  await page.locator(`.map-country[data-id="${first}"]`).focus();
  await page.locator(`.map-country[data-id="${first}"]`).press('Enter');
  await expect(page.locator(`.map-country[data-id="${first}"]`)).toHaveClass(/map-country--wrong-pulse/);
});

test('an assisted country resolved earlier remains a normal wrong guess in a region round', async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await openScope(page, '/#/locations/asia/southeast-asia', 'Learn Southeast Asia');
  for (let index = 0; index < 11; index += 1) {
    const name = await page.locator('#map-prompt-heading').innerText();
    const id = idForName(name);
    if (id === 'BRN' || id === 'SGP') {
      const point = await actionablePoint(page, id);
      await page.mouse.click(point.x, point.y);
      await expect(page.locator('[data-action="map-answer"]')).toHaveCount(0);
      await waitForAdvance(page, name);
      const wrongPoint = await actionablePoint(page, id);
      await page.mouse.click(wrongPoint.x, wrongPoint.y);
      await expect(page.locator(`.map-country[data-id="${id}"]`)).toHaveClass(/map-country--wrong-pulse/);
      return;
    }
    await answerKeyboard(page, id);
    await waitForAdvance(page, name);
  }
  throw new Error('No assisted Southeast Asia country encountered');
});

test('Play also re-enables the previous country only after advance', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openScope(page, '/#/locations/asia/caucasus', 'Play Caucasus');
  const firstName = await page.locator('#map-prompt-heading').innerText();
  const first = idForName(firstName);
  await answerKeyboard(page, first);
  await expect(page.locator('[data-action="map-answer"]')).toHaveCount(0);
  await waitForAdvance(page, firstName);
  const previous = page.locator(`.map-country[data-id="${first}"]`);
  await expect(previous).toHaveAttribute('data-action', 'map-answer');
  await previous.focus();
  await previous.press('Enter');
  await expect(page.locator('.answer-feedback--wrong')).toBeVisible();
});

for (const viewport of [{ width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
  test(`Asia projected map remains contained at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openScope(page, '/#/locations/asia/south-asia', 'Play South Asia');
    await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-max-zoom', '8');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
''')

# Concise architecture note. Final closeout evidence is added only after the
# candidate passes the exact-production gate.
p = 'docs/architecture/cartography.md'
s = read(p)
section = """

## Canonical Cyprus reconciliation

Atlas still uses one pinned Natural Earth 1:10m country source and one ISO3 identity, `CYP`. Natural Earth's default view splits Northern Cyprus and the Cyprus No Mans Area from the canonical Cyprus feature. The generator therefore dissolves those two pinned source-derived pieces back into canonical `CYP` before either projected-map or spherical-globe simplification. Northern Cyprus does not become a scoring country.

Akrotiri and Dhekelia remain non-scoring British Sovereign Base Area source context; they are not silently assigned to `CYP`. The reconciliation policy lives in `scripts/map-continent-configs.mjs` and is consumed by both canonical generators so Locations, Outlines and Spatial Atlas cannot drift to different Cyprus silhouettes.
"""
if '## Canonical Cyprus reconciliation' not in s:
    s += section
write(p, s)

# Historical record is finalised by the acceptance workflow with measured evidence.
write('docs/closed/issue-137-asia-location-hardening.md', '''# Issue #137 — Asia Locations hardening

## Post-Spatial reconciliation

The retained pre-Spatial `issue-137-asia-location-hardening` branch was reviewed commit-by-commit as evidence only. Its globe/touch implementation was discarded because Issue #166 already owns Spatial pointer handling, LOD-derived interaction envelopes and tiny-country picking. This implementation was rebuilt from production `main` `459354feeb88fbec010e339efe3dacd9c37749b9`.

## Accepted architecture

- Asia projected Locations owns an evidence-based `8x` zoom ceiling through generic continent metadata; Russia remains rendered context and remains excluded only from Asia fit per #116.
- The question-triggered Eastern Mediterranean inset is removed. Lebanon, Israel and Palestine remain at canonical geography.
- Projected invisible hit assistance is shared generator/runtime machinery. Final Asia inventory: `BHR`, `BRN`, `ISR`, `KWT`, `LBN`, `MDV`, `PSE`, `QAT`, `SGP`. Restrained persistent perceptual markers exist only for `BHR`, `BRN`, `MDV`, `SGP`; they are not hit surfaces.
- Real scoring polygons paint above all assistance, preserving #117 precedence. Newly rendered hit circles are re-normalised to the shared approximately 44 CSS px contract without resetting pan/zoom state.
- Previously answered countries remain selectable against later prompts in Learn and Play. Once the current target resolves, all answer input remains locked during feedback/advance exactly as before.
- Canonical `CYP` is source-reconciled from pinned Natural Earth `CYP` + Northern Cyprus + Cyprus No Mans Area before projected or spherical simplification. Akrotiri and Dhekelia remain British non-scoring context. No handwritten geometry or second source exists.

## Verification

Acceptance evidence is recorded in Issue #137 and PR #173. The technical gate includes deterministic map/globe regeneration, `npm run check`, full `npm test`, focused exact-production browser acceptance at 320x568, 390x844, 844x390, tablet portrait and desktop, shared map regressions for North America/Oceania, and Spatial regressions because canonical globe geography changes. No physical-device testing is claimed; physical mobile validation remains #71.
''')

# History records the architectural outcome, not transient runner details.
p = 'docs/history.md'
s = read(p)
entry = """

### Issue #137 — Asia Locations hardening after Spatial cutover

Reimplemented the surviving Asia Locations work from the post-Spatial production baseline: generic Asia max zoom, removal of the Levant question popup, shared invisible projected hit assistance, canonical source-derived Cyprus reconciliation shared with the globe, and restored selectability of countries answered earlier in a round. Spatial interaction behaviour from #166 remains authoritative and unchanged.
"""
if '### Issue #137 — Asia Locations hardening after Spatial cutover' not in s:
    s += entry
write(p, s)
