/**
 * Issue #197 — the names written on the Earth, as real controls.
 *
 * These are ordinary DOM buttons in an ordinary `nav`, positioned over the
 * canvas from a geographic anchor. They are deliberately NOT text baked into the
 * WebGL scene: baked text cannot be focused, cannot be read by a screen reader,
 * cannot inherit the platform's font scaling and cannot take a touch target
 * larger than its glyphs. Every one of them dispatches the same scope action a
 * tap on the geography does.
 *
 * The layer owns placement only. Which scopes exist at this level is decided by
 * `deriveSpatialState`, where each anchor sits is decided by canonical geometry,
 * and what a selection means is decided by the router.
 *
 * Positioning is written as custom properties rather than as a computed
 * `transform`, so centring stays a CSS declaration and the layer owns only where
 * a name is, never how it looks.
 *
 * Issue #198 makes these controls the normal Spatial scope chooser. Forced
 * colours is the one place they cannot exist: the canvas is hidden there because
 * it cannot follow a replaced palette, and the command surface mounts an
 * isolated ordinary-DOM fallback list instead. Full renderer failure uses the
 * conventional Launcher.
 */

import { DRAG_THRESHOLD_PX } from './gestures.js';
import type { ProjectedPoint } from './renderer/globe-scene.js';
import type { ScopeStatus } from './spatial-state.js';

export interface ScopeLabelTarget {
  /** Routable scope id, exactly as the DOM control and a geography tap use. */
  scopeId: string;
  /** The visible name. */
  label: string;
  /** The accessible name, which also carries earned state in words. */
  name: string;
  status?: ScopeStatus;
  current: boolean;
  available: boolean;
  anchor: readonly [number, number];
}

export interface ScopeLabelLayerOptions {
  onSelect(scopeId: string): void;
  /**
   * A label the learner reached by keyboard is round the back of the planet.
   * Bringing its geography into view is a camera nudge, exactly like a drag —
   * never a route change.
   */
  onReveal(lon: number, lat: number): void;
  project(lon: number, lat: number): ProjectedPoint;
}

export interface ScopeLabelLayer {
  /** Replaces the labelled scopes. An empty list retires the layer entirely. */
  set(groupName: string | null, targets: readonly ScopeLabelTarget[]): void;
  /** Re-projects the current labels. Called whenever the camera or stage moves. */
  reposition(): void;
  destroy(): void;
}

/** A shape as well as a colour, matching the selected-scope earned-state mark. */
const statusMark = (status: ScopeStatus) => (status === 'complete' ? '◆' : '●');

/** Breathing room between two names, and between a name and the stage edge. */
const LABEL_GAP_PX = 6;
const EDGE_PAD_PX = 6;

interface Placed {
  entry: Entry;
  x: number;
  y: number;
  halfWidth: number;
  halfHeight: number;
}

interface Entry {
  target: ScopeLabelTarget;
  button: HTMLButtonElement;
  halfWidth: number;
  halfHeight: number;
  facing: boolean;
}

