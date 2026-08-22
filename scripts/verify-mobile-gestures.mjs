import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const gestures = await readFile('dist/navigation-gestures.js', 'utf8');
const app = await readFile('dist/app.js', 'utf8');
const styles = await readFile('dist/styles.css', 'utf8');
const html = await readFile('dist/index.html', 'utf8');
const mapComponent = await readFile('dist/ui/components/map.js', 'utf8');
const neighborMapComponent = await readFile('dist/ui/components/neighbor-map.js', 'utf8');

// Gesture ownership: navigation is the lowest-priority claimant, so every
// surface that owns its own touch semantics must be able to opt out.
assert.ok(gestures.includes('[data-map-viewport]'), 'Navigation gestures yield to the shared map viewport, which owns pinch/pan.');
for (const owner of ['button', 'a', 'input', 'textarea', 'select', 'summary', 'label', '[contenteditable="true"]', '[role="button"]']) {
  assert.ok(gestures.includes(owner), `Navigation gestures yield to ${owner}.`);
}
assert.ok(gestures.includes('ownsHorizontalPanning'), 'Horizontally scrollable containers keep their own panning gesture.');
assert.ok(gestures.includes('scrollWidth') && gestures.includes('clientWidth'), 'Horizontal scroll ownership is detected from real overflow, not a hardcoded selector list.');

// Edge-swipe discrimination.
assert.ok(gestures.includes('EDGE_GUTTER_PX = 28'), 'The back gesture only arms from the screen edge.');
assert.ok(gestures.includes('SWIPE_DISTANCE_PX = 72'), 'The back gesture requires a deliberate travel distance.');
assert.ok(gestures.includes('MAX_VERTICAL_DRIFT_PX = 48'), 'Vertical drift disqualifies the back gesture.');
assert.ok(gestures.includes('dx <= dy'), 'The back gesture requires horizontal dominance over vertical movement.');
assert.ok(gestures.includes('dx < 0'), 'A leftward reversal disqualifies the back gesture.');
assert.ok(/dy > MAX_VERTICAL_DRIFT_PX \|\| dx < 0\)\s*\{\s*start = null/.test(gestures), 'A disqualified gesture is abandoned for the rest of the pointer stream rather than re-arming mid-scroll.');
assert.ok(gestures.includes('touchstart') && gestures.includes('touchmove'), 'The back gesture is driven by touch events, which stay alive when the browser would otherwise claim the drag as a scroll.');
assert.ok(/touchmove.*passive: false/s.test(gestures), 'The touchmove listener is cancelable so horizontal intent can be claimed.');
assert.ok(gestures.includes('start.claimed') && gestures.includes('preventDefault'), 'A horizontally dominant swipe is claimed before the browser converts it into a scroll.');
assert.ok(gestures.includes('CLAIM_DISTANCE_PX'), 'The gesture only claims the touch after horizontal intent is unambiguous, leaving vertical scrolling untouched.');

// Routing stays the source of truth: no gesture-owned history state.
assert.ok(gestures.includes('getParentRoute'), 'The gesture asks routing for a parent rather than keeping its own stack.');
assert.ok(!gestures.includes('history.'), 'The gesture never manipulates history directly; routing owns navigation.');
assert.ok(app.includes('installNavigationGestures'), 'Navigation gestures are installed by the application entry point.');
assert.ok(app.includes('parentRoute(currentRoute)'), 'Back navigation resolves through the typed route model.');

// Home is the root: the gesture must not exit the app.
assert.ok(gestures.includes('getParentRoute() !== null'), 'At the navigation root the gesture does nothing instead of exiting the app.');

// Immersive maps carry no desktop-style chrome.
assert.ok(!mapComponent.includes('map-viewport-control'), 'Locations maps rely on direct manipulation, not persistent zoom controls.');
assert.ok(!neighborMapComponent.includes('map-viewport-control'), 'Neighbours maps rely on direct manipulation, not persistent zoom controls.');

// Device adaptation.
assert.ok(html.includes('viewport-fit=cover'), 'Safe-area insets require viewport-fit=cover.');
assert.ok(!html.includes('user-scalable=no') && !html.includes('maximum-scale=1'), 'Browser zoom and accessibility scaling are not suppressed.');
assert.ok(styles.includes('env(safe-area-inset-left)') && styles.includes('env(safe-area-inset-right)'), 'Landscape cutouts are cleared on the shared page shell, not only top/bottom.');
assert.ok(styles.includes('overscroll-behavior-y: contain'), 'The installed PWA does not surrender the top of a round to pull-to-refresh.');
assert.ok(!/min-height:\s*100vh/.test(styles), 'The shared shell uses a stable small-viewport baseline rather than raw 100vh.');

console.log('Mobile gesture verification passed: layered gesture ownership, edge-swipe discrimination, routing-owned back navigation, control-free immersive maps, and safe-area/PWA viewport contracts.');
