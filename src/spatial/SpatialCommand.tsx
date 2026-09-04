import { CONTINENTS } from '../data/continents.js';
import {
  getWorldAchievementReadModel,
  type EarnedAchievementState,
} from '../domain/achievements.js';
import { domainDisplayName } from '../domain/display.js';
import { LEARNING_DOMAIN_IDS, type LearningDomain, type ScopeStats, type StudyScope } from '../domain/models.js';
import {
  buildDomainProgressSummary,
  buildProgressSummary,
  summaryStats,
  type ProgressLedgers,
} from '../domain/progress-summary.js';
import { scopeSupportsDomain } from '../domain/scope-support.js';
import { useAtlasActions } from '../react/actions.js';
import { DomainIcon, Icon } from '../react/components/Icon.js';
import { ProgressStrip } from '../react/components/ProgressStrip.js';
import { START_ACTIONS, scopeModelFor, storageNoticeFor, type ScopeRegion } from '../react/scope-model.js';
import type { ScopeStatus, SpatialState } from './spatial-state.js';

/**
 * Issue #166 — the command surface of the Spatial Atlas.
 *
 * This is the whole navigation interface, not a summary of one rendered
 * elsewhere: when it is on screen no conventional launcher page renders beneath
 * the globe. It is real DOM throughout, so keyboard and screen-reader users
 * reach every choice the geography offers, and it dispatches the same
 * `AtlasActions` a tap on the globe does — there is no second navigation stack.
 *
 * The design follows DESIGN.md rather than the launcher it replaces: geography
 * owns the viewport, the selected place is the one dominant label, the domain is
 * present but secondary, Play is immediately available, and lateral choices are
 * quiet wrapping chips rather than a stack of cards. Progress that a chip cannot
 * show in a glance is carried in its accessible name instead of being dropped,
 * which is also what #118 found the launcher rows were failing to do.
 */

export interface SpatialCommandProps {
  state: SpatialState;
  ledgers: ProgressLedgers;
  achievements: EarnedAchievementState;
  persisting: boolean;
}

/** A shape as well as a colour: a diamond for complete, a dot for Mastered. */
const statusMark = (status: ScopeStatus) => (status === 'complete' ? '◆' : '●');

function statusOf(region: Pick<ScopeRegion, 'complete' | 'domainMastered'>): ScopeStatus | null {
  if (region.complete) return 'complete';
  if (region.domainMastered) return 'mastered';
  return null;
}

/**
 * Both earned states in words. The chip carries one mark, but a region can be
 * Mastered in this domain and complete across all four, and colour never
 * carries either on its own.
 */
function statusNotes(region: Pick<ScopeRegion, 'complete' | 'domainMastered'>): string[] {
  return [region.domainMastered ? 'Mastered' : null, region.complete ? 'complete' : null]
    .filter((word): word is string => word !== null);
}

/** `12 of 54 cleared`, the one progress figure a chip has room for. */
const clearedLabel = (stats: ScopeStats) => `${stats.cleared} of ${stats.total} cleared`;

function Chip({ label, detail, status, notes, current, onClick, disabled }: {
  label: string;
  detail?: string;
  /** Drives the visual mark. Complete outranks Mastered for the single mark. */
  status?: ScopeStatus | null;
  /** Everything the mark cannot say. A region can be both Mastered and complete. */
  notes?: readonly string[];
  current?: boolean;
  onClick(): void;
  disabled?: boolean;
}) {
  const name = [label, detail, ...(notes ?? [])].filter(Boolean).join(', ');
  return (
    <button
      className={`spatial-chip${status ? ` spatial-chip--${status}` : ''}`}
      type="button"
      aria-current={current ? 'true' : undefined}
      aria-label={name}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="spatial-chip__label">{label}</span>
      {status ? <span className="spatial-chip__mark" aria-hidden="true">{statusMark(status)}</span> : null}
    </button>
  );
}

