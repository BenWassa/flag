import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES, COUNTRY_BY_ID } from '../.verify-dist/data/countries.js';
import { AFRICA_MAP_COUNTRY_IDS } from '../.verify-dist/data/map-scopes.js';
import { loadMapAsset } from '../.verify-dist/data/maps/index.js';
import { loadOutlineAsset } from '../.verify-dist/data/outlines.js';
import { AFRICA_LAND_ADJACENCY } from '../.verify-dist/data/neighbors/index.js';
import { createInitialAchievementState } from '../.verify-dist/domain/achievements.js';
import { domainDisplayName } from '../.verify-dist/domain/display.js';
import { buildMapSession, createInitialLocationProgress } from '../.verify-dist/domain/map-game.js';
import { buildNeighborSession, createInitialNeighborProgress } from '../.verify-dist/domain/neighbor-game.js';
import { deriveNeighborMapModel } from '../.verify-dist/domain/neighbor-map.js';
import { buildOutlineQuiz } from '../.verify-dist/domain/outline.js';
import { createInitialProgress } from '../.verify-dist/domain/progress.js';
import { buildQuiz } from '../.verify-dist/domain/quiz.js';
import { parseRoutePath, routeTitle, serializeRoutePath } from '../.verify-dist/routing/routes.js';
import { neighborMapSummary, renderNeighborMap } from '../.verify-dist/ui/components/neighbor-map.js';
import { deriveSpatialState } from '../.verify-dist/spatial/spatial-state.js';
import { loadScreens, loadSpatial, renderScreen } from './lib/react-markup.mjs';

const { HomeScreen, DomainScreen } = await loadScreens('PassiveScreens.js');
const { LauncherScreen } = await loadScreens('LauncherScreens.js');
const { FlagsQuizScreen, OutlineQuizScreen } = await loadScreens('RecognitionScreens.js');
const { LocationQuizScreen } = await loadScreens('LocationScreens.js');
const { NeighborQuizScreen } = await loadScreens('NeighborScreens.js');
const { SpatialCommand } = await loadSpatial('SpatialCommand.js');

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

const britishLedgers = {
  flags: flagProgress,
  locations: locationProgress,
  outlines: outlineProgress,
  neighbors: neighborProgress,
};
const achievements = createInitialAchievementState();
const homeHtml = renderScreen(HomeScreen, { ledgers: britishLedgers, achievements, persisting: true });
const flagsDomainHtml = renderScreen(DomainScreen, { domain: 'flags', ledgers: britishLedgers, achievements, persisting: true });
const neighborsDomainHtml = renderScreen(DomainScreen, { domain: 'neighbors', ledgers: britishLedgers, achievements, persisting: true });
const launcher = (domain, scope) => renderScreen(LauncherScreen, {
  domain, scope, ledgers: britishLedgers, achievements, persisting: true,
});
const flagsLauncherHtml = launcher('flags', africaScope);
const locationsLauncherHtml = launcher('locations', africaScope);
const outlinesLauncherHtml = launcher('outlines', africaScope);
const neighborsLauncherHtml = launcher('neighbors', westAfricaScope);

// The spatial command surface is the production navigation copy, so it carries
// the same British-English contract as the fallback launcher beneath it.
const LAUNCHER_VIEW = { flags: 'scope', locations: 'map-home', outlines: 'outline-home', neighbors: 'neighbor-home' };
const command = (route, view) => renderScreen(SpatialCommand, {
  state: deriveSpatialState({ route, view, achievements }),
  ledgers: britishLedgers,
  achievements,
  persisting: true,
});
const spatialHomeHtml = command({ name: 'home' }, 'home');
const spatialContinentsHtml = command({ name: 'learning', domain: 'neighbors' }, 'domain');
const spatialFlagsScopeHtml = command({ name: 'learning', domain: 'flags', scope: africaScope }, LAUNCHER_VIEW.flags);
const spatialLocationsScopeHtml = command({ name: 'learning', domain: 'locations', scope: africaScope }, LAUNCHER_VIEW.locations);
const spatialOutlinesScopeHtml = command({ name: 'learning', domain: 'outlines', scope: africaScope }, LAUNCHER_VIEW.outlines);
const spatialNeighborsScopeHtml = command({ name: 'learning', domain: 'neighbors', scope: westAfricaScope }, LAUNCHER_VIEW.neighbors);

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
const flagPlayHtml = renderScreen(FlagsQuizScreen, { session: flagPlaySession, progress: flagProgress, answeredCountryId: null });
const mapPlayHtml = renderScreen(LocationQuizScreen, { asset, session: mapPlaySession, lastWrongCountryId: null });
const outlinePlayHtml = renderScreen(OutlineQuizScreen, { asset: outlineAsset, session: outlinePlaySession, progress: outlineProgress, answeredCountryId: null });
const neighborPlayHtml = renderScreen(NeighborQuizScreen, { session: neighborPlaySession, lastOutcome: null, query: '' });

