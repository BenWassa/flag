import { CONTINENTS, REGIONS } from '../data/continents.js';
import { AFRICA_MAP_SCOPE, getAfricaMapScopeConfig } from '../data/map-scopes.js';
import { getAfricaNeighborScopeConfig } from '../data/neighbors/index.js';
import { domainDisplayName } from '../domain/display.js';
import {
  LEARNING_DOMAIN_IDS,
  type LearningActivity,
  type LearningDomain,
  type StudyScope,
} from '../domain/models.js';

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
  const continent = CONTINENTS.find((item) => item.id === id);
  if (continent) return { kind: 'continent', id: continent.id, label: continent.name };

  const region = REGIONS.find((item) => item.id === id);
  if (region) return { kind: 'region', id: region.id, label: region.name };
  return null;
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
  if (!scope || domain === 'flags') return scope ?? null;
  const supported = domain === 'neighbors'
    ? getAfricaNeighborScopeConfig(id)
    : getAfricaMapScopeConfig(id);
  return supported ? scope : null;
}

export function stableRoute(route: AppRoute): AppRoute {
  if (route.name !== 'learning' || route.activity === undefined) return route;
  return { name: 'learning', domain: route.domain, scope: route.scope };
}

export function normalizeAvailableRoute(route: AppRoute): AppRoute {
  if (route.name !== 'learning' || route.domain === 'flags') return route;

  const supported = route.scope?.id && (
    route.domain === 'neighbors'
      ? getAfricaNeighborScopeConfig(route.scope.id)
      : getAfricaMapScopeConfig(route.scope.id)
  );
  if (supported) return route;

  return {
    name: 'learning',
    domain: route.domain,
    scope: AFRICA_MAP_SCOPE,
  };
}

export function parentRoute(route: AppRoute): AppRoute | null {
  if (route.name === 'home') return null;
  if (route.name === 'progress') return { name: 'home' };
  if (route.activity !== undefined) return stableRoute(route);
  if (!route.scope) return { name: 'home' };

  if (route.scope.kind === 'region' && route.scope.id) {
    // A region is selected inside its continent launcher; it is not a deeper
    // screen. "All <continent>" clears that selection, while Back leaves the
    // launcher altogether.
    return route.domain === 'flags'
      ? { name: 'learning', domain: 'flags' }
      : { name: 'home' };
  }

  if (route.domain !== 'flags') return { name: 'home' };
  return { name: 'learning', domain: 'flags' };
}

function acceptsDomainScope(domain: LearningDomain, contintentId: string): boolean {
  if (domain === 'flags') return true;
  return contintentId === 'africa';
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
  if (!acceptsDomainScope(domain, continent.id)) return null;
  const continentScope: StudyScope = { kind: 'continent', id: continent.id, label: continent.name };
  if (segments.length === 2) return { name: 'learning', domain, scope: continentScope };

  if (isLearningActivity(regionOrActivitySegment)) {
    if (segments.length !== 3) return null;
    return { name: 'learning', domain, scope: continentScope, activity: regionOrActivitySegment };
  }

  const region = REGIONS.find(
    (item) => item.id === regionOrActivitySegment && item.continentId === continent.id,
  );
  if (!region) return null;
  if (domain !== 'flags' && region.continentId !== 'africa') return null;
  const regionScope: StudyScope = { kind: 'region', id: region.id, label: region.name };
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
    const region = REGIONS.find((item) => item.id === route.scope?.id);
    if (!region) throw new Error(`Unknown region route scope: ${route.scope.id}`);
    segments.push(region.continentId, region.id);
  }
  if (route.activity) segments.push(route.activity);
  return `/${segments.join('/')}`;
}

export function routesEqual(left: AppRoute | null, right: AppRoute | null): boolean {
  if (!left || !right) return left === right;
  return serializeRoutePath(left) === serializeRoutePath(right);
}

export function routeTitle(route: AppRoute): string {
  if (route.name === 'home') return 'Flag Atlas';
  if (route.name === 'progress') return 'Progress · Flag Atlas';

  const domain = domainDisplayName(route.domain);
  const scope = route.scope?.label ?? (route.domain === 'flags' ? 'World' : undefined);
  if (route.activity) {
    const activity = route.activity === 'review'
      ? 'Review'
      : route.activity === 'learn'
        ? 'Learn'
        : 'Play';
    return `${activity}${scope ? ` ${scope}` : ''} ${domain.toLowerCase()} · Flag Atlas`;
  }
  if (scope && route.scope) return `${scope} ${domain.toLowerCase()} · Flag Atlas`;
  return `${domain} · Flag Atlas`;
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
