#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

async function text(path) { return readFile(path, 'utf8'); }
async function save(path, value) { await writeFile(path, value); }
function exact(source, from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one match, found ${count}`);
  return source.replace(from, to);
}
function removeRegex(source, pattern, label) {
  const matches = source.match(pattern);
  if (!matches || matches.length !== 1) throw new Error(`${label}: expected one regex match, found ${matches?.length ?? 0}`);
  return source.replace(pattern, '');
}

// Domain contract.
{
  const path = 'src/domain/map-models.ts';
  let source = await text(path);
  source = exact(source,
    "  /** Major orientation rivers only. Never interactive. */\n  rivers?: MapNamedPath[];\n",
    '',
    'MapWaterLayers rivers',
  );
  await save(path, source);
}

// Source manifest: active production inputs should only describe retained runtime context.
{
  const path = 'scripts/map-sources/natural-earth.json';
  const manifest = JSON.parse(await text(path));
  if (!manifest.sources?.rivers) throw new Error('Natural Earth river source entry missing before migration.');
  delete manifest.sources.rivers;
  await save(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

// Generator: stop selecting, projecting, emitting and logging river paths.
{
  const path = 'scripts/generate-maps.mjs';
  let source = await text(path);
  source = removeRegex(source, /\nconst RIVERS = \[\n[\s\S]*?\n\];\n(?=\nfunction stableJson)/, 'RIVERS selection table');
  source = exact(source,
    "  const rivers = namedPhysicalPaths(sourceResults.rivers.json, sourceProjection, RIVERS, 'river');\n",
    '',
    'river projection',
  );
  source = exact(source,
    "    + `export const AFRICA_WATER: Readonly<MapWaterLayers> = ${serializeTs({ oceanPath, lakes, rivers })};\\n\\n`\n",
    "    + `export const AFRICA_WATER: Readonly<MapWaterLayers> = ${serializeTs({ oceanPath, lakes })};\\n\\n`\n",
    'AFRICA_WATER emission',
  );
  source = exact(source,
    "  console.log(`Water: ${lakes.length} lakes/reservoirs, ${rivers.length} major rivers.`);\n",
    "  console.log(`Water: ${lakes.length} lakes/reservoirs; linear river context intentionally excluded.`);\n",
    'water logging',
  );
  await save(path, source);
}

// Runtime physical-context optimizer.
{
  const path = 'scripts/optimize-map-runtime.mjs';
  let source = await text(path);
  source = exact(source,
    "  lakes: 0.15,\n  rivers: 0.2,\n",
    "  lakes: 0.15,\n",
    'river optimizer tolerance',
  );
  source = exact(source,
    "for (const river of water.rivers ?? []) river.path = simplifySvgPath(river.path, PHYSICAL_TOLERANCE.rivers);\n",
    '',
    'river optimizer loop',
  );
  source = exact(source,
    "console.log(`Physical path tolerances: ocean ${PHYSICAL_TOLERANCE.ocean}, lakes ${PHYSICAL_TOLERANCE.lakes}, rivers ${PHYSICAL_TOLERANCE.rivers}; final path precision ${PATH_DIGITS} decimal.`);\n",
    "console.log(`Physical path tolerances: ocean ${PHYSICAL_TOLERANCE.ocean}, lakes ${PHYSICAL_TOLERANCE.lakes}; final path precision ${PATH_DIGITS} decimal.`);\n",
    'optimizer logging',
  );
  await save(path, source);
}

// Shared map renderer (Locations).
{
  const path = 'src/ui/components/map.ts';
  let source = await text(path);
  source = exact(source,
    "    <g class=\"map-water map-water--rivers\" aria-hidden=\"true\">\n      ${(water?.rivers ?? []).map((item) => `<path data-water-name=\"${item.name}\" d=\"${item.path}\" />`).join('')}\n    </g>\n",
    '',
    'Locations river group',
  );
  await save(path, source);
}

// Neighbours map renderer.
{
  const path = 'src/ui/components/neighbor-map.ts';
  let source = await text(path);
  source = exact(source,
    "    <g class=\"map-water map-water--rivers\" aria-hidden=\"true\">\n      ${(asset.water?.rivers ?? []).map((item) => `<path data-water-name=\"${escapeHtml(item.name)}\" d=\"${escapeHtml(item.path)}\" />`).join('')}\n    </g>\n",
    '',
    'Neighbours river group',
  );
  await save(path, source);
}

