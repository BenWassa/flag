import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES } from '../dist/data/countries.js';
import { CONTINENTS, REGIONS } from '../dist/data/continents.js';
import {
  AFRICA_MAP_COUNTRY_IDS,
  AFRICA_MAP_REGION_CONFIGS,
} from '../dist/data/map-scopes.js';
import { AFRICA_LAND_ADJACENCY } from '../dist/data/neighbors/index.js';
import { createInitialAchievementState } from '../dist/domain/achievements.js';
import { createInitialLocationProgress } from '../dist/domain/map-game.js';
import { createInitialNeighborProgress } from '../dist/domain/neighbor-game.js';
import { createInitialProgress } from '../dist/domain/progress.js';
import { LEARNING_DOMAIN_IDS } from '../dist/domain/models.js';
import { scopeSupportsDomain } from '../dist/domain/scope-support.js';
import { renderDomainIndex } from '../dist/ui/views/domain.js';
import { renderHome } from '../dist/ui/views/home.js';
import { renderMapHome } from '../dist/ui/views/map-home.js';
import { renderNeighborHome } from '../dist/ui/views/neighbor-home.js';
import { renderNeighborResults } from '../dist/ui/views/neighbor-results.js';
import { renderOutlineHome } from '../dist/ui/views/outline-home.js';
import { renderOutlineResults } from '../dist/ui/views/outline-results.js';
import { renderResults } from '../dist/ui/views/results.js';
import { renderScope } from '../dist/ui/views/scope.js';

function occurrences(value, needle) {
  return value.split(needle).length - 1;
}

function openingTags(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'g'))].map((match) => match[0]);
}

function attribute(tag, name) {
  return tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
}

function hasClass(tag, className) {
  return (attribute(tag, 'class') ?? '').split(/\s+/).includes(className);
}

function actionTags(html, tagName, action) {
  return openingTags(html, tagName).filter((tag) => attribute(tag, 'data-action') === action);
}

function oneActionTag(html, action) {
  const matches = actionTags(html, 'button', action);
  assert.equal(matches.length, 1, `Expected exactly one button for ${action}.`);
  return matches[0];
}

function visibleText(html) {
  return html
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sortedIds(tags) {
  return tags.map((tag) => attribute(tag, 'data-id')).filter(Boolean).sort();
}

function sourceSection(source, startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `${label} is present in the built source.`);
  return source.slice(start, end);
}

function assertCommonSurface(name, html) {
  assert.equal(occurrences(html, 'data-autofocus'), 1, `${name} has one focus landing point.`);
  assert.equal(html.includes('undefined'), false, `${name} does not render undefined.`);
  assert.equal(html.includes('NaN'), false, `${name} does not render NaN.`);
  assert.equal(html.includes('<dialog'), false, `${name} is a routed surface, not a dialog.`);
  assert.equal(html.includes('role="dialog"'), false, `${name} has no dialog role.`);
  assert.equal(html.includes('aria-modal='), false, `${name} has no modal semantics.`);
}

const forbiddenMarkers = [
  'stat-legend',
  'map-guide',
  'map-legend',
  'neighbor-policy',
  'mini-ledger',
];

function assertPreRoundContentRemoved(name, html) {
  for (const marker of forbiddenMarkers) {
    assert.equal(html.includes(marker), false, `${name} must not contain ${marker}.`);
  }
  const text = visibleText(html);
  for (const phrase of ['Round rules', 'Learn feedback']) {
    assert.equal(text.includes(phrase), false, `${name} must not contain ${phrase}.`);
  }
}

function assertNoLegacyInteractiveRow(name, html, rowClass) {
  const legacy = openingTags(html, 'button').filter((tag) => hasClass(tag, rowClass));
  assert.equal(legacy.length, 0, `${name} must not use an interactive ${rowClass} wrapper.`);
}

function assertButtonContract(tag, expected) {
  for (const [name, value] of Object.entries(expected)) {
    assert.equal(attribute(tag, name), value, `Expected ${name}="${value}" in ${tag}`);
  }
}

