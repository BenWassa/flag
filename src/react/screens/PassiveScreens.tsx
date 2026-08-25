import { CONTINENTS, REGIONS } from '../../data/continents.js';
import { COUNTRIES } from '../../data/countries.js';
import { getContinentAchievementReadModel, type EarnedAchievementState } from '../../domain/achievements.js';
import { domainDisplayName } from '../../domain/display.js';
import {
  LEARNING_DOMAIN_IDS,
  type Country,
  type LearningDomain,
  type ScopeStats,
  type StudyScope,
} from '../../domain/models.js';
import {
  buildDomainProgressSummary,
  buildProgressSummary,
  type DomainProgressSummary,
  type ProgressLedgers,
  type ProgressSummary,
} from '../../domain/progress-summary.js';
import { countriesInScope } from '../../domain/progress.js';
import { scopeSupportsDomain } from '../../domain/scope-support.js';
import { coverageLabel } from '../../ui/format.js';
import { lazy, Suspense, useState } from 'react';
import { isDevelopmentSandbox } from '../../infrastructure/runtime-environment.js';
import { useAtlasActions } from '../actions.js';
import { FlagImage } from '../components/FlagImage.js';
import { ContinentIcon, ContinentTrophy, DomainIcon, Icon } from '../components/Icon.js';
import { ProgressStrip } from '../components/ProgressStrip.js';
import { useAuth } from '../useAuth.js';

const DevelopmentSandboxPanel = typeof __ATLAS_DEVELOPMENT_SANDBOX__ !== 'undefined' && __ATLAS_DEVELOPMENT_SANDBOX__
  ? lazy(() => import('../components/DevelopmentSandboxPanel.js'))
  : null;

export function domainCoverageLabel(summary: DomainProgressSummary): string {
  const names = summary.supportedContinentIds.map((id) => CONTINENTS.find((continent) => continent.id === id)?.name ?? id);
  return coverageLabel(names, CONTINENTS.length);
}

function statsFor(summary: ProgressSummary | DomainProgressSummary): ScopeStats {
  return { total: summary.total, unseen: summary.unseen, learning: summary.learning, mastered: summary.strong, due: summary.due, cleared: summary.cleared };
}

function StorageNotice() {
  return <p className="storage-notice">This browser is blocking storage, so today's progress will be lost when you close the tab.</p>;
}

export function HomeScreen({ ledgers, persisting }: { ledgers: ProgressLedgers; persisting: boolean }) {
  const actions = useAtlasActions();
  return (
    <main className="page page--home page--atlas">
      <header className="topbar topbar--atlas">
        <div className="brand-block"><h1 className="brand-name" tabIndex={-1} data-autofocus>Atlas</h1></div>
        <button className="icon-button" type="button" onClick={actions.openProfile} aria-label="Profile"><Icon name="profile" /></button>
      </header>
      {!persisting ? <StorageNotice /> : null}
      <h2 className="atlas-eyebrow">Modes</h2>
      <div className="atlas-card-list">
        {LEARNING_DOMAIN_IDS.map((domain) => {
          const summary = buildDomainProgressSummary(ledgers, domain);
          return <button className="atlas-card" type="button" onClick={() => actions.openDomain(domain)} key={domain}>
            <span className="atlas-card__mark" aria-hidden="true"><DomainIcon domain={domain} /></span>
            <span className="atlas-card__body"><span className="atlas-card__identity"><strong>{summary.label}</strong><small>{domainCoverageLabel(summary)}</small></span><ProgressStrip stats={statsFor(summary)} /></span>
            <span className="atlas-card__chevron" aria-hidden="true"><Icon name="chevron" /></span>
          </button>;
        })}
      </div>
    </main>
  );
}

