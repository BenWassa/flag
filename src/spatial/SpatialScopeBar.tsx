import { CONTINENTS } from '../data/continents.js';
import { useAtlasActions } from '../react/actions.js';
import { selectableRegionScopes, type SpatialState } from './spatial-state.js';
import { isContinentId } from './scope-geography.js';

/**
 * Issue #119 — the DOM twin of the globe's selection.
 *
 * Tapping geography inside a continent selects that country's region. The
 * conventional launcher offers no control that does the same thing: its region
 * rows START A ROUND. Without this bar the globe would own an action no keyboard
 * or screen-reader user could reach, which the accessibility contract forbids.
 *
 * It is deliberately the only control the spatial shell adds. Continent
 * selection already has a DOM equivalent — the domain index lists every
 * continent — so the bar appears at continent and region focus only, and it
 * navigates through exactly the action a geography tap dispatches.
 */
export function SpatialScopeBar({ state }: { state: SpatialState }) {
  const actions = useAtlasActions();
  const scope = state.framedScope;
  if (state.mode !== 'focus' || !state.domain || !scope) return null;

  const continentId = scope.kind === 'continent' && isContinentId(scope.id)
    ? scope.id
    : CONTINENTS.find((continent) => selectableRegionScopes(continent.id, state.domain!)
      .some((region) => region.id === scope.id))?.id;
  if (!continentId) return null;

  const continent = CONTINENTS.find((item) => item.id === continentId);
  if (!continent) return null;
  const regions = selectableRegionScopes(continentId, state.domain);

  return (
    <nav className="spatial-scopes" aria-label={`Areas of ${continent.name}`}>
      <button
        className="spatial-scopes__item"
        type="button"
        aria-current={scope.id === continentId ? 'true' : undefined}
        onClick={() => actions.openScope(state.domain!, continentId)}
      >All {continent.name}</button>
      {regions.map((region) => (
        <button
          className="spatial-scopes__item"
          type="button"
          key={region.id}
          aria-current={scope.id === region.id ? 'true' : undefined}
          onClick={() => region.id && actions.openScope(state.domain!, region.id)}
        >{region.label}</button>
      ))}
    </nav>
  );
}
