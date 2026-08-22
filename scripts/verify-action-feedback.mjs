import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES } from '../dist/data/countries.js';
import { createInitialProgress } from '../dist/domain/progress.js';
import { renderContinent } from '../dist/ui/views/atlas.js';
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

/* --- Region-card launchers name their domain ----------------------------- */

const africa = renderContinent(createInitialProgress(COUNTRIES), { kind: 'continent', id: 'africa', label: 'Africa' });
const europe = renderContinent(createInitialProgress(COUNTRIES), { kind: 'continent', id: 'europe', label: 'Europe' });

// Polygon and Intersect are not legible at 22px on their own; DESIGN.md accepts
// them only "paired with the visible ... label", so the label has to be real
// text a sighted learner reads, not a hidden span or a title attribute.
for (const [name, markup, regions] of [['Africa', africa, 5], ['Europe', europe, 4]]) {
  const seen = seenText(markup);
  for (const label of ['Flags', 'Locations', 'Outlines', 'Neighbours']) {
    assert.equal(
      seen.split(label).length - 1 >= regions,
      true,
      `${name} names ${label} visibly on every region card.`,
    );
  }
}
assert.equal(
  (africa.match(/class="domain-launch__label"/g) ?? []).length,
  20,
  'Africa: five regions × four named launchers.',
);
// An unavailable domain stays inert: labelled, but not a control.
const absentTags = [...europe.matchAll(/<(span|button)[^>]*domain-launch--absent[^>]*>/g)];
assert.ok(absentTags.length > 0, 'Europe still marks its unsupported domains.');
for (const [tag, tagName] of absentTags) {
  assert.equal(tagName, 'span', 'An unavailable domain is not a button.');
  assert.equal(/data-action/.test(tag), false, 'An unavailable domain carries no action.');
}
assert.ok(
  europe.includes('<span class="visually-hidden">not available yet</span>'),
  'The unavailable state reaches assistive technology as words, not colour.',
);

// Starting a round is ordinary primary action, so the launchers use the action
// colour rather than reading as neutral chrome.
assert.match(
  atlasTheme,
  /\.domain-launch__mark\s*\{[^}]*color:\s*var\(--action\)/,
  'Domain launchers use Atlas Blue.',
);
assert.match(
  atlasTheme,
  /\.domain-launch--absent \.domain-launch__mark\s*\{[^}]*border:\s*2px dashed/,
  'Unavailable launchers use the dashed unavailable treatment Progress already established.',
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
assert.ok(reducedMotionBlocks.includes('.domain-launch.is-launching'), 'The busy pulse stops under reduced motion.');
assert.ok(
  reducedMotionBlocks.includes('.domain-launch:hover .domain-launch__mark'),
  'Launcher hover travel is removed under reduced motion.',
);

console.log('Action-feedback verification passed: visible failure notices, launcher busy state, labelled region-card launchers, no side-stripe accents, mastery legend, and reduced-motion coverage.');
