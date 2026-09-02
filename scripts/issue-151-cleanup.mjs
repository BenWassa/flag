import fs from 'node:fs';

const path = 'src/styles/styles.css';
let css = fs.readFileSync(path, 'utf8');

const staleMobileBlock = `  .text-icon-button {
    width: 44px;
    padding: 0; }
  .text-icon-button:active {
    transform: translateY(1px);
    background: var(--surface-subtle);
  }`;
const canonicalMobileBlock = `  .text-icon-button {
    width: 44px;
    padding: 0;
  }`;

if (!css.includes(staleMobileBlock)) {
  throw new Error('Expected the temporary duplicated mobile text-icon-button active rule.');
}
css = css.replace(staleMobileBlock, canonicalMobileBlock);
fs.writeFileSync(path, css);

const updated = fs.readFileSync(path, 'utf8');
const topLevelBase = (updated.match(/^\.text-icon-button \{/gm) ?? []).length;
const topLevelActive = (updated.match(/^\.text-icon-button:active \{/gm) ?? []).length;
if (topLevelBase !== 1 || topLevelActive !== 1) {
  throw new Error(`Unexpected authoritative text-button ownership: base=${topLevelBase}, active=${topLevelActive}`);
}
if (updated.includes(staleMobileBlock) || !updated.includes(canonicalMobileBlock)) {
  throw new Error('Expected exactly the canonical narrow-mobile width/padding override.');
}
if (!updated.includes('.text-icon-button:hover')) {
  throw new Error('Expected hover behaviour to remain.');
}
const reducedStart = updated.indexOf('@media (prefers-reduced-motion: reduce)');
if (reducedStart < 0) throw new Error('Expected reduced-motion media query.');
const reduced = updated.slice(reducedStart);
if (!reduced.includes('.text-icon-button') || !reduced.includes('.text-icon-button:active')) {
  throw new Error('Expected reduced-motion text-button selectors to remain.');
}

console.log('Removed redundant mobile text-icon-button active rule; canonical states preserved.');