const flagProgress = createInitialProgress(COUNTRIES);
const locationProgress = createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS);
const outlineProgress = createInitialProgress(COUNTRIES);
const neighborProgress = createInitialNeighborProgress(Object.keys(AFRICA_LAND_ADJACENCY));
const africaScope = { kind: 'continent', id: 'africa', label: 'Africa' };
const westAfricaScope = { kind: 'region', id: 'west-africa', label: 'West Africa' };
const africaRegionIds = AFRICA_MAP_REGION_CONFIGS.map((config) => config.scope.id).filter(Boolean).sort();

// Home is mode-first: one tactile card per learning domain. Geography is not
// offered here at all, and no round can start before a mode is chosen.
const ledgers = {
  flags: flagProgress,
  locations: locationProgress,
  outlines: outlineProgress,
  neighbors: neighborProgress,
};
const home = renderHome(ledgers);
const homeWithoutPersistence = renderHome(ledgers, false);
assertCommonSurface('Home', home);
assert.equal(home.includes('brand-mark'), false, 'Home presents the Atlas wordmark without a leading flag mark.');
assertPreRoundContentRemoved('Home', home);
const homeModeCards = actionTags(home, 'button', 'open-domain');
assert.equal(homeModeCards.length, LEARNING_DOMAIN_IDS.length, 'Home renders one card per learning domain.');
assert.deepEqual(
  sortedIds(homeModeCards),
  [...LEARNING_DOMAIN_IDS].sort(),
  'Home addresses every domain by its stable internal id.',
);
const homeText = visibleText(home);
for (const label of ['Flags', 'Locations', 'Outlines', 'Neighbours']) {
  assert.ok(homeText.includes(label), `Home names ${label} in visible text, not by glyph alone.`);
}
assert.equal(/\b\d+ countries\b/.test(homeText), false, 'Home coverage labels omit redundant country totals.');
assert.equal(home.includes('data-action="open-atlas"'), false, 'The retired scope-first atlas action stays retired.');
assert.equal(home.includes('data-action="open-scope"'), false, 'Home does not select geography directly.');
assert.equal(actionTags(home, 'button', 'quick-play').length, 0, 'Home starts no round before a mode and a scope are chosen.');
assert.equal(home.includes('storage-notice'), false, 'Home keeps the storage notice quiet while persistence works.');
assert.ok(
  homeWithoutPersistence.includes('storage-notice')
    && visibleText(homeWithoutPersistence).includes("today's progress will be lost"),
  'Home persistence failure renders the honest storage notice.',
);

// Every domain now has a continent index; a domain that ships one continent
// still lists the other five, as inert shells that name the gap.
for (const domain of LEARNING_DOMAIN_IDS) {
  const index = renderDomainIndex(domain, ledgers, createInitialAchievementState(), false);
  assertCommonSurface(`${domain} continent index`, index);
  assertPreRoundContentRemoved(`${domain} continent index`, index);
  assertNoLegacyInteractiveRow(`${domain} continent index`, index, 'continent-row');
  assert.equal(
    occurrences(index, 'class="continent-icon"'),
    CONTINENTS.length,
    `${domain} gives every continent an outline icon.`,
  );
  assert.equal(
    actionTags(index, 'button', 'route-parent').length,
    1,
    `${domain} continent index has one Back control.`,
  );
  assert.ok(index.includes('storage-notice'), `${domain} continent index retains its storage-degraded state.`);
  assert.equal(
    /\b\d+ (?:countries|regions)\b/.test(visibleText(index)),
    false,
    `${domain} continent index omits redundant country and region totals.`,
  );

  const openButtons = actionTags(index, 'button', 'open-scope');
  const quickPlayButtons = actionTags(index, 'button', 'quick-play');
  const supported = CONTINENTS.filter((continent) =>
    scopeSupportsDomain({ kind: 'continent', id: continent.id, label: continent.name }, domain));
  assert.equal(openButtons.length, supported.length, `${domain} opens only the continents it has shipped.`);
  assert.equal(quickPlayButtons.length, 0, `${domain} exposes no row-level Quick Play shortcut.`);
  assert.equal(
    occurrences(index, 'continent-row--shell'),
    CONTINENTS.length - supported.length,
    `${domain} lists every unshipped continent as an honest shell.`,
  );

  for (const continent of supported) {
    const open = openButtons.filter((tag) => attribute(tag, 'data-id') === continent.id);
    assert.equal(open.length, 1, `${continent.name} has one deliberate navigation control in ${domain}.`);
    assertButtonContract(open[0], {
      'data-action': 'open-scope',
      'data-domain': domain,
      'data-id': continent.id,
    });
  }
}