/** Choose what to learn. The globe has nothing to select yet, so it is context. */
function Domains({ ledgers, achievements }: { ledgers: ProgressLedgers; achievements: EarnedAchievementState }) {
  const actions = useAtlasActions();
  const crown = getWorldAchievementReadModel(achievements).crownEarned;
  return (
    <>
      {/* The heading names where the learner is, exactly as it does for a
          framed place. Home's own semantics — the brand heading, the World
          Crown block and the Modes heading — are preserved verbatim: #166
          redesigns the navigation surface, not Home's information, and the
          Crown's learner-facing presentation belongs to #138. */}
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
              {/* The button carries its own accessible name, so the strip inside
                  it is decoration over a figure the name already states. */}
              <span className="spatial-mode__meter" aria-hidden="true"><ProgressStrip stats={summaryStats(summary)} domain={domain} /></span>
              <span className="spatial-mode__meta" aria-hidden="true">{summary.cleared}/{summary.total}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

/** Choose a continent, by tapping the globe or its equivalent control. */
function Continents({ domain, ledgers, achievements }: {
  domain: LearningDomain;
  ledgers: ProgressLedgers;
  achievements: EarnedAchievementState;
}) {
  const actions = useAtlasActions();
  const summary = buildDomainProgressSummary(ledgers, domain);
  const world = domain === 'flags' ? buildProgressSummary(ledgers, { kind: 'world', label: 'World' }, 'flags') : null;
  return (
    <>
      <div className="spatial-command__head">
        <button className="icon-button spatial-command__back" type="button" onClick={actions.goBack} aria-label="Back to modes"><Icon name="back" /></button>
        <p className="spatial-command__domain"><span className="spatial-command__domain-mark" aria-hidden="true"><DomainIcon domain={domain} /></span>Choose a continent</p>
        <h1 className="spatial-command__place" tabIndex={-1} data-autofocus>{domainDisplayName(domain)}</h1>
        {/* A concrete figure rather than the coverage word, which degenerates to
            "World" once every continent ships; #152 owns that label's defects. */}
        <p className="spatial-command__meta">
          {summary.supportedContinentIds.length} continents · {summary.cleared} of {summary.total} cleared
        </p>
      </div>
      {world ? <div className="spatial-command__actions">
        <button className="button button--primary" type="button" onClick={() => actions.startFlags('test')}>Play world</button>
        <button className="button button--secondary" type="button" onClick={() => actions.startFlags('learn')}>Learn world</button>
      </div> : null}
      <nav className="spatial-command__choices spatial-command__choices--wrap" aria-label="Continents">
        {CONTINENTS.map((continent) => {
          const scope: StudyScope = { kind: 'continent', id: continent.id, label: continent.name };
          const supported = scopeSupportsDomain(scope, domain);
          const model = supported ? scopeModelFor(domain, scope, ledgers, achievements) : null;
          return (
            <Chip
              key={continent.id}
              label={continent.name}
              detail={model ? clearedLabel(model.stats) : undefined}
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

/** A continent or region is framed. Play is one tap away. */
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
  // Route normalisation keeps unsupported scopes off this surface, so this is a
  // guard rather than a state. It still has to leave a way out.
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
  const status = activeId ? state.scopeStatus.get(activeId) ?? null : null;
  const notes = activeRegion ? statusNotes(activeRegion) : [];

  return (
    <>
      <div className="spatial-command__head">
        <button className="icon-button spatial-command__back" type="button" onClick={actions.goBack} aria-label={`Back to ${domainDisplayName(domain)}`}><Icon name="back" /></button>
        <p className="spatial-command__domain"><span className="spatial-command__domain-mark" aria-hidden="true"><DomainIcon domain={domain} /></span>{domainDisplayName(domain)}</p>
        {/* The selected place is the one dominant label on the screen. */}
        <h1 className="spatial-command__place" tabIndex={-1} data-autofocus>
          {active.label}
          {notes.length ? <span className="visually-hidden">, {notes.join(', ')}</span> : null}
          {status ? <span className={`spatial-command__mark spatial-command__mark--${status}`} aria-hidden="true">{statusMark(status)}</span> : null}
        </h1>
        <p className="spatial-command__meta">{model.stats.total} {model.unitLabel}{model.stats.due > 0 ? ` · ${model.stats.due} due` : ''}</p>
      </div>

      {/* Ordinary progress stays the quiet blue retrieval strip the design
          system fixes it as, rather than being demoted to a figure in a line. */}
      <ProgressStrip stats={model.stats} domain={domain} />

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

      {/* Quiet lateral choices: the parent continent and its sibling areas. Each
          dispatches openScope, exactly as a tap on the geography does. */}
      <nav className="spatial-command__choices spatial-command__choices--wrap" aria-label={`Areas of ${model.continentScope.label}`}>
        <Chip
          label={`All ${model.continentScope.label}`}
          current={onContinent}
          onClick={() => continentId && actions.openScope(domain, continentId)}
        />
        {model.regions.map((region) => {
          const id = region.scope.id ?? '';
          return (
            <Chip
              key={id}
              label={region.scope.label}
              detail={clearedLabel(region.stats)}
              status={statusOf(region)}
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
        ? <Continents domain={state.domain} ledgers={ledgers} achievements={achievements} /> : null}
      {state.navigation === 'scope'
        ? <Scope state={state} ledgers={ledgers} achievements={achievements} /> : null}
      {notice ? <p className="storage-notice">{notice}</p> : null}
    </section>
  );
}
