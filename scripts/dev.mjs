import { createReadStream, existsSync, readdirSync, statSync, unwatchFile, watchFile } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';

const host = process.env.HOST || 'localhost';
const port = Number.parseInt(process.env.PORT || '5173', 10);
const root = resolve('dist');

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}

const initialBuild = spawnSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' });
if (initialBuild.error) {
  console.error(`Could not start the build: ${initialBuild.error.message}`);
  process.exit(1);
}
if (initialBuild.status !== 0) process.exit(initialBuild.status ?? 1);

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.webmanifest', 'application/manifest+json'],
]);

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || host}`);
  let pathname;

  try {
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = resolve(root, relativePath);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }

  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': contentTypes.get(extname(filePath)) || 'application/octet-stream',
  });
  if (request.method === 'HEAD') response.end();
  else createReadStream(filePath).pipe(response);
});

let buildProcess = null;
let rebuildQueued = false;
let rebuildTimer = null;

function rebuild() {
  if (buildProcess) {
    rebuildQueued = true;
    return;
  }

  console.log('\nChange detected. Rebuilding...');
  buildProcess = spawn(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' });
  buildProcess.on('exit', (code) => {
    buildProcess = null;
    if (code === 0) console.log('Rebuild complete.');
    else console.error('Rebuild failed; fix the errors above to try again.');

    if (rebuildQueued) {
      rebuildQueued = false;
      rebuild();
    }
  });
}

function scheduleRebuild() {
  if (rebuildTimer) clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(rebuild, 100);
}

const watchedPaths = new Set();

function collectDirectoryTree(directory, paths) {
  if (!existsSync(directory)) return;
  paths.add(resolve(directory));
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) collectDirectoryTree(entryPath, paths);
    else paths.add(entryPath);
  }
}

function refreshPollingWatches() {
  const paths = new Set();
  for (const directory of ['src', 'public']) collectDirectoryTree(directory, paths);
  for (const file of ['index.html', 'styles.css', 'map.css', 'map-cartography.css', 'outline.css', 'neighbors.css', 'tsconfig.json']) {
    if (existsSync(file)) paths.add(resolve(file));
  }

  for (const filePath of paths) {
    if (watchedPaths.has(filePath)) continue;
    watchedPaths.add(filePath);
    watchFile(filePath, { interval: 500 }, (current, previous) => {
      if (current.mtimeMs === previous.mtimeMs && current.size === previous.size) return;
      refreshPollingWatches();
      scheduleRebuild();
    });
  }
}

refreshPollingWatches();

server.listen(port, host, () => {
  console.log(`Flag Atlas is running at http://${host}:${port}`);
  console.log('Watching source and static assets for changes.');
});

function shutDown() {
  for (const filePath of watchedPaths) unwatchFile(filePath);
  if (rebuildTimer) clearTimeout(rebuildTimer);
  if (buildProcess) buildProcess.kill();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);
