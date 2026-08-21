import type { MapCountryGeometry, MapRegionAsset, MapViewportFocus } from './map-models.js';

export type NeighborMapVisualState = 'target' | 'unresolved' | 'solved' | 'revealed';

export interface NeighborMapRoundState {
  targetId: string;
  neighborIds: readonly string[];
  foundIds: readonly string[];
  revealedIds: readonly string[];
}

export interface NeighborMapBounds extends MapViewportFocus {}

export interface NeighborMapLabel {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  width: number;
  height: number;
  placement: 'inside' | 'callout';
  anchorX?: number;
  anchorY?: number;
}

export interface NeighborMapCountry {
  countryId: string;
  name?: string;
  path: string;
  geometry: MapCountryGeometry;
  state: NeighborMapVisualState;
  label: NeighborMapLabel;
}

export interface NeighborMapModel {
  targetId: string;
  targetName: string;
  focus: NeighborMapBounds;
  puzzleCountries: NeighborMapCountry[];
  contextCountries: Array<{ countryId: string; path: string }>;
  foundNames: string[];
  revealedNames: string[];
  unresolvedCount: number;
}

interface Point { x: number; y: number }
interface PathMetrics {
  bounds: NeighborMapBounds;
  rings: Point[][];
  interior: Point;
}
interface LabelBox { x: number; y: number; width: number; height: number }

const metricsCache = new Map<string, PathMetrics>();
const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

export function canonicalCountryPolygonPath(geometry: MapCountryGeometry): string | null {
  return geometry.outlinePath ?? geometry.path ?? null;
}

function parseViewBox(value: string): NeighborMapBounds {
  const numbers = value.trim().split(/[ ,]+/).map(Number);
  if (numbers.length !== 4 || numbers.some((item) => !Number.isFinite(item))) {
    throw new Error(`Invalid map viewBox: ${value}`);
  }
  const [x, y, width, height] = numbers;
  if (width <= 0 || height <= 0) throw new Error(`Invalid map viewBox extent: ${value}`);
  return { x, y, width, height };
}

function numbersFrom(value: string): number[] {
  return [...value.matchAll(NUMBER)].map((match) => Number(match[0]));
}

function ringsFromPath(path: string): Point[][] {
  const rings: Point[][] = [];
  for (const match of path.matchAll(/M([^Z]+)Z/gi)) {
    const numbers = numbersFrom(match[1] ?? '');
    const ring: Point[] = [];
    for (let index = 0; index + 1 < numbers.length; index += 2) {
      ring.push({ x: numbers[index], y: numbers[index + 1] });
    }
    if (ring.length >= 3) rings.push(ring);
  }
  if (rings.length) return rings;

  const numbers = numbersFrom(path);
  const fallback: Point[] = [];
  for (let index = 0; index + 1 < numbers.length; index += 2) {
    fallback.push({ x: numbers[index], y: numbers[index + 1] });
  }
  return fallback.length >= 3 ? [fallback] : [];
}

export function geometryBounds(path: string): NeighborMapBounds {
  const cached = metricsCache.get(path);
  if (cached) return { ...cached.bounds };
  const numbers = numbersFrom(path);
  if (numbers.length < 4) throw new Error('Country polygon has no measurable coordinates.');
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let index = 0; index + 1 < numbers.length; index += 2) {
    const x = numbers[index];
    const y = numbers[index + 1];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function ringArea(ring: readonly Point[]): number {
  let area = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const current = ring[index];
    const next = ring[(index + 1) % ring.length];
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
}

function ringCentroid(ring: readonly Point[]): Point {
  let crossSum = 0;
  let xSum = 0;
  let ySum = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const current = ring[index];
    const next = ring[(index + 1) % ring.length];
    const cross = current.x * next.y - next.x * current.y;
    crossSum += cross;
    xSum += (current.x + next.x) * cross;
    ySum += (current.y + next.y) * cross;
  }
  if (Math.abs(crossSum) < 1e-9) {
    const bounds = boundsForPoints(ring);
    return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  }
  return { x: xSum / (3 * crossSum), y: ySum / (3 * crossSum) };
}

function boundsForPoints(points: readonly Point[]): NeighborMapBounds {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function pointInRing(point: Point, ring: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i];
    const b = ring[j];
    const crosses = (a.y > point.y) !== (b.y > point.y)
      && point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || Number.EPSILON) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointInPath(point: Point, rings: readonly Point[][]): boolean {
  let inside = false;
  for (const ring of rings) if (pointInRing(point, ring)) inside = !inside;
  return inside;
}

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

