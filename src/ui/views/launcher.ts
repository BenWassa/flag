import type { LearningDomain, ScopeStats, StudyScope } from '../../domain/models.js';
import { domainDisplayName } from '../../domain/display.js';
import { domainIcon, icon } from '../components/icons.js';
import { progressStrip } from '../components/progress.js';
import { escapeHtml } from '../format.js';

export interface LauncherRegion {
  scope: StudyScope;
  stats: ScopeStats;
  /** This region has earned mastery in the launcher's current domain. */
  domainMastered?: boolean;
  /** Every supported domain in this region is mastered. */
  complete?: boolean;
}

export interface LauncherModel {
  domain: LearningDomain;
  continentScope: StudyScope;
  selectedRegion?: StudyScope;
  stats: ScopeStats;
  regions: readonly LauncherRegion[];
  unitLabel: string;
  persisting: boolean;
  storageNotice: string;
}

interface LauncherActions {
  learn: string;
  play: string;
}

function actionsFor(domain: LearningDomain): LauncherActions {
  switch (domain) {
    case 'flags': return { learn: 'start-learn', play: 'start-test' };
    case 'locations': return { learn: 'start-map-learn', play: 'start-map-test' };
    case 'outlines': return { learn: 'start-outline-learn', play: 'start-outline-test' };
    case 'neighbors': return { learn: 'start-neighbor-learn', play: 'start-neighbor-test' };
  }
}

function domainLabel(domain: LearningDomain): string {
  return domainDisplayName(domain).toLowerCase();
}

function renderScopeRow(
  domain: LearningDomain,
  scope: StudyScope,
  stats: ScopeStats,
  unitLabel: string,
  variant: 'continent' | 'region',
  options: { domainMastered?: boolean; complete?: boolean } = {},
): string {
  const play = actionsFor(domain).play;
  const label = escapeHtml(variant === 'continent' ? `All ${scope.label}` : scope.label);
  const id = escapeHtml(scope.id ?? '');
  const rowClass = [
    'region-row',
    variant === 'continent' ? 'region-row--continent' : '',
    options.complete ? 'region-row--complete' : '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${rowClass}">
      <button
        class="region-row__open"
        type="button"
        data-action="${play}"
        data-domain="${domain}"
        data-id="${id}"
        data-scope-id="${id}"
        aria-label="Play ${label}"
      >
        <span class="region-row__identity">
          <strong>${label}${options.domainMastered ? `<span class="region-row__mastery" aria-label="Mastered">${icon('star')}</span>` : ''}</strong>
          <small>${stats.total} ${escapeHtml(unitLabel)}</small>
        </span>
        ${stats.due > 0 ? `<span class="region-row__evidence">${stats.due} due</span>` : ''}
        <span class="region-row__progress">${progressStrip(stats)}</span>
        ${icon('chevron')}
      </button>
    </div>
  `;
}

export function renderLauncher(model: LauncherModel): string {
  const actions = actionsFor(model.domain);
  const activeScope = model.selectedRegion ?? model.continentScope;
  const continentId = escapeHtml(model.continentScope.id ?? '');
  const scopeLabel = escapeHtml(activeScope.label);
  const continentLabel = escapeHtml(model.continentScope.label);
  const domainName = escapeHtml(domainLabel(model.domain));
  const domainTitle = escapeHtml(domainDisplayName(model.domain));
  const parentLabel = `Back to ${domainTitle}`;

  return `
    <main class="page page--launcher" data-launcher-domain="${model.domain}" data-launcher-continent="${continentId}">
      <header class="topbar topbar--detail launcher-header">
        <button class="icon-button" type="button" data-action="launcher-parent" aria-label="${parentLabel}">${icon('back')}</button>
        <span class="launcher-header__icon" aria-hidden="true">${domainIcon(model.domain)}</span>
        <div class="screen-title">
          <span class="screen-title__row">
            <h1 tabindex="-1" data-autofocus aria-label="${scopeLabel} ${domainName} launcher">${scopeLabel}</h1>
            <span class="launcher-header__badge" aria-hidden="true"></span>
          </span>
          <span>${domainTitle}</span>
        </div>
      </header>

      <section class="launcher" aria-label="${continentLabel} ${domainName} launcher">
        <div class="region-list region-list--continent">
          ${renderScopeRow(model.domain, model.continentScope, model.stats, model.unitLabel, 'continent')}
        </div>

        <section class="atlas-section launcher__regions" aria-labelledby="launcher-regions-heading">
          <div class="list-heading">
            <h2 id="launcher-regions-heading">Regions</h2>
          </div>
          <div class="region-list">
            ${model.regions.map((region) => renderScopeRow(
              model.domain,
              region.scope,
              region.stats,
              model.unitLabel,
              'region',
              { domainMastered: region.domainMastered, complete: region.complete },
            )).join('')}
          </div>
        </section>

        <button
          class="button button--tertiary launcher__learn"
          type="button"
          data-action="${actions.learn}"
          data-domain="${model.domain}"
          data-scope-id="${continentId}"
        >Learn ${continentLabel}</button>
      </section>

      ${model.persisting ? '' : `<p class="storage-notice">${escapeHtml(model.storageNotice)}</p>`}
    </main>
  `;
}
