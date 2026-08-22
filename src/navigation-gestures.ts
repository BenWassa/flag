import type { AppRoute } from './routing/routes.js';

export interface NavigationGestureOptions {
  getParentRoute: () => AppRoute | null;
  onBack: () => void;
}

interface SwipeStart {
  pointerId: number;
  x: number;
  y: number;
}

const EDGE_GUTTER_PX = 28;
const SWIPE_DISTANCE_PX = 72;
const MAX_VERTICAL_DRIFT_PX = 48;

export function installNavigationGestures(options: NavigationGestureOptions): () => void {
  let start: SwipeStart | null = null;

  function handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' || event.button !== 0 || event.clientX > EDGE_GUTTER_PX) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('[data-map-viewport], button, a, input, textarea, select, [contenteditable="true"]')) return;
    start = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function handlePointerMove(event: PointerEvent): void {
    if (!start || event.pointerId !== start.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = Math.abs(event.clientY - start.y);
    if (dy > MAX_VERTICAL_DRIFT_PX || dx < SWIPE_DISTANCE_PX) return;
    event.preventDefault();
    start = null;
    if (options.getParentRoute() !== null) options.onBack();
  }

  function clear(event: PointerEvent): void {
    if (start?.pointerId === event.pointerId) start = null;
  }

  document.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('pointermove', handlePointerMove, { passive: false });
  document.addEventListener('pointerup', clear);
  document.addEventListener('pointercancel', clear);

  return () => {
    document.removeEventListener('pointerdown', handlePointerDown);
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', clear);
    document.removeEventListener('pointercancel', clear);
  };
}