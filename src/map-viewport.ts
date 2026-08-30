interface MapViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MapViewportState {
  box: MapViewBox;
}

interface PointerPoint {
  x: number;
  y: number;
}

interface PointerGesture {
  pointers: Map<number, PointerPoint>;
  startBox?: MapViewBox;
  startDistance?: number;
  startMidpoint?: PointerPoint;
  dragStart?: PointerPoint;
  dragOriginBox?: MapViewBox;
  dragged: boolean;
}

const states = new Map<string, MapViewportState>();
const gestures = new WeakMap<HTMLElement, PointerGesture>();
const root = document.querySelector('#app');
const HIT_RADIUS_CSS_PX = 22;
const DEFAULT_MAX_ZOOM = 5.5;

function numericList(value: string | undefined, expected: number): number[] | null {
  if (!value) return null;
  const values = value.trim().split(/[ ,]+/).map(Number);
  if (values.length !== expected || values.some((item) => !Number.isFinite(item))) return null;
  return values;
}

function boxFromData(value: string | undefined): MapViewBox | null {
  const values = numericList(value, 4);
  if (!values) return null;
  const [x, y, width, height] = values;
  return width > 0 && height > 0 ? { x, y, width, height } : null;
}

function copyBox(box: MapViewBox): MapViewBox {
  return { ...box };
}

function viewportAspect(viewport: HTMLElement): number {
  return viewport.clientWidth > 0 && viewport.clientHeight > 0
    ? viewport.clientWidth / viewport.clientHeight
    : 1;
}

function fitBoundsToAspect(bounds: MapViewBox, aspect: number): MapViewBox {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const sourceAspect = bounds.width / bounds.height;
  if (sourceAspect > safeAspect) {
    const height = bounds.width / safeAspect;
    return {
      x: bounds.x,
      y: bounds.y - (height - bounds.height) / 2,
      width: bounds.width,
      height,
    };
  }
  const width = bounds.height * safeAspect;
  return {
    x: bounds.x - (width - bounds.width) / 2,
    y: bounds.y,
    width,
    height: bounds.height,
  };
}

function clampBox(box: MapViewBox, extent: MapViewBox): MapViewBox {
  const width = Math.min(box.width, extent.width);
  const height = Math.min(box.height, extent.height);
  const maxX = extent.x + extent.width - width;
  const maxY = extent.y + extent.height - height;
  return {
    x: Math.min(maxX, Math.max(extent.x, box.x)),
    y: Math.min(maxY, Math.max(extent.y, box.y)),
    width,
    height,
  };
}

function normalizeForAspect(box: MapViewBox, aspect: number, extent: MapViewBox): MapViewBox {
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  let width = box.width;
  let height = width / aspect;
  if (height > extent.height) {
    height = extent.height;
    width = height * aspect;
  }
  return clampBox({
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  }, extent);
}

function parseMaxZoom(viewport: HTMLElement): number {
  const value = Number(viewport.dataset.mapMaxZoom);
  return Number.isFinite(value) && value >= 1 ? value : DEFAULT_MAX_ZOOM;
}

function continentBox(viewport: HTMLElement): MapViewBox | null {
  const base = boxFromData(viewport.dataset.mapViewbox);
  return base ? fitBoundsToAspect(base, viewportAspect(viewport)) : null;
}

function regionBox(viewport: HTMLElement): MapViewBox | null {
  const focus = boxFromData(viewport.dataset.mapFocus);
  const continent = continentBox(viewport);
  if (!focus || !continent) return null;
  return clampBox(fitBoundsToAspect(focus, viewportAspect(viewport)), continent);
}

function svgFor(viewport: HTMLElement): SVGSVGElement | null {
  return viewport.querySelector<SVGSVGElement>('.map-svg');
}