// Only Flags teaches the world, so only Flags offers a world round above its
// continent list. The other three must not imply coverage they do not have.
const flagsDomain = renderDomainIndex('flags', ledgers, createInitialAchievementState(), false);
assert.ok(flagsDomain.includes('data-action="start-test">Play world</button>'), 'World assessment is labelled Play.');
assert.ok(flagsDomain.includes('data-action="start-learn">Learn world</button>'), 'World study is labelled Learn.');
for (const domain of ['locations', 'outlines', 'neighbors']) {
  const index = renderDomainIndex(domain, ledgers, createInitialAchievementState(), false);
  assert.equal(index.includes('start-test'), false, `${domain} must not offer a world round it cannot teach.`);
  assert.equal(visibleText(index).includes('World'), false, `${domain} must not claim world coverage.`);
  assert.ok(visibleText(index).includes('Coming soon'), `${domain} names its unshipped continents honestly.`);
}

const launcherCases = [
  {
    domain: 'flags',
    domainLabel: 'flags',
    playAction: 'start-test',
    learnAction: 'start-learn',
    render: (scope, persisting) => renderScope(flagProgress, scope, createInitialAchievementState(), persisting),
  },
  {
    domain: 'locations',
    domainLabel: 'locations',
    playAction: 'start-map-test',
    learnAction: 'start-map-learn',
    render: (scope, persisting) => renderMapHome(locationProgress, scope, createInitialAchievementState(), persisting),
  },
  {
    domain: 'outlines',
    domainLabel: 'outlines',
    playAction: 'start-outline-test',
    learnAction: 'start-outline-learn',
    render: (scope, persisting) => renderOutlineHome(outlineProgress, scope, createInitialAchievementState(), persisting),
  },
  {
    domain: 'neighbors',
    domainLabel: 'neighbours',
    playAction: 'start-neighbor-test',
    learnAction: 'start-neighbor-learn',
    render: (scope, persisting) => renderNeighborHome(neighborProgress, scope, createInitialAchievementState(), persisting),
  },
];

const allPreRoundSurfaces = [home, flagsDomain];

