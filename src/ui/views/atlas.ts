import { CONTINENTS, REGIONS } from '../../data/continents.js';
import { COUNTRIES } from '../../data/countries.js';
import { domainDisplayName } from '../../domain/display.js';
import { LEARNING_DOMAIN_IDS, type ProgressState, type StudyScope } from '../../domain/models.js';
import { getScopeStats } from '../../domain/progress.js';
import { scopeSupportsDomain } from '../../domain/scope-support.js';
import { domainIcon, icon } from '../components/icons.js';
import { escapeHtml } from '../format.js';

function backButton(label: string): string {
  return `<button class="icon-button" type="button" data-action="route-parent" aria-label="${escapeHtml(label)}">${icon('back')}</button>`;
}

/**
 * The four launchers are the highest-frequency action in the product, so each
 * one names its domain in visible text rather than relying on the glyph alone.
 * DESIGN.md's own icon rationale assumes this: `Intersect` was accepted for
 * Neighbours because it is read "paired with the visible Neighbours label",
 * and Polygon/Intersect are genuinely ambiguous at 22px without one.
 */
function domainLaunchRow(scope: StudyScope): string {
  const label = escapeHtml(scope.label);
  const buttons = LEARNING_DOMAIN_IDS.map((domain) => {
    const supported = scopeSupportsDomain(scope, domain);
    const name = escapeHtml(domainDisplayName(domain));

    if (!supported) {
      return `
        <span class="domain-launch domain-launch--absent" title="${name} not available yet">
          <span class="domain-launch__mark" aria-hidden="true">${domainIcon(domain)}</span>
          <span class="domain-launch__label">${name}</span>
          <span class="visually-hidden">not available yet</span>
        </span>
      `;
    }

    return `
      <button
        class="domain-launch"
        type="button"
        data-action="quick-play"
        data-domain="${domain}"
        data-id="${escapeHtml(scope.id ?? '')}"
        aria-label="Play ${label} ${name.toLowerCase()}"
      >
        <span class="domain-launch__mark" aria-hidden="true">${domainIcon(domain)}</span>
        <span class="domain-launch__label" aria-hidden="true">${name}</span>
      </button>
    `;
  }).join('');
  return `<span class="domain-launch-row">${buttons}</span>`;
}

function regionCard(region: { id: string; name: string }, progress: ProgressState): string {
  const scope: StudyScope = { kind: 'region', id: region.id, label: region.name };
  const stats = getScopeStats(COUNTRIES, progress, scope);
  const name = escapeHtml(region.name);

  return `
    <div class="atlas-card atlas-card--region">
      <span class="atlas-card__head">
        <strong>${name}</strong>
        <small>${stats.total} countries</small>
      </span>
      ${domainLaunchRow(scope)}
    </div>
  `;
}

/**
 * The continent-wide Play entry point (#76). Reuses the region card chassis
 * and the identical domainLaunchRow so the four-domain vocabulary reads the
 * same at every scope — only weight, size and copy set it apart, never the
 * gold/purple prestige palette, so it can't be mistaken for a sixth region.
 */
function continentCard(
  continent: { id: string; name: string },
  regionCount: number,
  progress: ProgressState,
): string {
  const scope: StudyScope = { kind: 'continent', id: continent.id, label: continent.name };
  const stats = getScopeStats(COUNTRIES, progress, scope);
  const name = escapeHtml(continent.name);

  return `
    <div class="atlas-card atlas-card--region atlas-card--continent">
      <span class="atlas-card__head">
        <strong>All of ${name}</strong>
        <small>${stats.total} countries · ${regionCount} regions</small>
      </span>
      ${domainLaunchRow(scope)}
    </div>
  `;
}

export function renderContinent(
  progress: ProgressState,
  scope: StudyScope,
  persisting = true,
): string {
  const continent = CONTINENTS.find((item) => item.id === scope.id);
  const regions = REGIONS.filter((region) => region.continentId === scope.id);
  const label = escapeHtml(continent?.name ?? scope.label);

  return `
    <main class="page page--atlas">
      <header class="topbar topbar--atlas topbar--detail">
        ${backButton('Back to continents')}
        <h1 class="atlas-title" tabindex="-1" data-autofocus>${label}</h1>
        <span class="topbar__balance" aria-hidden="true"></span>
      </header>

      ${persisting ? '' : `
        <p class="storage-notice">
          This browser is blocking storage, so today's progress will be lost when you close the tab.
        </p>
      `}

      <div class="atlas-card-list">
        ${continent ? continentCard(continent, regions.length, progress) : ''}
        ${regions.map((region) => regionCard(region, progress)).join('')}
      </div>
    </main>
  `;
}
