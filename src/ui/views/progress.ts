import { CONTINENTS, REGIONS } from '../../data/continents.js';
import {
  getContinentAchievementReadModel,
  getRegionAchievementReadModel,
  getWorldAchievementReadModel,
  type EarnedAchievementState,
} from '../../domain/achievements.js';
import type { LearningDomain, StudyScope } from '../../domain/models.js';
import { buildScopeProgressSummaries, type ProgressLedgers } from '../../domain/progress-summary.js';
import { countryIdsForSupportedScope } from '../../domain/scope-support.js';
import { continentAchievementMark, worldCrownIcon } from '../components/achievement-art.js';
import { domainIcon, icon } from '../components/icons.js';
import { escapeHtml } from '../format.js';

const AFRICA_SCOPE: StudyScope = { kind: 'continent', id: 'africa', label: 'Africa' };
const DOMAIN_IDS: readonly LearningDomain[] = ['flags', 'locations', 'outlines', 'neighbors'];
const DOMAIN_LABELS: Record<LearningDomain, string> = {
  flags: 'Flags',
  locations: 'Locations',
  outlines: 'Outlines',
  neighbors: 'Neighbours',
};

function regionCountryCount(regionId: string, regionName: string): number {
  const scope: StudyScope = { kind: 'region', id: regionId, label: regionName };
  return countryIdsForSupportedScope(scope, 'flags').length;
}

function renderMasteryBadge(
  domain: LearningDomain,
  supported: boolean,
  earned: boolean,
): string {
  const label = DOMAIN_LABELS[domain];
  const state = !supported ? 'Coming soon' : earned ? 'Mastery earned' : 'Available, not yet earned';
  const stateClass = !supported ? 'unavailable' : earned ? 'earned' : 'unearned';
  return `
    <span class="progress-mastery-badge progress-mastery-badge--${stateClass}" role="img" aria-label="${escapeHtml(label)}: ${state}" title="${escapeHtml(label)} — ${state}">
      ${domainIcon(domain)}
      ${earned ? `<span class="progress-mastery-badge__check">${icon('check')}</span>` : ''}
    </span>
  `;
}

function renderRegionMastery(achievements: EarnedAchievementState, regionId: string): string {
  const region = REGIONS.find((item) => item.id === regionId);
  const model = getRegionAchievementReadModel(achievements, regionId);
  if (!region || !model) return '';

  const countryCount = regionCountryCount(region.id, region.name);
  const supportedCount = model.supportedDomains.length;
  const detail = model.complete
    ? `${countryCount} countries · Complete region`
    : model.completeCurriculum
      ? `${countryCount} countries`
      : `${countryCount} countries · ${supportedCount === 1 ? 'Flags available' : `${supportedCount} domains available`}`;

  return `
    <div class="progress-region-mastery ${model.complete ? 'progress-region-mastery--complete' : ''}" aria-label="${escapeHtml(region.name)}${model.complete ? ', complete region' : ''}">
      <span class="progress-region-mastery__identity">
        <strong>${escapeHtml(region.name)}</strong>
        <small>${escapeHtml(detail)}</small>
      </span>
      <span class="progress-region-mastery__domains" aria-label="${escapeHtml(region.name)} domain mastery">
        ${DOMAIN_IDS.map((domain) => renderMasteryBadge(
          domain,
          model.supportedDomains.includes(domain),
          model.domainMastery[domain],
        )).join('')}
      </span>
    </div>
  `;
}

function renderContinentMastery(achievements: EarnedAchievementState, continentId: (typeof CONTINENTS)[number]['id']): string {
  const continent = CONTINENTS.find((item) => item.id === continentId);
  const model = getContinentAchievementReadModel(achievements, continentId);
  if (!continent || !model) return '';

  const regions = REGIONS.filter((region) => region.continentId === continentId);
  const status = model.crestEarned
    ? 'Continent complete · Crest earned'
    : model.completeCurriculum
      ? 'All four domains available'
      : 'Flags available · more domains coming';

  return `
    <details class="progress-continent ${model.crestEarned ? 'progress-continent--complete' : ''}" ${continentId === 'africa' ? 'open' : ''}>
      <summary class="progress-continent__summary">
        ${continentAchievementMark(continentId, model.crestEarned)}
        <span class="progress-continent__identity">
          <strong>${escapeHtml(continent.name)}</strong>
          <small>${escapeHtml(status)}</small>
        </span>
        <span class="progress-continent__chevron">${icon('chevron')}</span>
      </summary>
      <div class="progress-continent__regions">
        ${regions.map((region) => renderRegionMastery(achievements, region.id)).join('')}
      </div>
    </details>
  `;
}