for (const launcherCase of launcherCases) {
  for (const scope of [africaScope, westAfricaScope]) {
    const name = `${scope.label} ${launcherCase.domainLabel} launcher`;
    const html = launcherCase.render(scope, false);
    allPreRoundSurfaces.push(html);

    assertCommonSurface(name, html);
    assertPreRoundContentRemoved(name, html);
    assert.equal(occurrences(html, '<h1'), 1, `${name} has one screen heading.`);
    const heading = openingTags(html, 'h1')[0];
    assert.equal(
      attribute(heading, 'aria-label'),
      `${scope.label} ${launcherCase.domainLabel} launcher`,
      `${name} focus landing point names the active scope and domain.`,
    );
    assert.ok(html.includes('class="status-strip"'), `${name} retains the progress strip.`);
    assert.ok(!html.includes('strong evidence'), `${name} does not expose the scheduler-flavoured strong-evidence count.`);
    assert.equal(/\b\d+ regions\b/.test(visibleText(html)), false, `${name} omits the redundant region total.`);
    assert.match(
      html,
      /<div class="list-heading">\s*<h2 id="launcher-regions-heading">Regions<\/h2>\s*<\/div>/,
      `${name} renders the Regions heading without a repeated list count.`,
    );
    assert.ok(html.includes('storage-notice'), `${name} retains its storage-degraded state.`);
    assert.equal(html.includes('Quick Play'), false, `${name} always names the active scope.`);
    assertNoLegacyInteractiveRow(name, html, 'region-row');

    // The launcher offers exactly one way to choose a scope: tap its row. Every
    // row — the whole continent and each region — starts Play directly, so there
    // is no separate select step and no second selection surface.
    const playButtons = actionTags(html, 'button', launcherCase.playAction);
    const learn = oneActionTag(html, launcherCase.learnAction);
    const continentRows = openingTags(html, 'div').filter((tag) => hasClass(tag, 'region-row--continent'));
    const regionWrappers = openingTags(html, 'div').filter((tag) => hasClass(tag, 'region-row'));

    assert.equal(continentRows.length, 1, `${name} gives the whole continent its own row.`);
    assert.equal(regionWrappers.length, AFRICA_MAP_REGION_CONFIGS.length + 1, `${name} rows are the continent plus every region.`);
    assert.equal(playButtons.length, AFRICA_MAP_REGION_CONFIGS.length + 1, `${name} starts Play from every scope row.`);
    assert.deepEqual(sortedIds(playButtons), ['africa', ...africaRegionIds].sort(), `${name} plays every canonical scope.`);
    assert.equal(
      occurrences(html, 'class="region-row__progress"'),
      AFRICA_MAP_REGION_CONFIGS.length + 1,
      `${name} gives every scope row a progress strip.`,
    );
    assert.ok(html.includes('>All Africa'), `${name} names its whole-continent row.`);

    for (const play of playButtons) {
      const id = attribute(play, 'data-id');
      assert.equal(attribute(play, 'data-domain'), launcherCase.domain, `${name} row ${id} carries its domain.`);
      assert.equal(attribute(play, 'data-scope-id'), id, `${name} row ${id} plays the scope it names.`);
      assert.ok(hasClass(play, 'region-row__open'), `${name} row ${id} is the full-width row control.`);
      assert.equal(play.includes(' disabled'), false, `${name} row ${id} is usable immediately.`);
      assert.match(attribute(play, 'aria-label') ?? '', /^Play /, `${name} row ${id} announces that it starts Play.`);
    }

    // Selection is gone, so nothing may imply a two-step select-then-play model.
    assert.equal(actionTags(html, 'button', 'select-region').length, 0, `${name} has no separate region select step.`);
    assert.equal(actionTags(html, 'button', 'select-continent').length, 0, `${name} has no separate continent select step.`);
    assert.equal(actionTags(html, 'button', 'quick-play').length, 0, `${name} has no inline region Play shortcut.`);
    assert.equal(html.includes('region-row--selected'), false, `${name} keeps no selected-row state.`);
    assert.equal(html.includes('aria-pressed'), false, `${name} rows are actions, not toggles.`);
    assert.equal(visibleText(html).includes('Selected'), false, `${name} never names a selection.`);
    assert.equal(html.includes('launcher__play'), false, `${name} has no separate primary Play button.`);
    assert.equal(occurrences(html, 'class="button button--primary'), 0, `${name} promotes rows rather than a detached action.`);

    // The map was the second selection method; it is retired for now.
    assert.equal(html.includes('data-launcher-map-slot'), false, `${name} reserves no launcher map.`);
    assert.equal(html.includes('class="launcher-map"'), false, `${name} renders no launcher map.`);
    assert.equal(/\bspinner\b/i.test(visibleText(html)), false, `${name} has no blocking spinner.`);

    // Learn stays a single subordinate whole-continent action below the list.
    assert.ok(hasClass(learn, 'launcher__learn'), `${name} has one subordinate Learn action.`);
    assert.ok(hasClass(learn, 'button--tertiary'), `${name} Learn is visually subordinate.`);
    assert.equal(attribute(learn, 'data-scope-id'), 'africa', `${name} Learn targets the whole continent.`);
    assert.ok(html.includes('>Learn Africa</button>'), `${name} visibly names Learn Africa.`);
    assert.equal(learn.includes(' disabled'), false, `${name} Learn is usable immediately.`);

    assert.ok(html.indexOf('region-row--continent') < html.indexOf('launcher__regions'), `${name} puts the continent row above its regions.`);
    assert.ok(html.indexOf('launcher__learn') > html.indexOf('launcher__regions'), `${name} keeps Learn after regions.`);
  }
}

