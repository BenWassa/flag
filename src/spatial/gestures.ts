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
 * and a globe that swallows it would break system navigation.
 */

export interface GestureHandlers {
  onTap(clientX: number, clientY: number): void;
  onRotate(deltaLonDeg: number, deltaLatDeg: number): void;
  onDolly(factor: number): void;
}

/** Matches the platform back-gesture gutter the production launcher already reserves. */
export const EDGE_GUTTER_PX = 28;
const TAP_SLOP_PX = 10;

export function installGestures(stage: HTMLElement, handlers: GestureHandlers): () => void {
  const points = new Map<number, { x: number; y: number }>();
  let moved = 0;
  let pinchStart = 0;
  let ignore = false;

  const spread = () => {
    const [a, b] = [...points.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (points.size === 0) {
      const rect = stage.getBoundingClientRect();
      ignore = event.clientX - rect.left < EDGE_GUTTER_PX || rect.right - event.clientX < EDGE_GUTTER_PX;
      moved = 0;
    }
    if (ignore) return;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (points.size === 2) pinchStart = spread();
    stage.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (ignore) return;
    const previous = points.get(event.pointerId);
    if (!previous) return;
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (points.size === 2 && pinchStart > 0) {
      const next = spread();
      if (next > 0) { handlers.onDolly(pinchStart / next); pinchStart = next; }
      return;
    }
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    moved += Math.hypot(dx, dy);
    // Degrees per pixel scales with the stage so the globe tracks the thumb at
    // any size rather than feeling geared.
    const perPixel = 180 / Math.max(stage.clientWidth, 1);
    handlers.onRotate(dx * perPixel, dy * perPixel);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (ignore) { if (points.size <= 1) ignore = false; return; }
    const had = points.size;
    points.delete(event.pointerId);
    if (points.size < 2) pinchStart = 0;
    if (had === 1 && moved < TAP_SLOP_PX) handlers.onTap(event.clientX, event.clientY);
  };

  const onPointerCancel = (event: PointerEvent) => {
    points.delete(event.pointerId);
    pinchStart = 0;
    if (points.size === 0) ignore = false;
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
