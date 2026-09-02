import type { LearningDomain, ScopeStats, StudyScope } from '../../domain/models.js';
import { domainDisplayName } from '../../domain/display.js';
import { useAtlasActions } from '../actions.js';
import { START_ACTIONS, type ScopeModel } from '../scope-model.js';
import { DomainIcon, Icon } from './Icon.js';
import { ProgressStrip } from './ProgressStrip.js';

export interface LauncherModel extends ScopeModel {
  persisting: boolean;
  storageNotice: string;
}

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
  const stateLabel = complete ? 'Complete' : domainMastered ? 'Mastered' : null;
  const nameId = `scope-${domain}-${id}`;
  const rowClass = [
    'region-row',
    variant === 'continent' ? 'region-row--continent' : '',
    domainMastered ? 'region-row--mastered' : '',
    complete ? 'region-row--complete' : '',
  ].filter(Boolean).join(' ');
  return (
    <div className={rowClass}>
      <button
        className="region-row__open"
        type="button"
        data-action={START_ACTIONS[domain].play}
        data-domain={domain}
        data-id={id}
        data-scope-id={id}
        aria-labelledby={[
          `${nameId}-action`,
          `${nameId}-label`,
          stateLabel ? `${nameId}-state` : '',
          `${nameId}-count`,
          stats.due > 0 ? `${nameId}-due` : '',
          `${nameId}-progress`,
        ].filter(Boolean).join(' ')}
        onClick={(event) => id && actions.playScope(domain, id, event.currentTarget)}
      >
        <span className="visually-hidden" id={`${nameId}-action`}>Play</span>
        <span className="region-row__identity">
          <strong id={`${nameId}-label`}>{label}</strong>
          {stateLabel ? <span className="region-row__state" id={`${nameId}-state`}>{stateLabel}</span> : null}
        </span>
        <span className="region-row__count" id={`${nameId}-count`}>{stats.total} {unitLabel}</span>
        {stats.due > 0 ? <span className="region-row__evidence" id={`${nameId}-due`}>{stats.due} due</span> : null}
        <span className="region-row__progress"><ProgressStrip stats={stats} id={`${nameId}-progress`} /></span>
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
          <h1 tabIndex={-1} data-autofocus aria-label={`${activeScope.label} ${domainName} launcher`}>{activeScope.label}</h1>
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
