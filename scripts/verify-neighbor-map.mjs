import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRY_BY_ID } from '../dist/data/countries.js';
import { loadMapAsset } from '../dist/data/maps/index.js';
import {
  AFRICA_LAND_ADJACENCY,
  AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS,
  AFRICA_STANDARD_NEIGHBOR_TARGET_IDS,
  AFRICA_ZERO_LAND_NEIGHBOR_IDS,
} from '../dist/data/neighbors/index.js';
import {
  applyNeighborGuess,
  buildNeighborSession,
  createInitialNeighborProgress,
} from '../dist/domain/neighbor-game.js';
import {
  boundsContain,
  calculateNeighborClusterBounds,
  canonicalCountryPolygonPath,
  deriveNeighborMapModel,
  geometryBounds,
  labelBoxes,
} from '../dist/domain/neighbor-map.js';
import {
  neighborMapSummary,
  renderNeighborMap,
  renderNeighborPuzzleLayer,
} from '../dist/ui/components/neighbor-map.js';
import { renderNeighborQuiz } from '../dist/ui/views/neighbor-quiz.js';

const asset = await loadMapAsset('africa');
assert.ok(asset, 'Canonical Issue #9 Africa asset loads for Neighbours map presentation.');
const geometryById = new Map(asset.countries.map((geometry) => [geometry.countryId, geometry]));
const nameForId = (id) => COUNTRY_BY_ID.get(id)?.name ?? id;
const htmlText = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const stateSignature = (model) => model.puzzleCountries.map((country) => [country.countryId, country.state]);

function roundState(target) {
  return {
    targetId: target.countryId,
    neighborIds: target.neighborIds,
    foundIds: target.foundIds,
    revealedIds: target.revealedIds,
  };
}

function overlapArea(left, right) {
  const width = Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x));
  const height = Math.max(0, Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y));
  return width * height;
}

// Initial Ghana: only topology members become anonymous unresolved slots.
const scope = { kind: 'region', id: 'west-africa', label: 'West Africa' };
let progress = createInitialNeighborProgress(['GHA']);
let session = buildNeighborSession(AFRICA_LAND_ADJACENCY, progress, scope, ['GHA'], 'learn', 'neighbor-map-ui', 1, ['GHA']);
let target = session.targets.GHA;
let model = deriveNeighborMapModel(asset, roundState(target), nameForId);
assert.equal(model.targetId, 'GHA');
assert.equal(model.targetName, 'Ghana');
assert.deepEqual(
  new Set(model.puzzleCountries.filter((country) => country.state === 'unresolved').map((country) => country.countryId)),
  new Set(AFRICA_LAND_ADJACENCY.GHA),
  'Only direct topology-derived adjacency members are unresolved puzzle slots.',
);
assert.ok(!AFRICA_LAND_ADJACENCY.GHA.includes('GHA'), 'Target is never its own neighbour.');
assert.ok(model.contextCountries.every((country) => !AFRICA_LAND_ADJACENCY.GHA.includes(country.countryId)), 'Context countries are never answer slots.');

const initialHtml = renderNeighborMap(asset, model, 'neighbor-map-ui:GHA', '|');
assert.ok(initialHtml.includes('Ghana, target country'));
assert.equal((initialHtml.match(/>\?<\/text>/g) ?? []).length, AFRICA_LAND_ADJACENCY.GHA.length, 'Every unresolved neighbour has one visible question mark.');
assert.equal((initialHtml.match(/Unresolved neighbouring country/g) ?? []).length, AFRICA_LAND_ADJACENCY.GHA.length, 'Every unresolved polygon has a generic non-answer accessible name.');
for (const id of AFRICA_LAND_ADJACENCY.GHA) {
  assert.ok(!initialHtml.includes(nameForId(id)), `Initial unresolved DOM does not leak ${nameForId(id)}.`);
}
assert.ok(neighborMapSummary(model).includes('3 unresolved neighbouring countries'));
assert.ok(!neighborMapSummary(model).includes('Burkina Faso'), 'Accessible text equivalent does not leak unresolved country names.');

