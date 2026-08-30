import type { LearningDomain, ScopeStats, StudyScope } from '../../domain/models.js';
import { domainDisplayName } from '../../domain/display.js';
import { useAtlasActions } from '../actions.js';
import type { ScopeModel } from '../scope-model.js';
import { DomainIcon, Icon } from './Icon.js';
import { ProgressStrip } from './ProgressStrip.js';

export interface LauncherModel extends ScopeModel {
  persisting: boolean;
  storageNotice: string;
}

const START_ACTIONS: Record<LearningDomain, { play: string; learn: string }> = {
  flags: { play: 'start-test', learn: 'start-learn' },
  locations: { play: 'start-map-test', learn: 'start-map-learn' },
  outlines: { play: 'start-outline-test', learn: 'start-outline-learn' },
  neighbors: { play: 'start-neighbor-test', learn: 'start-neighbor-learn' },
};

function ScopeRow({ domain, scope, stats, unitLabel, variant, domainMastered, complete }: {
  domain: LearningDomain;
  scope: StudyScope;
  stats: ScopeStats;
  unitLabel: string;
  variant: 'continent' | 'region';
  domainMastered?: boolean;
  complete?: boolean;
}) {
  const actions = useAtlasActions();
  const id = scope.id ?? '';
  const label = variant === 'continent' ? `All ${scope.label}` : scope.label;
  const rowClass = ['region-row', variant === 'continent' ? 'region-row--continent' : '', complete ? 'region-row--complete' : ''].filter(Boolean).join(' ');
  return (
    <div className={rowClass}>
      <button
        className="region-row__open"
        type="button"
        data-action={START_ACTIONS[domain].play}
        data-domain={domain}
        data-id={id}
        data-scope-id={id}
        aria-label={`Play ${label}`}
        onClick={(event) => id && actions.playScope(domain, id, event.currentTarget)}
      >
        <span className="region-row__identity">
          <strong>{label}{domainMastered ? <span className="visually-hidden">, Mastered</span> : null}</strong>
        </span>
        <span className="region-row__count">{stats.total} {unitLabel}</span>
        {stats.due > 0 ? <span className="region-row__evidence">{stats.due} due</span> : null}
        <span className="region-row__progress"><ProgressStrip stats={stats} /></span>
      </button>
    </div>
  );
}

export function Launcher({ model }: { model: LauncherModel }) {
  const actions = useAtlasActions();
  const activeScope = model.selectedRegion ?? model.continentScope;
  const continentId = model.continentScope.id ?? '';
  const domainTitle = domainDisplayName(model.domain);
  const domainName = domainTitle.toLowerCase();

  return (
    <main className="page page--launcher" data-launcher-domain={model.domain} data-launcher-continent={continentId}>
      <header className="topbar topbar--detail launcher-header">
        <button className="icon-button" type="button" onClick={actions.goBack} aria-label={`Back to ${domainTitle}`}><Icon name="back" /></button>
        <span className="launcher-header__icon" aria-hidden="true"><DomainIcon domain={model.domain} /></span>
        <div className="screen-title">
          <span className="screen-title__row"><h1 tabIndex={-1} data-autofocus aria-label={`${activeScope.label} ${domainName} launcher`}>{activeScope.label}</h1><span className="launcher-header__badge" aria-hidden="true" /></span>
          <span>{domainTitle}</span>
        </div>
      </header>
      <section className="launcher" aria-label={`${model.continentScope.label} ${domainName} launcher`}>
        <div className="region-list launcher__scope-list">
          <ScopeRow domain={model.domain} scope={model.continentScope} stats={model.stats} unitLabel={model.unitLabel} variant="continent" />
          {model.regions.map((region) => (
              <ScopeRow
                domain={model.domain}
                scope={region.scope}
                stats={region.stats}
                unitLabel={model.unitLabel}
                variant="region"
                domainMastered={region.domainMastered}
                complete={region.complete}
                key={region.scope.id}
              />
          ))}
        </div>
        <button
          className="button button--tertiary launcher__learn"
          type="button"
          data-action={START_ACTIONS[model.domain].learn}
          data-domain={model.domain}
          data-scope-id={continentId}
          onClick={(event) => continentId && actions.learnScope(model.domain, continentId, event.currentTarget)}
        >Learn {model.continentScope.label}</button>
      </section>
      {!model.persisting ? <p className="storage-notice">{model.storageNotice}</p> : null}
    </main>
  );
}
