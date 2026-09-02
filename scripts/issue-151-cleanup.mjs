import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import postcss from 'postcss';

const styleDir = 'src/styles';
const auditPath = 'docs/open/issue-151-selector-audit.txt';
const markupPattern = 'progress-achievement|mastery-list|ledger-row|ledger-note|flag-frame--ledger|mini-ledger|filter-tab|status-chip|status-text|map-viewport-control|test-advance|text-icon-button|launcher-header__badge|screen-title__row';
const cssCandidatePattern = 'progress-achievement|mastery-list|ledger-|flag-frame--ledger|mini-ledger|filter-tab|status-chip|status-text|map-viewport-control|test-advance|text-icon-button|launcher-header__badge|screen-title__row';

function command(commandName, args, { allowFailure = false } = {}) {
  try {
    return execFileSync(commandName, args, { encoding: 'utf8' }).trimEnd();
  } catch (error) {
    if (allowFailure) return error.stdout?.toString().trimEnd() ?? '';
    throw error;
  }
}

function grepSource(globs, pattern) {
  return command('git', ['grep', '-nE', pattern, '--', ...globs], { allowFailure: true });
}

fs.mkdirSync(path.dirname(auditPath), { recursive: true });
const audit = [
  '# Issue #151 selector audit (temporary execution evidence)',
  '',
  `Branch parent baseline: ${command('git', ['merge-base', 'HEAD', 'origin/main'])}`,
  `Audit head before production edits: ${command('git', ['rev-parse', 'HEAD'])}`,
  '',
  '## Production TS/TSX hits before cleanup',
  grepSource(['src/**/*.ts', 'src/**/*.tsx'], markupPattern) || '(none)',
  '',
  '## Stylesheet hits before cleanup',
  grepSource(['src/styles/*.css'], cssCandidatePattern) || '(none)',
  '',
  '## Exact dist non-CSS hits before cleanup',
  command('bash', ['-lc', `find dist -type f ! -name '*.css' -print0 | xargs -0 grep -nE '${markupPattern}'`], { allowFailure: true }) || '(none)',
  '',
  '## Fallback classes intentionally retained',
  grepSource(['src/react/components/Launcher.tsx', 'src/styles/*.css'], 'launcher-header__icon|launcher__scope-list|launcher__learn|page--launcher') || '(none)',
  '',
];
fs.writeFileSync(auditPath, `${audit.join('\n')}\n`);

const retired = [
  /\.progress-achievement(?:[-_][A-Za-z0-9_-]*)?/,
  /\.mastery-list\b/,
  /\.ledger-[A-Za-z0-9_-]+\b/,
  /\.flag-frame--ledger\b/,
  /\.mini-ledger[A-Za-z0-9_-]*\b/,
  /\.filter-tab[A-Za-z0-9_-]*\b/,
  /\.status-chip[A-Za-z0-9_-]*\b/,
  /\.status-text[A-Za-z0-9_-]*\b/,
  /\.map-viewport-control[A-Za-z0-9_-]*\b/,
  /\.test-advance\b/,
  /\.launcher-header__badge\b/,
  /\.screen-title__row\b/,
];

