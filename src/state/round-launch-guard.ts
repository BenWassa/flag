/**
 * Locations and Outlines both start a round by loading geometry (a map or
 * outline asset) asynchronously first, so a stale load can resolve after the
 * learner has already navigated elsewhere. Any route change at all — not
 * just a same-domain one — needs to invalidate a pending load, so this
 * counter is shared process-wide rather than owned per domain: the winning
 * load is whichever one incremented it last.
 */
let roundLaunchRequest = 0;

/** Called on every route change, so an in-flight geometry load from any domain is invalidated. */
export function invalidatePendingRoundLaunch(): void {
  roundLaunchRequest += 1;
}

/** Called when a round starts loading geometry; compare the returned token against `isCurrentRoundLaunch` after each await. */
export function beginRoundLaunch(): number {
  roundLaunchRequest += 1;
  return roundLaunchRequest;
}

export function isCurrentRoundLaunch(request: number): boolean {
  return request === roundLaunchRequest;
}
