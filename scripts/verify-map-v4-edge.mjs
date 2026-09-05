import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadMapAsset } from '../.verify-dist/data/maps/index.js';
import {
  advanceMapSession,
  applyMapGuess,
  buildMapSession,
  createInitialLocationProgress,
} from '../.verify-dist/domain/map-game.js';
import { AFRICA_MAP_COUNTRY_IDS, AFRICA_MAP_SCOPE_CONFIGS } from '../.verify-dist/data/map-scopes.js';
import { loadScreens, renderScreen } from './lib/react-markup.mjs';

const { LocationQuizScreen } = await loadScreens('LocationScreens.js');
const renderMapQuiz = (asset, session, lastWrongCountryId) => renderScreen(LocationQuizScreen, {
  asset,
  session,
  lastWrongCountryId,
});

const asset = await loadMapAsset('west-africa');
assert.ok(asset, 'West Africa map must load for edge regressions.');

const calloutIds = asset.countries.filter((item) => item.callout).map((item) => item.countryId).sort();
assert.deepEqual(calloutIds, ['GMB', 'TGO'], 'Only The Gambia and Togo retain mainland callouts in West Africa.');

for (const id of ['CPV', 'GNB', 'SLE', 'BEN']) {
  const geometry = asset.countries.find((item) => item.countryId === id);
  assert.equal(geometry?.callout, undefined, `${id} does not use a redundant mainland-style callout.`);
  assert.equal(geometry?.hitAssist, undefined, `${id} uses its true geometry without a hidden competing assist.`);
}
const caboVerde = asset.countries.find((item) => item.countryId === 'CPV');
assert.ok(caboVerde?.locator, 'Cabo Verde remains a single island dot target.');
const cpvHtml = renderMapQuiz(asset, buildMapSession(asset, 'learn', 'cpv-dot-edge', ['CPV']), null);
const cpvGroup = cpvHtml.match(/<g class="map-country[^"]*"[^>]*data-id="CPV"[\s\S]*?<\/g>/)?.[0] ?? '';
// #117 moved assist discs into their own layer beneath the country shapes, so
// the touch surface is asserted by the answer it resolves rather than by which
// group it sits in.
assert.match(
  cpvHtml,
  /<g class="map-assist-hits">[\s\S]*data-id="CPV"><circle class="map-country__locator-hit"/,
  'Cabo Verde dot has a larger invisible touch surface that answers Cabo Verde.',
);
assert.ok(!cpvGroup.includes('map-country__callout-line'), 'Cabo Verde itself does not duplicate the dot with a line/callout target.');

// Play feedback is target-neutral until the tap, then explicit in the same render.
let session = buildMapSession(asset, 'test', 'explicit-play-feedback', ['GHA', 'MLI']);
const firstTarget = session.countryIds[0];
const nextTarget = session.countryIds[1];
assert.ok(firstTarget && nextTarget && firstTarget !== nextTarget);

const progress = createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS);
const before = renderMapQuiz(asset, session, null);
assert.ok(!before.includes('answer-feedback--correct') && !before.includes('answer-feedback--wrong'), 'Unanswered Play does not leak correctness.');
assert.ok(!before.includes('map-country--current-correct') && !before.includes('map-country--current-wrong'), 'Unanswered Play has no outcome map styling.');

const wrong = applyMapGuess(session, progress, nextTarget, 500);
session = wrong.session;
const immediateWrong = renderMapQuiz(asset, session, null);
assert.ok(immediateWrong.includes('answer-feedback--wrong'), 'A wrong Play tap gets the shared semantic feedback panel immediately.');
assert.ok(immediateWrong.includes('Not quite'), 'Wrong feedback is understandable without colour.');
assert.ok(immediateWrong.includes('Answer:'), 'Wrong feedback identifies the actual answer.');
assert.ok(immediateWrong.includes('map-country--current-wrong'), 'The selected wrong country gets an explicit persistent wrong state.');
assert.ok(immediateWrong.includes('map-country--current-correct'), 'The actual target is indicated after a wrong Play tap.');
assert.ok(!immediateWrong.includes('Answer recorded'), 'The ambiguous recorded acknowledgement is gone.');
assert.equal((immediateWrong.match(/data-action="map-answer"/g) ?? []).length, 0, 'Resolved Play locks map answers during the feedback dwell.');

session = advanceMapSession(session);
const nextQuestion = renderMapQuiz(asset, session, null);
assert.ok(!nextQuestion.includes('map-country--current-correct'), 'A resolved target state never leaks into the next Play target.');
assert.ok(!nextQuestion.includes('map-country--current-wrong'), 'A previous wrong selection never cues the next answer.');

let correctSession = buildMapSession(asset, 'test', 'explicit-play-correct', ['GHA']);
const correct = applyMapGuess(correctSession, createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS), 'GHA', 500);
correctSession = correct.session;
const immediateCorrect = renderMapQuiz(asset, correctSession, null);
assert.ok(immediateCorrect.includes('answer-feedback--correct'), 'A correct Play tap gets shared correct feedback immediately.');
assert.ok(immediateCorrect.includes('Correct'), 'Correct feedback is understandable without colour.');
assert.ok(immediateCorrect.includes('map-country--current-correct'), 'The correct country receives the established high-salience success state.');

