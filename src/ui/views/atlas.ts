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

function domainLaunchRow(scope: StudyScope): string {
  const label = escapeHtml(scope.label);
  const buttons = LEARNING_DOMAIN_IDS.map((domain) => {
    const supported = scopeSupportsDomain(scope, domain);
    const name = escapeHtml(domainDisplayName(domain));

    if (!supported) {
      return `
        <span class="domain-launch domain-launch--absent" title="${name} not available yet">
          ${domainIcon(domain)}<span class="visually-hidden">${name} not available yet</span>
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
      >${domainIcon(domain)}</button>
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
        ${regions.map((region) => regionCard(region, progress)).join('')}
      </div>
    </main>
  `;
}
