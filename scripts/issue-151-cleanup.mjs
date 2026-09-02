import fs from 'node:fs';
import postcss from 'postcss';

const stylesPath = 'src/styles/styles.css';
const themePath = 'src/styles/atlas-theme.css';
const mapPath = 'src/styles/map-cartography.css';
const workflowPath = '.github/workflows/issue-151-audit.yml';

function rule(selector, declarations) {
  const node = postcss.rule({ selector });
  for (const [prop, value] of declarations) node.append({ prop, value });
  return node;
}

const stylesSource = fs.readFileSync(stylesPath, 'utf8');
const styles = postcss.parse(stylesSource, { from: stylesPath });

// Remove only top-level authoritative text-button rules; responsive/state
// overrides inside media queries are independent behavioural ownership.
for (const child of [...styles.nodes]) {
  if (child.type === 'rule' && (child.selector?.trim() === '.text-icon-button' || child.selector?.trim() === '.text-icon-button:active')) {
    child.remove();
  }
}

let iconButton;
for (const child of styles.nodes) {
  if (child.type === 'rule' && child.selector?.trim() === '.icon-button') {
    iconButton = child;
    break;
  }
}
if (!iconButton) throw new Error('Expected top-level .icon-button anchor in styles.css');

const canonical = rule('.text-icon-button', [
  ['min-width', '44px'],
  ['min-height', '44px'],
  ['border', '1px solid var(--line)'],
  ['cursor', 'pointer'],
  ['transition', 'background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 120ms ease'],
  ['display', 'inline-flex'],
  ['align-items', 'center'],
  ['justify-content', 'center'],
  ['gap', '8px'],
  ['border-radius', 'var(--radius-md)'],
  ['padding', '0 13px'],
  ['color', 'var(--text-muted)'],
  ['font-size', '14px'],
  ['font-weight', '650'],
  ['background', 'var(--surface)'],
  ['box-shadow', '0 1px 2px rgba(16, 19, 24, .035)'],
]);
const active = rule('.text-icon-button:active', [
  ['transform', 'translateY(1px)'],
  ['background', 'var(--surface-subtle)'],
]);
iconButton.after(canonical, active);

let mobileOverride = false;
let reducedTransition = false;
let reducedActive = false;
let hoverState = false;
styles.walkAtRules('media', (media) => {
  media.walkRules((candidate) => {
    if (candidate.selector?.trim() === '.text-icon-button' && media.params.includes('max-width')) {
      candidate.removeAll();
      candidate.append({ prop: 'width', value: '44px' });
      candidate.append({ prop: 'padding', value: '0' });
      mobileOverride = true;
    }
    if (candidate.selectors?.includes('.text-icon-button:hover')) hoverState = true;
    if (media.params === '(prefers-reduced-motion: reduce)') {
      if (candidate.selectors?.includes('.icon-button') && candidate.selectors.includes('.button') && candidate.selectors.includes('.answer-button')) {
        if (!candidate.selectors.includes('.text-icon-button')) candidate.selectors = [...candidate.selectors, '.text-icon-button'];
        reducedTransition = true;
      }
      if (candidate.selectors?.includes('.answer-button:active') && candidate.selectors.includes('.button:active')) {
        if (!candidate.selectors.includes('.text-icon-button:active')) candidate.selectors = [...candidate.selectors, '.text-icon-button:active'];
        reducedActive = true;
      }
    }
  });
});
if (!mobileOverride) throw new Error('Expected narrow-mobile .text-icon-button override');
if (!hoverState) throw new Error('Expected .text-icon-button:hover state to remain');
if (!reducedTransition || !reducedActive) throw new Error('Expected reduced-motion text-button states');

styles.walkComments((comment) => {
  if (comment.text.includes('Flex items refuse to shrink past their content')) comment.remove();
});
fs.writeFileSync(stylesPath, styles.toString());

const themeSource = fs.readFileSync(themePath, 'utf8');
const theme = postcss.parse(themeSource, { from: themePath });
const themeTextButtonSelectors = [];
theme.walkRules((candidate) => {
  for (const selector of candidate.selectors ?? []) {
    if (selector.includes('.text-icon-button')) themeTextButtonSelectors.push(selector);
  }
});
if (themeTextButtonSelectors.length) throw new Error(`Theme still owns .text-icon-button: ${themeTextButtonSelectors.join(', ')}`);
theme.walkComments((comment) => {
  if (comment.text.includes('mini-ledger row')) {
    comment.text = comment.text.replace('its own flat, border-bottom mini-ledger row', 'its own flat, border-bottom result row');
  }
});
fs.writeFileSync(themePath, theme.toString());

const mapSource = fs.readFileSync(mapPath, 'utf8');
const mapRoot = postcss.parse(mapSource, { from: mapPath });
mapRoot.walkComments((comment) => {
  if (comment.text.includes('Controls occupy their own toolbar row')) comment.remove();
});
fs.writeFileSync(mapPath, mapRoot.toString());

// Exact post-repair assertions.
const repairedStyles = postcss.parse(fs.readFileSync(stylesPath, 'utf8'), { from: stylesPath });
let topLevelBase = 0;
let topLevelActive = 0;
let narrowWidth = false;
let narrowPadding = false;
repairedStyles.each((child) => {
  if (child.type !== 'rule') return;
  if (child.selector?.trim() === '.text-icon-button') topLevelBase += 1;
  if (child.selector?.trim() === '.text-icon-button:active') topLevelActive += 1;
});
repairedStyles.walkAtRules('media', (media) => {
  if (!media.params.includes('max-width')) return;
  media.walkRules((candidate) => {
    if (candidate.selector?.trim() !== '.text-icon-button') return;
    narrowWidth ||= candidate.nodes?.some((decl) => decl.type === 'decl' && decl.prop === 'width' && decl.value === '44px') ?? false;
    narrowPadding ||= candidate.nodes?.some((decl) => decl.type === 'decl' && decl.prop === 'padding' && decl.value === '0') ?? false;
  });
});
if (topLevelBase !== 1 || topLevelActive !== 1 || !narrowWidth || !narrowPadding) {
  throw new Error(`Unexpected consolidated state: base=${topLevelBase}, active=${topLevelActive}, mobileWidth=${narrowWidth}, mobilePadding=${narrowPadding}`);
}

// Freeze this temporary workflow in the same repair commit, preventing a
// self-trigger loop. It will be deleted before the PR is ready for review.
fs.writeFileSync(workflowPath, `name: Issue 151 verification\n\non:\n  workflow_dispatch:\n\npermissions:\n  contents: read\n\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo 'Temporary #151 verification workflow; intentionally manual while the PR diff is reviewed.'\n`);

console.log('Issue #151 text-button behaviour repaired and execution workflow frozen.');