const reviewSession = { mode: 'test', scope: africaScope };
const reviewResults = [
  ['Flags', renderResults({
    session: reviewSession,
    correct: 0,
    total: 1,
    newlyMastered: [],
    missed: [{ countryId: 'GHA', selectedCountryId: 'NGA', correct: false }],
  }), 'review-heading'],
  ['Outlines', renderOutlineResults({
    session: reviewSession,
    correct: 0,
    total: 1,
    newlyMastered: [],
    missed: [{ countryId: 'GHA', selectedCountryId: 'NGA', correct: false }],
  }), 'outline-review-heading'],
  ['Neighbours', renderNeighborResults({
    session: reviewSession,
    cleanCompletions: 0,
    total: 1,
    completed: 0,
    exhausted: 1,
    missedCountryIds: ['GHA'],
  }), 'neighbor-review-heading'],
];
for (const [name, html, headingId] of reviewResults) {
  assert.match(
    html,
    new RegExp(`<div class="list-heading"><h2 id="${headingId}">Review<\\/h2><\\/div>`),
    `${name} review heading omits a count duplicated by its review list.`,
  );
}

// Pre-round geography selection uses labelled scope controls rather than
// inline Play shortcuts or Unicode glyphs.
for (const html of allPreRoundSurfaces) {
  assert.equal(/[▶►▸⏵]/u.test(html), false, 'Pre-round controls never use Unicode play glyphs.');
}

const styles = await readFile('dist/styles.css', 'utf8');
const atlasTheme = await readFile('dist/atlas-theme.css', 'utf8');
const mapStyles = await readFile('dist/map.css', 'utf8');
const progressComponent = await readFile('dist/ui/components/progress.js', 'utf8');
const domainView = await readFile('dist/ui/views/domain.js', 'utf8');
const app = await readFile('src/app.ts', 'utf8');
const mapLoader = await readFile('dist/data/maps/index.js', 'utf8');
const roundLaunchGuard = await readFile('src/state/round-launch-guard.ts', 'utf8');
const locationsRound = await readFile('src/state/locations-round.ts', 'utf8');
const outlinesRound = await readFile('src/state/outlines-round.ts', 'utf8');

const continentListRule = atlasTheme.match(/\.page--tile-index \.continent-list\s*\{([^}]*)\}/)?.[1];
assert.ok(continentListRule, 'Domain continent selection has a canonical Atlas-theme rule.');
assert.match(
  continentListRule,
  /grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  'Phone continent selection is a single full-width stack.',
);

const continentOpenRule = atlasTheme.match(/\.page--tile-index \.continent-row__open\s*\{([^}]*)\}/)?.[1];
assert.ok(continentOpenRule, 'Continent rows have a dedicated full-width control rule.');
assert.match(continentOpenRule, /width:\s*100%/, 'The whole continent row is the navigation target.');
assert.match(continentOpenRule, /min-height:\s*112px/, 'Supported continent rows remain generous touch targets.');

const regionOpenRule = atlasTheme.match(/\.region-row__open\s*\{([^}]*)\}/)?.[1];
assert.ok(regionOpenRule, 'Region rows have a dedicated full-width control rule.');
assert.match(regionOpenRule, /width:\s*100%/, 'The whole region row is the selection target.');
assert.match(regionOpenRule, /min-height:\s*92px/, 'Region rows remain generous touch targets with progress visible.');

