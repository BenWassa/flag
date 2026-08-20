export type IconName = 'back' | 'close' | 'chevron' | 'ledger' | 'play' | 'zoom-in' | 'zoom-out';

const PATHS: Record<IconName, string> = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  close: '<path d="M7 7l10 10M17 7L7 17"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  ledger: '<path d="M5 19v-6M12 19V5M19 19V9"/>',
  play: '<path d="M8.5 6.5v11l8-5.5z" fill="currentColor" stroke="none"/>',
  'zoom-in': '<circle cx="10.5" cy="10.5" r="5.5"/><path d="M14.5 14.5L19 19M10.5 7.8v5.4M7.8 10.5h5.4"/>',
  'zoom-out': '<circle cx="10.5" cy="10.5" r="5.5"/><path d="M14.5 14.5L19 19M7.8 10.5h5.4"/>',
};

export function icon(name: IconName, className = ''): string {
  return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${PATHS[name]}</svg>`;
}

/** Two-tone product mark. Mirrors the swallowtail pennant in public/icons/app-icon.svg. */
export function brandMark(): string {
  return `
    <svg class="brand-mark" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path class="brand-mark__pole" d="M6.5 4.5v15.5" fill="none" stroke-width="1.9" stroke-linecap="round"/>
      <path class="brand-mark__cloth" d="M7.6 5.6h10.2l-2.3 3.1 2.3 3.1H7.6z"/>
      <circle class="brand-mark__finial" cx="6.5" cy="4.1" r="1.5"/>
    </svg>
  `;
}