// Launcher map renderer.
{
  const path = 'src/ui/components/launcher-map.ts';
  let source = await text(path);
  source = exact(source,
    "    <g class=\"launcher-map-water launcher-map-water--rivers\">\n      ${(asset.water?.rivers ?? []).map((item) => `<path d=\"${item.path}\" />`).join('')}\n    </g>\n",
    '',
    'launcher river group',
  );
  await save(path, source);
}

// Shared palette token.
{
  const path = 'atlas-theme.css';
  let source = await text(path);
  source = exact(source, '  --map-water-line: #6f91ad;\n', '', 'river palette token');
  await save(path, source);
}

// Shared cartography CSS.
{
  const path = 'map-cartography.css';
  let source = await text(path);
  source = removeRegex(source, /\n\.map-water--rivers path \{\n[\s\S]*?\n\}\n/, 'river cartography rule');
  source = exact(source,
    "  .map-coastline,\n  .map-shared-boundary,\n  .map-water--rivers path { stroke: CanvasText; }\n",
    "  .map-coastline,\n  .map-shared-boundary { stroke: CanvasText; }\n",
    'river forced-colours selector',
  );
  await save(path, source);
}

// Launcher river styling.
{
  const path = 'styles.css';
  let source = await text(path);
  source = removeRegex(source, /\n\.launcher-map-water--rivers path \{\n[\s\S]*?\n\}\n/, 'launcher river rule');
  // Forced-colours selector may include the launcher river class; remove the selector line if present.
  source = source.replace(/\n\s*\.launcher-map-water--rivers path,?/g, '');
  await save(path, source);
}

// Cartography verifier: replace positive river requirements with explicit absence contract.
{
  const path = 'scripts/verify-cartography.mjs';
  let source = await text(path);
  source = removeRegex(source,
    /const riverNames = new Set\(AFRICA_WATER\.rivers\?\.map\(\(item\) => item\.name\)\);\nfor \(const name of \['Nile', 'Congo', 'Niger', 'Zambezi'\]\) \{\n  assert\.ok\(riverNames\.has\(name\), `\$\{name\} is retained as restrained river context\.`\);\n\}\n/,
    'river-name regression block',
  );
  source = exact(source,
    "assert.equal(provenance.sources.rivers.version, '5.0.0');\n",
    "assert.equal('rivers' in provenance.sources, false, 'River source is not part of active production provenance.');\n",
    'river provenance assertion',
  );
  source = exact(source,
    "assert.equal(provenance.runtimeOptimization.physicalTolerance.rivers, 0.2);\n",
    "assert.equal('rivers' in provenance.runtimeOptimization.physicalTolerance, false, 'Runtime optimisation has no river tolerance.');\n",
    'river tolerance assertion',
  );
  source = exact(source,
    "assert.ok(html.includes('map-water--rivers'), 'Renderer includes restrained river layer.');\n",
    "assert.ok(!html.includes('map-water--rivers'), 'Renderer emits no river layer.');\n",
    'river renderer assertion',
  );
  source = exact(source,
    "  + `${AFRICA_WATER.lakes?.length ?? 0} lakes, ${AFRICA_WATER.rivers?.length ?? 0} rivers, ${africaModule.size} raw / ${africaGzipBytes} gzip bytes.`,\n",
    "  + `${AFRICA_WATER.lakes?.length ?? 0} lakes, no rivers, ${africaModule.size} raw / ${africaGzipBytes} gzip bytes.`,\n",
    'cartography verifier log',
  );
  const oceanAssertion = "assert.ok((AFRICA_WATER.oceanPath?.length ?? 0) > 1000, 'Ocean is source-derived instead of only a canvas color.');\n";
  source = exact(source, oceanAssertion, oceanAssertion + "assert.equal('rivers' in AFRICA_WATER, false, 'Generated runtime water contract contains no river path data.');\n", 'runtime water absence assertion');
  const cssAssertion = "assert.ok(cartographyCss.includes('pointer-events: none'), 'Water/boundary context cannot intercept country taps.');\n";
  source = exact(source, cssAssertion, cssAssertion + "assert.ok(!cartographyCss.includes('map-water--rivers'), 'Cartography CSS contains no river layer styling.');\n", 'river CSS absence assertion');
  await save(path, source);
}

