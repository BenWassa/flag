import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES, COUNTRY_BY_ID } from '../.verify-dist/data/countries.js';
import {
  AFRICA_MAP_COUNTRY_IDS,
  WEST_AFRICA_MAP_COUNTRY_IDS,
} from '../.verify-dist/data/map-scopes.js';
import { AFRICA_GEOMETRY } from '../.verify-dist/data/maps/africa.js';
import {
  buildOutlineAsset,
  buildOutlineQuiz,
  chooseOutlineDistractors,
  normalizeOutlineGeometry,
} from '../.verify-dist/domain/outline.js';
import { createInitialAchievementState } from '../.verify-dist/domain/achievements.js';
import { applyAttempt, createInitialProgress, getRecord } from '../.verify-dist/domain/progress.js';
import { createSeededRandom } from '../.verify-dist/domain/quiz.js';
import { outlineSilhouette } from '../.verify-dist/ui/components/outline.js';
import { escapeHtml } from '../.verify-dist/ui/format.js';
import { parentRoute, parseRoutePath, serializeRoutePath } from '../.verify-dist/routing/routes.js';
import { loadScreens, renderScreen } from './lib/react-markup.mjs';

const { LauncherScreen } = await loadScreens('LauncherScreens.js');
const { OutlineQuizScreen } = await loadScreens('RecognitionScreens.js');

function renderOutlineHome(progress, scope, achievements, persisting) {
  return renderScreen(LauncherScreen, {
    domain: 'outlines',
    scope,
    achievements,
    persisting,
    ledgers: { flags: progress, locations: progress, outlines: progress, neighbors: progress },
  });
}

function renderOutlineQuiz(asset, session, progress, answeredCountryId) {
  return renderScreen(OutlineQuizScreen, {
    asset,
    session,
    progress,
    answeredCountryId,
  });
}

const africaIds = [...AFRICA_MAP_COUNTRY_IDS];
const africaSet = new Set(africaIds);
const geometryIds = Object.keys(AFRICA_GEOMETRY).filter((id) => africaSet.has(id)).sort();
assert.deepEqual(geometryIds, [...africaIds].sort(), 'Every scored Africa ISO3 must reconcile to canonical production geometry.');

for (const id of africaIds) {
  const country = COUNTRY_BY_ID.get(id);
  assert.ok(country, `Curriculum country missing for ${id}.`);
  assert.equal(country.id, country.iso3, `${id} must use ISO3 as the identity key.`);

  const geometry = AFRICA_GEOMETRY[id];
  assert.ok(geometry?.path ?? geometry?.outlinePath, `Canonical production polygon missing for ${id}.`);
  const normalized = normalizeOutlineGeometry(geometry);
  assert.equal(normalized.countryId, id);

  const coords = [...normalized.path.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)]
    .flatMap((match) => [Number(match[1]), Number(match[2])]);
  assert.ok(coords.length >= 6, `${id} normalized silhouette must retain polygon coordinates.`);
  assert.ok(Math.min(...coords) >= 7.99 && Math.max(...coords) <= 92.01, `${id} must fit the fixed normalized frame.`);
}

const islandIds = ['CPV', 'STP', 'COM', 'MUS', 'SYC'];
for (const id of islandIds) {
  const geometry = AFRICA_GEOMETRY[id];
  assert.ok(geometry.locator, `${id} must retain the production map locator.`);
  assert.equal(geometry.path, undefined, `${id} must not become a directly rendered map polygon.`);
  assert.ok(geometry.outlinePath, `${id} must retain the canonical generated polygon for silhouette learning.`);

  const normalized = normalizeOutlineGeometry(geometry);
  assert.ok(normalized.subpathCount >= 2, `${id} must preserve multipart/island geometry rather than collapse to one locator.`);
  const withoutLocator = { ...geometry, locator: undefined, hitAssist: undefined, callout: undefined };
  assert.equal(
    normalizeOutlineGeometry(withoutLocator).path,
    normalized.path,
    `${id} silhouette must derive from canonical country polygons, not map locator/callout metadata.`,
  );
}