/**
 * Names the four domain glyphs once, at the top of the surface that then
 * repeats them unlabelled on every region below. Outlines and Neighbours are
 * not readable from a 19px Polygon or Intersect mark on their own, and a label
 * on each of the ~96 badges would bury the mastery reading it exists to show.
 */
function renderMasteryLegend(): string {
  return `
    <p class="progress-mastery-legend">
      ${DOMAIN_IDS.map((domain) => `
        <span class="progress-mastery-legend__item">
          <span class="progress-mastery-legend__mark" aria-hidden="true">${domainIcon(domain)}</span>
          ${DOMAIN_LABELS[domain]}
        </span>
      `).join('')}
    </p>
  `;
}

function renderMastery(achievements: EarnedAchievementState): string {
  const world = getWorldAchievementReadModel(achievements);
  return `
    <section class="progress-mastery" aria-labelledby="progress-mastery-heading">
      <div class="progress-section-heading">
        <h2 id="progress-mastery-heading">Mastery</h2>
        <p>Earned region by region across the four Atlas domains.</p>
      </div>
      ${renderMasteryLegend()}
      <div class="progress-continent-list">
        ${CONTINENTS.map((continent) => renderContinentMastery(achievements, continent.id)).join('')}
      </div>
      <div class="progress-world-status ${world.crownEarned ? 'progress-world-status--earned' : ''}" aria-label="World ${world.crownEarned ? 'complete, Crown earned' : 'curriculum still expanding'}">
        <span class="progress-world-status__identity">
          <strong>World</strong>
          <small>${world.crownEarned ? 'World complete' : 'Global curriculum expanding'}</small>
        </span>
        ${world.crownEarned ? worldCrownIcon() : ''}
      </div>
    </section>
  `;
}

export function renderProgress(
  ledgers: ProgressLedgers,
  achievements: EarnedAchievementState,
  resetArmed = false,
  persisting = true,
): string {
  const persistenceAvailable = persisting;
  const summaries = buildScopeProgressSummaries(ledgers, AFRICA_SCOPE);

  const studiedCount = summaries.reduce((sum, item) => sum + item.learning + item.strong + item.due, 0);
  const hasAchievements = achievements.regionDomainMasteries.length > 0
    || achievements.completeRegions.length > 0
    || achievements.completeContinents.length > 0
    || achievements.worldCrown;
  const hasHistory = studiedCount > 0 || hasAchievements;

  return `
    <main class="page ledger-page progress-page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="home" aria-label="Back to atlas">${icon('back')}</button>
        <div class="screen-title">
          <h1 tabindex="-1" ${resetArmed ? '' : 'data-autofocus'}>Progress</h1>
          <span>Build mastery region by region.</span>
        </div>
      </header>

      ${!persistenceAvailable ? `
        <div class="progress-storage-state" role="status">
          <strong>Progress is temporary</strong>
          <span>This browser is not allowing storage, so progress is temporary.</span>
        </div>
      ` : ''}

      ${studiedCount === 0 && !hasAchievements ? `
        <div class="progress-first-use" role="status">
          <strong>Your Atlas starts here</strong>
          <span>Not practised yet. Practise any Africa domain to begin building regional mastery.</span>
        </div>
      ` : ''}

      ${renderMastery(achievements)}

      ${hasHistory ? `
        <div class="ledger-footer">
          ${resetArmed ? `
            <p role="alert">Erase all learning evidence and earned achievements across Flags, Locations, Outlines and Neighbours? This cannot be undone.</p>
            <button class="button button--danger" data-action="reset-confirm">Erase everything</button>
            <button class="button button--tertiary" data-action="reset-cancel" data-autofocus>Keep my progress</button>
          ` : `
            <p>${persistenceAvailable
              ? 'Your learning evidence and earned achievements are stored on this device.'
              : 'New evidence may only last until you close the tab.'}</p>
            <button class="button button--tertiary" data-action="reset-request">Reset all progress</button>
          `}
        </div>
      ` : ''}
    </main>
  `;
}
