/**
 * Issue #119 — the route to spatial-presentation adapter (F1).
 *
 * This module is the whole of the spatial navigation contract and it is a PURE
 * FUNCTION. It reads authoritative application state — the typed route, the
 * current view and earned achievements — and returns what the stage should show.
 * It owns no state of its own, so there is no second navigation state machine
 * and interrupted camera travel can never desynchronise the application: the
 * route was never waiting on the camera.
 *
 * Every selectable target it produces is a scope id the conventional DOM
 * launcher also offers, from the same tables, so geography and DOM controls
 * resolve to the same action by construction rather than by coincidence.
 */

import { CONTINENTS } from '../data/continents.js';
import { COUNTRIES, COUNTRY_BY_ID } from '../data/countries.js';
import { regionLearningScopes } from '../data/learning-scopes.js';
import { getMapContinentConfig } from '../data/map-scopes.js';
import {
  isRegionComplete,
  isRegionDomainMasteryEarned,
  type EarnedAchievementState,
} from '../domain/achievements.js';
import type { ContinentId, LearningDomain, StudyScope } from '../domain/models.js';
import { scopeSupportsDomain } from '../domain/scope-support.js';
import type { AppRoute } from '../routing/routes.js';
import { isContinentId } from './scope-geography.js';

/**
 * How much of the viewport the geography owns, and what it means.
 *
 * `world`    whole-Earth frame; continents are the selectable unit.
 * `focus`    a continent or region is framed; regions are the selectable unit.
 * `context`  an activity is running and geography is a quiet, inert backdrop.
 * `results`  the round has resolved; the scope just played is re-framed.
 * `yielded`  the activity owns the screen entirely; the renderer is paused.
 */
export type SpatialStageMode = 'world' | 'focus' | 'context' | 'results' | 'yielded';

/**
 * Country presentation. Deliberately small, and deliberately not a choropleth.
 *
 * `mastered` and `complete` are the only progress-derived tones, they apply only
 * to earned region-level achievements, and only while that continent is framed.
 * Every one of them is accompanied by text in the DOM; none carries meaning on
 * its own.
 */
export type CountryState = 'ordinary' | 'active' | 'dimmed' | 'unavailable' | 'mastered' | 'complete';

/** What a tap on geography is currently allowed to mean. */
export type PickingMode = 'none' | 'continent' | 'region';

/**
 * Which political boundaries the Earth draws.
 *
 * `continent`  continent outlines only; the world is not a country tessellation.
 * `region`     the framed continent's areas divide, other continents stay whole.
 * `country`    individual countries, for an activity that is actually about them.
 */
export type BoundaryLevel = 'continent' | 'region' | 'country';

/** Earned state for one selectable scope. Always accompanied by text. */
export type ScopeStatus = 'mastered' | 'complete';

/**
 * Issue #197 — one selectable scope named directly on the geography.
 *
 * This is a declaration, not a rendered label: it says WHICH scopes the current
 * decision level offers and what each is called. Where each name sits comes from
 * the canonical geometry, and the control itself is real DOM anchored over the
 * Earth — never text baked into the scene.
 */
export interface SpatialLabel {
  /** Routable scope id. The same id `openScope` takes and a geography tap resolves to. */
  scopeId: string;
  label: string;
  /** Earned state, mirrored in words in the control's accessible name. */
  status?: ScopeStatus;
  /** The scope the camera is framing. */
  current: boolean;
  /** False for geography this domain has not shipped yet. */
  available: boolean;
}

/**
 * Issue #166 — which navigation surface the spatial interface is presenting.
 *
 * When this is set, the stage and its command surface ARE the screen: no
 * conventional launcher page renders beneath them. It is null whenever an
 * activity or a results screen owns the panel, which is what keeps the #119
 * activity boundary intact.
 *
 *   `domains`     choose what to learn; the globe is quiet context.
 *   `continents`  choose a continent, on the globe or in its equivalent list.
 *   `scope`       a continent or region is framed and Play is one tap away.
 */
export type SpatialSurface = 'domains' | 'continents' | 'scope';

