import { WEST_AFRICA_MAP_COUNTRY_IDS } from '../data/map-scopes.js';
import { COUNTRIES } from '../data/countries.js';
import {
  advanceMapSession,
  applyMapGuess,
  buildMapSession,
  createInitialLocationProgress,
  finishMapSession,
  mapSessionIsComplete,
} from '../domain/map-game.js';
import type {
  LocationProgressState,
  MapGuessOutcome,
  MapMode,
  MapRegionAsset,
  MapSession,
  MapSessionResult,
} from '../domain/map-models.js';
import { applyAttempt, createInitialProgress, getRecord } from '../domain/progress.js';
import type {
  ProgressState,
  QuizAttempt,
  QuizSession,
  SessionResult,
  StudyMode,
  StudyScope,
} from '../domain/models.js';
import { buildQuiz } from '../domain/quiz.js';
import {
  appendMapAttempt,
  loadLocationProgress,
  mapStorageIsWritable,
  saveLocationProgress,
} from '../infrastructure/map-storage.js';
import { appendAttempt, loadProgress, saveProgress, storageIsWritable } from '../infrastructure/storage.js';

export type ViewState =
  | { name: 'home' }
  | { name: 'scope'; scope: StudyScope }
  | { name: 'progress' }
  | { name: 'quiz' }
  | { name: 'results'; result: SessionResult }
  | { name: 'map-home' }
  | { name: 'map-quiz' }
  | { name: 'map-results'; result: MapSessionResult };

function sessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class AppStore {
  progress: ProgressState;
  locationProgress: LocationProgressState;
  view: ViewState = { name: 'home' };
  session: QuizSession | null = null;
  mapSession: MapSession | null = null;
  mapAsset: MapRegionAsset | null = null;
  questionStartedAt = performance.now();
  answeredCountryId: string | null = null;
  currentAttempt: QuizAttempt | null = null;
  mapLastWrongCountryId: string | null = null;
  mapLastOutcome: MapGuessOutcome | null = null;

  persisting = true;
  mapPersisting = true;

  constructor() {
    const persisted = loadProgress();
    const initial = createInitialProgress(COUNTRIES);
    this.progress = initial;

    if (persisted) {
      const records = { ...initial.records };
      for (const country of COUNTRIES) {
        const record = persisted.records[country.id];
        if (record) records[country.id] = record;
      }
      this.progress = { ...initial, records };
    }

    const locationInitial = createInitialLocationProgress(WEST_AFRICA_MAP_COUNTRY_IDS);
    const locationPersisted = loadLocationProgress();
    this.locationProgress = locationInitial;
    if (locationPersisted) {
      // Preserve records for future map assets while ensuring every currently
      // supported pilot country has a well-formed default.
      const records = { ...locationPersisted.records };
      for (const countryId of WEST_AFRICA_MAP_COUNTRY_IDS) {
        records[countryId] ??= locationInitial.records[countryId];
      }
      this.locationProgress = { ...locationInitial, records };
    }

    this.persisting = storageIsWritable();
    this.mapPersisting = mapStorageIsWritable();
  }

  navigate(view: ViewState): void {
    this.view = view;
  }

  resetProgress(): void {
    this.progress = createInitialProgress(COUNTRIES);
    this.session = null;
    this.answeredCountryId = null;
    this.currentAttempt = null;
  }

  resetMapProgress(): void {
    this.locationProgress = createInitialLocationProgress(WEST_AFRICA_MAP_COUNTRY_IDS);
    this.mapSession = null;
    this.mapAsset = null;
    this.mapLastWrongCountryId = null;
    this.mapLastOutcome = null;
  }

  startSession(scope: StudyScope, mode: StudyMode, size = 10, reviewIds?: string[]): boolean {
    const id = sessionId();
    const questions = buildQuiz({
      countries: COUNTRIES,
      progress: this.progress,
      scope,
      mode,
      size,
      sessionId: id,
      targetCountryIds: reviewIds,
    });

    if (questions.length === 0) return false;

    this.session = {
      id,
      mode,
      scope,
      startedAt: new Date().toISOString(),
      questions,
      currentIndex: 0,
      attempts: [],
    };
    this.answeredCountryId = null;
    this.currentAttempt = null;
    this.questionStartedAt = performance.now();
    this.view = { name: 'quiz' };
    return true;
  }

  answer(selectedCountryId: string): QuizAttempt {
    if (!this.session) throw new Error('No active quiz session.');
    const question = this.session.questions[this.session.currentIndex];
    if (!question) throw new Error('No active question.');

    const responseTimeMs = Math.max(0, Math.round(performance.now() - this.questionStartedAt));
    const before = getRecord(this.progress, question.countryId);
    const result = applyAttempt(this.progress, question.countryId, {
      sessionId: this.session.id,
      countryId: question.countryId,
      selectedCountryId,
      responseTimeMs,
    });

    this.progress = result.state;
    if (!saveProgress(this.progress)) this.persisting = false;
    appendAttempt(result.attempt);
    this.session.attempts.push(result.attempt);
    this.answeredCountryId = selectedCountryId;
    this.currentAttempt = result.attempt;

    result.attempt.statusBefore = before.status;
    return result.attempt;
  }

  advance(): SessionResult | null {
    if (!this.session) return null;

    if (this.session.currentIndex < this.session.questions.length - 1) {
      this.session.currentIndex += 1;
      this.answeredCountryId = null;
      this.currentAttempt = null;
      this.questionStartedAt = performance.now();
      return null;
    }

    const result = this.finishSession();
    this.view = { name: 'results', result };
    return result;
  }

  finishSession(): SessionResult {
    if (!this.session) throw new Error('No active quiz session.');
    const attempts = this.session.attempts;
    const newlyMastered = attempts
      .filter((attempt) => attempt.statusBefore !== 'mastered' && attempt.statusAfter === 'mastered')
      .map((attempt) => attempt.countryId);

    return {
      session: this.session,
      correct: attempts.filter((attempt) => attempt.correct).length,
      total: this.session.questions.length,
      newlyMastered,
      missed: attempts.filter((attempt) => !attempt.correct),
    };
  }

  startMapSession(
    asset: MapRegionAsset,
    mode: MapMode,
    targetCountryIds?: readonly string[],
  ): boolean {
    const mapSession = buildMapSession(asset, mode, sessionId(), targetCountryIds);
    if (mapSession.countryIds.length === 0) return false;

    this.mapAsset = asset;
    this.mapSession = mapSession;
    this.mapLastWrongCountryId = null;
    this.mapLastOutcome = null;
    this.questionStartedAt = performance.now();
    this.view = { name: 'map-quiz' };
    return true;
  }

  answerMap(selectedCountryId: string): MapGuessOutcome {
    if (!this.mapSession) throw new Error('No active map session.');
    const responseTimeMs = Math.max(0, Math.round(performance.now() - this.questionStartedAt));
    const result = applyMapGuess(
      this.mapSession,
      this.locationProgress,
      selectedCountryId,
      responseTimeMs,
    );

    this.mapSession = result.session;
    this.locationProgress = result.progress;
    this.mapLastWrongCountryId = result.outcome.correct ? null : selectedCountryId;
    this.mapLastOutcome = result.outcome;
    this.questionStartedAt = performance.now();

    if (!saveLocationProgress(this.locationProgress)) this.mapPersisting = false;
    appendMapAttempt(result.attempt);
    return result.outcome;
  }

  advanceMap(): MapSessionResult | null {
    if (!this.mapSession) return null;
    const completed = mapSessionIsComplete(this.mapSession);
    if (completed) {
      const result = finishMapSession(this.mapSession);
      this.view = { name: 'map-results', result };
      return result;
    }

    this.mapSession = advanceMapSession(this.mapSession);
    this.mapLastWrongCountryId = null;
    this.mapLastOutcome = null;
    this.questionStartedAt = performance.now();
    return null;
  }
}