// Every generated scope has a target-independent opening focus. Exercise the
// same aspect fitting used by the production controller across Issue #78's QA matrix.
const viewportMatrix = [
  [320, 568],
  [390, 844],
  [768, 1024],
  [844, 390],
];

function parseViewBox(value) {
  const [x, y, width, height] = value.trim().split(/\s+/).map(Number);
  return { x, y, width, height };
}

function fitBoundsToAspect(bounds, aspect) {
  const sourceAspect = bounds.width / bounds.height;
  if (sourceAspect > aspect) {
    const height = bounds.width / aspect;
    return { x: bounds.x, y: bounds.y - (height - bounds.height) / 2, width: bounds.width, height };
  }
  const width = bounds.height * aspect;
  return { x: bounds.x - (width - bounds.width) / 2, y: bounds.y, width, height: bounds.height };
}

function clampBox(box, extent) {
  const width = Math.min(box.width, extent.width);
  const height = Math.min(box.height, extent.height);
  return {
    x: Math.min(extent.x + extent.width - width, Math.max(extent.x, box.x)),
    y: Math.min(extent.y + extent.height - height, Math.max(extent.y, box.y)),
    width,
    height,
  };
}

for (const config of AFRICA_MAP_SCOPE_CONFIGS) {
  const scopeAsset = await loadMapAsset(config.scope.id);
  assert.ok(scopeAsset?.initialFocus, `${config.scope.label} has generated initial focus.`);
  const extent = parseViewBox(scopeAsset.viewBox);
  const focus = scopeAsset.initialFocus;
  assert.ok(focus.x >= extent.x && focus.y >= extent.y, `${config.scope.label} focus starts inside the continent extent.`);
  assert.ok(focus.x + focus.width <= extent.x + extent.width + 0.01, `${config.scope.label} focus width stays inside the continent extent.`);
  assert.ok(focus.y + focus.height <= extent.y + extent.height + 0.01, `${config.scope.label} focus height stays inside the continent extent.`);

  for (const [width, height] of viewportMatrix) {
    const aspect = width / height;
    const continent = fitBoundsToAspect(extent, aspect);
    const opening = config.scope.kind === 'continent'
      ? continent
      : clampBox(fitBoundsToAspect(focus, aspect), continent);
    assert.ok(opening.width > 0 && opening.height > 0, `${config.scope.label} has a valid ${width}x${height} opening box.`);
    assert.ok(opening.width <= continent.width + 0.01 && opening.height <= continent.height + 0.01, `${config.scope.label} ${width}x${height} opening stays within the fitted continent.`);
  }

  const firstId = config.countryIds[0];
  const secondId = config.countryIds[1] ?? firstId;
  const firstHtml = renderMapQuiz(scopeAsset, buildMapSession(scopeAsset, 'test', `focus-a-${config.scope.id}`, [firstId]), null);
  const secondHtml = renderMapQuiz(scopeAsset, buildMapSession(scopeAsset, 'test', `focus-b-${config.scope.id}`, [secondId]), null);
  const firstFocus = firstHtml.match(/data-map-focus="([^"]+)"/)?.[1];
  const secondFocus = secondHtml.match(/data-map-focus="([^"]+)"/)?.[1];
  assert.equal(firstFocus, secondFocus, `${config.scope.label} initial framing is independent of the current target country.`);
}

// These assertions deliberately inspect the canonical controller source. Vite
// minifies the browser entry, so source-text implementation guards must not
// depend on post-bundle symbol spelling while the behavioural tests above keep
// running against emitted domain/view modules.
const viewportSource = await readFile('src/map-viewport.ts', 'utf8');
assert.ok(viewportSource.includes('states.get(sessionId)'), 'Per-session viewport state remains part of the production controller.');
assert.match(
  viewportSource,
  /const saved = states\.get\(sessionId\);[\s\S]*if \(saved\)[\s\S]*applyBox\(viewport, saved\.box, false\);[\s\S]*return;[\s\S]*fitRegion\(viewport\);/,
  'A saved pan/zoom state wins over generated initial focus on rerender.',
);
assert.ok(viewportSource.includes('data-map-max-zoom') || viewportSource.includes('mapMaxZoom'), 'The production controller retains bounded zoom.');
assert.ok(viewportSource.includes('pointermove') && viewportSource.includes('startDistance'), 'Pan and pinch remain in the production controller.');

const mapCss = await readFile('dist/map.css', 'utf8');
assert.ok(mapCss.includes('.map-country--current-wrong'), 'The production stylesheet contains the explicit wrong-country state.');
assert.ok(
  mapCss.includes('.map-country--current-wrong .map-country__shape')
    && !mapCss.includes('.map-country--current-wrong .map-country__callout-target'),
  'Wrong-country semantic colour is carried by canonical country geometry, while non-colour wording is verified in rendered feedback above.',
);
const serviceWorker = await readFile('dist/sw.js', 'utf8');
assert.ok(serviceWorker.includes('flag-atlas-runtime-v1'), 'React/Vite advances the shell cache while preserving map presentation.');

console.log('Locations edge verification passed: small-country targets, explicit Play feedback, target-independent scope framing, viewport matrix, session pan/zoom persistence, and shell cache version.');
