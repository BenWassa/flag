import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES } from '../dist/data/countries.js';
import { CONTINENTS, REGIONS } from '../dist/data/continents.js';
import {
  AFRICA_MAP_COUNTRY_IDS,
  AFRICA_MAP_REGION_CONFIGS,
} from '../dist/data/map-scopes.js';
import { loadMapAsset } from '../dist/data/maps/index.js';
import { AFRICA_LAND_ADJACENCY } from '../dist/data/neighbors/index.js';
import { createInitialLocationProgress } from '../dist/domain/map-game.js';
import { createInitialNeighborProgress } from '../dist/domain/neighbor-game.js';
import { createInitialProgress } from '../dist/domain/progress.js';
import { LEARNING_DOMAIN_IDS } from '../dist/domain/models.js';
import { scopeSupportsDomain } from '../dist/domain/scope-support.js';
import { icon } from '../dist/ui/components/icons.js';
import { renderLauncherMap } from '../dist/ui/components/launcher-map.js';
import { renderDomainIndex } from '../dist/ui/views/domain.js';
import { renderHome } from '../dist/ui/views/home.js';
import { renderMapHome } from '../dist/ui/views/map-home.js';
import { renderNeighborHome } from '../dist/ui/views/neighbor-home.js';
import { renderOutlineHome } from '../dist/ui/views/outline-home.js';
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
const playIcon = icon('play');

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
  const index = renderDomainIndex(domain, ledgers, false);
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

  const openButtons = actionTags(index, 'button', 'open-scope');
  const playButtons = actionTags(index, 'button', 'quick-play');
  const supported = CONTINENTS.filter((continent) =>
    scopeSupportsDomain({ kind: 'continent', id: continent.id, label: continent.name }, domain));
  assert.equal(openButtons.length, supported.length, `${domain} opens only the continents it has shipped.`);
  assert.equal(playButtons.length, supported.length, `${domain} plays only the continents it has shipped.`);
  assert.equal(occurrences(index, playIcon), supported.length, `${domain} Play controls use the shared icon.`);
  assert.equal(
    occurrences(index, 'continent-row--shell'),
    CONTINENTS.length - supported.length,
    `${domain} lists every unshipped continent as an honest shell.`,
  );

  for (const continent of supported) {
    const open = openButtons.filter((tag) => attribute(tag, 'data-id') === continent.id);
    const play = playButtons.filter((tag) => attribute(tag, 'data-id') === continent.id);
    assert.equal(open.length, 1, `${continent.name} has one open control in ${domain}.`);
    assert.equal(play.length, 1, `${continent.name} has one Play control in ${domain}.`);
    assertButtonContract(open[0], {
      'data-action': 'open-scope',
      'data-domain': domain,
      'data-id': continent.id,
    });
    assertButtonContract(play[0], {
      'data-action': 'quick-play',
      'data-domain': domain,
      'data-id': continent.id,
    });
  }
}

// Only Flags teaches the world, so only Flags offers a world round above its
// continent list. The other three must not imply coverage they do not have.
const flagsDomain = renderDomainIndex('flags', ledgers, false);
assert.ok(flagsDomain.includes('data-action="start-test">Play world</button>'), 'World assessment is labelled Play.');
assert.ok(flagsDomain.includes('data-action="start-learn">Learn world</button>'), 'World study is labelled Learn.');
for (const domain of ['locations', 'outlines', 'neighbors']) {
  const index = renderDomainIndex(domain, ledgers, false);
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
    hasMap: false,
    render: (scope, persisting, _asset) => renderScope(flagProgress, scope, persisting),
  },
  {
    domain: 'locations',
    domainLabel: 'locations',
    playAction: 'start-map-test',
    learnAction: 'start-map-learn',
    hasMap: true,
    render: (scope, persisting, asset) => renderMapHome(locationProgress, scope, persisting, asset),
  },
  {
    domain: 'outlines',
    domainLabel: 'outlines',
    playAction: 'start-outline-test',
    learnAction: 'start-outline-learn',
    hasMap: true,
    render: (scope, persisting, asset) => renderOutlineHome(outlineProgress, scope, persisting, asset),
  },
  {
    domain: 'neighbors',
    domainLabel: 'neighbours',
    playAction: 'start-neighbor-test',
    learnAction: 'start-neighbor-learn',
    hasMap: true,
    render: (scope, persisting, asset) => renderNeighborHome(neighborProgress, scope, persisting, asset),
  },
];

