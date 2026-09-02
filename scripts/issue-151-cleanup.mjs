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
const mobileActive = (updated.match(/^  \.text-icon-button:active \{/gm) ?? []).length;
if (topLevelBase !== 1 || topLevelActive !== 1 || mobileActive !== 0) {
  throw new Error(`Unexpected text-button ownership: base=${topLevelBase}, active=${topLevelActive}, mobileActive=${mobileActive}`);
}
if (!updated.includes('  .text-icon-button {\n    width: 44px;\n    padding: 0;\n  }')) {
  throw new Error('Expected the narrow-mobile width/padding override to remain.');
}
if (!updated.includes('.text-icon-button:hover')) {
  throw new Error('Expected hover behaviour to remain.');
}
if (!updated.includes('.text-icon-button { transition-duration: 0.01ms; }') && !updated.includes('.text-icon-button {\n    transition-duration: 0.01ms;\n  }') && !updated.includes('.text-icon-button { transition-duration: 0.01ms;')) {
  if (!updated.includes('.text-icon-button { transition-duration') && !updated.includes('.text-icon-button {\n')) {
    // The reduced-motion rule may be grouped with sibling selectors; verify membership directly.
    const reduced = updated.slice(updated.indexOf('@media (prefers-reduced-motion: reduce)'));
    if (!reduced.includes('.text-icon-button { transition-duration: 0.01ms; }') && !reduced.includes('.text-icon-button { transition-duration')) {
      if (!reduced.includes('.text-icon-button {')) throw new Error('Expected reduced-motion text-button transition ownership.');
    }
  }
}
const reduced = updated.slice(updated.indexOf('@media (prefers-reduced-motion: reduce)'));
if (!reduced.includes('.text-icon-button') || !reduced.includes('.text-icon-button:active')) {
  throw new Error('Expected reduced-motion text-button selectors to remain.');
}

console.log('Removed redundant mobile text-icon-button active rule; canonical states preserved.');