const renderedSurfaces = [
  ['Spatial Home', spatialHomeHtml],
  ['Spatial continents', spatialContinentsHtml],
  ['Spatial Flags scope', spatialFlagsScopeHtml],
  ['Spatial Locations scope', spatialLocationsScopeHtml],
  ['Spatial Outlines scope', spatialOutlinesScopeHtml],
  ['Spatial Neighbours scope', spatialNeighborsScopeHtml],
  ['Home', homeHtml],
  ['Flags domain', flagsDomainHtml],
  ['Neighbours domain', neighborsDomainHtml],
  ['Flags launcher', flagsLauncherHtml],
  ['Locations launcher', locationsLauncherHtml],
  ['Outlines launcher', outlinesLauncherHtml],
  ['Neighbours launcher', neighborsLauncherHtml],
  ['Flags Play quiz', flagPlayHtml],
  ['Locations Play quiz', mapPlayHtml],
  ['Outlines Play quiz', outlinePlayHtml],
  ['Neighbours Play quiz', neighborPlayHtml],
];

assert.ok(flagsDomainHtml.includes('Play world'));
// The production surface names Play for the framed scope, and calls the domain
// Neighbours rather than Neighbors wherever a learner can read it.
assert.ok(spatialFlagsScopeHtml.includes('Play Africa'));
assert.ok(spatialLocationsScopeHtml.includes('Play Africa'));
assert.ok(spatialOutlinesScopeHtml.includes('Play Africa'));
assert.ok(spatialNeighborsScopeHtml.includes('Play West Africa'));
assert.ok(spatialNeighborsScopeHtml.includes('Neighbours'));
assert.ok(spatialHomeHtml.includes('Neighbours'));
assert.ok(flagsLauncherHtml.includes('Play All Africa'));
assert.ok(locationsLauncherHtml.includes('Play All Africa'));
assert.ok(outlinesLauncherHtml.includes('Play All Africa'));
assert.ok(neighborsLauncherHtml.includes('Play West Africa'));
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

// The interactive application is AtlasApp (the composition root: routing,
// rendering, DOM wiring) plus one round-controller module per learning
// domain (session orchestration, moved out of app.ts to keep it from
// growing unbounded). Copy/spelling checks below scan the whole thing, not
// just app.ts, since a domain's announce strings now live in its own module.
const app = (await Promise.all(
  [
    '.verify-dist/react/AtlasApp.js',
    '.verify-dist/state/flags-round.js',
    '.verify-dist/state/locations-round.js',
    '.verify-dist/state/outlines-round.js',
    '.verify-dist/state/neighbors-round.js',
  ].map((file) => readFile(file, 'utf8')),
)).join('\n');
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
assert.ok(app.includes('playScope') && app.includes('startFlags'), 'Built orchestration retains the typed Play actions for every domain.');
assert.ok(app.includes("mode === 'test'"), 'Built orchestration retains Test as the internal engine mode.');
for (const learnerPhrase of ['Test round', 'Repeat test']) {
  assert.equal(app.includes(learnerPhrase), false, `Built app does not expose obsolete learner phrase: ${learnerPhrase}`);
}
assert.match(app, /behavior:\s*.instant/, 'DOM scrollTo behavior is a Web API property and remains intentionally American-spelled.');

const index = await readFile('dist/index.html', 'utf8');
assert.ok(index.includes('<html lang="en-GB">'), 'The document declares British English for browser and assistive-technology language handling.');
assert.ok(index.includes('land-border neighbours'), 'Install/search-facing HTML description uses British English.');

const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
assert.equal(manifest.lang, 'en-GB');
assert.ok(manifest.description.includes('focused practice'), 'Practice is correctly retained as a noun in install metadata.');
assert.ok(Object.hasOwn(manifest, 'background_color') && Object.hasOwn(manifest, 'theme_color'), 'Manifest API field names remain standards-compliant technical identifiers.');

const storage = await readFile('.verify-dist/infrastructure/neighbor-storage.js', 'utf8');
assert.ok(storage.includes('flag-atlas:neighbor-progress:v1'), 'Existing Neighbours progress namespace remains backwards-compatible.');
assert.ok(storage.includes('flag-atlas:neighbor-attempts:v1'), 'Existing Neighbours attempt namespace remains backwards-compatible.');

const serviceWorker = await readFile('dist/sw.js', 'utf8');
assert.ok(serviceWorker.includes('flag-atlas-v29'), 'React/Vite rollout invalidates the previous PWA cache.');
assert.ok(serviceWorker.includes('atlas-theme.css'), 'Tactile Atlas styling remains part of the offline shell.');
assert.ok(serviceWorker.includes('neighbors.css'), 'Technical stylesheet filename remains stable.');

console.log('British-English verification passed: learner-facing Play copy, internal /test compatibility, rendered UI, titles, Neighbours accessibility text, metadata, storage, and v29 Atlas cache contract.');
