import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

function sorted(values) {
  return [...values].sort();
}

export async function verifyContinentContract({
  continentId,
  expectedCountryIds,
  expectedRegionIds,
  expectedRegionalCountryIds = expectedCountryIds,
  expectedNeighborCountryIds = expectedCountryIds,
  runtimeModulePath,
  maxRawBytes = 1_000_000,
  maxGzipBytes = 300_000,
}) {
  const mapScopes = await import('../.verify-dist/data/map-scopes.js');
  const maps = await import('../.verify-dist/data/maps/index.js');
  const support = await import('../.verify-dist/domain/scope-support.js');
  const learningScopes = await import('../.verify-dist/data/learning-scopes.js');

  const continent = mapScopes.getMapContinentConfig(continentId);
  assert.ok(continent, `${continentId} is registered as generated geography.`);
  assert.deepEqual(sorted(continent.countryIds), sorted(expectedCountryIds), `${continentId} generated country membership is exact.`);
  assert.deepEqual(
    sorted(continent.regions.map((region) => region.scope.id)),
    sorted(expectedRegionIds),
    `${continentId} generated region membership is exact.`,
  );

  const regionUnion = continent.regions.flatMap((region) => [...region.countryIds]);
  assert.equal(new Set(regionUnion).size, regionUnion.length, `${continentId} learner-facing regions do not duplicate countries.`);
  assert.deepEqual(
    sorted(new Set(regionUnion)),
    sorted(expectedRegionalCountryIds),
    `${continentId} learner-facing regional coverage is exact, including intentional cross-continent membership.`,
  );

  const continentScope = continent.scope;
  assert.deepEqual(
    sorted(learningScopes.countryIdsForLearningScope(continentScope)),
    sorted(expectedCountryIds),
    `${continentId} Flags membership shares the learner-scope source of truth.`,
  );
  for (const domain of ['flags', 'locations', 'outlines', 'neighbors']) {
    assert.equal(support.scopeSupportsDomain(continentScope, domain), true, `${continentId} supports ${domain}.`);
  }
  assert.deepEqual(sorted(support.countryIdsForSupportedScope(continentScope, 'locations')), sorted(expectedCountryIds));
  assert.deepEqual(sorted(support.countryIdsForSupportedScope(continentScope, 'outlines')), sorted(expectedCountryIds));
  assert.deepEqual(sorted(support.countryIdsForSupportedScope(continentScope, 'neighbors')), sorted(expectedNeighborCountryIds));

  const fullAsset = await maps.loadMapAsset(continentId);
  assert.ok(fullAsset, `${continentId} full-continent map asset loads.`);
  assert.deepEqual(sorted(fullAsset.countries.map((item) => item.countryId)), sorted(expectedCountryIds));
  assert.equal('rivers' in (fullAsset.water ?? {}), false, `${continentId} runtime water contract contains no rivers.`);
  assert.ok(fullAsset.initialFocus, `${continentId} has a deterministic full-continent focus.`);

  for (const regionId of expectedRegionIds) {
    const regionConfig = mapScopes.getMapScopeConfig(regionId);
    assert.ok(regionConfig, `${regionId} is registered.`);
    assert.equal(regionConfig.continentId, continentId, `${regionId} resolves to ${continentId}.`);
    const asset = await maps.loadMapAsset(regionId);
    assert.ok(asset, `${regionId} map asset loads through the shared continent module.`);
    assert.deepEqual(sorted(asset.countries.map((item) => item.countryId)), sorted(regionConfig.countryIds));
    assert.ok(asset.initialFocus, `${regionId} has a deterministic regional focus.`);
    assert.equal('rivers' in (asset.water ?? {}), false, `${regionId} inherits the no-rivers contract.`);
  }

  const mapLoaderSource = await readFile('src/data/maps/index.ts', 'utf8');
  assert.ok(mapLoaderSource.includes('continentLoaders'), 'Map loading is registry-driven.');
  assert.ok(mapLoaderSource.includes('continentDataPromises.delete(continentId)'), 'Failed lazy imports remain retryable.');

  if (runtimeModulePath) {
    const moduleStat = await stat(runtimeModulePath);
    const bytes = await readFile(runtimeModulePath);
    const gzipBytes = gzipSync(bytes, { level: 9 }).byteLength;
    assert.ok(moduleStat.size < maxRawBytes, `${continentId} runtime asset stays below ${maxRawBytes} raw bytes (${moduleStat.size}).`);
    assert.ok(gzipBytes < maxGzipBytes, `${continentId} runtime asset stays below ${maxGzipBytes} gzip bytes (${gzipBytes}).`);
    return { rawBytes: moduleStat.size, gzipBytes };
  }

  return null;
}
