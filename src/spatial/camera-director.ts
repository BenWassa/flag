/**
 * Issue #119 — camera grammar (F1 motion contract).
 *
 * One rule governs every movement: the camera is a pure interpretation of route
 * ancestry, and the route never waits for it. Travel is retargetable, so a
 * change of destination mid-flight continues from wherever the camera is; a
 * learner's hand always outranks choreography, and Back is simply another
 * destination rather than a reversed animation.
 *
 * Motion communicates hierarchy. It is not spectacle: one ease, one duration,
 * no orbit-arounds, no fly-throughs, and nothing longer than a page transition.
 */

import type { Pose } from './scope-geography.js';

/** Long enough to read as travel, short enough to interrupt without frustration. */
export const TRAVEL_MS = 620;

const easeOut = (t: number) => 1 - (1 - t) ** 3;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Interpolate longitude the short way round, so travel never crosses the globe. */
const lerpLon = (a: number, b: number, t: number) => a + (((b - a + 540) % 360) - 180) * t;

export interface CameraDirectorOptions {
  apply(pose: Pose): void;
  /** Reduced motion is read per movement, not cached: users change it mid-session. */
  prefersReducedMotion(): boolean;
  now?: () => number;
  schedule?: (callback: () => void) => void;
}

export interface CameraDirector {
  readonly pose: Pose;
  readonly travelling: boolean;
  /** Moves toward `next`. `immediate` covers cold starts and deep links. */
  travelTo(next: Pose, immediate?: boolean): void;
  /** Direct manipulation. Cancels travel and takes ownership of the pose. */
  nudge(next: Pose): void;
  /** Re-derives the destination after a resize without restarting travel. */
  retarget(next: Pose): void;
  stop(): void;
}

export function createCameraDirector(initial: Pose, options: CameraDirectorOptions): CameraDirector {
  const now = options.now ?? (() => performance.now());
  const schedule = options.schedule ?? ((callback: () => void) => { requestAnimationFrame(callback); });

  let current = initial;
  let target = initial;
  let from = initial;
  let startedAt = 0;
  let travelling = false;

  const settle = (pose: Pose) => {
    travelling = false;
    current = pose;
    target = pose;
    options.apply(pose);
  };

  const step = () => {
    if (!travelling) return;
    const t = Math.min(1, (now() - startedAt) / TRAVEL_MS);
    const eased = easeOut(t);
    current = {
      lon: lerpLon(from.lon, target.lon, eased),
      lat: lerp(from.lat, target.lat, eased),
      distance: lerp(from.distance, target.distance, eased),
    };
    options.apply(current);
    if (t < 1) { schedule(step); return; }
    travelling = false;
  };

  return {
    get pose() { return current; },
    get travelling() { return travelling; },

    travelTo(next, immediate = false) {
      // Reduced motion keeps the same destination and drops only the journey.
      // The learner still arrives exactly where the route says they are.
      if (immediate || options.prefersReducedMotion()) { settle(next); return; }
      target = next;
      from = current;
      startedAt = now();
      if (travelling) return;
      travelling = true;
      schedule(step);
    },

    nudge(next) { settle(next); },

    retarget(next) {
      if (travelling) { target = next; return; }
      settle(next);
    },

    stop() {
      travelling = false;
      target = current;
    },
  };
}
