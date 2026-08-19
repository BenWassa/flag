import { AFRICA_MAP_COUNTRY_IDS } from '../../data/map-scopes.js';
import { COUNTRIES } from '../../data/countries.js';
import { createInitialLocationProgress, getLocationScopeStats } from '../../domain/map-game.js';
import type { LocationProgressState } from '../../domain/map-models.js';
import type { ProgressState, StudyScope } from '../../domain/models.js';
import { createInitialProgress, getScopeStats } from '../../domain/progress.js';
import { brandMark, icon } from '../components/icons.js';
import { progressStrip } from '../components/progress.js';

const AFRICA_COUNTRY_ID_SET = new Set<string>(AFRICA_MAP_COUNTRY_IDS);
const AFRICA_COUNTRIES = COUNTRIES.filter((country) => AFRICA_COUNTRY_ID_SET.has(country.id));

export function renderHome(
  progress: ProgressState,
  locationProgressOrPersisting: LocationProgressState | boolean = createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS),
  outlineProgress: ProgressState = createInitialProgress(AFRICA_COUNTRIES),
): string {
  const legacyPersisting = typeof locationProgressOrPersisting === 'boolean' ? locationProgressOrPersisting : true;
  const locationProgress = typeof locationProgressOrPersisting === 'boolean'
    ? createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS)
    : locationProgressOrPersisting;
  const worldScope: StudyScope = { kind: 'world', label: 'World' };
  const africaScope: StudyScope = { kind: 'continent', id: 'africa', label: 'Africa' };
  const flags = getScopeStats(COUNTRIES, progress, worldScope);
  const locations = getLocationScopeStats(locationProgress, AFRICA_MAP_COUNTRY_IDS);
  const locationStats = { ...locations, due: 0 };
  const outlines = getScopeStats(COUNTRIES, outlineProgress, africaScope);

  return `
    <main class="page page--home">
      <header class="topbar">
        <div class="brand-block">
          ${brandMark()}
          <span class="brand-name">Flag Atlas</span>
        </div>
        <button class="text-icon-button" data-action="open-progress" aria-label="Open progress">
          ${icon('ledger')}
          <span>Progress</span>
        </button>
      </header>

      <section class="world-overview" aria-labelledby="home-heading">
        <div class="overview-heading">
          <div>
            <h1 id="home-heading" tabindex="-1" data-autofocus>Learn geography</h1>
            <p>Choose a skill, then choose where to practise it.</p>
          </div>
        </div>
      </section>

      ${legacyPersisting ? '' : `
        <p class="storage-notice">
          This browser is blocking storage, so today's progress will be lost when you close the tab.
        </p>
      `}

      <section class="atlas-section" aria-labelledby="domains-heading">
        <div class="list-heading">
          <h2 id="domains-heading">Learning domains</h2>
          <span>3 available · 1 planned</span>
        </div>
        <div class="continent-list">
          <button class="continent-row" data-action="open-domain" data-id="flags">
            <span class="continent-row__identity">
              <strong>Flags</strong>
              <small>World · 195 countries · Learn or test</small>
            </span>
            <span class="continent-row__progress">${progressStrip(flags)}</span>
            <span class="continent-row__score"><strong>${flags.mastered}</strong><small>/${flags.total}</small></span>
            ${icon('chevron')}
          </button>

          <button class="continent-row" data-action="open-domain" data-id="locations">
            <span class="continent-row__identity">
              <strong>Locations</strong>
              <small>Africa · 54 countries · 5 regions</small>
            </span>
            <span class="continent-row__progress">${progressStrip(locationStats)}</span>
            <span class="continent-row__score"><strong>${locations.mastered}</strong><small>/${locations.total}</small></span>
            ${icon('chevron')}
          </button>

          <button class="continent-row" data-action="open-domain" data-id="outlines">
            <span class="continent-row__identity">
              <strong>Outlines</strong>
              <small>Africa · 54 countries · 5 regions</small>
            </span>
            <span class="continent-row__progress">${progressStrip(outlines)}</span>
            <span class="continent-row__score"><strong>${outlines.mastered}</strong><small>/${outlines.total}</small></span>
            ${icon('chevron')}
          </button>

          <button class="continent-row" data-action="open-domain" data-id="neighbors">
            <span class="continent-row__identity">
              <strong>Neighbors</strong>
              <small>Land-border knowledge · Issue #3</small>
            </span>
            <span class="continent-row__progress"><span class="region-row__status">Planned</span></span>
            <span class="continent-row__score"></span>
            ${icon('chevron')}
          </button>
        </div>
      </section>
    </main>
  `;
}
