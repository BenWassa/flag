import { AFRICA_MAP_COUNTRY_IDS } from '../../data/map-scopes.js';
import { COUNTRIES } from '../../data/countries.js';
import {
  AFRICA_LAND_ADJACENCY,
  AFRICA_STANDARD_NEIGHBOR_TARGET_IDS,
  getAfricaNeighborScopeConfig,
} from '../../data/neighbors/index.js';
import { domainDisplayName } from '../../domain/display.js';
import { createInitialLocationProgress, getLocationScopeStats } from '../../domain/map-game.js';
import type { LocationProgressState } from '../../domain/map-models.js';
import { createInitialNeighborProgress, getNeighborScopeStats } from '../../domain/neighbor-game.js';
import type { NeighborProgressState } from '../../domain/neighbor-models.js';
import type { LearningDomain, ProgressState, ScopeStats, StudyScope } from '../../domain/models.js';
import { createInitialProgress, getScopeStats } from '../../domain/progress.js';
import { brandMark, icon } from '../components/icons.js';
import { progressStrip } from '../components/progress.js';

const AFRICA_COUNTRY_ID_SET = new Set<string>(AFRICA_MAP_COUNTRY_IDS);
const AFRICA_COUNTRIES = COUNTRIES.filter((country) => AFRICA_COUNTRY_ID_SET.has(country.id));

function renderDomainRow(
  domain: LearningDomain,
  playScope: StudyScope,
  subtitle: string,
  stats: ScopeStats,
): string {
  const name = domainDisplayName(domain);
  return `
    <div class="continent-row">
      <button class="continent-row__open" type="button" data-action="open-domain" data-id="${domain}">
        <span class="continent-row__identity">
          <strong>${name}</strong>
          <small>${subtitle}</small>
        </span>
        <span class="continent-row__progress">${progressStrip(stats)}</span>
        <span class="continent-row__score"><strong>${stats.mastered}</strong><small>/${stats.total}</small></span>
        ${icon('chevron')}
      </button>
      <button
        class="continent-row__play"
        type="button"
        data-action="quick-play"
        data-domain="${domain}"
        data-id="${domain}"
        aria-label="Play ${playScope.label} ${name.toLowerCase()}"
      >${icon('play')}</button>
    </div>
  `;
}

export function renderHome(
  progress: ProgressState,
  locationProgressOrPersisting: LocationProgressState | boolean = createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS),
  outlineProgress: ProgressState = createInitialProgress(AFRICA_COUNTRIES),
  neighborProgress: NeighborProgressState = createInitialNeighborProgress(Object.keys(AFRICA_LAND_ADJACENCY)),
  persisting = true,
): string {
  const homePersisting = typeof locationProgressOrPersisting === 'boolean'
    ? locationProgressOrPersisting
    : persisting;
  const locationProgress = typeof locationProgressOrPersisting === 'boolean'
    ? createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS)
    : locationProgressOrPersisting;
  const worldScope: StudyScope = { kind: 'world', label: 'World' };
  const africaScope: StudyScope = { kind: 'continent', id: 'africa', label: 'Africa' };
  const flags = getScopeStats(COUNTRIES, progress, worldScope);
  const locations = getLocationScopeStats(locationProgress, AFRICA_MAP_COUNTRY_IDS);
  const locationStats: ScopeStats = { ...locations, due: 0 };
  const outlines = getScopeStats(COUNTRIES, outlineProgress, africaScope);
  const neighborScopeIds = getAfricaNeighborScopeConfig('africa')?.countryIds ?? [];
  const neighbors = getNeighborScopeStats(neighborProgress, neighborScopeIds, AFRICA_LAND_ADJACENCY);
  const neighborStats: ScopeStats = { ...neighbors, due: 0 };

  return `
    <main class="page page--home page--tile-index">
      <header class="topbar">
        <div class="brand-block">
          ${brandMark()}
          <span class="brand-name">Flag Atlas</span>
        </div>
        <button class="text-icon-button" type="button" data-action="open-progress" aria-label="Open progress">
          ${icon('ledger')}
          <span>Progress</span>
        </button>
      </header>

      <section class="world-overview">
        <div class="overview-heading">
          <div><h1 tabindex="-1" data-autofocus>Learn geography</h1></div>
        </div>
      </section>

      ${homePersisting ? '' : `
        <p class="storage-notice">
          This browser is blocking storage, so today's progress will be lost when you close the tab.
        </p>
      `}

      <section class="atlas-section">
        <div class="continent-list">
          ${renderDomainRow('flags', worldScope, 'World · 195 flags', flags)}
          ${renderDomainRow('locations', africaScope, 'Africa · 54 countries · 5 regions', locationStats)}
          ${renderDomainRow('outlines', africaScope, 'Africa · 54 countries · 5 regions', outlines)}
          ${renderDomainRow(
            'neighbors',
            africaScope,
            `Africa · ${AFRICA_STANDARD_NEIGHBOR_TARGET_IDS.length} standard targets · 5 regions`,
            neighborStats,
          )}
        </div>
      </section>
    </main>
  `;
}
