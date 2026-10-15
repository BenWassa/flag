// Locations framing audit (#226/#227).
//
// A deterministic, source-derived report for the 31 Locations scopes: the
// opening frame, what drives it, which remote components the shared initial-fit
// rule left out of it, and how each scoring country is presented at the opening
// frame. It reads only the generated assets and provenance, so a regional lane
// can audit a scope without reverse-engineering the SVG.
//
//   node scripts/build-verifier-output.mjs && node scripts/measure-locations-framing.mjs [scope-id ...] [--json]
//
// Pixel figures assume the stage sizes in STAGES. They locate problems; the
// exact-production browser helper (tests/browser/helpers/locations-audit.ts)
// remains the authority for measured screen sizes.

import { readFile } from 'node:fs/promises';
import { loadMapAsset } from '../.verify-dist/data/maps/index.js';
import { MAP_CONTINENT_CONFIGS } from '../.verify-dist/data/map-scopes.js';

const STAGES = [
  { name: '320x568 portrait', width: 320, height: 440 },
  { name: '390x844 portrait', width: 390, height: 560 },
  { name: '844x390 landscape', width: 780, height: 260 },
  { name: 'desktop', width: 1000, height: 620 },
];
const PROVENANCE_FILES = {
  africa: 'cartography-provenance.json',
  'south-america': 'south-america-cartography-provenance.json',
  europe: 'europe-cartography-provenance.json',
  asia: 'asia-cartography-provenance.json',
  'north-america': 'north-america-cartography-provenance.json',
  oceania: 'oceania-cartography-provenance.json',
};
// Smallest polygon extent (CSS px) treated as visually discoverable, and the
// extent from which a polygon is practically selectable without assistance.
export const DISCOVERABLE_PX = 6;
export const PRACTICAL_PX = 44;

