import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { COUNTRIES, COUNTRY_BY_ID } from '../../data/countries.js';
import { loadMapAsset } from '../../data/maps/index.js';
import { getNeighborScopeConfig, landAdjacencyForScope } from '../../data/neighbors/index.js';
import { buildMapSession, createInitialLocationProgress, finishMapSession } from '../../domain/map-game.js';
import { buildNeighborSession, createInitialNeighborProgress } from '../../domain/neighbor-game.js';
import { loadOutlineAsset } from '../../data/outlines.js';
import { createInitialProgress } from '../../domain/progress.js';
import { buildQuiz } from '../../domain/quiz.js';
import type { MapRegionAsset } from '../../domain/map-models.js';
import type { OutlineAsset } from '../../domain/outline.js';
import { AppStore } from '../../state/store.js';
import type { QuizSession, StudyScope } from '../../domain/models.js';
import type { AtlasActions } from '../actions.js';
import { AtlasActionsContext } from '../actions.js';
import { LocationQuizScreen, LocationResultsScreen } from '../screens/LocationScreens.js';
import { NeighborQuizScreen } from '../screens/NeighborScreens.js';
import { FlagsQuizScreen, OutlineQuizScreen, RecognitionResultsScreen } from '../screens/RecognitionScreens.js';

// Issue #89 closeout (#96-#99): the four active-round surfaces ship on React,
// and their invariant coverage is strong, but invariants are not the same
// evidence layer as the component lifecycle a learner actually drives. These
// exercise the material states — question, answer, feedback, results — against
// the real domain sessions rather than hand-built fixtures.

function actions(): AtlasActions {
  return {
    goHome: vi.fn(), goBack: vi.fn(), openProfile: vi.fn(), openDomain: vi.fn(), openScope: vi.fn(),
    playScope: vi.fn(), learnScope: vi.fn(), startFlags: vi.fn(),
    revealFlag: vi.fn(), toggleAllFlagNames: vi.fn(), answerFlag: vi.fn(),
    answerLocation: vi.fn(), answerOutline: vi.fn(), setNeighborQuery: vi.fn(),
    submitNeighbor: vi.fn(), submitNeighborQuery: vi.fn(), advance: vi.fn(),
    exitRound: vi.fn(), review: vi.fn(), repeat: vi.fn(),
  };
}

function renderWith(atlasActions: AtlasActions, ui: React.ReactNode) {
  return render(<AtlasActionsContext value={atlasActions}>{ui}</AtlasActionsContext>);
}

const WEST_AFRICA: StudyScope = { kind: 'region', id: 'west-africa', label: 'West Africa' };

function flagsSession(mode: 'test' | 'learn' = 'test'): QuizSession {
  const questions = buildQuiz({
    countries: COUNTRIES,
    progress: createInitialProgress(COUNTRIES),
    scope: WEST_AFRICA,
    mode,
    size: 4,
    sessionId: 'flags-component-round',
  });
  return {
    id: 'flags-component-round',
    mode,
    scope: WEST_AFRICA,
    startedAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    questions,
    currentIndex: 0,
    attempts: [],
  };
}