for (const name of fs.readdirSync(styleDir).filter((file) => file.endsWith('.css'))) {
  const file = path.join(styleDir, name);
  const source = fs.readFileSync(file, 'utf8');
  const root = postcss.parse(source, { from: file });

  root.walkRules((rule) => {
    const selectors = rule.selectors;
    const kept = selectors.filter((selector) => !retired.some((pattern) => pattern.test(selector)));
    if (kept.length === selectors.length) return;
    if (kept.length === 0) rule.remove();
    else rule.selectors = kept;
  });

  root.walkComments((comment) => {
    if (comment.text.includes('Placeholder slot only')) comment.remove();
  });

  if (name === 'styles.css') {
    let baseRule;
    root.walkRules((rule) => {
      if (rule.selectors.includes('.icon-button') && rule.selectors.includes('.text-icon-button')) {
        rule.selectors = rule.selectors.filter((selector) => selector !== '.text-icon-button');
      }
      if (rule.selector?.trim() === '.text-icon-button') baseRule = rule;
    });
    if (!baseRule) throw new Error('Expected dedicated .text-icon-button rule in styles.css');

    baseRule.removeAll();
    for (const [prop, value] of [
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
    ]) baseRule.append({ prop, value });

    const active = postcss.rule({ selector: '.text-icon-button:active' });
    active.append({ prop: 'transform', value: 'translateY(1px)' });
    active.append({ prop: 'background', value: 'var(--surface-subtle)' });
    baseRule.after(active);

    let reducedActiveFound = false;
    root.walkAtRules('media', (media) => {
      if (media.params !== '(prefers-reduced-motion: reduce)') return;
      media.walkRules((rule) => {
        if (rule.selectors.includes('.answer-button:active') && rule.selectors.includes('.button:active')) {
          if (!rule.selectors.includes('.text-icon-button:active')) {
            rule.selectors = [...rule.selectors, '.text-icon-button:active'];
          }
          reducedActiveFound = true;
        }
      });
    });
    if (!reducedActiveFound) throw new Error('Expected reduced-motion active control rule in styles.css');
  }

  if (name === 'atlas-theme.css') {
    root.walkRules((rule) => {
      const selectors = rule.selectors;
      const kept = selectors.filter((selector) => !selector.includes('.text-icon-button'));
      if (kept.length === selectors.length) return;
      if (kept.length === 0) rule.remove();
      else rule.selectors = kept;
    });
  }

  const output = root.toString();
  if (output !== source) fs.writeFileSync(file, output);
}

const launcherPath = 'src/react/components/Launcher.tsx';
const launcher = fs.readFileSync(launcherPath, 'utf8');
const before = '          <span className="screen-title__row"><h1 tabIndex={-1} data-autofocus aria-label={`${activeScope.label} ${domainName} launcher`}>{activeScope.label}</h1><span className="launcher-header__badge" aria-hidden="true" /></span>';
const after = '          <h1 tabIndex={-1} data-autofocus aria-label={`${activeScope.label} ${domainName} launcher`}>{activeScope.label}</h1>';
if (!launcher.includes(before) && !launcher.includes(after)) {
  throw new Error('Launcher header markup no longer matches #151 audit target');
}
if (launcher.includes(before)) fs.writeFileSync(launcherPath, launcher.replace(before, after));

const staleMarkup = grepSource(['src/**/*.ts', 'src/**/*.tsx'], markupPattern.replace('|text-icon-button', ''));
if (staleMarkup) throw new Error(`Retired production markup remains:\n${staleMarkup}`);
const textIconMarkup = grepSource(['src/**/*.ts', 'src/**/*.tsx'], 'text-icon-button');
if (textIconMarkup) throw new Error(`.text-icon-button unexpectedly has production markup ownership:\n${textIconMarkup}`);

const remainingSelectors = [];
for (const name of fs.readdirSync(styleDir).filter((file) => file.endsWith('.css'))) {
  const file = path.join(styleDir, name);
  const root = postcss.parse(fs.readFileSync(file, 'utf8'), { from: file });
  root.walkRules((rule) => {
    for (const selector of rule.selectors) {
      if (retired.some((pattern) => pattern.test(selector))) remainingSelectors.push(`${file}: ${selector}`);
      if (name !== 'styles.css' && selector.includes('.text-icon-button')) remainingSelectors.push(`${file}: ${selector}`);
    }
  });
}
if (remainingSelectors.length) {
  throw new Error(`Retired or duplicate selectors remain:\n${remainingSelectors.join('\n')}`);
}

const textIconBaseCount = command('bash', ['-lc', "git grep -n '^\\.text-icon-button {' -- src/styles/styles.css | wc -l"]);
if (textIconBaseCount !== '1') throw new Error(`Expected one authoritative .text-icon-button base rule, got ${textIconBaseCount}`);

const fallback = grepSource(['src/react/components/Launcher.tsx', 'src/styles/*.css'], 'launcher-header__icon|launcher__scope-list|launcher__learn|page--launcher');
if (!fallback) throw new Error('Expected conventional launcher fallback styling/markup to remain');

console.log('Issue #151 cleanup transform complete.');
console.log(fallback);
