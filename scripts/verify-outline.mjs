import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadScreens, renderScreen } from './lib/react-markup.mjs';
import {
  OUTLINE_BY_ID,
  outlineChoiceIds,
  outlineDistractorPool,
  outlineRecord,
} from '../.verify-dist/data/outlines.js';
import {
  applyOutlineGuess,
  buildOutlineSession,
  createInitialOutlineProgress,
  outlineSummary,
} from '../.verify-dist/domain/outline-game.js';
import {
  continentOutlineSummaries,
  outlineAchievements,
  regionOutlineSummaries,
} from '../.verify-dist/domain/outline-progress.js';
import { parseRoutePath, parentRoute, serializeRoutePath } from '../.verify-dist/domain/routes.js';

const {
  OutlineHomeScreen,
  OutlineQuizScreen,
  OutlineResultsScreen,
} = await loadScreens('OutlineScreens.js');
const renderOutlineHome = (progress, scope, achievements, available) => renderScreen(OutlineHomeScreen, {
  progress,
  scope,
  achievements,
  available,
});
const renderOutlineQuiz = (session) => renderScreen(OutlineQuizScreen, { session });
const renderOutlineResults = (session) => renderScreen(OutlineResultsScreen, { session });

const outlineIds = [...OUTLINE_BY_ID.keys()];
assert.equal(outlineIds.length, 54, 'Africa outline corpus must cover exactly the 54 canonical countries.');

for (const countryId of outlineIds) {
  assert.match(countryId, /^[A-Z]{3}$/, `Outline id ${countryId} must use ISO3.`);
  const item = OUTLINE_BY_ID.get(countryId);
  assert.ok(item?.path, `${countryId} must have a source-derived silhouette path.`);
  assert.equal(item?.viewBox, '0 0 100 100', `${countryId} outline is normalized into a 100x100 silhouette frame.`);
  assert.equal(item?.path.includes('NaN'), false, `${countryId} normalized path contains no NaN coordinates.`);
  assert.equal(item?.path.includes('Infinity'), false, `${countryId} normalized path contains no infinite coordinates.`);
}

for (const countryId of ['CPV', 'COM', 'MUS', 'SYC']) {
  const item = OUTLINE_BY_ID.get(countryId);
  assert.ok((item?.path.match(/M/g) ?? []).length > 1, `${countryId} must retain multipart island morphology.`);
}

for (const countryId of outlineIds) {
  const pool = outlineDistractorPool(countryId);
  assert.ok(pool.length >= 3, `${countryId} must have at least three valid distractors.`);
  assert.equal(pool.includes(countryId), false, `${countryId} distractor pool must exclude the target.`);
  assert.equal(new Set(pool).size, pool.length, `${countryId} distractor pool must not duplicate countries.`);
  assert.ok(pool.every((id) => OUTLINE_BY_ID.has(id)), `${countryId} distractor pool must remain inside the canonical outline corpus.`);
}

const choiceIds = outlineChoiceIds('GHA', () => 0.5);
assert.equal(choiceIds.length, 4, 'Outline questions expose exactly four choices.');
assert.equal(choiceIds.includes('GHA'), true, 'Outline choices include the target country.');
assert.equal(new Set(choiceIds).size, 4, 'Outline choices are unique.');

const progress = createInitialOutlineProgress(outlineIds);
let learn = buildOutlineSession('learn', 'outline-learn-verify', ['GHA']);
let learnResult = applyOutlineGuess(learn, progress, choiceIds.find((id) => id !== 'GHA') ?? 'MLI', 100);
learn = learnResult.session;
assert.equal(learn.targets.GHA?.attempts, 1, 'A wrong Learn guess increments the target attempt count.');
assert.equal(learn.targets.GHA?.resolved, false, 'A wrong Learn guess leaves the target unresolved.');
learnResult = applyOutlineGuess(learn, learnResult.progress, 'GHA', 200);
learn = learnResult.session;
assert.equal(learn.targets.GHA?.resolved, true, 'A correct Learn guess resolves the target.');
assert.equal(learn.targets.GHA?.resolution, 'one-miss', 'Learn records one-miss evidence after one wrong guess.');

