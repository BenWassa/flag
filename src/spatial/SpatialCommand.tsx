import { CONTINENTS } from '../data/continents.js';
import {
  getContinentAchievementReadModel,
  getWorldAchievementReadModel,
  type EarnedAchievementState,
} from '../domain/achievements.js';
import { domainDisplayName } from '../domain/display.js';
import { LEARNING_DOMAIN_IDS, type LearningDomain, type StudyScope } from '../domain/models.js';
import {
  buildDomainProgressSummary,
  buildProgressSummary,
  summaryStats,
  type ProgressLedgers,
} from '../domain/progress-summary.js';
import { scopeSupportsDomain } from '../domain/scope-support.js';
import { useAtlasActions } from '../react/actions.js';
import { ContinentTrophy, DomainIcon, Icon } from '../react/components/Icon.js';
import { ProgressStrip } from '../react/components/ProgressStrip.js';
import { START_ACTIONS, scopeModelFor, storageNoticeFor, type ScopeRegion } from '../react/scope-model.js';
import type { ScopeStatus, SpatialState } from './spatial-state.js';

/**
 * Issues #166, #197 and #198 — the command surface of the Spatial Atlas.
 *
 * Home still owns mode choice. Once a mode exists, geography and the projected
 * real-DOM labels own continent/area choice; this surface names only the current
 * decision and, once a scope is selected, gives that scope one quiet progress
 * signal plus its Play/Learn actions. It deliberately does not repeat the
 * geographic choices beneath the Earth.
 *
 * Forced colours is the exception because WebGL must stand down there. A small
 * fallback-only scope list is therefore rendered in the DOM but hidden in normal
 * Spatial presentation. Complete renderer failure still leaves the application
 * to the conventional Launcher, which is built from the same scope model.
 */

export interface SpatialCommandProps {
  state: SpatialState;
  ledgers: ProgressLedgers;
  achievements: EarnedAchievementState;
  persisting: boolean;
}

/** A shape as well as a colour: a diamond for complete, a dot for Mastered. */
const statusMark = (status: ScopeStatus) => (status === 'complete' ? '◆' : '●');

/**
 * Both earned states in words. A region can be Mastered in this domain and
 * complete across all four; selected-scope text must not make colour carry it.
 */
function statusNotes(region: Pick<ScopeRegion, 'complete' | 'domainMastered'>): string[] {
  return [region.domainMastered ? 'Mastered' : null, region.complete ? 'complete' : null]
    .filter((word): word is string => word !== null);
}

/**
 * Scope choices that exist only when the map itself cannot be the choice
 * surface, currently forced-colours mode. `display: none` removes this duplicate
 * from both the visual and accessibility trees during normal Spatial use.
 */
function FallbackChoice({ label, notes, current, onClick, disabled }: {
  label: string;
  notes?: readonly string[];
  current?: boolean;
  onClick(): void;
  disabled?: boolean;
}) {
  const name = [label, ...(notes ?? [])].filter(Boolean).join(', ');
  return (
    <button
      className="spatial-fallback-choice"
      type="button"
      aria-current={current ? 'true' : undefined}
      aria-label={name}
      disabled={disabled}
      onClick={onClick}
    >{label}</button>
  );
}

