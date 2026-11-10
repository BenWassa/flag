import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapRegionAsset } from '../domain/map-models.js';
import type { AppRouter } from '../routing/router.js';
import type { RoundContext } from './round-context.js';
import { createLocationsRound, LOCATION_WRONG_FEEDBACK_MS } from './locations-round.js';
import { PLAY_FEEDBACK_DWELL_CORRECT_MS, PLAY_FEEDBACK_DWELL_WRONG_MS } from './play-feedback-timing.js';
import { AppStore } from './store.js';

const asset: MapRegionAsset = {
  scope: { kind: 'region', id: 'west-africa', label: 'West Africa' },
  viewBox: '0 0 20 10',
  countries: [
    { countryId: 'GHA', path: 'M0 0h8v8H0z' },
    { countryId: 'MLI', path: 'M10 0h8v8h-8z' },
  ],
};

function context(store: AppStore, finishInteraction = vi.fn()): RoundContext {
  return {
    store,
    router: { current: () => null, navigate: vi.fn(), back: vi.fn(), subscribe: () => () => undefined } as AppRouter,
    announce: vi.fn(),
    notify: vi.fn(),
    finishInteraction,
    getCurrentRoute: () => ({ name: 'home' }),
    cancelAllPending: vi.fn(),
  };
}

describe('Locations wrong-answer feedback state', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('clears the transient Learn highlight without changing the attempt or evidence', () => {
    const store = new AppStore();
    expect(store.startMapSession(asset, 'learn')).toBe(true);
    const target = store.mapSession!.countryIds[0];
    const wrong = target === 'GHA' ? 'MLI' : 'GHA';
    const finishInteraction = vi.fn();
    const round = createLocationsRound(context(store, finishInteraction));

    round.submitAnswer(wrong, `[data-id="${wrong}"]`);
    expect(store.mapLastWrongCountryId).toBe(wrong);
    const attempt = structuredClone(store.mapSession!.attempts);
    const progress = structuredClone(store.locationProgress);
    const outcome = structuredClone(store.mapLastOutcome);

    vi.advanceTimersByTime(LOCATION_WRONG_FEEDBACK_MS - 1);
    expect(store.mapLastWrongCountryId).toBe(wrong);
    vi.advanceTimersByTime(1);

    expect(store.mapLastWrongCountryId).toBeNull();
    expect(store.mapSession!.attempts).toEqual(attempt);
    expect(store.locationProgress).toEqual(progress);
    expect(store.mapLastOutcome).toEqual(outcome);
    expect(finishInteraction).toHaveBeenLastCalledWith(`[data-id="${wrong}"]`);
  });

  it('clears transient Play error colour while leaving the unresolved target active', () => {
    const store = new AppStore();
    expect(store.startMapSession(asset, 'test')).toBe(true);
    const target = store.mapSession!.countryIds[0];
    const wrong = target === 'GHA' ? 'MLI' : 'GHA';
    const round = createLocationsRound(context(store));

    round.submitAnswer(wrong, `[data-id="${wrong}"]`);
    expect(store.mapLastWrongCountryId).toBe(wrong);
    expect(store.mapLastOutcome?.correct).toBe(false);
    expect(store.mapLastOutcome?.resolved).toBe(false);
    expect(store.mapSession!.targets[target]?.resolved).toBe(false);
    const attempts = structuredClone(store.mapSession!.attempts);
    const progress = structuredClone(store.locationProgress);
    const outcome = structuredClone(store.mapLastOutcome);

    vi.advanceTimersByTime(LOCATION_WRONG_FEEDBACK_MS - 1);
    expect(store.mapLastWrongCountryId).toBe(wrong);
    vi.advanceTimersByTime(1);

    expect(store.view.name).toBe('map-quiz');
    expect(store.mapLastWrongCountryId).toBeNull();
    expect(store.mapSession!.countryIds[store.mapSession!.currentIndex]).toBe(target);
    expect(store.mapSession!.targets[target]?.resolved).toBe(false);
    expect(store.mapSession!.attempts).toEqual(attempts);
    expect(store.locationProgress).toEqual(progress);
    expect(store.mapLastOutcome).toEqual(outcome);
  });
});


