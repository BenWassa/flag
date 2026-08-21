import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const MANIFEST_PATH = new URL('../map-sources/natural-earth.json', import.meta.url);

export async function readSourceManifest() {
  return JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
}

/**
 * Fetches one pinned Natural Earth source and refuses to return it unless the
 * bytes match the recorded digest. Generation must fail loudly on an upstream
 * change rather than quietly redrawing production geography.
 */
export async function fetchPinnedSource(name) {
  const manifest = await readSourceManifest();
  const source = manifest.sources[name];
  if (!source) throw new Error(`Natural Earth manifest has no "${name}" source.`);

  const url = `${manifest.rawBaseUrl}/${manifest.upstreamCommit}/${source.path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not fetch Natural Earth ${name}: ${response.status} ${response.statusText}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== source.sha256) {
    throw new Error(`Natural Earth ${name} sha256 mismatch: expected ${source.sha256}, received ${digest}.`);
  }

  return { url, bytes, source, manifest, json: () => JSON.parse(bytes.toString('utf8')) };
}
