import { Suspense, useState } from 'react';
import { CONTINENTS } from '../../data/continents.js';
import { REGIONS } from '../../data/regions.js';
import { buildDomainProgressSummary, buildProgressSummary, scopeSupportsDomain } from '../../domain/curriculum.js';
import { getContinentAchievementReadModel, getRegionAchievementReadModel, type EarnedAchievementState } from '../../domain/achievements.js';
import type { DomainProgressSummary, LearningDomain, ProgressLedgers, ProgressSummary, StudyScope } from '../../domain/models.js';
import { isDevelopmentSandbox } from '../../infrastructure/runtime-environment.js';
import { domainDisplayName } from '../../ui/format.js';
import { useAtlasActions } from '../actions.js';
import { ContinentIcon, ContinentTrophy, DomainIcon, Icon } from '../components/Icon.js';
import { ProgressStrip, type ScopeStats } from '../components/ProgressStrip.js';
import { useAuth } from '../useAuth.js';

const DevelopmentSandboxPanel = isDevelopmentSandbox
  ? (await import('../components/DevelopmentSandboxPanel.js')).DevelopmentSandboxPanel
  : null;

function coverageLabel(names: string[], total: number): string {
  if (names.length === total) return 'World';
  if (names.length === 0) return 'Coming soon';
  return names.join(' · ');
}

function domainCoverageLabel(summary: DomainProgressSummary): string {
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
        {['flags', 'locations', 'outlines', 'neighbors'].map((domain) => {
          const summary = buildDomainProgressSummary(ledgers, domain as LearningDomain);
          return <button className="atlas-card" type="button" onClick={() => actions.openDomain(domain as LearningDomain)} key={domain}>
            <span className="atlas-card__mark" aria-hidden="true"><DomainIcon domain={domain as LearningDomain} /></span>
            <span className="atlas-card__body"><span className="atlas-card__identity"><strong>{summary.label}</strong><small>{domainCoverageLabel(summary)}</small></span><ProgressStrip stats={statsFor(summary)} /></span>
            <span className="atlas-card__chevron" aria-hidden="true"><Icon name="chevron" /></span>
          </button>;
        })}
      </div>
    </main>
  );
}

function cloudStatusCopy(status: ReturnType<typeof useAuth>['cloudStatus']): string {
  if (status === 'reconciling') return 'Checking cloud progress…';
  if (status === 'saving') return 'Saving cloud backup…';
  if (status === 'synced') return 'Cloud backup is up to date.';
  if (status === 'degraded') return 'Cloud backup is unavailable right now. Progress is still saved on this device.';
  if (status === 'unauthorised') return "Cloud backup isn't available for this account. Progress is still saved on this device.";
  return 'Progress is saved on this device.';
}

export function ProfileScreen() {
  const actions = useAtlasActions();
  const { user, loading, cloudStatus, signIn, signOut, deleteCloudCopy, deleteAccount } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<'cloud' | 'account' | null>(null);

  const handleSignIn = () => {
    setError(null);
    setPending(true);
    signIn().catch(() => setError("Couldn't sign in. Please try again.")).finally(() => setPending(false));
  };

  const handleSignOut = () => {
    setError(null);
    setPending(true);
    void signOut().catch(() => setError("Couldn't sign out. Please try again.")).finally(() => setPending(false));
  };

  const handleDelete = (kind: 'cloud' | 'account') => {
    setError(null);
    setPending(true);
    const operation = kind === 'cloud' ? deleteCloudCopy() : deleteAccount();
    void operation.catch((cause: unknown) => setError(cause instanceof Error
      ? cause.message
      : kind === 'account'
        ? "Couldn't delete the account. Please try again."
        : "Couldn't delete the cloud backup. Please try again."
    )).finally(() => { setPending(false); setConfirmDelete(null); });
  };

  const cloudAvailable = cloudStatus !== 'unauthorised';

  return (
    <main className="page page--profile">
      <header className="topbar topbar--detail">
        <button className="icon-button" type="button" onClick={actions.goBack} aria-label="Back"><Icon name="back" /></button>
        <div className="screen-title"><h1 tabIndex={-1} data-autofocus>Profile</h1></div>
      </header>

      {isDevelopmentSandbox && DevelopmentSandboxPanel ? (
        <Suspense fallback={<p>Loading development sandbox…</p>}><DevelopmentSandboxPanel /></Suspense>
      ) : null}

      {isDevelopmentSandbox ? null : loading ? (
        <div className="profile-card profile-card--loading" role="status" aria-live="polite">
          <p>Checking sign-in…</p>
        </div>
      ) : user ? (
        <div className="profile-card">
          {user.photoURL
            ? <img className="profile-card__avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
            : <span className="profile-card__avatar profile-card__avatar--fallback" aria-hidden="true"><Icon name="profile" /></span>}
          <div className="profile-card__identity">
            <strong>{user.displayName ?? 'Signed in'}</strong>
            {user.email ? <small>{user.email}</small> : null}
            <small role="status">{cloudStatusCopy(cloudStatus)}</small>
          </div>
          <button
            className={`button button--secondary${pending ? ' is-launching' : ''}`}
            type="button"
            onClick={handleSignOut}
            disabled={pending}
            aria-busy={pending}
          >Sign out</button>
          {cloudAvailable && confirmDelete === null ? <div className="profile-card__account-actions">
            <button className="button button--secondary" type="button" onClick={() => setConfirmDelete('cloud')} disabled={pending}>Delete cloud copy</button>
            <button className="button button--secondary" type="button" onClick={() => setConfirmDelete('account')} disabled={pending}>Delete account</button>
          </div> : null}
          {confirmDelete ? <div className="profile-card__delete-confirmation" role="group" aria-label={confirmDelete === 'cloud' ? 'Confirm cloud copy deletion' : 'Confirm account deletion'}>
            <p>{confirmDelete === 'cloud'
              ? 'This deletes the cloud backup and signs you out. Progress on this device stays here.'
              : 'This deletes the cloud backup and sign-in account. Progress on this device stays here.'}</p>
            <div className="profile-card__account-actions">
              <button className="button button--secondary" type="button" onClick={() => setConfirmDelete(null)} disabled={pending} autoFocus>Cancel</button>
              <button className="button button--secondary profile-card__destructive-action" type="button" onClick={() => handleDelete(confirmDelete)} disabled={pending} aria-busy={pending}>Delete</button>
            </div>
          </div> : null}
          {error ? <p className="storage-notice profile-card__error" role="alert">{error}</p> : null}
        </div>
      ) : (
        <div className="profile-card profile-card--signed-out">
          <p>Your progress is saved on this device. The authorised Atlas account can also keep an optional cloud backup.</p>
          <button
            className={`button button--primary${pending ? ' is-launching' : ''}`}
            type="button"
            onClick={handleSignIn}
            disabled={pending}
            aria-busy={pending}
          >Sign in with Google</button>
          {error ? <p className="storage-notice profile-card__error" role="alert">{error}</p> : null}
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
      <section className="continent-section" aria-labelledby="continent-heading">
        <div className="list-heading"><h2 id="continent-heading">Continents</h2></div>
        <div className="continent-list">{CONTINENTS.map((continent) => <ContinentRow domain={domain} continent={continent} ledgers={ledgers} achievements={achievements} key={continent.id} />)}</div>
      </section>
    </main>
  );
}