const noAssetLaunchers = new Map();
const allPreRoundSurfaces = [home, flagsDomain];

for (const launcherCase of launcherCases) {
  for (const scope of [africaScope, westAfricaScope]) {
    const name = `${scope.label} ${launcherCase.domainLabel} launcher`;
    const html = launcherCase.render(scope, false, undefined);
    noAssetLaunchers.set(`${launcherCase.domain}:${scope.id}`, html);
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
    assert.ok(html.includes('scope-status-line'), `${name} retains textual status.`);
    assert.ok(html.includes('class="status-strip"'), `${name} retains the progress strip.`);
    assert.ok(html.includes('storage-notice'), `${name} retains its storage-degraded state.`);
    assert.equal(html.includes('Quick Play'), false, `${name} always names the active scope.`);
    assertNoLegacyInteractiveRow(name, html, 'region-row');

    const play = oneActionTag(html, launcherCase.playAction);
    const learn = oneActionTag(html, launcherCase.learnAction);
    assert.ok(hasClass(play, 'launcher__play'), `${name} has one dominant launcher Play action.`);
    assert.ok(hasClass(play, 'button--primary'), `${name} Play is the sole primary action.`);
    assert.ok(hasClass(learn, 'launcher__learn'), `${name} has one subordinate Learn action.`);
    assert.ok(hasClass(learn, 'button--tertiary'), `${name} Learn is visually subordinate.`);
    assert.equal(attribute(play, 'data-scope-id'), scope.id, `${name} Play targets its named scope.`);
    assert.equal(attribute(learn, 'data-scope-id'), scope.id, `${name} Learn targets the same scope.`);
    assert.ok(html.includes(`>Play ${scope.label}</button>`), `${name} visibly names Play ${scope.label}.`);
    assert.ok(html.includes(`>Learn ${scope.label}</button>`), `${name} visibly names Learn ${scope.label}.`);
    assert.equal(play.includes(' disabled'), false, `${name} Play is usable immediately.`);
    assert.equal(learn.includes(' disabled'), false, `${name} Learn is usable immediately.`);
    assert.equal(occurrences(html, 'class="button button--primary'), 1, `${name} has exactly one dominant action.`);
    assert.ok(html.indexOf('launcher__play') < html.indexOf('launcher__regions'), `${name} puts Play before regions.`);
    assert.ok(html.indexOf('launcher__learn') > html.indexOf('launcher__regions'), `${name} keeps Learn after regions.`);

    const regionWrappers = openingTags(html, 'div').filter((tag) => hasClass(tag, 'region-row'));
    const regionOpenButtons = actionTags(html, 'button', 'select-region');
    const regionPlayButtons = actionTags(html, 'button', 'quick-play');
    assert.equal(regionWrappers.length, AFRICA_MAP_REGION_CONFIGS.length, `${name} has five split region rows.`);
    assert.equal(regionOpenButtons.length, AFRICA_MAP_REGION_CONFIGS.length, `${name} has five region selectors.`);
    assert.equal(regionPlayButtons.length, AFRICA_MAP_REGION_CONFIGS.length, `${name} has five region Play controls.`);
    assert.equal(occurrences(html, playIcon), AFRICA_MAP_REGION_CONFIGS.length, `${name} uses the play icon in every region row.`);
    assert.deepEqual(sortedIds(regionOpenButtons), africaRegionIds, `${name} exposes every region selector.`);
    assert.deepEqual(sortedIds(regionPlayButtons), africaRegionIds, `${name} exposes every direct region Play target.`);

    for (const config of AFRICA_MAP_REGION_CONFIGS) {
      const id = config.scope.id;
      const open = regionOpenButtons.find((tag) => attribute(tag, 'data-id') === id);
      const quickPlay = regionPlayButtons.find((tag) => attribute(tag, 'data-id') === id);
      assert.ok(open, `${name} exposes ${config.scope.label} selection.`);
      assert.ok(quickPlay, `${name} exposes ${config.scope.label} Play.`);
      assert.equal(attribute(open, 'data-domain'), launcherCase.domain);
      assert.equal(attribute(open, 'aria-pressed'), String(id === scope.id));
      assertButtonContract(quickPlay, {
        'data-action': 'quick-play',
        'data-domain': launcherCase.domain,
        'data-id': id,
        'aria-label': `Play ${config.scope.label} ${launcherCase.domainLabel}`,
      });
    }

    const selectedRows = regionWrappers.filter((tag) => hasClass(tag, 'region-row--selected'));
    const allScopeButtons = actionTags(html, 'button', 'select-continent');
    if (scope.kind === 'region') {
      assert.equal(selectedRows.length, 1, `${name} has one strongly marked selected row.`);
      assert.equal(attribute(regionOpenButtons.find((tag) => attribute(tag, 'aria-pressed') === 'true'), 'data-id'), scope.id);
      assert.equal(occurrences(html, '<span class="region-row__status">Selected</span>'), 1, `${name} names selection in text.`);
      assert.equal(allScopeButtons.length, 1, `${name} exposes All Africa separately from Back.`);
      assertButtonContract(allScopeButtons[0], {
        'data-action': 'select-continent',
        'data-domain': launcherCase.domain,
        'data-id': 'africa',
      });
      assert.ok(html.includes('>All Africa</button>'), `${name} visibly offers All Africa.`);
      assert.equal(html.includes('mini-ledger'), false, `${name} is still the launcher, not a region ledger.`);
    } else {
      assert.equal(selectedRows.length, 0, `${name} has no selected region.`);
      assert.equal(regionOpenButtons.some((tag) => attribute(tag, 'aria-pressed') === 'true'), false);
      assert.equal(allScopeButtons.length, 0, `${name} does not need an All Africa reset.`);
      assert.equal(visibleText(html).includes('All Africa'), false);
    }

    if (launcherCase.hasMap) {
      assert.ok(html.includes('data-launcher-map-slot'), `${name} exposes the progressive map mount point.`);
      assert.equal(html.includes('class="launcher-map"'), false, `${name} is complete before geometry arrives.`);
      assert.equal(/\bspinner\b/i.test(visibleText(html)), false, `${name} has no blocking spinner.`);
    } else {
      assert.equal(html.includes('data-launcher-map-slot'), false, `${name} never reserves a launcher map.`);
      assert.equal(html.includes('class="launcher-map"'), false, `${name} never renders a launcher map.`);
    }
  }
}