function pathComponents(path = '') {
  return path.split(/(?=M)/).filter(Boolean).map((part) => {
    const points = [...part.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((match) => [Number(match[1]), Number(match[2])]);
    if (!points.length) return null;
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  }).filter(Boolean);
}

function fitToAspect(box, aspect) {
  return box.width / box.height > aspect
    ? { width: box.width, height: box.width / aspect }
    : { width: box.height * aspect, height: box.height };
}

/** A = canonical polygon; B = polygon + invisible assist; C = persistent cue; D = inset/callout. */
export function classifyStatic(geometry, insetMember) {
  if (insetMember || geometry.callout) return 'D';
  if (geometry.locator || geometry.marker) return 'C';
  if (geometry.hitAssist) return 'B';
  return 'A';
}

async function loadProvenance(continentId) {
  const file = PROVENANCE_FILES[continentId];
  return JSON.parse(await readFile(new URL(`../docs/architecture/${file}`, import.meta.url), 'utf8'));
}

export async function auditScope(scopeId, continent, provenance) {
  const asset = await loadMapAsset(scopeId);
  if (!asset?.initialFocus) throw new Error(`${scopeId} has no opening frame.`);
  const focus = asset.initialFocus;
  const [, , canvasWidth, canvasHeight] = asset.viewBox.split(' ').map(Number);
  const excluded = provenance.initialFit?.excludedComponents ?? {};
  const insetMembers = new Set((asset.insets ?? []).flatMap((inset) => inset.countryIds));
  const edge = 30;
  const drivers = { left: [], right: [], top: [], bottom: [] };
  const countries = asset.countries.map((geometry) => {
    const components = pathComponents(geometry.path ?? geometry.outlinePath);
    const area = (box) => (box.x1 - box.x0) * (box.y1 - box.y0);
    const primary = components.reduce((best, box) => (!best || area(box) > area(best) ? box : best), null);
    const extentUnits = primary ? Math.max(primary.x1 - primary.x0, primary.y1 - primary.y0) : 0;
    const bounds = components.length
      ? {
        x0: Math.min(...components.map((box) => box.x0)), y0: Math.min(...components.map((box) => box.y0)),
        x1: Math.max(...components.map((box) => box.x1)), y1: Math.max(...components.map((box) => box.y1)),
      }
      : null;
    if (primary) {
      if (primary.x0 - focus.x < edge) drivers.left.push(geometry.countryId);
      if (focus.x + focus.width - primary.x1 < edge) drivers.right.push(geometry.countryId);
      if (primary.y0 - focus.y < edge) drivers.top.push(geometry.countryId);
      if (focus.y + focus.height - primary.y1 < edge) drivers.bottom.push(geometry.countryId);
    }
    const stages = Object.fromEntries(STAGES.map((stage) => {
      const box = fitToAspect(focus, stage.width / stage.height);
      return [stage.name, Number((extentUnits * (stage.width / box.width)).toFixed(1))];
    }));
    return {
      id: geometry.countryId,
      class: classifyStatic(geometry, insetMembers.has(geometry.countryId)),
      polygonExtentUnits: Number(extentUnits.toFixed(1)),
      polygonExtentPx: stages,
      insideOpeningFrame: Boolean(bounds)
        && bounds.x1 > focus.x && bounds.x0 < focus.x + focus.width
        && bounds.y1 > focus.y && bounds.y0 < focus.y + focus.height,
      fitExcluded: excluded[geometry.countryId] ?? null,
    };
  });
  return {
    scope: scopeId,
    continent,
    scoringCountries: countries.length,
    canvas: { width: canvasWidth, height: canvasHeight },
    focus,
    zoomVersusCanvas: Number((canvasWidth / focus.width).toFixed(2)),
    maxZoom: asset.maxZoom ?? 5.5,
    zoomHeadroom: Number(((asset.maxZoom ?? 5.5) / (canvasWidth / focus.width)).toFixed(2)),
    edgeDrivers: Object.fromEntries(Object.entries(drivers).map(([side, ids]) => [side, ids.sort()])),
    fitExcludedCountries: countries.filter((item) => item.fitExcluded).map((item) => item.id),
    classes: Object.fromEntries(['A', 'B', 'C', 'D'].map((cls) => [cls, countries.filter((item) => item.class === cls).map((item) => item.id)])),
    undiscoverableAtPhone: countries
      .filter((item) => item.class === 'A' && item.polygonExtentPx['390x844 portrait'] < DISCOVERABLE_PX)
      .map((item) => item.id),
    countries,
  };
}

export async function auditAllScopes(only = []) {
  const rows = [];
  for (const continent of MAP_CONTINENT_CONFIGS) {
    const provenance = await loadProvenance(continent.continentId);
    const scopeIds = [continent.scope.id, ...continent.regions.map((region) => region.scope.id)];
    for (const scopeId of scopeIds) {
      if (only.length && !only.includes(scopeId)) continue;
      rows.push(await auditScope(scopeId, continent.continentId, provenance));
    }
  }
  return rows;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const rows = await auditAllScopes(args.filter((arg) => !arg.startsWith('--')));
  if (args.includes('--json')) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    console.log('scope'.padEnd(26) + 'zoom  focus(w×h)       A/B/C/D   excluded-from-fit  undiscoverable@390');
    for (const row of rows) {
      const counts = ['A', 'B', 'C', 'D'].map((cls) => row.classes[cls].length).join('/');
      console.log(
        `${row.scope.padEnd(26)}${String(row.zoomVersusCanvas).padEnd(6)}`
        + `${`${row.focus.width}×${row.focus.height}`.padEnd(18)}${counts.padEnd(10)}`
        + `${(row.fitExcludedCountries.join(',') || '-').padEnd(19)}${row.undiscoverableAtPhone.join(',') || '-'}`,
      );
    }
    console.log(`\n${rows.length} scopes. Stage sizes are assumed (${STAGES.map((stage) => stage.name).join(', ')}); use --json for per-country detail.`);
  }
}
