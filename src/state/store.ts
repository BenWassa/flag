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
import { appendAttempt, loadProgress, saveProgress } from '../infrastructure/storage.js';

export type ViewState =
  | { name: 'home' }
  | { name: 'scope'; scope: StudyScope }
  | { name: 'progress' }
  | { name: 'quiz' }
  | { name: 'results'; result: SessionResult };

export class AppStore {
  progress: ProgressState;
  view: ViewState = { name: 'home' };
  session: QuizSession | null = null;
  questionStartedAt = performance.now();
  answeredCountryId: string | null = null;
  currentAttempt: QuizAttempt | null = null;

  constructor() {
    const persisted = loadProgress();
    const initial = createInitialProgress(COUNTRIES);
    this.progress = persisted
      ? {
          ...initial,
          records: { ...initial.records, ...persisted.records },
        }
      : initial;
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

  startSession(scope: StudyScope, mode: StudyMode, size = 10, reviewIds?: string[]): void {
    const id = crypto.randomUUID();
    const questions = buildQuiz({
      countries: COUNTRIES,
      progress: this.progress,
      scope,
      mode,
      size,
      sessionId: id,
      targetCountryIds: reviewIds,
    });

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
    saveProgress(this.progress);
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
