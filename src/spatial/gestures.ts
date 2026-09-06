/**
 * Issue #119 — gesture ownership on the spatial stage (F1).
 *
 *   one-finger drag  rotate the Earth
 *   tap              select geography
 *   two-finger pinch dolly
 *   wheel            dolly (pointer devices)
 *
 * `touch-action: none` is scoped to the stage element in CSS, never to the
 * document, so page scrolling outside the stage and the platform edge-back
 * gesture both keep working. A drag that STARTS inside the edge gutter is left
 * entirely to the browser: Android and iOS both begin their back gesture there,
 * and a globe that captures or rotates it would break system navigation.
 *
 * A stationary edge tap is different: #200 requires a visible tiny-country
 * marker to remain selectable even when framing places its practical envelope
 * inside that reserved gutter. We therefore track edge presses without capture
 * or rotation. Movement past the drag threshold is ceded to the browser; a
 * completed stationary tap still resolves where the learner pressed.
 *
 * POINTER OWNERSHIP (#166) follows the contract #22 established for the
 * projected 2D map, for the same reason it was established there — a tap on a
 * small target must not be retargeted by the gesture layer:
 *
 *   - no pointer capture on an initial single `pointerdown`; capture is taken
 *     only once movement crosses the drag threshold, and immediately for the
 *     multi-pointer pinch;
 *   - the globe does not move at all below the threshold, so a resting finger
 *     cannot rotate the geography out from under itself;
 *   - crossing the threshold is sticky: a drag never later resolves as a tap;
 *   - a tap reports the position of the POINTERDOWN, which is where the learner
 *     aimed, not the position of the release, which a finger roll has moved.
 *
 * Before this, every `pointermove` rotated the camera and a tap resolved at the
 * release point, so the few pixels of jitter present in any real phone tap
 * rotated the target away and then picked the displaced position — which is how
 * a microstate stayed unselectable no matter how large its hit area was.
 */

export interface GestureHandlers {
  onTap(clientX: number, clientY: number): void;
  onRotate(deltaLonDeg: number, deltaLatDeg: number): void;
  onDolly(factor: number): void;
}

/** Matches the platform back-gesture gutter the production launcher already reserves. */
export const EDGE_GUTTER_PX = 28;

/**
 * Movement that turns a press into a drag.
 *
 * The 2D map uses 4 px, where the browser still synthesises its own `click` on
 * the SVG target. Here the gesture layer synthesises the tap itself, so this
 * single value also stands in for the platform's tap slop; 8 px sits inside the
 * range browsers use for that and keeps a tap unambiguous, while starting
 * rotation 4 px later than the 2D map is imperceptible.
 */
export const DRAG_THRESHOLD_PX = 8;

export function installGestures(stage: HTMLElement, handlers: GestureHandlers): () => void {
  const points = new Map<number, { x: number; y: number }>();
  /** Where the press began, for the drag threshold and for the tap position. */
  let origin: { x: number; y: number } | null = null;
  let dragging = false;
  let pinchStart = 0;
  /** Edge-origin gestures never capture or manipulate the globe. */
  let edgeOwned = false;

  const spread = () => {
    const [a, b] = [...points.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  const capture = (pointerId: number) => {
    try { stage.setPointerCapture(pointerId); } catch { /* Pointer may already have ended. */ }
  };

  const onPointerDown = (event: PointerEvent) => {
    if (points.size === 0) {
      const rect = stage.getBoundingClientRect();
      edgeOwned = event.clientX - rect.left < EDGE_GUTTER_PX || rect.right - event.clientX < EDGE_GUTTER_PX;
      origin = { x: event.clientX, y: event.clientY };
      dragging = false;
    }
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (edgeOwned) {
      // A second pointer can never resolve as an edge tap. It still remains
      // entirely uncaptured/unhandled so the platform owns the gesture.
      if (points.size > 1) dragging = true;
      return;
    }
    if (points.size === 2) {
      pinchStart = spread();
      // A second pointer establishes a pinch, which owns the gesture outright
      // and can never be a tap.
      dragging = true;
      for (const pointerId of points.keys()) capture(pointerId);
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    const previous = points.get(event.pointerId);
    if (!previous) return;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (edgeOwned) {
      // Preserve the OS/browser edge gesture. We only need to know whether the
      // press stopped being a tap; no capture, rotation or dolly is allowed.
      if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > DRAG_THRESHOLD_PX) dragging = true;
      return;
    }

    if (points.size === 2 && pinchStart > 0) {
      const next = spread();
      if (next > 0) { handlers.onDolly(pinchStart / next); pinchStart = next; }
      return;
    }
    if (points.size !== 1 || !origin) return;

    if (!dragging) {
      if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) <= DRAG_THRESHOLD_PX) return;
      dragging = true;
      // Capture only now, so a press that stays a tap keeps ordinary delegated
      // semantics. The threshold itself is absorbed rather than applied, so the
      // globe does not jump the moment a drag is recognised.
      capture(event.pointerId);
      return;
    }

    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    // Degrees per pixel scales with the stage so the globe tracks the thumb at
    // any size rather than feeling geared.
    const perPixel = 180 / Math.max(stage.clientWidth, 1);
    handlers.onRotate(dx * perPixel, dy * perPixel);
  };

  const onPointerUp = (event: PointerEvent) => {
    const had = points.size;
    points.delete(event.pointerId);
    if (points.size < 2) pinchStart = 0;

    if (edgeOwned) {
      if (had === 1 && !dragging && origin) handlers.onTap(origin.x, origin.y);
      if (points.size === 0) { edgeOwned = false; origin = null; dragging = false; }
      return;
    }

    // The press never became a drag, so it was aimed: report where it started.
    if (had === 1 && !dragging && origin) handlers.onTap(origin.x, origin.y);
    if (points.size === 0) { origin = null; dragging = false; }
  };

  const onPointerCancel = (event: PointerEvent) => {
    points.delete(event.pointerId);
    pinchStart = 0;
    if (points.size === 0) { edgeOwned = false; origin = null; dragging = false; }
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    handlers.onDolly(event.deltaY > 0 ? 1.08 : 1 / 1.08);
  };

  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', onPointerCancel);
  stage.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    stage.removeEventListener('pointerdown', onPointerDown);
    stage.removeEventListener('pointermove', onPointerMove);
    stage.removeEventListener('pointerup', onPointerUp);
    stage.removeEventListener('pointercancel', onPointerCancel);
    stage.removeEventListener('wheel', onWheel);
  };
}