export interface SpatialState {
  mode: SpatialStageMode;
  /** Continent detail LOD the stage should have mounted, beyond the world asset. */
  detail: ContinentId | null;
  /** Scope the camera frames. `undefined` is the whole-Earth frame. */
  framedScope?: StudyScope;
  picking: PickingMode;
  domain: LearningDomain | null;
  countryStates: ReadonlyMap<string, CountryState>;
  /**
   * Earned state per selectable scope id, so the DOM control can say in words
   * what the geography says in colour. Purple and gold never carry meaning alone.
   */
  scopeStatus: ReadonlyMap<string, ScopeStatus>;
  /**
   * Scopes named directly on the geography at this level of the hierarchy, and
   * which level that is. Empty whenever geography is not the thing being chosen.
   */
  labels: readonly SpatialLabel[];
  labelLevel: 'continent' | 'region' | null;
  /**
   * How much political boundary detail the geography should carry. Progressive
   * disclosure (#197): the learner sees the borders of the units they can
   * currently choose between, and country borders only where an activity needs
   * them.
   */
  boundaries: BoundaryLevel;
  /** Sentence describing the spatial state for assistive technology. */
  description: string;
  /** Set when the spatial interface is the screen rather than a band above one. */
  navigation: SpatialSurface | null;
}

export interface SpatialInput {
  route: AppRoute;
  /** `AppStore.view.name`. The view, not the route, knows whether a round is live. */
  view: string;
  /** Scope of a finished round, when the view is a results view. */
  resultScope?: StudyScope;
  achievements: EarnedAchievementState;
}

const RESULT_VIEWS = new Set(['results', 'map-results', 'outline-results', 'neighbor-results']);
const LAUNCHER_VIEWS = new Set(['scope', 'map-home', 'outline-home', 'neighbor-home']);
/**
 * Activity views whose own learning object is itself geography, or whose answer
 * could be read off the globe. These take the whole screen: a persistent globe
 * behind a "where is Ghana?" question is a second map competing with the answer
 * surface, and behind an outline question it is a shape the learner could match.
 * Spatial continuity is between activities, not during them.
 */
const YIELDING_VIEWS = new Set(['map-quiz', 'outline-quiz', 'neighbor-quiz', 'flags-study', 'profile']);

/**
 * Learner-facing regions for one continent and domain, from the same table the
 * conventional launcher renders. Flags carries the canonical learning scopes;
 * the geography domains carry the generated map scopes, which may legitimately
 * differ (the Middle East scope crosses a canonical continent boundary).
 */
export function selectableRegionScopes(continentId: ContinentId, domain: LearningDomain): readonly StudyScope[] {
  if (domain === 'flags') {
    return regionLearningScopes(continentId).map((definition) => definition.scope);
  }
  return getMapContinentConfig(continentId)?.regions.map((region) => region.scope) ?? [];
}

/**
 * Which learner-facing region each of a continent's countries belongs to, from
 * the same table the launcher renders. Also the grouping the globe draws region
 * boundaries from, so a region's outline can never disagree with its curriculum.
 */
export function regionScopeByCountry(continentId: ContinentId, domain: LearningDomain): ReadonlyMap<string, string> {
  return regionCountryIds(continentId, domain);
}

function regionCountryIds(continentId: ContinentId, domain: LearningDomain): Map<string, string> {
  const byCountry = new Map<string, string>();
  if (domain === 'flags') {
    for (const definition of regionLearningScopes(continentId)) {
      const id = definition.scope.id;
      if (!id) continue;
      for (const countryId of definition.countryIds) if (!byCountry.has(countryId)) byCountry.set(countryId, id);
    }
    return byCountry;
  }
  for (const region of getMapContinentConfig(continentId)?.regions ?? []) {
    const id = region.scope.id;
    if (!id) continue;
    for (const countryId of region.countryIds) if (!byCountry.has(countryId)) byCountry.set(countryId, id);
  }
  return byCountry;
}

/**
 * A tap always means: take me to the smallest scope I am currently able to
 * choose that contains this country.
 *
 * At world level that is the country's continent. Inside a continent it is the
 * learner-facing region the country belongs to; a tap outside the framed
 * continent travels back out to that continent instead, so the globe never has a
 * dead area.
 */
export function resolveTapTarget(state: SpatialState, countryId: string): string | null {
  if (state.picking === 'none' || !state.domain) return null;
  const continentId = COUNTRY_BY_ID.get(countryId)?.continentId;
  if (!isContinentId(continentId)) return null;
  if (!scopeSupportsDomain({ kind: 'continent', id: continentId, label: continentId }, state.domain)) {
    return continentId;
  }
  if (state.picking === 'continent') return continentId;

  const framedContinent = state.framedScope
    ? framedContinentId(state.framedScope)
    : null;
  if (framedContinent && framedContinent !== continentId) return continentId;

  const regionId = regionCountryIds(continentId, state.domain).get(countryId);
  return regionId ?? continentId;
}

