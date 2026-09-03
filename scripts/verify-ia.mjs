import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES } from '../.verify-dist/data/countries.js';
import { CONTINENTS } from '../.verify-dist/data/continents.js';
import { AFRICA_MAP_COUNTRY_IDS, AFRICA_MAP_REGION_CONFIGS } from '../.verify-dist/data/map-scopes.js';
import { AFRICA_LAND_ADJACENCY } from '../.verify-dist/data/neighbors/index.js';
import { createInitialAchievementState } from '../.verify-dist/domain/achievements.js';
import { createInitialLocationProgress } from '../.verify-dist/domain/map-game.js';
import { createInitialNeighborProgress } from '../.verify-dist/domain/neighbor-game.js';
import { createInitialProgress } from '../.verify-dist/domain/progress.js';
import { LEARNING_DOMAIN_IDS } from '../.verify-dist/domain/models.js';
import { scopeSupportsDomain } from '../.verify-dist/domain/scope-support.js';
import { deriveSpatialState } from '../.verify-dist/spatial/spatial-state.js';
import { loadScreens, loadSpatial, renderScreen } from './lib/react-markup.mjs';

const { HomeScreen, DomainScreen } = await loadScreens('PassiveScreens.js');
const { LauncherScreen } = await loadScreens('LauncherScreens.js');
const { RecognitionResultsScreen } = await loadScreens('RecognitionScreens.js');
const { NeighborResultsScreen } = await loadScreens('NeighborScreens.js');
const { SpatialCommand } = await loadSpatial('SpatialCommand.js');
const africa = { kind: 'continent', id: 'africa', label: 'Africa' };
const westAfrica = { kind: 'region', id: 'west-africa', label: 'West Africa' };
const ledgers = {
  flags: createInitialProgress(COUNTRIES),
  locations: createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS),
  outlines: createInitialProgress(COUNTRIES),
  neighbors: createInitialNeighborProgress(Object.keys(AFRICA_LAND_ADJACENCY)),
};
const achievements = createInitialAchievementState();
const visibleText = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const buttons = (html) => [...html.matchAll(/<button\b[^>]*>/g)].map(([tag]) => tag);

// ---------------------------------------------------------------------------
// Issue #166 — the production navigation surface
//
// Spatial is the default presentation, so the IA contract is asserted against
// what learners are actually served. The conventional launcher assertions below
// stay as the renderer-failure fallback's own contract.
// ---------------------------------------------------------------------------

const LAUNCHER_VIEW = { flags: 'scope', locations: 'map-home', outlines: 'outline-home', neighbors: 'neighbor-home' };

function renderCommand(route, view) {
  const state = deriveSpatialState({ route, view, achievements });
  assert.ok(state.navigation, `${view} is a navigation surface.`);
  return renderScreen(SpatialCommand, { state, ledgers, achievements, persisting: true });
}

