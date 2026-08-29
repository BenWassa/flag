import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const config = JSON.parse(await readFile(resolve(root, 'config/spatial-preview.json'), 'utf8'));
const sourceRoot = resolve(root, process.env.ATLAS_SPATIAL_PREVIEW_SOURCE ?? '.spatial-preview-source');
const sourceDist = resolve(sourceRoot, 'dist');
const rootDist = resolve(root, 'dist');
const target = resolve(rootDist, config.deployPath);

const actualSourceCommit = execFileSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(actualSourceCommit, config.sourceCommit, 'Spatial preview checkout must match the pinned source commit.');

const [rootIndex, rootServiceWorker, previewIndex, previewServiceWorker, previewManifest] = await Promise.all([
  readFile(resolve(rootDist, 'index.html'), 'utf8'),
  readFile(resolve(rootDist, 'sw.js'), 'utf8'),
  readFile(resolve(sourceDist, 'index.html'), 'utf8'),
  readFile(resolve(sourceDist, 'sw.js'), 'utf8'),
  readFile(resolve(sourceDist, 'manifest.webmanifest'), 'utf8'),
]);

assert.match(rootIndex, /<title>Atlas<\/title>/, 'Root artifact remains classic Atlas.');
assert.equal(rootServiceWorker.includes(config.cachePrefix), false, 'Classic service worker never adopts the preview cache namespace.');
assert.ok(previewServiceWorker.includes(config.cachePrefix), 'Preview service worker uses its isolated cache namespace.');
assert.match(previewIndex, /<title>Atlas Spatial Preview<\/title>/, 'Preview document is explicitly identified.');
assert.equal(JSON.parse(previewManifest).name, 'Atlas Spatial Preview', 'Preview manifest has a distinct install identity.');

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(sourceDist, target, { recursive: true });
await writeFile(resolve(target, 'preview-source.json'), `${JSON.stringify({ ...config, assembledFrom: actualSourceCommit }, null, 2)}\n`);

console.log(`Spatial Atlas preview ${actualSourceCommit.slice(0, 7)} assembled at dist/${config.deployPath}/.`);
