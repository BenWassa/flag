import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from '@playwright/test';

const root = process.cwd();
const evidenceDir = resolve(root, 'spike-evidence-maplibre');
mkdirSync(evidenceDir, { recursive: true });

function command(command, args) {
  const run = spawnSync(command, args, { cwd: root, encoding: 'utf8', shell: false, env: process.env });
  return { command: [command, ...args].join(' '), status: run.status, stdout: run.stdout ?? '', stderr: run.stderr ?? '' };
}
async function waitFor(url, timeout = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try { const response = await fetch(url); if (response.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server did not become ready: ${url}`);
}
async function withServer(args, port, fn) {
  const child = spawn('npx', ['vite', ...args, '--host', '127.0.0.1', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  try { await waitFor(`http://127.0.0.1:${port}`); return await fn(`http://127.0.0.1:${port}`); }
  finally { child.kill('SIGTERM'); }
}
function packageVersion(name) { return JSON.parse(readFileSync(resolve(root, 'node_modules', name, 'package.json'), 'utf8')).version; }

async function dispatchTouch(page, points) {
  return page.evaluate(({ points }) => {
    const canvas = document.querySelector('.maplibregl-canvas');
    if (!canvas) throw new Error('MapLibre canvas missing');
    for (const item of points) {
      canvas.dispatchEvent(new PointerEvent(item.type, {
        bubbles: true, cancelable: true, pointerId: item.id, pointerType: 'touch', isPrimary: item.id === 1,
        clientX: item.x, clientY: item.y, buttons: item.type === 'pointerup' ? 0 : 1,
      }));
    }
  }, { points });
}

async function runBrowser(baseURL, mode) {
  const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const consoleErrors = [];
  const externalRequests = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', (request) => { if (!request.url().startsWith(baseURL) && !request.url().startsWith('blob:')) externalRequests.push(request.url()); });
  const result = { mode, initialised: false, consoleErrors, externalRequests };
  try {
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.getByTestId('load').click();
    await page.locator('.maplibregl-canvas').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForFunction(() => Boolean(window.__spatialMapLibreMap?.loaded?.()), null, { timeout: 15000 });
    result.initialised = true;
    await page.waitForTimeout(1100);
    result.afterInitialise = await page.evaluate(() => structuredClone(window.__spatialMapLibre));
    await page.screenshot({ path: resolve(evidenceDir, `${mode}-world.png`), fullPage: true });

    const idleStart = await page.evaluate(() => window.__spatialMapLibre.renderCount);
    await page.waitForTimeout(1200);
    const idleEnd = await page.evaluate(() => window.__spatialMapLibre.renderCount);
    result.idleFrames = idleEnd - idleStart;

    await page.getByRole('button', { name: 'Africa', exact: true }).click();
    await page.waitForTimeout(900);
    result.domDestination = await page.getByTestId('destination').textContent();
    result.africaCamera = await page.evaluate(() => structuredClone(window.__spatialMapLibre.lastCamera));
    await page.screenshot({ path: resolve(evidenceDir, `${mode}-africa.png`), fullPage: true });

    await page.evaluate(() => window.__spatialMapLibreActions.navigate('world'));
    await page.waitForTimeout(900);
    const canvas = page.locator('.maplibregl-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('canvas has no bounding box');
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
    await page.waitForTimeout(350);
    result.pickDestination = await page.getByTestId('destination').textContent();

    await page.evaluate(() => window.__spatialMapLibreActions.navigate('world'));
    await page.waitForTimeout(180);
    await page.evaluate(() => window.__spatialMapLibreActions.navigate('africa'));
    await page.waitForTimeout(50);
    await page.evaluate(() => window.__spatialMapLibreActions.navigate('west-africa'));
    await page.waitForTimeout(50);
    await page.evaluate(() => window.__spatialMapLibreActions.back());
    await page.waitForTimeout(1100);
    result.interruptionDestination = await page.getByTestId('destination').textContent();
    result.interruptionCamera = await page.evaluate(() => structuredClone(window.__spatialMapLibre.lastCamera));

    const beforeRotate = await page.evaluate(() => structuredClone(window.__spatialMapLibre.lastCamera));
    await dispatchTouch(page, [
      { type: 'pointerdown', id: 1, x: 195, y: 380 }, { type: 'pointermove', id: 1, x: 250, y: 390 }, { type: 'pointerup', id: 1, x: 250, y: 390 },
    ]);
    await page.waitForTimeout(500);
    const afterRotate = await page.evaluate(() => structuredClone(window.__spatialMapLibre.lastCamera));
    result.syntheticOneFingerChangedCamera = JSON.stringify(beforeRotate) !== JSON.stringify(afterRotate);

    const beforePinch = await page.evaluate(() => structuredClone(window.__spatialMapLibre.lastCamera));
    await dispatchTouch(page, [
      { type: 'pointerdown', id: 1, x: 165, y: 380 }, { type: 'pointerdown', id: 2, x: 225, y: 380 },
      { type: 'pointermove', id: 1, x: 130, y: 380 }, { type: 'pointermove', id: 2, x: 260, y: 380 },
      { type: 'pointerup', id: 1, x: 130, y: 380 }, { type: 'pointerup', id: 2, x: 260, y: 380 },
    ]);
    await page.waitForTimeout(500);
    const afterPinch = await page.evaluate(() => structuredClone(window.__spatialMapLibre.lastCamera));
    result.syntheticPinchChangedCamera = JSON.stringify(beforePinch) !== JSON.stringify(afterPinch);

    const pointerCount = await page.evaluate(() => window.__spatialMapLibre.canvasPointerDowns.length);
    await dispatchTouch(page, [{ type: 'pointerdown', id: 1, x: 5, y: 380 }, { type: 'pointerup', id: 1, x: 5, y: 380 }]);
    result.leftGutterDeliveredToCanvas = await page.evaluate((before) => window.__spatialMapLibre.canvasPointerDowns.length > before, pointerCount);

    result.mapCreatesBeforeSequence = await page.evaluate(() => window.__spatialMapLibre.mapCreates);
    await page.evaluate(() => window.__spatialMapLibreActions.navigate('world'));
    await page.waitForTimeout(80);
    await page.evaluate(() => window.__spatialMapLibreActions.navigate('africa'));
    await page.waitForTimeout(80);
    await page.evaluate(() => window.__spatialMapLibreActions.navigate('west-africa'));
    await page.waitForTimeout(80);
    await page.evaluate(() => window.__spatialMapLibreActions.back());
    await page.waitForTimeout(80);
    await page.evaluate(() => window.__spatialMapLibreActions.back());
    await page.waitForTimeout(900);
    result.mapCreatesAfterSequence = await page.evaluate(() => window.__spatialMapLibre.mapCreates);
    result.mapRemovesAfterSequence = await page.evaluate(() => window.__spatialMapLibre.mapRemoves);
    result.commonSequenceDestination = await page.getByTestId('destination').textContent();
    result.projection = await page.evaluate(() => structuredClone(window.__spatialMapLibre.projection));

    result.forcedLoss = await page.evaluate(() => {
      const map = window.__spatialMapLibreMap;
      const canvas = map?.getCanvas?.();
      const gl = canvas?.getContext('webgl2') ?? canvas?.getContext('webgl');
      const ext = gl?.getExtension('WEBGL_lose_context');
      if (!ext) return { available: false };
      ext.loseContext();
      window.__spatialMapLibreLoseExtension = ext;
      return { available: true };
    });
    await page.waitForTimeout(350);
    result.afterForcedLoss = await page.evaluate(() => structuredClone(window.__spatialMapLibre));
    result.forcedRestore = await page.evaluate(() => {
      const ext = window.__spatialMapLibreLoseExtension;
      if (!ext?.restoreContext) return false;
      ext.restoreContext(); return true;
    });
    await page.waitForTimeout(600);
    result.afterForcedRestore = await page.evaluate(() => structuredClone(window.__spatialMapLibre));
    await page.screenshot({ path: resolve(evidenceDir, `${mode}-final.png`), fullPage: true });
  } catch (error) { result.error = String(error?.stack ?? error); }
  finally { await browser.close(); }
  return result;
}

function buildStats() {
  const dir = resolve(root, 'dist-spike-maplibre', 'assets');
  const entries = readdirSync(dir).map((name) => {
    const data = readFileSync(resolve(dir, name));
    return { name, raw: data.length, gzip: gzipSync(data).length, kind: name.endsWith('.js') ? 'js' : name.endsWith('.css') ? 'css' : 'other' };
  }).sort((a, b) => b.raw - a.raw);
  const js = entries.filter((e) => e.kind === 'js');
  const entry = js.find((e) => e.name.startsWith('main-')) ?? js[js.length - 1];
  return {
    files: entries,
    lazyJsRaw: js.filter((e) => e !== entry).reduce((s, e) => s + e.raw, 0),
    lazyJsGzip: js.filter((e) => e !== entry).reduce((s, e) => s + e.gzip, 0),
    cssRaw: entries.filter((e) => e.kind === 'css').reduce((s, e) => s + e.raw, 0),
    cssGzip: entries.filter((e) => e.kind === 'css').reduce((s, e) => s + e.gzip, 0),
  };
}

const results = {
  candidate: 'MapLibre GL JS', branchSha: process.env.GITHUB_SHA ?? null, node: process.version,
  packages: { react: packageVersion('react'), reactDom: packageVersion('react-dom'), vite: packageVersion('vite'), maplibre: packageVersion('maplibre-gl') },
};
results.existingTests = command('npm', ['test']);
results.typecheck = command('npx', ['tsc', '-p', 'experiments/spatial-maplibre/tsconfig.json']);
results.build = command('npx', ['vite', 'build', '--config', 'experiments/spatial-maplibre/vite.config.ts']);
if (results.build.status === 0) results.bundle = buildStats();
results.dev = await withServer(['--config', 'experiments/spatial-maplibre/vite.config.ts'], 4191, (url) => runBrowser(url, 'dev'));
if (results.build.status === 0) results.production = await withServer(['preview', '--config', 'experiments/spatial-maplibre/vite.config.ts'], 4192, (url) => runBrowser(url, 'production'));
writeFileSync(resolve(evidenceDir, 'results.json'), JSON.stringify(results, null, 2));
const p = results.production ?? {};
const md = `# Automated MapLibre spike evidence\n\n- SHA: ${results.branchSha}\n- Node: ${results.node}\n- packages: ${JSON.stringify(results.packages)}\n- npm test: ${results.existingTests.status === 0 ? 'PASS' : 'FAIL'}\n- experiment typecheck: ${results.typecheck.status === 0 ? 'PASS' : 'FAIL'}\n- experiment build: ${results.build.status === 0 ? 'PASS' : 'FAIL'}\n- dev initialises: ${results.dev?.initialised ? 'PASS' : 'FAIL'}\n- production initialises: ${p.initialised ? 'PASS' : 'FAIL'}\n- external requests in production: ${p.externalRequests?.length ?? 'N/A'}\n- production idle frames / 1.2s: ${p.idleFrames ?? 'N/A'}\n- common sequence final destination: ${p.commonSequenceDestination ?? 'N/A'}\n- map creates before/after sequence: ${p.mapCreatesBeforeSequence ?? 'N/A'} / ${p.mapCreatesAfterSequence ?? 'N/A'}; removes: ${p.mapRemovesAfterSequence ?? 'N/A'}\n- DOM destination: ${p.domDestination ?? 'N/A'}; feature pick destination: ${p.pickDestination ?? 'N/A'}\n- interruption final destination: ${p.interruptionDestination ?? 'N/A'}\n- synthetic one-finger camera change: ${p.syntheticOneFingerChangedCamera ?? 'N/A'}\n- synthetic pinch camera change: ${p.syntheticPinchChangedCamera ?? 'N/A'}\n- x=5 pointer delivered to canvas: ${p.leftGutterDeliveredToCanvas ?? 'N/A'}\n- projection after sequence: ${JSON.stringify(p.projection ?? null)}\n- forced context loss available: ${p.forcedLoss?.available ?? 'N/A'}; restore requested: ${p.forcedRestore ?? 'N/A'}\n- lazy JS raw/gzip: ${results.bundle?.lazyJsRaw ?? 'N/A'} / ${results.bundle?.lazyJsGzip ?? 'N/A'} bytes\n- renderer CSS raw/gzip: ${results.bundle?.cssRaw ?? 'N/A'} / ${results.bundle?.cssGzip ?? 'N/A'} bytes\n\n## Build files\n\n${results.bundle?.files?.map((f) => `- ${f.name}: ${f.raw} raw / ${f.gzip} gzip (${f.kind})`).join('\n') ?? 'N/A'}\n\nSynthetic pointer evidence is browser automation, not physical-device validation.\n`;
writeFileSync(resolve(evidenceDir, 'results.md'), md);
console.log(md);
