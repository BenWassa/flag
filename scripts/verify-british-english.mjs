import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES, COUNTRY_BY_ID } from '../dist/data/countries.js';
import { AFRICA_MAP_COUNTRY_IDS } from '../dist/data/map-scopes.js';
import { loadMapAsset } from '../dist/data/maps/index.js';
import { AFRICA_LAND_ADJACENCY } from '../dist/data/neighbors/index.js';
import { domainDisplayName } from '../dist/domain/display.js';
import { createInitialLocationProgress } from '../dist/domain/map-game.js';
import { buildNeighborSession, createInitialNeighborProgress } from '../dist/domain/neighbor-game.js';
import { deriveNeighborMapModel } from '../dist/domain/neighbor-map.js';
import { createInitialProgress } from '../dist/domain/progress.js';
import { parseRoutePath, routeTitle, serializeRoutePath } from '../dist/routing/routes.js';
import { neighborMapSummary, renderNeighborMap } from '../dist/ui/components/neighbor-map.js';
import { renderDomainHome } from '../dist/ui/views/domain.js';
import { renderHome } from '../dist/ui/views/home.js';
import { renderNeighborHome } from '../dist/ui/views/neighbor-home.js';
import { renderNeighborQuiz } from '../dist/ui/views/neighbor-quiz.js';
import { renderOutlineHome } from '../dist/ui/views/outline-home.js';
import { renderScope } from '../dist/ui/views/scope.js';

const flagProgress = createInitialProgress(COUNTRIES);
const locationProgress = createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS);
const outlineProgress = createInitialProgress(COUNTRIES.filter((country) => AFRICA_MAP_COUNTRY_IDS.includes(country.id)));
const neighborProgress = createInitialNeighborProgress(Object.keys(AFRICA_LAND_ADJACENCY));
const africaScope = { kind: 'continent', id: 'africa', label: 'Africa' };
const westAfricaScope = { kind: 'region', id: 'west-africa', label: 'West Africa' };

assert.equal(domainDisplayName('neighbors'), 'Neighbours', 'Stable internal domain id maps to the British learner-facing label.');
assert.equal(domainDisplayName('flags'), 'Flags');
assert.equal(domainDisplayName('locations'), 'Locations');
assert.equal(domainDisplayName('outlines'), 'Outlines');

const neighborRoute = parseRoutePath('/neighbors/africa/west-africa/test');
assert.ok(neighborRoute && neighborRoute.name === 'learning' && neighborRoute.domain === 'neighbors');
assert.equal(serializeRoutePath(neighborRoute), '/neighbors/africa/west-africa/test', 'British display copy must not migrate the stable route API.');
assert.equal(routeTitle(neighborRoute), 'Test West Africa neighbours · Flag Atlas');

const renderedSurfaces = [
  ['Home', renderHome(flagProgress, locationProgress, outlineProgress, neighborProgress)],
  ['Neighbours domain', renderDomainHome('neighbors', flagProgress, locationProgress, outlineProgress, neighborProgress)],
  ['Flags scope', renderScope(flagProgress, africaScope)],
  ['Outlines scope', renderOutlineHome(outlineProgress, africaScope)],
  ['Neighbours scope', renderNeighborHome(neighborProgress, westAfricaScope)],
];

const neighborSession = buildNeighborSession(
  AFRICA_LAND_ADJACENCY,
  neighborProgress,
  westAfricaScope,
  ['GHA'],
  'learn',
  'british-copy',
  1,
  ['GHA'],
);
renderedSurfaces.push(['Neighbours quiz', renderNeighborQuiz(neighborSession, null, '')]);

assert.ok(renderedSurfaces[0][1].includes('where to practise it.'), 'Practise remains the verb on Home.');
assert.ok(renderedSurfaces[2][1].includes('unseen prioritised'), 'Flag scope uses the adopted -ise product style.');
assert.ok(renderedSurfaces[3][1].includes('unseen prioritised'), 'Outline scope uses the adopted -ise product style.');
const scopeSource = await readFile('dist/ui/views/scope.js', 'utf8');
assert.ok(scopeSource.includes('Adaptive practice'), 'Practice remains the noun in adaptive-practice copy.');
assert.ok(renderedSurfaces[5][1].includes('Name every land-border neighbour'));
assert.ok(renderedSurfaces[5][1].includes('neighbours found'));

