import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapRegionAsset } from '../domain/map-models.js';
import type { AppRouter } from '../routing/router.js';
import type { RoundContext } from './round-context.js';
import { createLocationsRound, LOCATION_WRONG_FEEDBACK_MS } from './locations-round.js';
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

  afterEach(() => vi.useRealTimers());

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
