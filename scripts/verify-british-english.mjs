import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES, COUNTRY_BY_ID } from '../dist/data/countries.js';
import { AFRICA_MAP_COUNTRY_IDS } from '../dist/data/map-scopes.js';
import { loadMapAsset } from '../dist/data/maps/index.js';
import { loadOutlineAsset } from '../dist/data/outlines.js';
import { AFRICA_LAND_ADJACENCY } from '../dist/data/neighbors/index.js';
import { domainDisplayName } from '../dist/domain/display.js';
import { buildMapSession, createInitialLocationProgress } from '../dist/domain/map-game.js';
import { buildNeighborSession, createInitialNeighborProgress } from '../dist/domain/neighbor-game.js';
import { deriveNeighborMapModel } from '../dist/domain/neighbor-map.js';
import { buildOutlineQuiz } from '../dist/domain/outline.js';
import { createInitialProgress } from '../dist/domain/progress.js';
import { buildQuiz } from '../dist/domain/quiz.js';
import { parseRoutePath, routeTitle, serializeRoutePath } from '../dist/routing/routes.js';
import { neighborMapSummary, renderNeighborMap } from '../dist/ui/components/neighbor-map.js';
import { renderDomainHome } from '../dist/ui/views/domain.js';
import { renderHome } from '../dist/ui/views/home.js';
import { renderMapHome } from '../dist/ui/views/map-home.js';
import { renderMapQuiz } from '../dist/ui/views/map-quiz.js';
import { renderNeighborHome } from '../dist/ui/views/neighbor-home.js';
import { renderNeighborQuiz } from '../dist/ui/views/neighbor-quiz.js';
import { renderOutlineHome } from '../dist/ui/views/outline-home.js';
import { renderOutlineQuiz } from '../dist/ui/views/outline-quiz.js';
import { renderProgress } from '../dist/ui/views/progress.js';
import { renderQuiz } from '../dist/ui/views/quiz.js';
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
assert.equal(neighborRoute.activity, 'test', 'Play remains backed by the stable internal Test activity.');
assert.equal(routeTitle(neighborRoute), 'Play West Africa neighbours · Atlas');

const homeHtml = renderHome(flagProgress, locationProgress, outlineProgress, neighborProgress);
const flagsDomainHtml = renderDomainHome('flags', flagProgress);
const flagsLauncherHtml = renderScope(flagProgress, africaScope);
const locationsLauncherHtml = renderMapHome(locationProgress, africaScope);
const outlinesLauncherHtml = renderOutlineHome(outlineProgress, africaScope);
const neighborsLauncherHtml = renderNeighborHome(neighborProgress, westAfricaScope);
const progressHtml = renderProgress(flagProgress);

const flagQuestions = buildQuiz({
  countries: COUNTRIES,
  progress: flagProgress,
  scope: africaScope,
  mode: 'test',
  size: 1,
  sessionId: 'british-flag-play',
});
const flagPlaySession = {
  id: 'british-flag-play',
  mode: 'test',
  scope: africaScope,
  startedAt: '2026-08-19T12:00:00.000Z',
  questions: flagQuestions,
  currentIndex: 0,
  attempts: [],
};

const asset = await loadMapAsset('africa');
assert.ok(asset, 'Canonical Africa map asset is available for Play and Neighbours accessibility-copy contracts.');
const mapPlaySession = buildMapSession(asset, 'test', 'british-map-play', ['GHA']);

const outlineAsset = await loadOutlineAsset('africa');
assert.ok(outlineAsset, 'Canonical Africa outline asset is available for learner-facing Play copy.');
const outlineQuestions = buildOutlineQuiz({
  countries: COUNTRIES,
  progress: outlineProgress,
  scope: africaScope,
  mode: 'test',
  size: 1,
  sessionId: 'british-outline-play',
  asset: outlineAsset,
});
const outlinePlaySession = {
  id: 'british-outline-play',
  mode: 'test',
  scope: africaScope,
  startedAt: '2026-08-19T12:00:00.000Z',
  questions: outlineQuestions,
  currentIndex: 0,
  attempts: [],
};

