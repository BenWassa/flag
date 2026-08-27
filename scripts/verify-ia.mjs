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
import { loadScreens, renderScreen } from './lib/react-markup.mjs';

const { HomeScreen, DomainScreen } = await loadScreens('PassiveScreens.js');
const { FlagsLauncherScreen, GeographyLauncherScreen } = await loadScreens('LauncherScreens.js');
const { RecognitionResultsScreen } = await loadScreens('RecognitionScreens.js');
const { NeighborResultsScreen } = await loadScreens('NeighborScreens.js');
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

const home = renderScreen(HomeScreen, { ledgers, persisting: true });
const homeWithoutPersistence = renderScreen(HomeScreen, { ledgers, persisting: false });
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

const launchers = [
  ['flags', renderScreen(FlagsLauncherScreen, { progress: ledgers.flags, scope: africa, achievements, persisting: true })],
  ['locations', renderScreen(GeographyLauncherScreen, { domain: 'locations', progress: ledgers.locations, scope: africa, achievements, persisting: true })],
  ['outlines', renderScreen(GeographyLauncherScreen, { domain: 'outlines', progress: ledgers.outlines, scope: africa, achievements, persisting: true })],
  ['neighbors', renderScreen(GeographyLauncherScreen, { domain: 'neighbors', progress: ledgers.neighbors, scope: westAfrica, achievements, persisting: true })],
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
console.log('IA verification passed: React mode-first Home, full-width geography launchers, honest unsupported shells, review/exit paths, and responsive layout contracts.');