// Shared map-contrast verifier: river colour is no longer a semantic token.
{
  const path = 'scripts/verify-map-contrast.mjs';
  let source = await text(path);
  source = exact(source, "  '--map-water-line',\n", '', 'map water-line token verifier');
  source = exact(source,
    "  ['launcher', launcher, ['--map-ocean', '--map-inland-water', '--map-water-line', '--map-context-land', '--map-active-land', '--map-active-border']],\n",
    "  ['launcher', launcher, ['--map-ocean', '--map-inland-water', '--map-context-land', '--map-active-land', '--map-active-border']],\n",
    'launcher token verifier',
  );
  const finalLog = "console.log('Map contrast verification passed: one neutral token family serves launcher, Locations and Neighbours with semantic and forced-colours precedence.');\n";
  source = exact(source, finalLog,
    "for (const css of [theme, launcher, locations, cartography, neighbours]) {\n  assert.ok(!css.includes('--map-water-line'), 'Obsolete river colour token is absent.');\n  assert.ok(!css.includes('map-water--rivers') && !css.includes('launcher-map-water--rivers'), 'No map surface retains river styling.');\n}\n\n" + finalLog,
    'contrast river absence verifier',
  );
  await save(path, source);
}

// Durable architecture documentation.
{
  const path = 'docs/architecture/cartography.md';
  let source = await text(path);
  source = source
    .replace('→ physical-water projection → scale-aware runtime optimization', '→ retained ocean/lake projection → scale-aware runtime optimization')
    .replace('| Rivers + lake centerlines | restrained major-river context | 5.0.0 |\n', '')
    .replace('companion physical-water themes;', 'companion physical-water themes, from which Atlas retains ocean and major lakes;')
    .replace('applies projection-space Ramer-Douglas-Peucker only to **non-interactive physical context**:\n  - ocean: `0.4` canvas unit;\n  - lakes: `0.15`;\n  - rivers: `0.2`;', 'applies projection-space Ramer-Douglas-Peucker only to **non-interactive retained physical context**:\n  - ocean: `0.4` canvas unit;\n  - lakes: `0.15`;')
    .replace('3. selected inland water and restrained rivers;\n4. one topology-derived shared political-border mesh;\n5. one topology-derived exterior coastline mesh.', '3. selected inland lakes/reservoirs;\n4. one topology-derived shared political-border mesh;\n5. one topology-derived exterior coastline mesh.')
    .replace('- source-derived ocean/lake/river paths;', '- source-derived ocean/lake paths;')
    .replace(/\nRequired major-river context:\n\n- Nile\n- Congo\n- Niger\n- Zambezi\n\nThe generated asset currently retains five major rivers including the Orange River\. Minor drainage is deliberately excluded\.\n/, '\nLinear river features are intentionally excluded from runtime cartography. At Atlas phone scale, river centre-lines can read like political borders and therefore compete with the boundary-recognition task. This is a product-level clarity decision rather than a data-source limitation.\n')
    .replace('Ocean, lakes, and rivers use the **same projection/canvas** as political geography. They are `aria-hidden` cartographic context and `pointer-events: none`.', 'Ocean and retained lakes use the **same projection/canvas** as political geography. They are `aria-hidden` cartographic context and `pointer-events: none`.')
    .replace('- required water features;', '- required ocean/lake context and explicit river exclusion;')
    .replace('for extent, seam quality, water restraint, islands/callouts, and unobstructed geography.', 'for extent, seam quality, retained water restraint, border clarity, islands/callouts, and unobstructed geography.');
  const policyHeading = '## Water-context policy\n\nPhysical context exists for geographic recognition, not decoration.\n';
  if (!source.includes(policyHeading)) throw new Error('Water-context policy heading changed unexpectedly.');
  source = source.replace(policyHeading, policyHeading + '\nAtlas deliberately excludes linear rivers from runtime maps because they can be confused with political borders. Ocean and major lakes/reservoirs remain because their filled water areas provide orientation without creating competing border-like linework.\n');
  await save(path, source);
}

// PWA cache: changed shell CSS must invalidate installed copies.
{
  const path = 'public/sw.js';
  let source = await text(path);
  source = exact(source,
    "// v17 ships the Neighbours mobile keyboard-stability layout/runtime update.\n",
    "// v18 removes river linework from shared runtime cartography to keep political borders unambiguous.\n// v17 ships the Neighbours mobile keyboard-stability layout/runtime update.\n",
    'service-worker lineage comment',
  );
  source = exact(source, "const VERSION = 'flag-atlas-v17';", "const VERSION = 'flag-atlas-v18';", 'service-worker cache version');
  await save(path, source);
}

console.log('Issue #54 source migration applied. Run npm run maps:generate before verification.');
