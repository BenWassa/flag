// Exact-production measurement helpers for the Locations framing/touch audit
// (#226/#227). They report what the learner actually has on screen — fitted
// viewBox, screen-space polygon extents, practical hit diameters and whether a
// real pointer lands on each scoring country — so a regional lane can audit a
// scope without reverse-engineering the SVG. They assert nothing themselves.

import { expect, type Page } from '@playwright/test';

/** Smallest polygon extent (CSS px) a learner can plausibly discover. */
export const DISCOVERABLE_PX = 6;
/** Practical pointer target the shared assistance contract guarantees. */
export const PRACTICAL_DIAMETER_PX = 43.5;

/**
 * A = canonical polygon sufficient
 * B = polygon visible, invisible interaction assistance required
 * C = persistent visible cue + invisible practical surface
 * D = special geographic treatment (callout / true-scale inset)
 */
export type TargetClass = 'A' | 'B' | 'C' | 'D';

export interface CountryAudit {
  id: string;
  /** Largest single component's longest side on screen, in CSS px. */
  polygonExtentPx: number;
  /** Screen diameters of every `[data-map-hit]` practical target for this country. */
  hitDiametersPx: number[];
  hasVisibleCue: boolean;
  hasCallout: boolean;
  inInset: boolean;
  /**
   * Share (0–1) of each practical hit disc's area samples that a real pointer
   * resolves to this country. A disc buried under neighbouring land (#117 paints
   * real polygons above assistance) reads near 0 even though it is 44px wide.
   */
  exposedHitFractions: number[];
  /** A pointer at this point is owned by the country, or null when none exists. */
  actionablePoint: { x: number; y: number } | null;
  class: TargetClass;
}

export interface FrameAudit {
  viewport: { width: number; height: number };
  stage: { width: number; height: number };
  viewBox: { x: number; y: number; width: number; height: number };
  unitsPerCssPx: number;
  countries: CountryAudit[];
}

export function classifyTarget(item: Pick<CountryAudit, 'polygonExtentPx' | 'hitDiametersPx' | 'hasVisibleCue' | 'hasCallout' | 'inInset'>): TargetClass {
  if (item.inInset || item.hasCallout) return 'D';
  if (item.hasVisibleCue) return 'C';
  if (item.hitDiametersPx.length) return 'B';
  return 'A';
}

export async function openLocationsScope(
  page: Page,
  route: string,
  launchLabel: string,
  viewport: { width: number; height: number },
): Promise<void> {
  await page.setViewportSize(viewport);
  await page.goto(route);
  await page.getByRole('button', { name: launchLabel }).click();
  await expect(page.locator('#map-prompt-heading')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('[data-map-viewport]')).toHaveAttribute('data-map-positioned', 'true', { timeout: 40_000 });
  // The opening frame is applied a beat after the viewport reports positioned.
  await page.waitForFunction(() => {
    const viewport = document.querySelector<HTMLElement>('[data-map-viewport]');
    const svg = document.querySelector<SVGSVGElement>('.map-svg');
    return Boolean(viewport && svg && svg.getAttribute('viewBox') !== viewport.dataset.mapViewbox);
  }, undefined, { timeout: 40_000 });
}

/** The scope's canvas, opening focus and zoom ceiling exactly as served to the runtime. */
export async function readFitData(page: Page): Promise<{
  canvas: { x: number; y: number; width: number; height: number };
  focus: { x: number; y: number; width: number; height: number } | null;
  maxZoom: number;
}> {
  return page.locator('[data-map-viewport]').evaluate((viewport) => {
    const numbers = (value: string | undefined) => (value ?? '').trim().split(/[ ,]+/).map(Number);
    const box = (value: string | undefined) => {
      const [x, y, width, height] = numbers(value);
      return Number.isFinite(width) ? { x, y, width, height } : null;
    };
    const element = viewport as HTMLElement;
    return {
      canvas: box(element.dataset.mapViewbox)!,
      focus: box(element.dataset.mapFocus),
      maxZoom: Number(element.dataset.mapMaxZoom),
    };
  });
}