// The map layer hydrates progressively and mirrors the five always-present
// list selectors. Its selected boundary and direct label reinforce the list's
// textual and programmatic state rather than introducing another model.
const africaAsset = await loadMapAsset('africa');
assert.ok(africaAsset, 'The canonical Africa asset is available for launcher hydration.');
for (const launcherCase of launcherCases.filter((item) => item.hasMap)) {
  const name = `Hydrated West Africa ${launcherCase.domainLabel} launcher`;
  const before = noAssetLaunchers.get(`${launcherCase.domain}:west-africa`);
  const hydrated = launcherCase.render(westAfricaScope, false, africaAsset);
  const mapHtml = renderLauncherMap(africaAsset, launcherCase.domain, 'west-africa');

  assert.ok(before, `${name} has a pre-hydration fixture.`);
  assert.ok(hydrated.includes(mapHtml), `${name} uses the shared launcher-map renderer.`);
  assert.ok(hydrated.includes('class="launcher-map"'), `${name} appends the map after geometry resolves.`);
  assert.equal(actionTags(before, 'button', launcherCase.playAction).length, 1, `${name} Play exists before hydration.`);
  assert.equal(actionTags(before, 'button', launcherCase.learnAction).length, 1, `${name} Learn exists before hydration.`);
  assert.deepEqual(
    sortedIds(actionTags(before, 'button', 'select-region')),
    africaRegionIds,
    `${name} list exists before hydration.`,
  );
  assert.ok(hydrated.indexOf('launcher__play') < hydrated.indexOf('class="launcher-map"'), `${name} keeps Play above the map.`);

  const listRegionIds = sortedIds(actionTags(hydrated, 'button', 'select-region'));
  const mapRegionTags = actionTags(hydrated, 'g', 'select-region');
  const mapRegionIds = sortedIds(mapRegionTags);
  const mapSvg = openingTags(mapHtml, 'svg').find((tag) => hasClass(tag, 'launcher-map__svg'));
  const labelOverlay = openingTags(mapHtml, 'div').find((tag) => hasClass(tag, 'launcher-map__labels'));
  const overlayLabels = openingTags(mapHtml, 'span').filter((tag) => hasClass(tag, 'launcher-map__label'));
  assert.ok(mapSvg, `${name} exposes its SVG selection group.`);
  assert.equal(attribute(mapSvg, 'role'), 'group', `${name} map has group semantics.`);
  assert.equal(attribute(mapSvg, 'aria-label'), 'Africa region selector', `${name} map names its purpose.`);
  assert.ok(labelOverlay, `${name} renders the direct-label overlay.`);
  assert.equal(attribute(labelOverlay, 'aria-hidden'), 'true', `${name} avoids duplicating SVG control names.`);
  assert.equal(overlayLabels.length, AFRICA_MAP_REGION_CONFIGS.length, `${name} overlays five direct labels.`);
  assert.deepEqual(sortedIds(overlayLabels), africaRegionIds, `${name} labels every canonical region directly.`);
  assert.equal(mapHtml.includes('<text'), false, `${name} labels are HTML overlays rather than scale-dependent SVG text.`);
  assert.deepEqual(listRegionIds, africaRegionIds, `${name} list uses canonical region IDs.`);
  assert.deepEqual(mapRegionIds, listRegionIds, `${name} map and list drive the same region IDs.`);
  const selectedMapRegion = mapRegionTags.find((tag) => attribute(tag, 'data-id') === 'west-africa');
  assert.ok(selectedMapRegion && hasClass(selectedMapRegion, 'launcher-map-region--selected'), `${name} marks the selected map region.`);
  const selectedOverlayLabel = overlayLabels.find((tag) => attribute(tag, 'data-id') === 'west-africa');
  assert.ok(
    selectedOverlayLabel && hasClass(selectedOverlayLabel, 'launcher-map__label--selected'),
    `${name} mirrors selection in the direct label overlay.`,
  );
  for (const config of AFRICA_MAP_REGION_CONFIGS) {
    const regionTag = mapRegionTags.find((tag) => attribute(tag, 'data-id') === config.scope.id);
    assert.ok(regionTag, `${name} exposes ${config.scope.label} in the SVG.`);
    assertButtonContract(regionTag, {
      role: 'button',
      tabindex: '0',
      'aria-label': `Select ${config.scope.label}`,
      'aria-pressed': String(config.scope.id === 'west-africa'),
    });
    assert.ok(mapHtml.includes(`>${config.scope.label}</span>`), `${name} directly labels ${config.scope.label}.`);
  }
}

