import { COUNTRY_BY_ID } from '../../data/countries.js';
import type { ProgressState, QuizSession, SessionResult, LearningDomain } from '../../domain/models.js';
import type { OutlineAsset } from '../../domain/outline.js';
import { getRecord } from '../../domain/progress.js';
import { answerFeedback, roundRank, roundScore } from '../../domain/round-feedback.js';
import { exitRoundLabel, repeatRoundLabel, statusLabel } from '../../ui/format.js';
import { useAtlasActions } from '../actions.js';
import { FlagImage } from '../components/FlagImage.js';
import { Icon } from '../components/Icon.js';
import { OutlineSilhouette } from '../components/OutlineSilhouette.js';
import { AnswerFeedbackPanel, LiveScore } from '../components/RoundFeedback.js';

function EmptyRound({ outline = false }: { outline?: boolean }) {
  const actions = useAtlasActions();
  return <main className="page"><div className="empty-state"><strong tabIndex={-1} data-autofocus>{outline ? 'This outline round could not be built' : 'This round could not be built'}</strong><span>{outline ? 'The canonical silhouette data is missing.' : 'The question data is missing.'} Go back and start the round again.</span></div><div className="result-actions"><button className="button button--primary" onClick={actions.goBack}>Back</button></div></main>;
}

function KeyboardHint() {
  return <p className="quiz-hint" aria-hidden="true"><span><kbd>1</kbd>–<kbd>4</kbd> choose</span><span><kbd>Enter</kbd> next</span><span><kbd>Esc</kbd> exit</span></p>;
}

function RecognitionQuiz({ session, progress, answeredCountryId, outlineAsset }: {
  session: QuizSession;
  progress: ProgressState;
  answeredCountryId: string | null;
  outlineAsset?: OutlineAsset;
}) {
  const actions = useAtlasActions();
  const domain: LearningDomain = outlineAsset ? 'outlines' : 'flags';
  const question = session.questions[session.currentIndex];
  const target = question ? COUNTRY_BY_ID.get(question.countryId) : undefined;
  const geometry = question && outlineAsset ? outlineAsset.geometries[question.countryId] : undefined;
  if (!question || !target || (outlineAsset && !geometry)) return <EmptyRound outline={Boolean(outlineAsset)} />;
  const options = question.optionCountryIds.map((id) => COUNTRY_BY_ID.get(id)).filter((country) => country !== undefined);
  if (!options.some((country) => country.id === target.id)) return <EmptyRound outline={Boolean(outlineAsset)} />;
  const answered = answeredCountryId !== null;
  const play = session.mode === 'test';
  const learnFeedback = answered && !play;
  const pct = ((session.currentIndex + (answered ? 1 : 0)) / session.questions.length) * 100;
  const last = session.currentIndex === session.questions.length - 1;
  const correctAnswer = answeredCountryId === target.id;
  const score = roundScore(session.attempts, session.questions.length);
  return <main className={`quiz-shell${outlineAsset ? ' quiz-shell--outline' : ''}`}>
    <header className="quiz-header"><button className="icon-button" onClick={actions.exitRound} aria-label={outlineAsset ? 'Exit outline quiz' : 'Exit quiz'}><Icon name="close" /></button><div className="quiz-header__center"><h1 tabIndex={-1}>{session.scope.label}</h1><div className="quiz-progress" role="progressbar" aria-label="Round progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}><i style={{ '--progress': pct / 100 } as React.CSSProperties} /></div></div><span className="quiz-count">{session.currentIndex + 1}<span>/</span>{session.questions.length}</span></header>
    <section className={`question-stage${outlineAsset ? ' outline-question-stage' : ''}`}><div className="question-meta"><strong>{play ? 'Play' : 'Learn'}</strong><span>{outlineAsset ? 'Which country is this?' : 'Choose the country'}</span></div>{play ? <LiveScore score={score} /> : null}<div className={outlineAsset ? 'outline-stage' : 'flag-stage'}>{outlineAsset && geometry ? <OutlineSilhouette geometry={geometry} className="outline-frame--stage" /> : <FlagImage country={target} revealed={learnFeedback} frameClass="flag-frame--stage" priority />}</div></section>
    <section className={`answer-panel ${answered ? 'answer-panel--answered' : ''}`} aria-label="Answer choices">
      {options.map((country, index) => {
        const selected = answeredCountryId === country.id;
        const correct = country.id === target.id;
        const continueFromCorrect = learnFeedback && selected && correct;
        const state = answered ? (correct ? 'answer-button--correct' : selected ? 'answer-button--wrong' : '') : '';
        const label = continueFromCorrect ? `${index + 1}. ${country.name}. Correct. ${last ? 'Show results.' : 'Continue to the next question.'}` : `${index + 1}. ${country.name}`;
        return <button className={`answer-button ${state}`} disabled={answered && !continueFromCorrect} data-autofocus={continueFromCorrect || (!answered && index === 0) ? '' : undefined} aria-label={label} onClick={() => continueFromCorrect ? actions.advance(domain) : domain === 'flags' ? actions.answerFlag(country.id) : actions.answerOutline(country.id)} key={country.id}><span className="answer-key" aria-hidden="true">{continueFromCorrect ? <Icon name="chevron" /> : index + 1}</span><strong>{country.name}{continueFromCorrect ? ` · ${last ? 'Results' : 'Next'}` : ''}</strong></button>;
      })}
      {answered ? play ? <AnswerFeedbackPanel feedback={answerFeedback(correctAnswer, target.name)} /> : <div className={`answer-feedback answer-feedback--${correctAnswer ? 'correct' : 'wrong'}`}><div className="feedback-copy"><strong>{correctAnswer ? 'Correct' : `Correct: ${target.name}`}</strong><span>{statusLabel(getRecord(progress, target.id))}</span></div>{correctAnswer ? null : <button className="button button--primary" onClick={() => actions.advance(domain)} data-autofocus>{last ? 'Results' : 'Next'}</button>}</div> : <KeyboardHint />}
    </section>
  </main>;
}