/** Measure the current frame (opening, after a question advance, or after zoom). */
export async function auditFrame(
  page: Page,
  options: { insetIds?: readonly string[] } = {},
): Promise<FrameAudit> {
  const raw = await page.evaluate((knownInsetIds) => {
    const viewport = document.querySelector<HTMLElement>('[data-map-viewport]')!;
    const svg = viewport.querySelector<SVGSVGElement>('.map-svg')!;
    const matrix = svg.getScreenCTM()!;
    const pxPerUnit = Math.hypot(matrix.a, matrix.b);
    const [vx, vy, vw, vh] = svg.getAttribute('viewBox')!.trim().split(/[ ,]+/).map(Number);
    const insetIds = new Set<string>([
      ...knownInsetIds,
      ...[...document.querySelectorAll<HTMLElement>('.map-inset [data-id]')].map((node) => node.dataset.id!),
    ]);
    const owner = (x: number, y: number) => document.elementFromPoint(x, y)
      ?.closest('[data-action="map-answer"]')?.getAttribute('data-id') ?? null;

    const components = (d: string) => d.split(/(?=M)/).filter(Boolean).map((part) => {
      const points = [...part.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
      if (!points.length) return null;
      const xs = points.map((p) => p[0]);
      const ys = points.map((p) => p[1]);
      return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
    }).filter((c): c is { x0: number; y0: number; x1: number; y1: number } => c !== null);

    const ids = [...new Set(
      [...document.querySelectorAll<HTMLElement>('.map-active-countries .map-country[data-id]')].map((n) => n.dataset.id!),
    )];
    const countries = ids.map((id) => {
      const group = document.querySelector<SVGGElement>(`.map-active-countries .map-country[data-id="${id}"]`)!;
      const shape = group.querySelector<SVGPathElement>('.map-country__shape, .map-country__feedback-shape');
      const parts = shape ? components(shape.getAttribute('d') ?? '') : [];
      const primary = parts.reduce<typeof parts[number] | null>(
        (best, c) => (!best || (c.x1 - c.x0) * (c.y1 - c.y0) > (best.x1 - best.x0) * (best.y1 - best.y0) ? c : best), null);
      const extentUnits = primary ? Math.max(primary.x1 - primary.x0, primary.y1 - primary.y0) : 0;
      const hits = [...document.querySelectorAll<SVGCircleElement>(
        `[data-action="map-answer"][data-id="${id}"] [data-map-hit], [data-action="map-answer"][data-id="${id}"][data-map-hit]`,
      )].filter((hit) => !hit.closest('.map-inset'));
      const hitDiametersPx = hits.map((hit) => {
        const m = hit.getScreenCTM()!;
        return Math.min(hit.r.baseVal.value * 2 * Math.hypot(m.a, m.b), hit.r.baseVal.value * 2 * Math.hypot(m.c, m.d));
      });
      // Sample the polygon, then every practical hit disc, for a point the country owns.
      let actionablePoint: { x: number; y: number } | null = null;
      const probe = (x: number, y: number) => {
        if (!actionablePoint && owner(x, y) === id) actionablePoint = { x, y };
      };
      if (shape) {
        const m = shape.getScreenCTM()!;
        const box = shape.getBBox();
        for (let row = 0; row < 15; row += 1) {
          for (let col = 0; col < 15; col += 1) {
            const p = new DOMPoint(box.x + box.width * ((col + 0.5) / 15), box.y + box.height * ((row + 0.5) / 15)).matrixTransform(m);
            probe(p.x, p.y);
          }
        }
      }
      for (const hit of hits) {
        const m = hit.getScreenCTM()!;
        for (const fraction of [0, 0.35, 0.55, 0.7, 0.82]) {
          for (let i = 0; i < (fraction === 0 ? 1 : 24); i += 1) {
            const a = (Math.PI * 2 * i) / 24;
            const p = new DOMPoint(
              hit.cx.baseVal.value + hit.r.baseVal.value * fraction * Math.cos(a),
              hit.cy.baseVal.value + hit.r.baseVal.value * fraction * Math.sin(a),
            ).matrixTransform(m);
            probe(p.x, p.y);
          }
        }
      }
      const exposedHitFractions = hits.map((hit) => {
        const m = hit.getScreenCTM()!;
        let owned = 0;
        let total = 0;
        for (const fraction of [0.2, 0.45, 0.7, 0.92]) {
          const samples = Math.max(6, Math.round(24 * fraction));
          for (let i = 0; i < samples; i += 1) {
            const a = (Math.PI * 2 * i) / samples;
            const p = new DOMPoint(
              hit.cx.baseVal.value + hit.r.baseVal.value * fraction * Math.cos(a),
              hit.cy.baseVal.value + hit.r.baseVal.value * fraction * Math.sin(a),
            ).matrixTransform(m);
            total += 1;
            if (owner(p.x, p.y) === id) owned += 1;
          }
        }
        return total ? owned / total : 0;
      });
      return {
        id,
        polygonExtentPx: extentUnits * pxPerUnit,
        hitDiametersPx,
        exposedHitFractions,
        hasVisibleCue: Boolean(group.querySelector('.map-country__marker, .map-country__locator')),
        hasCallout: Boolean(group.querySelector('.map-country__callout-target')),
        inInset: insetIds.has(id),
        actionablePoint,
      };
    });
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      stage: { width: viewport.clientWidth, height: viewport.clientHeight },
      viewBox: { x: vx, y: vy, width: vw, height: vh },
      unitsPerCssPx: 1 / pxPerUnit,
      countries,
    };
  }, [...(options.insetIds ?? [])]);
  return {
    ...raw,
    countries: raw.countries.map((item) => ({ ...item, class: classifyTarget(item) })),
  };
}