function updateHitTargets(viewport: HTMLElement, box: MapViewBox): void {
  const svg = svgFor(viewport);
  if (!svg || viewport.clientWidth <= 0) return;
  const unitsPerCssPx = box.width / viewport.clientWidth;
  const radius = HIT_RADIUS_CSS_PX * unitsPerCssPx;
  svg.querySelectorAll<SVGCircleElement>('[data-map-hit]').forEach((circle) => {
    const minimum = Number(circle.dataset.mapHitMin);
    circle.setAttribute('r', String(Math.max(Number.isFinite(minimum) ? minimum : 0, radius)));
  });
}

function applyBox(viewport: HTMLElement, box: MapViewBox, remember = true): void {
  const svg = svgFor(viewport);
  const sessionId = viewport.dataset.mapSession;
  if (!svg || !sessionId) return;
  const extent = continentBox(viewport);
  if (!extent) return;
  const normalized = normalizeForAspect(box, viewportAspect(viewport), extent);
  svg.setAttribute('viewBox', `${normalized.x} ${normalized.y} ${normalized.width} ${normalized.height}`);
  updateHitTargets(viewport, normalized);
  if (remember) states.set(sessionId, { box: copyBox(normalized) });
}

function fitContinent(viewport: HTMLElement): void {
  const box = continentBox(viewport);
  if (box) applyBox(viewport, box);
}

function fitRegion(viewport: HTMLElement): void {
  const box = regionBox(viewport) ?? continentBox(viewport);
  if (box) applyBox(viewport, box);
}

function zoomAt(viewport: HTMLElement, factor: number, clientX?: number, clientY?: number): void {
  const svg = svgFor(viewport);
  const extent = continentBox(viewport);
  if (!svg || !extent || !Number.isFinite(factor) || factor <= 0) return;
  const current = boxFromData(svg.getAttribute('viewBox') ?? undefined) ?? extent;
  const maxZoom = parseMaxZoom(viewport);
  const minWidth = extent.width / maxZoom;
  const nextWidth = Math.max(minWidth, Math.min(extent.width, current.width / factor));
  const nextHeight = nextWidth / viewportAspect(viewport);
  const rect = viewport.getBoundingClientRect();
  const fractionX = clientX === undefined || rect.width <= 0 ? 0.5 : Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const fractionY = clientY === undefined || rect.height <= 0 ? 0.5 : Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
  const anchorX = current.x + fractionX * current.width;
  const anchorY = current.y + fractionY * current.height;
  applyBox(viewport, {
    x: anchorX - fractionX * nextWidth,
    y: anchorY - fractionY * nextHeight,
    width: nextWidth,
    height: nextHeight,
  });
}

function panBy(viewport: HTMLElement, dxCss: number, dyCss: number, origin?: MapViewBox): void {
  const svg = svgFor(viewport);
  const current = origin ?? (svg ? boxFromData(svg.getAttribute('viewBox') ?? undefined) : null);
  if (!current || viewport.clientWidth <= 0 || viewport.clientHeight <= 0) return;
  applyBox(viewport, {
    x: current.x - dxCss * (current.width / viewport.clientWidth),
    y: current.y - dyCss * (current.height / viewport.clientHeight),
    width: current.width,
    height: current.height,
  });
}

