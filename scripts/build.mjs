import { cp, mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

const command = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
const result = spawnSync(command, ['-p', 'tsconfig.json'], { stdio: 'inherit' });
if (result.error) {
  console.error(`Could not run ${command}: ${result.error.message}`);
  console.error('Run "npm install" first.');
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);

for (const file of ['index.html', 'styles.css', 'map.css']) {
  await cp(file, `dist/${file}`);
}

for (const file of ['manifest.webmanifest', 'sw.js']) {
  await cp(`public/${file}`, `dist/${file}`);
}

if (existsSync('public/icons')) {
  await cp('public/icons', 'dist/icons', { recursive: true });
}

console.log('Built Flag Atlas to dist/.');
