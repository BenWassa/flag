import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES } from '../dist/data/countries.js';
import { createInitialProgress } from '../dist/domain/progress.js';
import { renderDomainIndex } from '../dist/ui/views/domain.js';
import { renderHome } from '../dist/ui/views/home.js';
import { createInitialLocationProgress } from '../dist/domain/map-game.js';
import { createInitialNeighborProgress } from '../dist/domain/neighbor-game.js';
import { AFRICA_MAP_COUNTRY_IDS } from '../dist/data/map-scopes.js';
import { AFRICA_LAND_ADJACENCY } from '../dist/data/neighbors/index.js';
import { renderProgress } from '../dist/ui/views/progress.js';
import { createInitialAchievementState } from '../dist/domain/achievements.js';

const app = await readFile('src/app.ts', 'utf8');
const html = await readFile('dist/index.html', 'utf8');
const atlasTheme = await readFile('dist/atlas-theme.css', 'utf8');
const roundContext = await readFile('src/state/round-context.ts', 'utf8');

/** Text a sighted learner actually reads: hidden helper spans do not count. */
function seenText(markup) {
  return markup
    .replace(/<span class="visually-hidden">[\s\S]*?<\/span>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* --- The visible notice channel ------------------------------------------ */

// Routine progress talk stays screen-reader-only; anything reporting that an
// action did not happen has to be seen. Two separate regions, both live.
assert.ok(
  html.includes('<p id="live-status" class="visually-hidden" role="status" aria-live="polite">'),
  'The screen-reader-only announcement region is unchanged.',
);
assert.match(
  html,
  /<div id="app-notice" class="app-notice" role="status" aria-live="polite" hidden><\/div>/,
  'The shell carries a visible, live, initially-hidden notice region.',
);
// Outside #app, or the app's own innerHTML re-render would destroy it mid-message.
assert.ok(
  html.indexOf('id="app-notice"') > html.indexOf('<div id="app"></div>'),
  'The notice region lives outside the app root so a re-render cannot drop it.',
);

assert.ok(app.includes('function notify(message: string): void'), 'app.ts owns a notify channel.');
assert.ok(
  app.includes('${escapeHtml(message)}'),
  'Notice copy is escaped: scope labels reach it from route state.',
);
assert.ok(app.includes('data-notice-dismiss'), 'A notice can be dismissed before its timeout.');
assert.ok(
  /router\.subscribe[\s\S]{0,400}dismissNotice\(\)/.test(app),
  'Navigating away clears a stale notice.',
);
assert.ok(roundContext.includes('notify(message: string): void;'), 'Round controllers receive the visible channel.');

/* --- Every failed launch reports visibly --------------------------------- */

for (const domain of ['flags', 'locations', 'outlines', 'neighbors']) {
  const source = await readFile(`src/state/${domain}-round.ts`, 'utf8');
  const announced = [...source.matchAll(/announce\((['`])([^'`]*)\1\)/g)].map(([, , text]) => text);
  for (const text of announced) {
    assert.equal(
      /could not be loaded|has no |are available for this round/.test(text),
      false,
      `${domain} must not report a failed launch through the hidden channel: "${text}"`,
    );
  }
}
assert.ok(
  app.includes("notify('Choose a country from the suggestions, or type a complete supported country name.')"),
  'An unresolvable Neighbours guess tells the learner, instead of doing nothing visible.',
);

/* --- Async launches show they registered the tap ------------------------- */

assert.ok(app.includes('async function withLaunchFeedback('), 'Async launches share one busy-state wrapper.');
assert.ok(app.includes("element.setAttribute('aria-busy', 'true')"), 'A busy launcher is announced as busy.');
assert.ok(app.includes("element.classList.add('is-launching')"), 'A busy launcher is visibly busy.');
assert.match(app, /finally\s*\{[\s\S]*?is-launching/, 'A failed launch releases its control.');
for (const call of [
  "withLaunchFeedback(element, () => locationsRound.begin('test', undefined, scope))",
  "withLaunchFeedback(element, () => outlinesRound.begin('test', undefined, scope))",
]) {
  assert.ok(app.includes(call), `Region-card quick play shows launch feedback: ${call}`);
}
assert.ok(atlasTheme.includes('.is-launching'), 'The busy state has a production treatment.');

/* --- Mode and continent cards name themselves ---------------------------- */

const flagProgress = createInitialProgress(COUNTRIES);
const ledgers = {
  flags: flagProgress,
  locations: createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS),
  outlines: createInitialProgress(COUNTRIES),
  neighbors: createInitialNeighborProgress(Object.keys(AFRICA_LAND_ADJACENCY)),
};
const home = renderHome(ledgers);
const locationsIndex = renderDomainIndex('locations', ledgers);

// Polygon and Intersect are not legible at 32px on their own; DESIGN.md accepts
// them only "paired with the visible ... label", so the label has to be real
// text a sighted learner reads, not a hidden span or a title attribute.
const homeSeen = seenText(home);
for (const label of ['Flags', 'Locations', 'Outlines', 'Neighbours']) {
  assert.ok(homeSeen.includes(label), `Home names ${label} visibly beside its glyph.`);
}

// An unshipped continent stays inert: named, but not a control.
const shellTags = [...locationsIndex.matchAll(/<(div|button)[^>]*continent-row--shell[^>]*>/g)];
assert.ok(shellTags.length > 0, 'Locations still marks the continents it has not shipped.');
for (const [tag, tagName] of shellTags) {
  assert.equal(tagName, 'div', 'An unshipped continent is not a button.');
  assert.equal(/data-action/.test(tag), false, 'An unshipped continent carries no action.');
}
assert.ok(
  seenText(locationsIndex).includes('Coming soon'),
  'The unshipped state reaches every learner as words, not colour.',
);

// Starting a round is ordinary primary action, so the continent Play control
// uses the action colour rather than reading as neutral chrome.
assert.match(
  atlasTheme,
  /\.page--tile-index \.continent-row__play\s*\{[^}]*color:\s*var\(--action\)/,
  'Continent Play controls use Atlas Blue.',
);
assert.match(
  atlasTheme,
  /\.page--tile-index \.continent-row--shell\s*\{[^}]*border-style:\s*dashed/,
  'Unshipped continents use the dashed unavailable treatment Progress already established.',
);

/* --- Hover, and the banned side-stripe ----------------------------------- */

assert.match(
  atlasTheme,
  /@media \(hover: hover\) and \(pointer: fine\)\s*\{[\s\S]*?\.atlas-card:hover/,
  'Scope cards answer a pointer before it commits to a click.',
);

// A thick coloured border on one edge of a card is the house style's flatly
// banned accent. Selection still uses the documented inset box-shadow bar,
// which is a different property and stays allowed.
for (const file of ['styles.css', 'atlas-theme.css', 'map.css', 'neighbors.css', 'outline.css', 'progress.css', 'map-cartography.css']) {
  const css = await readFile(`dist/${file}`, 'utf8');
  const stripes = [...css.matchAll(/border-(left|right):\s*(\d+)px\s+solid/g)]
    .filter(([, , width]) => Number(width) > 1);
  assert.deepEqual(stripes.map(([match]) => match), [], `${file} has no side-stripe accent border.`);
}

/* --- Progress names its glyphs once -------------------------------------- */

const progress = renderProgress(
  {
    flags: createInitialProgress(COUNTRIES),
    locations: createInitialProgress(COUNTRIES),
    outlines: createInitialProgress(COUNTRIES),
    neighbors: createInitialProgress(COUNTRIES),
  },
  createInitialAchievementState(),
);
assert.ok(progress.includes('progress-mastery-legend'), 'The mastery surface keys its four repeated glyphs.');
for (const label of ['Flags', 'Locations', 'Outlines', 'Neighbours']) {
  assert.ok(
    seenText(progress).includes(label),
    `The mastery legend names ${label}.`,
  );
}

/* --- Reduced motion covers the new motion -------------------------------- */

const reducedMotionBlocks = [...atlasTheme.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)]
  .map(([, body]) => body)
  .join('\n');
assert.ok(reducedMotionBlocks.includes('.app-notice'), 'The notice does not animate under reduced motion.');
assert.ok(reducedMotionBlocks.includes('.continent-row__play.is-launching'), 'The busy pulse stops under reduced motion.');
assert.ok(
  reducedMotionBlocks.includes('.atlas-card:hover'),
  'Mode-card hover travel is removed under reduced motion.',
);

console.log('Action-feedback verification passed: visible failure notices, launcher busy state, labelled mode and continent cards, no side-stripe accents, mastery legend, and reduced-motion coverage.');
