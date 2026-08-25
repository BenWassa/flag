import type { MapRegionAsset } from '../../domain/map-models.js';
import type { LearningDomain, ScopeStats, StudyScope } from '../../domain/models.js';
import { domainDisplayName } from '../../domain/display.js';
import { useAtlasActions } from '../actions.js';
import { DomainIcon, Icon } from './Icon.js';
import { LauncherMap } from './LauncherMap.js';
import { ProgressStrip } from './ProgressStrip.js';

export interface LauncherRegion {
  scope: StudyScope;
  stats: ScopeStats;
  domainMastered?: boolean;
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
  showMap: boolean;
  mapAsset?: MapRegionAsset | null;
  mapLoading?: boolean;
  mapFailed?: boolean;
}

const START_ACTIONS: Record<LearningDomain, { play: string; learn: string }> = {
  flags: { play: 'start-test', learn: 'start-learn' },
  locations: { play: 'start-map-test', learn: 'start-map-learn' },
  outlines: { play: 'start-outline-test', learn: 'start-outline-learn' },
  neighbors: { play: 'start-neighbor-test', learn: 'start-neighbor-learn' },
};

function RegionRow({ model, region }: { model: LauncherModel; region: LauncherRegion }) {
  const actions = useAtlasActions();
  const selected = region.scope.id === model.selectedRegion?.id;
  const rowClass = ['region-row', selected ? 'region-row--selected' : '', region.complete ? 'region-row--complete' : ''].filter(Boolean).join(' ');
  return (
    <div className={rowClass}>
      <button className="region-row__open" type="button" data-id={region.scope.id} aria-pressed={selected} onClick={() => region.scope.id && actions.selectRegion(model.domain, region.scope.id)}>
        <span className="region-row__identity">
          <strong>{region.scope.label}{region.domainMastered ? <span className="region-row__mastery" aria-label="Mastered"><Icon name="star" /></span> : null}</strong>
          <small>{region.stats.total} {model.unitLabel}</small>
        </span>
        {selected ? <span className="region-row__status">Selected</span> : null}
        {region.stats.due > 0 ? <span className="region-row__evidence">{region.stats.due} due</span> : null}
        <span className="region-row__progress"><ProgressStrip stats={region.stats} /></span>
        <Icon name="chevron" />
      </button>
    </div>
  );
}

export function Launcher({ model }: { model: LauncherModel }) {
  const actions = useAtlasActions();
  const activeScope = model.selectedRegion ?? model.continentScope;
  const domainTitle = domainDisplayName(model.domain);
  const domainName = domainTitle.toLowerCase();
  const play = (element: HTMLElement) => {
    if (model.domain === 'flags') actions.startFlags('test');
    if (model.domain === 'locations') actions.startLocations('test', element);
    if (model.domain === 'outlines') actions.startOutlines('test', element);
    if (model.domain === 'neighbors') actions.startNeighbors('test');
  };
  const learn = (element: HTMLElement) => {
    if (model.domain === 'flags') actions.startFlags('learn');
    if (model.domain === 'locations') actions.startLocations('learn', element);
    if (model.domain === 'outlines') actions.startOutlines('learn', element);
    if (model.domain === 'neighbors') actions.startNeighbors('learn');
  };

  return (
    <main className="page page--launcher" data-launcher-domain={model.domain} data-launcher-continent={model.continentScope.id ?? ''}>
      <header className="topbar topbar--detail launcher-header">
        <button className="icon-button" type="button" onClick={actions.goBack} aria-label={`Back to ${domainTitle}`}><Icon name="back" /></button>
        <span className="launcher-header__icon" aria-hidden="true"><DomainIcon domain={model.domain} /></span>
        <div className="screen-title">
          <span className="screen-title__row"><h1 tabIndex={-1} data-autofocus aria-label={`${activeScope.label} ${domainName} launcher`}>{activeScope.label}</h1><span className="launcher-header__badge" aria-hidden="true" /></span>
          <span>{domainTitle}</span>
        </div>
      </header>
      <section className="launcher" aria-label={`${model.continentScope.label} ${domainName} launcher`}>
        <div className="launcher__status">
          {model.selectedRegion ? <button className="launcher__all-scope" type="button" onClick={() => model.continentScope.id && actions.selectContinent(model.domain, model.continentScope.id)}>All {model.continentScope.label}</button> : null}
          <ProgressStrip stats={model.stats} />
        </div>
        <button className="button button--primary launcher__play" type="button" data-action={START_ACTIONS[model.domain].play} onClick={(event) => play(event.currentTarget)}>Play {activeScope.label}</button>
        {model.showMap ? <div className="launcher-map-slot" data-launcher-map-slot data-domain={model.domain} data-continent-id={model.continentScope.id ?? ''}>
          {model.mapAsset ? <LauncherMap asset={model.mapAsset} domain={model.domain} selectedRegionId={model.selectedRegion?.id} /> : model.mapFailed ? <p className="launcher-map-error">Map unavailable. Choose a region from the list.</p> : <div className="launcher-map-loading" aria-label="Loading map" />}
        </div> : null}
        <section className="atlas-section launcher__regions" aria-labelledby="launcher-regions-heading">
          <div className="list-heading"><h2 id="launcher-regions-heading">Regions</h2></div>
          <div className="region-list">{model.regions.map((region) => <RegionRow model={model} region={region} key={region.scope.id} />)}</div>
        </section>
        <button className="button button--tertiary launcher__learn" type="button" data-action={START_ACTIONS[model.domain].learn} onClick={(event) => learn(event.currentTarget)}>Learn {activeScope.label}</button>
      </section>
      {!model.persisting ? <p className="storage-notice">{model.storageNotice}</p> : null}
    </main>
  );
}
