import { AFRICA_MAP_COUNTRY_IDS } from '../data/map-scopes.js';
import { COUNTRIES } from '../data/countries.js';
import {
  AFRICA_LAND_ADJACENCY,
  getAfricaNeighborScopeConfig,
} from '../data/neighbors/index.js';
import {
  awardEligibleAchievements,
  createInitialAchievementState,
  type EarnedAchievementState,
  type NewlyEarnedAchievement,
} from '../domain/achievements.js';
import { activityForMode } from '../domain/evidence.js';
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
import {
  advanceNeighborSession,
  applyNeighborGuess,
  buildNeighborSession,
  createInitialNeighborProgress,
  finishNeighborSession,
  neighborSessionIsComplete,
} from '../domain/neighbor-game.js';
import type {
  NeighborGuessOutcome,
  NeighborProgressState,
  NeighborSession,
  NeighborSessionResult,
} from '../domain/neighbor-models.js';
import { buildOutlineQuiz, type OutlineAsset } from '../domain/outline.js';
import { applyAttempt, createInitialProgress, getRecord } from '../domain/progress.js';
import type {
  LearningDomain,
  ProgressState,
  QuizAttempt,
  QuizSession,
  SessionResult,
  StudyMode,
  StudyScope,
} from '../domain/models.js';
import { buildQuiz } from '../domain/quiz.js';
import {
  achievementStorageIsWritable,
  loadAchievementState,
  resetAchievementStorage,
  saveAchievementState,
} from '../infrastructure/achievement-storage.js';
import {
  appendMapAttempt,
  loadLocationProgress,
  mapStorageIsWritable,
  saveLocationProgress,
} from '../infrastructure/map-storage.js';
import {
  appendNeighborAttempt,
  loadNeighborProgress,
  neighborStorageIsWritable,
  saveNeighborProgress,
} from '../infrastructure/neighbor-storage.js';
import {
  appendOutlineAttempt,
  loadOutlineProgress,
  outlineStorageIsWritable,
  saveOutlineProgress,
} from '../infrastructure/outline-storage.js';
import { appendAttempt, loadProgress, saveProgress, storageIsWritable } from '../infrastructure/storage.js';
import { createCountryEvidenceQualification } from './achievement-evidence-adapter.js';

export type ViewState =
  | { name: 'home' }
  | { name: 'atlas-continent'; scope: StudyScope }
  | { name: 'domain'; domain: LearningDomain }
  | { name: 'scope'; scope: StudyScope }
  | { name: 'progress' }
  | { name: 'quiz' }
  | { name: 'results'; result: SessionResult }
  | { name: 'map-home'; scope: StudyScope }
  | { name: 'map-quiz' }
  | { name: 'map-results'; result: MapSessionResult }
  | { name: 'outline-home'; scope: StudyScope }
  | { name: 'outline-quiz' }
  | { name: 'outline-results'; result: SessionResult }
  | { name: 'neighbor-home'; scope: StudyScope }
  | { name: 'neighbor-quiz' }
  | { name: 'neighbor-results'; result: NeighborSessionResult };

function sessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const AFRICA_COUNTRY_ID_SET = new Set<string>(AFRICA_MAP_COUNTRY_IDS);
const AFRICA_COUNTRIES = COUNTRIES.filter((country) => AFRICA_COUNTRY_ID_SET.has(country.id));

export class AppStore {
  progress: ProgressState;
  locationProgress: LocationProgressState;
  outlineProgress: ProgressState;
  neighborProgress: NeighborProgressState;
  achievements: EarnedAchievementState;
  view: ViewState = { name: 'home' };
  session: QuizSession | null = null;
  sessionResult: SessionResult | null = null;
  mapSession: MapSession | null = null;
  mapSessionResult: MapSessionResult | null = null;
  mapAsset: MapRegionAsset | null = null;
  outlineSession: QuizSession | null = null;
  outlineSessionResult: SessionResult | null = null;
  outlineAsset: OutlineAsset | null = null;
  neighborSession: NeighborSession | null = null;
  neighborSessionResult: NeighborSessionResult | null = null;
  questionStartedAt = performance.now();
  answeredCountryId: string | null = null;
  currentAttempt: QuizAttempt | null = null;
  outlineAnsweredCountryId: string | null = null;
  outlineCurrentAttempt: QuizAttempt | null = null;
  mapLastWrongCountryId: string | null = null;
  mapLastOutcome: MapGuessOutcome | null = null;
  neighborLastOutcome: NeighborGuessOutcome | null = null;

  persisting = true;
  mapPersisting = true;
  outlinePersisting = true;
  neighborPersisting = true;
  achievementPersisting = true;

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