const regionProgressRule = atlasTheme.match(/\.region-row__progress\s*\{([^}]*)\}/)?.[1];
assert.ok(regionProgressRule, 'Region progress has an explicit layout slot.');
assert.match(regionProgressRule, /grid-column:\s*1\s*\/\s*-1/, 'Region progress spans the full row width.');
assert.equal(atlasTheme.includes('.continent-row__play'), false, 'Canonical navigation styling has no dead continent Play cell.');
assert.equal(atlasTheme.includes('.region-row__play'), false, 'Canonical navigation styling has no dead region Play cell.');
assert.equal(app.includes('quick-play'), false, 'Application dispatch contains no row-level Quick Play path.');

// Touch-target sizing for Learn is owned by atlas-theme.css, which loads after
// styles.css and overrides it. Asserting against styles.css measured a value
// that never applied (Issue #72, CSS ownership).
const learnRule = atlasTheme.match(/\.launcher__learn\s*\{([^}]*)\}/)?.[1];
assert.ok(learnRule, 'Launcher Learn has a dedicated CSS rule in the sheet that owns its sizing.');
const learnMinHeight = Number(learnRule.match(/min-height:\s*(\d+)px/)?.[1]);
assert.ok(learnMinHeight >= 44, 'Launcher Learn remains a real touch target.');

const focusRule = styles.match(/button:focus-visible,\s*\[tabindex\]:focus-visible\s*\{([^}]*)\}/)?.[1];
assert.ok(focusRule, 'Native split-row buttons receive the shared focus-visible rule.');
assert.match(focusRule, /outline:\s*3px solid var\(--focus-ring\)/, 'Focus is independently visible.');
assert.match(focusRule, /outline-offset:\s*3px/, 'Focus is separated from the control edge.');

// The launcher map is retired, so no launcher surface may reintroduce one
// without a deliberate product decision (see docs/open/issue-104-map-first-launcher.md).
for (const [sheetName, sheet] of [['styles.css', styles], ['atlas-theme.css', atlasTheme]]) {
  assert.equal(sheet.includes('.launcher-map'), false, `${sheetName} retains no launcher-map styling.`);
  assert.equal(sheet.includes('.launcher__play'), false, `${sheetName} retains no detached launcher Play styling.`);
  assert.equal(sheet.includes('.region-row--selected'), false, `${sheetName} retains no launcher selection styling.`);
}

const continentRowRule = atlasTheme.match(/\.region-row--continent\s*\{([^}]*)\}/)?.[1];
assert.ok(continentRowRule, 'The whole-continent row has a dedicated Atlas-theme rule.');
assert.match(continentRowRule, /var\(--action\)/, 'The continent row carries the Atlas Blue action emphasis.');