describe('Locations resolved-answer progression (#235)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it.each(['learn', 'test'] as const)('%s accepts one correct answer, dwells, then advances exactly once', (mode) => {
    const store = new AppStore();
    expect(store.startMapSession(asset, mode)).toBe(true);
    const first = store.mapSession!.countryIds[0];
    const second = store.mapSession!.countryIds[1];
    const finishInteraction = vi.fn();
    const round = createLocationsRound(context(store, finishInteraction));

    round.submitAnswer(first, `[data-id="${first}"]`);
    expect(store.mapSession!.currentIndex).toBe(0);
    expect(store.mapSession!.targets[first]?.resolved).toBe(true);
    expect(store.mapLastOutcome?.correct).toBe(true);
    // A repeat input during feedback cannot schedule another advance.
    round.submitAnswer(first, `[data-id="${first}"]`);
    expect(store.mapSession!.attempts).toHaveLength(1);

    vi.advanceTimersByTime(PLAY_FEEDBACK_DWELL_CORRECT_MS - 1);
    expect(store.mapSession!.currentIndex).toBe(0);
    vi.advanceTimersByTime(1);
    expect(store.mapSession!.currentIndex).toBe(1);
    expect(store.mapSession!.countryIds[store.mapSession!.currentIndex]).toBe(second);
    expect(store.mapLastOutcome).toBeNull();
    expect(store.view.name).toBe('map-quiz');
    expect(finishInteraction).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(PLAY_FEEDBACK_DWELL_WRONG_MS * 2);
    expect(store.mapSession!.currentIndex).toBe(1);
    expect(store.mapSession!.attempts).toHaveLength(1);
  });

  it('advances on visible frames when the browser timeout task source is stalled', () => {
    // Simulate the exact #235 browser condition: setTimeout is scheduled but
    // never serviced, while requestAnimationFrame continues to run.
    const frames = new Map<number, FrameRequestCallback>();
    let nextFrameId = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = ++nextFrameId;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => { frames.delete(id); });
    const frameAt = (time: number) => {
      const entry = frames.entries().next().value;
      if (!entry) throw new Error('Expected a pending animation frame.');
      const [id, callback] = entry;
      frames.delete(id);
      callback(time);
    };

    const store = new AppStore();
    expect(store.startMapSession(asset, 'learn')).toBe(true);
    const first = store.mapSession!.countryIds[0];
    const round = createLocationsRound(context(store));
    const started = performance.now();
    round.submitAnswer(first, null);

    expect(store.mapSession!.currentIndex).toBe(0);
    frameAt(started + PLAY_FEEDBACK_DWELL_CORRECT_MS - 1);
    expect(store.mapSession!.currentIndex).toBe(0);
    frameAt(started + PLAY_FEEDBACK_DWELL_CORRECT_MS + 1);
    expect(store.mapSession!.currentIndex).toBe(1);
    expect(frames.size).toBe(0);

    // The browser may eventually resume its timeout queue. It must not skip
    // a second country or record a duplicate attempt.
    vi.advanceTimersByTime(PLAY_FEEDBACK_DWELL_WRONG_MS * 2);
    expect(store.mapSession!.currentIndex).toBe(1);
    expect(store.mapSession!.attempts).toHaveLength(1);
  });

  it('cancels an accepted-answer advance when a round is exited', () => {
    const store = new AppStore();
    expect(store.startMapSession(asset, 'learn')).toBe(true);
    const first = store.mapSession!.countryIds[0];
    const finishInteraction = vi.fn();
    const round = createLocationsRound(context(store, finishInteraction));

    round.submitAnswer(first, null);
    expect(store.mapSession!.targets[first]?.resolved).toBe(true);
    round.cancelPending();
    store.abandonMapSession();
    vi.advanceTimersByTime(PLAY_FEEDBACK_DWELL_WRONG_MS * 2);

    expect(store.mapSession).toBeNull();
    // Only the answer rerender occurred; no stale timer advanced or rendered.
    expect(finishInteraction).toHaveBeenCalledTimes(1);
  });

  it('does not skip on unresolved guesses, but advances after the third-miss reveal dwell', () => {
    const store = new AppStore();
    expect(store.startMapSession(asset, 'test')).toBe(true);
    const first = store.mapSession!.countryIds[0];
    const wrong = first === 'GHA' ? 'MLI' : 'GHA';
    const round = createLocationsRound(context(store));

    for (let miss = 1; miss <= 2; miss += 1) {
      round.submitAnswer(wrong, null);
      expect(store.mapSession!.targets[first]?.misses).toBe(miss);
      expect(store.mapSession!.targets[first]?.resolved).toBe(false);
      vi.advanceTimersByTime(PLAY_FEEDBACK_DWELL_WRONG_MS * 2);
      expect(store.mapSession!.currentIndex).toBe(0);
    }
    round.submitAnswer(wrong, null);
    expect(store.mapSession!.targets[first]?.resolution).toBe('revealed');
    vi.advanceTimersByTime(PLAY_FEEDBACK_DWELL_WRONG_MS - 1);
    expect(store.mapSession!.currentIndex).toBe(0);
    vi.advanceTimersByTime(1);
    expect(store.mapSession!.currentIndex).toBe(1);
    expect(store.mapSession!.attempts).toHaveLength(3);
  });
});