const westScope = { kind: 'region', id: 'west-africa', label: 'West Africa' };
const westIds = new Set(WEST_AFRICA_MAP_COUNTRY_IDS);
const westAsset = buildOutlineAsset(
  westScope,
  WEST_AFRICA_MAP_COUNTRY_IDS.map((id) => AFRICA_GEOMETRY[id]),
  africaIds.filter((id) => !westIds.has(id)).map((id) => AFRICA_GEOMETRY[id]),
);
assert.equal(Object.keys(westAsset.geometries).length, 54, 'Outline asset keeps same-continent context for plausible distractors.');
assert.deepEqual([...westAsset.countryIds].sort(), [...WEST_AFRICA_MAP_COUNTRY_IDS].sort(), 'Active outline scope must not expand beyond the requested region.');

const outlineProgress = createInitialProgress(COUNTRIES.filter((country) => africaSet.has(country.id)));
const questions = buildOutlineQuiz({
  countries: COUNTRIES,
  progress: outlineProgress,
  scope: westScope,
  mode: 'learn',
  size: 10,
  sessionId: 'outline-verify',
  asset: westAsset,
});
assert.equal(questions.length, 10, 'A normal regional outline round should contain ten questions.');

const correctPositions = [0, 0, 0, 0];
for (const question of questions) {
  assert.ok(westIds.has(question.countryId), 'Targets must stay inside the selected region.');
  assert.equal(question.optionCountryIds.length, 4, 'Each outline question must have exactly four options.');
  assert.equal(new Set(question.optionCountryIds).size, 4, 'Outline options must not contain duplicates.');
  assert.equal(question.optionCountryIds[question.correctIndex], question.countryId, 'Correct index must identify the target country.');
  assert.ok(question.optionCountryIds.every((id) => africaSet.has(id)), 'Africa outline distractors must remain within supported curriculum.');
  const distractors = question.optionCountryIds.filter((id) => id !== question.countryId);
  assert.ok(distractors.every((id) => COUNTRY_BY_ID.get(id)?.regionId === 'west-africa'), 'Fresh regional questions should use same-region distractors when enough exist.');
  correctPositions[question.correctIndex] += 1;
}
assert.ok(Math.max(...correctPositions) - Math.min(...correctPositions) <= 1, 'Correct option ordering must stay balanced across positions.');

const confused = structuredClone(outlineProgress);
confused.records.DZA.confusionCounts.ZAF = 4;
const targetDza = COUNTRY_BY_ID.get('DZA');
assert.ok(targetDza);
const africaAsset = buildOutlineAsset(
  { kind: 'continent', id: 'africa', label: 'Africa' },
  africaIds.map((id) => AFRICA_GEOMETRY[id]),
);
const confusedDistractors = chooseOutlineDistractors(
  targetDza,
  COUNTRIES.filter((country) => africaSet.has(country.id)),
  confused,
  africaAsset,
  3,
  createSeededRandom(17),
);
assert.ok(confusedDistractors.some((country) => country.id === 'ZAF'), 'Recorded outline confusions should outrank generic similarity signals.');

// The generic mastery transition is reused, but the state object is separate.
const flagProgress = createInitialProgress(COUNTRIES);
let outlineLedger = createInitialProgress(COUNTRIES.filter((country) => africaSet.has(country.id)));
for (const sessionId of ['outline-a', 'outline-b', 'outline-c']) {
  outlineLedger = applyAttempt(outlineLedger, 'GHA', {
    sessionId,
    countryId: 'GHA',
    selectedCountryId: 'GHA',
    responseTimeMs: 900,
    now: new Date('2026-08-19T12:00:00Z'),
  }).state;
}
assert.equal(getRecord(outlineLedger, 'GHA').status, 'mastered', 'Outline Learn must use established mastery semantics.');
assert.equal(getRecord(flagProgress, 'GHA').status, 'unseen', 'Outline mastery must not contaminate flag mastery.');