// Shared icon and CSS contracts make the split controls independently usable.
assert.ok(playIcon.includes('aria-hidden="true"'), 'The Play glyph is hidden from accessibility APIs.');
assert.ok(playIcon.includes('focusable="false"'), 'The Play glyph cannot take focus independently.');
assert.ok(playIcon.includes('fill="currentColor"'), 'The shared SVG contains the filled Play path.');
for (const html of allPreRoundSurfaces) {
  assert.equal(/[▶►▸⏵]/u.test(html), false, 'Pre-round controls never use Unicode play glyphs.');
}

const styles = await readFile('dist/styles.css', 'utf8');
const atlasTheme = await readFile('dist/atlas-theme.css', 'utf8');
const mapStyles = await readFile('dist/map.css', 'utf8');
const progressComponent = await readFile('dist/ui/components/progress.js', 'utf8');
const domainView = await readFile('dist/ui/views/domain.js', 'utf8');
const app = await readFile('dist/app.js', 'utf8');
const mapLoader = await readFile('dist/data/maps/index.js', 'utf8');
const roundLaunchGuard = await readFile('src/state/round-launch-guard.ts', 'utf8');
const locationsRound = await readFile('src/state/locations-round.ts', 'utf8');
const outlinesRound = await readFile('src/state/outlines-round.ts', 'utf8');

