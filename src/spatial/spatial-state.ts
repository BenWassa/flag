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

export interface SpatialState {
  mode: SpatialStageMode;
  /** Continent detail LOD the stage should have mounted, beyond the world asset. */
  detail: ContinentId | null;
  /** Scope the camera frames. `undefined` is the whole-Earth frame. */
  framedScope?: StudyScope;
  picking: PickingMode;
  domain: LearningDomain | null;
  countryStates: ReadonlyMap<string, CountryState>;
  /** Sentence describing the spatial state for assistive technology. */
  description: string;
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
      description: '',
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
      description: scope ? `${scope.label} is framed on the globe.` : '',
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
      description: '',
    };
  }

  if (route.name === 'learning' && route.scope && LAUNCHER_VIEWS.has(view)) {
    const inScope = new Set(scopeCountryIds(route.scope));
    return {
      mode: 'focus',
      detail: detailContinent(route.scope),
      framedScope: route.scope,
      picking: 'region',
      domain,
      countryStates: countryStatesForScope(route.scope, domain, achievements, inScope),
      description: `${route.scope.label} is framed on the globe. Tap a country to choose its region.`,
    };
  }

  return {
    mode: 'world',
    detail: null,
    picking: domain ? 'continent' : 'none',
    domain,
    countryStates: worldCountryStates(domain),
    description: domain
      ? 'The whole Earth is framed. Tap a continent, or use the list below.'
      : 'The whole Earth is framed. Choose what to learn.',
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