const neighborPlaySession = buildNeighborSession(
  AFRICA_LAND_ADJACENCY,
  neighborProgress,
  westAfricaScope,
  ['GHA'],
  'test',
  'british-copy',
  1,
  ['GHA'],
);
const flagPlayHtml = renderQuiz(flagPlaySession, flagProgress, null);
const mapPlayHtml = renderMapQuiz(asset, mapPlaySession, null);
const outlinePlayHtml = renderOutlineQuiz(outlineAsset, outlinePlaySession, outlineProgress, null);
const neighborPlayHtml = renderNeighborQuiz(neighborPlaySession, null, '');

const renderedSurfaces = [
  ['Home', homeHtml],
  ['Flags domain', flagsDomainHtml],
  ['Flags launcher', flagsLauncherHtml],
  ['Locations launcher', locationsLauncherHtml],
  ['Outlines launcher', outlinesLauncherHtml],
  ['Neighbours launcher', neighborsLauncherHtml],
  ['Progress', progressHtml],
  ['Flags Play quiz', flagPlayHtml],
  ['Locations Play quiz', mapPlayHtml],
  ['Outlines Play quiz', outlinePlayHtml],
  ['Neighbours Play quiz', neighborPlayHtml],
];

assert.ok(flagsDomainHtml.includes('Play world'));
assert.ok(flagsLauncherHtml.includes('Play Africa'));
assert.ok(locationsLauncherHtml.includes('Play Africa'));
assert.ok(outlinesLauncherHtml.includes('Play Africa'));
assert.ok(neighborsLauncherHtml.includes('Play West Africa'));
assert.equal(progressHtml.includes('Never tested'), false, 'Progress does not expose obsolete assessment-centric history copy.');
assert.ok(progressHtml.includes('Not practised yet'), 'Fresh progress uses British learner-facing practice copy.');
for (const [name, html] of [
  ['Flags', flagPlayHtml],
  ['Locations', mapPlayHtml],
  ['Outlines', outlinePlayHtml],
  ['Neighbours', neighborPlayHtml],
]) {
  assert.match(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '), /\bPlay\b/, `${name} Test-mode engine state is presented to learners as Play.`);
}
assert.ok(neighborPlayHtml.includes('Name every land-border neighbour'));
assert.ok(neighborPlayHtml.includes('neighbours found'));

const target = neighborPlaySession.targets.GHA;
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
  const visibleText = surface.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  assert.equal(/\bTest\b/.test(visibleText), false, `${name} exposes internal Test terminology as visible learner copy.`);
  assert.equal(/aria-label="[^"]*\bTest\b/i.test(surface), false, `${name} exposes internal Test terminology in an accessible name.`);
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
  ' neighbors · Atlas',
];
for (const phrase of appForbiddenPhrases) {
  assert.equal(app.includes(phrase), false, `Built app live/document copy contains American-English phrase: ${phrase}`);
}
assert.ok(app.includes('land-neighbour targets'));
assert.ok(app.includes('Remaining neighbours:'));
assert.ok(app.includes('Neighbour round complete'));
for (const action of ['start-test', 'start-map-test', 'start-outline-test', 'start-neighbor-test']) {
  assert.ok(app.includes(action), `Built orchestration retains stable internal action identifier ${action}.`);
}
assert.ok(app.includes("mode === 'test'"), 'Built orchestration retains Test as the internal engine mode.');
for (const learnerPhrase of ['Test round', 'Repeat test']) {
  assert.equal(app.includes(learnerPhrase), false, `Built app does not expose obsolete learner phrase: ${learnerPhrase}`);
}
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
assert.ok(serviceWorker.includes("const VERSION = 'flag-atlas-v16'"), 'Atlas learner-facing brand rollout invalidates the previous PWA cache.');
assert.ok(serviceWorker.includes("'./atlas-theme.css'"), 'Tactile Atlas styling remains part of the offline shell.');
assert.ok(serviceWorker.includes("'./neighbors.css'"), 'Technical stylesheet filename remains stable.');

console.log('British-English verification passed: learner-facing Play copy, internal /test compatibility, rendered UI, titles, Neighbours accessibility text, metadata, storage, and v16 Atlas brand cache contract.');