const openControlRule = styles.match(/\.continent-row__open,\s*\.region-row__open\s*\{([^}]*)\}/)?.[1];
assert.ok(openControlRule, 'Split-row open controls have a shared CSS rule.');
assert.match(openControlRule, /min-height:\s*78px/, 'Split-row bodies exceed the 44px touch minimum.');

const playControlRule = styles.match(/\.continent-row__play,\s*\.region-row__play\s*\{([^}]*)\}/)?.[1];
assert.ok(playControlRule, 'Split-row Play controls have a shared CSS rule.');
assert.match(playControlRule, /min-width:\s*44px/, 'Play controls meet the minimum width.');
assert.match(playControlRule, /min-height:\s*44px/, 'Play controls meet the minimum height.');
assert.match(playControlRule, /border-left:\s*1px solid var\(--line\)/, 'Play controls have a visible separator.');

// Touch-target sizing for Learn is owned by atlas-theme.css, which loads after
// styles.css and overrides it. Asserting against styles.css measured a value
// that never applied (Issue #72, CSS ownership).
const learnRule = atlasTheme.match(/\.launcher__learn\s*\{([^}]*)\}/)?.[1];
assert.ok(learnRule, 'Launcher Learn has a dedicated CSS rule in the sheet that owns its sizing.');
const learnMinHeight = Number(learnRule.match(/min-height:\s*(\d+)px/)?.[1]);
assert.ok(learnMinHeight >= 44, 'Launcher Learn remains a real touch target.');

const allScopeRule = styles.match(/\.launcher__all-scope\s*\{([^}]*)\}/)?.[1];
assert.ok(allScopeRule, 'All Africa has a dedicated CSS rule.');
assert.match(allScopeRule, /min-height:\s*44px/, 'All Africa remains a real touch target.');

const focusRule = styles.match(/button:focus-visible,\s*\[tabindex\]:focus-visible\s*\{([^}]*)\}/)?.[1];
assert.ok(focusRule, 'Native split-row buttons receive the shared focus-visible rule.');
assert.match(focusRule, /outline:\s*3px solid var\(--focus-ring\)/, 'Focus is independently visible.');
assert.match(focusRule, /outline-offset:\s*3px/, 'Focus is separated from the control edge.');

assert.ok(styles.includes('.launcher-map-slot:empty { display: none; }'), 'An unhydrated map reserves no visible space.');

const mapRule = styles.match(/\.launcher-map\s*\{([^}]*)\}/)?.[1];
const overlayLabelRule = styles.match(/\.launcher-map__label\s*\{([^}]*)\}/)?.[1];
assert.ok(mapRule, 'Launcher map has a dedicated CSS rule.');
assert.match(mapRule, /position:\s*relative/, 'Launcher map anchors its direct-label overlay.');
assert.ok(overlayLabelRule, 'Launcher direct labels have a dedicated CSS rule.');
assert.match(
  overlayLabelRule,
  /font-size:\s*clamp\(11px,\s*1\.5vw,\s*13px\)/,
  'Direct map labels retain an 11px readable type floor.',
);

const portraitCss = sourceSection(
  styles,
  '@media (max-width: 639px)',
  '@media (max-height: 720px)',
  'Portrait launcher CSS',
);
assert.ok(
  portraitCss.includes('.launcher-map { height: clamp(96px, 16dvh, 150px); }'),
  'Portrait launcher map shrinks within the hardened height clamp.',
);

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
assert.ok(launcherLandscapeCss.includes('"map play"'), 'Short landscape keeps launcher Play beside the map.');
assert.match(
  launcherLandscapeCss,
  /grid-template-columns:\s*minmax\(160px,\s*\.8fr\)\s*minmax\(260px,\s*1\.2fr\)/,
  'Launcher tracks use the compact 160px/260px minima.',
);
assert.match(launcherLandscapeCss, /column-gap:\s*var\(--space-4\)/, 'Launcher tracks use the 16px compact gap.');
assert.equal(160 + 260 + 16 <= 448, true, 'Launcher minimum tracks and gap fit the 448px content width at 480px.');
assert.equal(launcherLandscapeCss.includes('.quiz-shell'), false, 'The launcher breakpoint does not widen quiz layout early.');
assert.ok(quizLandscapeCss.includes('.quiz-shell'), 'Quiz short-landscape layout remains gated at 600px.');
assert.equal(quizLandscapeCss.includes('.page--launcher'), false, 'The 600px quiz breakpoint does not redefine launcher tracks.');

