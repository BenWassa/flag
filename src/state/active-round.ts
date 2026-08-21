import type { LearningRoute } from '../routing/routes.js';

/**
 * Only one learning round can be active at a time, regardless of domain, so
 * this is process-wide state rather than something each domain's round
 * controller owns individually. app.ts's exit/discard/navigate-guard logic
 * needs to know "is *any* round active and which route is it" without
 * caring which domain — this module is that single source of truth, shared
 * by app.ts and by each domain's round controller.
 */
let activeRoundRoute: LearningRoute | null = null;

export function getActiveRoundRoute(): LearningRoute | null {
  return activeRoundRoute;
}

export function setActiveRoundRoute(route: LearningRoute | null): void {
  activeRoundRoute = route;
}
