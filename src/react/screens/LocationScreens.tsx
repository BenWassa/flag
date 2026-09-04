import { COUNTRY_BY_ID } from '../../data/countries.js';
import { getMapContinentConfigForScope } from '../../data/map-scopes.js';
import { currentMapTarget } from '../../domain/map-game.js';
import type { MapRegionAsset, MapSession, MapSessionResult } from '../../domain/map-models.js';
import { answerFeedback, roundRank, roundScore } from '../../domain/round-feedback.js';
import { renderMapSvg } from '../../ui/components/map.js';
import { exitRoundLabel, repeatRoundLabel } from '../../ui/format.js';
import { useAtlasActions } from '../actions.js';
import { Icon } from '../components/Icon.js';
import { AnswerFeedbackPanel, LiveScore } from '../components/RoundFeedback.js';

function MapMarkup({ asset, session, interactive, showFeedback, lastWrongCountryId, labelledBy }: {
  asset: MapRegionAsset;
  session: MapSession;
  interactive: boolean;
  showFeedback: boolean;
  lastWrongCountryId?: string | null;
  labelledBy: string;
}) {
  const actions = useAtlasActions();
  return <div
    className="map-stage__surface"
    onClick={(event) => {
      if (!interactive) return;
      const element = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-action="map-answer"]') : null;
      if (element?.dataset.id) actions.answerLocation(element.dataset.id, element);
    }}
    onKeyDown={(event) => {
      if (!interactive || (event.key !== 'Enter' && event.key !== ' ')) return;
      const element = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-action="map-answer"]') : null;
      if (!element?.dataset.id) return;
      event.preventDefault();
      actions.answerLocation(element.dataset.id, element);
    }}
    dangerouslySetInnerHTML={{ __html: renderMapSvg(asset, session, { interactive, showFeedback, lastWrongCountryId, labelledBy }) }}
  />;
}

function visibleFeedback(session: MapSession, resolution: MapSession['targets'][string]['resolution'], misses: number, continent: string, wrong?: string) {
  if (session.mode === 'test') return { text: session.currentIndex === 0 ? `One tap each · pinch or wheel to zoom · swipe or drag to pan ${continent} · results at the end.` : 'Tap one country.', className: '' };
  if (resolution === 'first-try') return { text: 'Correct · first try', className: 'map-prompt__status--correct' };
  if (resolution === 'one-miss') return { text: 'Correct · after 1 miss', className: 'map-prompt__status--correct' };
  if (resolution === 'two-miss') return { text: 'Correct · after 2 misses', className: 'map-prompt__status--correct' };
  if (resolution === 'revealed') return { text: 'Revealed after 3 misses — look at the location before the next country.', className: 'map-prompt__status--reveal' };
  if (misses > 0) {
    const left = Math.max(0, 3 - misses);
    return { text: `${wrong ? `Not ${wrong}. ` : 'Not there. '}Try again · ${left} ${left === 1 ? 'try' : 'tries'} before reveal`, className: 'map-prompt__status--wrong' };
  }
  return { text: session.currentIndex === 0 ? `Tap the country · pinch to zoom · swipe or drag to pan ${continent}.` : 'Tap the country on the map.', className: '' };
}

export function LocationQuizScreen({ asset, session, lastWrongCountryId }: { asset: MapRegionAsset; session: MapSession; lastWrongCountryId: string | null }) {
  const actions = useAtlasActions();
  const targetId = currentMapTarget(session);
  const target = targetId ? COUNTRY_BY_ID.get(targetId) : undefined;
  if (!targetId || !target) return <main className="page"><h1 tabIndex={-1} data-autofocus>Map round unavailable</h1><button className="button" onClick={actions.exitRound}>Back</button></main>;
  const state = session.targets[targetId];
  const continent = session.scope.id ? getMapContinentConfigForScope(session.scope.id)?.scope.label ?? session.scope.label : session.scope.label;
  const lastAttempt = session.attempts.at(-1);
  const lastLearnWrong = session.mode === 'learn' && lastAttempt?.targetCountryId === targetId && !lastAttempt.correct
    ? COUNTRY_BY_ID.get(lastAttempt.selectedCountryId)?.name
    : undefined;
  const feedback = visibleFeedback(session, state?.resolution, state?.misses ?? 0, continent, lastLearnWrong);
  const currentPlayAttempt = session.mode === 'test' && state?.resolved && lastAttempt?.targetCountryId === targetId && lastAttempt.resolved ? lastAttempt : undefined;
  const mapLabel = session.scope.kind === 'continent' ? `${continent} country map` : `${continent} map with ${session.scope.label} active`;
  return <main className="page page--map-quiz">
    <header className="map-quiz-topbar"><button className="icon-button" onClick={actions.exitRound} aria-label="Exit map round"><Icon name="close" /></button><div className="map-quiz-topbar__title"><strong>{session.scope.label}</strong><span className="map-quiz-topbar__meta">{session.mode === 'learn' ? 'Learn' : 'Play'} locations</span></div><span className="map-round-count">{session.currentIndex + 1} / {session.countryIds.length}</span></header>
    <section className="map-prompt" aria-labelledby="map-prompt-heading"><p className="map-prompt__kicker">Find</p><h1 id="map-prompt-heading" tabIndex={-1} data-autofocus>{target.name}</h1>{session.mode === 'test' ? <LiveScore score={roundScore(session.attempts, session.countryIds.length)} /> : null}{currentPlayAttempt ? <AnswerFeedbackPanel feedback={answerFeedback(currentPlayAttempt.correct, target.name)} /> : <p className={`map-prompt__status ${feedback.className}`}>{feedback.text}</p>}</section>
    <section className="map-stage" aria-label={mapLabel}><MapMarkup asset={asset} session={session} interactive showFeedback={session.mode === 'learn'} lastWrongCountryId={session.mode === 'learn' ? lastWrongCountryId : null} labelledBy="map-prompt-heading" /></section>
  </main>;
}