/**
 * Which continent's geography a scope belongs to.
 *
 * Two lookups cover four domains: Flags reads the canonical learning scopes, and
 * Locations, Outlines and Neighbours all read the same generated map continent
 * configuration. Both are consulted because the two taxonomies legitimately
 * differ — the Middle East scope crosses a canonical continent boundary.
 */
function framedContinentId(scope: StudyScope): ContinentId | null {
  if (scope.kind === 'continent' && isContinentId(scope.id)) return scope.id;
  if (!scope.id) return null;
  for (const continent of CONTINENTS) {
    if (selectableRegionScopes(continent.id, 'flags').some((region) => region.id === scope.id)) return continent.id;
    if (selectableRegionScopes(continent.id, 'locations').some((region) => region.id === scope.id)) return continent.id;
  }
  return null;
}

function countryStatesForScope(
  scope: StudyScope | undefined,
  domain: LearningDomain | null,
  achievements: EarnedAchievementState,
  inScope: ReadonlySet<string>,
): ReadonlyMap<string, CountryState> {
  const states = new Map<string, CountryState>();
  if (!scope || !domain) return states;

  const continentId = framedContinentId(scope);
  const regionOf = continentId ? regionCountryIds(continentId, domain) : new Map<string, string>();

  for (const country of COUNTRIES) {
    if (!inScope.has(country.id)) { states.set(country.id, 'dimmed'); continue; }
    const regionId = regionOf.get(country.id);
    if (regionId && isRegionComplete(achievements, regionId)) { states.set(country.id, 'complete'); continue; }
    if (regionId && isRegionDomainMasteryEarned(achievements, regionId, domain)) {
      states.set(country.id, 'mastered');
      continue;
    }
    states.set(country.id, 'active');
  }
  return states;
}

function worldCountryStates(domain: LearningDomain | null): ReadonlyMap<string, CountryState> {
  const states = new Map<string, CountryState>();
  if (!domain) return states;
  for (const continent of CONTINENTS) {
    const supported = scopeSupportsDomain(
      { kind: 'continent', id: continent.id, label: continent.name },
      domain,
    );
    if (supported) continue;
    // Unsupported geography stays visible and legible for orientation, but must
    // never read as Play-ready or as zero progress.
    for (const country of COUNTRIES) {
      if (country.continentId === continent.id) states.set(country.id, 'unavailable');
    }
  }
  return states;
}

const EMPTY: ReadonlyMap<string, CountryState> = new Map();
const NO_STATUS: ReadonlyMap<string, ScopeStatus> = new Map();
const NO_LABELS: readonly SpatialLabel[] = [];

/**
 * The continents, named on the Earth itself. This is the whole world-level
 * choice: a learner picks a continent, so continents are what the globe writes
 * and what its boundaries show. Unshipped geography is still named — honestly,
 * and unselectable — exactly as its DOM control is.
 */
function continentLabels(domain: LearningDomain | null): readonly SpatialLabel[] {
  if (!domain) return NO_LABELS;
  return CONTINENTS.map((continent) => ({
    scopeId: continent.id,
    label: continent.name,
    current: false,
    available: scopeSupportsDomain({ kind: 'continent', id: continent.id, label: continent.name }, domain),
  }));
}

/**
 * The framed continent's areas, named on the Earth. Selecting one keeps
 * navigation at region level: the siblings stay named and selectable rather than
 * dissolving into country detail.
 */
function regionLabels(
  continentId: ContinentId | null,
  domain: LearningDomain | null,
  framed: StudyScope | undefined,
  status: ReadonlyMap<string, ScopeStatus>,
): readonly SpatialLabel[] {
  if (!continentId || !domain) return NO_LABELS;
  const labels: SpatialLabel[] = [];
  for (const region of selectableRegionScopes(continentId, domain)) {
    if (!region.id) continue;
    labels.push({
      scopeId: region.id,
      label: region.label,
      status: status.get(region.id),
      current: framed?.id === region.id,
      available: true,
    });
  }
  return labels;
}

function scopeStatusFor(
  continentId: ContinentId | null,
  domain: LearningDomain | null,
  achievements: EarnedAchievementState,
): ReadonlyMap<string, ScopeStatus> {
  if (!continentId || !domain) return NO_STATUS;
  const status = new Map<string, ScopeStatus>();
  for (const region of selectableRegionScopes(continentId, domain)) {
    if (!region.id) continue;
    if (isRegionComplete(achievements, region.id)) status.set(region.id, 'complete');
    else if (isRegionDomainMasteryEarned(achievements, region.id, domain)) status.set(region.id, 'mastered');
  }
  return status;
}