// The quiz host itself contains no unresolved IDs; the runtime derives membership from the lightweight fixture.
const quizHtml = renderNeighborQuiz(session, null, '');
assert.ok(quizHtml.includes('data-neighbor-map-host'));
assert.ok(quizHtml.includes('data-target-id="GHA"'));
assert.ok(!quizHtml.includes('data-neighbor-ids'), 'Unresolved adjacency IDs are not serialized into the quiz DOM.');
assert.ok(!quizHtml.includes('data-id="BFA"'), 'Blank-query autocomplete does not expose candidate countries over the map.');

// Correct guesses map to exact ISO3 geometry and retain prior solved states.
let result = applyNeighborGuess(session, progress, 'BFA', 180);
session = result.session;
progress = result.progress;
target = session.targets.GHA;
model = deriveNeighborMapModel(asset, roundState(target), nameForId);
assert.equal(model.puzzleCountries.find((country) => country.countryId === 'BFA')?.state, 'solved');
assert.ok(renderNeighborMap(asset, model, 'neighbor-map-ui:GHA', 'BFA|').includes('Burkina Faso, neighbour found'));
result = applyNeighborGuess(session, progress, 'CIV', 170);
session = result.session;
progress = result.progress;
model = deriveNeighborMapModel(asset, roundState(session.targets.GHA), nameForId);
assert.equal(model.puzzleCountries.find((country) => country.countryId === 'BFA')?.state, 'solved', 'Previously solved neighbours stay solved.');
assert.equal(model.puzzleCountries.find((country) => country.countryId === 'CIV')?.state, 'solved');

// Wrong and duplicate guesses do not mutate any visual resolution state or labels.
const beforeWrongModel = model;
const beforeWrongLayer = renderNeighborPuzzleLayer(beforeWrongModel);
const wrong = applyNeighborGuess(session, progress, 'BEN', 160);
const afterWrongModel = deriveNeighborMapModel(asset, roundState(wrong.session.targets.GHA), nameForId);
assert.deepEqual(stateSignature(afterWrongModel), stateSignature(beforeWrongModel));
assert.equal(renderNeighborPuzzleLayer(afterWrongModel), beforeWrongLayer, 'Wrong guess leaves puzzle geography unchanged.');
const duplicate = applyNeighborGuess(session, progress, 'BFA', 120);
const afterDuplicateModel = deriveNeighborMapModel(asset, roundState(duplicate.session.targets.GHA), nameForId);
assert.deepEqual(stateSignature(afterDuplicateModel), stateSignature(beforeWrongModel));
assert.equal(renderNeighborPuzzleLayer(afterDuplicateModel), beforeWrongLayer, 'Duplicate guess leaves map state unchanged.');

// Exhaustion reveals exactly the remaining topology member and keeps it distinct from solved.
let exhaustedProgress = createInitialNeighborProgress(['LSO']);
let exhaustedSession = buildNeighborSession(
  AFRICA_LAND_ADJACENCY,
  exhaustedProgress,
  { kind: 'region', id: 'southern-africa', label: 'Southern Africa' },
  ['LSO'],
  'learn',
  'neighbor-map-exhaust',
  1,
  ['LSO'],
);
for (const wrongId of ['BWA', 'NAM', 'ZWE']) {
  const step = applyNeighborGuess(exhaustedSession, exhaustedProgress, wrongId, 150);
  exhaustedSession = step.session;
  exhaustedProgress = step.progress;
}
const exhaustedModel = deriveNeighborMapModel(asset, roundState(exhaustedSession.targets.LSO), nameForId);
assert.equal(exhaustedModel.puzzleCountries.find((country) => country.countryId === 'ZAF')?.state, 'revealed');
const exhaustedHtml = renderNeighborMap(asset, exhaustedModel, 'neighbor-map-exhaust:LSO', '|ZAF');
assert.ok(exhaustedHtml.includes('South Africa, missed neighbour revealed'));
assert.ok(exhaustedHtml.includes('neighbor-map-country--revealed'));
assert.ok(!exhaustedHtml.includes('South Africa, neighbour found'), 'Revealed miss is not presented as learner-solved.');