let play = buildOutlineSession('test', 'outline-play-verify', ['GHA']);
const playWrongId = outlineChoiceIds('GHA', () => 0.4).find((id) => id !== 'GHA') ?? 'MLI';
const playResult = applyOutlineGuess(play, progress, playWrongId, 300);
play = playResult.session;
assert.equal(play.targets.GHA?.resolved, true, 'Play resolves after the first submitted answer.');
assert.equal(play.attempts.length, 1, 'Play records exactly one attempt.');
assert.equal(play.attempts[0]?.correct, false, 'Wrong Play attempts remain explicit evidence.');
assert.equal(play.attempts[0]?.selectedCountryId, playWrongId, 'Play stores the selected wrong country for feedback.');

const learnHtml = renderOutlineQuiz(buildOutlineSession('learn', 'outline-learn-render', ['GHA']));
assert.ok(learnHtml.includes('outline-frame--stage'), 'Outline Learn renders the canonical silhouette in the stage.');
assert.ok(learnHtml.includes('data-action="outline-answer"'), 'Outline Learn renders answer controls.');
assert.ok(learnHtml.includes('Ghana'), 'Outline Learn can identify the target in its answer set.');

const playHtml = renderOutlineQuiz(play);
assert.ok(playHtml.includes('answer-feedback--wrong'), 'Outline Play renders explicit shared wrong-answer feedback.');
assert.ok(playHtml.includes('Answer:'), 'Outline Play wrong feedback identifies the correct answer non-visually.');
assert.equal((playHtml.match(/data-action="outline-answer"/g) ?? []).length, 0, 'Resolved Outline Play locks further answers during feedback.');

let correctPlay = buildOutlineSession('test', 'outline-play-correct-render', ['GHA']);
correctPlay = applyOutlineGuess(correctPlay, progress, 'GHA', 300).session;
const correctPlayHtml = renderOutlineQuiz(correctPlay);
assert.ok(correctPlayHtml.includes('answer-feedback--correct'), 'Outline Play renders explicit shared correct-answer feedback.');
assert.ok(correctPlayHtml.includes('Correct'), 'Correct Outline Play feedback is understandable without colour.');

const resultHtml = renderOutlineResults(correctPlay);
assert.ok(resultHtml.includes('Perfect round'), 'A perfect Outline Play result retains the shared perfect-round acknowledgement.');
assert.ok(resultHtml.includes('Play again'), 'Outline Results offer a practical repeat action.');

const outlineProgress = createInitialOutlineProgress(outlineIds);
const westScope = { kind: 'region', id: 'west-africa', label: 'West Africa' };
const westSummaries = regionOutlineSummaries(outlineProgress, 'africa');
assert.ok(westSummaries.some((item) => item.id === 'west-africa'), 'Outline progress exposes West Africa through the shared regional hierarchy.');
assert.ok(continentOutlineSummaries(outlineProgress).some((item) => item.id === 'africa'), 'Outline progress exposes Africa through the shared continent hierarchy.');
assert.deepEqual(outlineAchievements(outlineProgress), { regions: [], continents: [] }, 'Fresh outline progress has no achievements.');
assert.equal(outlineSummary(outlineProgress, outlineIds).mastered, 0, 'Fresh outline progress has no mastered countries.');

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
    && mapRendererSource.includes('class="map-country__feedback-shape"')
    && mapRendererSource.includes('aria-hidden="true"'),
  'Locations may reuse locator-island outlinePath only as hidden feedback geometry while the locator remains the interaction surface.',
);
assert.ok(
  mapRendererSource.includes('geometry.locator ?')
    && mapRendererSource.includes('map-country__locator-hit'),
  'Location interaction must continue to use the existing locator behaviour for tiny islands.',
);

const outlineStorage = await readFile('.verify-dist/infrastructure/outline-storage.js', 'utf8');
assert.ok(outlineStorage.includes('flag-atlas:outline-progress:v1'), 'Outline mastery must use its own persisted ledger key.');
assert.equal(outlineStorage.includes('flag-atlas:progress:v1'), false, 'Outline storage must not write into flag progress.');
assert.equal(outlineStorage.includes('flag-atlas:location-progress:v1'), false, 'Outline storage must not write into location progress.');

const outlineCss = await readFile('dist/outline.css', 'utf8');
assert.ok(outlineCss.includes('orientation: landscape') && outlineCss.includes('max-height: 600px'), 'Outline quiz must include a short-landscape layout contract.');
assert.ok(outlineCss.includes('.outline-frame--stage'), 'Silhouette must dominate the question stage with a dedicated fixed frame.');

console.log('Outline verification passed: canonical geometry, ISO3, multipart islands, normalized framing, distractors, Learn/Play feedback, mastery isolation, routing, rendering, accessibility, and responsive layout.');
