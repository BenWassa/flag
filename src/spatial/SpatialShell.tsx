import { useEffect, useRef, type ReactNode } from 'react';
import { SpatialScopeBar } from './SpatialScopeBar.js';
import { SpatialStage } from './SpatialStage.js';
import type { SpatialState } from './spatial-state.js';

/**
 * Issue #119 — layout for the spatial candidate.
 *
 * The stage is a fixed band of the viewport and the conventional Atlas screen
 * renders underneath it, unchanged. That is the whole integration: no screen was
 * rewritten to live "inside" the globe, so the conventional presentation remains
 * intact as the renderer-failure fallback and every existing interaction,
 * stylesheet and test keeps working.
 *
 * In `yielded` mode the shell collapses to a plain block and the document scrolls
 * exactly as production does today, so activity layouts that size themselves
 * against the viewport are untouched.
 */

export interface SpatialShellProps {
  state: SpatialState;
  /** Changes whenever the durable screen changes; resets the panel's scroll. */
  contentKey: string;
  onSelectCountry(countryId: string): void;
  onRendererUnavailable(): void;
  children: ReactNode;
}

function classicAtlasHref(): string {
  const hash = typeof window === 'undefined' ? '#/' : window.location.hash || '#/';
  return `../${hash}`;
}

export function SpatialShell({ state, contentKey, onSelectCountry, onRendererUnavailable, children }: SpatialShellProps) {
  const panel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // The panel is its own scroll container while the stage is mounted, so the
    // shell has to do what `window.scrollTo` does for the conventional shell.
    panel.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [contentKey]);

  return <>
    <div className="spatial-preview-switch" role="status" aria-label="Spatial Atlas preview">
      <span>Spatial preview</span>
      <a href={classicAtlasHref()} aria-label="Return to classic Atlas">Classic Atlas</a>
    </div>
    <div className="spatial-shell" data-mode={state.mode}>
      <SpatialStage state={state} onSelectCountry={onSelectCountry} onUnavailable={onRendererUnavailable}>
        <SpatialScopeBar state={state} />
      </SpatialStage>
      <div className="spatial-shell__panel" ref={panel}>{children}</div>
    </div>
  </>;
}
