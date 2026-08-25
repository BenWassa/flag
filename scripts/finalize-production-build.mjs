import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

// tsconfig.verify temporarily emits source modules into dist for the plain-Node
// verifier family. Development-only modules must still not become deployable
// static files merely because that compatibility emit follows the Vite build.
const developmentOnlyOutputs = [
  'dist/infrastructure/development-sandbox.js',
  'dist/infrastructure/development-sandbox.test.js',
  'dist/react/components/DevelopmentSandboxPanel.js',
  'dist/react/useAuth.test.js',
];

for (const relativePath of developmentOnlyOutputs) {
  const path = resolve(relativePath);
  if (existsSync(path)) rmSync(path);
}
const productionSurfaces = ['dist/app.js', 'dist/.vite/manifest.json'];
for (const relativePath of productionSurfaces) {
  const source = readFileSync(resolve(relativePath), 'utf8');
  if (/DevelopmentSandboxPanel|Seed an edge case|Complete sandbox JSON/.test(source)) {
    throw new Error(`Development sandbox UI leaked into ${relativePath}.`);
  }
}
