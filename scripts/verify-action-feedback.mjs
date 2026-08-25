import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES } from '../dist/data/countries.js';
import { createInitialAchievementState } from '../dist/domain/achievements.js';
import { createInitialProgress } from '../dist/domain/progress.js';
import { renderDomainIndex } from '../dist/ui/views/domain.js';
import { renderHome } from '../dist/ui/views/home.js';
import { createInitialLocationProgress } from '../dist/domain/map-game.js';
import { createInitialNeighborProgress } from '../dist/domain/neighbor-game.js';
import { AFRICA_MAP_COUNTRY_IDS } from '../dist/data/map-scopes.js';
import { AFRICA_LAND_ADJACENCY } from '../dist/data/neighbors/index.js';
import { CONTINENTS } from '../dist/data/continents.js';
import { scopeSupportsDomain } from '../dist/domain/scope-support.js';

const app = await readFile('src/react/AtlasApp.tsx', 'utf8');
const html = await readFile('dist/index.html', 'utf8');
const atlasTheme = await readFile('dist/atlas-theme.css', 'utf8');
const launcherStyles = await readFile('dist/styles.css', 'utf8');
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
assert.ok(app.includes('<p className="visually-hidden" role="status" aria-live="polite">{announcement}</p>'), 'React owns the screen-reader-only announcement region.');
assert.ok(app.includes('<div className="app-notice" role="status" aria-live="polite">'), 'React owns a visible live notice region when a notice exists.');
assert.ok(html.includes('<div id="app"></div>') && !html.includes('id="app-notice"'), 'The React root owns transient feedback rather than a parallel static shell.');

assert.ok(app.includes('const notify = useCallback((message: string) =>'), 'AtlasApp owns a notify channel.');
assert.ok(app.includes('setNotice(message)'), 'React renders notice copy as text, retaining its automatic escaping.');
assert.ok(app.includes('onClick={dismissNotice}'), 'A notice can be dismissed before its timeout.');
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

/* --- Async launcher actions show they registered the tap ----------------- */

assert.ok(app.includes('const launchFeedback = useCallback(async'), 'Async launches share one busy-state wrapper.');
assert.ok(app.includes("setAttribute('aria-busy', 'true')"), 'A busy launcher is announced as busy.');
assert.ok(app.includes("classList.add('is-launching')"), 'A busy launcher is visibly busy.');
assert.match(app, /finally\s*\{[\s\S]*?is-launching/, 'A failed launch releases its control.');
for (const call of [
  'launchFeedback(element, () => rounds.locations.begin(mode))',
  'launchFeedback(element, () => rounds.outlines.begin(mode))',
]) assert.ok(app.includes(call), `The deliberate launcher action shows launch feedback: ${call}`);
assert.equal(app.includes('quick-play'), false, 'Retired row-level Quick Play has no application dispatch.');
assert.ok(atlasTheme.includes('.is-launching'), 'The busy state has a production treatment.');

/* --- Mode and continent rows name themselves ----------------------------- */

const flagProgress = createInitialProgress(COUNTRIES);
const ledgers = {
  flags: flagProgress,
  locations: createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS),
  outlines: createInitialProgress(COUNTRIES),
  neighbors: createInitialNeighborProgress(Object.keys(AFRICA_LAND_ADJACENCY)),
};
const home = renderHome(ledgers);
const locationsIndex = renderDomainIndex('locations', ledgers, createInitialAchievementState());

// Polygon and Intersect are not legible at 32px on their own; DESIGN.md accepts
// them only "paired with the visible ... label", so the label has to be real
// text a sighted learner reads, not a hidden span or a title attribute.
const homeSeen = seenText(home);
for (const label of ['Flags', 'Locations', 'Outlines', 'Neighbours']) {
  assert.ok(homeSeen.includes(label), `Home names ${label} visibly beside its glyph.`);
}

// Every supported continent is a deliberate navigation target, while an
// unshipped continent stays inert: named, but not a control. The count is
// derived so shipping a new continent does not need a verifier edit.
const supportedLocationContinents = CONTINENTS.filter(
  (continent) => scopeSupportsDomain({ kind: 'continent', id: continent.id, label: continent.name }, 'locations'),
);
assert.ok(supportedLocationContinents.length > 0, 'Locations ships at least one continent.');
assert.ok(
  supportedLocationContinents.length < CONTINENTS.length,
  'This check is only meaningful while some continent is still an unshipped shell.',
);
assert.equal(
  (locationsIndex.match(/data-action="open-scope"/g) ?? []).length,
  supportedLocationContinents.length,
  'Locations exposes exactly one navigation row per supported continent.',
);
assert.equal(
  (locationsIndex.match(/data-action="quick-play"/g) ?? []).length,
  0,
  'The continent index contains no row-level Play shortcut.',
);
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
assert.match(
  atlasTheme,
  /\.page--tile-index \.continent-row__open\s*\{[^}]*width:\s*100%/,
  'The whole supported continent row is the navigation target.',
);
assert.match(
  atlasTheme,
  /\.page--tile-index \.continent-row--shell\s*\{[^}]*border-style:\s*dashed/,
  'Unshipped continents use the dashed unavailable treatment Progress already established.',
);
assert.equal(atlasTheme.includes('.continent-row__play'), false, 'No dead continent Play-cell styling remains.');
assert.equal(atlasTheme.includes('.region-row__play'), false, 'No dead region Play-cell styling remains.');
assert.match(
  launcherStyles,
  /\.continent-row__open,\s*\.region-row__open\s*\{[^}]*-webkit-tap-highlight-color:\s*transparent/,
  'Full-width continent and region selectors suppress WebKit’s rectangular tap highlight.',
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
for (const file of ['styles.css', 'atlas-theme.css', 'map.css', 'neighbors.css', 'outline.css', 'map-cartography.css']) {
  const css = await readFile(`dist/${file}`, 'utf8');
  const stripes = [...css.matchAll(/border-(left|right):\s*(\d+)px\s+solid/g)]
    .filter(([, , width]) => Number(width) > 1);
  assert.deepEqual(stripes.map(([match]) => match), [], `${file} has no side-stripe accent border.`);
}

/* --- Reduced motion covers the new motion -------------------------------- */

const reducedMotionBlocks = [...atlasTheme.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)]
  .map(([, body]) => body)
  .join('\n');
assert.ok(reducedMotionBlocks.includes('.app-notice'), 'The notice does not animate under reduced motion.');
assert.ok(reducedMotionBlocks.includes('.button--primary.is-launching'), 'The primary launcher does not translate under reduced motion.');
assert.ok(
  reducedMotionBlocks.includes('.atlas-card:hover'),
  'Mode-card hover travel is removed under reduced motion.',
);

console.log('Action-feedback verification passed: visible failure notices, deliberate launcher busy state, labelled mode and continent selection, no side-stripe accents, and reduced-motion coverage.');