    const locationInitial = createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS);
    const locationPersisted = loadLocationProgress();
    this.locationProgress = locationInitial;
    if (locationPersisted) {
      const records = { ...locationPersisted.records };
      for (const countryId of AFRICA_MAP_COUNTRY_IDS) {
        records[countryId] ??= locationInitial.records[countryId];
      }
      this.locationProgress = { ...locationInitial, records };
    }

    const outlineInitial = createInitialProgress(AFRICA_COUNTRIES);
    const outlinePersisted = loadOutlineProgress();
    this.outlineProgress = outlineInitial;
    if (outlinePersisted) {
      const records = { ...outlineInitial.records };
      for (const country of AFRICA_COUNTRIES) {
        const record = outlinePersisted.records[country.id];
        if (record) records[country.id] = record;
      }
      this.outlineProgress = { ...outlineInitial, records };
    }

    const neighborIds = Object.keys(AFRICA_LAND_ADJACENCY);
    const neighborInitial = createInitialNeighborProgress(neighborIds);
    const neighborPersisted = loadNeighborProgress();
    this.neighborProgress = neighborInitial;
    if (neighborPersisted) {
      const records = { ...neighborPersisted.records };
      for (const countryId of neighborIds) records[countryId] ??= neighborInitial.records[countryId];
      this.neighborProgress = { ...neighborInitial, records };
    }

    this.achievements = loadAchievementState();
    this.persisting = storageIsWritable();
    this.mapPersisting = mapStorageIsWritable();
    this.outlinePersisting = outlineStorageIsWritable();
    this.neighborPersisting = neighborStorageIsWritable();
    this.achievementPersisting = achievementStorageIsWritable();
    this.refreshAchievements();
  }

  navigate(view: ViewState): void {
    this.view = view;
  }

  /** Re-evaluate only unearned milestones against the current evidence contract. */
  refreshAchievements(): NewlyEarnedAchievement[] {
    const result = awardEligibleAchievements(
      this.achievements,
      createCountryEvidenceQualification({
        flags: this.progress,
        locations: this.locationProgress,
        outlines: this.outlineProgress,
        neighbors: this.neighborProgress,
      }),
    );
    this.achievements = result.state;
    if (result.newlyEarned.length > 0 && !saveAchievementState(this.achievements)) {
      this.achievementPersisting = false;
    }
    return result.newlyEarned;
  }

  /** The current UI's Reset all progress action intentionally erases earned state too. */
  resetAchievements(): void {
    this.achievements = createInitialAchievementState();
    resetAchievementStorage();
  }

  resetProgress(): void {
    this.progress = createInitialProgress(COUNTRIES);
    this.resetAchievements();
    this.abandonSession();
  }

  resetMapProgress(): void {
    this.locationProgress = createInitialLocationProgress(AFRICA_MAP_COUNTRY_IDS);
    this.abandonMapSession();
    this.mapAsset = null;
  }

  resetOutlineProgress(): void {
    this.outlineProgress = createInitialProgress(AFRICA_COUNTRIES);
    this.abandonOutlineSession();
    this.outlineAsset = null;
  }

  resetNeighborProgress(): void {
    this.neighborProgress = createInitialNeighborProgress(Object.keys(AFRICA_LAND_ADJACENCY));
    this.abandonNeighborSession();
  }

  abandonSession(): void {
    this.session = null;
    this.sessionResult = null;
    this.answeredCountryId = null;
    this.currentAttempt = null;
  }

  abandonMapSession(): void {
    this.mapSession = null;
    this.mapSessionResult = null;
    this.mapLastWrongCountryId = null;
    this.mapLastOutcome = null;
  }

  abandonOutlineSession(): void {
    this.outlineSession = null;
    this.outlineSessionResult = null;
    this.outlineAnsweredCountryId = null;
    this.outlineCurrentAttempt = null;
  }

  abandonNeighborSession(): void {
    this.neighborSession = null;
    this.neighborSessionResult = null;
    this.neighborLastOutcome = null;
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
    this.sessionResult = null;
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
      activity: activityForMode(this.session.mode),
    });

    this.progress = result.state;
    if (!saveProgress(this.progress)) this.persisting = false;
    appendAttempt(result.attempt);
    this.session.attempts.push(result.attempt);
    this.answeredCountryId = selectedCountryId;
    this.currentAttempt = result.attempt;

    result.attempt.statusBefore = before.status;
    this.refreshAchievements();
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
    this.sessionResult = result;
    this.view = { name: 'results', result };
    return result;
  }

  finishSession(): SessionResult {
    if (!this.session) throw new Error('No active quiz session.');
    return finishQuizSession(this.session);
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
    this.mapSessionResult = null;
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
    this.refreshAchievements();
    return result.outcome;
  }

  advanceMap(): MapSessionResult | null {
    if (!this.mapSession) return null;
    const completed = mapSessionIsComplete(this.mapSession);
    if (completed) {
      const result = finishMapSession(this.mapSession);
      this.mapSessionResult = result;
      this.view = { name: 'map-results', result };
      return result;
    }

    this.mapSession = advanceMapSession(this.mapSession);
    this.mapLastWrongCountryId = null;
    this.mapLastOutcome = null;
    this.questionStartedAt = performance.now();
    return null;
  }

  startOutlineSession(
    asset: OutlineAsset,
    mode: StudyMode,
    size = 10,
    targetCountryIds?: readonly string[],
  ): boolean {
    const id = sessionId();
    const questions = buildOutlineQuiz({
      countries: COUNTRIES,
      progress: this.outlineProgress,
      scope: asset.scope,
      mode,
      size,
      sessionId: id,
      asset,
      targetCountryIds: targetCountryIds ? [...targetCountryIds] : undefined,
    });
    if (questions.length === 0) return false;

    this.outlineAsset = asset;
    this.outlineSession = {
      id,
      mode,
      scope: asset.scope,
      startedAt: new Date().toISOString(),
      questions,
      currentIndex: 0,
      attempts: [],
    };
    this.outlineSessionResult = null;
    this.outlineAnsweredCountryId = null;
    this.outlineCurrentAttempt = null;
    this.questionStartedAt = performance.now();
    this.view = { name: 'outline-quiz' };
    return true;
  }

  answerOutline(selectedCountryId: string): QuizAttempt {
    if (!this.outlineSession) throw new Error('No active outline session.');
    const question = this.outlineSession.questions[this.outlineSession.currentIndex];
    if (!question) throw new Error('No active outline question.');

    const responseTimeMs = Math.max(0, Math.round(performance.now() - this.questionStartedAt));
    const result = applyAttempt(this.outlineProgress, question.countryId, {
      sessionId: this.outlineSession.id,
      countryId: question.countryId,
      selectedCountryId,
      responseTimeMs,
      activity: activityForMode(this.outlineSession.mode),
    });

    this.outlineProgress = result.state;
    if (!saveOutlineProgress(this.outlineProgress)) this.outlinePersisting = false;
    appendOutlineAttempt(result.attempt);
    this.outlineSession.attempts.push(result.attempt);
    this.outlineAnsweredCountryId = selectedCountryId;
    this.outlineCurrentAttempt = result.attempt;
    this.refreshAchievements();
    return result.attempt;
  }

  advanceOutline(): SessionResult | null {
    if (!this.outlineSession) return null;

    if (this.outlineSession.currentIndex < this.outlineSession.questions.length - 1) {
      this.outlineSession.currentIndex += 1;
      this.outlineAnsweredCountryId = null;
      this.outlineCurrentAttempt = null;
      this.questionStartedAt = performance.now();
      return null;
    }

    const result = finishQuizSession(this.outlineSession);
    this.outlineSessionResult = result;
    this.view = { name: 'outline-results', result };
    return result;
  }

  startNeighborSession(
    scope: StudyScope,
    mode: StudyMode,
    size = 10,
    targetCountryIds?: readonly string[],
  ): boolean {
    const config = getAfricaNeighborScopeConfig(scope.id ?? 'africa');
    if (!config) return false;
    const session = buildNeighborSession(
      AFRICA_LAND_ADJACENCY,
      this.neighborProgress,
      config.scope,
      config.countryIds,
      mode,
      sessionId(),
      size,
      targetCountryIds,
    );
    if (session.countryIds.length === 0) return false;

    this.neighborSession = session;
    this.neighborSessionResult = null;
    this.neighborLastOutcome = null;
    this.questionStartedAt = performance.now();
    this.view = { name: 'neighbor-quiz' };
    return true;
  }

  answerNeighbor(selectedCountryId: string): NeighborGuessOutcome {
    if (!this.neighborSession) throw new Error('No active neighbor session.');
    const responseTimeMs = Math.max(0, Math.round(performance.now() - this.questionStartedAt));
    const result = applyNeighborGuess(
      this.neighborSession,
      this.neighborProgress,
      selectedCountryId,
      responseTimeMs,
    );
    this.neighborSession = result.session;
    this.neighborProgress = result.progress;
    this.neighborLastOutcome = result.outcome;
    this.questionStartedAt = performance.now();
    if (!saveNeighborProgress(this.neighborProgress)) this.neighborPersisting = false;
    appendNeighborAttempt(result.attempt);
    this.refreshAchievements();
    return result.outcome;
  }

  advanceNeighbor(): NeighborSessionResult | null {
    if (!this.neighborSession) return null;
    if (neighborSessionIsComplete(this.neighborSession)) {
      const result = finishNeighborSession(this.neighborSession);
      this.neighborSessionResult = result;
      this.view = { name: 'neighbor-results', result };
      return result;
    }

    this.neighborSession = advanceNeighborSession(this.neighborSession);
    this.neighborLastOutcome = null;
    this.questionStartedAt = performance.now();
    return null;
  }
}

function finishQuizSession(session: QuizSession): SessionResult {
  const attempts = session.attempts;
  const newlyMastered = attempts
    .filter((attempt) => attempt.statusBefore !== 'mastered' && attempt.statusAfter === 'mastered')
    .map((attempt) => attempt.countryId);

  return {
    session,
    correct: attempts.filter((attempt) => attempt.correct).length,
    total: session.questions.length,
    newlyMastered,
    missed: attempts.filter((attempt) => !attempt.correct),
  };
}