const sample = questions[0];
const sampleTarget = COUNTRY_BY_ID.get(sample.countryId);
assert.ok(sampleTarget);
const sampleGeometry = westAsset.geometries[sample.countryId];
assert.ok(sampleGeometry);
const silhouette = outlineSilhouette(sampleGeometry);
assert.ok(silhouette.includes('viewBox="0 0 100 100"'), 'Every silhouette must expose the same fixed SVG viewport.');
assert.ok(silhouette.includes('aria-label="Country silhouette to identify"'), 'Unanswered silhouette needs useful generic screen-reader text.');
assert.equal(silhouette.includes(sampleTarget.id), false, 'Silhouette markup must not expose the answer ISO3.');
assert.equal(silhouette.includes(sampleTarget.name), false, 'Silhouette accessibility/DOM metadata must not expose the answer name.');
assert.equal(/data-(?:country|answer|id)=/.test(silhouette), false, 'Silhouette renderer must not carry answer-bearing data attributes.');

const learnSession = {
  id: 'learn-render',
  mode: 'learn',
  scope: westScope,
  startedAt: '2026-08-19T12:00:00.000Z',
  questions: [sample],
  currentIndex: 0,
  attempts: [],
};
const testSession = { ...learnSession, id: 'test-render', mode: 'test' };
const wrongId = sample.optionCountryIds.find((id) => id !== sample.countryId);
assert.ok(wrongId);
// React's server renderer uses the equivalent hexadecimal apostrophe entity;
// normalise it so this assertion checks the learner-visible name, not an
// implementation-specific entity spelling.
const renderedSampleName = escapeHtml(sampleTarget.name).replaceAll('&#39;', '&#x27;');

