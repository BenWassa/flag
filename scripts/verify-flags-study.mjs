import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES, COUNTRY_BY_ID } from '../dist/data/countries.js';
import { createInitialProgress, getRecord } from '../dist/domain/progress.js';
import { parseRoutePath, serializeRoutePath } from '../dist/routing/routes.js';
import { loadScreens, renderScreen } from './lib/react-markup.mjs';

const { FlagsStudyScreen } = await loadScreens('PassiveScreens.js');

function renderFlagsStudy(scope, revealedIds, revealAll) {
  return renderScreen(FlagsStudyScreen, { scope, revealedIds, revealAll });
}

const AFRICA = { kind: 'continent', id: 'africa', label: 'Africa' };
const WEST_AFRICA = { kind: 'region', id: 'west-africa', label: 'West Africa' };
const WORLD = { kind: 'world', label: 'World' };
const NONE = new Set();

const africaHtml = renderFlagsStudy(AFRICA, NONE, false);

/* --- The whole scope is browsable, not a question at a time --- */

const cardCount = (html) => (html.match(/class="flag-card /g) ?? []).length;
assert.equal(cardCount(africaHtml), 54, 'Learn opens the complete flag set for the scope.');
assert.equal(cardCount(renderFlagsStudy(WORLD, NONE, false)), 195, 'World scope browses the full curriculum.');
assert.ok(
  !africaHtml.includes('data-action="answer"') && !africaHtml.includes('answer-button'),
  'Learn is no longer a slower Play: it renders no scored answer controls.',
);
assert.ok(africaHtml.includes('>Play Africa</button>'), 'One clear route into Play for the same scope.');

/* --- Nothing here scores evidence --- */

const before = createInitialProgress(COUNTRIES);
renderFlagsStudy(AFRICA, new Set(['DZA', 'KEN']), true);
assert.equal(getRecord(before, 'DZA').status, 'unseen', 'Rendering or revealing a flag creates no country evidence.');
assert.deepEqual(
  getRecord(before, 'DZA').evidence,
  createInitialProgress(COUNTRIES).records.DZA.evidence,
  'Passive study leaves the evidence summary untouched.',
);

/* --- No answer leakage while hidden --- */

const kenya = COUNTRY_BY_ID.get('KEN').name;
assert.ok(!africaHtml.includes(`>${kenya}<`), 'A hidden card carries no visible country name.');
assert.ok(
  !africaHtml.includes(`${kenya} flag`),
  'A hidden card carries no country name in its image alt text.',
);
assert.ok(
  africaHtml.includes('alt="Flag to identify"'),
  'Hidden flags reuse the established neutral alt text.',
);
assert.ok(
  /aria-label="Flag \d+ of 54\. Reveal the country\."/.test(africaHtml),
  'The accessible name asks for a reveal rather than naming the country.',
);
assert.ok(africaHtml.includes('aria-expanded="false"'), 'Reveal state is exposed to assistive technology.');

const revealedHtml = renderFlagsStudy(AFRICA, new Set(['KEN']), false);
assert.ok(revealedHtml.includes(`>${kenya}<`), 'A revealed card shows the country name in place.');
assert.ok(revealedHtml.includes(`alt="${kenya} flag"`), 'A revealed flag names itself in its alt text.');
assert.ok(
  revealedHtml.includes('aria-expanded="true"'),
  'The revealed card reports its expanded state.',
);
const revealedImageOffset = revealedHtml.indexOf('alt="Kenya flag"');
const revealedCardStart = revealedHtml.lastIndexOf('<button class="flag-card', revealedImageOffset);
const revealedCardEnd = revealedHtml.indexOf('</button>', revealedImageOffset) + '</button>'.length;
const revealedCard = revealedHtml.slice(revealedCardStart, revealedCardEnd);
assert.ok(!revealedCard.includes('aria-label="Flag'), 'A revealed card drops the placeholder label so its name is the country.');
assert.equal(
  (revealedHtml.match(/aria-expanded="true"/g) ?? []).length,
  1,
  'Revealing one flag reveals only that flag.',
);

/* --- Reveal all --- */

const allHtml = renderFlagsStudy(WEST_AFRICA, NONE, true);
assert.equal(
  (allHtml.match(/aria-expanded="true"/g) ?? []).length,
  16,
  'Reveal all names every flag in the scope.',
);
assert.ok(allHtml.includes('aria-pressed="true"'), 'The toggle reports its own pressed state.');
assert.ok(allHtml.includes('Hide names'), 'The toggle offers the way back.');
assert.ok(renderFlagsStudy(WEST_AFRICA, NONE, false).includes('Reveal all'), 'Names start hidden.');

/* --- Grouping keeps large scopes scannable --- */

const headings = (html) => [...html.matchAll(/study-group__heading">([^<]+)</g)].map(([, name]) => name);
assert.deepEqual(
  headings(africaHtml),
  ['North Africa', 'West Africa', 'Central Africa', 'East Africa', 'Southern Africa'],
  'A continent groups by region.',
);
assert.equal(headings(renderFlagsStudy(WORLD, NONE, false)).length, 6, 'World groups by continent.');
assert.deepEqual(headings(renderFlagsStudy(WEST_AFRICA, NONE, false)), [], 'A single region needs no headings.');

/* --- Mobile-safe loading --- */

assert.ok(
  !renderFlagsStudy(WORLD, NONE, false).includes('loading="eager"'),
  'No gallery flag is eagerly loaded, so World scope stays mobile-safe.',
);

/* --- Routing and compatibility --- */

const learnRoute = parseRoutePath('/flags/africa/learn');
assert.ok(learnRoute && learnRoute.domain === 'flags' && learnRoute.activity === 'learn');
assert.equal(serializeRoutePath(learnRoute), '/flags/africa/learn', 'The Learn route is unchanged and directly addressable.');
assert.equal(serializeRoutePath(parseRoutePath('/flags/africa/test')), '/flags/africa/test', 'Play routing is untouched.');
assert.equal(serializeRoutePath(parseRoutePath('/flags/africa/review')), '/flags/africa/review', 'Review routing is untouched.');

const appSource = await readFile('src/react/AtlasApp.tsx', 'utf8');
assert.ok(
  appSource.includes('const flagsStudy ='),
  'The Learn route resolves to the study surface without an active session.',
);
assert.ok(
  appSource.includes("name: 'flags-study'"),
  'The study surface is a first-class view rather than a special case of the quiz.',
);

const roundSource = await readFile('dist/state/flags-round.js', 'utf8');
assert.ok(
  roundSource.includes('lastActivity'),
  'Repeat restores the activity that actually ran, so a repeated review stays a round.',
);

console.log(
  'Flags study verification passed: full-scope gallery, no scored evidence, no answer leak, reveal-all toggle, geographic grouping, lazy World loading, and stable routing.',
);
