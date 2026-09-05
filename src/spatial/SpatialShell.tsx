import { useEffect, useRef, type ReactNode } from 'react';
import type { EarnedAchievementState } from '../domain/achievements.js';
import type { ProgressLedgers } from '../domain/progress-summary.js';
import { SpatialCommand } from './SpatialCommand.js';
import { SpatialStage } from './SpatialStage.js';
import type { SpatialState } from './spatial-state.js';

/**
 * Issues #166 and #187 — layout for the production Spatial Atlas.
 *
 * For ordinary navigation the stage and its command surface ARE the screen. At
 * domain/continent/scope states geography takes the viewport and a compact band
 * of real controls sits beside/beneath the place it names. Home is the one
 * composition exception: the whole Earth owns the canvas and the same real-DOM
 * command surface is centred over it as the mode chooser. No conventional
 * launcher page renders underneath either composition.
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
  onSelectScope(scopeId: string): void;
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
  onSelectScope,
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
      <SpatialStage
        state={state}
        onSelectCountry={onSelectCountry}
        onSelectScope={onSelectScope}
        onUnavailable={onRendererUnavailable}
      />
      {state.navigation
        ? <SpatialCommand state={state} ledgers={ledgers} achievements={achievements} persisting={persisting} />
        : <div className="spatial-shell__panel" ref={panel}>{children}</div>}
    </div>
  );
}