function pointerDistance(a: PointerPoint, b: PointerPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointerMidpoint(a: PointerPoint, b: PointerPoint): PointerPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function gestureFor(viewport: HTMLElement): PointerGesture {
  let gesture = gestures.get(viewport);
  if (!gesture) {
    gesture = { pointers: new Map(), dragged: false };
    gestures.set(viewport, gesture);
  }
  return gesture;
}

function currentBox(viewport: HTMLElement): MapViewBox | null {
  const svg = svgFor(viewport);
  return svg ? boxFromData(svg.getAttribute('viewBox') ?? undefined) : null;
}

function resetPinchStart(viewport: HTMLElement, gesture: PointerGesture): void {
  if (gesture.pointers.size < 2) {
    gesture.startDistance = undefined;
    gesture.startMidpoint = undefined;
    gesture.startBox = undefined;
    return;
  }
  const [a, b] = [...gesture.pointers.values()];
  gesture.startDistance = pointerDistance(a, b);
  gesture.startMidpoint = pointerMidpoint(a, b);
  gesture.startBox = currentBox(viewport) ?? continentBox(viewport) ?? undefined;
}

function handlePointerDown(event: PointerEvent): void {
  const viewport = (event.target as Element | null)?.closest<HTMLElement>('[data-map-viewport]');
  if (!viewport) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const gesture = gestureFor(viewport);
  gesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  gesture.dragged = false;
  if (gesture.pointers.size === 1) {
    gesture.dragStart = { x: event.clientX, y: event.clientY };
    gesture.dragOriginBox = currentBox(viewport) ?? continentBox(viewport) ?? undefined;
  } else {
    resetPinchStart(viewport, gesture);
    // A second pointer establishes a pinch. Capturing only once the
    // multi-pointer gesture exists preserves the original SVG target for taps.
    for (const pointerId of gesture.pointers.keys()) {
      try { viewport.setPointerCapture?.(pointerId); } catch { /* Pointer may already have ended. */ }
    }
  }
}

function handlePointerMove(event: PointerEvent): void {
  const viewport = (event.target as Element | null)?.closest<HTMLElement>('[data-map-viewport]');
  if (!viewport) return;
  const gesture = gestureFor(viewport);
  if (!gesture.pointers.has(event.pointerId)) return;
  gesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (gesture.pointers.size >= 2 && gesture.startDistance && gesture.startMidpoint && gesture.startBox) {
    const [a, b] = [...gesture.pointers.values()];
    const distance = pointerDistance(a, b);
    if (distance <= 0) return;
    const midpoint = pointerMidpoint(a, b);
    const scale = distance / gesture.startDistance;
    const start = gesture.startBox;
    const extent = continentBox(viewport);
    if (!extent) return;
    const maxZoom = parseMaxZoom(viewport);
    const nextWidth = Math.max(extent.width / maxZoom, Math.min(extent.width, start.width / scale));
    const nextHeight = nextWidth / viewportAspect(viewport);
    const rect = viewport.getBoundingClientRect();
    const fx = rect.width > 0 ? (gesture.startMidpoint.x - rect.left) / rect.width : 0.5;
    const fy = rect.height > 0 ? (gesture.startMidpoint.y - rect.top) / rect.height : 0.5;
    const anchorX = start.x + fx * start.width;
    const anchorY = start.y + fy * start.height;
    const translateX = rect.width > 0 ? (midpoint.x - gesture.startMidpoint.x) * (nextWidth / rect.width) : 0;
    const translateY = rect.height > 0 ? (midpoint.y - gesture.startMidpoint.y) * (nextHeight / rect.height) : 0;
    applyBox(viewport, {
      x: anchorX - fx * nextWidth - translateX,
      y: anchorY - fy * nextHeight - translateY,
      width: nextWidth,
      height: nextHeight,
    });
    gesture.dragged = true;
    event.preventDefault();
    return;
  }

  if (gesture.pointers.size === 1 && gesture.dragStart && gesture.dragOriginBox) {
    const dx = event.clientX - gesture.dragStart.x;
    const dy = event.clientY - gesture.dragStart.y;
    if (!gesture.dragged && Math.hypot(dx, dy) > 4) {
      gesture.dragged = true;
      // Capture only after movement crosses the established drag threshold so
      // taps and slight movement retain normal delegated answer semantics.
      try { viewport.setPointerCapture?.(event.pointerId); } catch { /* Pointer may already have ended. */ }
    }
    if (gesture.dragged) {
      panBy(viewport, dx, dy, gesture.dragOriginBox);
      event.preventDefault();
    }
  }
}

function handlePointerEnd(event: PointerEvent): void {
  const viewport = (event.target as Element | null)?.closest<HTMLElement>('[data-map-viewport]');
  if (!viewport) return;
  const gesture = gestureFor(viewport);
  gesture.pointers.delete(event.pointerId);
  if (gesture.pointers.size === 1) {
    const [remaining] = [...gesture.pointers.values()];
    gesture.dragStart = remaining;
    gesture.dragOriginBox = currentBox(viewport) ?? undefined;
  } else {
    gesture.dragStart = undefined;
    gesture.dragOriginBox = undefined;
  }
  resetPinchStart(viewport, gesture);
}

function handleWheel(event: WheelEvent): void {
  const viewport = (event.target as Element | null)?.closest<HTMLElement>('[data-map-viewport]');
  if (!viewport) return;
  // Preserve browser/page zoom accessibility. Ctrl/meta modified wheel is never captured.
  if (event.ctrlKey || event.metaKey) return;
  const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 18 : event.deltaY;
  const factor = Math.exp(-delta * 0.0015);
  zoomAt(viewport, factor, event.clientX, event.clientY);
  event.preventDefault();
}

function handleCommand(event: Event): void {
  const button = (event.target as Element | null)?.closest<HTMLElement>('[data-map-command]');
  if (!button) return;
  const frame = button.closest<HTMLElement>('.map-stage__frame');
  const viewport = frame?.querySelector<HTMLElement>('[data-map-viewport]');
  if (!viewport) return;
  switch (button.dataset.mapCommand) {
    case 'zoom-in':
      zoomAt(viewport, 1.45);
      break;
    case 'zoom-out':
      zoomAt(viewport, 1 / 1.45);
      break;
    case 'fit-region':
      fitRegion(viewport);
      break;
    case 'fit-continent':
      fitContinent(viewport);
      break;
  }
}

function suppressDraggedClick(event: MouseEvent): void {
  const viewport = (event.target as Element | null)?.closest<HTMLElement>('[data-map-viewport]');
  if (!viewport) return;
  const gesture = gestureFor(viewport);
  if (!gesture.dragged) return;
  event.preventDefault();
  event.stopPropagation();
  gesture.dragged = false;
}

function positionViewport(viewport: HTMLElement): void {
  const sessionId = viewport.dataset.mapSession;
  if (!sessionId || viewport.dataset.mapPositioned === 'true') return;
  requestAnimationFrame(() => {
    // A viewport that is not laid out yet has no aspect. `viewportAspect` falls
    // back to 1:1, the opening frame is computed against that square, and
    // `applyBox` then REMEMBERS it — after which the resize path faithfully
    // re-applies the wrong frame at the real aspect instead of correcting it,
    // leaving the continent cropped. React can hand this observer a subtree it
    // has built but not yet attached, so whether the opening frame is right is
    // otherwise decided by mutation timing. Wait for a real box.
    if (viewport.clientWidth <= 0 || viewport.clientHeight <= 0) return;
    viewport.dataset.mapPositioned = 'true';
    const saved = states.get(sessionId);
    if (saved) {
      applyBox(viewport, saved.box, false);
      return;
    }
    fitRegion(viewport);
  });
}

let resizeObserver: ResizeObserver | null = null;

function discoverViewports(): void {
  const viewports = root ? [...root.querySelectorAll<HTMLElement>('[data-map-viewport]')] : [];
  for (const viewport of viewports) positionViewport(viewport);
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const viewport = entry.target as HTMLElement;
        // Gaining a size is the signal a deferred opening frame was waiting for.
        if (viewport.dataset.mapPositioned !== 'true') { positionViewport(viewport); continue; }
        const box = currentBox(viewport);
        if (box) applyBox(viewport, box);
      }
    });
    for (const viewport of viewports) resizeObserver.observe(viewport);
  }
}

document.addEventListener('pointerdown', handlePointerDown);
document.addEventListener('pointermove', handlePointerMove, { passive: false });
document.addEventListener('pointerup', handlePointerEnd);
document.addEventListener('pointercancel', handlePointerEnd);
document.addEventListener('wheel', handleWheel, { passive: false });
document.addEventListener('click', suppressDraggedClick, true);
document.addEventListener('click', handleCommand);

if (root) {
  new MutationObserver(discoverViewports).observe(root, { childList: true, subtree: true });
  discoverViewports();
}
