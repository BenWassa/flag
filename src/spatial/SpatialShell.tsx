import { useEffect, useRef, type ReactNode } from 'react';
import type { EarnedAchievementState } from '../domain/achievements.js';
import type { ProgressLedgers } from '../domain/progress-summary.js';
import { SpatialCommand } from './SpatialCommand.js';
import { SpatialStage } from './SpatialStage.js';
import type { SpatialState } from './spatial-state.js';

/**
 * Issue #166 — layout for the production Spatial Atlas.
 *
 * For ordinary navigation the stage and its command surface ARE the screen:
 * geography takes the viewport and a compact band of real controls sits beneath
 * the place it names. No conventional launcher page renders underneath, which
 * is what the #119 preview did and what made it read as a globe stacked on top
 * of the old application.
 *
 * The panel returns whenever an activity or a results screen owns the content,
 * so the existing domain-native screens are untouched, and in `yielded` mode the
 * shell collapses to a plain block so viewport-sized quiz layouts behave exactly
 * as they do without the stage. The conventional presentation therefore remains
 * intact as the renderer-failure fallback.
 */

export interface SpatialShellProps {
  state: SpatialState;
  /** Changes whenever the durable screen changes; resets the panel's scroll. */
  contentKey: string;
  ledgers: ProgressLedgers;
  achievements: EarnedAchievementState;
  persisting: boolean;
  onSelectCountry(countryId: string): void;
  onRendererUnavailable(): void;
  children: ReactNode;
}

export function SpatialShell({
  state,
  contentKey,
  ledgers,
  achievements,
  persisting,
  onSelectCountry,
  onRendererUnavailable,
  children,
}: SpatialShellProps) {
  const panel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // The panel is its own scroll container while the stage is mounted, so the
    // shell has to do what `window.scrollTo` does for the conventional shell.
    panel.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [contentKey]);

  return (
    <div className="spatial-shell" data-mode={state.mode} data-surface={state.navigation ?? undefined}>
      <SpatialStage state={state} onSelectCountry={onSelectCountry} onUnavailable={onRendererUnavailable} />
      {state.navigation
        ? <SpatialCommand state={state} ledgers={ledgers} achievements={achievements} persisting={persisting} />
        : <div className="spatial-shell__panel" ref={panel}>{children}</div>}
    </div>
  );
}