// Completion names and solves every member without changing the mastery/game state machine.
let completeProgress = createInitialNeighborProgress(['GHA']);
let completeSession = buildNeighborSession(AFRICA_LAND_ADJACENCY, completeProgress, scope, ['GHA'], 'test', 'neighbor-map-complete', 1, ['GHA']);
for (const id of AFRICA_LAND_ADJACENCY.GHA) {
  const step = applyNeighborGuess(completeSession, completeProgress, id, 140);
  completeSession = step.session;
  completeProgress = step.progress;
}
const completeModel = deriveNeighborMapModel(asset, roundState(completeSession.targets.GHA), nameForId);
assert.ok(completeModel.puzzleCountries.filter((country) => country.countryId !== 'GHA').every((country) => country.state === 'solved'));
const completeHtml = renderNeighborMap(asset, completeModel, 'neighbor-map-complete:GHA', 'BFA,CIV,TGO|');
for (const id of AFRICA_LAND_ADJACENCY.GHA) {
  assert.equal(completeModel.puzzleCountries.find((country) => country.countryId === id)?.label.text, nameForId(id), `Completed model labels ${nameForId(id)}.`);
  assert.ok(completeHtml.includes(htmlText(nameForId(id))), `Completed rendered map labels ${nameForId(id)} with safe HTML escaping.`);
}

// Framing and actual canonical polygon usage across representative difficult cases.
const representatives = ['GMB', 'LSO', 'COD', 'TZA', 'TGO', 'BEN', 'GHA', 'BFA', 'GNQ', 'AGO', 'ZAF'];
for (const targetId of representatives) {
  const neighborIds = AFRICA_LAND_ADJACENCY[targetId];
  assert.ok(neighborIds?.length, `${targetId} has topology-derived neighbors.`);
  const focus = calculateNeighborClusterBounds(asset, targetId, neighborIds);
  const revealedModel = deriveNeighborMapModel(asset, {
    targetId,
    neighborIds,
    foundIds: neighborIds,
    revealedIds: [],
  }, nameForId);
  assert.deepEqual(revealedModel.focus, focus, `${targetId} framing is deterministic.`);
  for (const country of revealedModel.puzzleCountries) {
    const geometry = geometryById.get(country.countryId);
    assert.ok(geometry, `${country.countryId} canonical geometry exists.`);
    const canonical = canonicalCountryPolygonPath(geometry);
    assert.ok(canonical, `${country.countryId} canonical production polygon exists.`);
    assert.equal(country.path, canonical, `${country.countryId} uses the Issue #9 polygon, not locator-dot geometry.`);
    assert.ok(boundsContain(focus, geometryBounds(country.path)), `${country.countryId} begins inside the fitted target+neighbor viewport for ${targetId}.`);
  }
  const repeat = deriveNeighborMapModel(asset, {
    targetId,
    neighborIds,
    foundIds: neighborIds,
    revealedIds: [],
  }, nameForId);
  assert.deepEqual(
    revealedModel.puzzleCountries.map((country) => country.label),
    repeat.puzzleCountries.map((country) => country.label),
    `${targetId} label placement is deterministic.`,
  );
  const boxes = labelBoxes(revealedModel);
  for (let left = 0; left < boxes.length; left += 1) {
    for (let right = left + 1; right < boxes.length; right += 1) {
      const overlap = overlapArea(boxes[left], boxes[right]);
      const smaller = Math.min(boxes[left].width * boxes[left].height, boxes[right].width * boxes[right].height);
      assert.ok(smaller === 0 || overlap / smaller < 0.2, `${targetId} has no major label collision between labels ${left} and ${right}.`);
    }
  }
}
assert.equal(
  deriveNeighborMapModel(asset, { targetId: 'GMB', neighborIds: AFRICA_LAND_ADJACENCY.GMB, foundIds: ['SEN'], revealedIds: [] }, nameForId)
    .puzzleCountries.find((country) => country.countryId === 'GMB')?.label.placement,
  'callout',
  'The Gambia reuses the established mainland callout convention for its label.',
);
assert.equal(
  deriveNeighborMapModel(asset, { targetId: 'GHA', neighborIds: AFRICA_LAND_ADJACENCY.GHA, foundIds: ['TGO'], revealedIds: [] }, nameForId)
    .puzzleCountries.find((country) => country.countryId === 'TGO')?.label.placement,
  'callout',
  'Togo reuses the established mainland callout convention in dense West Africa.',
);