function distanceToPath(point: Point, rings: readonly Point[][]): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (const ring of rings) {
    for (let index = 0; index < ring.length; index += 1) {
      minimum = Math.min(minimum, distanceToSegment(point, ring[index], ring[(index + 1) % ring.length]));
    }
  }
  return minimum;
}

function deriveInteriorPoint(_path: string, bounds: NeighborMapBounds, rings: Point[][]): Point {
  const largest = [...rings].sort((left, right) => Math.abs(ringArea(right)) - Math.abs(ringArea(left)))[0];
  if (largest) {
    const centroid = ringCentroid(largest);
    if (pointInPath(centroid, rings) && distanceToPath(centroid, rings) >= 1.5) return centroid;
  }

  let best: Point = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  let bestDistance = pointInPath(best, rings) ? distanceToPath(best, rings) : -1;
  const divisions = 12;
  for (let row = 0; row <= divisions; row += 1) {
    for (let column = 0; column <= divisions; column += 1) {
      const point = {
        x: bounds.x + ((column + 0.5) / (divisions + 1)) * bounds.width,
        y: bounds.y + ((row + 0.5) / (divisions + 1)) * bounds.height,
      };
      if (!pointInPath(point, rings)) continue;
      const distance = distanceToPath(point, rings);
      if (distance > bestDistance) {
        best = point;
        bestDistance = distance;
      }
    }
  }

  let step = Math.max(bounds.width, bounds.height) / 12;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    for (const dx of [-step, 0, step]) {
      for (const dy of [-step, 0, step]) {
        const point = { x: best.x + dx, y: best.y + dy };
        if (!pointInPath(point, rings)) continue;
        const distance = distanceToPath(point, rings);
        if (distance > bestDistance) {
          best = point;
          bestDistance = distance;
        }
      }
    }
    step /= 2;
  }
  return best;
}

function pathMetrics(path: string): PathMetrics {
  const cached = metricsCache.get(path);
  if (cached) return cached;
  const bounds = geometryBounds(path);
  const rings = ringsFromPath(path);
  const interior = rings.length
    ? deriveInteriorPoint(path, bounds, rings)
    : { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  const metrics = { bounds, rings, interior };
  metricsCache.set(path, metrics);
  return metrics;
}

function unionBounds(bounds: readonly NeighborMapBounds[]): NeighborMapBounds {
  if (!bounds.length) throw new Error('Cannot fit an empty neighbour cluster.');
  const minX = Math.min(...bounds.map((item) => item.x));
  const minY = Math.min(...bounds.map((item) => item.y));
  const maxX = Math.max(...bounds.map((item) => item.x + item.width));
  const maxY = Math.max(...bounds.map((item) => item.y + item.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function clampBounds(bounds: NeighborMapBounds, extent: NeighborMapBounds): NeighborMapBounds {
  const x = Math.max(extent.x, bounds.x);
  const y = Math.max(extent.y, bounds.y);
  const right = Math.min(extent.x + extent.width, bounds.x + bounds.width);
  const bottom = Math.min(extent.y + extent.height, bounds.y + bounds.height);
  return { x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) };
}

function expandBounds(bounds: NeighborMapBounds, factor: number, extent: NeighborMapBounds): NeighborMapBounds {
  const padX = bounds.width * factor;
  const padY = bounds.height * factor;
  return clampBounds({
    x: bounds.x - padX,
    y: bounds.y - padY,
    width: bounds.width + padX * 2,
    height: bounds.height + padY * 2,
  }, extent);
}

export function calculateNeighborClusterBounds(
  asset: MapRegionAsset,
  targetId: string,
  neighborIds: readonly string[],
): NeighborMapBounds {
  const ids = [targetId, ...neighborIds];
  const geometryById = new Map(
    [...asset.countries, ...(asset.contextCountries ?? [])].map((geometry) => [geometry.countryId, geometry]),
  );
  const bounds = ids.map((countryId) => {
    const geometry = geometryById.get(countryId);
    const path = geometry ? canonicalCountryPolygonPath(geometry) : null;
    if (!geometry || !path) throw new Error(`Canonical production polygon missing for ${countryId}.`);
    return pathMetrics(path).bounds;
  });
  const cluster = unionBounds(bounds);
  const extent = parseViewBox(asset.viewBox);
  const dominant = Math.max(cluster.width, cluster.height);
  const pad = Math.min(42, Math.max(14, dominant * 0.11));
  return clampBounds({
    x: cluster.x - pad,
    y: cluster.y - pad,
    width: cluster.width + pad * 2,
    height: cluster.height + pad * 2,
  }, extent);
}

export function boundsContain(outer: NeighborMapBounds, inner: NeighborMapBounds, epsilon = 0.25): boolean {
  return inner.x >= outer.x - epsilon
    && inner.y >= outer.y - epsilon
    && inner.x + inner.width <= outer.x + outer.width + epsilon
    && inner.y + inner.height <= outer.y + outer.height + epsilon;
}

function boundsIntersect(left: NeighborMapBounds, right: NeighborMapBounds): boolean {
  return left.x <= right.x + right.width
    && left.x + left.width >= right.x
    && left.y <= right.y + right.height
    && left.y + left.height >= right.y;
}

function labelBox(x: number, y: number, width: number, height: number): LabelBox {
  return { x: x - width / 2, y: y - height / 2, width, height };
}

function boxesOverlap(left: LabelBox, right: LabelBox, padding = 2.5): boolean {
  return left.x < right.x + right.width + padding
    && left.x + left.width + padding > right.x
    && left.y < right.y + right.height + padding
    && left.y + left.height + padding > right.y;
}

function overlapArea(left: LabelBox, right: LabelBox): number {
  const width = Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x));
  const height = Math.max(0, Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y));
  return width * height;
}

