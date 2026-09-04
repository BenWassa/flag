import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

// This is intentionally a fixed, ignored directory. The harness must never
// accept an arbitrary output path because it clears the previous fixtures.
const outputRoot = resolve('.pwa-runtime-builds');
const builds = [
  { marker: 'runtime-a', buildIdentity: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
  { marker: 'runtime-b', buildIdentity: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
];
const vite = resolve('node_modules/vite/bin/vite.js');

function digest(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function build({ marker, buildIdentity }) {
  const output = resolve(outputRoot, marker);
  const result = spawnSync(process.execPath, [vite, 'build', '--outDir', output], {
    cwd: process.cwd(),
    env: { ...process.env, ATLAS_BUILD_SHA: buildIdentity, GITHUB_SHA: '' },
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(`PWA runtime fixture build ${marker} failed.`);
  }

  for (const required of ['index.html', 'app.js', 'sw.js', '.vite/manifest.json']) {
    if (!existsSync(resolve(output, required))) throw new Error(`PWA runtime fixture ${marker} is missing ${required}.`);
  }
  const index = readFileSync(resolve(output, 'index.html'), 'utf8');
  if (!index.includes(`name="atlas-build" content="${buildIdentity}"`)) {
    throw new Error(`PWA runtime fixture ${marker} is missing its exact build identity.`);
  }
  const serviceWorker = readFileSync(resolve(output, 'sw.js'), 'utf8');
  if (!serviceWorker.includes('flag-atlas-runtime-v1') || !serviceWorker.includes(buildIdentity) || !serviceWorker.includes('index.html')) {
    throw new Error(`PWA runtime fixture ${marker} does not contain the production Workbox/update policy.`);
  }

  return {
    marker,
    buildIdentity,
    files: Object.fromEntries(['index.html', 'app.js', 'sw.js'].map((file) => [file, digest(resolve(output, file))])),
  };
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
const artifacts = builds.map(build);

if (artifacts[0].files['sw.js'] === artifacts[1].files['sw.js']) {
  throw new Error('PWA runtime fixtures must have distinct service-worker artifacts.');
}

const manifest = { artifacts };
await writeFile(resolve(outputRoot, 'artifact-identities.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest));