export function createScopeLabelLayer(
  container: HTMLElement,
  options: ScopeLabelLayerOptions,
): ScopeLabelLayer {
  const root = document.createElement('nav');
  root.className = 'spatial-scopes';
  root.hidden = true;
  container.appendChild(root);

  let entries: Entry[] = [];
  let press: { x: number; y: number } | null = null;
  /** Label sizes only change when the layer or the stage width does. */
  let measuredWidth = -1;

  const onPointerDown = (event: PointerEvent) => { press = { x: event.clientX, y: event.clientY }; };
  root.addEventListener('pointerdown', onPointerDown);

  const onClick = (event: MouseEvent) => {
    const button = (event.target as Element | null)?.closest?.('button');
    if (!button) return;
    const entry = entries.find((item) => item.button === button);
    if (!entry) return;
    // `detail` is 0 for a keyboard activation, which can never be a drag. A
    // pointer activation that travelled past the drag threshold was the learner
    // rotating the globe with their finger on a name, not choosing it.
    if (event.detail > 0 && press
      && Math.hypot(event.clientX - press.x, event.clientY - press.y) > DRAG_THRESHOLD_PX) return;
    options.onSelect(entry.target.scopeId);
  };
  root.addEventListener('click', onClick);

  const onFocusIn = (event: FocusEvent) => {
    const entry = entries.find((item) => item.button === event.target);
    if (!entry || entry.facing) return;
    options.onReveal(entry.target.anchor[0], entry.target.anchor[1]);
  };
  root.addEventListener('focusin', onFocusIn);

  function measure(entry: Entry) {
    entry.halfWidth = entry.button.offsetWidth / 2;
    entry.halfHeight = entry.button.offsetHeight / 2;
  }

  function reposition() {
    if (!entries.length) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    if (width !== measuredWidth) {
      measuredWidth = width;
      for (const entry of entries) measure(entry);
    }

    const placed: Placed[] = [];
    // The framed scope is placed first, so it is the one name that never moves
    // to make room for another.
    const order = [...entries].sort((a, b) => Number(b.target.current) - Number(a.target.current));

    for (const entry of order) {
      const point = options.project(entry.target.anchor[0], entry.target.anchor[1]);
      // A name is drawn only where the place it names actually is. Parking one
      // that projects past the edge against the frame would write it over
      // geography it does not belong to, which is worse than not writing it.
      const onStage = point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height;
      entry.facing = point.facing && onStage;
      entry.button.dataset.facing = entry.facing ? 'front' : 'back';
      if (!entry.facing) {
        // Still a real control: keyboard users reach the rest of the planet and
        // the camera turns to meet them. It simply has nothing to point at on
        // screen, so it is parked rather than placed.
        entry.button.style.setProperty('--spatial-scope-x', '50%');
        entry.button.style.setProperty('--spatial-scope-y', '50%');
        continue;
      }

      const overlaps = (x: number, y: number) => placed.some((other) => (
        Math.abs(x - other.x) < entry.halfWidth + other.halfWidth + LABEL_GAP_PX
        && Math.abs(y - other.y) < entry.halfHeight + other.halfHeight + LABEL_GAP_PX
      ));
      const clampX = (value: number) =>
        Math.min(Math.max(value, entry.halfWidth + EDGE_PAD_PX), width - entry.halfWidth - EDGE_PAD_PX);
      const clampY = (value: number) =>
        Math.min(Math.max(value, entry.halfHeight + EDGE_PAD_PX), height - entry.halfHeight - EDGE_PAD_PX);

      const x = clampX(point.x);
      let y = clampY(point.y);
      // Names separate vertically. Moving one sideways would slide it along a
      // coastline and imply the wrong geography; a few pixels up or down keeps
      // it over the same place.
      for (let pass = 0; pass < 2 && overlaps(x, y); pass += 1) {
        for (const other of placed) {
          if (Math.abs(x - other.x) >= entry.halfWidth + other.halfWidth + LABEL_GAP_PX) continue;
          if (Math.abs(y - other.y) >= entry.halfHeight + other.halfHeight + LABEL_GAP_PX) continue;
          const push = entry.halfHeight + other.halfHeight + LABEL_GAP_PX;
          y = clampY(y < other.y ? other.y - push : other.y + push);
        }
      }
      if (overlaps(x, y)) {
        // A small stage cannot hold every name legibly, and two names written
        // over each other name nothing. The ones that cannot be placed stand
        // down rather than crowding the geography. They remain focusable and
        // selectable; keyboard focus turns the Earth to meet the chosen scope.
        entry.facing = false;
        entry.button.dataset.facing = 'back';
        continue;
      }
      placed.push({ entry, x, y, halfWidth: entry.halfWidth, halfHeight: entry.halfHeight });
      entry.button.style.setProperty('--spatial-scope-x', `${Math.round(x)}px`);
      entry.button.style.setProperty('--spatial-scope-y', `${Math.round(y)}px`);
    }
  }

  return {
    set(groupName, targets) {
      root.hidden = targets.length === 0;
      if (groupName) root.setAttribute('aria-label', groupName);
      else root.removeAttribute('aria-label');

      const existing = new Map(entries.map((entry) => [entry.target.scopeId, entry]));
      const next: Entry[] = [];
      for (const target of targets) {
        let entry = existing.get(target.scopeId);
        if (entry) existing.delete(target.scopeId);
        else {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'spatial-scope';
          const name = document.createElement('span');
          name.className = 'spatial-scope__name';
          const mark = document.createElement('span');
          mark.className = 'spatial-scope__mark';
          mark.setAttribute('aria-hidden', 'true');
          button.append(name, mark);
          root.appendChild(button);
          entry = { target, button, halfWidth: 0, halfHeight: 0, facing: false };
        }
        entry.target = target;
        const button = entry.button;
        button.dataset.scopeId = target.scopeId;
        button.disabled = !target.available;
        button.setAttribute('aria-label', target.name);
        if (target.current) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
        if (target.status) button.dataset.status = target.status;
        else delete button.dataset.status;
        const name = button.firstElementChild as HTMLElement;
        const mark = button.lastElementChild as HTMLElement;
        name.textContent = target.label;
        mark.textContent = target.status ? statusMark(target.status) : '';
        next.push(entry);
      }
      for (const stale of existing.values()) stale.button.remove();
      // One forced layout per navigation, never per frame: the sizes cannot
      // change while only the camera is moving.
      measuredWidth = -1;
      reposition();
    },

    reposition() {
      reposition();
    },

    destroy() {
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('click', onClick);
      root.removeEventListener('focusin', onFocusIn);
      root.remove();
      entries = [];
    },
  };
}
