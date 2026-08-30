import { useEffect, useRef, useState } from 'react';
import type { SpatialState } from './spatial-state.js';
import type { StageController } from './stage-controller.js';

/**
 * Issue #119 — React host for the persistent globe.
 *
 * React owns mounting and the accessible DOM around the stage. It does not own
 * the scene graph, the camera or the frame loop: `createStageController` does,
 * and this component only pushes the derived `SpatialState` into it. The whole
 * spatial stack — Three.js, the scene, the world geography — sits behind the
 * dynamic import below, so a learner whose device cannot run it never downloads
 * it and falls back to the conventional presentation.
 */

export interface SpatialStageProps {
  state: SpatialState;
  onSelectCountry(countryId: string): void;
  /** Renderer could not start. The shell falls back to conventional presentation. */
  onUnavailable(): void;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function SpatialStage({ state, onSelectCountry, onUnavailable }: SpatialStageProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const controller = useRef<StageController | null>(null);
  const latest = useRef(state);
  const select = useRef(onSelectCountry);
  const [ready, setReady] = useState(false);

  // Declared before the boot effect so both refs are current by the time it
  // runs, without writing to a ref during render.
  useEffect(() => { latest.current = state; select.current = onSelectCountry; });

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let cancelled = false;

    void (async () => {
      try {
        const { createStageController } = await import('./stage-controller.js');
        if (cancelled) return;
        const instance = await createStageController(host, {
          onSelectCountry: (countryId) => select.current(countryId),
          prefersReducedMotion,
        });
        // The dynamic import can resolve after an unmount, and a controller
        // created for a detached host would leak a GL context.
        if (cancelled) { instance.destroy(); return; }
        controller.current = instance;
        instance.apply(latest.current);
        setReady(true);
      } catch {
        if (!cancelled) onUnavailable();
      }
    })();

    return () => {
      cancelled = true;
      controller.current?.destroy();
      controller.current = null;
    };
    // Boot once. `onUnavailable` is stable for the life of the shell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { controller.current?.apply(state); }, [state]);

  return (
    <div className="spatial-stage" data-mode={state.mode} data-ready={ready ? 'true' : undefined}>
      <div className="spatial-stage__surface" ref={container} />
      {/* The geography's own description. Every action it offers is a real
          control in the command surface below, so this describes rather than
          instructs, and it takes no visible space away from the globe. */}
      {state.description
        ? <p className="spatial-stage__caption visually-hidden">{state.description}</p>
        : null}
    </div>
  );
}