export function FlagsQuizScreen(props: { session: QuizSession; progress: ProgressState; answeredCountryId: string | null }) {
  return <RecognitionQuiz {...props} />;
}

export function OutlineQuizScreen(props: { asset: OutlineAsset; session: QuizSession; progress: ProgressState; answeredCountryId: string | null }) {
  return <RecognitionQuiz session={props.session} progress={props.progress} answeredCountryId={props.answeredCountryId} outlineAsset={props.asset} />;
}

export function RecognitionResultsScreen({ result, domain }: { result: SessionResult; domain: 'flags' | 'outlines' }) {
  const actions = useAtlasActions();
  const accuracy = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const play = result.session.mode === 'test';
  const perfect = play && result.missed.length === 0;
  // One word for how the round went, in Play only. Learn is not scored against
  // a bar, so ranking it would invent a judgement the mode does not make.
  const rank = play ? roundRank(result.correct, result.total) : null;
  const missed = result.missed.flatMap((attempt) => {
    const correct = COUNTRY_BY_ID.get(attempt.countryId);
    return correct ? [{ correct, selected: COUNTRY_BY_ID.get(attempt.selectedCountryId) }] : [];
  });
  const label = domain === 'flags' ? 'Flags' : 'Outlines';
  return <main className="page results-page">
    <header className="topbar topbar--detail results-header"><button className="icon-button" onClick={actions.exitRound} aria-label={exitRoundLabel(domain)}><Icon name="close" /></button><div className="screen-title"><h1 tabIndex={-1} data-autofocus>{result.session.scope.label}</h1><span>{label} · Round complete · {result.session.mode === 'learn' ? 'Learn' : 'Play'}</span></div></header>
    <section className={`result-score${perfect ? ' result-score--perfect' : ''}`} data-rank={rank?.id} aria-label={`${result.correct} of ${result.total} correct, ${accuracy} percent${rank ? `, ${rank.label}` : ''}`}><strong>{result.correct}<span>/{result.total}</span></strong><p>{rank ? <><strong className="result-rank">{rank.label}</strong> · </> : null}{accuracy}% correct</p>{perfect ? <span className="result-score__badge">Perfect round</span> : null}</section>
    {rank && !perfect ? <p className="result-rank-detail">{rank.detail}</p> : null}
    {missed.length ? <section className="result-section" aria-labelledby={`${domain}-review-heading`}><div className="list-heading"><h2 id={`${domain}-review-heading`}>Review</h2></div><div className="mistake-list">{missed.map(({ correct, selected }) => domain === 'flags' ? <div className="mistake-row" key={correct.id}><FlagImage country={correct} revealed frameClass="flag-frame--tiny" /><span><strong>{correct.name}</strong><small>{selected ? `You chose ${selected.name}` : 'Answered incorrectly'}</small></span></div> : <div className="outline-mistake-row" key={correct.id}><strong>{correct.name}</strong><small>{selected ? `You chose ${selected.name}` : 'Answered incorrectly'}</small></div>)}</div></section> : perfect ? null : <p className="clean-round"><strong>Clean round.</strong> No missed {domain === 'flags' ? 'flags' : 'outlines'}.</p>}
    <div className="result-actions">{missed.length ? <button className="button button--primary" onClick={() => actions.review(domain)}>Review mistakes</button> : null}<button className="button button--secondary" onClick={() => actions.repeat(domain)}>{repeatRoundLabel(result.session.mode)}</button><button className="button button--tertiary" onClick={actions.exitRound}>{exitRoundLabel(domain)}</button></div>
  </main>;
}
