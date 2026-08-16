import { COUNTRIES } from '../data/countries.js';
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
import { appendAttempt, loadProgress, saveProgress, storageIsWritable } from '../infrastructure/storage.js';

export type ViewState =
  | { name: 'home' }
  | { name: 'scope'; scope: StudyScope }
  | { name: 'progress' }
  | { name: 'quiz' }
  | { name: 'results'; result: SessionResult };

/**
 * `crypto.randomUUID` needs a secure context, so it is simply absent when the
 * app is opened over plain http, which is exactly how a mobile-first PWA gets
 * tested from a phone against a laptop on the same network. Calling it there
 * threw out of `startSession` and left the Learn button doing nothing at all.
 */
function sessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class AppStore {
  progress: ProgressState;
  view: ViewState = { name: 'home' };
  session: QuizSession | null = null;
  questionStartedAt = performance.now();
  answeredCountryId: string | null = null;
  currentAttempt: QuizAttempt | null = null;

  /** False once a write has failed, so the app can say progress is not being kept. */
  persisting = true;

  constructor() {
    const persisted = loadProgress();
    const initial = createInitialProgress(COUNTRIES);
    this.progress = initial;

    if (persisted) {
      // Only records for countries still in the catalog are carried forward, so
      // a ledger written by an older curriculum cannot accumulate dead keys.
      const records = { ...initial.records };
      for (const country of COUNTRIES) {
        const record = persisted.records[country.id];
        if (record) records[country.id] = record;
      }
      this.progress = { ...initial, records };
    }

    this.persisting = storageIsWritable();
  }

  navigate(view: ViewState): void {
    this.view = view;
  }

  /** Return every flag to Unseen. Storage is cleared separately by the caller. */
  resetProgress(): void {
    this.progress = createInitialProgress(COUNTRIES);
    this.session = null;
    this.answeredCountryId = null;
    this.currentAttempt = null;
  }

  /**
   * Returns false when the scope yields no questions. A round of zero is a dead
   * screen with nothing to answer, so the caller keeps the user where they are
   * rather than navigating into it.
   */
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
}