export function deriveSpatialState(input: SpatialInput): SpatialState {
  const { route, view, achievements } = input;
  const domain = route.name === 'learning' ? route.domain : null;

  if (YIELDING_VIEWS.has(view)) {
    return {
      mode: 'yielded',
      detail: null,
      picking: 'none',
      domain,
      countryStates: EMPTY,
      scopeStatus: NO_STATUS,
      labels: NO_LABELS,
      labelLevel: null,
      boundaries: 'continent',
      description: '',
      navigation: null,
    };
  }

  if (RESULT_VIEWS.has(view)) {
    const scope = input.resultScope;
    const inScope = new Set(scopeCountryIds(scope));
    return {
      mode: 'results',
      detail: scope ? detailContinent(scope) : null,
      framedScope: scope,
      picking: 'none',
      domain,
      countryStates: countryStatesForScope(scope, domain, achievements, inScope),
      scopeStatus: NO_STATUS,
      labels: NO_LABELS,
      labelLevel: null,
      // The round is over and its subject was these countries: this is the one
      // navigation-adjacent state where country detail is what the learner is
      // actually looking at.
      boundaries: 'country',
      description: scope ? `${scope.label} is framed on the globe.` : '',
      navigation: null,
    };
  }

  // A live activity that is safe over geography: the flag is the recognition
  // object and cannot be read off the map. The globe carries NO scope
  // highlighting here — an in-scope highlight during a question is a hint.
  if (view === 'quiz') {
    return {
      mode: 'context',
      detail: route.name === 'learning' && route.scope ? detailContinent(route.scope) : null,
      framedScope: route.name === 'learning' ? route.scope : undefined,
      picking: 'none',
      domain,
      countryStates: EMPTY,
      scopeStatus: NO_STATUS,
      labels: NO_LABELS,
      labelLevel: null,
      // A live question needs no country detail — the flag is the recognition
      // object — so the backdrop stays at the level the learner navigated at.
      boundaries: route.name === 'learning' && route.scope && detailContinent(route.scope) ? 'region' : 'continent',
      description: '',
      navigation: null,
    };
  }

  if (route.name === 'learning' && route.scope && LAUNCHER_VIEWS.has(view)) {
    const inScope = new Set(scopeCountryIds(route.scope));
    const continentId = detailContinent(route.scope);
    const scopeStatus = scopeStatusFor(continentId, domain, achievements);
    return {
      mode: 'focus',
      detail: continentId,
      framedScope: route.scope,
      picking: 'region',
      domain,
      countryStates: countryStatesForScope(route.scope, domain, achievements, inScope),
      scopeStatus,
      labels: regionLabels(continentId, domain, route.scope, scopeStatus),
      labelLevel: 'region',
      // Areas divide; the countries inside them do not. Choosing a region is
      // still the decision in front of the learner, so it is still the only
      // boundary the geography draws.
      boundaries: 'region',
      // #197 named each area on the Earth itself, so the description says where
      // the choices are rather than describing a tap on a country.
      description: `${route.scope.label} is framed on the globe. Each area is named on it, and can be chosen there or below.`,
      navigation: 'scope',
    };
  }

  return {
    mode: 'world',
    detail: null,
    picking: domain ? 'continent' : 'none',
    domain,
    countryStates: worldCountryStates(domain),
    scopeStatus: NO_STATUS,
    labels: continentLabels(domain),
    labelLevel: domain ? 'continent' : null,
    boundaries: 'continent',
    description: domain
      ? 'The whole Earth is framed. Each continent is named on it, and can be chosen there or below.'
      : 'The whole Earth is framed. Choose what to learn.',
    navigation: domain ? 'continents' : 'domains',
  };
}

function detailContinent(scope: StudyScope): ContinentId | null {
  const id = framedContinentId(scope);
  return id ?? null;
}

function scopeCountryIds(scope: StudyScope | undefined): readonly string[] {
  if (!scope) return [];
  if (scope.kind === 'world') return COUNTRIES.map((country) => country.id);
  if (!scope.id) return [];
  const continentId = framedContinentId(scope);
  if (scope.kind === 'continent' && continentId) {
    return COUNTRIES.filter((country) => country.continentId === continentId).map((country) => country.id);
  }
  for (const continent of CONTINENTS) {
    for (const definition of regionLearningScopes(continent.id)) {
      if (definition.scope.id === scope.id) return definition.countryIds;
    }
    for (const region of getMapContinentConfig(continent.id)?.regions ?? []) {
      if (region.scope.id === scope.id) return region.countryIds;
    }
  }
  return [];
}