export function LocationResultsScreen({ asset, result }: { asset: MapRegionAsset; result: MapSessionResult }) {
  const actions = useAtlasActions();
  const states = result.session.countryIds.map((id) => result.session.targets[id]);
  const counts = { one: states.filter((s) => s?.resolution === 'one-miss').length, two: states.filter((s) => s?.resolution === 'two-miss').length, revealed: states.filter((s) => s?.resolution === 'revealed').length, incorrect: states.filter((s) => s?.resolution === 'incorrect').length };
  const play = result.session.mode === 'test';
  const perfect = play && result.missedCountryIds.length === 0;
  // Locations scores a Play round on first-try recall, so that is what the word
  // has to describe. Learn keeps its miss breakdown and takes no rank, and a
  // perfect round takes none either: the Perfect round badge already is the
  // word for that one, and the summary would otherwise say it three times.
  const rank = play && !perfect ? roundRank(result.firstTryCorrect, result.total) : null;
  return <main className="page page--map-results">
    <header className="topbar topbar--detail"><button className="icon-button" onClick={actions.exitRound} aria-label={exitRoundLabel('locations')}><Icon name="back" /></button><div className="screen-title"><h1 id="map-result-heading" tabIndex={-1} data-autofocus>Round complete</h1><span>Locations · {result.session.scope.label} · {result.session.mode === 'learn' ? 'Learn' : 'Play'}</span></div></header>
    <section className={`map-result-summary${perfect ? ' map-result-summary--perfect' : ''}`} aria-labelledby="map-result-heading"><h1>{result.firstTryCorrect} of {result.total} first try</h1>{rank ? <p className="result-rank-line" data-rank={rank.id}><strong className="result-rank">{rank.label}</strong> · {rank.detail}</p> : null}<p>{result.missedCountryIds.length === 0 ? 'Clean round. Every location was right immediately.' : `${result.missedCountryIds.length} ${result.missedCountryIds.length === 1 ? 'location needs' : 'locations need'} another pass.`}</p>{perfect ? <span className="result-score__badge">Perfect round</span> : null}<div className="map-result-breakdown" aria-label={`${result.session.mode === 'learn' ? 'Learn' : 'Play'} round breakdown`}>{result.session.mode === 'learn' ? <><span><i className="map-swatch map-swatch--first" aria-hidden="true" /><strong>{result.firstTryCorrect}</strong> first try</span><span><i className="map-swatch map-swatch--one" aria-hidden="true" /><strong>{counts.one}</strong> 1 miss</span><span><i className="map-swatch map-swatch--two" aria-hidden="true" /><strong>{counts.two}</strong> 2 misses</span><span><i className="map-swatch map-swatch--reveal" aria-hidden="true" /><strong>{counts.revealed}</strong> revealed</span></> : <><span><strong>{result.firstTryCorrect}</strong> correct</span><span><strong>{counts.incorrect}</strong> missed</span></>}</div></section>
    <section className="map-stage map-stage--results" aria-label={`Completed ${result.session.scope.label} map`}><MapMarkup asset={asset} session={result.session} interactive={false} showFeedback labelledBy="map-result-heading" /></section>
    <div className="map-results-actions">{result.missedCountryIds.length ? <button className="button button--primary" onClick={() => actions.review('locations')}>Review mistakes</button> : null}<button className="button button--secondary" onClick={() => actions.repeat('locations')}>{repeatRoundLabel(result.session.mode)}</button><button className="button button--tertiary" onClick={actions.exitRound}>{exitRoundLabel('locations')}</button></div>
  </main>;
}