describe('Flags active round', () => {
  it('shows the flag, its choices and the round position', () => {
    const session = flagsSession();
    renderWith(actions(), <FlagsQuizScreen session={session} progress={createInitialProgress(COUNTRIES)} answeredCountryId={null} />);

    expect(screen.getByRole('heading', { name: 'West Africa' })).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Round progress' })).toBeTruthy();
    // The flag is deliberately unnamed until it is answered, or the question
    // would carry its own answer in the accessibility tree.
    expect(screen.getByAltText('Flag to identify')).toBeTruthy();
    const options = session.questions[0].optionCountryIds;
    expect(options.length).toBeGreaterThan(1);
    for (const [index, id] of options.entries()) {
      expect(screen.getByRole('button', { name: `${index + 1}. ${COUNTRY_BY_ID.get(id)!.name}` })).toBeTruthy();
    }
  });

  it('answers through the choice a learner presses', async () => {
    const atlasActions = actions();
    const session = flagsSession();
    const chosen = session.questions[0].optionCountryIds[0];
    renderWith(atlasActions, <FlagsQuizScreen session={session} progress={createInitialProgress(COUNTRIES)} answeredCountryId={null} />);

    await userEvent.click(screen.getByRole('button', { name: `1. ${COUNTRY_BY_ID.get(chosen)!.name}` }));
    expect(atlasActions.answerFlag).toHaveBeenCalledWith(chosen);
  });

  it('names the correct answer and disables the choices once answered', () => {
    const session = flagsSession();
    const target = session.questions[0].countryId;
    const wrong = session.questions[0].optionCountryIds.find((id) => id !== target)!;
    renderWith(actions(), <FlagsQuizScreen session={session} progress={createInitialProgress(COUNTRIES)} answeredCountryId={wrong} />);

    // Play uses the shared outcome model: a tone-carrying title plus the answer.
    expect(screen.getByText('Not quite')).toBeTruthy();
    expect(screen.getByText(`Answer: ${COUNTRY_BY_ID.get(target)!.name}`)).toBeTruthy();
    for (const id of session.questions[0].optionCountryIds) {
      const button = screen.getByRole('button', { name: new RegExp(`${COUNTRY_BY_ID.get(id)!.name}`) });
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
  });

  // Driven through a real AppStore round rather than a hand-built result, so
  // this covers the store/controller lifecycle the screen actually receives.
  it('reports a wrong answer on the results screen', () => {
    const store = new AppStore();
    expect(store.startSession(WEST_AFRICA, 'test', 3)).toBe(true);
    let wrongName = '';
    for (let step = 0; step < 3; step += 1) {
      const question = store.session!.questions[store.session!.currentIndex];
      const wrong = question.optionCountryIds.find((id) => id !== question.countryId)!;
      if (step === 0) wrongName = COUNTRY_BY_ID.get(wrong)!.name;
      store.answer(wrong);
      store.advance();
    }
    const result = store.sessionResult!;
    renderWith(actions(), <RecognitionResultsScreen result={result} domain="flags" />);

    expect(screen.getByRole('heading', { name: 'Review' })).toBeTruthy();
    expect(screen.getByText(`You chose ${wrongName}`)).toBeTruthy();
  });
});

describe('Outlines active round', () => {
  let asset: OutlineAsset;
  beforeAll(async () => {
    asset = (await loadOutlineAsset('west-africa'))!;
  });

  it('asks which country a silhouette is without naming it', () => {
    const session = flagsSession();
    const outlineSession: QuizSession = {
      ...session,
      questions: buildQuiz({
        countries: COUNTRIES.filter((country) => asset.countryIds.includes(country.id)),
        progress: createInitialProgress(COUNTRIES),
        scope: WEST_AFRICA,
        mode: 'test',
        size: 4,
        sessionId: 'outline-component-round',
      }),
    };
    renderWith(actions(), <OutlineQuizScreen asset={asset} session={outlineSession} progress={createInitialProgress(COUNTRIES)} answeredCountryId={null} />);

    expect(screen.getByText('Which country is this?')).toBeTruthy();
    // The silhouette must not leak its answer into the accessibility tree — the
    // choices name the country, the shape being identified never does.
    const silhouette = screen.getByRole('img');
    expect(silhouette.getAttribute('aria-label')).toBe('Country silhouette to identify');
    const target = COUNTRY_BY_ID.get(outlineSession.questions[0].countryId)!;
    expect(document.querySelector('.outline-stage')!.textContent).not.toContain(target.name);
  });

  it('answers an outline through its choice', async () => {
    const atlasActions = actions();
    const outlineSession: QuizSession = {
      ...flagsSession(),
      questions: buildQuiz({
        countries: COUNTRIES.filter((country) => asset.countryIds.includes(country.id)),
        progress: createInitialProgress(COUNTRIES),
        scope: WEST_AFRICA,
        mode: 'test',
        size: 4,
        sessionId: 'outline-answer-round',
      }),
    };
    const chosen = outlineSession.questions[0].optionCountryIds[0];
    renderWith(atlasActions, <OutlineQuizScreen asset={asset} session={outlineSession} progress={createInitialProgress(COUNTRIES)} answeredCountryId={null} />);

    await userEvent.click(screen.getByRole('button', { name: `1. ${COUNTRY_BY_ID.get(chosen)!.name}` }));
    expect(atlasActions.answerOutline).toHaveBeenCalledWith(chosen);
  });
});

describe('Locations active round', () => {
  let asset: MapRegionAsset;
  beforeAll(async () => {
    asset = (await loadMapAsset('west-africa'))!;
  });

  it('prompts for one country at a time and renders the map', () => {
    const session = buildMapSession(asset, 'test', 'locations-component-round');
    renderWith(actions(), <LocationQuizScreen asset={asset} session={session} lastWrongCountryId={null} />);

    const prompt = document.querySelector('#map-prompt-heading');
    expect(prompt).toBeTruthy();
    expect(prompt!.textContent).toContain(COUNTRY_BY_ID.get(session.countryIds[0])!.name);
    expect(document.querySelector('.map-svg')).toBeTruthy();
    expect(document.querySelectorAll('[data-action="map-answer"]').length).toBeGreaterThan(0);
  });

  it('offers every scoped country as an answerable target', () => {
    const session = buildMapSession(asset, 'test', 'locations-targets-round');
    renderWith(actions(), <LocationQuizScreen asset={asset} session={session} lastWrongCountryId={null} />);

    const answerable = new Set(
      [...document.querySelectorAll('[data-action="map-answer"]')].map((node) => node.getAttribute('data-id')),
    );
    for (const countryId of session.countryIds) expect(answerable.has(countryId)).toBe(true);
  });

  it('reports what a learner missed and offers a review pass', () => {
    const session = buildMapSession(asset, 'test', 'locations-results-round');
    const missedId = session.countryIds[0];
    const finished = finishMapSession({
      ...session,
      currentIndex: session.countryIds.length,
      targets: Object.fromEntries(session.countryIds.map((id, index) => [
        id,
        { countryId: id, misses: index === 0 ? 1 : 0, resolved: true, resolution: index === 0 ? 'incorrect' : 'first-try' },
      ])),
    });
    renderWith(actions(), <LocationResultsScreen asset={asset} result={finished} />);

    expect(finished.missedCountryIds).toContain(missedId);
    expect(screen.getByRole('heading', { name: 'Round complete' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: `${finished.firstTryCorrect} of ${finished.total} first try` })).toBeTruthy();
    expect(screen.getByText(/locations? needs? another pass/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Review mistakes' })).toBeTruthy();
  });

  it('calls a clean round clean and offers no review pass', () => {
    const session = buildMapSession(asset, 'test', 'locations-clean-round');
    const finished = finishMapSession({
      ...session,
      currentIndex: session.countryIds.length,
      targets: Object.fromEntries(session.countryIds.map((id) => [
        id,
        { countryId: id, misses: 0, resolved: true, resolution: 'first-try' },
      ])),
    });
    renderWith(actions(), <LocationResultsScreen asset={asset} result={finished} />);

    expect(finished.missedCountryIds).toEqual([]);
    expect(screen.getByText('Clean round. Every location was right immediately.')).toBeTruthy();
    expect(screen.getByText('Perfect round')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Review mistakes' })).toBeNull();
  });
});

describe('Neighbours active round', () => {
  function neighborSession(targetCountryIds?: readonly string[]) {
    const config = getNeighborScopeConfig('west-africa')!;
    const adjacency = landAdjacencyForScope('west-africa')!;
    return buildNeighborSession(
      adjacency,
      createInitialNeighborProgress(config.countryIds),
      config.scope,
      config.countryIds,
      'test',
      'neighbors-component-round',
      4,
      targetCountryIds,
    );
  }

  it('asks for the current target and takes typed input', async () => {
    const atlasActions = actions();
    const session = neighborSession();
    renderWith(atlasActions, <NeighborQuizScreen session={session} lastOutcome={null} query="" />);

    const target = COUNTRY_BY_ID.get(session.countryIds[0])!;
    expect(screen.getByRole('heading', { level: 1, name: target.name })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Name every land-border neighbour' })).toBeTruthy();
    const field = screen.getByLabelText('Country');
    await userEvent.type(field, 'Mal');
    expect(atlasActions.setNeighborQuery).toHaveBeenCalled();
  });

  it('offers the explicit no-land-neighbours claim', () => {
    const session = neighborSession();
    renderWith(actions(), <NeighborQuizScreen session={session} lastOutcome={null} query="" />);

    // The claim is a deliberate answer, never inferred from an empty round.
    expect(screen.getByRole('button', { name: /No land neighbours/i })).toBeTruthy();
  });

  it('reports a wrong guess back to the learner', () => {
    const session = neighborSession();
    const target = session.countryIds[0];
    renderWith(actions(), (
      <NeighborQuizScreen
        session={session}
        lastOutcome={{
          targetCountryId: target,
          selectedCountryId: 'PER',
          kind: 'wrong',
          consumedAttempt: true,
          attemptsUsed: 1,
          remainingAttempts: 3,
          foundCount: 0,
          totalNeighbors: session.targets[target].neighborIds.length,
          resolved: false,
          revealedIds: [],
        }}
        query=""
      />
    ));

    const feedback = document.querySelector('.neighbor-feedback');
    expect(feedback).toBeTruthy();
    expect(within(feedback as HTMLElement).getByText(/Peru/i)).toBeTruthy();
  });
});
