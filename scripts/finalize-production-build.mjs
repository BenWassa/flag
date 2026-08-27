import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Development-only modules must never become deployable static files. The
// verifier-only TypeScript emit is now isolated in .verify-dist/ before this
// production guard runs.
const developmentOnlyOutputs = [
  'dist/infrastructure/development-sandbox.js',
  'dist/infrastructure/development-sandbox.test.js',
  'dist/react/components/DevelopmentSandboxPanel.js',
  'dist/react/useAuth.test.js',
];

for (const relativePath of developmentOnlyOutputs) {
  const path = resolve(relativePath);
  if (existsSync(path)) throw new Error(`Development-only output leaked into deployable dist/: ${relativePath}.`);
}
const productionSurfaces = ['dist/app.js', 'dist/.vite/manifest.json'];
for (const relativePath of productionSurfaces) {
  const source = readFileSync(resolve(relativePath), 'utf8');
  if (/DevelopmentSandboxPanel|Seed an edge case|Complete sandbox JSON/.test(source)) {
    throw new Error(`Development sandbox UI leaked into ${relativePath}.`);
  }
}