function boxInsideBounds(box: LabelBox, bounds: NeighborMapBounds): boolean {
  return box.x >= bounds.x
    && box.y >= bounds.y
    && box.x + box.width <= bounds.x + bounds.width
    && box.y + box.height <= bounds.y + bounds.height;
}

function boxFitsPath(box: LabelBox, metrics: PathMetrics): boolean {
  if (!metrics.rings.length) return false;
  const points = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x, y: box.y + box.height },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  ];
  return points.every((point) => pointInPath(point, metrics.rings));
}

function labelDimensions(text: string, fontSize: number): { width: number; height: number } {
  if (text === '?') return { width: fontSize * 1.45, height: fontSize * 1.55 };
  return {
    width: Math.max(fontSize * 3.2, text.length * fontSize * 0.57),
    height: fontSize * 1.45,
  };
}

function candidatePositions(origin: Point, width: number, height: number): Point[] {
  const dx = width / 2 + 8;
  const dy = height / 2 + 7;
  return [
    { x: origin.x + dx, y: origin.y },
    { x: origin.x - dx, y: origin.y },
    { x: origin.x, y: origin.y - dy },
    { x: origin.x, y: origin.y + dy },
    { x: origin.x + dx, y: origin.y - dy },
    { x: origin.x - dx, y: origin.y - dy },
    { x: origin.x + dx, y: origin.y + dy },
    { x: origin.x - dx, y: origin.y + dy },
    { x: origin.x + dx * 1.45, y: origin.y },
    { x: origin.x - dx * 1.45, y: origin.y },
  ];
}

function placeLabel(
  text: string,
  geometry: MapCountryGeometry,
  path: string,
  state: NeighborMapVisualState,
  focus: NeighborMapBounds,
  occupied: LabelBox[],
): NeighborMapLabel {
  const metrics = pathMetrics(path);
  const baseFont = Math.max(5.8, Math.min(10, focus.width / 40));
  const fontSize = text === '?' ? Math.min(14, baseFont * 1.42) : baseFont;
  const { width, height } = labelDimensions(text, fontSize);
  const interior = metrics.interior;
  const insideBox = labelBox(interior.x, interior.y, width, height);
  const insideAllowed = state === 'unresolved' || boxFitsPath(insideBox, metrics);
  const establishedCallout = Boolean(geometry.callout);
  if (!establishedCallout && insideAllowed && !occupied.some((box) => boxesOverlap(insideBox, box))) {
    occupied.push(insideBox);
    return { text, x: interior.x, y: interior.y, fontSize, width, height, placement: 'inside' };
  }

  const preferred = geometry.callout
    ? [{ x: geometry.callout.target.cx, y: geometry.callout.target.cy }]
    : [];
  const candidates = [...preferred, ...candidatePositions(interior, width, height)];
  let best: { point: Point; box: LabelBox; score: number } | null = null;
  for (let index = 0; index < candidates.length; index += 1) {
    const point = candidates[index];
    const box = labelBox(point.x, point.y, width, height);
    if (!boxInsideBounds(box, focus)) continue;
    const overlap = occupied.reduce((sum, item) => sum + overlapArea(box, item), 0);
    const distance = Math.hypot(point.x - interior.x, point.y - interior.y);
    const score = overlap * 1000 + distance + index * 0.01;
    if (!best || score < best.score) best = { point, box, score };
    if (overlap === 0) break;
  }

  if (!best) {
    const x = Math.min(focus.x + focus.width - width / 2, Math.max(focus.x + width / 2, interior.x));
    const y = Math.min(focus.y + focus.height - height / 2, Math.max(focus.y + height / 2, interior.y));
    best = { point: { x, y }, box: labelBox(x, y, width, height), score: Number.POSITIVE_INFINITY };
  }
  occupied.push(best.box);
  const anchorX = geometry.callout ? geometry.callout.anchor.cx : interior.x;
  const anchorY = geometry.callout ? geometry.callout.anchor.cy : interior.y;
  return {
    text,
    x: best.point.x,
    y: best.point.y,
    fontSize,
    width,
    height,
    placement: 'callout',
    anchorX,
    anchorY,
  };
}

