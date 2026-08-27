import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = '.verify-dist';
const outputPath = resolve(output);

// Keep verifier modules outside the deployable Vite/Workbox artifact. The
// path is fixed rather than caller-supplied, so cleanup cannot target a
// workspace-wide or arbitrary directory.
if (process.argv.includes('--clean')) {
  if (existsSync(outputPath)) await rm(outputPath, { recursive: true, force: true });
  console.log('Removed verifier-only output.');
  process.exit(0);
}

if (existsSync(outputPath)) await rm(outputPath, { recursive: true, force: true });

const command = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
const result = spawnSync(command, ['-p', 'tsconfig.verify.json'], { stdio: 'inherit' });
if (result.error) {
  console.error(`Could not run ${command}: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