const launcherLandscapeQuery = '@media (orientation: landscape) and (max-height: 600px) and (min-width: 480px)';
const quizLandscapeQuery = '@media (orientation: landscape) and (max-height: 600px) and (min-width: 600px)';
const launcherLandscapeCss = sourceSection(
  styles,
  launcherLandscapeQuery,
  quizLandscapeQuery,
  '480px short-landscape launcher CSS',
);
const quizLandscapeCss = sourceSection(
  styles,
  quizLandscapeQuery,
  '@media (prefers-reduced-motion: reduce)',
  '600px short-landscape quiz CSS',
);
assert.ok(launcherLandscapeCss.includes('.page--launcher'), 'The 480px breakpoint targets launcher layout.');
assert.match(launcherLandscapeCss, /\.region-row__open\s*\{\s*min-height:\s*54px/, 'Short landscape keeps launcher rows tappable without the retired map column.');
assert.equal(launcherLandscapeCss.includes('.quiz-shell'), false, 'The launcher breakpoint does not widen quiz layout early.');
assert.ok(quizLandscapeCss.includes('.quiz-shell'), 'Quiz short-landscape layout remains gated at 600px.');
assert.equal(quizLandscapeCss.includes('.page--launcher'), false, 'The 600px quiz breakpoint does not redefine launcher tracks.');

const routeSubscriptionSource = sourceSection(
  app,
  'router.subscribe((route) => {',
  'function discardActiveRound()',
  'Router subscription',
);
assert.ok(
  routeSubscriptionSource.includes('invalidatePendingRoundLaunch()'),
  'Every intervening route change invalidates a pending lazy round start.',
);
assert.ok(
  roundLaunchGuard.includes('roundLaunchRequest += 1'),
  'The shared round-launch guard owns the stale-request counter Locations and Outlines both defer to.',
);
// Locations and Outlines each start a round by loading geometry
// asynchronously first (a map/outline asset), so a stale load resolving
// after the learner has navigated elsewhere must not silently start a
// session or announce failure for a round nobody is looking at any more.
for (const [label, source, loaderCall] of [
  ['map', locationsRound, 'await loadMapAsset(scopeId)'],
  ['outline', outlinesRound, "await loadOutlineAsset(scope.id ?? 'africa')"],
]) {
  assert.ok(source.includes('const request = beginRoundLaunch()'), `${label} launch owns a stale-request token.`);
  assert.ok(source.includes(loaderCall), `${label} launch awaits its lazy asset.`);
  assert.match(source, /try\s*\{[\s\S]*?catch\s*\{/, `${label} lazy load has an error boundary.`);
  assert.ok(
    source.includes('if (isCurrentRoundLaunch(request)) notify('),
    `${label} load failure only reports for the current request.`,
  );
  // A failed launch leaves the learner on the surface they tapped from, so
  // the message has to be visible, not only announced into the hidden live
  // region — otherwise the tap reads as doing nothing at all.
  assert.equal(
    /\bannounce\(`\$\{scope\.label\}[^`]*could not be loaded/.test(source),
    false,
    `${label} load failure is not reported through the screen-reader-only channel.`,
  );
  assert.ok(
    source.includes('if (!isCurrentRoundLaunch(request)) return;'),
    `${label} stale completion exits before starting a session.`,
  );
}

const continentLoaderSource = sourceSection(
  mapLoader,
  'function loadContinentData(',
  'function cloneNamedPath(',
  'Generic continent data loader',
);
assert.ok(mapLoader.includes("africa: async () => {"), 'Africa remains registered in the generic lazy continent loader.');
assert.ok(mapLoader.includes("await import('./africa.js')"), 'Africa remains a dynamic continent chunk.');
assert.ok(continentLoaderSource.includes('const loader = continentLoaders[continentId]'), 'Generic loader resolves the requested continent through the registry.');
assert.ok(continentLoaderSource.includes('continentDataPromises.delete(continentId)'), 'A failed continent import clears the memoised promise for retry.');
assert.ok(continentLoaderSource.includes('throw error'), 'A failed continent import still propagates to the caller error boundary.');

assert.ok(
  app.includes('store.persisting && store.mapPersisting && store.outlinePersisting && store.neighborPersisting'),
  'Home receives the aggregate fifth persistence argument from every learning domain.',
);

assert.equal(styles.includes('.stat-legend'), false, 'Deleted stat-legend CSS does not return.');
assert.equal(mapStyles.includes('.map-guide'), false, 'Deleted map-guide CSS does not return.');
assert.equal(mapStyles.includes('.map-legend'), false, 'Deleted map-legend CSS does not return.');
assert.equal(progressComponent.includes('statLegend'), false, 'The unused statLegend export stays deleted.');
for (const deletedFunction of ['renderLocationsHome', 'renderOutlinesHome', 'renderNeighborsHome']) {
  assert.equal(domainView.includes(deletedFunction), false, `${deletedFunction} stays deleted.`);
}

console.log('IA verification passed: mode-first Home, full-width geography selection, deliberate launcher Play/Learn, visible region progress, routed launchers, accessible selection state, and responsive layout contracts.');
