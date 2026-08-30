import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = new URL('../../', import.meta.url);
const dist = new URL('../../dist/', import.meta.url);

if (!existsSync(dist)) {
  console.error('dist/ is missing. Run npm run build before measuring the spatial baseline.');
  process.exit(1);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const textLike = new Set(['.css', '.html', '.js', '.json', '.svg', '.txt', '.webmanifest', '.xml']);
function extension(path) {
  const dot = path.lastIndexOf('.');
  return dot >= 0 ? path.slice(dot) : '';
}

const distPath = dist.pathname;
const files = walk(distPath).map((path) => {
  const buffer = readFileSync(path);
  const rel = relative(distPath, path).split(sep).join('/');
  const ext = extension(rel);
  return {
    path: rel,
    bytes: buffer.byteLength,
    gzipBytes: textLike.has(ext) ? gzipSync(buffer).byteLength : null,
  };
}).sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));

const indexPath = join(distPath, 'index.html');
const index = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
const entryScripts = [...index.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map((match) => match[1]);
const entryStyles = [...index.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]*>/g)]
  .map((match) => match[1])
  .filter((href) => href.includes('.css'));

const geography = files.filter((file) => /(?:^|\/)(africa|south-america|europe|asia|north-america|oceania)-[^/]+\.js$/i.test(file.path));
const serviceWorkers = files.filter((file) => /(^|\/)(sw|service-worker)[^/]*\.js$/i.test(file.path));

const result = {
  evidenceClass: 'production artifact measurement',
  generatedAt: new Date().toISOString(),
  dist: {
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    textLikeGzipBytes: files.reduce((sum, file) => sum + (file.gzipBytes ?? 0), 0),
  },
  entryScripts,
  entryStyles,
  geography,
  serviceWorkers,
  files,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
