#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
const path = 'docs/architecture/cartography.md';
let source = await readFile(path, 'utf8');
const from = 'The committed generated TypeScript source is **918,944 bytes**. Standard CI run #84 built `dist/data/maps/africa.js` at **920,449 bytes raw / 243,286 bytes gzip**, within the `<1 MB raw` / `<300 KB gzip` production budget.';
const to = 'The Issue #54 generated TypeScript source is **919,901 bytes** after runtime optimisation. Its verified production build emits `dist/data/maps/africa.js` at **921,370 bytes raw / 243,737 bytes gzip**, within the `<1 MB raw` / `<300 KB gzip` production budget.';
if (!source.includes(from)) throw new Error('Expected pre-Issue #54 runtime-size paragraph was not found.');
source = source.replace(from, to);
await writeFile(path, source);