export function ProfileScreen() {
  const actions = useAtlasActions();
  const { user, loading, signIn, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSignIn = () => {
    setError(null);
    setPending(true);
    signIn().catch(() => setError("Couldn't sign in. Please try again.")).finally(() => setPending(false));
  };

  const handleSignOut = () => {
    setPending(true);
    void signOut().finally(() => setPending(false));
  };

  return (
    <main className="page page--profile">
      <header className="topbar topbar--detail">
        <button className="icon-button" type="button" onClick={actions.goBack} aria-label="Back"><Icon name="back" /></button>
        <div className="screen-title"><h1 tabIndex={-1} data-autofocus>Profile</h1></div>
      </header>

      {isDevelopmentSandbox && DevelopmentSandboxPanel ? (
        <Suspense fallback={<p>Loading development sandbox…</p>}><DevelopmentSandboxPanel /></Suspense>
      ) : null}

      {isDevelopmentSandbox ? null : loading ? null : user ? (
        <div className="profile-card">
          {user.photoURL
            ? <img className="profile-card__avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
            : <span className="profile-card__avatar profile-card__avatar--fallback" aria-hidden="true"><Icon name="profile" /></span>}
          <div className="profile-card__identity">
            <strong>{user.displayName ?? 'Signed in'}</strong>
            {user.email ? <small>{user.email}</small> : null}
          </div>
          <button
            className={`button button--secondary${pending ? ' is-launching' : ''}`}
            type="button"
            onClick={handleSignOut}
            disabled={pending}
            aria-busy={pending}
          >Sign out</button>
        </div>
      ) : (
        <div className="profile-card profile-card--signed-out">
          <p>Sign in to save your progress to your account. You can keep learning without an account — your progress stays on this device either way.</p>
          <button
            className={`button button--primary${pending ? ' is-launching' : ''}`}
            type="button"
            onClick={handleSignIn}
            disabled={pending}
            aria-busy={pending}
          >Sign in with Google</button>
          {error ? <p className="storage-notice" role="status">{error}</p> : null}
        </div>
      )}
    </main>
  );
}

function ContinentRow({ domain, continent, ledgers, achievements }: {
  domain: LearningDomain;
  continent: (typeof CONTINENTS)[number];
  ledgers: ProgressLedgers;
  achievements: EarnedAchievementState;
}) {
  const actions = useAtlasActions();
  const scope: StudyScope = { kind: 'continent', id: continent.id, label: continent.name };
  const supported = scopeSupportsDomain(scope, domain);
  const summary = supported ? buildProgressSummary(ledgers, scope, domain) : null;
  if (!summary || summary.total === 0) return <div className="continent-row continent-row--shell"><span className="continent-row__open"><span className="continent-row__identity"><strong>{continent.name}</strong><small>Coming soon</small></span><span className="continent-row__mark" aria-hidden="true"><ContinentIcon id={continent.id} /></span></span></div>;
  const complete = getContinentAchievementReadModel(achievements, continent.id)?.crestEarned ?? false;
  return <div className={`continent-row${complete ? ' continent-row--complete' : ''}`}>
    <button className="continent-row__open" type="button" onClick={() => actions.openScope(domain, continent.id)}>
      <span className="continent-row__identity"><strong>{continent.name}</strong></span>
      <span className="continent-row__mark" aria-hidden="true">{complete ? <ContinentTrophy id={continent.id} /> : <ContinentIcon id={continent.id} />}</span>
      {summary.due > 0 ? <span className="continent-row__evidence">{summary.due} due</span> : null}
      <span className="continent-row__progress"><ProgressStrip stats={statsFor(summary)} /></span>
      <Icon name="chevron" />
    </button>
  </div>;
}

export function DomainScreen({ domain, ledgers, achievements, persisting }: {
  domain: LearningDomain;
  ledgers: ProgressLedgers;
  achievements: EarnedAchievementState;
  persisting: boolean;
}) {
  const actions = useAtlasActions();
  const summary = buildDomainProgressSummary(ledgers, domain);
  const world = domain === 'flags' ? buildProgressSummary(ledgers, { kind: 'world', label: 'World' }, 'flags') : null;
  return (
    <main className="page page--tile-index page--domain-index" data-domain={domain}>
      <header className="topbar topbar--detail">
        <button className="icon-button" type="button" onClick={actions.goBack} aria-label="Back to modes"><Icon name="back" /></button>
        <span className="launcher-header__icon" aria-hidden="true"><DomainIcon domain={domain} /></span>
        <div className="screen-title"><h1 tabIndex={-1} data-autofocus>{domainDisplayName(domain)}</h1><span>{domainCoverageLabel(summary)}</span></div>
      </header>
      {!persisting ? <StorageNotice /> : null}
      {world ? <section className="world-overview" aria-labelledby="world-heading">
        <div className="overview-heading"><div><h2 id="world-heading">World</h2><p>Every flag at once, or pick a continent below.</p></div><div className="mastery-total" aria-label={`${world.cleared} of ${world.total} flags cleared`}><strong>{world.cleared}</strong><span>/ {world.total}</span><small>cleared</small></div></div>
        <ProgressStrip stats={statsFor(world)} />
        <div className="primary-actions"><button className="button button--primary" type="button" onClick={() => actions.startFlags('test')}>Play world</button><button className="button button--secondary" type="button" onClick={() => actions.startFlags('learn')}>Learn world</button></div>
      </section> : null}
      <section className="atlas-section" aria-labelledby="continents-heading"><div className="list-heading"><h2 id="continents-heading">Continents</h2></div><div className="continent-list">{CONTINENTS.map((continent) => <ContinentRow domain={domain} continent={continent} ledgers={ledgers} achievements={achievements} key={continent.id} />)}</div></section>
    </main>
  );
}

interface StudyGroup { label: string; countries: Country[] }

function groupsFor(scope: StudyScope, countries: Country[]): StudyGroup[] {
  if (scope.kind === 'region') return [{ label: scope.label, countries }];
  if (scope.kind === 'continent') return REGIONS.filter((region) => region.continentId === scope.id).map((region) => ({ label: region.name, countries: countries.filter((country) => country.regionId === region.id) })).filter((group) => group.countries.length > 0);
  return CONTINENTS.map((continent) => ({ label: continent.name, countries: countries.filter((country) => country.continentId === continent.id) })).filter((group) => group.countries.length > 0);
}

export function FlagsStudyScreen({ scope, revealedIds, revealAll }: { scope: StudyScope; revealedIds: ReadonlySet<string>; revealAll: boolean }) {
  const actions = useAtlasActions();
  const countries = countriesInScope(COUNTRIES, scope);
  if (!countries.length) return <main className="page"><div className="empty-state"><strong tabIndex={-1} data-autofocus>No flags to study here</strong><span>This scope has no flags yet. Choose another region.</span></div><div className="result-actions"><button className="button button--primary" onClick={actions.goBack}>Back</button></div></main>;
  const groups = groupsFor(scope, countries);
  let index = 0;
  return (
    <main className="page">
      <header className="topbar topbar--detail"><button className="icon-button" onClick={actions.goBack} aria-label="Back"><Icon name="back" /></button><div className="screen-title"><h1 tabIndex={-1} data-autofocus>{scope.label}</h1><span>Learn · {countries.length} flags</span></div></header>
      <div className="study-toolbar"><button className="button button--secondary" type="button" onClick={actions.toggleAllFlagNames} aria-pressed={revealAll}>{revealAll ? 'Hide names' : 'Reveal all'}</button><button className="button button--primary" type="button" onClick={() => actions.startFlags('test')}>Play {scope.label}</button></div>
      <p className="study-hint">Tap a flag to reveal its country.</p>
      {groups.map((group) => <section className="study-group" aria-label={group.label} key={group.label}>
        {groups.length > 1 ? <h2 className="study-group__heading">{group.label}</h2> : null}
        <ul className="flag-gallery">{group.countries.map((country) => {
          index += 1;
          const position = index;
          const revealed = revealAll || revealedIds.has(country.id);
          const hiddenLabel = `Flag ${position} of ${countries.length}. Reveal the country.`;
          return <li className="flag-gallery__item" key={country.id}><button className={`flag-card ${revealed ? 'flag-card--revealed' : ''}`} type="button" onClick={() => actions.revealFlag(country.id)} aria-expanded={revealed} aria-label={revealed ? undefined : hiddenLabel}><FlagImage country={country} revealed={revealed} frameClass="flag-frame--card" /><span className="flag-card__name" data-flag-name>{revealed ? country.name : ''}</span></button></li>;
        })}</ul>
      </section>)}
    </main>
  );
}
