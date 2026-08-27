import { COUNTRIES, COUNTRY_BY_ID } from '../../data/countries.js';
import { NEIGHBOR_GUESS_COUNTRY_IDS } from '../../data/neighbors/index.js';
import { domainDisplayName } from '../../domain/display.js';
import { currentNeighborTarget, getCountrySuggestions, NO_LAND_NEIGHBORS_ID, NO_LAND_NEIGHBORS_LABEL } from '../../domain/neighbor-game.js';
import type { NeighborGuessOutcome, NeighborSession, NeighborSessionResult } from '../../domain/neighbor-models.js';
import { exitRoundLabel, repeatRoundLabel } from '../../ui/format.js';
import { useAtlasActions } from '../actions.js';
import { Icon } from '../components/Icon.js';

const ALLOWED = new Set(NEIGHBOR_GUESS_COUNTRY_IDS);
const countryName = (id: string) => id === NO_LAND_NEIGHBORS_ID ? NO_LAND_NEIGHBORS_LABEL : COUNTRY_BY_ID.get(id)?.name ?? id;

function Feedback({ outcome }: { outcome: NeighborGuessOutcome | null }) {
  if (!outcome) return null;
  if (outcome.kind === 'duplicate') return <p className="neighbor-feedback">Already guessed. No attempt used.</p>;
  if (outcome.kind === 'correct') return <p className="neighbor-feedback neighbor-feedback--correct">Correct: {countryName(outcome.selectedCountryId)}.</p>;
  if (outcome.selectedCountryId === NO_LAND_NEIGHBORS_ID) return <p className="neighbor-feedback neighbor-feedback--wrong">This country does have land neighbours.</p>;
  return <p className="neighbor-feedback neighbor-feedback--wrong">{countryName(outcome.selectedCountryId)} is not in this neighbour set.</p>;
}

