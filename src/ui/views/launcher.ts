import type { MapRegionAsset } from '../../domain/map-models.js';
import type { LearningDomain, ScopeStats, StudyScope } from '../../domain/models.js';
import { domainDisplayName } from '../../domain/display.js';
import { icon } from '../components/icons.js';
import { renderLauncherMap } from '../components/launcher-map.js';
import { progressStrip } from '../components/progress.js';
import { escapeHtml } from '../format.js';

export interface LauncherRegion {
  scope: StudyScope;
  stats: ScopeStats;
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
  showMap: boolean;
  mapAsset?: MapRegionAsset | null;
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

function renderRegionRow(
  domain: LearningDomain,
  region: LauncherRegion,
  unitLabel: string,
  selectedRegionId: string | undefined,
): string {
  const selected = region.scope.id === selectedRegionId;
  const label = escapeHtml(region.scope.label);
  const id = escapeHtml(region.scope.id ?? '');
  const domainName = escapeHtml(domainLabel(domain));

  return `
    <div class="region-row${selected ? ' region-row--selected' : ''}">
      <button
        class="region-row__open"
        type="button"
        data-action="select-region"
        data-domain="${domain}"
        data-id="${id}"
        aria-pressed="${selected}"
      >
        <span class="region-row__identity">
          <strong>${label}</strong>
          <small>${region.stats.total} ${escapeHtml(unitLabel)} · ${region.stats.mastered} mastered</small>
        </span>
        ${selected ? '<span class="region-row__status">Selected</span>' : ''}
        ${icon('chevron')}
      </button>
      <button
        class="region-row__play"
        type="button"
        data-action="quick-play"
        data-domain="${domain}"
        data-id="${id}"
        aria-label="Play ${label} ${domainName}"
      >${icon('play')}</button>
    </div>
  `;
}

export function renderLauncher(model: LauncherModel): string {
  const actions = actionsFor(model.domain);
  const activeScope = model.selectedRegion ?? model.continentScope;
  const activeId = escapeHtml(activeScope.id ?? 'world');
  const continentId = escapeHtml(model.continentScope.id ?? '');
  const scopeLabel = escapeHtml(activeScope.label);
  const continentLabel = escapeHtml(model.continentScope.label);
  const domainName = escapeHtml(domainLabel(model.domain));
  const domainTitle = escapeHtml(domainDisplayName(model.domain));
  const selectedRegionId = model.selectedRegion?.id;
  const parentLabel = model.domain === 'flags' ? 'Back to continents' : 'Back to learning domains';
  const map = model.showMap && model.mapAsset
    ? renderLauncherMap(model.mapAsset, model.domain, selectedRegionId)
    : '';

  return `
    <main class="page page--launcher" data-launcher-domain="${model.domain}" data-launcher-continent="${continentId}">
      <header class="topbar topbar--detail launcher-header">
        <button class="icon-button" type="button" data-action="launcher-parent" aria-label="${parentLabel}">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus aria-label="${scopeLabel} ${domainName} launcher">${continentLabel}</h1>
          <span>${domainTitle} · ${model.regions.length} regions</span>
        </div>
      </header>

      <section class="launcher" aria-label="${continentLabel} ${domainName} launcher">
        <div class="launcher__status">
          <div class="scope-status-line">
            <strong>${model.stats.mastered} mastered</strong>
            <span>${model.stats.learning} learning · ${model.stats.unseen} unseen</span>
          </div>
          ${model.selectedRegion ? `
            <button
              class="launcher__all-scope"
              type="button"
              data-action="select-continent"
              data-domain="${model.domain}"
              data-id="${continentId}"
            >All ${continentLabel}</button>
          ` : ''}
          ${progressStrip(model.stats)}
        </div>

        <button
          class="button button--primary launcher__play"
          type="button"
          data-action="${actions.play}"
          data-domain="${model.domain}"
          data-scope-id="${activeId}"
        >Play ${scopeLabel}</button>

        ${model.showMap ? `
          <div
            class="launcher-map-slot"
            data-launcher-map-slot
            data-domain="${model.domain}"
            data-continent-id="${continentId}"
          >${map}</div>
        ` : ''}

        <section class="atlas-section launcher__regions" aria-labelledby="launcher-regions-heading">
          <div class="list-heading">
            <h2 id="launcher-regions-heading">Regions</h2>
            <span>${model.regions.length}</span>
          </div>
          <div class="region-list">
            ${model.regions.map((region) => renderRegionRow(
              model.domain,
              region,
              model.unitLabel,
              selectedRegionId,
            )).join('')}
          </div>
        </section>

        <button
          class="button button--tertiary launcher__learn"
          type="button"
          data-action="${actions.learn}"
          data-domain="${model.domain}"
          data-scope-id="${activeId}"
        >Learn ${scopeLabel}</button>
      </section>

      ${model.persisting ? '' : `<p class="storage-notice">${escapeHtml(model.storageNotice)}</p>`}
    </main>
  `;
}
