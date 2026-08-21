import { readFile, writeFile } from 'node:fs/promises';

function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`Missing ${label}`);
  return source.replace(before, after);
}
function replaceBetween(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Missing range ${label}`);
  return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

{
  const path = new URL('../src/app.ts', import.meta.url);
  let source = await readFile(path, 'utf8');
  source = replaceOnce(
    source,
    "import { COUNTRIES } from './data/countries.js';\nimport { loadMapAsset } from './data/maps/index.js';\nimport { AFRICA_LAND_ADJACENCY } from './data/neighbors/index.js';",
    "import { COUNTRIES } from './data/countries.js';\nimport { getMapContinentConfigForScope } from './data/map-scopes.js';\nimport { loadMapAsset } from './data/maps/index.js';\nimport { NEIGHBOR_GUESS_COUNTRY_IDS } from './data/neighbors/index.js';",
    'app geography imports',
  );
  source = replaceOnce(
    source,
    'const allowedNeighborCountryIds = new Set(Object.keys(AFRICA_LAND_ADJACENCY));',
    'const allowedNeighborCountryIds = new Set(NEIGHBOR_GUESS_COUNTRY_IDS);',
    'global neighbour guess set',
  );
  source = replaceOnce(
    source,
    'let launcherMapAsset: MapRegionAsset | null = null;\nlet launcherMapRequest = 0;',
    'let launcherMapAsset: MapRegionAsset | null = null;\nlet launcherMapScopeId: string | null = null;\nlet launcherMapRequest = 0;',
    'launcher cache',
  );
  source = replaceOnce(
    source,
    'function routeUsesLauncherMap(route: AppRoute): route is LearningRoute {',
    'function routeUsesLauncherMap(route: AppRoute): route is LearningRoute & { scope: StudyScope } {',
    'launcher type guard',
  );
  const hydrate = `async function hydrateLauncherMap(route: AppRoute): Promise<void> {\n  const request = ++launcherMapRequest;\n  if (!routeUsesLauncherMap(route)) return;\n\n  const continent = route.scope.id ? getMapContinentConfigForScope(route.scope.id) : undefined;\n  const continentScopeId = continent?.scope.id;\n  const host = root.querySelector<HTMLElement>('[data-launcher-map-slot]');\n  if (!host || !continentScopeId) return;\n  if (launcherMapAsset && launcherMapScopeId === continentScopeId) return;\n\n  try {\n    const asset = await loadMapAsset(continentScopeId);\n    if (!asset) throw new Error(\`${'${route.scope.label}'} geometry unavailable.\`);\n    launcherMapAsset = asset;\n    launcherMapScopeId = continentScopeId;\n\n    if (request !== launcherMapRequest || !host.isConnected || !routesEqual(currentRoute, route)) return;\n    const selectedRegionId = route.scope.kind === 'region' ? route.scope.id : undefined;\n    host.innerHTML = renderLauncherMap(asset, route.domain, selectedRegionId);\n  } catch {\n    if (request !== launcherMapRequest || !host.isConnected || !routesEqual(currentRoute, route)) return;\n    host.innerHTML = '<p class="launcher-map-error">Map unavailable. Choose a region from the list.</p>';\n  }\n}`;
  source = replaceBetween(source, 'async function hydrateLauncherMap(route: AppRoute): Promise<void> {', '\n\nfunction applyRoute(', hydrate, 'launcher hydration');
  source = replaceOnce(
    source,
    '  currentRoute = route;\n  switch (route.name) {',
    `  currentRoute = route;\n  if (routeUsesLauncherMap(route)) {\n    const parentScopeId = route.scope.id\n      ? getMapContinentConfigForScope(route.scope.id)?.scope.id ?? null\n      : null;\n    if (parentScopeId !== launcherMapScopeId) launcherMapAsset = null;\n  }\n  switch (route.name) {`,
    'launcher cache invalidation',
  );
  await writeFile(path, source);
}

{
  const path = new URL('../scripts/verify-ia.mjs', import.meta.url);
  let source = await readFile(path, 'utf8');
  const replacement = `const continentLoaderSource = sourceSection(\n  mapLoader,\n  'function loadContinentData(',\n  'function cloneNamedPath(',\n  'Generic continent data loader',\n);\nassert.ok(mapLoader.includes(\"africa: async () => {\"), 'Africa remains registered in the generic lazy continent loader.');\nassert.ok(mapLoader.includes(\"await import('./africa.js')\"), 'Africa remains a dynamic continent chunk.');\nassert.ok(continentLoaderSource.includes('const loader = continentLoaders[continentId]'), 'Generic loader resolves the requested continent through the registry.');\nassert.ok(continentLoaderSource.includes('continentDataPromises.delete(continentId)'), 'A failed continent import clears the memoised promise for retry.');\nassert.ok(continentLoaderSource.includes('throw error'), 'A failed continent import still propagates to the caller error boundary.');\n`;
  source = replaceBetween(source, 'const africaLoaderSource = sourceSection(', "\nassert.ok(\n  app.includes('store.persisting && store.mapPersisting && store.outlinePersisting && store.neighborPersisting')", replacement, 'IA loader verifier');
  await writeFile(path, source);
}

{
  const path = new URL('../package.json', import.meta.url);
  const pkg = JSON.parse(await readFile(path, 'utf8'));
  if (!pkg.scripts.verify.includes('verify-continent-foundation.mjs')) {
    pkg.scripts.verify = pkg.scripts.verify.replace(
      'node scripts/verify-cartography.mjs &&',
      'node scripts/verify-cartography.mjs && node scripts/verify-continent-foundation.mjs &&',
    );
  }
  await writeFile(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

console.log('Reconciled Issue 57 with current round architecture.');
