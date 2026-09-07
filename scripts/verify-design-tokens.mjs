import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const theme = readFileSync('src/styles/atlas-theme.css', 'utf8');
const base = readFileSync('src/styles/styles.css', 'utf8');
const spatial = readFileSync('src/styles/spatial.css', 'utf8');
const neighbors = readFileSync('src/styles/neighbors.css', 'utf8');
const map = readFileSync('src/styles/map.css', 'utf8');
const locationsTiming = readFileSync('src/state/locations-round.ts', 'utf8');
const playTiming = readFileSync('src/state/play-feedback-timing.ts', 'utf8');
const camera = readFileSync('src/spatial/camera-director.ts', 'utf8');
const design = readFileSync('DESIGN.md', 'utf8');
const impeccable = JSON.parse(readFileSync('.impeccable/design.json', 'utf8'));

function token(name) {
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(theme);
  assert.ok(match, `Missing --${name} design token`);
  return match[1].trim();
}

assert.equal(token('control-height-compact'), '44px');
assert.equal(token('control-height-standard'), '52px');
assert.equal(token('motion-press'), '100ms');
assert.equal(token('motion-ui'), '160ms');
assert.equal(token('motion-feedback-emphasis'), '520ms');
assert.equal(token('ease-press'), 'ease-out');
assert.equal(token('ease-ui'), 'ease-out');
assert.equal(token('ease-feedback'), 'ease-out');

assert.ok(base.includes('min-height: var(--control-height-compact)'), 'Shared compact controls consume the compact height token.');
assert.ok(theme.includes('min-height: var(--control-height-standard)'), 'Shared primary controls consume the standard height token.');
assert.ok(base.includes('var(--motion-press) var(--ease-press)'), 'Shared controls consume semantic press timing.');
assert.ok(base.includes('var(--motion-ui) var(--ease-ui)'), 'Shared controls consume ordinary UI timing.');
assert.ok(spatial.includes('min-height: var(--control-height-compact)'), 'Spatial lateral controls use the compact height token.');
assert.ok(spatial.includes('min-height: var(--control-height-standard)'), 'Spatial domain controls use the standard height token.');
assert.ok(spatial.includes('var(--motion-ui) var(--ease-ui)'), 'Spatial DOM controls use ordinary UI timing.');
assert.ok(neighbors.includes('min-height: var(--control-height-standard)'), 'Neighbours text-entry controls use the standard height token.');
assert.ok(neighbors.includes('min-height: var(--control-height-compact)'), 'Neighbours quiet controls use the compact height token.');

assert.ok(map.includes('map-wrong var(--motion-feedback-emphasis) var(--ease-feedback)'), 'Locations wrong pulse consumes the accepted feedback token.');
assert.ok(!map.includes('map-wrong 520ms'), 'Locations feedback duration is no longer duplicated as a literal.');
const cssFeedback = Number(token('motion-feedback-emphasis').replace('ms', ''));
const stateFeedback = Number(/LOCATION_WRONG_FEEDBACK_MS = (\d+)/.exec(locationsTiming)?.[1]);
assert.equal(stateFeedback, cssFeedback, 'Locations semantic reset and decorative wrong pulse remain aligned.');

assert.ok(playTiming.includes('PLAY_FEEDBACK_DWELL_CORRECT_MS = 620'), 'Accepted correct Play reading dwell remains unchanged.');
assert.ok(playTiming.includes('PLAY_FEEDBACK_DWELL_WRONG_MS = 1500'), 'Accepted wrong Play reading dwell remains unchanged.');
assert.ok(!camera.includes('--motion-'), 'Camera motion remains independently owned and is not coupled to CSS UI tokens.');

assert.ok(design.includes('## Motion and control geometry'), 'DESIGN.md documents the small motion/control scale.');
assert.ok(design.includes('composition exception in the navigation system, not a material exception'),
  'DESIGN.md records Spatial Home as a composition exception rather than a translucency exception.');
assert.equal(impeccable.tokens.controlHeight.compact, '44px');
assert.equal(impeccable.tokens.controlHeight.standard, '52px');
assert.equal(impeccable.tokens.motion.press, '100ms ease-out');
assert.equal(impeccable.tokens.motion.ui, '160ms ease-out');
assert.equal(impeccable.tokens.homeChooser.blur, 'none by default; backdrop-filter is not required');
assert.ok(
  impeccable.tokens.homeChooser.surface.includes('opaque cool near-white Atlas chrome'),
  '.impeccable/design.json keeps the Home chooser in the ordinary opaque Atlas chrome family.',
);
assert.ok(
  impeccable.principles.some((principle) => principle.includes('not a translucency exception')),
  '.impeccable/design.json records Home as a composition exception rather than a separate material system.',
);
assert.match(spatial, /\.spatial-shell\[data-surface='domains'\][\s\S]*\.spatial-command\[data-surface='domains'\]/,
  'Spatial Home has an explicit composition state rather than inheriting the ordinary command band.');
assert.match(spatial, /\.spatial-command\[data-surface='domains'\][\s\S]*background:\s*var\(--canvas\)/,
  'Spatial Home uses the ordinary opaque Atlas canvas neutral rather than a globe-tinted translucent surface.');
assert.match(spatial, /\.spatial-command\[data-surface='domains'\][\s\S]*box-shadow:\s*var\(--depth-tile\)/,
  'Spatial Home uses the restrained shared tile depth rather than bespoke heavy elevation.');
assert.equal(spatial.includes('backdrop-filter'), false,
  'Spatial Home no longer needs backdrop-filter language or a decorative compositing path.');
assert.equal(/backdrop-filter\s*:/.test(spatial), false,
  'Spatial Home does not pay a decorative backdrop-filter compositing cost.');

console.log('Design motion/control token verification passed.');
