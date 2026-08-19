#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

function run(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Forward source-control flags (notably --update-hashes) to the geodata
// generator itself. Runtime optimization is deterministic and takes no flags.
run('scripts/generate-maps.mjs', process.argv.slice(2));
run('scripts/optimize-map-runtime.mjs');
