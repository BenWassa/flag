interface MapPanPosition {
  left: number;
  top: number;
}

const positions = new Map<string, MapPanPosition>();
const root = document.querySelector('#app');

function numericList(value: string | undefined, expected: number): number[] | null {
  if (!value) return null;
  const values = value.trim().split(/[ ,]+/).map(Number);
  if (values.length !== expected || values.some((item) => !Number.isFinite(item))) return null;
  return values;
}

function remember(viewport: HTMLElement): void {
  const sessionId = viewport.dataset.mapSession;
  if (!sessionId) return;
  positions.set(sessionId, { left: viewport.scrollLeft, top: viewport.scrollTop });

  // Map rounds are short-lived; keep only a small recent set.
  if (positions.size > 8) {
    const oldest = positions.keys().next().value as string | undefined;
    if (oldest) positions.delete(oldest);
  }
}

function positionViewport(viewport: HTMLElement): void {
  const sessionId = viewport.dataset.mapSession;
  if (!sessionId || viewport.dataset.mapPositioned === 'true') return;
  viewport.dataset.mapPositioned = 'true';

  requestAnimationFrame(() => {
    const saved = positions.get(sessionId);
    if (saved) {
      viewport.scrollLeft = saved.left;
      viewport.scrollTop = saved.top;
      return;
    }

    const svg = viewport.querySelector<SVGSVGElement>('.map-svg');
    const viewBox = numericList(viewport.dataset.mapViewbox, 4);
    const focus = numericList(viewport.dataset.mapFocus, 4);
    if (!svg || !viewBox || !focus) return;

    const [viewX, viewY, viewWidth] = viewBox;
    const [focusX, focusY, focusWidth, focusHeight] = focus;
    if (!viewWidth || viewWidth <= 0) return;

    const renderedWidth = svg.getBoundingClientRect().width;
    const scale = renderedWidth / viewWidth;
    const centerX = (focusX + focusWidth / 2 - viewX) * scale;
    const centerY = (focusY + focusHeight / 2 - viewY) * scale;

    viewport.scrollLeft = Math.max(0, centerX - viewport.clientWidth / 2);
    viewport.scrollTop = Math.max(0, centerY - viewport.clientHeight / 2);
    remember(viewport);
  });
}

function discoverViewports(): void {
  root?.querySelectorAll<HTMLElement>('[data-map-viewport]').forEach(positionViewport);
}

document.addEventListener('scroll', (event) => {
  const viewport = event.target instanceof HTMLElement && event.target.matches('[data-map-viewport]')
    ? event.target
    : null;
  if (viewport) remember(viewport);
}, true);

if (root) {
  new MutationObserver(discoverViewports).observe(root, { childList: true, subtree: true });
  discoverViewports();
}