const unansweredHtml = renderOutlineQuiz(westAsset, learnSession, outlineProgress, null);
const svgMarkup = unansweredHtml.match(/<svg[\s\S]*?<\/svg>/)?.[0] ?? '';
assert.ok(svgMarkup, 'Outline quiz must render the silhouette SVG.');
assert.equal(svgMarkup.includes(sampleTarget.name), false, 'Unanswered SVG subtree must not contain the answer name.');
assert.equal(svgMarkup.includes(sampleTarget.id), false, 'Unanswered SVG subtree must not contain the answer ISO3.');
assert.equal((unansweredHtml.match(/class="answer-button /g) ?? []).length, 4, 'Outline quiz must render four answer controls.');

const learnedHtml = renderOutlineQuiz(westAsset, learnSession, outlineProgress, wrongId);
assert.ok(learnedHtml.includes(`Correct: ${renderedSampleName}`), 'Learn mode must reveal the correct answer immediately after a miss.');
const testedHtml = renderOutlineQuiz(westAsset, testSession, outlineProgress, wrongId);
assert.ok(testedHtml.includes('answer-feedback--wrong'), 'Play mode must show immediate wrong-answer feedback.');
assert.ok(testedHtml.includes('Not quite'), 'Play feedback must communicate the outcome without relying on colour.');
assert.ok(testedHtml.includes(`Answer: ${renderedSampleName}`), 'Play mode must reveal the correct answer after a miss.');
assert.equal(testedHtml.includes('Answer recorded'), false, 'Play mode must not fall back to a neutral acknowledgement.');
assert.ok(
  testedHtml.includes('answer-button--correct') && testedHtml.includes('answer-button--wrong'),
  'Play mode must mark both the selected wrong option and the correct option.',
);

const outlineAchievements = createInitialAchievementState();
const homeHtml = renderOutlineHome(outlineProgress, { kind: 'continent', id: 'africa', label: 'Africa' }, outlineAchievements, true);
assert.ok(homeHtml.includes('aria-labelledby="scope-outlines-africa-action scope-outlines-africa-label scope-outlines-africa-count scope-outlines-africa-progress"') && homeHtml.includes('Learn Africa'), 'Africa outlines render through the shared Play/Learn launcher.');
assert.equal(/\b\d+ regions\b/.test(homeHtml), false, 'Africa outline launcher omits its redundant region summary.');
assert.ok(homeHtml.includes('data-id="west-africa"'), 'Africa outline launcher lists all regional drills without a separate section heading.');
assert.ok(homeHtml.includes('data-domain="outlines"'), 'Outline regions must route through the shared domain router.');
const westHomeHtml = renderOutlineHome(outlineProgress, westScope, outlineAchievements, true);
assert.ok(westHomeHtml.includes('aria-labelledby="scope-outlines-west-africa-action scope-outlines-west-africa-label scope-outlines-west-africa-count scope-outlines-west-africa-progress"'), 'Each outline region plays straight from its content-named row.');
assert.ok(westHomeHtml.includes('aria-labelledby="scope-outlines-africa-action scope-outlines-africa-label scope-outlines-africa-count scope-outlines-africa-progress"'), 'The whole outline continent keeps its own content-named row.');
assert.equal(westHomeHtml.includes('Selected'), false, 'The outline launcher models no separate selection step.');
for (const deletedSurface of ['mini-ledger', 'stat-legend', 'map-guide', 'map-legend']) {
  assert.equal(westHomeHtml.includes(deletedSurface), false, `Outline launchers do not restore deleted ${deletedSurface} UI.`);
}

const outlineRoute = parseRoutePath('/outlines/africa/west-africa/learn');
assert.ok(outlineRoute, 'Shared router must parse outline activity routes.');
assert.equal(serializeRoutePath(outlineRoute), '/outlines/africa/west-africa/learn');
assert.equal(serializeRoutePath(parentRoute(outlineRoute)), '/outlines/africa/west-africa', 'Outline activity Back must return to its stable shared scope.');

const outlineDataSource = await readFile('src/data/outlines.ts', 'utf8');
assert.ok(outlineDataSource.includes('loadMapAsset'), 'Outlines must consume canonical production map geometry.');
assert.equal(outlineDataSource.includes('AFRICA_GEOMETRY'), false, 'Outline data layer must not create a second direct geometry dataset.');
const generatorSource = await readFile('scripts/map-generation-core.mjs', 'utf8');
assert.ok(generatorSource.includes('countryGeometry.outlinePath = countryPath'), 'Locator-island silhouettes must be emitted by the canonical shared production map generator.');
const mapRendererSource = await readFile('src/ui/components/map.ts', 'utf8');
assert.ok(
  mapRendererSource.includes('!geometry.path && geometry.outlinePath')
    && mapRendererSource.includes('class="map-country__feedback-shape"'),
  'Locator-only Locations feedback may reuse canonical outlinePath geometry without turning it into the interaction surface.',
);
assert.ok(
  mapRendererSource.includes('geometry.locator ?')
    && mapRendererSource.includes('class="map-country__locator"'),
  'Location interaction must continue to use its established locator behaviour for tiny islands.',
);

const outlineStorage = await readFile('.verify-dist/infrastructure/outline-storage.js', 'utf8');
assert.ok(outlineStorage.includes('flag-atlas:outline-progress:v1'), 'Outline mastery must use its own persisted ledger key.');
assert.equal(outlineStorage.includes('flag-atlas:progress:v1'), false, 'Outline storage must not write into flag progress.');
assert.equal(outlineStorage.includes('flag-atlas:location-progress:v1'), false, 'Outline storage must not write into location progress.');

const outlineCss = await readFile('dist/outline.css', 'utf8');
assert.ok(outlineCss.includes('orientation: landscape') && outlineCss.includes('max-height: 600px'), 'Outline quiz must include a short-landscape layout contract.');
assert.ok(outlineCss.includes('.outline-frame--stage'), 'Silhouette must dominate the question stage with a dedicated fixed frame.');

console.log('Outline verification passed: canonical geometry, ISO3, multipart islands, normalized framing, distractors, Learn/Play feedback, mastery isolation, routing, rendering, accessibility, and responsive layout.');