const asset = await loadMapAsset('africa');
assert.ok(asset, 'Canonical Africa map asset is available for the Neighbours accessibility-copy contract.');
const target = neighborSession.targets.GHA;
const mapModel = deriveNeighborMapModel(asset, {
  targetId: target.countryId,
  neighborIds: target.neighborIds,
  foundIds: target.foundIds,
  revealedIds: target.revealedIds,
}, (id) => COUNTRY_BY_ID.get(id)?.name ?? id);
const mapHtml = renderNeighborMap(asset, mapModel, 'british-copy:GHA', '|');
const mapSummary = neighborMapSummary(mapModel);
renderedSurfaces.push(['Neighbours map', mapHtml], ['Neighbours map summary', mapSummary]);
assert.ok(mapHtml.includes('Unresolved neighbouring country'));
assert.ok(mapSummary.includes('neighbours found'));
assert.ok(mapSummary.includes('unresolved neighbouring countries'));

const forbiddenRenderedPatterns = [
  /\bNeighbors\b/,
  /\bNeighbor\b/,
  /\bneighbors found\b/i,
  /\bneighboring countr(?:y|ies)\b/i,
  /\bland-border neighbor\b/i,
  /\bland neighbor\b/i,
  /\bneighbor learning status\b/i,
  /\bneighbor progress\b/i,
  /\bneighbor results\b/i,
  /\bneighbor round\b/i,
  /\bneighbor set\b/i,
  /\bzero-neighbor\b/i,
  /\bunseen prioritized\b/i,
  /\bresults summarized\b/i,
];

for (const [name, surface] of renderedSurfaces) {
  for (const pattern of forbiddenRenderedPatterns) {
    assert.equal(pattern.test(surface), false, `${name} contains American-English product copy matching ${pattern}.`);
  }
}

const app = await readFile('dist/app.js', 'utf8');
const appForbiddenPhrases = [
  'land-neighbor targets',
  ' neighbors. ',
  'land neighbor of',
  'Remaining neighbors:',
  ' neighbors found.',
  'neighbor set.',
  'neighbor progress erased',
  'Neighbor round complete',
  ' neighbors · Flag Atlas',
];
for (const phrase of appForbiddenPhrases) {
  assert.equal(app.includes(phrase), false, `Built app live/document copy contains American-English phrase: ${phrase}`);
}
assert.ok(app.includes('land-neighbour targets'));
assert.ok(app.includes('Remaining neighbours:'));
assert.ok(app.includes('Neighbour round complete'));
assert.ok(app.includes("behavior: 'instant'"), 'DOM scrollTo behavior is a Web API property and remains intentionally American-spelled.');

const index = await readFile('dist/index.html', 'utf8');
assert.ok(index.includes('<html lang="en-GB">'), 'The document declares British English for browser and assistive-technology language handling.');
assert.ok(index.includes('land-border neighbours'), 'Install/search-facing HTML description uses British English.');

const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
assert.equal(manifest.lang, 'en-GB');
assert.ok(manifest.description.includes('focused practice'), 'Practice is correctly retained as a noun in install metadata.');
assert.ok(Object.hasOwn(manifest, 'background_color') && Object.hasOwn(manifest, 'theme_color'), 'Manifest API field names remain standards-compliant technical identifiers.');

const storage = await readFile('dist/infrastructure/neighbor-storage.js', 'utf8');
assert.ok(storage.includes('flag-atlas:neighbor-progress:v1'), 'Existing Neighbours progress namespace remains backwards-compatible.');
assert.ok(storage.includes('flag-atlas:neighbor-attempts:v1'), 'Existing Neighbours attempt namespace remains backwards-compatible.');

const serviceWorker = await readFile('dist/sw.js', 'utf8');
assert.ok(serviceWorker.includes("const VERSION = 'flag-atlas-v13'"), 'Copy-bearing shell changes invalidate the previous PWA cache.');
assert.ok(serviceWorker.includes("'./neighbors.css'"), 'Technical stylesheet filename remains stable.');

console.log('British-English verification passed: rendered UI, document titles, live copy, Neighbours map accessibility text, metadata, route/storage compatibility, noun/verb usage, and PWA cache contract.');
