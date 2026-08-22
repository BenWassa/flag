import type { AppRoute } from './routing/routes.js';

export interface NavigationGestureOptions {
  getParentRoute: () => AppRoute | null;
  onBack: () => void;
}

interface SwipeStart {
  identifier: number;
  x: number;
  y: number;
  claimed: boolean;
}

const EDGE_GUTTER_PX = 28;
const SWIPE_DISTANCE_PX = 72;
const MAX_VERTICAL_DRIFT_PX = 48;
const CLAIM_DISTANCE_PX = 12;

const OWNED_BY_OTHERS =
  '[data-map-viewport], button, a, input, textarea, select, summary, label, [contenteditable="true"], [role="button"], [role="slider"], [role="textbox"]';

function ownsHorizontalPanning(target: Element): boolean {
  for (let node: Element | null = target; node && node !== document.body; node = node.parentElement) {
    if (!(node instanceof HTMLElement)) continue;
    if (node.scrollWidth <= node.clientWidth) continue;
    const overflowX = getComputedStyle(node).overflowX;
    if (overflowX === 'auto' || overflowX === 'scroll') return true;
  }
  return false;
}

export function installNavigationGestures(options: NavigationGestureOptions): () => void {
  let start: SwipeStart | null = null;

  function handleTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) {
      start = null;
      return;
    }
    const touch = event.touches[0];
    if (!touch || touch.clientX > EDGE_GUTTER_PX) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(OWNED_BY_OTHERS)) return;
    if (target && ownsHorizontalPanning(target)) return;
    start = { identifier: touch.identifier, x: touch.clientX, y: touch.clientY, claimed: false };
  }

  function handleTouchMove(event: TouchEvent): void {
    if (!start) return;
    if (event.touches.length !== 1) {
      start = null;
      return;
    }
    const touch = event.touches[0];
    if (!touch || touch.identifier !== start.identifier) return;

    const dx = touch.clientX - start.x;
    const dy = Math.abs(touch.clientY - start.y);

    // Vertical drift or a leftward reversal hands the gesture back for good:
    // re-arming on a later frame would let a scroll that wanders sideways
    // navigate away mid-scroll.
    if (dy > MAX_VERTICAL_DRIFT_PX || dx < 0) {
      start = null;
      return;
    }

    // Claiming the gesture as soon as horizontal intent is unambiguous is what
    // keeps it alive: without preventDefault the browser decides the drag is a
    // scroll, fires touchcancel, and the swipe never reaches its threshold.
    // Vertical scrolling is untouched because drift above disarms first.
    if (!start.claimed && dx > CLAIM_DISTANCE_PX && dx > dy) start.claimed = true;
    if (start.claimed && event.cancelable) event.preventDefault();

    if (dx < SWIPE_DISTANCE_PX || dx <= dy) return;
    start = null;
    if (options.getParentRoute() !== null) options.onBack();
  }

  function clear(): void {
    start = null;
  }

  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', clear);
  document.addEventListener('touchcancel', clear);

  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', clear);
    document.removeEventListener('touchcancel', clear);
  };
}
