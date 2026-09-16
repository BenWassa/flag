import { readFile, writeFile } from 'node:fs/promises';

async function replaceOnce(path, before, after) {
  const source = await readFile(path, 'utf8');
  if (!source.includes(before)) throw new Error(`${path}: expected source block not found`);
  if (source.indexOf(before) !== source.lastIndexOf(before)) throw new Error(`${path}: source block is not unique`);
  await writeFile(path, source.replace(before, after));
}

await replaceOnce(
  'scripts/map-generation-core.mjs',
  `    const pxPerUnit = INSET_MARK_SEPARATION_PX / closest;\n    const source = {\n      x: Number((x0 - INSET_SOURCE_PADDING).toFixed(2)),\n      y: Number((y0 - INSET_SOURCE_PADDING).toFixed(2)),\n      width: Number((x1 - x0 + INSET_SOURCE_PADDING * 2).toFixed(2)),\n      height: Number((y1 - y0 + INSET_SOURCE_PADDING * 2).toFixed(2)),\n    };\n    // Round the panel up, then read the scale back off the rounded size. Deriving\n`,
  `    const pxPerUnit = INSET_MARK_SEPARATION_PX / closest;\n    // The source window must contain the complete practical touch surface, not\n    // merely each country's canonical land. Otherwise an edge member can ship\n    // a nominal 44px SVG circle whose actionable area is clipped by the inset\n    // viewBox. Derive the required map-unit radius from the same true-scale\n    // panel scale, then expand only the source window; country geometry stays\n    // canonical and the practical surface remains invisible.\n    const idealHitRadius = (HIT_SURFACE_CSS_PX / 2) / pxPerUnit;\n    let sourceMinX = x0 - INSET_SOURCE_PADDING;\n    let sourceMinY = y0 - INSET_SOURCE_PADDING;\n    let sourceMaxX = x1 + INSET_SOURCE_PADDING;\n    let sourceMaxY = y1 + INSET_SOURCE_PADDING;\n    for (const mark of marks) {\n      sourceMinX = Math.min(sourceMinX, mark.cx - idealHitRadius);\n      sourceMinY = Math.min(sourceMinY, mark.cy - idealHitRadius);\n      sourceMaxX = Math.max(sourceMaxX, mark.cx + idealHitRadius);\n      sourceMaxY = Math.max(sourceMaxY, mark.cy + idealHitRadius);\n    }\n    // Round outward so serialisation can never shave the edge off a hit disc.\n    const sourceX = Math.floor(sourceMinX * 100) / 100;\n    const sourceY = Math.floor(sourceMinY * 100) / 100;\n    const sourceRight = Math.ceil(sourceMaxX * 100) / 100;\n    const sourceBottom = Math.ceil(sourceMaxY * 100) / 100;\n    const source = {\n      x: sourceX,\n      y: sourceY,\n      width: Number((sourceRight - sourceX).toFixed(2)),\n      height: Number((sourceBottom - sourceY).toFixed(2)),\n    };\n    // Round the panel up, then read the scale back off the rounded size. Deriving\n`,
);

await replaceOnce(
  'scripts/verify-map-insets.mjs',
  `for (let i = 0; i < inset.marks.length; i += 1) {\n  for (let j = i + 1; j < inset.marks.length; j += 1) {\n    const apart = Math.hypot(inset.marks[i].cx - inset.marks[j].cx, inset.marks[i].cy - inset.marks[j].cy) * pxPerUnit;\n    assert.ok(apart >= 43.99, \`${'${inset.marks[i].countryId}'} and ${'${inset.marks[j].countryId}'} are ${'${apart.toFixed(1)}'} px apart, so their touch surfaces do not overlap.\`);\n  }\n}\nassert.ok(inset.size.width <= 260 && inset.size.height <= 260, 'The panel stays small enough to be an answer surface, not the screen.');\n`,
  `for (let i = 0; i < inset.marks.length; i += 1) {\n  for (let j = i + 1; j < inset.marks.length; j += 1) {\n    const apart = Math.hypot(inset.marks[i].cx - inset.marks[j].cx, inset.marks[i].cy - inset.marks[j].cy) * pxPerUnit;\n    assert.ok(apart >= 43.99, \`${'${inset.marks[i].countryId}'} and ${'${inset.marks[j].countryId}'} are ${'${apart.toFixed(1)}'} px apart, so their touch surfaces do not overlap.\`);\n  }\n}\nfor (const mark of inset.marks) {\n  const left = (mark.cx - inset.hitRadius - inset.source.x) * pxPerUnit;\n  const right = (inset.source.x + inset.source.width - mark.cx - inset.hitRadius) * pxPerUnit;\n  const top = (mark.cy - inset.hitRadius - inset.source.y) * pxPerUnit;\n  const bottom = (inset.source.y + inset.source.height - mark.cy - inset.hitRadius) * pxPerUnit;\n  assert.ok(\n    Math.min(left, right, top, bottom) >= -0.05,\n    \`${'${mark.countryId}'} practical touch disc is fully contained by the true-scale inset source window.\`,\n  );\n}\nassert.ok(inset.size.width <= 260 && inset.size.height <= 260, 'The panel stays small enough to be an answer surface, not the screen.');\n`,
);

await replaceOnce(
  'scripts/verify-map-insets.mjs',
  `assert.ok(/\\.map-inset__context[\\s\\S]{0,80}pointer-events: none/.test(cartographyCss), 'Only the panel members answer inside the panel.');\n`,
  `assert.ok(/\\.map-inset__context[\\s\\S]{0,80}pointer-events: none/.test(cartographyCss), 'Only the panel members answer inside the panel.');\nassert.ok(/\\.map-inset__hit\\s*\\{[^}]*pointer-events:\\s*all/.test(cartographyCss), 'Inset practical surfaces are explicitly hit-testable even with transparent paint.');\n`,
);

await replaceOnce(
  'playwright.config.ts',
  `  'tests/browser/island-touch-targets.spec.ts',\n  'tests/browser/inset-hit-debug.spec.ts',\n  'tests/browser/flags-activity-viewport.spec.ts',\n`,
  `  'tests/browser/island-touch-targets.spec.ts',\n  'tests/browser/flags-activity-viewport.spec.ts',\n`,
);

console.log('Issue #231 inset hardening source edits applied.');