{
  const domains = renderCommand({ name: 'home' }, 'home');
  assert.equal((domains.match(/class="spatial-mode spatial-mode--home"/g) ?? []).length, LEARNING_DOMAIN_IDS.length,
    'Home offers one control per learning domain.');
  for (const label of ['Flags', 'Locations', 'Outlines', 'Neighbours']) {
    assert.ok(visibleText(domains).includes(label), `Home names ${label} visibly.`);
  }
  assert.equal(/Play /.test(domains), false, 'Home starts no round.');
  assert.equal(domains.includes('region-row'), false, 'Home renders no launcher markup.');

  for (const domain of LEARNING_DOMAIN_IDS) {
    const continents = renderCommand({ name: 'learning', domain }, 'domain');
    assert.equal((continents.match(/<button class="spatial-chip/g) ?? []).length, CONTINENTS.length,
      `${domain} lists every continent.`);
    const supported = CONTINENTS.filter((continent) => scopeSupportsDomain(
      { kind: 'continent', id: continent.id, label: continent.name }, domain));
    assert.equal((continents.match(/disabled=""/g) ?? []).length, CONTINENTS.length - supported.length,
      `${domain} names unshipped continents honestly rather than offering them.`);
    if (supported.length < CONTINENTS.length) {
      assert.ok(continents.includes('coming soon'), `${domain} says so in words.`);
    }
  }

  // A framed scope exposes Play immediately, for its own scope, in every domain.
  for (const [domain, scope] of [['flags', africa], ['flags', westAfrica], ['locations', africa],
    ['outlines', africa], ['neighbors', westAfrica]]) {
    const html = renderCommand({ name: 'learning', domain, scope }, LAUNCHER_VIEW[domain]);
    assert.ok(html.includes(`Play ${scope.label}`), `${domain}/${scope.id} offers Play for the framed scope.`);
    assert.ok(html.includes(`Learn ${scope.label}`), `${domain}/${scope.id} offers Learn for the framed scope.`);
    assert.equal((html.match(/class="spatial-command__place"/g) ?? []).length, 1,
      `${domain}/${scope.id} names the selected place exactly once.`);
    assert.equal(html.includes('region-row'), false, `${domain}/${scope.id} renders no launcher rows.`);
    // Lateral choices select a scope; they never start a round.
    assert.ok(html.includes(`All ${africa.label}`), `${domain}/${scope.id} offers its parent continent.`);
  }
}

const home = renderScreen(HomeScreen, { ledgers, achievements, persisting: true });
const homeWithoutPersistence = renderScreen(HomeScreen, { ledgers, achievements, persisting: false });
assert.equal(buttons(home).filter((tag) => tag.includes('atlas-card')).length, LEARNING_DOMAIN_IDS.length, 'Home renders one card per learning domain.');
for (const label of ['Flags', 'Locations', 'Outlines', 'Neighbours']) assert.ok(visibleText(home).includes(label), `Home names ${label} visibly.`);
assert.equal(home.includes('quick-play'), false, 'Home has no retired row-level Play shortcut.');
assert.ok(homeWithoutPersistence.includes('storage-notice'), 'Home retains its storage-degraded state.');

for (const domain of LEARNING_DOMAIN_IDS) {
  const html = renderScreen(DomainScreen, { domain, ledgers, achievements, persisting: false });
  const supported = CONTINENTS.filter((continent) => scopeSupportsDomain({ kind: 'continent', id: continent.id, label: continent.name }, domain));
  assert.equal((html.match(/class="continent-row__open/g) ?? []).length, CONTINENTS.length, `${domain} lists every continent.`);
  assert.equal((html.match(/<button class="continent-row__open/g) ?? []).length, supported.length, `${domain} opens only shipped continents.`);
  assert.equal((html.match(/continent-row--shell/g) ?? []).length, CONTINENTS.length - supported.length, `${domain} names unshipped continents honestly.`);
  if (supported.length < CONTINENTS.length) assert.ok(html.includes('Coming soon'), `${domain} exposes unavailable coverage in words.`);
}

// The conventional launcher is now the renderer-failure fallback. It still has
// to be complete and correct, so its invariants stay asserted here; the
// production spatial surface is asserted separately below.
const launchers = [
  ['flags', renderScreen(LauncherScreen, { domain: 'flags', scope: africa, ledgers, achievements, persisting: true })],
  ['locations', renderScreen(LauncherScreen, { domain: 'locations', scope: africa, ledgers, achievements, persisting: true })],
  ['outlines', renderScreen(LauncherScreen, { domain: 'outlines', scope: africa, ledgers, achievements, persisting: true })],
  ['neighbors', renderScreen(LauncherScreen, { domain: 'neighbors', scope: westAfrica, ledgers, achievements, persisting: true })],
];
for (const [domain, html] of launchers) {
  assert.equal((html.match(/class="region-row__progress/g) ?? []).length, AFRICA_MAP_REGION_CONFIGS.length + 1, `${domain} exposes progress for every launcher row.`);
  assert.ok(html.includes('Learn Africa') || html.includes('Learn West Africa'), `${domain} exposes the subordinate Learn action.`);
  assert.equal(html.includes('quick-play'), false, `${domain} has no row-level Play shortcut.`);
  assert.equal(html.includes('region-row--selected'), false, `${domain} has no selected-row state.`);
  assert.equal(html.includes('aria-pressed'), false, `${domain} launcher rows are actions, not toggles.`);
}

const reviewSession = { mode: 'test', scope: africa };
const flagResults = renderScreen(RecognitionResultsScreen, { domain: 'flags', result: { session: reviewSession, correct: 0, total: 1, newlyMastered: [], missed: [{ countryId: 'GHA', selectedCountryId: 'NGA', correct: false }] } });
const outlineResults = renderScreen(RecognitionResultsScreen, { domain: 'outlines', result: { session: reviewSession, correct: 0, total: 1, newlyMastered: [], missed: [{ countryId: 'GHA', selectedCountryId: 'NGA', correct: false }] } });
const neighbourResults = renderScreen(NeighborResultsScreen, { result: { session: reviewSession, cleanCompletions: 0, total: 1, completed: 0, exhausted: 1, missedCountryIds: ['GHA'] } });
for (const [name, html] of [['Flags', flagResults], ['Outlines', outlineResults], ['Neighbours', neighbourResults]]) {
  assert.ok(html.includes('Review'), `${name} results retain the review path.`);
  assert.ok(html.includes('Back to'), `${name} results retain an exit path.`);
}

const styles = await readFile('dist/styles.css', 'utf8');
const atlasTheme = await readFile('dist/atlas-theme.css', 'utf8');
const app = await readFile('src/react/AtlasApp.tsx', 'utf8');
const launcher = await readFile('src/react/components/Launcher.tsx', 'utf8');
const screens = await readFile('src/react/screens/PassiveScreens.tsx', 'utf8');
const progressComponent = await readFile('.verify-dist/react/components/ProgressStrip.js', 'utf8');
assert.ok(app.includes('store.persisting && store.mapPersisting && store.outlinePersisting && store.neighborPersisting'), 'AtlasApp passes aggregate persistence state to Home.');
assert.ok(app.includes('createHashRouter') && app.includes('installNavigationGestures'), 'AtlasApp owns routing and global navigation lifecycle.');
assert.equal(app.includes('quick-play'), false, 'AtlasApp contains no retired row-level Quick Play path.');
assert.ok(launcher.includes('playScope') && launcher.includes('region-row__progress'), 'Production Launcher owns full-row scope actions and progress.');
assert.equal(progressComponent.includes('statLegend'), false, 'The unused statLegend export stays deleted.');
assert.equal(screens.includes('renderLocationsHome'), false, 'React passive screens contain no legacy renderer.');
assert.match(atlasTheme, /\.page--tile-index \.continent-list\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/, 'Continent selection is a single full-width stack.');
assert.match(atlasTheme, /\.page--tile-index \.continent-row__open\s*\{[^}]*width:\s*100%/, 'The whole continent row is the navigation target.');
assert.match(atlasTheme, /\.region-row__open\s*\{[^}]*width:\s*100%/, 'The whole region row is the selection target.');
assert.equal(styles.includes('.launcher-map'), false, 'Retired launcher-map styling stays removed.');
console.log('IA verification passed: spatial navigation surface (domains, continents, framed scope with immediate Play/Learn and no launcher beneath), React mode-first fallback Home and launchers, honest unsupported shells, review/exit paths, and responsive layout contracts.');
