import type { LearningDomain } from '../../domain/models.js';

export type IconName =
  | 'back'
  | 'close'
  | 'chevron'
  | 'ledger'
  | 'play'
  | 'flag'
  | 'outline'
  | 'location'
  | 'adjacency'
  | 'zoom-in'
  | 'zoom-out';

const PATHS: Record<IconName, string> = {
  back: '<path d="M15 18l-6-6 6-6"/>',
  close: '<path d="M7 7l10 10M17 7L7 17"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  ledger: '<path d="M5 19v-6M12 19V5M19 19V9"/>',
  play: '<path d="M8.5 6.5v11l8-5.5z" fill="currentColor" stroke="none"/>',
  flag: '<path d="M6.5 20V4.5"/><path d="M7.5 5.5h10l-2.3 3.2 2.3 3.2h-10z" fill="currentColor" stroke="none"/>',
  outline: '<path d="M8.2 4.2l4.8.9 3.2 3.8-1 5.1-4 5.3-5-2.1-2.4-5.3 2.2-4z"/>',
  location: '<path d="M12 21s6-5.1 6-11a6 6 0 10-12 0c0 5.9 6 11 6 11z"/><circle cx="12" cy="10" r="2.1"/>',
  adjacency: '<circle cx="6" cy="12" r="2.3"/><circle cx="18" cy="7" r="2.3"/><circle cx="18" cy="17" r="2.3"/><path d="M8.2 11.1l7.5-3.1M8.2 12.9l7.5 3.1"/>',
  'zoom-in': '<circle cx="10.5" cy="10.5" r="5.5"/><path d="M14.5 14.5L19 19M10.5 7.8v5.4M7.8 10.5h5.4"/>',
  'zoom-out': '<circle cx="10.5" cy="10.5" r="5.5"/><path d="M14.5 14.5L19 19M7.8 10.5h5.4"/>',
};

export function icon(name: IconName, className = ''): string {
  return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${PATHS[name]}</svg>`;
}

/** Shared domain-identity glyph, used on Home tiles and in the launcher header. */
export function domainIcon(domain: LearningDomain): string {
  if (domain === 'flags') return icon('flag');
  if (domain === 'locations') return icon('location');
  if (domain === 'outlines') return icon('outline');
  return icon('adjacency');
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
