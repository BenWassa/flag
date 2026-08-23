import { CONTINENTS } from '../data/continents.js';
import {
  getLearningScopeDefinition,
  parentContinentIdForLearningScope,
} from '../data/learning-scopes.js';
import { AFRICA_MAP_SCOPE } from '../data/map-scopes.js';
import { domainDisplayName } from '../domain/display.js';
import {
  LEARNING_DOMAIN_IDS,
  type LearningActivity,
  type LearningDomain,
  type StudyScope,
} from '../domain/models.js';
import { scopeSupportsDomain } from '../domain/scope-support.js';

export type AppRoute =
  | { name: 'home' }
  | { name: 'progress' }
  | LearningRoute;

export interface LearningRoute {
  name: 'learning';
  domain: LearningDomain;
  scope?: StudyScope;
  activity?: LearningActivity;
}

const ACTIVITIES: readonly LearningActivity[] = ['learn', 'test', 'review'];

export function isLearningDomain(value: string | undefined): value is LearningDomain {
  return value !== undefined && (LEARNING_DOMAIN_IDS as readonly string[]).includes(value);
}

export function isLearningActivity(value: string | undefined): value is LearningActivity {
  return value !== undefined && (ACTIVITIES as readonly string[]).includes(value);
}

export function scopeForId(id: string): StudyScope | null {
  return getLearningScopeDefinition(id)?.scope ?? null;
}

export function routeForScope(
  domain: LearningDomain,
  scope: StudyScope,
  activity?: LearningActivity,
): LearningRoute {
  if (scope.kind === 'world') return { name: 'learning', domain, activity };
  return { name: 'learning', domain, scope, activity };
}

export function routeForScopeId(domain: LearningDomain, id: string): LearningRoute | null {
  const scope = scopeForId(id);
  return scope ? routeForScope(domain, scope) : null;
}

export function scopeForQuickPlay(
  domain: LearningDomain,
  id: string | undefined,
): StudyScope | null {
  if (id === domain) {
    return domain === 'flags'
      ? { kind: 'world', label: 'World' }
      : AFRICA_MAP_SCOPE;
  }
  if (!id) return null;
  const scope = routeForScopeId(domain, id)?.scope;
  if (!scope) return null;
  return scopeSupportsDomain(scope, domain) ? scope : null;
}

export function stableRoute(route: AppRoute): AppRoute {
  if (route.name !== 'learning' || route.activity === undefined) return route;
  return { name: 'learning', domain: route.domain, scope: route.scope };
}

/**
 * A syntactically valid scope can still name curriculum a domain has not
 * shipped. Rather than 404, the learner is dropped back on that domain's
 * continent index, which states the coverage honestly.
 */
export function normalizeAvailableRoute(route: AppRoute): AppRoute {
  if (route.name !== 'learning' || !route.scope) return route;
  if (scopeSupportsDomain(route.scope, route.domain)) return route;
  return { name: 'learning', domain: route.domain };
}

export function parentRoute(route: AppRoute): AppRoute | null {
  if (route.name === 'home') return null;
  if (route.name === 'progress') return { name: 'home' };

  if (route.activity !== undefined) return stableRoute(route);

  if (!route.scope) return { name: 'home' };
  return { name: 'learning', domain: route.domain };
}

export function parseRoutePath(input: string): AppRoute | null {
  const segments = pathSegments(input);
  if (!segments) return null;
  if (segments.length === 0) return { name: 'home' };
  if (segments.length === 1 && segments[0] === 'progress') return { name: 'progress' };

  const [domainSegment, scopeSegment, regionOrActivitySegment, activitySegment] = segments;

  if (!isLearningDomain(domainSegment)) return null;
  const domain = domainSegment;
  if (segments.length === 1) return { name: 'learning', domain };

  if (isLearningActivity(scopeSegment)) {
    if (domain !== 'flags' || segments.length !== 2) return null;
    return { name: 'learning', domain, activity: scopeSegment };
  }

  const continent = CONTINENTS.find((item) => item.id === scopeSegment);
  if (!continent) return null;
  const continentScope: StudyScope = { kind: 'continent', id: continent.id, label: continent.name };
  if (segments.length === 2) return { name: 'learning', domain, scope: continentScope };

  if (isLearningActivity(regionOrActivitySegment)) {
    if (segments.length !== 3) return null;
    return { name: 'learning', domain, scope: continentScope, activity: regionOrActivitySegment };
  }

  const definition = regionOrActivitySegment
    ? getLearningScopeDefinition(regionOrActivitySegment)
    : undefined;
  if (
    !definition
    || definition.scope.kind !== 'region'
    || definition.parentContinentId !== continent.id
  ) return null;

  const regionScope = definition.scope;
  if (segments.length === 3) return { name: 'learning', domain, scope: regionScope };

  if (!isLearningActivity(activitySegment) || segments.length !== 4) return null;
  return { name: 'learning', domain, scope: regionScope, activity: activitySegment };
}

export function serializeRoutePath(route: AppRoute): string {
  if (route.name === 'home') return '/';
  if (route.name === 'progress') return '/progress';

  const segments: string[] = [route.domain];
  if (route.scope?.kind === 'continent' && route.scope.id) {
    segments.push(route.scope.id);
  } else if (route.scope?.kind === 'region' && route.scope.id) {
    const parentContinentId = parentContinentIdForLearningScope(route.scope);
    if (!parentContinentId) throw new Error(`Unknown region route scope: ${route.scope.id}`);
    segments.push(parentContinentId, route.scope.id);
  }
  if (route.activity) segments.push(route.activity);
  return `/${segments.join('/')}`;
}

export function routesEqual(left: AppRoute | null, right: AppRoute | null): boolean {
  if (!left || !right) return left === right;
  return serializeRoutePath(left) === serializeRoutePath(right);
}

export function routeTitle(route: AppRoute): string {
  if (route.name === 'home') return 'Atlas';
  if (route.name === 'progress') return 'Progress · Atlas';

  const domain = domainDisplayName(route.domain);
  const scope = route.scope?.label ?? (route.domain === 'flags' ? 'World' : undefined);
  if (route.activity) {
    const activity = route.activity === 'review'
      ? 'Review'
      : route.activity === 'learn'
        ? 'Learn'
        : 'Play';
    return `${activity}${scope ? ` ${scope}` : ''} ${domain.toLowerCase()} · Atlas`;
  }
  if (scope && route.scope) return `${scope} ${domain.toLowerCase()} · Atlas`;
  return `${domain} · Atlas`;
}

function pathSegments(input: string): string[] | null {
  const withoutHash = input.trim().replace(/^#/, '');
  const path = withoutHash.split('?')[0]?.replace(/^\/+|\/+$/g, '') ?? '';
  if (!path) return [];

  try {
    return path.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment));
  } catch {
    return null;
  }
}