export function deriveNeighborMapModel(
  asset: MapRegionAsset,
  round: NeighborMapRoundState,
  nameForId: (countryId: string) => string,
): NeighborMapModel {
  if (round.neighborIds.includes(round.targetId)) throw new Error('Target cannot be its own neighbour.');
  const uniqueNeighbors = [...new Set(round.neighborIds)];
  const neighborSet = new Set(uniqueNeighbors);
  const foundSet = new Set(round.foundIds.filter((countryId) => neighborSet.has(countryId)));
  const revealedSet = new Set(round.revealedIds.filter((countryId) => neighborSet.has(countryId) && !foundSet.has(countryId)));
  const geometryById = new Map(
    [...asset.countries, ...(asset.contextCountries ?? [])].map((geometry) => [geometry.countryId, geometry]),
  );
  const focus = calculateNeighborClusterBounds(asset, round.targetId, uniqueNeighbors);
  const occupied: LabelBox[] = [];

  const orderedIds = [round.targetId, ...uniqueNeighbors].sort((left, right) => {
    if (left === round.targetId) return -1;
    if (right === round.targetId) return 1;
    const leftResolved = foundSet.has(left) || revealedSet.has(left);
    const rightResolved = foundSet.has(right) || revealedSet.has(right);
    if (leftResolved !== rightResolved) return leftResolved ? -1 : 1;
    return left.localeCompare(right);
  });

  const puzzleCountries = orderedIds.map((countryId): NeighborMapCountry => {
    const geometry = geometryById.get(countryId);
    const path = geometry ? canonicalCountryPolygonPath(geometry) : null;
    if (!geometry || !path) throw new Error(`Canonical production polygon missing for ${countryId}.`);
    const state: NeighborMapVisualState = countryId === round.targetId
      ? 'target'
      : foundSet.has(countryId)
        ? 'solved'
        : revealedSet.has(countryId)
          ? 'revealed'
          : 'unresolved';
    const name = state === 'unresolved' ? undefined : nameForId(countryId);
    const text = state === 'unresolved' ? '?' : name ?? countryId;
    return {
      countryId,
      name,
      path,
      geometry,
      state,
      label: placeLabel(text, geometry, path, state, focus, occupied),
    };
  });

  const extent = parseViewBox(asset.viewBox);
  const contextWindow = expandBounds(focus, 0.38, extent);
  const puzzleSet = new Set([round.targetId, ...uniqueNeighbors]);
  const contextCountries = [...asset.countries, ...(asset.contextCountries ?? [])]
    .filter((geometry) => !puzzleSet.has(geometry.countryId))
    .map((geometry) => ({ geometry, path: canonicalCountryPolygonPath(geometry) }))
    .filter((item): item is { geometry: MapCountryGeometry; path: string } => Boolean(item.path))
    .filter((item) => boundsIntersect(pathMetrics(item.path).bounds, contextWindow))
    .map((item) => ({ countryId: item.geometry.countryId, path: item.path }));

  return {
    targetId: round.targetId,
    targetName: nameForId(round.targetId),
    focus,
    puzzleCountries,
    contextCountries,
    foundNames: uniqueNeighbors.filter((id) => foundSet.has(id)).map(nameForId),
    revealedNames: uniqueNeighbors.filter((id) => revealedSet.has(id)).map(nameForId),
    unresolvedCount: uniqueNeighbors.length - foundSet.size - revealedSet.size,
  };
}

export function labelBoxes(model: NeighborMapModel): LabelBox[] {
  return model.puzzleCountries.map((country) => labelBox(
    country.label.x,
    country.label.y,
    country.label.width,
    country.label.height,
  ));
}
