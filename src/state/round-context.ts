import type { AppRouter } from '../routing/router.js';
import type { AppRoute } from '../routing/routes.js';
import type { AppStore } from './store.js';

/**
 * Dependencies each domain's round controller needs from app.ts, the
 * composition root. Passed in explicitly (rather than imported globally) so
 * these modules stay easy to reason about in isolation and free of a
 * circular import back to app.ts.
 */
export interface RoundContext {
  store: AppStore;
  router: AppRouter;
  announce(message: string): void;
  /** Re-renders the DOM, optionally restoring focus to `previousSelector` afterwards. */
  finishInteraction(previousSelector: string | null): void;
  /** app.ts's own current-route mirror; several `currentXScope()` helpers fall back to it. */
  getCurrentRoute(): AppRoute;
  /**
   * Cancels every domain's pending auto-advance timer, not just this round's
   * own. Every `begin()` cancels defensively across all domains before
   * starting, matching the original app.ts behaviour.
   */
  cancelAllPending(): void;
}