export function NeighborQuizScreen({ session, lastOutcome, query }: { session: NeighborSession; lastOutcome: NeighborGuessOutcome | null; query: string }) {
  const actions = useAtlasActions();
  const target = currentNeighborTarget(session);
  if (!target) return <main className="page"><p>No neighbour target is active.</p></main>;
  const remaining = Math.max(0, target.attemptBudget - target.guessedIds.length);
  const progress = target.neighborIds.length === 0 ? 0 : target.foundIds.length / target.neighborIds.length;
  const suggestions = query.trim() ? getCountrySuggestions(COUNTRIES, ALLOWED, query, new Set([...target.guessedIds, target.countryId]), 8) : [];
  const unresolved = target.neighborIds.filter((id) => !target.foundIds.includes(id));
  const mapKey = `${session.id}:${target.countryId}`;
  return <main className="page neighbor-quiz-page">
    <header className="topbar topbar--detail neighbor-quiz-header"><button className="icon-button" onClick={actions.exitRound} aria-label="Exit neighbour round"><Icon name="close" /></button><div className="screen-title"><h1 tabIndex={-1}>{COUNTRY_BY_ID.get(target.countryId)?.name ?? target.countryId}</h1><span>{session.mode === 'learn' ? 'Learn' : 'Play'} · {session.scope.label} · {session.currentIndex + 1}/{session.countryIds.length}</span></div></header>
    <section className="neighbor-task" aria-labelledby="neighbor-prompt">
      <div className="neighbor-status-line"><div><h2 id="neighbor-prompt">Name every land-border neighbour</h2><p>{target.resolved ? target.neighborIds.length === 0 ? <strong>{NO_LAND_NEIGHBORS_LABEL}</strong> : <><strong>{target.foundIds.length} of {target.neighborIds.length}</strong> neighbours found</> : <><strong>{target.foundIds.length}</strong> neighbours found</>}</p></div><div className="neighbor-attempts" aria-label={`${remaining} attempts remaining`}><strong>{remaining}</strong><span>attempts left</span></div></div>
      <div className="neighbor-progress" aria-hidden="true"><span style={{ transform: `scaleX(${Math.max(0, Math.min(1, progress))})` }} /></div>
      <div key={mapKey} className="neighbor-map-host" data-neighbor-map-host data-neighbor-map-key={mapKey} data-scope-id={session.scope.id ?? ''} data-target-id={target.countryId} data-found-ids={target.foundIds.join(',')} data-revealed-ids={target.revealedIds.join(',')}><p className="neighbor-map-loading">Loading geographic context…</p></div>
      {target.resolved ? <div className="neighbor-resolution" data-autofocus tabIndex={-1}><strong>{target.resolution === 'complete' ? target.wrongGuesses === 0 ? 'Complete — clean set' : 'Complete' : 'Attempts exhausted'}</strong>{target.neighborIds.length === 0 ? <p>{NO_LAND_NEIGHBORS_LABEL}. This country borders no other country by land.</p> : unresolved.length ? <p>Remaining: {unresolved.map(countryName).join(', ')}</p> : <p>Every land neighbour found.</p>}<button className="button button--primary" onClick={() => actions.advance('neighbors')}>Next</button></div> : <form className="neighbor-entry" autoComplete="off" onSubmit={(event) => { event.preventDefault(); actions.submitNeighborQuery(); }}><label htmlFor="neighbor-country-input">Country</label><div className="neighbor-input-row"><input id="neighbor-country-input" data-autofocus name="country" type="search" value={query} placeholder="Type a country name" autoComplete="off" autoCapitalize="words" spellCheck={false} enterKeyHint="go" aria-autocomplete="list" aria-controls="neighbor-suggestions" onChange={(event) => actions.setNeighborQuery(event.currentTarget.value)} /><button className="button button--primary" type="submit">Submit</button></div><div id="neighbor-suggestions" className="neighbor-suggestions" role="listbox" aria-label="Country suggestions">{query.trim() && !suggestions.length ? <p className="neighbor-suggestions__empty">No matching country.</p> : suggestions.map((country) => <button type="button" role="option" className="neighbor-suggestion" onClick={() => actions.submitNeighbor(country.id)} key={country.id}><span>{country.name}</span>{country.aliases?.length ? <small>{country.aliases[0]}</small> : null}</button>)}</div><button className="button button--secondary neighbor-none" type="button" onClick={() => actions.submitNeighbor(NO_LAND_NEIGHBORS_ID)}>{NO_LAND_NEIGHBORS_LABEL}</button></form>}
      <Feedback outcome={lastOutcome} />
    </section>
  </main>;
}

export function NeighborResultsScreen({ result }: { result: NeighborSessionResult }) {
  const actions = useAtlasActions();
  const perfect = result.session.mode === 'test' && result.missedCountryIds.length === 0;
  const missed = result.missedCountryIds.map(countryName);
  return <main className="page">
    <header className="topbar topbar--detail"><button className="icon-button" onClick={actions.exitRound} aria-label={exitRoundLabel('neighbors')}><Icon name="close" /></button><div className="screen-title"><h1 tabIndex={-1} data-autofocus>Round complete</h1><span>{domainDisplayName('neighbors')} · {result.session.scope.label}</span></div></header>
    <section className={`scope-overview neighbor-results-summary${perfect ? ' result-score--perfect' : ''}`}><div className="overview-heading"><div><h1>{result.cleanCompletions}/{result.total} clean</h1><p>{result.completed} completed · {result.exhausted} exhausted</p></div></div><p>A clean completion means every neighbour was found with no wrong guesses.</p>{perfect ? <span className="result-score__badge">Perfect round</span> : null}</section>
    {missed.length ? <section className="atlas-section" aria-labelledby="neighbor-review-heading"><div className="list-heading"><h2 id="neighbor-review-heading">Review</h2></div><p>{missed.join(', ')}</p><button className="button button--primary" onClick={() => actions.review('neighbors')}>Review these countries</button></section> : null}
    <div className="result-actions"><button className="button button--secondary" onClick={() => actions.repeat('neighbors')}>{repeatRoundLabel(result.session.mode)}</button><button className="button button--tertiary" onClick={actions.exitRound}>{exitRoundLabel('neighbors')}</button></div>
  </main>;
}
