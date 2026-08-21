import { cp, mkdir, rename, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { closeSync, existsSync, openSync, rmSync, unlinkSync, writeSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

/**
 * Two mechanisms cooperate here:
 *
 * 1. A staging directory + rename swap, so a reader (a `verify-*.mjs`
 *    script, or the dev server mid-request) never observes dist/ missing
 *    or half-written. `npm run dev` rebuilds on every source change; a
 *    concurrent `npm run verify` reading dist/ during an old
 *    rm-then-repopulate window would see it partially empty.
 * 2. A lock file, so two build.mjs *processes* running at the same time —
 *    the dev watcher's own rebuild firing while a separate `npm test`
 *    invocation is also building — don't both try to swap dist/ into place
 *    at once. Two renames racing each other can leave one process renaming
 *    a dist/ that the other has already moved aside, which previously
 *    surfaced as a spurious ENOENT crash even though the final build was
 *    fine. The lock serializes the swap instead of choreographing around it.
 */
const lockPath = '.build.lock';
const staging = `dist.build-${process.pid}-${Date.now()}`;

async function acquireLock() {
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      const fd = openSync(lockPath, 'wx');
      writeSync(fd, String(process.pid));
      closeSync(fd);
      return;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (Date.now() > deadline) {
        throw new Error(
          `Timed out waiting for another build to finish (lock file ${lockPath} still present). ` +
          'If no build is actually running, delete it and retry.',
        );
      }
      await delay(150);
    }
  }
}

function releaseLock() {
  try {
    unlinkSync(lockPath);
  } catch {
    // Already gone, or never acquired; nothing more to do.
  }
}

async function cleanupStaging() {
  await rm(staging, { recursive: true, force: true });
}

process.on('exit', () => {
  // process.on('exit') handlers cannot await, so this uses the sync fs API.
  // Best-effort cleanup on the way out (e.g. an uncaught exception) — a
  // leftover staging directory or lock file is harmless for the next build,
  // which recreates the former and (after the wait above) reclaims the latter.
  try {
    if (existsSync(staging)) rmSync(staging, { recursive: true, force: true });
  } catch {
    // Ignore: nothing left to do if the sync cleanup itself fails.
  }
  releaseLock();
});

await mkdir(staging, { recursive: true });

const command = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
const result = spawnSync(command, ['-p', 'tsconfig.json', '--outDir', staging], { stdio: 'inherit' });
if (result.error) {
  console.error(`Could not run ${command}: ${result.error.message}`);
  console.error('Run "npm install" first.');
  await cleanupStaging();
  process.exit(1);
}
if (result.status !== 0) {
  await cleanupStaging();
  process.exit(result.status ?? 1);
}

await cp('index.html', `${staging}/index.html`);

// Stylesheets live under src/styles/ but are served flat from dist/ root,
// matching the hrefs in index.html.
for (const file of [
  'styles.css',
  'atlas-theme.css',
  'progress.css',
  'map.css',
  'map-cartography.css',
  'outline.css',
  'neighbors.css',
]) {
  await cp(`src/styles/${file}`, `${staging}/${file}`);
}

for (const file of ['manifest.webmanifest', 'sw.js']) {
  await cp(`public/${file}`, `${staging}/${file}`);
}

if (existsSync('public/icons')) {
  await cp('public/icons', `${staging}/icons`, { recursive: true });
}

await acquireLock();
try {
  // Two renames rather than one: renaming staging directly over an existing
  // dist/ fails (EEXIST/ENOTEMPTY) on both POSIX and Windows for directories.
  // The old dist is moved aside first so the final swap-in is still a single
  // atomic rename with no window where dist/ is missing or partial. The lock
  // held around both renames is what makes this section safe against a
  // second build.mjs process doing the same thing concurrently.
  const previous = existsSync('dist') ? `dist.previous-${process.pid}-${Date.now()}` : null;
  if (previous) await rename('dist', previous);
  await rename(staging, 'dist');
  if (previous) await rm(previous, { recursive: true, force: true });
} finally {
  releaseLock();
}

console.log('Built Atlas to dist/.');
