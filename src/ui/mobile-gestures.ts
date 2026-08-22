export interface MobileGestureOptions {
  onBack: () => void;
  root?: HTMLElement;
}

const EDGE_THRESHOLD_PX = 24;
const SWIPE_THRESHOLD_PX = 72;

/**
 * Installs Atlas mobile navigation gestures.
 *
 * The gesture intentionally stays conservative:
 * - only begins from a screen edge;
 * - ignores interactive controls;
 * - ignores map surfaces that own pinch/pan gestures;
 * - delegates navigation to the existing router history.
 */
export function installMobileGestures({ onBack, root = document.body }: MobileGestureOptions): () => void {
  let startX: number | null = null;
  let startY = 0;
  let tracking = false;

  const shouldIgnore = (target: EventTarget | null): boolean => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('button, a, input, textarea, select, [contenteditable="true"], [data-map-surface]'));
  };

  const onTouchStart = (event: TouchEvent): void => {
    const touch = event.touches[0];
    if (!touch || shouldIgnore(event.target)) return;

    if (touch.clientX <= EDGE_THRESHOLD_PX) {
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
    }
  };

  const onTouchEnd = (event: TouchEvent): void => {
    if (!tracking || startX === null) return;

    const touch = event.changedTouches[0];
    tracking = false;

    if (!touch) return;

    const deltaX = touch.clientX - startX;
    const deltaY = Math.abs(touch.clientY - startY);

    if (deltaX >= SWIPE_THRESHOLD_PX && deltaY < SWIPE_THRESHOLD_PX) {
      onBack();
    }

    startX = null;
  };

  root.addEventListener('touchstart', onTouchStart, { passive: true });
  root.addEventListener('touchend', onTouchEnd, { passive: true });

  return () => {
    root.removeEventListener('touchstart', onTouchStart);
    root.removeEventListener('touchend', onTouchEnd);
  };
}