/** Choose what to learn. The globe has nothing to select yet, so it is context. */
function Domains({ ledgers, achievements }: { ledgers: ProgressLedgers; achievements: EarnedAchievementState }) {
  const actions = useAtlasActions();
  const crown = getWorldAchievementReadModel(achievements).crownEarned;
  return (
    <>
      <div className="spatial-command__head">
        <h1 className="spatial-command__place" tabIndex={-1} data-autofocus>Atlas</h1>
        <button className="icon-button spatial-command__aside" type="button" onClick={actions.openProfile} aria-label="Profile"><Icon name="profile" /></button>
      </div>
      {crown ? <section className="world-crown" aria-labelledby="world-crown-title" data-world-crown-earned>
        <div className="world-crown__identity"><h2 id="world-crown-title">World Crown</h2><p>Earned · all six continents complete</p></div>
      </section> : null}
      <h2 className="atlas-eyebrow">Modes</h2>
      <nav className="spatial-command__choices" aria-label="Learning modes">
        {LEARNING_DOMAIN_IDS.map((domain) => {
          const summary = buildDomainProgressSummary(ledgers, domain);
          return (
            <button className="spatial-mode" type="button" key={domain} data-domain={domain}
              aria-label={`${summary.label}, ${summary.cleared} of ${summary.total} cleared`}
              onClick={() => actions.openDomain(domain)}
            >
              <span className="spatial-mode__mark" aria-hidden="true"><DomainIcon domain={domain} /></span>
              <span className="spatial-mode__name">{summary.label}</span>
              <span className="spatial-mode__meter" aria-hidden="true"><ProgressStrip stats={summaryStats(summary)} domain={domain} /></span>
              <span className="spatial-mode__meta" aria-hidden="true">{summary.cleared}/{summary.total}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

/** Choose a continent on the Earth; no duplicate visible list sits below it. */
function Continents({ domain, ledgers }: {
  domain: LearningDomain;
  ledgers: ProgressLedgers;
}) {
  const actions = useAtlasActions();
  const world = domain === 'flags' ? buildProgressSummary(ledgers, { kind: 'world', label: 'World' }, 'flags') : null;
  return (
    <>
      <div className="spatial-command__head">
        <button className="icon-button spatial-command__back" type="button" onClick={actions.goBack} aria-label="Back to modes"><Icon name="back" /></button>
        <p className="spatial-command__domain"><span className="spatial-command__domain-mark" aria-hidden="true"><DomainIcon domain={domain} /></span>Choose a continent</p>
        <h1 className="spatial-command__place" tabIndex={-1} data-autofocus>{domainDisplayName(domain)}</h1>
      </div>
      {world ? <div className="spatial-command__actions">
        <button className="button button--primary" type="button" onClick={() => actions.startFlags('test')}>Play world</button>
        <button className="button button--secondary" type="button" onClick={() => actions.startFlags('learn')}>Learn world</button>
      </div> : null}
      <nav className="spatial-command__fallback-choices" aria-label="Continents">
        {CONTINENTS.map((continent) => {
          const scope: StudyScope = { kind: 'continent', id: continent.id, label: continent.name };
          const supported = scopeSupportsDomain(scope, domain);
          return (
            <FallbackChoice
              key={continent.id}
              label={continent.name}
              notes={supported ? undefined : ['coming soon']}
              disabled={!supported}
              onClick={() => actions.openScope(domain, continent.id)}
            />
          );
        })}
      </nav>
    </>
  );
}

/** A continent or region is framed. Only that scope gets progress and actions. */
function Scope({ state, ledgers, achievements }: {
  state: SpatialState;
  ledgers: ProgressLedgers;
  achievements: EarnedAchievementState;
}) {
  const actions = useAtlasActions();
  const domain = state.domain;
  const framed = state.framedScope;
  if (!domain || !framed) return null;
  const model = scopeModelFor(domain, framed, ledgers, achievements);
  if (!model) {
    return (
      <div className="spatial-command__head">
        <button className="icon-button spatial-command__back" type="button" onClick={actions.goBack} aria-label={`Back to ${domainDisplayName(domain)}`}><Icon name="back" /></button>
        <p className="spatial-command__domain">{domainDisplayName(domain)}</p>
        <h1 className="spatial-command__place" tabIndex={-1} data-autofocus>{framed.label}</h1>
        <p className="spatial-command__meta">Not available yet.</p>
      </div>
    );
  }

  const active = model.activeScope;
  const activeId = active.id ?? '';
  const continentId = model.continentScope.id ?? '';
  const onContinent = activeId === continentId;
  const activeRegion = model.regions.find((region) => region.scope.id === activeId);
  const status = activeRegion ? state.scopeStatus.get(activeId) ?? null : null;
  const notes = activeRegion ? statusNotes(activeRegion) : [];
  const continent = CONTINENTS.find((item) => item.id === continentId);
  const continentAchievement = continent ? getContinentAchievementReadModel(achievements, continent.id) : null;
  const crestEarned = onContinent && continentAchievement?.crestEarned === true;

  return (
    <>
      <div className="spatial-command__head">
        <button className="icon-button spatial-command__back" type="button" onClick={actions.goBack} aria-label={`Back to ${domainDisplayName(domain)}`}><Icon name="back" /></button>
        <p className="spatial-command__domain"><span className="spatial-command__domain-mark" aria-hidden="true"><DomainIcon domain={domain} /></span>{domainDisplayName(domain)}</p>
        <div className="spatial-command__identity">
          <h1 className="spatial-command__place" tabIndex={-1} data-autofocus>
            {active.label}
            {notes.length ? <span className="visually-hidden">, {notes.join(', ')}</span> : null}
            {status ? <span className={`spatial-command__mark spatial-command__mark--${status}`} aria-hidden="true">{statusMark(status)}</span> : null}
          </h1>
          {onContinent ? <span className="spatial-command__crest-slot" aria-hidden={crestEarned ? undefined : 'true'}>
            {crestEarned && continent ? <span className="spatial-command__crest" role="img" aria-label={`${active.label} complete, continent crest earned`}>
              <ContinentTrophy id={continent.id} />
            </span> : null}
          </span> : null}
        </div>
      </div>

      <div className="spatial-command__progress" data-scope-id={activeId}>
        <ProgressStrip stats={model.stats} domain={domain} />
      </div>

      <div className="spatial-command__actions">
        <button
          className="button button--primary"
          type="button"
          data-action={START_ACTIONS[domain].play}
          data-domain={domain}
          data-scope-id={activeId}
          onClick={(event) => activeId && actions.playScope(domain, activeId, event.currentTarget)}
        >Play {active.label}</button>
        <button
          className="button button--secondary"
          type="button"
          data-action={START_ACTIONS[domain].learn}
          data-domain={domain}
          data-scope-id={activeId}
          onClick={(event) => activeId && actions.learnScope(domain, activeId, event.currentTarget)}
        >Learn {active.label}</button>
      </div>

      <nav className="spatial-command__fallback-choices" aria-label={`Areas of ${model.continentScope.label}`}>
        <FallbackChoice
          label={`All ${model.continentScope.label}`}
          current={onContinent}
          onClick={() => continentId && actions.openScope(domain, continentId)}
        />
        {model.regions.map((region) => {
          const id = region.scope.id ?? '';
          return (
            <FallbackChoice
              key={id}
              label={region.scope.label}
              notes={statusNotes(region)}
              current={id === activeId}
              onClick={() => id && actions.openScope(domain, id)}
            />
          );
        })}
      </nav>
    </>
  );
}

export function SpatialCommand({ state, ledgers, achievements, persisting }: SpatialCommandProps) {
  if (!state.navigation) return null;
  const notice = !persisting && state.domain ? storageNoticeFor(state.domain) : null;
  return (
    <section className="spatial-command" data-surface={state.navigation} data-domain={state.domain ?? undefined} aria-label="Atlas navigation">
      {state.navigation === 'domains' ? <Domains ledgers={ledgers} achievements={achievements} /> : null}
      {state.navigation === 'continents' && state.domain
        ? <Continents domain={state.domain} ledgers={ledgers} /> : null}
      {state.navigation === 'scope'
        ? <Scope state={state} ledgers={ledgers} achievements={achievements} /> : null}
      {notice ? <p className="storage-notice">{notice}</p> : null}
    </section>
  );
}