// Coverage safeguards remain owned by Issue #3 and are not papered over in presentation.
assert.deepEqual([...AFRICA_NEIGHBOR_COVERAGE_EXCLUDED_IDS], ['EGY', 'MAR']);
assert.ok(!AFRICA_STANDARD_NEIGHBOR_TARGET_IDS.includes('EGY') && !AFRICA_STANDARD_NEIGHBOR_TARGET_IDS.includes('MAR'));
for (const id of AFRICA_ZERO_LAND_NEIGHBOR_IDS) {
  assert.ok(
    AFRICA_STANDARD_NEIGHBOR_TARGET_IDS.includes(id),
    `${id} is a genuine target: an empty neighbour set is an answer, not missing curriculum.`,
  );
}

// Production structure: lazy geometry, existing viewport, shell/PWA and responsive/a11y contracts.
// Source-text implementation guards inspect the canonical runtime source rather
// than Vite's minified production entry; the product behaviour and artifact
// checks above/below continue to exercise compiled output.
const runtime = await readFile('src/neighbor-map-runtime.ts', 'utf8');
assert.ok(runtime.includes('loadMapAsset(scopeId)') && runtime.includes('assetPromiseByScopeId'), 'Neighbour geometry is requested lazily and memoised by the active scope.');
assert.ok(!runtime.includes('AFRICA_GEOMETRY'), 'Neighbor runtime does not eagerly embed the heavyweight canonical geometry module.');
assert.ok(runtime.includes('detachedShell') && runtime.includes('patchNeighborMapShell'), 'Guess rerenders reuse the expensive SVG shell and patch puzzle layers only.');
const renderer = await readFile('dist/ui/components/neighbor-map.js', 'utf8');
assert.ok(renderer.includes('data-map-viewport') && renderer.includes('data-map-focus'), 'Neighbor map reuses the production viewport abstraction and fitted focus contract.');
assert.equal(renderer.includes('data-map-command='), false, 'Neighbor map stays free of toolbar command chrome.');
assert.ok(!renderer.includes('data-action="map-answer"'), 'Neighbor geography stays text-entry driven and non-clickable.');
const index = await readFile('dist/index.html', 'utf8');
assert.ok(index.includes('./neighbor-map-runtime.js'), 'Production shell loads the lightweight neighbor-map runtime.');
const serviceWorker = await readFile('dist/sw.js', 'utf8');
assert.ok(serviceWorker.includes("const VERSION = 'flag-atlas-v28'"), 'Issue #77 shell changes own the v28 PWA cache.');
assert.ok(serviceWorker.includes("'./atlas-theme.css'"), 'Tactile Atlas remains cached with the neighbour map shell.');
assert.ok(serviceWorker.includes("'./neighbor-map-runtime.js'"), 'Neighbor map runtime is cached in the app shell.');
const css = await readFile('dist/neighbors.css', 'utf8');
assert.ok(css.includes('neighbor-map-country--target') && css.includes('neighbor-map-country--unresolved') && css.includes('neighbor-map-country--solved') && css.includes('neighbor-map-country--revealed'));
assert.ok(css.includes('(orientation: landscape) and (max-height: 620px)'), 'Short landscape has a deliberate side-by-side layout.');
assert.ok(css.includes('(max-height: 560px) and (orientation: portrait)'), 'Keyboard-shortened portrait retains a useful map slice.');
assert.ok(css.includes('forced-colors: active') && css.includes('prefers-reduced-motion: reduce'), 'Accessibility media modes are explicit.');
assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css), 'Neighbor map styling uses shared design tokens instead of decorative literal colors.');

const modelSource = await readFile('src/domain/neighbor-map.ts', 'utf8');
for (const forbidden of ['GMB', 'TGO', 'LSO', 'COD', 'TZA', 'AGO', 'GNQ']) {
  assert.ok(!modelSource.includes(`'${forbidden}'`), `Presentation model contains no ${forbidden} manual geography exception.`);
}
assert.ok(modelSource.includes('geometry.callout'), 'Only canonical presentation metadata is reused for exceptional label callouts.');

console.log('Neighbour-map verification passed: canonical geometry, progressive states, framing, deterministic labels, no answer leakage, shell reuse, responsiveness, accessibility, and PWA lazy-loading contracts.');
