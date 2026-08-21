import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile('dist/neighbors.css', 'utf8');
const runtime = await readFile('dist/neighbor-map-runtime.js', 'utf8');
const app = await readFile('dist/app.js', 'utf8');

assert.ok(css.includes('min-height: 100svh'), 'Neighbours uses a stable small-viewport baseline instead of making the whole page follow keyboard-driven dvh changes.');
assert.ok(css.includes('#app[data-neighbor-entry-active="true"] .neighbor-quiz-page'), 'Focused Neighbours entry has one explicit compact layout state.');
assert.ok(css.includes('--neighbor-visual-height'), 'Focused portrait sizing consumes the visual viewport height through a scoped CSS custom property.');
assert.ok(css.includes('height: clamp(140px, calc(var(--neighbor-visual-height, 410px) - 250px), 190px)'), 'The focused map keeps its top edge and contracts only within a useful bounded range.');
assert.ok(css.includes('position: relative') && css.includes('bottom: auto'), 'Focused entry leaves the sticky coordinate system while the software keyboard is active.');
assert.ok(css.includes('(max-height: 560px) and (orientation: portrait)'), 'Layout-viewport-resizing browsers retain a CSS-only short-portrait fallback.');
assert.ok(css.includes('(orientation: landscape) and (max-height: 620px)'), 'Short-landscape treatment remains deliberate.');
assert.ok(!css.includes('scroll-margin-bottom: 32dvh'), 'The previous large keyboard-sensitive scroll margin is removed.');

assert.ok(runtime.includes('window.visualViewport'), 'The Neighbours runtime feature-detects visualViewport.');
assert.ok(runtime.includes('viewport.scale !== 1'), 'Visual viewport sizing is disabled while browser zoom is active.');
assert.ok(runtime.includes("root.dataset.neighborEntryActive = 'true'"), 'Keyboard-entry layout state is owned by the stable app root across same-route rerenders.');
assert.ok(runtime.includes('queueMicrotask(syncNeighborEntryViewport)'), 'Focus-out cleanup waits through synchronous Neighbours rerenders/refocus instead of flickering layout state.');
assert.ok(runtime.includes("addEventListener('resize', syncNeighborEntryViewport)"), 'Software-keyboard visual viewport resize updates the scoped height input.');
assert.ok(!runtime.includes('scrollTo(') && !runtime.includes('scrollIntoView('), 'The keyboard fix does not use imperative scroll positioning.');

assert.ok(app.includes('renderFocusIntent(lastRenderedRouteKey !== null)'), 'Issue #41 initial-render versus SPA focus intent remains in the shared app path.');
assert.ok(app.includes("if (focusIntent === 'restore-or-autofocus') restoreFocus(previousSelector)"), 'Same-route restore/autofocus behaviour remains owned by the existing shared focus contract.');

console.log('Neighbour keyboard verification passed: stable portrait layout ownership, scoped visualViewport sizing, zoom safety, no scroll hacks, and Issue #41 focus contract preserved.');
