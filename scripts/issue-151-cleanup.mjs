import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import postcss from 'postcss';

const styleDir = 'src/styles';
const auditPath = 'docs/open/issue-151-selector-audit.txt';
const candidatePattern = 'progress-achievement-|mastery-list|ledger-|mini-ledger|filter-tab|status-chip--mastered|status-text--mastered|map-viewport-control|test-advance|text-icon-button|launcher-header__badge|screen-title__row';
const retiredPattern = 'progress-achievement-|mastery-list|ledger-|mini-ledger|filter-tab|status-chip--mastered|status-text--mastered|map-viewport-control|test-advance|launcher-header__badge|screen-title__row';

function command(commandName, args, { allowFailure = false } = {}) {
  try {
    return execFileSync(commandName, args, { encoding: 'utf8' }).trimEnd();
  } catch (error) {
    if (allowFailure) return error.stdout?.toString().trimEnd() ?? '';
    throw error;
  }
}

function grepSource(globs, pattern = candidatePattern) {
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
  grepSource(['src/**/*.ts', 'src/**/*.tsx']) || '(none)',
  '',
  '## Stylesheet hits before cleanup',
  grepSource(['src/styles/*.css']) || '(none)',
  '',
  '## Exact dist non-CSS hits before cleanup',
  command('bash', ['-lc', `find dist -type f ! -name '*.css' -print0 | xargs -0 grep -nE '${candidatePattern}'`], { allowFailure: true }) || '(none)',
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
  /\.mini-ledger[A-Za-z0-9_-]*\b/,
  /\.filter-tab[A-Za-z0-9_-]*\b/,
  /\.status-chip--mastered\b/,
  /\.status-text--mastered\b/,
  /\.map-viewport-control[A-Za-z0-9_-]*\b/,
  /\.test-advance\b/,
  /\.launcher-header__badge\b/,
  /\.screen-title__row\b/,
  /\.text-icon-button\b/,
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
    let anchor;
    root.walkRules((rule) => {
      if (!anchor && rule.selector?.trim() === '.icon-button') anchor = rule;
    });
    if (!anchor) throw new Error('Expected .icon-button anchor in styles.css');

    const canonical = postcss.parse(`
.text-icon-button {
  min-width: 44px;
  min-height: 44px;
  border: 1px solid var(--line);
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 120ms ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--radius-md);
  padding: 0 13px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 650;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(16, 19, 24, .035);
}
.text-icon-button:active {
  transform: translateY(1px);
  background: var(--surface-subtle);
}
`);
    anchor.after(...canonical.nodes);
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

const remaining = grepSource(['src/**/*.ts', 'src/**/*.tsx', 'src/styles/*.css'], retiredPattern);
if (remaining) throw new Error(`Retired production selectors remain:\n${remaining}`);

const textIconFiles = command('bash', ['-lc', "git grep -l 'text-icon-button' -- 'src/styles/*.css' | wc -l"]);
if (textIconFiles !== '1') throw new Error(`Expected text-icon-button in one stylesheet, got ${textIconFiles}`);
const baseCount = command('bash', ['-lc', "git grep -n '^\\.text-icon-button {' -- src/styles/styles.css | wc -l"]);
const activeCount = command('bash', ['-lc', "git grep -n '^\\.text-icon-button:active {' -- src/styles/styles.css | wc -l"]);
if (baseCount !== '1' || activeCount !== '1') {
  throw new Error(`Expected one authoritative text-icon-button rule/state; got base=${baseCount}, active=${activeCount}`);
}

const fallback = grepSource(['src/react/components/Launcher.tsx', 'src/styles/*.css'], 'launcher-header__icon|launcher__scope-list|launcher__learn|page--launcher');
if (!fallback) throw new Error('Expected conventional launcher fallback styling/markup to remain');

console.log('Issue #151 cleanup transform complete.');
console.log(fallback);