const selectedMapRule = styles.match(/\.launcher-map-region--selected \.launcher-map-country__shape,\s*\.launcher-map-region--selected \.launcher-map-country__locator\s*\{([^}]*)\}/)?.[1];
assert.ok(selectedMapRule, 'Selected map regions receive a strong boundary rule.');
assert.match(selectedMapRule, /fill:\s*var\(--surface\)/, 'Selected region fill stays neutral.');
assert.match(selectedMapRule, /stroke:\s*var\(--text\)/, 'Selected region boundary carries emphasis.');
assert.match(selectedMapRule, /stroke-width:\s*2\.4/, 'Selected region boundary is visibly stronger.');

const launcherMapRegionRule = styles.match(/\.launcher-map-region\s*\{([^}]*)\}/)?.[1];
assert.ok(launcherMapRegionRule, 'Launcher map regions define their interactive surface.');
assert.match(
  launcherMapRegionRule,
  /-webkit-tap-highlight-color:\s*transparent/,
  'Mobile WebKit does not paint a rectangular tap highlight over SVG regions.',
);

const launcherMapCssStart = styles.indexOf('.launcher-map {');
const launcherMapCssEnd = styles.indexOf('.mini-ledger__row', launcherMapCssStart);
assert.ok(launcherMapCssStart >= 0 && launcherMapCssEnd > launcherMapCssStart, 'Launcher map CSS is bounded for verification.');
const launcherMapCss = styles.slice(launcherMapCssStart, launcherMapCssEnd);
assert.equal(
  /fill:\s*var\(--(?:action|mastered|learning|wrong)\)/.test(launcherMapCss),
  false,
  'Launcher region fills do not borrow interaction or learning-state colours.',
);

const replaceScopeSource = sourceSection(
  app,
  'function replaceLauncherScope(',
  "root.addEventListener('click'",
  'Launcher scope replacement orchestration',
);
assert.ok(replaceScopeSource.includes("focusSurface === 'map'"), 'Map selection restores focus to the SVG region surface.');
assert.ok(
  replaceScopeSource.includes('.launcher-map-region[data-action="select-region"]'),
  'Map focus restoration targets the selected SVG region.',
);
assert.equal(
  occurrences(replaceScopeSource, 'focus({ preventScroll: true })'),
  2,
  'Region and All Africa focus restoration both preserve scroll position.',
);

const mapKeyboardSource = sourceSection(
  app,
  "root.addEventListener('keydown'",
  "root.addEventListener('input'",
  'Launcher-map keyboard selection handler',
);
assert.ok(
  mapKeyboardSource.includes("event.key !== 'Enter' && event.key !== ' '"),
  'Launcher map accepts both Enter and Space.',
);
assert.ok(
  mapKeyboardSource.includes('.launcher-map-region[data-action="select-region"]'),
  'Keyboard handling is scoped to launcher map region controls.',
);
assert.ok(mapKeyboardSource.includes('event.preventDefault()'), 'Launcher map Space activation prevents page scrolling.');
assert.ok(
  mapKeyboardSource.includes("replaceLauncherScope(region.dataset.domain, region.dataset.id, 'region', 'map')"),
  'Keyboard activation follows the shared map-selection path.',
);

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

console.log('Issue 21 IA verification passed: split rows, scoped actions, routed launchers, retryable progressive maps, accessible selection state, responsive layouts, removed content, SVG Play controls, and CSS interaction contracts.');
